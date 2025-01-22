const tradeService = require('../../services/tradeService');
const ibkrService = require('../../services/ibkrService');
const riskAnalysisService = require('../../services/riskAnalysis');
const aiService = require('../../services/aiService');
const alertService = require('../../services/alertService');

// Mock dependencies
jest.mock('../../services/ibkrService');
jest.mock('../../services/riskAnalysis');
jest.mock('../../services/aiService');
jest.mock('../../services/alertService');

describe('Trade Service', () => {
  const mockAccountId = 'test-account-123';
  const mockPositions = [
    { symbol: 'AAPL', contractId: '1', quantity: 100, currentPrice: 150 },
    { symbol: 'GOOGL', contractId: '2', quantity: 50, currentPrice: 2800 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    ibkrService.getPositions.mockResolvedValue(mockPositions);
    riskAnalysisService.analyzePortfolio.mockResolvedValue({
      riskLevel: 'moderate',
      metrics: {
        sharpeRatio: 1.5,
        volatility: 0.2
      }
    });
    aiService.generateRecommendations.mockResolvedValue({
      optimizedPortfolio: [
        { symbol: 'AAPL', contractId: '1', quantity: 120, reason: 'Underweight' },
        { symbol: 'GOOGL', contractId: '2', quantity: 40, reason: 'Overweight' }
      ]
    });
    alertService.sendRecommendationNotification.mockResolvedValue();
  });

  describe('generateTradeRecommendations', () => {
    it('should generate trade recommendations based on portfolio analysis', async () => {
      const result = await tradeService.generateTradeRecommendations(mockAccountId);

      expect(result).toEqual({
        currentPositions: mockPositions,
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            symbol: 'AAPL',
            suggestedAction: 'BUY',
            quantityChange: 20
          }),
          expect.objectContaining({
            symbol: 'GOOGL',
            suggestedAction: 'SELL',
            quantityChange: 10
          })
        ]),
        analysis: expect.any(Object)
      });

      expect(ibkrService.getPositions).toHaveBeenCalledWith(mockAccountId);
      expect(riskAnalysisService.analyzePortfolio).toHaveBeenCalledWith(mockAccountId);
      expect(aiService.generateRecommendations).toHaveBeenCalled();
    });

    it('should handle empty portfolio', async () => {
      ibkrService.getPositions.mockResolvedValueOnce([]);

      const result = await tradeService.generateTradeRecommendations(mockAccountId);

      expect(result.currentPositions).toEqual([]);
      expect(result.recommendations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            suggestedAction: 'BUY'
          })
        ])
      );
    });

    it('should handle errors during recommendation generation', async () => {
      ibkrService.getPositions.mockRejectedValueOnce(new Error('API error'));

      await expect(tradeService.generateTradeRecommendations(mockAccountId))
        .rejects
        .toThrow('API error');
    });
  });

  describe('getPortfolioRebalanceAnalysis', () => {
    const mockTargetAllocation = {
      'AAPL': 0.6,
      'GOOGL': 0.4
    };

    beforeEach(() => {
      const mockOptimalAllocation = {
        targetAllocation: mockTargetAllocation
      };
      jest.spyOn(tradeService, 'calculateCurrentAllocation')
        .mockReturnValue({
          'AAPL': 0.5,
          'GOOGL': 0.5
        });
      jest.spyOn(portfolioOptimization, 'getOptimalAllocation')
        .mockResolvedValue(mockOptimalAllocation);
    });

    it('should analyze portfolio rebalance needs', async () => {
      const result = await tradeService.getPortfolioRebalanceAnalysis(mockAccountId);

      expect(result).toEqual({
        currentAllocation: expect.any(Object),
        targetAllocation: mockTargetAllocation,
        deviations: expect.objectContaining({
          'AAPL': expect.objectContaining({
            deviation: expect.any(Number)
          })
        })
      });
    });

    it('should calculate allocation deviations correctly', () => {
      const currentAllocation = {
        'AAPL': 0.5,
        'GOOGL': 0.5
      };

      const deviations = tradeService.calculateAllocationDeviations(
        currentAllocation,
        mockTargetAllocation
      );

      expect(deviations.AAPL.deviation).toBe(-0.1);
      expect(deviations.GOOGL.deviation).toBe(0.1);
    });
  });

  describe('calculateCurrentAllocation', () => {
    it('should calculate current portfolio allocation correctly', () => {
      const allocation = tradeService.calculateCurrentAllocation(mockPositions);
      const totalValue = 100 * 150 + 50 * 2800;
      const aaplAllocation = (100 * 150) / totalValue;
      const googlAllocation = (50 * 2800) / totalValue;

      expect(allocation).toEqual({
        'AAPL': aaplAllocation,
        'GOOGL': googlAllocation
      });
      expect(Math.abs(aaplAllocation + googlAllocation - 1)).toBeLessThan(0.0001);
    });

    it('should handle empty positions', () => {
      const allocation = tradeService.calculateCurrentAllocation([]);
      expect(allocation).toEqual({});
    });
  });
});