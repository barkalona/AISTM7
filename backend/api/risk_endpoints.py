from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
from services.riskAnalysis import RiskAnalysis
from services.ibkrService import IBKRService
from models.portfolio import PortfolioData
from utils.auth import get_current_user

router = APIRouter()

def get_historical_data(user_id: str, days: int = 252) -> pd.DataFrame:
    """Fetch historical data for user's portfolio."""
    try:
        ibkr_service = IBKRService()
        start_date = datetime.now() - timedelta(days=days)
        
        # Get current portfolio positions
        positions = ibkr_service.get_portfolio_positions(user_id)
        
        # Fetch historical data for each position
        historical_data = []
        for position in positions:
            prices = ibkr_service.get_historical_prices(
                position['symbol'],
                start_date,
                datetime.now()
            )
            for date, price in prices.items():
                historical_data.append({
                    'date': date,
                    'symbol': position['symbol'],
                    'price': price,
                    'quantity': position['quantity']
                })
        
        return pd.DataFrame(historical_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching historical data: {str(e)}")

@router.get("/portfolio/risk-metrics")
async def get_risk_metrics(
    user = Depends(get_current_user),
    time_horizon: int = 252,
    confidence_level: float = 0.95
) -> Dict[str, Any]:
    """
    Calculate comprehensive risk metrics for the user's portfolio.
    
    Args:
        time_horizon: Time horizon in days for calculations
        confidence_level: Confidence level for VaR calculations
    """
    try:
        # Get historical data
        historical_data = get_historical_data(user.id, time_horizon)
        
        # Initialize risk analysis
        risk_analyzer = RiskAnalysis(historical_data)
        
        # Calculate all risk metrics
        metrics = risk_analyzer.calculate_risk_metrics()
        
        return {
            "status": "success",
            "data": metrics,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/portfolio/monte-carlo")
async def run_monte_carlo(
    user = Depends(get_current_user),
    num_simulations: int = 10000,
    time_horizon: int = 252,
    confidence_level: float = 0.95
) -> Dict[str, Any]:
    """
    Run Monte Carlo simulation for portfolio value prediction.
    
    Args:
        num_simulations: Number of simulation paths
        time_horizon: Time horizon in days
        confidence_level: Confidence level for VaR calculation
    """
    try:
        # Get historical data
        historical_data = get_historical_data(user.id)
        
        # Initialize risk analysis
        risk_analyzer = RiskAnalysis(historical_data)
        
        # Run simulation
        simulation_results = risk_analyzer.monte_carlo_simulation(
            num_simulations=num_simulations,
            time_horizon=time_horizon,
            confidence_level=confidence_level
        )
        
        return {
            "status": "success",
            "data": simulation_results,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/portfolio/stress-test")
async def run_stress_test(
    scenarios: List[Dict[str, float]],
    user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Run stress tests on the portfolio using provided scenarios.
    
    Args:
        scenarios: List of dictionaries with percentage changes for each asset
    """
    try:
        # Get historical data
        historical_data = get_historical_data(user.id)
        
        # Initialize risk analysis
        risk_analyzer = RiskAnalysis(historical_data)
        
        # Run stress tests
        stress_test_results = risk_analyzer.stress_test(scenarios)
        
        return {
            "status": "success",
            "data": stress_test_results,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/portfolio/var")
async def calculate_var(
    user = Depends(get_current_user),
    confidence_level: float = 0.95,
    time_horizon: int = 1
) -> Dict[str, Any]:
    """
    Calculate Value at Risk for the portfolio.
    
    Args:
        confidence_level: Confidence level for VaR calculation
        time_horizon: Time horizon in days
    """
    try:
        # Get historical data
        historical_data = get_historical_data(user.id)
        
        # Initialize risk analysis
        risk_analyzer = RiskAnalysis(historical_data)
        
        # Calculate VaR
        var_results = risk_analyzer.calculate_var(
            confidence_level=confidence_level,
            time_horizon=time_horizon
        )
        
        return {
            "status": "success",
            "data": var_results,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/portfolio/correlation")
async def get_correlation_matrix(
    user = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get correlation matrix for portfolio assets."""
    try:
        # Get historical data
        historical_data = get_historical_data(user.id)
        
        # Initialize risk analysis
        risk_analyzer = RiskAnalysis(historical_data)
        
        # Get correlation matrix from risk metrics
        metrics = risk_analyzer.calculate_risk_metrics()
        
        return {
            "status": "success",
            "data": metrics['correlation_matrix'],
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))