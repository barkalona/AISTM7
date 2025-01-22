const ibkrService = require('./ibkrService');
const { calculateVaR, calculateSharpeRatio } = require('./riskCalculations');

class RiskAnalysisService {
  constructor() {
    this.riskSubscriptions = new Map(); // Store risk update subscriptions by userId
  }

  async analyzePortfolio(userId, accountId) {
    try {
      const [positions, history] = await Promise.all([
        ibkrService.getPositions(userId, accountId),
        ibkrService.getHistoricalData(userId, accountId, '1Y', '1d')
      ]);

      const portfolioValue = positions.reduce((sum, position) => 
        sum + (position.marketValue || 0), 0);

      const returns = this.calculateReturns(history);
      const riskMetrics = await this.calculateRiskMetrics(returns, portfolioValue, positions);

      return riskMetrics;
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      throw error;
    }
  }

  async calculateRiskMetrics(returns, portfolioValue, positions) {
    const valueAtRisk = calculateVaR(returns);
    const sharpeRatio = calculateSharpeRatio(returns);
    const monteCarloResults = await this.runMonteCarloSimulation(positions, returns);
    
    const assetCorrelations = this.calculateAssetCorrelations(positions, returns);
    const betaMetrics = this.calculateBetaMetrics(positions, returns);
    
    return {
      valueAtRisk,
      sharpeRatio,
      portfolioValue,
      monteCarloResults,
      assetCorrelations,
      betaMetrics,
      riskBreakdown: {
        systematicRisk: betaMetrics.portfolioBeta * 100,
        unsystematicRisk: 100 - (betaMetrics.portfolioBeta * 100)
      },
      timestamp: new Date().toISOString()
    };
  }

  calculateReturns(history) {
    const returns = [];
    for (let i = 1; i < history.length; i++) {
      const prevClose = history[i - 1].close;
      const currentClose = history[i].close;
      returns.push((currentClose - prevClose) / prevClose);
    }
    return returns;
  }

  async runMonteCarloSimulation(positions, historicalReturns, simulations = 1000, days = 252) {
    const results = [];
    const portfolioValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    
    // Calculate portfolio mean return and volatility
    const meanReturn = historicalReturns.reduce((sum, ret) => sum + ret, 0) / historicalReturns.length;
    const volatility = Math.sqrt(
      historicalReturns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / 
      (historicalReturns.length - 1)
    );

    // Run simulations
    for (let sim = 0; sim < simulations; sim++) {
      let simulatedValue = portfolioValue;
      const path = [simulatedValue];
      
      for (let day = 0; day < days; day++) {
        const randomReturn = this.generateRandomReturn(meanReturn, volatility);
        simulatedValue *= (1 + randomReturn);
        path.push(simulatedValue);
      }
      
      results.push({
        finalValue: simulatedValue,
        path: path
      });
    }

    // Calculate confidence intervals
    const finalValues = results.map(r => r.finalValue).sort((a, b) => a - b);
    return {
      confidenceIntervals: {
        ninety: finalValues[Math.floor(simulations * 0.1)],
        ninetyFive: finalValues[Math.floor(simulations * 0.05)],
        ninetyNine: finalValues[Math.floor(simulations * 0.01)]
      },
      expectedValue: finalValues.reduce((sum, val) => sum + val, 0) / simulations,
      worstCase: finalValues[0],
      bestCase: finalValues[simulations - 1]
    };
  }

  generateRandomReturn(mean, volatility) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + volatility * z;
  }

  calculateAssetCorrelations(positions, returns) {
    const correlations = [];
    const assets = positions.map(p => p.symbol);
    
    for (let i = 0; i < assets.length; i++) {
      for (let j = i + 1; j < assets.length; j++) {
        const correlation = this.calculateCorrelation(
          returns.filter(r => r.symbol === assets[i]),
          returns.filter(r => r.symbol === assets[j])
        );
        correlations.push({
          asset1: assets[i],
          asset2: assets[j],
          correlation
        });
      }
    }
    
    return correlations;
  }

  calculateCorrelation(returns1, returns2) {
    const n = Math.min(returns1.length, returns2.length);
    const mean1 = returns1.reduce((sum, r) => sum + r, 0) / n;
    const mean2 = returns2.reduce((sum, r) => sum + r, 0) / n;
    
    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;
    
    for (let i = 0; i < n; i++) {
      const diff1 = returns1[i] - mean1;
      const diff2 = returns2[i] - mean2;
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }
    
    return numerator / Math.sqrt(denominator1 * denominator2);
  }

  calculateBetaMetrics(positions, marketReturns) {
    const portfolioReturns = positions.map(position => {
      const positionReturns = marketReturns.filter(r => r.symbol === position.symbol);
      const beta = this.calculateBeta(positionReturns, marketReturns);
      return {
        symbol: position.symbol,
        beta,
        weight: position.marketValue / positions.reduce((sum, p) => sum + p.marketValue, 0)
      };
    });

    const portfolioBeta = portfolioReturns.reduce((sum, pos) => sum + pos.beta * pos.weight, 0);

    return {
      portfolioBeta,
      assetBetas: portfolioReturns.map(({ symbol, beta }) => ({ symbol, beta }))
    };
  }

  calculateBeta(assetReturns, marketReturns) {
    const covariance = this.calculateCovariance(assetReturns, marketReturns);
    const marketVariance = this.calculateVariance(marketReturns);
    return covariance / marketVariance;
  }

  calculateCovariance(returns1, returns2) {
    const n = Math.min(returns1.length, returns2.length);
    const mean1 = returns1.reduce((sum, r) => sum + r, 0) / n;
    const mean2 = returns2.reduce((sum, r) => sum + r, 0) / n;
    
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += (returns1[i] - mean1) * (returns2[i] - mean2);
    }
    
    return sum / (n - 1);
  }

  calculateVariance(returns) {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    return returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  }

  async stressTestPortfolio(userId, accountId, scenarios) {
    try {
      const positions = await ibkrService.getPositions(userId, accountId);
      const results = scenarios.map(scenario => {
        const stressedValue = positions.reduce((sum, position) => {
          const stressFactor = scenario.factors[position.assetClass] || 1;
          return sum + (position.marketValue * stressFactor);
        }, 0);

        const impact = ((stressedValue - positions.reduce((sum, p) => sum + p.marketValue, 0)) /
          positions.reduce((sum, p) => sum + p.marketValue, 0)) * 100;

        return {
          scenario: scenario.name,
          description: scenario.description,
          portfolioValue: stressedValue,
          impact: impact.toFixed(2) + '%',
          breakdown: positions.map(position => ({
            symbol: position.symbol,
            originalValue: position.marketValue,
            stressedValue: position.marketValue * (scenario.factors[position.assetClass] || 1),
            impact: ((position.marketValue * (scenario.factors[position.assetClass] || 1) - position.marketValue) /
              position.marketValue * 100).toFixed(2) + '%'
          }))
        };
      });
      return results;
    } catch (error) {
      console.error('Error stress testing portfolio:', error);
      throw error;
    }
  }
}

module.exports = new RiskAnalysisService();