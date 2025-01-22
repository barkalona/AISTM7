from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import pandas as pd
from pydantic import BaseModel
from services.portfolioOptimization import PortfolioOptimizer
from services.ibkrService import IBKRService
from utils.auth import get_current_user

router = APIRouter()

class OptimizationRequest(BaseModel):
    risk_tolerance: str = 'moderate'
    min_weight: float = 0.0
    max_weight: float = 1.0
    risk_free_rate: float = 0.02

class RebalanceRequest(BaseModel):
    target_weights: Dict[str, float]
    min_trade_size: float = 100.0

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
                    'price': price
                })
        
        return pd.DataFrame(historical_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching historical data: {str(e)}")

@router.post("/portfolio/optimize")
async def optimize_portfolio(
    request: OptimizationRequest,
    user = Depends(get_current_user)
) -> Dict:
    """
    Optimize portfolio allocation based on risk tolerance.
    
    Returns optimized portfolio weights and performance metrics.
    """
    try:
        # Get historical data
        historical_data = get_historical_data(user.id)
        
        # Initialize optimizer
        optimizer = PortfolioOptimizer(
            historical_data=historical_data,
            risk_free_rate=request.risk_free_rate,
            min_weight=request.min_weight,
            max_weight=request.max_weight
        )
        
        # Get recommendations
        recommendations = optimizer.get_portfolio_recommendations(
            risk_tolerance=request.risk_tolerance
        )
        
        # Format response
        response = {}
        for strategy, result in recommendations.items():
            response[strategy] = {
                'weights': result.weights,
                'expected_return': result.expected_return,
                'volatility': result.volatility,
                'sharpe_ratio': result.sharpe_ratio,
                'efficient_frontier': result.efficient_frontier
            }
            
        return {
            "status": "success",
            "data": response,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/portfolio/rebalance")
async def calculate_rebalancing_trades(
    request: RebalanceRequest,
    user = Depends(get_current_user)
) -> Dict:
    """
    Calculate required trades to rebalance portfolio to target weights.
    """
    try:
        ibkr_service = IBKRService()
        
        # Get current portfolio positions
        positions = ibkr_service.get_portfolio_positions(user.id)
        
        # Calculate current portfolio value and weights
        portfolio_value = sum(pos['market_value'] for pos in positions)
        current_weights = {
            pos['symbol']: pos['market_value'] / portfolio_value
            for pos in positions
        }
        
        # Get historical data for optimization
        historical_data = get_historical_data(user.id)
        
        # Initialize optimizer
        optimizer = PortfolioOptimizer(historical_data=historical_data)
        
        # Calculate required trades
        trades = optimizer.get_rebalancing_trades(
            current_weights=current_weights,
            target_weights=request.target_weights,
            portfolio_value=portfolio_value,
            min_trade_size=request.min_trade_size
        )
        
        return {
            "status": "success",
            "data": {
                "current_weights": current_weights,
                "target_weights": request.target_weights,
                "portfolio_value": portfolio_value,
                "required_trades": trades
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/portfolio/efficient-frontier")
async def get_efficient_frontier(
    user = Depends(get_current_user),
    points: int = 50
) -> Dict:
    """
    Generate efficient frontier points for portfolio visualization.
    """
    try:
        # Get historical data
        historical_data = get_historical_data(user.id)
        
        # Initialize optimizer
        optimizer = PortfolioOptimizer(historical_data=historical_data)
        
        # Get optimal portfolio for reference
        optimal_portfolio = optimizer.optimize_portfolio(objective='sharpe')
        
        # Generate efficient frontier
        frontier_points = optimizer._generate_efficient_frontier(points=points)
        
        return {
            "status": "success",
            "data": {
                "efficient_frontier": frontier_points,
                "optimal_portfolio": {
                    "weights": optimal_portfolio.weights,
                    "return": optimal_portfolio.expected_return,
                    "volatility": optimal_portfolio.volatility,
                    "sharpe_ratio": optimal_portfolio.sharpe_ratio
                }
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/portfolio/current-allocation")
async def get_current_allocation(
    user = Depends(get_current_user)
) -> Dict:
    """
    Get current portfolio allocation and performance metrics.
    """
    try:
        ibkr_service = IBKRService()
        
        # Get current portfolio positions
        positions = ibkr_service.get_portfolio_positions(user.id)
        
        # Calculate current portfolio value and weights
        portfolio_value = sum(pos['market_value'] for pos in positions)
        current_weights = {
            pos['symbol']: pos['market_value'] / portfolio_value
            for pos in positions
        }
        
        # Get historical data for performance metrics
        historical_data = get_historical_data(user.id)
        optimizer = PortfolioOptimizer(historical_data=historical_data)
        
        # Calculate current portfolio metrics
        current_weights_array = [current_weights.get(symbol, 0) for symbol in optimizer.symbols]
        returns, volatility, sharpe = optimizer._portfolio_stats(current_weights_array)
        
        return {
            "status": "success",
            "data": {
                "portfolio_value": portfolio_value,
                "current_weights": current_weights,
                "metrics": {
                    "expected_return": returns,
                    "volatility": volatility,
                    "sharpe_ratio": sharpe
                }
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))