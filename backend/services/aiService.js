const axios = require('axios');
const mathjs = require('mathjs');

class AIService {
  constructor() {
    this.initialized = false;
    this.defaultParams = {
      riskTolerance: 'moderate',
      tradingStyle: 'balanced',
      timeHorizon: 'medium',
      rebalancingFrequency: 'daily'
    };
  }

  async initialize(params = {}) {
    try {
      this.params = { ...this.defaultParams, ...params };
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('AI service initialization failed:', error);
      throw error;
    }
  }

  async analyzePortfolio(portfolioData) {
    try {
      const analysis = {
        riskScore: this.calculateRiskScore(portfolioData),
        diversificationScore: this.calculateDiversificationScore(portfolioData),
        performanceMetrics: await this.calculatePerformanceMetrics(portfolioData),
        recommendations: await this.generateRecommendations(portfolioData)
      };
      return analysis;
    } catch (error) {
      console.error('Portfolio analysis failed:', error);
      throw error;
    }
  }

  calculateRiskScore(portfolioData) {
    try {
      if (!portfolioData || !portfolioData.positions) {
        return 50; // Default moderate risk score for empty portfolio
      }
      
      const { positions = [], balance = 0 } = portfolioData;
      
      // Calculate portfolio volatility
      const returns = positions.map(position => position.returns || 0);
      const volatility = returns.length > 0 ? mathjs.std(returns) : 0;
      
      // Calculate concentration risk
      const positionSizes = positions.map(position => position.value / balance);
      const concentrationRisk = mathjs.max(positionSizes) || 0;
      
      // Calculate overall risk score (0-100)
      const riskScore = Math.min(100, Math.max(0, 
        (volatility * 50) + (concentrationRisk * 50)
      ));
      
      return riskScore;
    } catch (error) {
      console.error('Risk score calculation failed:', error);
      return 50; // Default moderate risk score
    }
  }

  calculateDiversificationScore(portfolioData) {
    try {
      const { positions = [] } = portfolioData;
      
      if (positions.length === 0) {
        return 0; // No diversification for empty portfolio
      }
      
      // Calculate sector diversity
      const sectors = new Set(positions.map(p => p.sector));
      const sectorScore = (sectors.size / Math.max(1, positions.length)) * 100;
      
      // Calculate asset type diversity
      const assetTypes = new Set(positions.map(p => p.assetType));
      const assetScore = (assetTypes.size / Math.max(1, positions.length)) * 100;
      
      // Overall diversification score
      return Math.min(100, (sectorScore + assetScore) / 2);
    } catch (error) {
      console.error('Diversification score calculation failed:', error);
      return 50; // Default moderate diversification score
    }
  }

  async calculatePerformanceMetrics(portfolioData) {
    try {
      const { positions = [], historicalData = [] } = portfolioData;
      
      if (positions.length === 0) {
        return {
          returns: 0,
          sharpeRatio: 0,
          alpha: 0,
          riskAdjustedReturn: 0
        };
      }
      
      // Calculate basic metrics
      const returns = positions.reduce((sum, pos) => sum + (pos.returns || 0), 0);
      const sharpeRatio = this.calculateSharpeRatio(historicalData);
      const alpha = this.calculateAlpha(historicalData);
      
      return {
        returns,
        sharpeRatio,
        alpha,
        riskAdjustedReturn: returns / Math.max(1, this.calculateRiskScore(portfolioData))
      };
    } catch (error) {
      console.error('Performance metrics calculation failed:', error);
      throw error;
    }
  }

  calculateSharpeRatio(historicalData) {
    try {
      if (!historicalData || historicalData.length === 0) {
        return 0;
      }
      
      const returns = historicalData.map(d => d.return || 0);
      const avgReturn = mathjs.mean(returns);
      const riskFreeRate = 0.02; // Assumed 2% risk-free rate
      const stdDev = mathjs.std(returns);
      
      return stdDev === 0 ? 0 : (avgReturn - riskFreeRate) / stdDev;
    } catch (error) {
      console.error('Sharpe ratio calculation failed:', error);
      return 0;
    }
  }

  calculateAlpha(historicalData) {
    try {
      if (!historicalData || historicalData.length === 0) {
        return 0;
      }
      
      const portfolioReturns = historicalData.map(d => d.return || 0);
      const marketReturns = historicalData.map(d => d.marketReturn || 0);
      
      const avgPortfolioReturn = mathjs.mean(portfolioReturns);
      const avgMarketReturn = mathjs.mean(marketReturns);
      const beta = this.calculateBeta(portfolioReturns, marketReturns);
      
      return avgPortfolioReturn - (0.02 + beta * (avgMarketReturn - 0.02));
    } catch (error) {
      console.error('Alpha calculation failed:', error);
      return 0;
    }
  }

  calculateBeta(portfolioReturns, marketReturns) {
    try {
      if (!portfolioReturns || !marketReturns || portfolioReturns.length === 0) {
        return 1;
      }
      
      const covariance = mathjs.dot(
        portfolioReturns.map(r => r - mathjs.mean(portfolioReturns)),
        marketReturns.map(r => r - mathjs.mean(marketReturns))
      ) / (portfolioReturns.length - 1);
      
      const marketVariance = mathjs.variance(marketReturns);
      return marketVariance === 0 ? 1 : covariance / marketVariance;
    } catch (error) {
      console.error('Beta calculation failed:', error);
      return 1;
    }
  }

  async generateRecommendations(portfolioData) {
    try {
      const analysis = {
        riskScore: this.calculateRiskScore(portfolioData),
        diversificationScore: this.calculateDiversificationScore(portfolioData)
      };
      
      const recommendations = [];
      
      // Risk-based recommendations
      if (analysis.riskScore > 80) {
        recommendations.push({
          type: 'risk_reduction',
          title: 'High Risk Alert',
          description: 'Portfolio risk is very high. Consider reducing position sizes in volatile assets.',
          expectedImpact: 'Lower portfolio volatility and improved risk-adjusted returns'
        });
      }
      
      // Diversification recommendations
      if (analysis.diversificationScore < 60) {
        recommendations.push({
          type: 'rebalance',
          title: 'Diversification Opportunity',
          description: 'Portfolio could benefit from increased diversification across sectors and asset types.',
          expectedImpact: 'Reduced concentration risk and improved stability'
        });
      }
      
      // Performance optimization
      const metrics = await this.calculatePerformanceMetrics(portfolioData);
      if (metrics.sharpeRatio < 1) {
        recommendations.push({
          type: 'opportunity',
          title: 'Performance Optimization',
          description: 'Consider rebalancing to improve risk-adjusted returns.',
          expectedImpact: 'Higher risk-adjusted returns and improved efficiency'
        });
      }
      
      // If portfolio is empty, provide initial recommendation
      if (!portfolioData || !portfolioData.positions || portfolioData.positions.length === 0) {
        recommendations.push({
          type: 'opportunity',
          title: 'Initial Investment',
          description: 'Consider starting with a diversified portfolio of low-cost index funds.',
          expectedImpact: 'Build a strong foundation for long-term growth'
        });
      }
      
      return {
        analysis: {
          riskLevel: this.getRiskLevel(analysis.riskScore),
          keyFindings: this.generateKeyFindings(analysis, metrics)
        },
        recommendations
      };
    } catch (error) {
      console.error('Recommendations generation failed:', error);
      throw error;
    }
  }

  getRiskLevel(riskScore) {
    if (riskScore >= 80) return 'Very High';
    if (riskScore >= 60) return 'High';
    if (riskScore >= 40) return 'Moderate';
    if (riskScore >= 20) return 'Low';
    return 'Very Low';
  }

  generateKeyFindings(analysis, metrics) {
    const findings = [];
    
    if (analysis.riskScore > 70) {
      findings.push('Portfolio shows elevated risk levels');
    }
    if (analysis.diversificationScore < 50) {
      findings.push('Diversification could be improved');
    }
    if (metrics.sharpeRatio < 1) {
      findings.push('Risk-adjusted returns below optimal levels');
    }
    if (metrics.alpha < 0) {
      findings.push('Portfolio underperforming relative to market');
    }
    
    return findings;
  }

  async analyzeMarketConditions(marketData) {
    try {
      const { marketIndicators = {}, sectorPerformance = {} } = marketData;
      
      // Analyze market sentiment
      const sentiment = this.calculateMarketSentiment(marketIndicators);
      
      // Identify opportunities and risks
      const opportunities = this.identifyOpportunities(marketData);
      const risks = this.identifyRisks(marketData);
      
      // Analyze sector performance
      const sectorOutlook = this.analyzeSectorPerformance(sectorPerformance);
      
      return {
        marketSentiment: sentiment,
        opportunities,
        risks,
        sectorOutlook
      };
    } catch (error) {
      console.error('Market analysis failed:', error);
      throw error;
    }
  }

  calculateMarketSentiment(indicators) {
    const { vix = 20, advanceDecline = 1, putCallRatio = 1 } = indicators;
    
    if (vix > 30 && putCallRatio > 1.2) return 'Bearish';
    if (vix < 15 && advanceDecline > 1.5) return 'Bullish';
    return 'Neutral';
  }

  identifyOpportunities(marketData) {
    const opportunities = [];
    const { sectorPerformance = {} } = marketData;
    
    // Identify outperforming sectors
    Object.entries(sectorPerformance).forEach(([sector, performance]) => {
      if (parseFloat(performance) > 3.0) {
        opportunities.push(`${sector} sector showing strong momentum`);
      }
    });
    
    return opportunities;
  }

  identifyRisks(marketData) {
    const risks = [];
    const { marketIndicators = {} } = marketData;
    
    if (marketIndicators.vix > 30) {
      risks.push('High market volatility');
    }
    if (marketIndicators.putCallRatio > 1.5) {
      risks.push('Elevated hedging activity');
    }
    
    return risks;
  }

  analyzeSectorPerformance(sectorPerformance) {
    const outlook = {};
    
    Object.entries(sectorPerformance).forEach(([sector, performance]) => {
      const perfValue = parseFloat(performance);
      if (perfValue > 5) outlook[sector] = 'Strong';
      else if (perfValue > 2) outlook[sector] = 'Positive';
      else if (perfValue < -5) outlook[sector] = 'Weak';
      else if (perfValue < -2) outlook[sector] = 'Negative';
      else outlook[sector] = 'Neutral';
    });
    
    return outlook;
  }

  async optimizePortfolioAllocation(portfolioData) {
    try {
      const { positions = [], riskTolerance = 'moderate' } = portfolioData;
      
      // Calculate target allocation based on risk tolerance
      const allocation = this.calculateTargetAllocation(positions, riskTolerance);
      
      // Calculate expected metrics
      const expectedMetrics = this.calculateExpectedMetrics(allocation);
      
      // Determine if rebalancing is needed
      const rebalancingRequired = this.isRebalancingRequired(positions, allocation);
      
      return {
        success: true,
        allocation,
        expectedMetrics,
        rebalancingRequired
      };
    } catch (error) {
      console.error('Portfolio optimization failed:', error);
      throw error;
    }
  }

  calculateTargetAllocation(positions, riskTolerance) {
    const allocation = {
      bonds: 0,
      lowVolatilityStocks: 0,
      growthStocks: 0,
      commodities: 0
    };
    
    switch (riskTolerance) {
      case 'conservative':
        allocation.bonds = 0.6;
        allocation.lowVolatilityStocks = 0.3;
        allocation.growthStocks = 0.1;
        break;
      case 'moderate':
        allocation.bonds = 0.4;
        allocation.lowVolatilityStocks = 0.3;
        allocation.growthStocks = 0.2;
        allocation.commodities = 0.1;
        break;
      case 'aggressive':
        allocation.bonds = 0.2;
        allocation.lowVolatilityStocks = 0.2;
        allocation.growthStocks = 0.5;
        allocation.commodities = 0.1;
        break;
      default:
        allocation.bonds = 0.4;
        allocation.lowVolatilityStocks = 0.3;
        allocation.growthStocks = 0.2;
        allocation.commodities = 0.1;
    }
    
    return allocation;
  }

  calculateExpectedMetrics(allocation) {
    // Simplified return calculations based on historical averages
    const expectedReturns = {
      bonds: 0.03,
      lowVolatilityStocks: 0.06,
      growthStocks: 0.10,
      commodities: 0.04
    };
    
    const expectedReturn = Object.entries(allocation).reduce(
      (total, [asset, weight]) => total + (weight * expectedReturns[asset]),
      0
    );
    
    const risk = 0.15; // Simplified risk calculation
    const sharpeRatio = (expectedReturn - 0.02) / risk; // Assuming 2% risk-free rate
    
    return {
      return: expectedReturn,
      risk,
      sharpeRatio
    };
  }

  isRebalancingRequired(positions, targetAllocation) {
    // Simplified check - in reality would compare current vs target weights
    return true; // Always suggest rebalancing in this example
  }

  async generateInsights(userId, portfolioData, riskMetrics) {
    try {
      const insights = {
        timestamp: new Date(),
        userId,
        analysis: await this.analyzePortfolio(portfolioData),
        riskMetrics,
        recommendations: await this.generateRecommendations(portfolioData)
      };
      
      return insights;
    } catch (error) {
      console.error('Insights generation failed:', error);
      throw error;
    }
  }
}

module.exports = new AIService();