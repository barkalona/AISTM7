export interface RiskMetrics {
  valueAtRisk: number;
  sharpeRatio: number;
  portfolioValue: number;
  volatility: number;
  beta: number;
  drawdown: number;
}

export interface RiskAlert {
  id: string;
  userId: string;
  metric: keyof RiskMetrics;
  threshold: number;
  condition: 'above' | 'below';
  createdAt: Date;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  expectedImpact: string;
  type: 'rebalance' | 'risk_reduction' | 'opportunity';
  status: 'pending' | 'accepted' | 'dismissed';
  createdAt: Date;
  portfolioId: string;
}

export interface RiskChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}