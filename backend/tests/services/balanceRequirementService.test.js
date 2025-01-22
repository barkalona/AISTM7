const { jest } = require('@jest/globals');
const balanceRequirementService = require('../../services/balanceRequirementService');
const tokenPriceService = require('../../services/tokenPriceService');
const notificationService = require('../../services/notificationService');
const { redis } = require('../../utils/redis');
const { db } = require('../../utils/db');

// Mock dependencies
jest.mock('../../services/tokenPriceService');
jest.mock('../../services/notificationService');
jest.mock('../../utils/redis');
jest.mock('../../utils/db');

describe('BalanceRequirementService', () => {
  const mockPrice = 0.02; // $0.02 per token
  const mockTimestamp = 1674392400000;
  const mockUserId = 'user-123';

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock Date.now() for consistent timestamps
    jest.spyOn(Date, 'now').mockImplementation(() => mockTimestamp);
    
    // Mock tokenPriceService
    tokenPriceService.getCurrentPrice.mockResolvedValue(mockPrice);
    
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
    it('should initialize with default values when no history exists', async () => {
      await balanceRequirementService.initialize();
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT requirement'),
        []
      );
      expect(balanceRequirementService.currentRequirement).toBeDefined();
    });

    it('should load existing requirement from database', async () => {
      const mockRequirement = 100000;
      db.query.mockResolvedValueOnce({
        rows: [{ requirement: mockRequirement }]
      });

      await balanceRequirementService.initialize();
      
      expect(balanceRequirementService.currentRequirement).toBe(mockRequirement);
    });
  });

  describe('requirement updates', () => {
    beforeEach(async () => {
      await balanceRequirementService.initialize();
    });

    it('should calculate correct requirement based on target USD value', async () => {
      const expectedRequirement = Math.round(balanceRequirementService.targetUsdValue / mockPrice);
      const requirement = await balanceRequirementService.updateRequirement();
      
      expect(requirement).toBe(expectedRequirement);
    });

    it('should respect minimum token requirement', async () => {
      tokenPriceService.getCurrentPrice.mockResolvedValueOnce(1); // High price
      const requirement = await balanceRequirementService.updateRequirement();
      
      expect(requirement).toBe(balanceRequirementService.minTokens);
    });

    it('should respect maximum token requirement', async () => {
      tokenPriceService.getCurrentPrice.mockResolvedValueOnce(0.00001); // Very low price
      const requirement = await balanceRequirementService.updateRequirement();
      
      expect(requirement).toBe(balanceRequirementService.maxTokens);
    });

    it('should not update if change is less than 5%', async () => {
      // Set initial requirement
      const initialRequirement = 100000;
      balanceRequirementService.currentRequirement = initialRequirement;
      
      // Mock price that would cause 4% change
      const newPrice = mockPrice * 1.04;
      tokenPriceService.getCurrentPrice.mockResolvedValueOnce(newPrice);
      
      await balanceRequirementService.updateRequirement();
      
      expect(db.query).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO balance_requirement_history'),
        expect.any(Array)
      );
    });
  });

  describe('grace periods', () => {
    beforeEach(async () => {
      await balanceRequirementService.initialize();
    });

    it('should create grace period for affected users', async () => {
      const mockBalance = 90000;
      const newRequirement = 100000;
      
      db.query
        // Mock finding affected users
        .mockResolvedValueOnce({
          rows: [{
            id: mockUserId,
            email: 'user@example.com',
            balance: mockBalance
          }]
        })
        // Mock grace period creation
        .mockResolvedValueOnce({ rows: [] });

      await balanceRequirementService.notifyAffectedUsers(newRequirement);
      
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_grace_periods'),
        expect.arrayContaining([mockUserId])
      );
      
      expect(notificationService.sendAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'BALANCE_REQUIREMENT',
          userId: mockUserId
        })
      );
    });

    it('should handle grace period expiration correctly', async () => {
      const mockBalance = 90000;
      const requirement = 100000;
      
      // Mock expired grace period
      db.query
        .mockResolvedValueOnce({ rows: [{ balance: mockBalance }] }) // Get balance
        .mockResolvedValueOnce({ rows: [] }); // No active grace period

      const result = await balanceRequirementService.checkUserAccess(mockUserId);
      
      expect(result.hasAccess).toBe(false);
    });
  });

  describe('user access checks', () => {
    beforeEach(async () => {
      await balanceRequirementService.initialize();
    });

    it('should grant access when balance meets requirement', async () => {
      const mockBalance = 110000;
      balanceRequirementService.currentRequirement = 100000;
      
      db.query.mockResolvedValueOnce({
        rows: [{ balance: mockBalance }]
      });

      const result = await balanceRequirementService.checkUserAccess(mockUserId);
      
      expect(result.hasAccess).toBe(true);
    });

    it('should grant access during grace period', async () => {
      const mockBalance = 90000;
      balanceRequirementService.currentRequirement = 100000;
      
      db.query
        .mockResolvedValueOnce({ rows: [{ balance: mockBalance }] }) // Get balance
        .mockResolvedValueOnce({ // Active grace period
          rows: [{
            end_date: new Date(Date.now() + 24 * 3600000),
            required_balance: 100000
          }]
        });

      const result = await balanceRequirementService.checkUserAccess(mockUserId);
      
      expect(result.hasAccess).toBe(true);
      expect(result.gracePeriod).toBeDefined();
    });

    it('should deny access when balance is insufficient and no grace period', async () => {
      const mockBalance = 90000;
      balanceRequirementService.currentRequirement = 100000;
      
      db.query
        .mockResolvedValueOnce({ rows: [{ balance: mockBalance }] }) // Get balance
        .mockResolvedValueOnce({ rows: [] }); // No grace period

      const result = await balanceRequirementService.checkUserAccess(mockUserId);
      
      expect(result.hasAccess).toBe(false);
    });
  });

  describe('caching', () => {
    beforeEach(async () => {
      await balanceRequirementService.initialize();
    });

    it('should use cached requirement when available', async () => {
      const cachedRequirement = {
        requirement: 100000,
        timestamp: Date.now() - 1800000, // 30 minutes ago
        price: mockPrice
      };

      redis.get.mockResolvedValueOnce(JSON.stringify(cachedRequirement));

      const result = await balanceRequirementService.getCurrentRequirement();
      
      expect(result).toEqual(cachedRequirement);
      expect(tokenPriceService.getCurrentPrice).not.toHaveBeenCalled();
    });

    it('should update cache when requirement changes', async () => {
      await balanceRequirementService.applyNewRequirement(100000, mockPrice);
      
      expect(redis.set).toHaveBeenCalledWith(
        'aistm7:balance_requirement',
        expect.any(String),
        'EX',
        3600
      );
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await balanceRequirementService.initialize();
    });

    it('should handle token price service failures', async () => {
      tokenPriceService.getCurrentPrice.mockRejectedValueOnce(new Error('Price fetch failed'));

      await expect(balanceRequirementService.updateRequirement())
        .rejects.toThrow('Unable to get current token price');
    });

    it('should handle database failures gracefully', async () => {
      db.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(balanceRequirementService.getCurrentRequirement())
        .rejects.toThrow();
    });

    it('should handle redis failures gracefully', async () => {
      redis.set.mockRejectedValueOnce(new Error('Redis error'));

      // Should not throw when Redis fails
      await balanceRequirementService.applyNewRequirement(100000, mockPrice);
      
      expect(db.query).toHaveBeenCalled(); // Should still update database
    });
  });
});