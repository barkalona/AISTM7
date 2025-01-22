# AISTM7 API Documentation

## Authentication

All API endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Base URL

```
Production: https://api.aistm7.com/v1
Development: http://localhost:3000/api
```

## Endpoints

### Portfolio Management

#### GET /portfolio
Retrieve user's current portfolio data.

**Response**
```json
{
  "positions": [
    {
      "symbol": "AAPL",
      "quantity": 100,
      "averagePrice": 150.25,
      "currentPrice": 155.30,
      "pnl": 505.00,
      "pnlPercentage": 3.36
    }
  ],
  "totalValue": 15530.00,
  "dailyPnL": 505.00,
  "dailyPnLPercentage": 3.36
}
```

#### GET /portfolio/history
Retrieve historical portfolio performance.

**Query Parameters**
- `timeframe`: string (1d, 1w, 1m, 3m, 1y)
- `interval`: string (1m, 5m, 15m, 1h, 1d)

### Risk Analysis

#### GET /risk/metrics
Get current risk metrics for the portfolio.

**Response**
```json
{
  "var": {
    "daily": 0.02,
    "weekly": 0.045,
    "monthly": 0.08
  },
  "sharpeRatio": 1.5,
  "beta": 1.1,
  "correlations": {
    "sp500": 0.85,
    "nasdaq": 0.90
  }
}
```

#### POST /risk/simulate
Run Monte Carlo simulation for portfolio.

**Request Body**
```json
{
  "scenarios": 1000,
  "timeframe": "1y",
  "confidenceLevel": 0.95
}
```

### Token Requirements

#### GET /token-requirement/current
Get current token requirement information.

**Response**
```json
{
  "requirement": 700000,
  "price": 0.0000285714,
  "usdValue": 20.00,
  "timestamp": 1705912800000,
  "lastUpdate": 1705912800000
}
```

#### GET /token-requirement/check/:address
Check if an address meets token requirements.

**Response**
```json
{
  "hasAccess": true,
  "balance": 750000,
  "requirement": 700000,
  "gracePeriod": null
}
```

#### GET /token-requirement/grace-period/:userId
Get grace period status for a user.

**Response**
```json
{
  "gracePeriod": {
    "endDate": "2025-01-25T14:30:00Z",
    "requiredBalance": 700000,
    "initialBalance": 650000,
    "status": "active"
  }
}
```

### AI Recommendations

#### GET /recommendations
Get AI-generated portfolio recommendations.

**Query Parameters**
- `riskProfile`: string (conservative, moderate, aggressive)
- `timeHorizon`: string (short, medium, long)

**Response**
```json
{
  "recommendations": [
    {
      "action": "buy",
      "symbol": "AAPL",
      "quantity": 10,
      "reasoning": "Strong technical indicators and positive sentiment analysis",
      "confidence": 0.85
    }
  ],
  "analysis": {
    "marketConditions": "bullish",
    "riskLevel": "moderate",
    "confidenceScore": 0.85
  }
}
```

### Alerts

#### GET /alerts
Get user's configured alerts.

**Response**
```json
{
  "alerts": [
    {
      "id": "alert_123",
      "type": "price",
      "symbol": "AAPL",
      "condition": "above",
      "value": 150.00,
      "status": "active",
      "channels": ["email", "push"]
    }
  ]
}
```

#### POST /alerts
Create new alert.

**Request Body**
```json
{
  "type": "price",
  "symbol": "AAPL",
  "condition": "above",
  "value": 150.00,
  "channels": ["email", "push"]
}
```

#### PUT /alerts/:id
Update existing alert.

#### DELETE /alerts/:id
Delete alert.

### Notifications

#### GET /notifications
Get user's notifications.

**Query Parameters**
- `status`: string (read, unread, all)
- `type`: string (risk, price, system)
- `limit`: number
- `offset`: number

**Response**
```json
{
  "notifications": [
    {
      "id": "notif_123",
      "type": "risk",
      "title": "Risk Alert",
      "message": "Portfolio volatility exceeds threshold",
      "timestamp": "2025-01-22T10:30:00Z",
      "read": false,
      "priority": "high",
      "data": {
        "metric": "volatility",
        "current": 0.25,
        "threshold": 0.20
      }
    }
  ],
  "total": 50,
  "unread": 10
}
```

#### PUT /notifications/:id/read
Mark notification as read.

#### DELETE /notifications
Clear all notifications.

### IBKR Integration

#### POST /ibkr/auth
Authenticate with IBKR account.

**Request Body**
```json
{
  "username": "ibkr_username",
  "password": "encrypted_password"
}
```

#### GET /ibkr/status
Get IBKR connection status.

**Response**
```json
{
  "connected": true,
  "lastSync": "2025-01-22T10:30:00Z",
  "paperTrading": false
}
```

### System Status

#### GET /health
Get system health status.

**Response**
```json
{
  "status": "healthy",
  "services": {
    "database": "up",
    "ibkr": "up",
    "ai": "up",
    "blockchain": "up"
  },
  "latency": {
    "database": 5,
    "api": 20
  }
}
```

## Error Handling

All endpoints follow standard HTTP status codes and return errors in the following format:

```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid parameters provided",
    "details": {
      "field": "symbol",
      "issue": "Required field missing"
    }
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Authentication required or failed
- `FORBIDDEN`: Insufficient permissions
- `INVALID_PARAMETERS`: Invalid request parameters
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `INTERNAL_ERROR`: Internal server error
- `SERVICE_UNAVAILABLE`: External service unavailable

## Rate Limiting

API requests are rate limited per user:
- 100 requests per minute for standard endpoints
- 1000 requests per minute for market data endpoints
- 10 requests per minute for intensive operations (simulations, AI analysis)

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705912800
```

## Websocket API

Connect to real-time updates:
```
wss://api.aistm7.com/v1/ws
```

Available channels:
- `portfolio`: Real-time portfolio updates
- `risk`: Risk metric updates
- `alerts`: Real-time alerts
- `notifications`: System notifications
- `market`: Market data updates

Subscribe to channels:
```json
{
  "action": "subscribe",
  "channels": ["portfolio", "risk"]
}
```

## Development Tools

API playground available at:
```
https://api.aistm7.com/playground
```

OpenAPI specification:
```
https://api.aistm7.com/openapi.json