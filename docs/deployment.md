# AISTM7 Deployment Guide

## Initial Netlify Deployment

### Prerequisites

1. **Node.js and npm**
   - Node.js version 18.x or higher
   - npm version 8.x or higher

2. **IBKR Account**
   - Active IBKR Pro account
   - Account must be fully funded
   - Trading permissions enabled

3. **Netlify Account**
   - Create an account at [netlify.com](https://netlify.com)
   - Install Netlify CLI: `npm install -g netlify-cli`

### Setup Process

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd AISTM7
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment templates
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env
   ```

3. **Run Setup Script**
   ```bash
   # Make script executable
   chmod +x scripts/setup-netlify.js
   
   # Run setup
   node scripts/setup-netlify.js
   ```

4. **IBKR Integration**

   The platform uses IBKR's Web API with OAuth2.0 for authentication:

   a. **User Authentication Flow**
   - Users log in with their IBKR credentials
   - Platform requests trading permissions
   - IBKR returns authorization token
   - Platform stores encrypted credentials

   b. **Security Measures**
   - All credentials encrypted at rest
   - Secure token storage
   - Regular token rotation
   - Rate limiting implemented

5. **Database Setup**
   ```bash
   # Initialize database
   npx prisma migrate deploy
   npx prisma generate
   ```

6. **Local Testing**
   ```bash
   # Start development server
   npm run dev
   
   # Verify IBKR integration
   npm run test:ibkr
   ```

### Deployment Steps

1. **Initial Deployment**
   ```bash
   # Build project
   npm run build
   
   # Deploy to Netlify
   netlify deploy --prod
   ```

2. **Environment Variables**
   
   Set the following in Netlify dashboard:
   - Authentication variables
   - API endpoints
   - Database connection
   - IBKR configuration
   - Solana network settings

3. **Domain Configuration**
   - Set up custom domain (if available)
   - Configure SSL certificate
   - Update IBKR callback URLs

4. **Post-Deployment Verification**
   - Test user authentication
   - Verify IBKR connection
   - Check token balance verification
   - Test portfolio data retrieval

### Token Integration

1. **Token Requirements**
   - Minimum balance: 700,000 AISTM7 tokens
   - Network: Solana (devnet for testing)
   - Smart contract deployment verified

2. **Balance Verification**
   - Real-time balance checking
   - Grace period configuration
   - Automatic price adjustments

### Monitoring Setup

1. **Performance Monitoring**
   ```bash
   # Enable monitoring
   netlify addons:create datadog
   ```

2. **Alert Configuration**
   - Set up error notifications
   - Configure performance alerts
   - Enable uptime monitoring

### Security Measures

1. **Authentication Security**
   - OAuth2.0 implementation
   - JWT token management
   - Rate limiting
   - CORS configuration

2. **Data Protection**
   - Encryption at rest
   - Secure communication
   - Regular security audits

### Backup and Recovery

1. **Database Backups**
   ```bash
   # Configure automated backups
   netlify addons:create postgresql-backups
   ```

2. **Recovery Procedures**
   - Point-in-time recovery
   - Backup verification
   - Restoration testing

### Troubleshooting

1. **Common Issues**
   - IBKR connection errors
   - Token balance verification
   - Database connectivity
   - API rate limits

2. **Debug Tools**
   ```bash
   # View logs
   netlify logs:show
   
   # Check functions
   netlify functions:list
   ```

### Maintenance

1. **Regular Updates**
   ```bash
   # Update dependencies
   npm update
   
   # Deploy updates
   npm run deploy
   ```

2. **Health Checks**
   - Daily performance monitoring
   - Weekly security scans
   - Monthly backup verification

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] IBKR OAuth setup complete
- [ ] SSL certificate active
- [ ] Monitoring enabled
- [ ] Backups configured
- [ ] Security measures verified
- [ ] Performance metrics baseline established

### Support Contacts

- Technical Issues: tech-support@aistm7.com
- IBKR Integration: ibkr-support@aistm7.com
- Security Concerns: security@aistm7.com

### Additional Resources

- [IBKR API Documentation](https://www.interactivebrokers.com/api/doc.html)
- [Netlify Deployment Docs](https://docs.netlify.com)
- [Solana Development Guide](https://docs.solana.com)
- [Project Documentation](./development.md)

### Version History

- v1.0.0 - Initial deployment setup
- v1.1.0 - IBKR OAuth integration
- v1.2.0 - Token verification system
- v1.3.0 - Automated deployment pipeline