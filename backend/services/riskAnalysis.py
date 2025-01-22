import numpy as np
from scipy import stats
from typing import List, Dict, Any
import pandas as pd
from datetime import datetime, timedelta

class RiskAnalysis:
    def __init__(self, historical_data: pd.DataFrame):
        """
        Initialize risk analysis with historical price data.
        
        Args:
            historical_data: DataFrame with columns ['date', 'symbol', 'price', 'quantity']
        """
        self.historical_data = historical_data
        self.returns = self._calculate_returns()
        self.portfolio_value = self._calculate_portfolio_value()

    def _calculate_returns(self) -> pd.DataFrame:
        """Calculate daily returns for each asset."""
        returns = self.historical_data.pivot(
            index='date', 
            columns='symbol', 
            values='price'
        ).pct_change()
        returns.fillna(0, inplace=True)
        return returns

    def _calculate_portfolio_value(self) -> float:
        """Calculate current portfolio value."""
        latest = self.historical_data.groupby('symbol').last()
        return (latest['price'] * latest['quantity']).sum()

    def calculate_var(self, confidence_level: float = 0.95, time_horizon: int = 1) -> Dict[str, float]:
        """
        Calculate Value at Risk using parametric method.
        
        Args:
            confidence_level: Confidence level for VaR calculation (default: 0.95)
            time_horizon: Time horizon in days (default: 1)
            
        Returns:
            Dictionary containing VaR metrics
        """
        # Calculate portfolio returns
        weights = self.historical_data.groupby('symbol')['quantity'].last()
        weights = weights * self.historical_data.groupby('symbol')['price'].last()
        weights = weights / weights.sum()

        portfolio_returns = self.returns.dot(weights)
        
        # Calculate VaR
        mean = portfolio_returns.mean()
        std = portfolio_returns.std()
        z_score = stats.norm.ppf(1 - confidence_level)
        
        var_daily = -(mean + z_score * std) * self.portfolio_value
        var_period = var_daily * np.sqrt(time_horizon)
        
        return {
            'var_amount': var_period,
            'var_percentage': (var_period / self.portfolio_value) * 100,
            'confidence_level': confidence_level,
            'time_horizon': time_horizon
        }

    def monte_carlo_simulation(
        self, 
        num_simulations: int = 10000, 
        time_horizon: int = 252,
        confidence_level: float = 0.95
    ) -> Dict[str, Any]:
        """
        Perform Monte Carlo simulation for portfolio value prediction.
        
        Args:
            num_simulations: Number of simulation paths
            time_horizon: Time horizon in days
            confidence_level: Confidence level for VaR calculation
            
        Returns:
            Dictionary containing simulation results
        """
        # Calculate mean returns and covariance matrix
        mean_returns = self.returns.mean()
        cov_matrix = self.returns.cov()
        
        # Current weights
        weights = self.historical_data.groupby('symbol')['quantity'].last()
        weights = weights * self.historical_data.groupby('symbol')['price'].last()
        weights = weights / weights.sum()
        
        # Generate random returns
        np.random.seed(42)  # For reproducibility
        simulated_returns = np.random.multivariate_normal(
            mean_returns,
            cov_matrix,
            (num_simulations, time_horizon)
        )
        
        # Calculate portfolio values
        portfolio_values = np.zeros((num_simulations, time_horizon))
        portfolio_values[:, 0] = self.portfolio_value
        
        for t in range(1, time_horizon):
            portfolio_values[:, t] = portfolio_values[:, t-1] * (1 + simulated_returns[:, t].dot(weights))
        
        # Calculate metrics
        final_values = portfolio_values[:, -1]
        var_index = int(num_simulations * (1 - confidence_level))
        sorted_values = np.sort(final_values)
        
        return {
            'var_amount': self.portfolio_value - sorted_values[var_index],
            'expected_value': np.mean(final_values),
            'worst_case': np.min(final_values),
            'best_case': np.max(final_values),
            'percentiles': {
                '5th': np.percentile(final_values, 5),
                '25th': np.percentile(final_values, 25),
                '50th': np.percentile(final_values, 50),
                '75th': np.percentile(final_values, 75),
                '95th': np.percentile(final_values, 95)
            },
            'simulation_paths': portfolio_values.tolist()
        }

    def calculate_risk_metrics(self) -> Dict[str, Any]:
        """Calculate comprehensive risk metrics for the portfolio."""
        # Calculate portfolio returns
        weights = self.historical_data.groupby('symbol')['quantity'].last()
        weights = weights * self.historical_data.groupby('symbol')['price'].last()
        weights = weights / weights.sum()
        portfolio_returns = self.returns.dot(weights)

        # Risk-free rate (assuming 2% annual rate)
        risk_free_rate = 0.02 / 252  # Daily rate

        # Calculate metrics
        sharpe_ratio = (portfolio_returns.mean() - risk_free_rate) / portfolio_returns.std() * np.sqrt(252)
        sortino_ratio = (portfolio_returns.mean() - risk_free_rate) / portfolio_returns[portfolio_returns < 0].std() * np.sqrt(252)
        max_drawdown = (portfolio_returns.cumsum() - portfolio_returns.cumsum().cummax()).min()

        return {
            'sharpe_ratio': sharpe_ratio,
            'sortino_ratio': sortino_ratio,
            'max_drawdown': max_drawdown,
            'volatility': portfolio_returns.std() * np.sqrt(252),
            'skewness': stats.skew(portfolio_returns),
            'kurtosis': stats.kurtosis(portfolio_returns),
            'var_metrics': self.calculate_var(),
            'correlation_matrix': self.returns.corr().to_dict(),
            'beta': self._calculate_portfolio_beta()
        }

    def _calculate_portfolio_beta(self) -> float:
        """Calculate portfolio beta using market returns."""
        # Assuming first asset is market benchmark
        market_returns = self.returns.iloc[:, 0]
        portfolio_returns = self.returns.dot(
            self.historical_data.groupby('symbol')['quantity'].last() * 
            self.historical_data.groupby('symbol')['price'].last() /
            self.portfolio_value
        )
        
        covariance = np.cov(portfolio_returns, market_returns)[0][1]
        market_variance = np.var(market_returns)
        
        return covariance / market_variance if market_variance != 0 else 1.0

    def stress_test(self, scenarios: List[Dict[str, float]]) -> Dict[str, float]:
        """
        Perform stress testing under different scenarios.
        
        Args:
            scenarios: List of dictionaries with percentage changes for each asset
            
        Returns:
            Dictionary with portfolio values under each scenario
        """
        results = {}
        
        for i, scenario in enumerate(scenarios):
            # Calculate new portfolio value under scenario
            latest = self.historical_data.groupby('symbol').last()
            scenario_value = sum(
                latest.loc[symbol, 'quantity'] * 
                latest.loc[symbol, 'price'] * 
                (1 + change/100)
                for symbol, change in scenario.items()
            )
            
            results[f'scenario_{i+1}'] = {
                'portfolio_value': scenario_value,
                'change_percentage': ((scenario_value - self.portfolio_value) / self.portfolio_value) * 100
            }
            
        return results