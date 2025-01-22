const ibkrService = require('./ibkrService');
const portfolioOptimization = require('./portfolioOptimization');
const alertService = require('./alertService');
const riskAnalysisService = require('./riskAnalysis');
const aiService = require('./aiService');

class TradeService {
  async generateTradeRecommendations(accountId) {
    try {
      // Get current portfolio positions
      const positions = await ibkrService.getPositions(accountId);
      
      // Get portfolio analysis
      const analysis = await riskAnalysisService.analyzePortfolio(accountId);
      
      // Generate AI recommendations
      const { optimizedPortfolio } = await aiService.generateRecommendations(analysis);

      // Calculate suggested position changes
      const recommendations = this.calculatePositionChanges(positions, optimizedPortfolio);

      // Send notification about new recommendations
      await alertService.sendRecommendationNotification(accountId, recommendations);

      return {
        currentPositions: positions,
        recommendations,
        analysis
      };
    } catch (error) {
      console.error('Error generating trade recommendations:', error);
      throw error;
    }
  }

  calculatePositionChanges(currentPositions, optimizedPortfolio) {
    const changes = [];

    // Compare current positions with optimized portfolio
    for (const optimizedPosition of optimizedPortfolio) {
      const currentPosition = currentPositions.find(
        pos => pos.contractId === optimizedPosition.contractId
      );

      const currentQuantity = currentPosition ? currentPosition.quantity : 0;
      const targetQuantity = optimizedPosition.quantity;
      const quantityDiff = targetQuantity - currentQuantity;

      if (quantityDiff !== 0) {
        changes.push({
          symbol: optimizedPosition.symbol,
          contractId: optimizedPosition.contractId,
          currentQuantity,
          targetQuantity,
          suggestedAction: quantityDiff > 0 ? 'BUY' : 'SELL',
          quantityChange: Math.abs(quantityDiff),
          reason: optimizedPosition.reason || 'Portfolio optimization'
        });
      }
    }

    return changes;
  }

  async getPortfolioRebalanceAnalysis(accountId) {
    try {
      // Get current portfolio
      const positions = await ibkrService.getPositions(accountId);
      
      // Get optimal allocation
      const { targetAllocation } = await portfolioOptimization.getOptimalAllocation(positions);

      // Calculate current allocation
      const currentAllocation = this.calculateCurrentAllocation(positions);

      return {
        currentAllocation,
        targetAllocation,
        deviations: this.calculateAllocationDeviations(currentAllocation, targetAllocation)
      };
    } catch (error) {
      console.error('Error analyzing portfolio rebalance:', error);
      throw error;
    }
  }

  calculateCurrentAllocation(positions) {
    const totalValue = positions.reduce(
      (sum, pos) => sum + pos.quantity * pos.currentPrice,
      0
    );

    return positions.reduce((allocation, pos) => {
      allocation[pos.symbol] = (pos.quantity * pos.currentPrice) / totalValue;
      return allocation;
    }, {});
  }

  calculateAllocationDeviations(currentAllocation, targetAllocation) {
    const deviations = {};
    
    for (const symbol in targetAllocation) {
      const current = currentAllocation[symbol] || 0;
      const target = targetAllocation[symbol];
      deviations[symbol] = {
        current,
        target,
        deviation: current - target,
        percentageDeviation: ((current - target) / target) * 100
      };
    }

    return deviations;
  }
}

module.exports = new TradeService();