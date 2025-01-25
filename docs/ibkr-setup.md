# IBKR Integration Setup Guide

## Prerequisites

1. Interactive Brokers Account
   - Active Individual or Institutional Account
   - Client Portal API enabled
   - Username and password for authentication

2. Client Portal Gateway
   - Download from [IBKR Client Portal](https://www.interactivebrokers.com/en/index.php?f=16042)
   - Running locally on port 5000

## Environment Setup

1. Generate Encryption Keys
```javascript
// Run this in Node.js REPL
const { generateEncryptionKeys } = require('./utils/encryption');
const keys = generateEncryptionKeys();
console.log('Add these to your .env file:');
console.log(`ENCRYPTION_KEY=${keys.key}`);
console.log(`ENCRYPTION_IV=${keys.iv}`);
```

2. Configure Environment Variables
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env and update the following:
ENCRYPTION_KEY=<generated_key>
ENCRYPTION_IV=<generated_iv>
IBKR_API_ENDPOINT=https://localhost:5000/v1/api
IBKR_CLIENT_PORTAL_PORT=5000
```

## Client Portal Gateway Setup

1. Start Client Portal Gateway
```bash
# Windows
"C:\Jts\ibgateway\latest\ibgateway.exe" /type=IB_GATEWAY

# macOS/Linux
./IBC/scripts/ibgateway
```

2. Configure Gateway Settings
- Enable read-only API access
- Set allowed IP addresses
- Configure session timeout

## Security Considerations

1. Credential Storage
   - Credentials are encrypted using AES-256-GCM
   - Encryption keys must be kept secure
   - Regular key rotation recommended

2. Access Control
   - Use read-only API access when possible
   - Implement IP whitelisting
   - Monitor failed authentication attempts

3. Session Management
   - Sessions automatically timeout after inactivity
   - Keep-alive mechanism maintains active sessions
   - Failed sessions are automatically cleaned up

## Testing Integration

1. Test Connection
```javascript
const ibkrService = require('./services/ibkrService');

// Test credentials
const result = await ibkrService.testConnection(username, password);
if (result.success) {
    console.log('Successfully connected to IBKR');
} else {
    console.error('Connection failed:', result.error);
}
```

2. Verify Portfolio Access
```javascript
// After authentication
const portfolio = await ibkrService.getPortfolio(userId);
console.log('Portfolio data:', portfolio);
```

## Troubleshooting

1. Connection Issues
   - Verify Client Portal Gateway is running
   - Check firewall settings
   - Ensure correct credentials
   - Verify encryption keys are set correctly

2. Data Access Issues
   - Confirm API permissions
   - Check subscription status
   - Verify market data permissions

3. Common Error Messages
   - "Authentication failed": Check credentials
   - "Connection refused": Verify Gateway is running
   - "Encryption failed": Check encryption keys

## Monitoring

1. Connection Status
   - Status tracked in database
   - Automatic reconnection attempts
   - Error logging and notifications

2. Performance Metrics
   - Response times
   - Error rates
   - Data throughput

## Best Practices

1. Error Handling
   - Implement retry mechanisms
   - Log detailed error information
   - Notify administrators of persistent issues

2. Data Management
   - Cache frequently accessed data
   - Implement rate limiting
   - Monitor data usage

3. Security
   - Regular security audits
   - Monitor access patterns
   - Update credentials periodically

## Support

For issues with:
- IBKR Integration: Contact IBKR API Support
- Platform Integration: Contact AISTM7 Support
- Security Concerns: Contact Security Team

## Updates and Maintenance

1. Regular Updates
   - Check for Gateway updates
   - Update API endpoints if needed
   - Review security settings

2. Maintenance Windows
   - Schedule during off-hours
   - Notify users in advance
   - Have rollback plans ready