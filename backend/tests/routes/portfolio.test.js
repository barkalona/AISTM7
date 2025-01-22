const request = require('supertest');
const express = require('express');
const portfolioRoutes = require('../../routes/portfolio');
const ibkrService = require('../../services/ibkrService');
const solanaService = require('../../services/solanaService');
const authMiddleware = require('../../middleware/auth');

// Mock dependencies
jest.mock('../../services/ibkrService');
jest.mock('../../services/solanaService');
jest.mock('../../middleware/auth');

describe('Portfolio Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    authMiddleware.mockImplementation((req, res, next) => {
      req.user = { id: 'test-user-123' };
      next();
    });

    // Setup routes
    app.use('/api/portfolio', portfolioRoutes);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/portfolio/positions', () => {
    const mockPositions = [
      { symbol: 'AAPL', quantity: 100, currentPrice: 150 },
      { symbol: 'GOOGL', quantity: 50, currentPrice: 2800 }
    ];

    beforeEach(() => {
      ibkrService.getPositions.mockResolvedValue(mockPositions);
    });

    it('should return portfolio positions', async () => {
      const response = await request(app)
        .get('/api/portfolio/positions')
        .query({ accountId: 'test-account-123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockPositions
      });

      expect(ibkrService.getPositions).toHaveBeenCalledWith('test-account-123');
    });

    it('should handle IBKR service errors', async () => {
      ibkrService.getPositions.mockRejectedValue(new Error('IBKR API error'));

      const response = await request(app)
        .get('/api/portfolio/positions')
        .query({ accountId: 'test-account-123' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: expect.stringContaining('IBKR API error')
      });
    });
  });

  describe('GET /api/portfolio/summary', () => {
    const mockSummary = {
      totalValue: 290000,
      dailyChange: '+2.5%',
      positions: 2,
      topHoldings: [
        { symbol: 'GOOGL', percentage: 48.3 },
        { symbol: 'AAPL', percentage: 51.7 }
      ]
    };

    beforeEach(() => {
      ibkrService.getPortfolioSummary.mockResolvedValue(mockSummary);
    });

    it('should return portfolio summary', async () => {
      const response = await request(app)
        .get('/api/portfolio/summary')
        .query({ accountId: 'test-account-123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockSummary
      });
    });

    it('should include token balance when available', async () => {
      solanaService.verifyTokenBalance.mockResolvedValue({
        isValid: true,
        balance: 700000
      });

      const response = await request(app)
        .get('/api/portfolio/summary')
        .query({
          accountId: 'test-account-123',
          walletAddress: 'test-wallet-address'
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('tokenBalance');
      expect(response.body.data.tokenBalance).toBe(700000);
    });
  });

  describe('GET /api/portfolio/history', () => {
    const mockHistory = {
      dates: ['2025-01-16', '2025-01-17', '2025-01-18'],
      values: [285000, 287500, 290000],
      changes: ['+1.2%', '+0.9%', '+0.4%']
    };

    beforeEach(() => {
      ibkrService.getPortfolioHistory.mockResolvedValue(mockHistory);
    });

    it('should return portfolio history', async () => {
      const response = await request(app)
        .get('/api/portfolio/history')
        .query({
          accountId: 'test-account-123',
          period: '1w'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockHistory
      });
    });

    it('should validate period parameter', async () => {
      const response = await request(app)
        .get('/api/portfolio/history')
        .query({
          accountId: 'test-account-123',
          period: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/portfolio/sync', () => {
    const mockSyncResult = {
      synchronized: true,
      updatedPositions: 2,
      timestamp: expect.any(String)
    };

    beforeEach(() => {
      ibkrService.synchronizePortfolio.mockResolvedValue(mockSyncResult);
    });

    it('should synchronize portfolio data', async () => {
      const response = await request(app)
        .post('/api/portfolio/sync')
        .send({ accountId: 'test-account-123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockSyncResult
      });
    });

    it('should handle synchronization errors', async () => {
      ibkrService.synchronizePortfolio.mockRejectedValue(
        new Error('Sync failed')
      );

      const response = await request(app)
        .post('/api/portfolio/sync')
        .send({ accountId: 'test-account-123' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});