# AISTM7 Deployment Checklist

## Environment Variables
- [ ] NEXT_PUBLIC_APP_URL
- [ ] NEXT_PUBLIC_WS_URL
- [ ] NEXTAUTH_SECRET
- [ ] SOLANA_RPC_URL
- [ ] TOKEN_MINT_ADDRESS
- [ ] DATABASE_URL
- [ ] EMAIL_SERVER_HOST
- [ ] EMAIL_SERVER_PORT
- [ ] EMAIL_SERVER_USER
- [ ] EMAIL_SERVER_PASSWORD
- [ ] EMAIL_FROM
- [ ] NETLIFY_AUTH_TOKEN
- [ ] NETLIFY_SITE_ID
- [ ] OPENAI_API_KEY

## External Services
- [ ] PostgreSQL database setup
- [ ] Solana RPC node access
- [ ] SMTP server configuration
- [ ] OpenAI API access
- [ ] Netlify site created

## Development Tools
- [ ] Node.js and npm
- [ ] Snyk
- [ ] ESLint
- [ ] Prettier

## Pre-deployment Steps
1. [ ] Configure all environment variables
2. [ ] Run security checks
3. [ ] Run load tests
4. [ ] Test all API endpoints
5. [ ] Verify WebSocket connections
6. [ ] Build and test frontend
7. [ ] Build and test Netlify functions
