# AISTM7 Deployment Guide

## Prerequisites

Before deploying AISTM7, ensure you have access to:
1. Netlify account
2. PostgreSQL database
3. Solana RPC node
4. SMTP server
5. OpenAI API key

## Setup Steps

1. **Initial Setup**
```bash
# Make setup script executable
chmod +x scripts/setup-environment.sh

# Run setup script
./scripts/setup-environment.sh
```

2. **Configure Environment Variables**

Edit the following files with your configuration:
- `frontend/.env.local`
- `backend/.env`

Required variables:
```env
# App URLs
NEXT_PUBLIC_APP_URL=https://your-domain.netlify.app
NEXT_PUBLIC_WS_URL=wss://your-domain.netlify.app

# Authentication
NEXTAUTH_URL=https://your-domain.netlify.app
NEXTAUTH_SECRET=generate-a-secure-secret

# Blockchain
SOLANA_RPC_URL=your-solana-rpc-url
TOKEN_MINT_ADDRESS=your-token-mint-address

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Email
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email
EMAIL_SERVER_PASSWORD=your-email-password
EMAIL_FROM=noreply@example.com

# Netlify
NETLIFY_AUTH_TOKEN=your-netlify-auth-token
NETLIFY_SITE_ID=your-netlify-site-id

# AI Service
OPENAI_API_KEY=your-openai-api-key
```

3. **Pre-deployment Checks**
```bash
# Make scripts executable
chmod +x scripts/pre-deployment-check.sh
chmod +x scripts/security-check.sh

# Run pre-deployment checks
./scripts/pre-deployment-check.sh
```

4. **Deploy to Netlify**
```bash
# Make deploy script executable
chmod +x frontend/scripts/deploy.sh

# Deploy
cd frontend && ./scripts/deploy.sh
```

## Deployment Architecture

### Frontend (Netlify)
- Next.js application
- Static assets via CDN
- Serverless functions for backend
- WebSocket support for real-time features

### Backend (Netlify Functions)
- API endpoints
- WebSocket handlers
- Database connections
- Blockchain integration
- AI/ML model serving

### External Services
- PostgreSQL Database
- Solana Blockchain
- OpenAI API
- SMTP Server

## Post-deployment Verification

1. **Frontend**
- Visit https://your-domain.netlify.app
- Verify all pages load
- Check authentication flow
- Test responsive design

2. **Backend**
- Test API endpoints
- Verify WebSocket connections
- Check database connectivity
- Test blockchain operations

3. **Monitoring**
- Check Netlify deployment logs
- Monitor function execution
- Verify database connections
- Check WebSocket status

## Troubleshooting

### Common Issues

1. **Build Failures**
- Check Netlify build logs
- Verify environment variables
- Check dependency versions

2. **API Errors**
- Check function logs
- Verify database connection
- Check environment variables
- Test API endpoints locally

3. **WebSocket Issues**
- Verify WebSocket URL
- Check function logs
- Test connection locally

### Debug Commands

```bash
# Test API endpoints
curl https://your-domain.netlify.app/api/health

# Check WebSocket
wscat -c wss://your-domain.netlify.app/ws

# View function logs
netlify functions:log
```

## Maintenance

### Regular Tasks
1. Monitor error rates and performance
2. Update dependencies
3. Review security alerts
4. Backup database
5. Check resource usage

### Updates
1. Test changes locally
2. Run pre-deployment checks
3. Deploy to staging (if available)
4. Deploy to production

## Security Considerations

1. **Environment Variables**
- Use Netlify environment variables
- Never commit secrets
- Rotate secrets regularly

2. **API Security**
- Authentication required
- Rate limiting enabled
- Input validation
- CORS configuration

3. **Database**
- Regular backups
- Connection encryption
- Access control

4. **Monitoring**
- Error tracking
- Performance monitoring
- Security alerts

## Support

For deployment issues:
1. Check logs in Netlify dashboard
2. Review error messages
3. Check environment variables
4. Verify external service status

## Rollback Procedure

If deployment fails:
1. Access Netlify dashboard
2. Go to Deploys section
3. Click "Publish deploy" on last working version
4. Verify rollback success

Remember to keep environment variables, API keys, and other sensitive information secure and never commit them to version control.