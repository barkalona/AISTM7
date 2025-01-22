from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

from services.notificationService import NotificationService
from utils.auth import get_current_user
from config.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()
notification_service = NotificationService()

class NotificationPreferences(BaseModel):
    """User notification preferences."""
    email_enabled: bool
    sms_enabled: bool
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    risk_alerts: bool = True
    anomaly_alerts: bool = True
    model_alerts: bool = True
    portfolio_summaries: bool = True

class NotificationRequest(BaseModel):
    """Notification request model."""
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    priority: str = 'normal'
    email: Optional[EmailStr] = None
    phone: Optional[str] = None

@router.post("/preferences")
async def set_notification_preferences(
    preferences: NotificationPreferences,
    user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Set user notification preferences.
    
    Args:
        preferences: Notification preferences
        user: Current user from auth
    """
    try:
        # Store preferences in user settings
        # This would typically be handled by a user service
        return {
            "status": "success",
            "message": "Notification preferences updated",
            "data": preferences.dict()
        }
    except Exception as e:
        logger.error(
            f"Error setting notification preferences: {e}",
            extra={'user_id': user.id}
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to update notification preferences"
        )

@router.get("/preferences")
async def get_notification_preferences(
    user = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get user notification preferences.
    
    Args:
        user: Current user from auth
    """
    try:
        # Fetch preferences from user settings
        # This would typically be handled by a user service
        preferences = NotificationPreferences(
            email_enabled=True,
            sms_enabled=False,
            email=user.email
        )
        
        return {
            "status": "success",
            "data": preferences.dict()
        }
    except Exception as e:
        logger.error(
            f"Error getting notification preferences: {e}",
            extra={'user_id': user.id}
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to get notification preferences"
        )

@router.post("/send")
async def send_notification(
    notification: NotificationRequest,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Send a notification.
    
    Args:
        notification: Notification details
        background_tasks: FastAPI background tasks
        user: Current user from auth
    """
    try:
        # Queue notification in background
        background_tasks.add_task(
            notification_service.queue_notification,
            notification_type=notification.type,
            user_id=user.id,
            title=notification.title,
            message=notification.message,
            data=notification.data,
            email=notification.email,
            phone=notification.phone,
            priority=notification.priority
        )
        
        return {
            "status": "success",
            "message": "Notification queued successfully"
        }
    except Exception as e:
        logger.error(
            f"Error sending notification: {e}",
            extra={
                'user_id': user.id,
                'notification': notification.dict()
            }
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to send notification"
        )

@router.post("/risk-alert")
async def send_risk_alert(
    risk_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Send a risk alert notification.
    
    Args:
        risk_data: Risk analysis data
        background_tasks: FastAPI background tasks
        user: Current user from auth
    """
    try:
        # Get user preferences
        preferences = await get_notification_preferences(user)
        
        if preferences['data']['risk_alerts']:
            background_tasks.add_task(
                notification_service.send_risk_alert,
                user_id=user.id,
                risk_data=risk_data,
                email=preferences['data']['email'] if preferences['data']['email_enabled'] else None,
                phone=preferences['data']['phone'] if preferences['data']['sms_enabled'] else None
            )
            
        return {
            "status": "success",
            "message": "Risk alert queued successfully"
        }
    except Exception as e:
        logger.error(
            f"Error sending risk alert: {e}",
            extra={
                'user_id': user.id,
                'risk_data': risk_data
            }
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to send risk alert"
        )

@router.post("/anomaly-alert")
async def send_anomaly_alert(
    anomaly_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Send an anomaly detection alert.
    
    Args:
        anomaly_data: Anomaly detection data
        background_tasks: FastAPI background tasks
        user: Current user from auth
    """
    try:
        # Get user preferences
        preferences = await get_notification_preferences(user)
        
        if preferences['data']['anomaly_alerts']:
            background_tasks.add_task(
                notification_service.send_anomaly_alert,
                user_id=user.id,
                anomaly_data=anomaly_data,
                email=preferences['data']['email'] if preferences['data']['email_enabled'] else None,
                phone=preferences['data']['phone'] if preferences['data']['sms_enabled'] else None
            )
            
        return {
            "status": "success",
            "message": "Anomaly alert queued successfully"
        }
    except Exception as e:
        logger.error(
            f"Error sending anomaly alert: {e}",
            extra={
                'user_id': user.id,
                'anomaly_data': anomaly_data
            }
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to send anomaly alert"
        )

@router.post("/model-alert")
async def send_model_alert(
    model_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Send a model performance alert.
    
    Args:
        model_data: Model metrics data
        background_tasks: FastAPI background tasks
        user: Current user from auth
    """
    try:
        # Get user preferences
        preferences = await get_notification_preferences(user)
        
        if preferences['data']['model_alerts']:
            background_tasks.add_task(
                notification_service.send_model_alert,
                user_id=user.id,
                model_data=model_data,
                email=preferences['data']['email'] if preferences['data']['email_enabled'] else None
            )
            
        return {
            "status": "success",
            "message": "Model alert queued successfully"
        }
    except Exception as e:
        logger.error(
            f"Error sending model alert: {e}",
            extra={
                'user_id': user.id,
                'model_data': model_data
            }
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to send model alert"
        )

@router.post("/portfolio-summary")
async def send_portfolio_summary(
    portfolio_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
) -> Dict[str, str]:
    """
    Send a portfolio summary notification.
    
    Args:
        portfolio_data: Portfolio summary data
        background_tasks: FastAPI background tasks
        user: Current user from auth
    """
    try:
        # Get user preferences
        preferences = await get_notification_preferences(user)
        
        if preferences['data']['portfolio_summaries']:
            background_tasks.add_task(
                notification_service.send_portfolio_summary,
                user_id=user.id,
                portfolio_data=portfolio_data,
                email=preferences['data']['email'] if preferences['data']['email_enabled'] else None
            )
            
        return {
            "status": "success",
            "message": "Portfolio summary queued successfully"
        }
    except Exception as e:
        logger.error(
            f"Error sending portfolio summary: {e}",
            extra={
                'user_id': user.id,
                'portfolio_data': portfolio_data
            }
        )
        raise HTTPException(
            status_code=500,
            detail="Failed to send portfolio summary"
        )