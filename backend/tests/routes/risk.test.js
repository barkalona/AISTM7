const request = require('supertest');
const express = require('express');
const riskRoutes = require('../../routes/risk');
const riskAnalysisService = require('../../services/riskAnalysis');
const authMiddleware = require('../../middleware/auth');

// Mock dependencies
jest.mock('../../services/riskAnalysis');
jest.mock('../../middleware/auth');

describe('Risk Routes', () => {
  let app;

  beforeEach(() => {
    // Create a new Express app for each test
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    authMiddleware.mockImplementation((req, res, next) => {
      req.user = { id: 'test-user-123' };
      next();
    });

    // Setup routes
    app.use('/api/risk', riskRoutes);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/risk/analysis', () => {
    const mockRiskAnalysis = {
      valueAtRisk: 0.15,
      sharpeRatio: 1.8,
      volatility: 0.25,
      beta: 1.2,
      riskLevel: 'moderate'
    };

    beforeEach(() => {
      riskAnalysisService.analyzePortfolioRisk.mockResolvedValue(mockRiskAnalysis);
    });

    it('should return portfolio risk analysis', async () => {
      const response = await request(app)
        .get('/api/risk/analysis')
        .query({ portfolioId: 'test-portfolio-123' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockRiskAnalysis
      });

      expect(riskAnalysisService.analyzePortfolioRisk).toHaveBeenCalledWith(
        expect.any(Object)
      );
    });

    it('should handle missing portfolio ID', async () => {
      const response = await request(app)
        .get('/api/risk/analysis');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: expect.stringContaining('portfolioId')
      });
    });

    it('should handle analysis service errors', async () => {
      riskAnalysisService.analyzePortfolioRisk.mockRejectedValue(
        new Error('Analysis failed')
      );

      const response = await request(app)
        .get('/api/risk/analysis')
        .query({ portfolioId: 'test-portfolio-123' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: expect.stringContaining('failed')
      });
    });
  });

  describe('GET /api/risk/metrics/historical', () => {
    const mockHistoricalMetrics = {
      valueAtRisk: [0.12, 0.14, 0.15],
      sharpeRatio: [1.6, 1.7, 1.8],
      dates: ['2025-01-16', '2025-01-17', '2025-01-18']
    };

    beforeEach(() => {
      riskAnalysisService.getHistoricalMetrics.mockResolvedValue(mockHistoricalMetrics);
    });

    it('should return historical risk metrics', async () => {
      const response = await request(app)
        .get('/api/risk/metrics/historical')
        .query({
          portfolioId: 'test-portfolio-123',
          startDate: '2025-01-16',
          endDate: '2025-01-18'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockHistoricalMetrics
      });

      expect(riskAnalysisService.getHistoricalMetrics).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });

    it('should validate date range', async () => {
      const response = await request(app)
        .get('/api/risk/metrics/historical')
        .query({
          portfolioId: 'test-portfolio-123',
          startDate: '2025-01-18',
          endDate: '2025-01-16' // End date before start date
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: expect.stringContaining('date range')
      });
    });
  });

  describe('POST /api/risk/alerts', () => {
    const mockAlert = {
      metric: 'valueAtRisk',
      threshold: 0.2,
      condition: 'above'
    };

    it('should create a new risk alert', async () => {
      const response = await request(app)
        .post('/api/risk/alerts')
        .send(mockAlert);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          ...mockAlert
        })
      });
    });

    it('should validate alert parameters', async () => {
      const invalidAlert = {
        metric: 'invalidMetric',
        threshold: 'notANumber',
        condition: 'invalid'
      };

      const response = await request(app)
        .post('/api/risk/alerts')
        .send(invalidAlert);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});