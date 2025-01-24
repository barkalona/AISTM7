from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
import pandas as pd
from datetime import datetime, timedelta
from ..services.riskAnalysis import RiskAnalysis
from ..services.ibkrService import IBKRService
from ..utils.validation import validate_portfolio_data

router = APIRouter()
ibkr_service = IBKRService()

@router.get("/portfolio/risk-metrics")
async def get_risk_metrics(
    account_id: str,
    time_horizon: int = Query(default=252, ge=1, le=1000),
    confidence_level: float = Query(default=0.95, ge=0.8, le=0.99),
    use_t_distribution: bool = Query(default=True),
    num_simulations: int = Query(default=10000, ge=1000, le=100000)
) -> Dict[str, Any]:
    """
    Calculate comprehensive risk metrics for the portfolio.
    
    Args:
        account_id: IBKR account ID
        time_horizon: Time horizon in days for simulations
        confidence_level: Confidence level for VaR calculations
        use_t_distribution: Whether to use Student's t-distribution for fat tails
        num_simulations: Number of Monte Carlo simulations
    """
    try:
        # Fetch portfolio data from IBKR
        portfolio_data = await ibkr_service.get_portfolio_data(account_id)
        historical_data = await ibkr_service.get_historical_data(
            symbols=portfolio_data['symbols'],
            lookback_days=max(252, time_horizon)  # At least 1 year of data
        )
        
        # Validate data
        validate_portfolio_data(portfolio_data, historical_data)
        
        # Initialize risk analysis
        risk_analyzer = RiskAnalysis(historical_data)
        
        # Calculate comprehensive risk metrics
        risk_metrics = risk_analyzer.calculate_risk_metrics()
        
        # Run Monte Carlo simulation with multiple methods
        simulation_results = risk_analyzer.monte_carlo_simulation(
            num_simulations=num_simulations,
            time_horizon=time_horizon,
            confidence_level=confidence_level,
            use_t_distribution=use_t_distribution
        )
        
        # Combine results
        return {
            "portfolio_metrics": {
                "current_value": risk_analyzer.portfolio_value,
                "daily_metrics": risk_metrics,
                "monte_carlo_results": simulation_results,
                "var_analysis": risk_analyzer.calculate_var(
                    confidence_level=confidence_level,
                    time_horizon=time_horizon,
                    method='all'
                )
            },
            "metadata": {
                "calculation_time": datetime.now().isoformat(),
                "parameters": {
                    "time_horizon": time_horizon,
                    "confidence_level": confidence_level,
                    "num_simulations": num_simulations,
                    "use_t_distribution": use_t_distribution
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/portfolio/stress-test")
async def run_stress_test(
    account_id: str,
    scenarios: Optional[List[Dict[str, float]]] = None
) -> Dict[str, Any]:
    """
    Run stress tests on the portfolio using predefined or custom scenarios.
    
    Args:
        account_id: IBKR account ID
        scenarios: Optional list of custom stress scenarios
    """
    try:
        # Fetch portfolio data
        portfolio_data = await ibkr_service.get_portfolio_data(account_id)
        historical_data = await ibkr_service.get_historical_data(
            symbols=portfolio_data['symbols'],
            lookback_days=252
        )
        
        # Initialize risk analysis
        risk_analyzer = RiskAnalysis(historical_data)
        
        # Run Monte Carlo with stress scenarios
        stress_results = risk_analyzer.monte_carlo_simulation(
            num_simulations=5000,  # Fewer simulations for stress testing
            time_horizon=252,
            confidence_level=0.99,
            use_t_distribution=True
        )
        
        # Extract stress test results
        stress_scenarios = {
            k: v for k, v in stress_results.items() 
            if k.startswith('stress_')
        }
        
        # Add custom scenarios if provided
        if scenarios:
            custom_results = risk_analyzer.stress_test(scenarios)
            stress_scenarios.update({
                f'custom_scenario_{i+1}': result 
                for i, result in enumerate(custom_results.values())
            })
        
        return {
            "stress_test_results": stress_scenarios,
            "metadata": {
                "calculation_time": datetime.now().isoformat(),
                "num_scenarios": len(stress_scenarios)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/portfolio/var-analysis")
async def get_var_analysis(
    account_id: str,
    confidence_level: float = Query(default=0.95, ge=0.8, le=0.99),
    time_horizon: int = Query(default=1, ge=1, le=252),
    method: str = Query(default='all', regex='^(historical|parametric|monte_carlo|all)$')
) -> Dict[str, Any]:
    """
    Calculate Value at Risk using multiple methods.
    
    Args:
        account_id: IBKR account ID
        confidence_level: Confidence level for VaR calculation
        time_horizon: Time horizon in days
        method: VaR calculation method
    """
    try:
        # Fetch portfolio data
        portfolio_data = await ibkr_service.get_portfolio_data(account_id)
        historical_data = await ibkr_service.get_historical_data(
            symbols=portfolio_data['symbols'],
            lookback_days=252
        )
        
        # Initialize risk analysis
        risk_analyzer = RiskAnalysis(historical_data)
        
        # Calculate VaR using specified method(s)
        var_results = risk_analyzer.calculate_var(
            confidence_level=confidence_level,
            time_horizon=time_horizon,
            method=method
        )
        
        return {
            "var_results": var_results,
            "metadata": {
                "calculation_time": datetime.now().isoformat(),
                "parameters": {
                    "confidence_level": confidence_level,
                    "time_horizon": time_horizon,
                    "method": method
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/portfolio/tail-risk")
async def get_tail_risk_metrics(
    account_id: str,
    lookback_days: int = Query(default=252, ge=30, le=1000)
) -> Dict[str, Any]:
    """
    Calculate tail risk metrics for the portfolio.
    
    Args:
        account_id: IBKR account ID
        lookback_days: Historical lookback period in days
    """
    try:
        # Fetch portfolio data
        portfolio_data = await ibkr_service.get_portfolio_data(account_id)
        historical_data = await ibkr_service.get_historical_data(
            symbols=portfolio_data['symbols'],
            lookback_days=lookback_days
        )
        
        # Initialize risk analysis
        risk_analyzer = RiskAnalysis(historical_data)
        
        # Calculate tail risk metrics
        risk_metrics = risk_analyzer.calculate_risk_metrics()
        tail_metrics = risk_metrics.get('tail_risk_metrics', {})
        
        return {
            "tail_risk_metrics": tail_metrics,
            "metadata": {
                "calculation_time": datetime.now().isoformat(),
                "lookback_period": lookback_days
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))