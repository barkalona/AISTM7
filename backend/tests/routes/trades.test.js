const request = require('supertest');
const express = require('express');
const tradeRoutes = require('../../routes/trades');
const tradeService = require('../../services/tradeService');
const auth = require('../../middleware/auth');

// Mock dependencies
jest.mock('../../services/tradeService');
jest.mock('../../middleware/auth');

describe('Trade Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    auth.mockImplementation((req, res, next) => {
      req.user = { id: 'test-user-123' };
      next();
    });

    // Setup routes
    app.use('/api/trades', tradeRoutes);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/trades/recommendations', () => {
    const mockRecommendations = {
      currentPositions: [
        { symbol: 'AAPL', quantity: 100, currentPrice: 150 },
        { symbol: 'GOOGL', quantity: 50, currentPrice: 2800 }
      ],
      recommendations: [
        {
          symbol: 'AAPL',
          suggestedAction: 'BUY',
          quantityChange: 20,
          reason: 'Underweight'
        },
        {
          symbol: 'GOOGL',
          suggestedAction: 'SELL',
          quantityChange: 10,
          reason: 'Overweight'
        }
      ],
      analysis: {
        riskLevel: 'moderate',
        metrics: {
          sharpeRatio: 1.5,
          volatility: 0.2
        }
      }
    };

    beforeEach(() => {
      tradeService.generateTradeRecommendations.mockResolvedValue(mockRecommendations);
    });

    it('should return trade recommendations', async () => {
      const response = await request(app)
        .get('/api/trades/recommendations')
        .query({ accountId: 'test-account-123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockRecommendations
      });

      expect(tradeService.generateTradeRecommendations).toHaveBeenCalledWith(
        'test-account-123'
      );
    });

    it('should require account ID', async () => {
      const response = await request(app)
        .get('/api/trades/recommendations');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: expect.stringContaining('Account ID')
      });
    });

    it('should handle service errors', async () => {
      tradeService.generateTradeRecommendations.mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .get('/api/trades/recommendations')
        .query({ accountId: 'test-account-123' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/trades/rebalance/analysis', () => {
    const mockAnalysis = {
      currentAllocation: {
        'AAPL': 0.5,
        'GOOGL': 0.5
      },
      targetAllocation: {
        'AAPL': 0.6,
        'GOOGL': 0.4
      },
      deviations: {
        'AAPL': {
          current: 0.5,
          target: 0.6,
          deviation: -0.1,
          percentageDeviation: -16.67
        },
        'GOOGL': {
          current: 0.5,
          target: 0.4,
          deviation: 0.1,
          percentageDeviation: 25
        }
      }
    };

    beforeEach(() => {
      tradeService.getPortfolioRebalanceAnalysis.mockResolvedValue(mockAnalysis);
    });

    it('should return rebalance analysis', async () => {
      const response = await request(app)
        .get('/api/trades/rebalance/analysis')
        .query({ accountId: 'test-account-123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockAnalysis
      });

      expect(tradeService.getPortfolioRebalanceAnalysis).toHaveBeenCalledWith(
        'test-account-123'
      );
    });

    it('should require account ID', async () => {
      const response = await request(app)
        .get('/api/trades/rebalance/analysis');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: expect.stringContaining('Account ID')
      });
    });

    it('should handle service errors', async () => {
      tradeService.getPortfolioRebalanceAnalysis.mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .get('/api/trades/rebalance/analysis')
        .query({ accountId: 'test-account-123' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});