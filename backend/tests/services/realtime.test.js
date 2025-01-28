const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const { expect } = require('chai');
const websocketManager = require('../../services/websocketManager');
const marketDataManager = require('../../services/marketDataManager');

describe('Real-time Data Integration Tests', () => {
    let server;
    let baseURL;
    let client1;
    let client2;

    before((done) => {
        const app = express();
        server = http.createServer(app);
        websocketManager.initialize(server);

        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            baseURL = `ws://127.0.0.1:${port}`;
            done();
        });
    });

    after((done) => {
        marketDataManager.shutdown();
        websocketManager.shutdown();
        server.close(done);
    });

    beforeEach((done) => {
        client1 = new WebSocket(baseURL);
        client2 = new WebSocket(baseURL);

        let connected = 0;
        const onConnect = () => {
            connected++;
            if (connected === 2) done();
        };

        client1.on('open', onConnect);
        client2.on('open', onConnect);
    });

    afterEach(() => {
        client1.close();
        client2.close();
    });

    describe('WebSocket Connection', () => {
        it('should successfully connect and receive welcome message', (done) => {
            client1.once('message', (data) => {
                const message = JSON.parse(data);
                expect(message.type).to.equal('connection');
                expect(message.status).to.equal('connected');
                expect(message.clientId).to.be.a('string');
                done();
            });
        });

        it('should handle ping/pong messages', (done) => {
            client1.send(JSON.stringify({ type: 'ping' }));
            client1.once('message', (data) => {
                const message = JSON.parse(data);
                expect(message.type).to.equal('pong');
                done();
            });
        });
    });

    describe('Market Data Subscription', () => {
        it('should handle market data subscription', (done) => {
            const symbol = 'BTC-USD';
            let messageCount = 0;

            client1.on('message', (data) => {
                const message = JSON.parse(data);
                messageCount++;

                if (messageCount === 1) {
                    // First message should be connection confirmation
                    expect(message.type).to.equal('connection');
                } else if (messageCount === 2) {
                    // Second message should be subscription confirmation
                    expect(message.type).to.equal('subscribed');
                    expect(message.topics).to.include(`market:${symbol}`);
                } else {
                    // Subsequent messages should be market data updates
                    expect(message.type).to.equal('update');
                    expect(message.data.symbol).to.equal(symbol);
                    expect(message.data.price).to.be.a('number');
                    done();
                }
            });

            // Subscribe to market data
            client1.send(JSON.stringify({
                type: 'marketData',
                data: {
                    symbol,
                    interval: 1000,
                    action: 'subscribe'
                }
            }));
        });

        it('should broadcast market data to multiple subscribers', (done) => {
            const symbol = 'ETH-USD';
            let client1Received = false;
            let client2Received = false;

            function checkDone() {
                if (client1Received && client2Received) {
                    done();
                }
            }

            client1.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'update') {
                    expect(message.data.symbol).to.equal(symbol);
                    client1Received = true;
                    checkDone();
                }
            });

            client2.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'update') {
                    expect(message.data.symbol).to.equal(symbol);
                    client2Received = true;
                    checkDone();
                }
            });

            // Subscribe both clients
            const subscribeMessage = JSON.stringify({
                type: 'marketData',
                data: {
                    symbol,
                    interval: 1000,
                    action: 'subscribe'
                }
            });

            client1.send(subscribeMessage);
            client2.send(subscribeMessage);
        });

        it('should handle unsubscribe requests', (done) => {
            const symbol = 'SOL-USD';
            let messageCount = 0;

            client1.on('message', (data) => {
                const message = JSON.parse(data);
                messageCount++;

                if (message.type === 'unsubscribed') {
                    expect(message.topics).to.include(`market:${symbol}`);
                    
                    // Wait a bit to ensure no more updates are received
                    setTimeout(() => {
                        expect(messageCount).to.equal(3); // connection + subscribed + unsubscribed
                        done();
                    }, 1500);
                }
            });

            // Subscribe then unsubscribe
            client1.send(JSON.stringify({
                type: 'marketData',
                data: {
                    symbol,
                    interval: 1000,
                    action: 'subscribe'
                }
            }));

            setTimeout(() => {
                client1.send(JSON.stringify({
                    type: 'marketData',
                    data: {
                        symbol,
                        action: 'unsubscribe'
                    }
                }));
            }, 1000);
        });
    });

    describe('Market Data Manager', () => {
        it('should maintain price history', (done) => {
            const symbol = 'BTC-USD';
            let updateCount = 0;

            client1.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'update') {
                    updateCount++;
                    
                    if (updateCount === 3) {
                        const history = marketDataManager.getMarketHistory(symbol);
                        expect(history).to.be.an('array');
                        expect(history.length).to.be.at.least(3);
                        expect(history[0].price).to.be.a('number');
                        done();
                    }
                }
            });

            client1.send(JSON.stringify({
                type: 'marketData',
                data: {
                    symbol,
                    interval: 500, // Faster updates for testing
                    action: 'subscribe'
                }
            }));
        });

        it('should handle market history requests', (done) => {
            const symbol = 'ETH-USD';

            client1.on('message', (data) => {
                const message = JSON.parse(data);
                if (message.type === 'marketHistory') {
                    expect(message.symbol).to.equal(symbol);
                    expect(message.data).to.be.an('array');
                    done();
                }
            });

            // Subscribe and wait for some history to accumulate
            client1.send(JSON.stringify({
                type: 'marketData',
                data: {
                    symbol,
                    interval: 500,
                    action: 'subscribe'
                }
            }));

            setTimeout(() => {
                client1.send(JSON.stringify({
                    type: 'marketData',
                    data: {
                        symbol,
                        action: 'history'
                    }
                }));
            }, 2000);
        });
    });
});