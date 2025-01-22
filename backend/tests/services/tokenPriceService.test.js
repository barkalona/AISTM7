const { jest } = require('@jest/globals');
const { Connection } = require('@solana/web3.js');
const { PythConnection } = require('@pythnetwork/client');
const tokenPriceService = require('../../services/tokenPriceService');
const { redis } = require('../../utils/redis');
const { db } = require('../../utils/db');

// Mock external dependencies
jest.mock('@solana/web3.js');
jest.mock('@pythnetwork/client');
jest.mock('../../utils/redis');
jest.mock('../../utils/db');

describe('TokenPriceService', () => {
  const mockPrice = 1.23;
  const mockTimestamp = 1674392400000; // Fixed timestamp for testing

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock Date.now() for consistent timestamps
    jest.spyOn(Date, 'now').mockImplementation(() => mockTimestamp);
    
    // Mock Solana Connection
    Connection.mockImplementation(() => ({
      // Add any required connection methods
    }));
    
    // Mock Pyth Connection
    PythConnection.mockImplementation(() => ({
      start: jest.fn(),
      getLatestPriceFeeds: jest.fn().mockResolvedValue([{
        price: mockPrice,
        confidence: 0.02
      }])
    }));
    
    // Mock Redis
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue('OK');
    
    // Mock Database
    db.query.mockResolvedValue({ rows: [] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await tokenPriceService.initialize();
      
      expect(PythConnection).toHaveBeenCalled();
      expect(tokenPriceService.pythConnection.start).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      PythConnection.mockImplementation(() => ({
        start: jest.fn().mockRejectedValue(new Error('Connection failed'))
      }));

      await expect(tokenPriceService.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('price updates', () => {
    beforeEach(async () => {
      await tokenPriceService.initialize();
    });

    it('should update prices successfully from Pyth', async () => {
      await tokenPriceService.updatePrices();
      
      expect(tokenPriceService.pythConnection.getLatestPriceFeeds).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalledWith(
        'aistm7:current_price',
        expect.any(String),
        'EX',
        300
      );
      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        [mockPrice, expect.any(Date), 'pyth']
      );
    });

    it('should fall back to alternative sources when Pyth fails', async () => {
      // Mock Pyth failure
      tokenPriceService.pythConnection.getLatestPriceFeeds.mockRejectedValue(new Error());
      
      // Mock a fallback price source
      const fallbackPrice = 1.25;
      tokenPriceService.getJupiterPrice = jest.fn().mockResolvedValue(fallbackPrice);
      
      await tokenPriceService.updatePrices();
      
      expect(tokenPriceService.getJupiterPrice).toHaveBeenCalled();
      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        [fallbackPrice, expect.any(Date), 'getJupiterPrice']
      );
    });

    it('should handle all price sources failing', async () => {
      // Mock all price sources failing
      tokenPriceService.pythConnection.getLatestPriceFeeds.mockRejectedValue(new Error());
      tokenPriceService.getJupiterPrice = jest.fn().mockResolvedValue(null);
      tokenPriceService.getSerumPrice = jest.fn().mockResolvedValue(null);
      tokenPriceService.getRaydiumPrice = jest.fn().mockResolvedValue(null);

      await expect(tokenPriceService.updatePrices()).rejects.toThrow('Unable to get price from any source');
    });
  });

  describe('price history', () => {
    beforeEach(async () => {
      await tokenPriceService.initialize();
    });

    it('should maintain correct price history length', async () => {
      // Add more prices than maxHistoryLength
      for (let i = 0; i < tokenPriceService.maxHistoryLength + 10; i++) {
        tokenPriceService.updatePriceHistory(mockPrice + i, mockTimestamp + i * 60000, 'test');
      }

      expect(tokenPriceService.priceHistory.length).toBe(tokenPriceService.maxHistoryLength);
      expect(tokenPriceService.priceHistory[0].price).toBe(mockPrice + 10); // Oldest remaining price
    });

    it('should retrieve price history for different durations', async () => {
      const mockHistoryData = [
        { price: 1.0, timestamp: new Date(mockTimestamp - 3600000) },
        { price: 1.1, timestamp: new Date(mockTimestamp - 1800000) },
        { price: 1.2, timestamp: new Date(mockTimestamp) }
      ];

      db.query.mockResolvedValue({ rows: mockHistoryData });

      const history = await tokenPriceService.getPriceHistory('1h');
      expect(history).toEqual(mockHistoryData);
      expect(db.query).toHaveBeenCalledWith(
        expect.any(String),
        [expect.any(Date)]
      );
    });
  });

  describe('price change detection', () => {
    beforeEach(async () => {
      await tokenPriceService.initialize();
    });

    it('should detect significant price changes', async () => {
      // Mock price history with significant change
      tokenPriceService.priceHistory = [
        { price: 1.0, timestamp: mockTimestamp - 3600000 }, // 1 hour ago
        { price: 1.5, timestamp: mockTimestamp } // Current (50% increase)
      ];

      const notificationService = require('../../services/notificationService');
      notificationService.sendAlert = jest.fn();

      await tokenPriceService.checkPriceChanges(1.5);

      expect(notificationService.sendAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PRICE_CHANGE',
          severity: 'HIGH'
        })
      );
    });

    it('should not alert on minor price changes', async () => {
      // Mock price history with minor change
      tokenPriceService.priceHistory = [
        { price: 1.0, timestamp: mockTimestamp - 3600000 }, // 1 hour ago
        { price: 1.02, timestamp: mockTimestamp } // Current (2% increase)
      ];

      const notificationService = require('../../services/notificationService');
      notificationService.sendAlert = jest.fn();

      await tokenPriceService.checkPriceChanges(1.02);

      expect(notificationService.sendAlert).not.toHaveBeenCalled();
    });
  });

  describe('caching', () => {
    beforeEach(async () => {
      await tokenPriceService.initialize();
    });

    it('should return cached price when valid', async () => {
      const cachedPrice = {
        price: mockPrice,
        timestamp: mockTimestamp - 60000, // 1 minute ago
        source: 'pyth'
      };

      redis.get.mockResolvedValue(JSON.stringify(cachedPrice));

      const price = await tokenPriceService.getCurrentPrice();
      expect(price).toBe(mockPrice);
      expect(tokenPriceService.pythConnection.getLatestPriceFeeds).not.toHaveBeenCalled();
    });

    it('should fetch new price when cache is expired', async () => {
      const cachedPrice = {
        price: mockPrice,
        timestamp: mockTimestamp - 600000, // 10 minutes ago
        source: 'pyth'
      };

      redis.get.mockResolvedValue(JSON.stringify(cachedPrice));

      const price = await tokenPriceService.getCurrentPrice();
      expect(tokenPriceService.pythConnection.getLatestPriceFeeds).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await tokenPriceService.initialize();
    });

    it('should handle redis errors gracefully', async () => {
      redis.set.mockRejectedValue(new Error('Redis connection failed'));

      await tokenPriceService.updatePrices();
      // Should continue despite Redis error
      expect(db.query).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      db.query.mockRejectedValue(new Error('Database error'));

      await tokenPriceService.updatePrices();
      // Should continue despite database error
      expect(redis.set).toHaveBeenCalled();
    });
  });
});