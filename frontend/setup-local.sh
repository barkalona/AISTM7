#!/bin/bash

# Exit on error
set -e

echo "🚀 Setting up local development environment..."

# Clean up
echo "🧹 Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing project dependencies..."
npm install

echo "📦 Installing UI dependencies..."
npm install --save \
  @mui/material \
  @mui/icons-material \
  @emotion/react \
  @emotion/styled \
  qrcode.react

echo "📦 Installing Solana dependencies..."
npm install --save \
  @solana/web3.js \
  @solana/wallet-adapter-base \
  @solana/wallet-adapter-react \
  @solana/wallet-adapter-react-ui \
  @solana/wallet-adapter-wallets \
  @solana/spl-token

echo "📦 Installing development dependencies..."
npm install --save-dev \
  @types/react \
  @types/react-dom \
  @types/node \
  typescript \
  eslint \
  prettier

# Create local environment file if it doesn't exist
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local..."
  cat > .env.local << EOL
# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_SOLANA_NETWORK=devnet

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-development-secret

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
TOKEN_MINT_ADDRESS=6RMi2pWqEmAE6aH7wrFiAjPvoxAEQV2JVYiufDJXn9L

# Database
DATABASE_URL=postgresql://postgres.tytzkeufaizdlqqnsnem:Welcome2OQT1997@aws-0-eu-central-1.pooler.supabase.com:5432/postgres

# Email Configuration
EMAIL_SERVER_HOST=mail.ai-hash.ai
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER=ceo@ai-hash.ai
EMAIL_SERVER_PASSWORD=_Rvys[1x1N}C
EMAIL_FROM=ceo@ai-hash.ai
EOL
fi

# Install function dependencies
echo "📦 Installing function dependencies..."
cd netlify/functions && npm install && cd ../..

# Run development server
echo "🚀 Starting development server..."
npm run dev

echo "
✅ Development server started!

Your application should be running at:
- Frontend: http://localhost:3000

The Wallet Connect button should now be available in the top right corner.
To test:
1. Click 'Connect Wallet'
2. Select Phantom or Solflare
3. Approve the connection

You should see:
- A styled landing page
- Wallet connection button
- Connection status
- Portfolio preview when connected

Press Ctrl+C to stop the development server.
"