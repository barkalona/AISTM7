const WebSocket = require('ws');
const MetricsServer = require('../../services/metricsServer');
const os = require('os');

// Mock os module
jest.mock('os', () => ({
    cpus: jest.fn(),
    totalmem: jest.fn(),
    freemem: jest.fn(),
    networkInterfaces: jest.fn()
}));

describe('MetricsServer', () => {
    let metricsServer;
    const TEST_PORT = 3002;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Mock CPU info
        os.cpus.mockReturnValue([{
            times: {
                user: 100,
                nice: 0,
                sys: 50,
                idle: 850,
                irq: 0
            }
        }]);

        // Mock memory info
        os.totalmem.mockReturnValue(16 * 1024 * 1024 * 1024); // 16GB
        os.freemem.mockReturnValue(8 * 1024 * 1024 * 1024); // 8GB

        // Mock network interfaces
        os.networkInterfaces.mockReturnValue({
            eth0: [{
                internal: false,
                address: '192.168.1.100'
            }]
        });

        metricsServer = new MetricsServer(TEST_PORT);
    });

    afterEach(() => {
        metricsServer.stop();
    });

    it('starts the server on the specified port', (done) => {
        metricsServer.start();
        
        const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
        
        client.on('open', () => {
            expect(metricsServer.wss.address().port).toBe(TEST_PORT);
            client.close();
            done();
        });
    });

    it('handles client connections and disconnections', (done) => {
        metricsServer.start();
        
        const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
        
        client.on('open', () => {
            expect(metricsServer.clients.size).toBe(1);
            client.close();
        });

        client.on('close', () => {
            expect(metricsServer.clients.size).toBe(0);
            done();
        });
    });

    it('sends metrics to connected clients', (done) => {
        metricsServer.start();
        
        const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
        
        client.on('message', (data) => {
            const metrics = JSON.parse(data.toString());
            
            expect(metrics).toHaveProperty('timestamp');
            expect(metrics).toHaveProperty('cpu');
            expect(metrics).toHaveProperty('memory');
            expect(metrics).toHaveProperty('network');
            
            expect(typeof metrics.cpu).toBe('number');
            expect(typeof metrics.memory).toBe('number');
            expect(typeof metrics.network.rx).toBe('number');
            expect(typeof metrics.network.tx).toBe('number');
            
            client.close();
            done();
        });
    });

    it('calculates CPU usage correctly', () => {
        const lastInfo = { idle: 800, total: 1000 };
        const currentInfo = { idle: 850, total: 1100 };
        
        const usage = metricsServer.calculateCpuUsage(lastInfo, currentInfo);
        
        // (50 idle diff / 100 total diff) = 0.5
        // (1 - 0.5) * 100 = 50% CPU usage
        expect(usage).toBe(50);
    });

    it('calculates memory usage correctly', () => {
        const usage = metricsServer.getMemoryUsage();
        
        // 8GB used out of 16GB total = 50% memory usage
        expect(usage).toBe(50);
    });

    it('handles multiple clients simultaneously', (done) => {
        metricsServer.start();
        
        const client1 = new WebSocket(`ws://localhost:${TEST_PORT}`);
        const client2 = new WebSocket(`ws://localhost:${TEST_PORT}`);
        
        let connectedClients = 0;
        let receivedMessages = 0;
        
        const messageHandler = () => {
            receivedMessages++;
            if (receivedMessages === 2) {
                expect(metricsServer.clients.size).toBe(2);
                client1.close();
                client2.close();
                done();
            }
        };

        client1.on('open', () => {
            connectedClients++;
            if (connectedClients === 2) {
                expect(metricsServer.clients.size).toBe(2);
            }
        });

        client2.on('open', () => {
            connectedClients++;
            if (connectedClients === 2) {
                expect(metricsServer.clients.size).toBe(2);
            }
        });

        client1.on('message', messageHandler);
        client2.on('message', messageHandler);
    });

    it('stops metrics collection when last client disconnects', (done) => {
        metricsServer.start();
        
        const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
        
        client.on('open', () => {
            expect(metricsServer.metricsInterval).not.toBeNull();
            client.close();
        });

        client.on('close', () => {
            // Give time for the interval to be cleared
            setTimeout(() => {
                expect(metricsServer.clients.size).toBe(0);
                expect(metricsServer.metricsInterval).toBeNull();
                done();
            }, 100);
        });
    });

    it('handles server errors gracefully', (done) => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        metricsServer.start();
        
        // Simulate a server error
        metricsServer.wss.emit('error', new Error('Test error'));
        
        expect(consoleSpy).toHaveBeenCalledWith(
            'WebSocket server error:',
            expect.any(Error)
        );
        
        consoleSpy.mockRestore();
        done();
    });

    it('handles client errors gracefully', (done) => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        metricsServer.start();
        
        const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
        
        client.on('open', () => {
            // Simulate a client error
            metricsServer.clients.forEach(ws => ws.emit('error', new Error('Test error')));
            
            expect(consoleSpy).toHaveBeenCalledWith(
                'WebSocket error:',
                expect.any(Error)
            );
            
            client.close();
            consoleSpy.mockRestore();
            done();
        });
    });
});