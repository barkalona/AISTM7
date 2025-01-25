# AISTM7 Token System Setup Guide

## Overview

The AISTM7 token system implements a dynamic balance requirement mechanism that automatically adjusts based on the token's market price to maintain a consistent USD value threshold ($15) for platform access.

## Components

1. **Smart Contract**
   - AISTM7 Token Program (Solana)
   - Dynamic balance requirement logic
   - Price feed integration
   - Balance verification

2. **Backend Services**
   - Token Price Service (price monitoring)
   - Balance Requirement Service (requirement updates)
   - Verification Service (access control)

3. **Price Oracle**
   - Pyth Network integration
   - Real-time price feeds
   - Price aggregation

## Prerequisites

1. **Solana Setup**
   ```bash
   # Install Solana CLI tools
   sh -c "$(curl -sSfL https://release.solana.com/v1.14.0/install)"
   
   # Generate program keypair
   solana-keygen new -o program-keypair.json
   
   # Generate mint authority keypair
   solana-keygen new -o mint-authority-keypair.json
   ```

2. **Environment Configuration**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Generate encryption keys
   node -e "const { generateEncryptionKeys } = require('./utils/encryption'); console.log(generateEncryptionKeys());"
   ```

## Smart Contract Deployment

1. **Build Contract**
   ```bash
   # Navigate to blockchain directory
   cd blockchain
   
   # Build the program
   anchor build
   ```

2. **Deploy to Solana**
   ```bash
   # Deploy program
   anchor deploy
   
   # Initialize token with parameters
   anchor run initialize
   ```

## Price Feed Setup

1. **Pyth Integration**
   - Configure Pyth price feed account
   - Set update interval
   - Configure price aggregation parameters

2. **Price Monitoring**
   ```javascript
   // Start price monitoring service
   const tokenPriceService = require('./services/tokenPriceService');
   await tokenPriceService.startPriceMonitoring();
   ```

## Balance Requirement Configuration

1. **Parameters**
   ```javascript
   TARGET_USD_VALUE = 15_000_000; // $15 in millionths
   MIN_TOKENS = 100;
   MAX_TOKENS = 10_000;
   ```

2. **Update Thresholds**
   - 1% price change triggers requirement update
   - Minimum 100 tokens regardless of price
   - Maximum 10,000 tokens cap

## Monitoring Setup

1. **Price Monitoring**
   ```bash
   # Enable metrics
   METRICS_ENABLED=true
   METRICS_INTERVAL=60000
   ```

2. **Alert Configuration**
   ```bash
   # Configure notification thresholds
   PRICE_CHANGE_ALERT_THRESHOLD=5 # 5% change
   REQUIREMENT_CHANGE_ALERT_THRESHOLD=10 # 10% change
   ```

## Testing

1. **Local Testing**
   ```bash
   # Run test suite
   npm test
   
   # Test price updates
   npm run test:price-updates
   
   # Test requirement adjustments
   npm run test:requirement-updates
   ```

2. **Integration Testing**
   ```bash
   # Deploy to testnet
   NETWORK=testnet npm run deploy
   
   # Run integration tests
   npm run test:integration
   ```

## Security Considerations

1. **Access Control**
   - Program authority permissions
   - Mint authority restrictions
   - Price feed verification

2. **Transaction Security**
   - Signature verification
   - Account validation
   - State consistency checks

3. **Price Feed Security**
   - Multiple price feed sources
   - Price deviation checks
   - Update frequency limits

## Maintenance

1. **Regular Tasks**
   - Monitor price feed health
   - Verify requirement adjustments
   - Check transaction logs
   - Update program parameters if needed

2. **Emergency Procedures**
   - Price feed failure recovery
   - Requirement adjustment override
   - Contract upgrade process

## Troubleshooting

1. **Common Issues**
   - Price feed disconnection
   - Transaction failures
   - Requirement update delays

2. **Solutions**
   - Automatic reconnection logic
   - Transaction retry mechanism
   - Manual requirement updates

## Monitoring

1. **Metrics**
   - Price update frequency
   - Requirement adjustment frequency
   - Transaction success rate
   - System response time

2. **Alerts**
   - Price feed disruptions
   - Large price movements
   - Requirement update failures
   - System performance issues

## Best Practices

1. **Price Updates**
   - Regular monitoring intervals
   - Multiple price source verification
   - Gradual requirement adjustments

2. **Security**
   - Regular security audits
   - Access control reviews
   - Transaction monitoring

3. **Performance**
   - Optimize update frequency
   - Cache frequently accessed data
   - Monitor resource usage

## Support

For issues with:
- Token System: Contact AISTM7 Blockchain Team
- Price Feeds: Contact Pyth Network Support
- Smart Contract: Contact Solana Development Team

## Updates and Maintenance

1. **Regular Updates**
   - Check for contract upgrades
   - Update price feed sources
   - Review security parameters

2. **Emergency Updates**
   - Price feed fallback system
   - Requirement override mechanism
   - Contract upgrade procedure