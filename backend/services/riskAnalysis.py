import numpy as np
from scipy import stats
from typing import List, Dict, Any, Optional
import pandas as pd
from datetime import datetime, timedelta
from sklearn.mixture import GaussianMixture
from scipy.stats import norm, t

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
        self.weights = self._calculate_weights()

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

    def _calculate_weights(self) -> pd.Series:
        """Calculate current portfolio weights."""
        latest = self.historical_data.groupby('symbol').last()
        weights = latest['quantity'] * latest['price']
        return weights / weights.sum()

    def calculate_var(
        self, 
        confidence_level: float = 0.95, 
        time_horizon: int = 1,
        method: str = 'historical'
    ) -> Dict[str, float]:
        """
        Calculate Value at Risk using multiple methods.
        
        Args:
            confidence_level: Confidence level for VaR calculation
            time_horizon: Time horizon in days
            method: Method to use ('historical', 'parametric', 'monte_carlo')
            
        Returns:
            Dictionary containing VaR metrics using different methods
        """
        portfolio_returns = self.returns.dot(self.weights)
        
        results = {}
        
        # Historical VaR
        if method == 'historical' or method == 'all':
            historical_var = -np.percentile(portfolio_returns, (1 - confidence_level) * 100)
            results['historical_var'] = historical_var * self.portfolio_value * np.sqrt(time_horizon)
        
        # Parametric VaR
        if method == 'parametric' or method == 'all':
            mean = portfolio_returns.mean()
            std = portfolio_returns.std()
            z_score = stats.norm.ppf(1 - confidence_level)
            parametric_var = -(mean + z_score * std) * self.portfolio_value * np.sqrt(time_horizon)
            results['parametric_var'] = parametric_var
        
        # Monte Carlo VaR
        if method == 'monte_carlo' or method == 'all':
            mc_results = self.monte_carlo_simulation(
                confidence_level=confidence_level,
                time_horizon=time_horizon
            )
            results['monte_carlo_var'] = mc_results['var_amount']
        
        results.update({
            'confidence_level': confidence_level,
            'time_horizon': time_horizon,
            'method': method
        })
        
        return results

    def monte_carlo_simulation(
        self, 
        num_simulations: int = 10000, 
        time_horizon: int = 252,
        confidence_level: float = 0.95,
        use_t_distribution: bool = True,
        num_mixture_components: int = 2
    ) -> Dict[str, Any]:
        """
        Enhanced Monte Carlo simulation with multiple distribution models.
        
        Args:
            num_simulations: Number of simulation paths
            time_horizon: Time horizon in days
            confidence_level: Confidence level for VaR calculation
            use_t_distribution: Whether to use Student's t-distribution
            num_mixture_components: Number of components for GMM
        """
        mean_returns = self.returns.mean()
        cov_matrix = self.returns.cov()
        
        # Generate random returns using different distributions
        simulated_returns_normal = np.random.multivariate_normal(
            mean_returns,
            cov_matrix,
            (num_simulations, time_horizon)
        )
        
        # Student's t-distribution for fat tails
        if use_t_distribution:
            df = 5  # degrees of freedom
            simulated_returns_t = np.random.standard_t(df, (num_simulations, time_horizon, len(mean_returns)))
            simulated_returns_t = simulated_returns_t * np.sqrt((df-2)/df) * np.sqrt(np.diag(cov_matrix))
            
        # Gaussian Mixture Model
        gmm = GaussianMixture(n_components=num_mixture_components)
        gmm.fit(self.returns)
        simulated_returns_gmm = gmm.sample(num_simulations * time_horizon)[0].reshape(num_simulations, time_horizon, -1)
        
        # Calculate portfolio values for each method
        portfolio_values = {
            'normal': self._calculate_portfolio_paths(simulated_returns_normal),
            't_dist': self._calculate_portfolio_paths(simulated_returns_t) if use_t_distribution else None,
            'gmm': self._calculate_portfolio_paths(simulated_returns_gmm)
        }
        
        results = {}
        for method, values in portfolio_values.items():
            if values is not None:
                final_values = values[:, -1]
                var_index = int(num_simulations * (1 - confidence_level))
                sorted_values = np.sort(final_values)
                
                results[method] = {
                    'var_amount': self.portfolio_value - sorted_values[var_index],
                    'expected_value': np.mean(final_values),
                    'worst_case': np.min(final_values),
                    'best_case': np.max(final_values),
                    'percentiles': {
                        '1st': np.percentile(final_values, 1),
                        '5th': np.percentile(final_values, 5),
                        '25th': np.percentile(final_values, 25),
                        '50th': np.percentile(final_values, 50),
                        '75th': np.percentile(final_values, 75),
                        '95th': np.percentile(final_values, 95),
                        '99th': np.percentile(final_values, 99)
                    }
                }
        
        # Add stress scenarios
        stress_scenarios = self._generate_stress_scenarios()
        for scenario, values in stress_scenarios.items():
            results[f'stress_{scenario}'] = values
        
        return results

    def _calculate_portfolio_paths(self, simulated_returns: np.ndarray) -> np.ndarray:
        """Calculate portfolio value paths from simulated returns."""
        portfolio_values = np.zeros((simulated_returns.shape[0], simulated_returns.shape[1]))
        portfolio_values[:, 0] = self.portfolio_value
        
        for t in range(1, simulated_returns.shape[1]):
            portfolio_values[:, t] = portfolio_values[:, t-1] * (1 + simulated_returns[:, t].dot(self.weights))
            
        return portfolio_values

    def _generate_stress_scenarios(self) -> Dict[str, Dict[str, float]]:
        """Generate stress test scenarios based on historical events."""
        scenarios = {
            'market_crash': {'shock': -0.20, 'correlation': 0.8},
            'recession': {'shock': -0.30, 'duration': 180},
            'recovery': {'shock': 0.15, 'duration': 90},
            'stagflation': {'shock': -0.10, 'inflation': 0.08},
            'tech_bubble': {'shock': -0.40, 'sector_specific': True}
        }
        
        results = {}
        for scenario, params in scenarios.items():
            shocked_value = self._calculate_stressed_portfolio_value(params)
            results[scenario] = {
                'portfolio_value': shocked_value,
                'change_percentage': ((shocked_value - self.portfolio_value) / self.portfolio_value) * 100,
                'parameters': params
            }
            
        return results

    def _calculate_stressed_portfolio_value(self, stress_params: Dict[str, Any]) -> float:
        """Calculate portfolio value under stress conditions."""
        shock = stress_params.get('shock', 0)
        correlation = stress_params.get('correlation', 0.5)
        
        # Apply correlation-weighted shock to portfolio
        shocked_weights = self.weights * (1 + shock * correlation)
        return shocked_weights.sum()

    def calculate_risk_metrics(self) -> Dict[str, Any]:
        """Calculate comprehensive risk metrics for the portfolio."""
        portfolio_returns = self.returns.dot(self.weights)
        
        # Risk-free rate (using 10-year Treasury yield as proxy)
        risk_free_rate = 0.04 / 252  # Daily rate
        
        # Calculate advanced metrics
        metrics = {
            'sharpe_ratio': self._calculate_sharpe_ratio(portfolio_returns, risk_free_rate),
            'sortino_ratio': self._calculate_sortino_ratio(portfolio_returns, risk_free_rate),
            'treynor_ratio': self._calculate_treynor_ratio(portfolio_returns, risk_free_rate),
            'information_ratio': self._calculate_information_ratio(portfolio_returns),
            'max_drawdown': self._calculate_max_drawdown(portfolio_returns),
            'volatility': portfolio_returns.std() * np.sqrt(252),
            'downside_deviation': self._calculate_downside_deviation(portfolio_returns),
            'skewness': stats.skew(portfolio_returns),
            'kurtosis': stats.kurtosis(portfolio_returns),
            'var_metrics': self.calculate_var(method='all'),
            'correlation_matrix': self.returns.corr().to_dict(),
            'beta': self._calculate_portfolio_beta(),
            'tail_risk_metrics': self._calculate_tail_risk_metrics(portfolio_returns)
        }
        
        return metrics

    def _calculate_tail_risk_metrics(self, returns: pd.Series) -> Dict[str, float]:
        """Calculate tail risk metrics."""
        return {
            'expected_shortfall_95': self._calculate_expected_shortfall(returns, 0.95),
            'expected_shortfall_99': self._calculate_expected_shortfall(returns, 0.99),
            'tail_ratio': np.abs(np.percentile(returns, 95) / np.percentile(returns, 5)),
            'tail_dependence': self._calculate_tail_dependence()
        }

    def _calculate_expected_shortfall(self, returns: pd.Series, confidence_level: float) -> float:
        """Calculate Expected Shortfall (Conditional VaR)."""
        var = np.percentile(returns, (1 - confidence_level) * 100)
        return -returns[returns <= var].mean()

    def _calculate_tail_dependence(self) -> float:
        """Calculate tail dependence coefficient."""
        # Simplified implementation using correlation in the tails
        threshold = 0.1  # 10th percentile
        tail_events = self.returns <= self.returns.quantile(threshold)
        return tail_events.corr().mean().mean()

    def _calculate_sharpe_ratio(self, returns: pd.Series, risk_free_rate: float) -> float:
        """Calculate annualized Sharpe ratio."""
        excess_returns = returns - risk_free_rate
        return np.sqrt(252) * excess_returns.mean() / returns.std()

    def _calculate_sortino_ratio(self, returns: pd.Series, risk_free_rate: float) -> float:
        """Calculate Sortino ratio using downside deviation."""
        excess_returns = returns - risk_free_rate
        downside_std = self._calculate_downside_deviation(returns)
        return np.sqrt(252) * excess_returns.mean() / downside_std

    def _calculate_downside_deviation(self, returns: pd.Series) -> float:
        """Calculate downside deviation."""
        negative_returns = returns[returns < 0]
        return np.sqrt(np.mean(negative_returns**2))

    def _calculate_max_drawdown(self, returns: pd.Series) -> float:
        """Calculate maximum drawdown."""
        cumulative_returns = (1 + returns).cumprod()
        rolling_max = cumulative_returns.expanding().max()
        drawdowns = cumulative_returns / rolling_max - 1
        return drawdowns.min()

    def _calculate_treynor_ratio(self, returns: pd.Series, risk_free_rate: float) -> float:
        """Calculate Treynor ratio."""
        excess_returns = returns - risk_free_rate
        beta = self._calculate_portfolio_beta()
        return np.sqrt(252) * excess_returns.mean() / beta

    def _calculate_information_ratio(self, returns: pd.Series) -> float:
        """Calculate Information ratio."""
        # Using first asset as benchmark
        benchmark_returns = self.returns.iloc[:, 0]
        active_returns = returns - benchmark_returns
        return np.sqrt(252) * active_returns.mean() / active_returns.std()

    def _calculate_portfolio_beta(self) -> float:
        """Calculate portfolio beta using market returns."""
        market_returns = self.returns.iloc[:, 0]
        portfolio_returns = self.returns.dot(self.weights)
        
        covariance = np.cov(portfolio_returns, market_returns)[0][1]
        market_variance = np.var(market_returns)
        
        return covariance / market_variance if market_variance != 0 else 1.0