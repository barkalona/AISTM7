# AISTM7 Environment Variables Configuration

## Overview
This document details all environment variables required for deploying the AISTM7 platform, with specific focus on the initial Netlify deployment using a personal IBKR account.

## Frontend Environment Variables

### Authentication
```env
# Required - Authentication
NEXTAUTH_URL=https://<your-netlify-domain>
NEXTAUTH_SECRET=<generated-secret>
```

### API Configuration
```env
# Required - API Endpoints
NEXT_PUBLIC_API_URL=https://<your-backend-api>
NEXT_PUBLIC_WS_URL=wss://<your-backend-websocket>
```

### IBKR OAuth2.0 Configuration
```env
# Required - IBKR Integration
IBKR_OAUTH_CLIENT_ID=<your-oauth-client-id>
IBKR_OAUTH_REDIRECT_URI=https://<your-netlify-domain>/api/auth/callback/ibkr
IBKR_API_ENDPOINT=https://api.ibkr.com/v1/portal
IBKR_OAUTH_SCOPE="trading" # Adjust based on required permissions
```

### Solana Configuration
```env
# Required - Blockchain Integration
NEXT_PUBLIC_SOLANA_NETWORK=devnet # or mainnet-beta for production
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=<your-token-contract>
```

### Database Configuration
```env
# Required - Database
DATABASE_URL=<your-postgres-connection-string>
```

### Token System
```env
# Required - Token Configuration
NEXT_PUBLIC_MIN_TOKEN_REQUIREMENT=700000
NEXT_PUBLIC_TOKEN_PRICE_ENDPOINT=<token-price-api>
```

### Optional Features
```env
# Optional - Analytics and Monitoring
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_SENTRY_DSN=<your-sentry-dsn>
NEXT_PUBLIC_DATADOG_APPLICATION_ID=<your-datadog-app-id>
NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=<your-datadog-client-token>

# Optional - Feature Flags
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_MONITORING=true
```

## Configuration Locations

### 1. Netlify Dashboard
Configure these variables in the Netlify dashboard under:
- Site settings > Build & deploy > Environment variables

Required variables for initial deployment:
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- IBKR_OAUTH_CLIENT_ID
- IBKR_OAUTH_REDIRECT_URI
- DATABASE_URL
- NEXT_PUBLIC_SOLANA_NETWORK
- NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS

### 2. Local Development
Create `.env.local` in the frontend directory with all variables for local testing.

### 3. Production Environment
Use `.env.production` for production-specific values.

### 4. CI/CD Pipeline
Configure secrets in GitHub repository settings for GitHub Actions:
- NETLIFY_AUTH_TOKEN
- NETLIFY_SITE_ID
- Other sensitive environment variables

## Security Considerations

1. **Secret Generation**
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

2. **Variable Encryption**
- All sensitive variables should be encrypted in transit and at rest
- Use Netlify's environment variable encryption
- Never commit secrets to version control

3. **Access Control**
- Limit environment variable access to necessary team members
- Regularly rotate secrets and credentials
- Monitor environment variable usage

## Deployment Checklist

1. **Pre-deployment**
- [ ] Generate secure NEXTAUTH_SECRET
- [ ] Configure IBKR OAuth2.0 credentials
- [ ] Set up database connection
- [ ] Configure Solana network settings
- [ ] Set token contract address

2. **Deployment**
- [ ] Verify all required variables are set
- [ ] Test authentication flow
- [ ] Validate API connections
- [ ] Check WebSocket functionality
- [ ] Verify token balance checking

3. **Post-deployment**
- [ ] Verify environment variable loading
- [ ] Test IBKR authentication
- [ ] Confirm Solana integration
- [ ] Check monitoring systems
- [ ] Validate security measures

## Troubleshooting

### Common Issues

1. **Authentication Errors**
- Verify NEXTAUTH_URL matches Netlify domain
- Check IBKR OAuth configuration
- Validate redirect URIs

2. **API Connection Issues**
- Verify API endpoint URLs
- Check WebSocket connection
- Validate CORS settings

3. **Token Integration**
- Verify Solana network configuration
- Check token contract address
- Validate RPC endpoint

## Updating Variables

### Production Updates
1. Update in Netlify dashboard
2. Trigger redeploy
3. Verify changes in production

### Local Updates
1. Modify `.env.local`
2. Restart development server
3. Test functionality

## Monitoring

Monitor environment variable usage and performance:
- Track API response times
- Monitor authentication success rates
- Log environment variable access
- Alert on configuration issues

## Support

For environment configuration issues:
- Technical Support: support@aistm7.com
- IBKR Integration: ibkr-support@aistm7.com
- Solana Support: blockchain@aistm7.com