const riskAnalysisService = require('../../services/riskAnalysis');
const riskCalculations = require('../../services/riskCalculations');

// Mock the risk calculations module
jest.mock('../../services/riskCalculations');

describe('Risk Analysis Service', () => {
  const mockPortfolioData = {
    positions: [
      { symbol: 'AAPL', quantity: 100, currentPrice: 150 },
      { symbol: 'GOOGL', quantity: 50, currentPrice: 2800 }
    ],
    historicalPrices: {
      'AAPL': [145, 148, 152, 149, 150],
      'GOOGL': [2750, 2780, 2820, 2790, 2800]
    }
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    riskCalculations.calculateValueAtRisk.mockReturnValue(0.15);
    riskCalculations.calculateSharpeRatio.mockReturnValue(1.8);
    riskCalculations.calculateVolatility.mockReturnValue(0.25);
    riskCalculations.calculateBeta.mockReturnValue(1.2);
  });

  describe('analyzePortfolioRisk', () => {
    it('should calculate all risk metrics for a portfolio', async () => {
      const result = await riskAnalysisService.analyzePortfolioRisk(mockPortfolioData);

      expect(result).toEqual({
        valueAtRisk: 0.15,
        sharpeRatio: 1.8,
        volatility: 0.25,
        beta: 1.2,
        riskLevel: 'moderate'
      });

      expect(riskCalculations.calculateValueAtRisk).toHaveBeenCalledWith(mockPortfolioData);
      expect(riskCalculations.calculateSharpeRatio).toHaveBeenCalledWith(mockPortfolioData);
      expect(riskCalculations.calculateVolatility).toHaveBeenCalledWith(mockPortfolioData);
      expect(riskCalculations.calculateBeta).toHaveBeenCalledWith(mockPortfolioData);
    });

    it('should handle empty portfolio data', async () => {
      const emptyPortfolio = { positions: [], historicalPrices: {} };
      
      riskCalculations.calculateValueAtRisk.mockReturnValue(0);
      riskCalculations.calculateSharpeRatio.mockReturnValue(0);
      riskCalculations.calculateVolatility.mockReturnValue(0);
      riskCalculations.calculateBeta.mockReturnValue(0);

      const result = await riskAnalysisService.analyzePortfolioRisk(emptyPortfolio);

      expect(result).toEqual({
        valueAtRisk: 0,
        sharpeRatio: 0,
        volatility: 0,
        beta: 0,
        riskLevel: 'low'
      });
    });

    it('should handle calculation errors gracefully', async () => {
      riskCalculations.calculateValueAtRisk.mockRejectedValue(new Error('Calculation error'));

      await expect(riskAnalysisService.analyzePortfolioRisk(mockPortfolioData))
        .rejects
        .toThrow('Error analyzing portfolio risk');
    });
  });

  describe('getRiskLevel', () => {
    it('should return high risk level for high metrics', () => {
      const metrics = {
        valueAtRisk: 0.3,
        volatility: 0.4,
        beta: 2.0
      };

      const riskLevel = riskAnalysisService.getRiskLevel(metrics);
      expect(riskLevel).toBe('high');
    });

    it('should return low risk level for low metrics', () => {
      const metrics = {
        valueAtRisk: 0.05,
        volatility: 0.1,
        beta: 0.5
      };

      const riskLevel = riskAnalysisService.getRiskLevel(metrics);
      expect(riskLevel).toBe('low');
    });

    it('should return moderate risk level for moderate metrics', () => {
      const metrics = {
        valueAtRisk: 0.15,
        volatility: 0.25,
        beta: 1.2
      };

      const riskLevel = riskAnalysisService.getRiskLevel(metrics);
      expect(riskLevel).toBe('moderate');
    });
  });
});