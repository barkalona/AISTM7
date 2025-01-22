const { Connection, PublicKey } = require('@solana/web3.js');
const { PythConnection, getPythProgramKeyForCluster } = require('@pythnetwork/client');
const { createLogger } = require('../utils/logging');
const { redis } = require('../utils/redis');
const { db } = require('../utils/db');

const logger = createLogger('TokenPriceService');

class TokenPriceService {
  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL);
    this.pythConnection = null;
    this.priceFeeds = new Map();
    this.fallbackPrices = new Map();
    this.lastUpdate = null;
    this.updateInterval = 60000; // 1 minute
    this.priceHistory = [];
    this.maxHistoryLength = 1440; // 24 hours of minute data
  }

  async initialize() {
    try {
      const pythProgramKey = getPythProgramKeyForCluster('mainnet-beta');
      this.pythConnection = new PythConnection(this.connection, pythProgramKey);
      await this.pythConnection.start();
      
      // Initialize price feeds
      await this.setupPriceFeeds();
      
      // Start price monitoring
      this.startMonitoring();
      
      logger.info('TokenPriceService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize TokenPriceService:', error);
      throw error;
    }
  }

  async setupPriceFeeds() {
    // AISTM7/USD price feed
    const aistm7UsdFeed = new PublicKey(process.env.PYTH_AISTM7_USD_FEED);
    this.priceFeeds.set('AISTM7/USD', aistm7UsdFeed);

    // Add fallback price sources
    this.fallbackPrices.set('AISTM7/USD', [
      this.getJupiterPrice,
      this.getSerumPrice,
      this.getRaydiumPrice
    ]);
  }

  async startMonitoring() {
    setInterval(async () => {
      try {
        await this.updatePrices();
      } catch (error) {
        logger.error('Price update failed:', error);
      }
    }, this.updateInterval);
  }

  async updatePrices() {
    const timestamp = Date.now();
    let price = null;
    let source = null;

    try {
      // Try Pyth first
      const pythPrice = await this.getPythPrice('AISTM7/USD');
      if (pythPrice) {
        price = pythPrice;
        source = 'pyth';
      } else {
        // Try fallback sources
        for (const getFallbackPrice of this.fallbackPrices.get('AISTM7/USD')) {
          price = await getFallbackPrice();
          if (price) {
            source = getFallbackPrice.name;
            break;
          }
        }
      }

      if (!price) {
        throw new Error('Unable to get price from any source');
      }

      // Update price history
      this.updatePriceHistory(price, timestamp, source);

      // Cache the current price
      await this.cachePrice(price, source);

      // Store in database
      await this.storePriceRecord(price, timestamp, source);

      // Check for significant price changes
      await this.checkPriceChanges(price);

      this.lastUpdate = timestamp;
      logger.info(`Price updated: ${price} USD (source: ${source})`);
    } catch (error) {
      logger.error('Failed to update prices:', error);
      throw error;
    }
  }

  async getPythPrice(pair) {
    try {
      const feedId = this.priceFeeds.get(pair);
      const priceData = await this.pythConnection.getLatestPriceFeeds([feedId]);
      
      if (priceData && priceData[0]) {
        const { price, confidence } = priceData[0];
        
        // Validate price confidence
        if (confidence > price * 0.01) { // 1% confidence threshold
          return price;
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Pyth price fetch failed:', error);
      return null;
    }
  }

  async getJupiterPrice() {
    // Implement Jupiter DEX price fetch
    return null;
  }

  async getSerumPrice() {
    // Implement Serum DEX price fetch
    return null;
  }

  async getRaydiumPrice() {
    // Implement Raydium DEX price fetch
    return null;
  }

  updatePriceHistory(price, timestamp, source) {
    this.priceHistory.push({ price, timestamp, source });
    if (this.priceHistory.length > this.maxHistoryLength) {
      this.priceHistory.shift();
    }
  }

  async cachePrice(price, source) {
    try {
      await redis.set('aistm7:current_price', JSON.stringify({
        price,
        source,
        timestamp: Date.now()
      }), 'EX', 300); // Cache for 5 minutes
    } catch (error) {
      logger.error('Failed to cache price:', error);
    }
  }

  async storePriceRecord(price, timestamp, source) {
    try {
      await db.query(
        'INSERT INTO token_price_history (price, timestamp, source) VALUES ($1, $2, $3)',
        [price, new Date(timestamp), source]
      );
    } catch (error) {
      logger.error('Failed to store price record:', error);
    }
  }

  async checkPriceChanges(currentPrice) {
    try {
      // Get previous price from 1 hour ago
      const hourAgoPrice = this.priceHistory
        .find(p => p.timestamp <= Date.now() - 3600000)?.price;

      if (hourAgoPrice) {
        const priceChange = (currentPrice - hourAgoPrice) / hourAgoPrice;
        
        // Alert on significant price changes (>5%)
        if (Math.abs(priceChange) >= 0.05) {
          await this.alertPriceChange(currentPrice, hourAgoPrice, priceChange);
        }
      }
    } catch (error) {
      logger.error('Failed to check price changes:', error);
    }
  }

  async alertPriceChange(currentPrice, previousPrice, changePercent) {
    const alert = {
      type: 'PRICE_CHANGE',
      severity: Math.abs(changePercent) >= 0.1 ? 'HIGH' : 'MEDIUM',
      message: `AISTM7 price changed by ${(changePercent * 100).toFixed(2)}% in the last hour`,
      data: {
        currentPrice,
        previousPrice,
        changePercent,
        timestamp: Date.now()
      }
    };

    // Emit alert through notification service
    await require('./notificationService').sendAlert(alert);
  }

  // Public methods for external use
  async getCurrentPrice() {
    try {
      // Try cache first
      const cached = await redis.get('aistm7:current_price');
      if (cached) {
        const { price, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 300000) { // Cache valid for 5 minutes
          return price;
        }
      }

      // If cache miss or expired, get fresh price
      await this.updatePrices();
      return this.priceHistory[this.priceHistory.length - 1].price;
    } catch (error) {
      logger.error('Failed to get current price:', error);
      throw error;
    }
  }

  async getPriceHistory(duration = '24h') {
    try {
      const endTime = Date.now();
      let startTime;

      switch (duration) {
        case '1h':
          startTime = endTime - 3600000;
          break;
        case '24h':
          startTime = endTime - 86400000;
          break;
        case '7d':
          startTime = endTime - 604800000;
          break;
        default:
          throw new Error('Invalid duration');
      }

      const result = await db.query(
        'SELECT price, timestamp, source FROM token_price_history WHERE timestamp >= $1 ORDER BY timestamp ASC',
        [new Date(startTime)]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get price history:', error);
      throw error;
    }
  }

  async getAveragePrice(duration = '1h') {
    try {
      const prices = await this.getPriceHistory(duration);
      if (prices.length === 0) return null;

      const sum = prices.reduce((acc, record) => acc + record.price, 0);
      return sum / prices.length;
    } catch (error) {
      logger.error('Failed to get average price:', error);
      throw error;
    }
  }
}

module.exports = new TokenPriceService();