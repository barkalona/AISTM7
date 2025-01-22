# Netlify Deployment Setup Guide

## Prerequisites

1. GitHub repository: https://github.com/barkalona/AISTM7
2. Netlify account
3. Supabase project
4. IBKR developer account

## Steps

### 1. Connect to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" > "Import an existing project"
3. Choose GitHub and select the AISTM7 repository
4. Select the `main` branch

### 2. Configure Build Settings

The build settings are already configured in `netlify.toml`:
- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `.next`
- Node version: 18

### 3. Environment Variables

Go to Site settings > Environment variables and add the following:

```bash
# Authentication
NEXTAUTH_URL=https://[your-site-name].netlify.app
NEXTAUTH_SECRET=[generate-a-secure-secret]

# Database
DATABASE_URL=[your-supabase-connection-string]

# IBKR Integration
IBKR_CLIENT_ID=[your-ibkr-client-id]
IBKR_CLIENT_SECRET=[your-ibkr-client-secret]

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Token System
NEXT_PUBLIC_MIN_TOKEN_REQUIREMENT=700000
```

### 4. Domain Setup (Optional)

1. Go to Domain settings
2. Click "Add custom domain"
3. Follow the DNS configuration instructions

### 5. Deploy Hooks (Optional)

To trigger deployments when the backend API or database schema changes:

1. Go to Site settings > Build & deploy > Deploy hooks
2. Create a new hook named "Backend Update"
3. Save the webhook URL for CI/CD integration

### 6. Post-Deployment Verification

After deployment, verify:

1. Frontend loads correctly
2. Authentication works
3. Database connection is successful
4. IBKR integration functions
5. Solana wallet connection works
6. Token balance checks are operational

### 7. Monitoring

Set up monitoring:

1. Enable Netlify Analytics
2. Configure error tracking
3. Set up performance monitoring
4. Enable deploy notifications

### 8. Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|-----------|
| NEXTAUTH_URL | Full URL of your Netlify site | Yes |
| NEXTAUTH_SECRET | Secret for NextAuth sessions | Yes |
| DATABASE_URL | Supabase connection string | Yes |
| IBKR_CLIENT_ID | IBKR API client ID | Yes |
| IBKR_CLIENT_SECRET | IBKR API client secret | Yes |
| NEXT_PUBLIC_SOLANA_NETWORK | Solana network (devnet/mainnet) | Yes |
| NEXT_PUBLIC_SOLANA_RPC_URL | Solana RPC endpoint | Yes |
| NEXT_PUBLIC_MIN_TOKEN_REQUIREMENT | Minimum token requirement | Yes |

### 9. Troubleshooting

Common issues and solutions:

1. Build fails
   - Check Node.js version (should be 18)
   - Verify all dependencies are installed
   - Check build logs for specific errors

2. Runtime errors
   - Verify environment variables are set correctly
   - Check browser console for JavaScript errors
   - Verify API endpoints are accessible

3. Database connection issues
   - Check DATABASE_URL format
   - Verify IP allowlist in Supabase
   - Check database logs

4. Authentication problems
   - Verify NEXTAUTH_URL matches your domain
   - Check NEXTAUTH_SECRET is set
   - Verify OAuth providers configuration

### 10. Security Considerations

1. Environment Variables
   - Use unique secrets for each environment
   - Rotate secrets periodically
   - Never expose secrets in client-side code

2. API Access
   - Configure CORS properly
   - Use rate limiting
   - Implement proper authentication

3. Database
   - Use connection pooling
   - Implement row-level security
   - Regular backup verification