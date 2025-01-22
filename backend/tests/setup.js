jest.mock('../services/riskCalculations', () => ({
  calculateValueAtRisk: jest.fn().mockReturnValue(0.15),
  calculateSharpeRatio: jest.fn().mockReturnValue(1.8),
  calculateVolatility: jest.fn().mockReturnValue(0.25),
  calculateBeta: jest.fn().mockReturnValue(1.2),
  calculateDrawdown: jest.fn().mockReturnValue(0.1),
  calculatePortfolioValue: jest.fn().mockReturnValue(100000),
  calculateStressFactors: jest.fn().mockReturnValue([]),
  calculateScenarioAnalysis: jest.fn().mockReturnValue([])
}));

jest.mock('../services/riskAnalysis', () => ({
  analyzePortfolioRisk: jest.fn().mockResolvedValue({
    valueAtRisk: 0.15,
    sharpeRatio: 1.8,
    volatility: 0.25,
    beta: 1.2
  }),
  getRiskLevel: jest.fn().mockReturnValue('moderate')
}));

jest.mock('../services/ibkrService', () => ({
  getPositions: jest.fn().mockResolvedValue([]),
  getAccountSummary: jest.fn().mockResolvedValue({}),
  getHistoricalData: jest.fn().mockResolvedValue([])
}));

jest.mock('../services/portfolioOptimization', () => ({
  optimizePortfolio: jest.fn().mockResolvedValue({
    targetAllocations: {
      'AAPL': 0.6,
      'GOOGL': 0.4
    }
  })
}));

jest.mock('../services/tradeService', () => ({
  generateTradeRecommendations: jest.fn().mockResolvedValue([]),
  getPortfolioRebalanceAnalysis: jest.fn().mockResolvedValue({}),
  calculateCurrentAllocation: jest.fn().mockResolvedValue({})
}));

jest.mock('../services/solanaService', () => ({
  getTokenBalance: jest.fn().mockResolvedValue(700000),
  verifyTokenOwnership: jest.fn().mockResolvedValue(true)
}));

jest.mock('../middleware/auth', () => jest.fn((req, res, next) => {
  req.user = { id: 'test-user-123' };
  next();
}));

module.exports = {
  riskCalculations: require('../services/riskCalculations'),
  riskAnalysis: require('../services/riskAnalysis'),
  ibkrService: require('../services/ibkrService'),
  portfolioOptimization: require('../services/portfolioOptimization'),
  tradeService: require('../services/tradeService'),
  solanaService: require('../services/solanaService'),
  auth: require('../middleware/auth')
};