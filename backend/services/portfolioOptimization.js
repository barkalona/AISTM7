class PortfolioOptimization {
  optimize(positions, targetAllocation) {
    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    
    // Calculate target values for each position
    const optimizedPositions = positions.map((position, index) => {
      const targetValue = totalValue * targetAllocation[index];
      const targetQuantity = targetValue / position.marketPrice;
      
      return {
        ...position,
        targetValue,
        targetQuantity,
        action: targetQuantity > position.quantity ? 'BUY' : 'SELL',
        quantityChange: Math.abs(targetQuantity - position.quantity)
      };
    });

    // Sort by largest changes first
    optimizedPositions.sort((a, b) => b.quantityChange - a.quantityChange);

    return optimizedPositions;
  }

  calculateTransactionCosts(optimizedPositions) {
    return optimizedPositions.reduce((total, position) => {
      const transactionCost = position.quantityChange * position.marketPrice * 0.01; // 1% transaction cost
      return total + transactionCost;
    }, 0);
  }

  validateOptimization(optimizedPositions, totalValue) {
    const newTotal = optimizedPositions.reduce((sum, pos) => 
      sum + (pos.targetQuantity * pos.marketPrice), 0);
    
    // Allow 1% tolerance for rounding errors
    return Math.abs(newTotal - totalValue) / totalValue < 0.01;
  }
}

module.exports = new PortfolioOptimization();