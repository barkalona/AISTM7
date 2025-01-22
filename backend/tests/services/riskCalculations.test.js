const riskCalculations = require('../../services/riskCalculations');

describe('Risk Calculations Service', () => {
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

  describe('calculateValueAtRisk', () => {
    it('should calculate VaR correctly for a given confidence level', () => {
      const result = riskCalculations.calculateValueAtRisk(mockPortfolioData);
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
      expect(typeof result).toBe('number');
    });

    it('should handle empty portfolio', () => {
      const emptyPortfolio = {
        positions: [],
        historicalPrices: {}
      };

      const result = riskCalculations.calculateValueAtRisk(emptyPortfolio);
      expect(result).toBe(0);
    });
  });

  describe('calculateSharpeRatio', () => {
    it('should calculate Sharpe ratio correctly', () => {
      const result = riskCalculations.calculateSharpeRatio(mockPortfolioData);
      
      expect(result).toBeGreaterThan(-5);
      expect(result).toBeLessThan(5);
      expect(typeof result).toBe('number');
    });

    it('should handle zero volatility case', () => {
      const noVolatilityPortfolio = {
        positions: [{ symbol: 'AAPL', quantity: 100, currentPrice: 150 }],
        historicalPrices: {
          'AAPL': [150, 150, 150, 150, 150]
        }
      };

      const result = riskCalculations.calculateSharpeRatio(noVolatilityPortfolio);
      expect(result).toBe(0);
    });
  });

  describe('calculateVolatility', () => {
    it('should calculate portfolio volatility correctly', () => {
      const result = riskCalculations.calculateVolatility(mockPortfolioData);
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
      expect(typeof result).toBe('number');
    });

    it('should handle single price point', () => {
      const singlePricePortfolio = {
        positions: [{ symbol: 'AAPL', quantity: 100, currentPrice: 150 }],
        historicalPrices: {
          'AAPL': [150]
        }
      };

      const result = riskCalculations.calculateVolatility(singlePricePortfolio);
      expect(result).toBe(0);
    });
  });

  describe('calculateBeta', () => {
    it('should calculate portfolio beta correctly', () => {
      const result = riskCalculations.calculateBeta(mockPortfolioData);
      
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    it('should handle market data unavailability', () => {
      const noMarketDataPortfolio = {
        positions: mockPortfolioData.positions,
        historicalPrices: mockPortfolioData.historicalPrices,
        marketIndex: null
      };

      const result = riskCalculations.calculateBeta(noMarketDataPortfolio);
      expect(result).toBe(1); // Default to market beta
    });
  });

  describe('calculateDrawdown', () => {
    it('should calculate maximum drawdown correctly', () => {
      const result = riskCalculations.calculateDrawdown(mockPortfolioData);
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
      expect(typeof result).toBe('number');
    });

    it('should handle ascending prices', () => {
      const ascendingPortfolio = {
        positions: [{ symbol: 'AAPL', quantity: 100, currentPrice: 155 }],
        historicalPrices: {
          'AAPL': [145, 147, 150, 152, 155]
        }
      };

      const result = riskCalculations.calculateDrawdown(ascendingPortfolio);
      expect(result).toBe(0);
    });
  });

  describe('calculatePortfolioValue', () => {
    it('should calculate total portfolio value correctly', () => {
      const expectedValue = 
        mockPortfolioData.positions[0].quantity * mockPortfolioData.positions[0].currentPrice +
        mockPortfolioData.positions[1].quantity * mockPortfolioData.positions[1].currentPrice;

      const result = riskCalculations.calculatePortfolioValue(mockPortfolioData.positions);
      expect(result).toBe(expectedValue);
    });

    it('should return 0 for empty portfolio', () => {
      const result = riskCalculations.calculatePortfolioValue([]);
      expect(result).toBe(0);
    });
  });
});