const request = require('supertest');
const { jest } = require('@jest/globals');
const app = require('../../server');
const balanceRequirementService = require('../../services/balanceRequirementService');
const tokenPriceService = require('../../services/tokenPriceService');
const { db } = require('../../utils/db');
const { createTestToken } = require('../utils/auth');

// Mock services
jest.mock('../../services/balanceRequirementService');
jest.mock('../../services/tokenPriceService');
jest.mock('../../utils/db');

describe('Token Requirement Routes', () => {
  const mockRequirement = {
    requirement: 100000,
    timestamp: Date.now(),
    price: 0.02
  };

  const mockPrice = 0.02;
  const mockUserId = 'test-user-id';
  const mockAdminId = 'admin-user-id';
  const mockAddress = 'test-wallet-address';

  // Create auth tokens
  const userToken = createTestToken(mockUserId);
  const adminToken = createTestToken(mockAdminId, true);

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    balanceRequirementService.getCurrentRequirement.mockResolvedValue(mockRequirement);
    tokenPriceService.getCurrentPrice.mockResolvedValue(mockPrice);
    db.query.mockResolvedValue({ rows: [] });
  });

  describe('GET /api/token-requirement/current', () => {
    it('should return current requirement and price', async () => {
      const response = await request(app)
        .get('/api/token-requirement/current')
        .expect(200);

      expect(response.body).toEqual({
        requirement: mockRequirement.requirement,
        price: mockPrice,
        usdValue: mockPrice * mockRequirement.requirement,
        timestamp: mockRequirement.timestamp,
        lastUpdate: mockRequirement.timestamp
      });

      expect(balanceRequirementService.getCurrentRequirement).toHaveBeenCalled();
      expect(tokenPriceService.getCurrentPrice).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      balanceRequirementService.getCurrentRequirement.mockRejectedValue(new Error('Service error'));

      await request(app)
        .get('/api/token-requirement/current')
        .expect(500)
        .expect((res) => {
          expect(res.body.error).toBeDefined();
        });
    });
  });

  describe('GET /api/token-requirement/history', () => {
    const mockHistory = [
      {
        requirement: 100000,
        token_price: 0.02,
        usd_target: 20,
        timestamp: new Date(),
        reason: 'Price-based adjustment'
      }
    ];

    beforeEach(() => {
      balanceRequirementService.getRequirementHistory.mockResolvedValue(mockHistory);
    });

    it('should return requirement history with default duration', async () => {
      const response = await request(app)
        .get('/api/token-requirement/history')
        .expect(200);

      expect(response.body).toEqual({
        history: mockHistory,
        duration: '7d'
      });

      expect(balanceRequirementService.getRequirementHistory).toHaveBeenCalledWith('7d');
    });

    it('should accept custom duration parameter', async () => {
      await request(app)
        .get('/api/token-requirement/history?duration=24h')
        .expect(200);

      expect(balanceRequirementService.getRequirementHistory).toHaveBeenCalledWith('24h');
    });
  });

  describe('GET /api/token-requirement/check/:address', () => {
    beforeEach(() => {
      // Mock user lookup from address
      db.query.mockImplementation((query) => {
        if (query.includes('SELECT user_id FROM wallets')) {
          return { rows: [{ user_id: mockUserId }] };
        }
        return { rows: [] };
      });

      balanceRequirementService.checkUserAccess.mockResolvedValue({
        hasAccess: true
      });
    });

    it('should check access for valid address', async () => {
      const response = await request(app)
        .get(`/api/token-requirement/check/${mockAddress}`)
        .expect(200);

      expect(response.body).toEqual({
        address: mockAddress,
        hasAccess: true,
        timestamp: expect.any(Number)
      });

      expect(balanceRequirementService.checkUserAccess).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle unknown addresses', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // No user found

      await request(app)
        .get(`/api/token-requirement/check/${mockAddress}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('Address not found');
        });
    });
  });

  describe('GET /api/token-requirement/grace-period/:userId', () => {
    const mockGracePeriod = {
      user_id: mockUserId,
      start_date: new Date(),
      end_date: new Date(Date.now() + 72 * 3600000),
      initial_balance: 90000,
      required_balance: 100000,
      status: 'active'
    };

    beforeEach(() => {
      db.query.mockResolvedValue({ rows: [mockGracePeriod] });
    });

    it('should return active grace period for authenticated user', async () => {
      const response = await request(app)
        .get(`/api/token-requirement/grace-period/${mockUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toEqual({
        hasGracePeriod: true,
        gracePeriod: mockGracePeriod
      });
    });

    it('should prevent access to other users grace periods', async () => {
      await request(app)
        .get(`/api/token-requirement/grace-period/other-user-id`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should allow admin to access any grace period', async () => {
      await request(app)
        .get(`/api/token-requirement/grace-period/other-user-id`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('POST /api/token-requirement/update', () => {
    beforeEach(() => {
      balanceRequirementService.updateRequirement.mockResolvedValue(110000);
    });

    it('should allow admin to force update requirement', async () => {
      const response = await request(app)
        .post('/api/token-requirement/update')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        requirement: 110000,
        timestamp: expect.any(Number)
      });

      expect(balanceRequirementService.updateRequirement).toHaveBeenCalled();
    });

    it('should prevent non-admin users from updating requirement', async () => {
      await request(app)
        .post('/api/token-requirement/update')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(balanceRequirementService.updateRequirement).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/token-requirement/grace-period', () => {
    const mockCreateGracePeriodRequest = {
      userId: 'target-user-id',
      duration: 48 // 48 hours
    };

    beforeEach(() => {
      db.query.mockImplementation((query) => {
        if (query.includes('SELECT balance')) {
          return { rows: [{ balance: 90000 }] };
        }
        return { rows: [] };
      });
    });

    it('should allow admin to create grace period', async () => {
      const response = await request(app)
        .post('/api/token-requirement/grace-period')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockCreateGracePeriodRequest)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        gracePeriod: expect.objectContaining({
          userId: mockCreateGracePeriodRequest.userId,
          startDate: expect.any(String),
          endDate: expect.any(String),
          initialBalance: 90000,
          requiredBalance: mockRequirement.requirement
        })
      });
    });

    it('should validate duration limits', async () => {
      await request(app)
        .post('/api/token-requirement/grace-period')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...mockCreateGracePeriodRequest, duration: 169 }) // Over 1 week
        .expect(400);
    });

    it('should handle non-existent users', async () => {
      db.query.mockResolvedValue({ rows: [] }); // No wallet found

      await request(app)
        .post('/api/token-requirement/grace-period')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockCreateGracePeriodRequest)
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('User wallet not found');
        });
    });
  });
});