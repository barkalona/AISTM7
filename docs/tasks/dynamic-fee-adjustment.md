# Dynamic Fee Adjustment System

## Overview

The AISTM7 platform implements a dynamic fee adjustment system that automatically adjusts the required token balance based on the current token price to maintain a target USD value of approximately $20. This ensures fair access to the platform regardless of token price fluctuations.

## Implementation Details

### Core Components

1. **Token Price Service** (`services/tokenPriceService.js`)
   - Monitors real-time AISTM7 token price
   - Calculates price moving averages to smooth out volatility
   - Triggers requirement updates when price changes significantly

2. **Balance Requirement Service** (`services/balanceRequirementService.js`)
   - Manages the current token requirement
   - Implements adjustment logic
   - Handles grace periods for existing users

3. **Token Access Hook** (`hooks/useTokenAccess.ts`)
   - Provides real-time access status
   - Manages user balance verification
   - Handles grace period status

### Adjustment Algorithm

```typescript
const calculateNewRequirement = (
  currentPrice: number,
  targetUsdValue: number = 20
): number => {
  // Calculate raw requirement
  const rawRequirement = targetUsdValue / currentPrice;
  
  // Round up to nearest thousand for clean numbers
  return Math.ceil(rawRequirement / 1000) * 1000;
};
```

### Grace Period System

When the token requirement changes:
1. Existing users get a 72-hour grace period
2. Users are notified via multiple channels
3. Access continues during grace period
4. Users can top up their balance during this time

## Configuration

```typescript
const CONFIG = {
  TARGET_USD_VALUE: 20,
  MIN_PRICE_CHANGE_PERCENT: 5, // Minimum price change to trigger adjustment
  GRACE_PERIOD_HOURS: 72,
  PRICE_AVERAGE_WINDOW: 24, // Hours for moving average
  UPDATE_INTERVAL: 3600000, // Check price every hour
};
```

## Notification System Integration

The system sends notifications through multiple channels:

1. **Token Requirement Updates**
```typescript
interface TokenRequirementNotification {
  type: 'info';
  title: 'Token Requirement Update';
  message: string;
  data: {
    currentRequirement: number;
    previousRequirement: number;
    price: number;
    usdValue: number;
    gracePeriodHours?: number;
  };
}
```

2. **Grace Period Notifications**
```typescript
interface GracePeriodNotification {
  type: 'warning';
  title: 'Grace Period Active';
  message: string;
  data: {
    endDate: string;
    requiredBalance: number;
    currentBalance: number;
    hoursRemaining: number;
  };
}
```

## User Experience

### Frontend Components

1. **Token Gate** (`components/TokenGate.tsx`)
   - Validates user access
   - Displays current requirements
   - Shows grace period status

2. **Wallet Balance** (`components/WalletBalance.tsx`)
   - Shows current balance
   - Indicates if balance meets requirement
   - Displays time remaining in grace period

3. **Purchase Form** (`components/TokenPurchaseForm.tsx`)
   - Calculates required purchase amount
   - Handles token purchases
   - Shows price impact

### Access States

1. **Full Access**
   - Balance ≥ Current Requirement
   - All features available

2. **Grace Period**
   - Balance < New Requirement
   - Temporary access maintained
   - Warning notifications shown

3. **No Access**
   - Balance < Requirement
   - Grace period expired
   - Access restricted

## Security Measures

1. **Balance Verification**
   - On-chain balance checks
   - Proof of ownership validation
   - Regular balance updates

2. **Price Oracle**
   - Multiple data sources
   - Manipulation protection
   - Anomaly detection

3. **Smart Contract Safety**
   - Rate limiting
   - Emergency pause functionality
   - Admin controls

## Monitoring and Maintenance

1. **System Health Checks**
   - Price feed monitoring
   - Requirement calculation validation
   - Grace period tracking

2. **Performance Metrics**
   - Adjustment frequency
   - User impact analysis
   - Grace period utilization

3. **Error Handling**
   - Price feed failures
   - Calculation errors
   - Network issues

## Testing

1. **Unit Tests**
   - Price calculations
   - Requirement adjustments
   - Grace period logic

2. **Integration Tests**
   - Notification delivery
   - Balance verification
   - Access control

3. **Load Tests**
   - High volume price updates
   - Concurrent access checks
   - Mass notifications

## Future Improvements

1. **Enhanced Price Oracle**
   - Additional price sources
   - Weighted averages
   - Machine learning predictions

2. **Smart Adjustments**
   - Market volatility consideration
   - User behavior analysis
   - Gradual requirement changes

3. **Advanced Notifications**
   - Predictive warnings
   - Custom notification preferences
   - Rich media support