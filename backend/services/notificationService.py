import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any, Optional
import requests
from datetime import datetime, timedelta
import asyncio
from concurrent.futures import ThreadPoolExecutor

from config.settings import settings
from config.logging import get_logger

logger = get_logger(__name__)

class NotificationService:
    """Service for sending notifications through various channels."""
    
    def __init__(self):
        """Initialize notification service."""
        self.smtp_config = {
            'host': settings.SMTP_HOST,
            'port': settings.SMTP_PORT,
            'user': settings.SMTP_USER,
            'password': settings.SMTP_PASSWORD,
            'from_email': settings.EMAIL_FROM
        }
        
        self.executor = ThreadPoolExecutor(max_workers=4)
        self._notification_queue = asyncio.Queue()
        self._last_notification = {}  # Track last notification time per user
        
    async def start(self):
        """Start notification processing."""
        asyncio.create_task(self._process_notification_queue())
        
    async def stop(self):
        """Stop notification processing."""
        await self._notification_queue.join()
        self.executor.shutdown()

    def _check_cooldown(
        self,
        user_id: str,
        notification_type: str
    ) -> bool:
        """
        Check if notification cooldown period has elapsed.
        
        Args:
            user_id: User ID
            notification_type: Type of notification
            
        Returns:
            True if cooldown period has elapsed
        """
        key = f"{user_id}:{notification_type}"
        last_time = self._last_notification.get(key)
        
        if last_time is None:
            return True
            
        cooldown = timedelta(minutes=settings.NOTIFICATION_COOLDOWN_MINUTES)
        return datetime.now() - last_time > cooldown

    def _update_cooldown(
        self,
        user_id: str,
        notification_type: str
    ) -> None:
        """Update last notification timestamp."""
        key = f"{user_id}:{notification_type}"
        self._last_notification[key] = datetime.now()

    async def _process_notification_queue(self):
        """Process notifications from queue."""
        while True:
            try:
                notification = await self._notification_queue.get()
                
                if self._check_cooldown(
                    notification['user_id'],
                    notification['type']
                ):
                    # Process notification based on type and channel
                    if notification.get('email'):
                        await self._send_email_notification(notification)
                        
                    if notification.get('sms'):
                        await self._send_sms_notification(notification)
                        
                    self._update_cooldown(
                        notification['user_id'],
                        notification['type']
                    )
                    
                self._notification_queue.task_done()
                
            except Exception as e:
                logger.error(
                    f"Error processing notification: {e}",
                    extra={'notification': notification}
                )

    async def _send_email_notification(
        self,
        notification: Dict[str, Any]
    ) -> None:
        """
        Send email notification.
        
        Args:
            notification: Notification data
        """
        try:
            msg = MIMEMultipart()
            msg['From'] = self.smtp_config['from_email']
            msg['To'] = notification['email']
            msg['Subject'] = notification['subject']
            
            # Create HTML content
            html = f"""
            <html>
                <body>
                    <h2>{notification['title']}</h2>
                    <p>{notification['message']}</p>
                    {self._format_notification_data(notification.get('data', {}))}
                </body>
            </html>
            """
            
            msg.attach(MIMEText(html, 'html'))
            
            # Send email
            with smtplib.SMTP(
                self.smtp_config['host'],
                self.smtp_config['port']
            ) as server:
                server.starttls()
                server.login(
                    self.smtp_config['user'],
                    self.smtp_config['password']
                )
                server.send_message(msg)
                
            logger.info(
                f"Sent email notification to {notification['email']}",
                extra={'notification_id': notification.get('id')}
            )
            
        except Exception as e:
            logger.error(
                f"Error sending email: {e}",
                extra={'notification': notification}
            )
            raise

    async def _send_sms_notification(
        self,
        notification: Dict[str, Any]
    ) -> None:
        """
        Send SMS notification.
        
        Args:
            notification: Notification data
        """
        try:
            # Format SMS message
            message = f"{notification['title']}\n{notification['message']}"
            
            # Add Twilio integration here
            # For now, just log the message
            logger.info(
                f"Would send SMS to {notification['phone']}: {message}",
                extra={'notification_id': notification.get('id')}
            )
            
        except Exception as e:
            logger.error(
                f"Error sending SMS: {e}",
                extra={'notification': notification}
            )
            raise

    def _format_notification_data(
        self,
        data: Dict[str, Any]
    ) -> str:
        """
        Format notification data as HTML.
        
        Args:
            data: Data to format
            
        Returns:
            HTML formatted string
        """
        if not data:
            return ""
            
        html = "<div style='margin-top: 20px; padding: 10px; background: #f5f5f5;'>"
        
        for key, value in data.items():
            if isinstance(value, dict):
                html += f"<h3>{key}</h3>"
                html += "<ul>"
                for k, v in value.items():
                    html += f"<li><strong>{k}:</strong> {v}</li>"
                html += "</ul>"
            else:
                html += f"<p><strong>{key}:</strong> {value}</p>"
                
        html += "</div>"
        return html

    async def queue_notification(
        self,
        notification_type: str,
        user_id: str,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        priority: str = 'normal'
    ) -> None:
        """
        Queue a notification for processing.
        
        Args:
            notification_type: Type of notification
            user_id: User ID
            title: Notification title
            message: Notification message
            data: Optional additional data
            email: Optional email address
            phone: Optional phone number
            priority: Priority level ('high', 'normal', 'low')
        """
        notification = {
            'id': f"{notification_type}_{datetime.now().timestamp()}",
            'type': notification_type,
            'user_id': user_id,
            'title': title,
            'message': message,
            'data': data,
            'priority': priority,
            'timestamp': datetime.now().isoformat()
        }
        
        if email:
            notification['email'] = email
            notification['subject'] = f"AISTM7 Alert: {title}"
            
        if phone:
            notification['phone'] = phone
            
        await self._notification_queue.put(notification)
        
        logger.info(
            f"Queued {notification_type} notification for user {user_id}",
            extra={'notification': notification}
        )

    async def send_risk_alert(
        self,
        user_id: str,
        risk_data: Dict[str, Any],
        email: Optional[str] = None,
        phone: Optional[str] = None
    ) -> None:
        """
        Send risk alert notification.
        
        Args:
            user_id: User ID
            risk_data: Risk analysis data
            email: Optional email address
            phone: Optional phone number
        """
        await self.queue_notification(
            notification_type='risk_alert',
            user_id=user_id,
            title='Risk Alert',
            message='Important risk metrics have exceeded thresholds',
            data=risk_data,
            email=email,
            phone=phone,
            priority='high'
        )

    async def send_anomaly_alert(
        self,
        user_id: str,
        anomaly_data: Dict[str, Any],
        email: Optional[str] = None,
        phone: Optional[str] = None
    ) -> None:
        """
        Send anomaly detection alert.
        
        Args:
            user_id: User ID
            anomaly_data: Anomaly detection data
            email: Optional email address
            phone: Optional phone number
        """
        await self.queue_notification(
            notification_type='anomaly_alert',
            user_id=user_id,
            title='Anomaly Detected',
            message='Unusual market behavior detected',
            data=anomaly_data,
            email=email,
            phone=phone,
            priority='high'
        )

    async def send_model_alert(
        self,
        user_id: str,
        model_data: Dict[str, Any],
        email: Optional[str] = None
    ) -> None:
        """
        Send model performance alert.
        
        Args:
            user_id: User ID
            model_data: Model metrics data
            email: Optional email address
        """
        await self.queue_notification(
            notification_type='model_alert',
            user_id=user_id,
            title='Model Performance Update',
            message='AI model performance metrics update',
            data=model_data,
            email=email,
            priority='normal'
        )

    async def send_portfolio_summary(
        self,
        user_id: str,
        portfolio_data: Dict[str, Any],
        email: Optional[str] = None
    ) -> None:
        """
        Send portfolio summary notification.
        
        Args:
            user_id: User ID
            portfolio_data: Portfolio summary data
            email: Optional email address
        """
        await self.queue_notification(
            notification_type='portfolio_summary',
            user_id=user_id,
            title='Portfolio Summary',
            message='Your daily portfolio performance summary',
            data=portfolio_data,
            email=email,
            priority='normal'
        )