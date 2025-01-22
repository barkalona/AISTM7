from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import pandas as pd
from services.aiService import AIService
from services.ibkrService import IBKRService
from utils.auth import get_current_user

router = APIRouter()
ai_service = AIService()

def get_historical_data(
    symbol: str,
    days: int,
    user_id: str
) -> pd.DataFrame:
    """Fetch historical data for symbol."""
    try:
        ibkr_service = IBKRService()
        start_date = datetime.now() - timedelta(days=days)
        
        prices = ibkr_service.get_historical_prices(
            symbol,
            start_date,
            datetime.now(),
            user_id
        )
        
        return pd.DataFrame(prices)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching historical data: {str(e)}")

@router.post("/predict/{symbol}")
async def predict_price_movement(
    symbol: str,
    days: int = 60,
    user = Depends(get_current_user)
) -> Dict:
    """
    Predict future price movement for a symbol.
    
    Args:
        symbol: Trading symbol
        days: Number of days of historical data to use
    """
    try:
        # Get historical data
        historical_data = get_historical_data(symbol, days, user.id)
        
        # Make prediction
        prediction = ai_service.predict_price_movement(
            symbol,
            historical_data
        )
        
        return {
            "status": "success",
            "data": prediction,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/train/{symbol}")
async def train_prediction_model(
    symbol: str,
    days: int = 252,  # 1 year of data
    user = Depends(get_current_user)
) -> Dict:
    """
    Train prediction model for a symbol.
    
    Args:
        symbol: Trading symbol
        days: Number of days of historical data to use
    """
    try:
        # Get historical data
        historical_data = get_historical_data(symbol, days, user.id)
        
        # Train model
        metrics = ai_service.train_prediction_model(
            historical_data,
            symbol
        )
        
        return {
            "status": "success",
            "data": metrics,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sentiment/{symbol}")
async def get_market_sentiment(
    symbol: str,
    days: int = 14,
    user = Depends(get_current_user)
) -> Dict:
    """
    Get market sentiment analysis for a symbol.
    
    Args:
        symbol: Trading symbol
        days: Number of days of historical data to use
    """
    try:
        # Get historical data
        historical_data = get_historical_data(symbol, days, user.id)
        
        # Analyze sentiment
        sentiment = ai_service.analyze_market_sentiment(
            historical_data
        )
        
        return {
            "status": "success",
            "data": sentiment,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/anomalies/detect")
async def detect_anomalies(
    symbols: List[str],
    days: int = 30,
    contamination: float = 0.1,
    user = Depends(get_current_user)
) -> Dict:
    """
    Detect anomalies in price movements for multiple symbols.
    
    Args:
        symbols: List of trading symbols
        days: Number of days of historical data to use
        contamination: Expected proportion of outliers
    """
    try:
        results = {}
        for symbol in symbols:
            # Get historical data
            historical_data = get_historical_data(symbol, days, user.id)
            
            # Detect anomalies
            anomalies = ai_service.detect_anomalies(
                historical_data,
                contamination
            )
            
            # Get anomaly dates
            anomaly_dates = historical_data.index[anomalies].tolist()
            
            results[symbol] = {
                'anomaly_dates': anomaly_dates,
                'anomaly_count': len(anomaly_dates),
                'latest_anomaly': anomaly_dates[-1] if anomaly_dates else None
            }
        
        return {
            "status": "success",
            "data": results,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/portfolio/analysis")
async def analyze_portfolio(
    days: int = 30,
    user = Depends(get_current_user)
) -> Dict:
    """
    Perform AI analysis on the entire portfolio.
    
    Args:
        days: Number of days of historical data to use
    """
    try:
        ibkr_service = IBKRService()
        positions = ibkr_service.get_portfolio_positions(user.id)
        
        analysis = {
            'predictions': {},
            'sentiment': {},
            'anomalies': {},
            'portfolio_risk': {}
        }
        
        for position in positions:
            symbol = position['symbol']
            historical_data = get_historical_data(symbol, days, user.id)
            
            # Get predictions
            analysis['predictions'][symbol] = ai_service.predict_price_movement(
                symbol,
                historical_data
            )
            
            # Get sentiment
            analysis['sentiment'][symbol] = ai_service.analyze_market_sentiment(
                historical_data
            )
            
            # Detect anomalies
            anomalies = ai_service.detect_anomalies(historical_data)
            analysis['anomalies'][symbol] = {
                'has_recent_anomaly': anomalies[-1],
                'anomaly_count': anomalies.sum()
            }
        
        return {
            "status": "success",
            "data": analysis,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models/status")
async def get_model_status(
    user = Depends(get_current_user)
) -> Dict:
    """Get status of trained prediction models."""
    try:
        ibkr_service = IBKRService()
        positions = ibkr_service.get_portfolio_positions(user.id)
        
        status = {}
        for position in positions:
            symbol = position['symbol']
            model_path = f'{symbol}_prediction.h5'
            
            status[symbol] = {
                'has_model': os.path.exists(os.path.join(ai_service.model_path, model_path)),
                'last_trained': None  # TODO: Add last training timestamp
            }
        
        return {
            "status": "success",
            "data": status,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))