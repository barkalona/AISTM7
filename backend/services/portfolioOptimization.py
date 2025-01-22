import numpy as np
import pandas as pd
from scipy.optimize import minimize
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class OptimizationResult:
    weights: Dict[str, float]
    expected_return: float
    volatility: float
    sharpe_ratio: float
    efficient_frontier: List[Tuple[float, float]]  # [(volatility, return)]

class PortfolioOptimizer:
    def __init__(
        self,
        historical_data: pd.DataFrame,
        risk_free_rate: float = 0.02,  # 2% annual risk-free rate
        min_weight: float = 0.0,
        max_weight: float = 1.0
    ):
        """
        Initialize portfolio optimizer with historical price data.
        
        Args:
            historical_data: DataFrame with columns ['date', 'symbol', 'price']
            risk_free_rate: Annual risk-free rate (default: 0.02)
            min_weight: Minimum weight for any asset (default: 0.0)
            max_weight: Maximum weight for any asset (default: 1.0)
        """
        self.risk_free_rate = risk_free_rate / 252  # Convert to daily rate
        self.min_weight = min_weight
        self.max_weight = max_weight
        
        # Calculate returns
        self.returns = historical_data.pivot(
            index='date',
            columns='symbol',
            values='price'
        ).pct_change().dropna()
        
        self.mean_returns = self.returns.mean()
        self.cov_matrix = self.returns.cov()
        self.symbols = self.returns.columns.tolist()
        self.num_assets = len(self.symbols)

    def _portfolio_stats(self, weights: np.ndarray) -> Tuple[float, float, float]:
        """Calculate portfolio statistics: return, volatility, and Sharpe ratio."""
        weights = np.array(weights)
        returns = np.sum(self.mean_returns * weights) * 252
        volatility = np.sqrt(np.dot(weights.T, np.dot(self.cov_matrix * 252, weights)))
        sharpe = (returns - self.risk_free_rate * 252) / volatility
        return returns, volatility, sharpe

    def _negative_sharpe(self, weights: np.ndarray) -> float:
        """Objective function for optimization (negative Sharpe ratio)."""
        returns, volatility, sharpe = self._portfolio_stats(weights)
        return -sharpe

    def _minimize_volatility(self, weights: np.ndarray) -> float:
        """Objective function for minimizing volatility."""
        return self._portfolio_stats(weights)[1]

    def optimize_portfolio(
        self,
        objective: str = 'sharpe',
        target_return: Optional[float] = None,
        target_volatility: Optional[float] = None
    ) -> OptimizationResult:
        """
        Optimize portfolio weights based on specified objective.
        
        Args:
            objective: Optimization objective ('sharpe', 'min_volatility', 'max_return')
            target_return: Target annual return (for volatility minimization)
            target_volatility: Target annual volatility (for return maximization)
            
        Returns:
            OptimizationResult containing optimal weights and portfolio metrics
        """
        constraints = [
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1}  # weights sum to 1
        ]
        
        if target_return is not None:
            constraints.append({
                'type': 'eq',
                'fun': lambda x: self._portfolio_stats(x)[0] - target_return
            })
            
        if target_volatility is not None:
            constraints.append({
                'type': 'eq',
                'fun': lambda x: self._portfolio_stats(x)[1] - target_volatility
            })
        
        bounds = tuple((self.min_weight, self.max_weight) for _ in range(self.num_assets))
        
        # Initial guess: equal weights
        initial_weights = np.array([1/self.num_assets] * self.num_assets)
        
        if objective == 'sharpe':
            result = minimize(
                self._negative_sharpe,
                initial_weights,
                method='SLSQP',
                bounds=bounds,
                constraints=constraints
            )
        elif objective == 'min_volatility':
            result = minimize(
                self._minimize_volatility,
                initial_weights,
                method='SLSQP',
                bounds=bounds,
                constraints=constraints
            )
        else:
            raise ValueError(f"Unsupported objective: {objective}")
            
        optimal_weights = result.x
        returns, volatility, sharpe = self._portfolio_stats(optimal_weights)
        
        # Generate efficient frontier points
        frontier_points = self._generate_efficient_frontier()
        
        return OptimizationResult(
            weights={symbol: weight for symbol, weight in zip(self.symbols, optimal_weights)},
            expected_return=returns,
            volatility=volatility,
            sharpe_ratio=sharpe,
            efficient_frontier=frontier_points
        )

    def _generate_efficient_frontier(self, points: int = 50) -> List[Tuple[float, float]]:
        """Generate points along the efficient frontier."""
        # Find minimum volatility and maximum return portfolios
        min_vol_result = self.optimize_portfolio(objective='min_volatility')
        min_ret = min(self.mean_returns) * 252
        max_ret = max(self.mean_returns) * 252
        
        # Generate target returns
        target_returns = np.linspace(min_ret, max_ret, points)
        efficient_frontier = []
        
        for target_return in target_returns:
            try:
                result = self.optimize_portfolio(
                    objective='min_volatility',
                    target_return=target_return
                )
                efficient_frontier.append((result.volatility, target_return))
            except:
                continue
                
        return sorted(efficient_frontier)

    def get_portfolio_recommendations(
        self,
        risk_tolerance: str = 'moderate'
    ) -> Dict[str, OptimizationResult]:
        """
        Generate portfolio recommendations based on risk tolerance.
        
        Args:
            risk_tolerance: 'conservative', 'moderate', or 'aggressive'
            
        Returns:
            Dictionary containing different portfolio optimizations
        """
        recommendations = {}
        
        # Maximum Sharpe ratio portfolio
        recommendations['optimal'] = self.optimize_portfolio(objective='sharpe')
        
        # Minimum volatility portfolio
        recommendations['min_risk'] = self.optimize_portfolio(objective='min_volatility')
        
        # Risk-based portfolios
        if risk_tolerance == 'conservative':
            target_vol = recommendations['min_risk'].volatility * 1.2
        elif risk_tolerance == 'moderate':
            target_vol = (recommendations['min_risk'].volatility + recommendations['optimal'].volatility) / 2
        else:  # aggressive
            target_vol = recommendations['optimal'].volatility * 1.2
            
        recommendations['risk_adjusted'] = self.optimize_portfolio(
            objective='min_volatility',
            target_volatility=target_vol
        )
        
        return recommendations

    def get_rebalancing_trades(
        self,
        current_weights: Dict[str, float],
        target_weights: Dict[str, float],
        portfolio_value: float,
        min_trade_size: float = 100
    ) -> Dict[str, float]:
        """
        Calculate required trades to rebalance portfolio.
        
        Args:
            current_weights: Current portfolio weights
            target_weights: Target portfolio weights
            portfolio_value: Total portfolio value
            min_trade_size: Minimum trade size in dollars
            
        Returns:
            Dictionary of required trades (positive for buy, negative for sell)
        """
        trades = {}
        for symbol in self.symbols:
            current = current_weights.get(symbol, 0.0)
            target = target_weights.get(symbol, 0.0)
            trade_value = (target - current) * portfolio_value
            
            if abs(trade_value) >= min_trade_size:
                trades[symbol] = trade_value
                
        return trades