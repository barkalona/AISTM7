# Environment Variables and Deployment Setup Guide

## 1. Environment Variables Configuration

### Frontend (.env.local for development)
```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated-by-setup-script>

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# IBKR Integration
IBKR_USERNAME=<your-ibkr-username>
IBKR_PASSWORD=<your-ibkr-password>

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=<will-be-deployed-later>

# Database (Local PostgreSQL)
DATABASE_URL=postgresql://postgres:aistm7@localhost:5432/aistm7

# Token System
NEXT_PUBLIC_MIN_TOKEN_REQUIREMENT=700000
```

### Backend (.env for development)
```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:aistm7@localhost:5432/aistm7

# JWT
JWT_SECRET=<generated-by-setup-script>
JWT_EXPIRY=24h

# IBKR API
IBKR_USERNAME=<same-as-frontend>
IBKR_PASSWORD=<same-as-frontend>

# Solana
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

## 2. Netlify Deployment Configuration

### Required Environment Variables in Netlify Dashboard
```env
# Authentication
NEXTAUTH_URL=https://<your-netlify-domain>.netlify.app
NEXTAUTH_SECRET=<generated-by-setup-script>

# API Configuration
NEXT_PUBLIC_API_URL=<your-backend-api-url>
NEXT_PUBLIC_WS_URL=<your-backend-websocket-url>

# Database (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# IBKR Integration
IBKR_USERNAME=<your-ibkr-username>
IBKR_PASSWORD=<your-ibkr-password>

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## 3. Database Setup

### Local Development
1. Create local database:
```sql
CREATE DATABASE aistm7;
CREATE USER postgres WITH PASSWORD 'aistm7';
GRANT ALL PRIVILEGES ON DATABASE aistm7 TO postgres;
```

### Production (Supabase)
1. Create new project at supabase.com
2. Get connection string from Dashboard
3. Update DATABASE_URL in Netlify environment variables
4. Run migrations:
```bash
DATABASE_URL="your-supabase-url" npx prisma migrate deploy
```

## 4. GitHub Repository Setup

1. Create new repository:
   - Go to github.com/new
   - Name: AISTM7
   - Private repository
   - Don't initialize with README

2. Push existing code:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/AISTM7.git
git push -u origin main
```

## 5. Netlify Deployment Steps

1. Connect to GitHub:
   - Log in to Netlify
   - Click "New site from Git"
   - Choose GitHub
   - Select AISTM7 repository

2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18.x

3. Add environment variables:
   - Go to Site settings > Build & deploy > Environment
   - Add all required variables listed above

4. Deploy:
   - Trigger deploy from Netlify dashboard
   - Wait for build completion
   - Access your site at temporary Netlify URL

## 6. Post-Deployment Verification

1. Check database connection
2. Verify IBKR authentication
3. Test Solana integration
4. Confirm token balance checking
5. Validate WebSocket connections

## 7. Security Considerations

1. Environment Variables:
   - Never commit .env files
   - Use different values for development and production
   - Rotate secrets regularly

2. Database:
   - Use strong passwords
   - Enable SSL in production
   - Regular backups

3. API Security:
   - Rate limiting enabled
   - CORS properly configured
   - Input validation

## 8. Troubleshooting

### Common Issues

1. Database Connection:
   - Check connection string format
   - Verify network access
   - Confirm SSL requirements

2. IBKR Integration:
   - Validate credentials
   - Check API endpoints
   - Verify network connectivity

3. Environment Variables:
   - Case sensitivity matters
   - No quotes needed in .env files
   - Restart after changes

### Support Contacts

- Technical Issues: tech-support@aistm7.com
- Database Support: db-support@aistm7.com
- Security Concerns: security@aistm7.com