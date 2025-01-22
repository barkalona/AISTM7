const aiService = require('../../services/aiService');
const riskAnalysisService = require('../../services/riskAnalysis');
const portfolioOptimization = require('../../services/portfolioOptimization');

// Mock dependencies
jest.mock('../../services/riskAnalysis');
jest.mock('../../services/portfolioOptimization');

describe('AI Service', () => {
  const mockPortfolioData = {
    positions: [
      { symbol: 'AAPL', quantity: 100, currentPrice: 150 },
      { symbol: 'GOOGL', quantity: 50, currentPrice: 2800 }
    ],
    historicalPrices: {
      'AAPL': [145, 148, 152, 149, 150],
      'GOOGL': [2750, 2780, 2820, 2790, 2800]
    },
    riskMetrics: {
      valueAtRisk: 0.15,
      sharpeRatio: 1.8,
      volatility: 0.25,
      beta: 1.2
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    riskAnalysisService.analyzePortfolioRisk.mockResolvedValue({
      valueAtRisk: 0.15,
      sharpeRatio: 1.8,
      volatility: 0.25,
      beta: 1.2,
      riskLevel: 'moderate'
    });

    portfolioOptimization.optimizePortfolio.mockResolvedValue({
      targetAllocations: {
        'AAPL': 0.6,
        'GOOGL': 0.4
      },
      expectedReturn: 0.12,
      expectedRisk: 0.20
    });
  });

  describe('generateRecommendations', () => {
    it('should generate portfolio recommendations based on risk analysis', async () => {
      const result = await aiService.generateRecommendations(mockPortfolioData);

      expect(result).toEqual({
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(/rebalance|risk_reduction|opportunity/),
            title: expect.any(String),
            description: expect.any(String),
            expectedImpact: expect.any(String)
          })
        ]),
        analysis: expect.objectContaining({
          riskLevel: expect.any(String),
          keyFindings: expect.any(Array)
        })
      });

      expect(riskAnalysisService.analyzePortfolioRisk).toHaveBeenCalledWith(mockPortfolioData);
      expect(portfolioOptimization.optimizePortfolio).toHaveBeenCalled();
    });

    it('should handle high-risk portfolios', async () => {
      riskAnalysisService.analyzePortfolioRisk.mockResolvedValueOnce({
        valueAtRisk: 0.3,
        sharpeRatio: 1.2,
        volatility: 0.4,
        beta: 1.8,
        riskLevel: 'high'
      });

      const result = await aiService.generateRecommendations(mockPortfolioData);

      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'risk_reduction'
          })
        ])
      );
    });

    it('should identify rebalancing opportunities', async () => {
      portfolioOptimization.optimizePortfolio.mockResolvedValueOnce({
        targetAllocations: {
          'AAPL': 0.7,
          'GOOGL': 0.3
        },
        expectedReturn: 0.15,
        expectedRisk: 0.22
      });

      const result = await aiService.generateRecommendations(mockPortfolioData);

      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'rebalance'
          })
        ])
      );
    });

    it('should handle empty portfolio data', async () => {
      const emptyPortfolio = {
        positions: [],
        historicalPrices: {}
      };

      const result = await aiService.generateRecommendations(emptyPortfolio);

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0]).toEqual(
        expect.objectContaining({
          type: 'opportunity',
          title: expect.stringContaining('diversification')
        })
      );
    });
  });

  describe('analyzeMarketConditions', () => {
    const mockMarketData = {
      marketTrends: ['bullish', 'volatile'],
      sectorPerformance: {
        'Technology': '+2.5%',
        'Healthcare': '-1.2%'
      },
      economicIndicators: {
        'GDP Growth': '2.1%',
        'Inflation': '3.2%'
      }
    };

    it('should analyze market conditions and provide insights', async () => {
      const result = await aiService.analyzeMarketConditions(mockMarketData);

      expect(result).toEqual({
        marketSentiment: expect.any(String),
        opportunities: expect.any(Array),
        risks: expect.any(Array),
        sectorOutlook: expect.any(Object)
      });
    });

    it('should identify sector-specific opportunities', async () => {
      const result = await aiService.analyzeMarketConditions({
        ...mockMarketData,
        sectorPerformance: {
          'Technology': '+5.0%',
          'Healthcare': '+4.2%'
        }
      });

      expect(result.opportunities).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Technology'),
          expect.stringContaining('Healthcare')
        ])
      );
    });
  });

  describe('optimizePortfolioAllocation', () => {
    it('should generate optimal portfolio allocation', async () => {
      const result = await aiService.optimizePortfolioAllocation(mockPortfolioData);

      expect(result).toEqual({
        success: true,
        allocation: expect.any(Object),
        expectedMetrics: expect.objectContaining({
          return: expect.any(Number),
          risk: expect.any(Number),
          sharpeRatio: expect.any(Number)
        }),
        rebalancingRequired: expect.any(Boolean)
      });
    });

    it('should respect risk tolerance constraints', async () => {
      const riskAversePortfolio = {
        ...mockPortfolioData,
        riskTolerance: 'low'
      };

      const result = await aiService.optimizePortfolioAllocation(riskAversePortfolio);

      expect(result.expectedMetrics.risk).toBeLessThan(0.2);
      expect(result.allocation).toEqual(
        expect.objectContaining({
          bonds: expect.any(Number),
          lowVolatilityStocks: expect.any(Number)
        })
      );
    });
  });
});