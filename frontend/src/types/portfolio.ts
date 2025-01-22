export interface Position {
  symbol: string;
  quantity: number;
  marketValue: number;
  price: number;
  lastUpdate: string;
  unrealizedPnL: number;
  realizedPnL: number;
  averageCost: number;
  contractId: string;
  assetClass: string;
  value: number;
  allocation: number;
  change24h: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalPnL: number;
  dayChange: number;
  dayChangePercent: number;
  positions: Position[];
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: string;
  status: 'pending' | 'executed' | 'cancelled' | 'failed';
  orderId?: string;
}

export interface TradeHistory {
  trades: Trade[];
  hasMore: boolean;
  nextCursor?: string;
}

export function calculateAssetAllocation(positions: Position[]): Position[] {
  const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
  
  return positions.map(position => ({
    ...position,
    value: position.marketValue,
    allocation: (position.marketValue / totalValue) * 100
  }));
}

export function calculatePortfolioMetrics(positions: Position[]): PortfolioSummary {
  const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
  const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL + pos.realizedPnL, 0);
  const dayChange = positions.reduce((sum, pos) => sum + (pos.change24h * pos.marketValue), 0);
  const dayChangePercent = (dayChange / totalValue) * 100;

  return {
    totalValue,
    totalPnL,
    dayChange,
    dayChangePercent,
    positions: calculateAssetAllocation(positions)
  };
}

export interface RebalancingTrade {
  symbol: string;
  amount: number;
  type: 'buy' | 'sell';
}

export function calculateRebalancingTrades(
  currentPositions: Position[],
  targetWeights: { [symbol: string]: number },
  minTradeSize: number = 100
): RebalancingTrade[] {
  const totalValue = currentPositions.reduce((sum, pos) => sum + pos.marketValue, 0);
  const currentWeights = Object.fromEntries(
    currentPositions.map(pos => [pos.symbol, pos.marketValue / totalValue])
  );

  const trades: RebalancingTrade[] = [];

  for (const [symbol, targetWeight] of Object.entries(targetWeights)) {
    const currentWeight = currentWeights[symbol] || 0;
    const targetValue = totalValue * targetWeight;
    const currentValue = totalValue * currentWeight;
    const difference = targetValue - currentValue;

    if (Math.abs(difference) >= minTradeSize) {
      trades.push({
        symbol,
        amount: Math.abs(difference),
        type: difference > 0 ? 'buy' : 'sell'
      });
    }
  }

  return trades;
}