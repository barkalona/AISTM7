const EventEmitter = require('events');
const { validateMarketDataUpdate } = require('../utils/validation');
const logger = require('../utils/logger');
const websocketManager = require('./websocketManager');

class MarketDataManager extends EventEmitter {
    constructor() {
        super();
        this.marketData = new Map(); // Symbol -> Latest market data
        this.subscriptions = new Map(); // Symbol -> Number of subscribers
        this.updateIntervals = new Map(); // Symbol -> Update interval
        this.priceHistory = new Map(); // Symbol -> Array of historical prices
        this.historyLimit = 1000; // Maximum number of historical prices to keep
        
        // Initialize WebSocket event handlers
        this.initializeWebSocketHandlers();
    }

    initializeWebSocketHandlers() {
        websocketManager.on('marketDataRequest', this.handleMarketDataRequest.bind(this));
    }

    async handleMarketDataRequest({ clientId, symbol, interval, action }) {
        try {
            switch (action) {
                case 'subscribe':
                    await this.subscribeToMarketData(symbol, interval);
                    break;
                case 'unsubscribe':
                    this.unsubscribeFromMarketData(symbol);
                    break;
                case 'history':
                    const history = this.getMarketHistory(symbol);
                    websocketManager.sendToClient(clientId, {
                        type: 'marketHistory',
                        symbol,
                        data: history
                    });
                    break;
                default:
                    logger.warn(`Unknown market data action: ${action}`);
            }
        } catch (error) {
            logger.error('Error handling market data request:', error);
            websocketManager.sendToClient(clientId, {
                type: 'error',
                message: 'Failed to process market data request'
            });
        }
    }

    async subscribeToMarketData(symbol, interval) {
        try {
            // Update subscription count
            const currentSubs = this.subscriptions.get(symbol) || 0;
            this.subscriptions.set(symbol, currentSubs + 1);

            // If this is the first subscriber, start data updates
            if (currentSubs === 0) {
                await this.startMarketDataUpdates(symbol, interval);
            }

            // Broadcast current data immediately if available
            const currentData = this.marketData.get(symbol);
            if (currentData) {
                this.broadcastMarketData(symbol, currentData);
            }
        } catch (error) {
            logger.error(`Error subscribing to market data for ${symbol}:`, error);
            throw error;
        }
    }

    unsubscribeFromMarketData(symbol) {
        const currentSubs = this.subscriptions.get(symbol) || 0;
        if (currentSubs > 0) {
            this.subscriptions.set(symbol, currentSubs - 1);

            // If no more subscribers, stop updates
            if (currentSubs - 1 === 0) {
                this.stopMarketDataUpdates(symbol);
            }
        }
    }

    async startMarketDataUpdates(symbol, interval) {
        try {
            // Clear any existing interval
            this.stopMarketDataUpdates(symbol);

            // Set new update interval
            const updateInterval = setInterval(async () => {
                try {
                    const data = await this.fetchMarketData(symbol);
                    if (data) {
                        this.updateMarketData(symbol, data);
                    }
                } catch (error) {
                    logger.error(`Error fetching market data for ${symbol}:`, error);
                }
            }, interval);

            this.updateIntervals.set(symbol, updateInterval);

            // Fetch initial data
            const initialData = await this.fetchMarketData(symbol);
            if (initialData) {
                this.updateMarketData(symbol, initialData);
            }
        } catch (error) {
            logger.error(`Error starting market data updates for ${symbol}:`, error);
            throw error;
        }
    }

    stopMarketDataUpdates(symbol) {
        const interval = this.updateIntervals.get(symbol);
        if (interval) {
            clearInterval(interval);
            this.updateIntervals.delete(symbol);
        }
    }

    async fetchMarketData(symbol) {
        try {
            // TODO: Replace with actual market data API call
            // This is a placeholder that generates mock data
            const mockData = {
                symbol,
                price: this.generateMockPrice(symbol),
                volume: Math.floor(Math.random() * 10000),
                high: 0,
                low: 0,
                change: 0,
                changePercent: 0,
                timestamp: new Date().toISOString()
            };

            // Calculate high, low, change based on history
            const history = this.priceHistory.get(symbol) || [];
            if (history.length > 0) {
                const lastPrice = history[history.length - 1].price;
                mockData.change = mockData.price - lastPrice;
                mockData.changePercent = (mockData.change / lastPrice) * 100;
                mockData.high = Math.max(mockData.price, ...history.map(h => h.price));
                mockData.low = Math.min(mockData.price, ...history.map(h => h.price));
            }

            return mockData;
        } catch (error) {
            logger.error(`Error fetching market data for ${symbol}:`, error);
            throw error;
        }
    }

    generateMockPrice(symbol) {
        const lastPrice = this.marketData.get(symbol)?.price || 100;
        const change = (Math.random() - 0.5) * 2; // Random price movement
        return Math.max(0.01, lastPrice * (1 + change / 100));
    }

    updateMarketData(symbol, data) {
        if (!validateMarketDataUpdate(data)) {
            logger.error(`Invalid market data update for ${symbol}`);
            return;
        }

        // Update current market data
        this.marketData.set(symbol, data);

        // Update price history
        let history = this.priceHistory.get(symbol) || [];
        history.push(data);
        if (history.length > this.historyLimit) {
            history = history.slice(-this.historyLimit);
        }
        this.priceHistory.set(symbol, history);

        // Broadcast update
        this.broadcastMarketData(symbol, data);

        // Emit event for other services
        this.emit('marketDataUpdate', { symbol, data });
    }

    broadcastMarketData(symbol, data) {
        websocketManager.broadcast(`market:${symbol}`, data);
    }

    getMarketHistory(symbol, limit = 100) {
        const history = this.priceHistory.get(symbol) || [];
        return history.slice(-Math.min(limit, history.length));
    }

    getCurrentPrice(symbol) {
        return this.marketData.get(symbol)?.price;
    }

    getActiveSymbols() {
        return Array.from(this.subscriptions.keys());
    }

    shutdown() {
        // Clear all update intervals
        this.updateIntervals.forEach((interval, symbol) => {
            this.stopMarketDataUpdates(symbol);
        });

        // Clear data
        this.marketData.clear();
        this.subscriptions.clear();
        this.priceHistory.clear();
    }
}

// Export singleton instance
const marketDataManager = new MarketDataManager();
module.exports = marketDataManager;