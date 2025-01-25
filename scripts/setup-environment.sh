#!/bin/bash

# Exit on error
set -e

echo "🛠️ Setting up AISTM7 Development Environment..."

# Check if Homebrew is installed (for macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v brew &> /dev/null; then
        echo "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
fi

# Install Node.js and npm
echo "📦 Installing Node.js and npm..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install node
else
    # For Linux
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install global npm packages
echo "📦 Installing development tools..."
npm install -g snyk eslint prettier

# Install project dependencies
echo "📦 Installing project dependencies..."
# Frontend
cd frontend
npm install
cd ..

# Backend
cd backend
npm install
cd ..

# Create .env files
echo "📝 Creating environment variable templates..."

# Frontend .env
cat > frontend/.env.local << EOL
# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Blockchain
SOLANA_RPC_URL=your-solana-rpc-url
TOKEN_MINT_ADDRESS=your-token-mint-address

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aistm7

# Email
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email
EMAIL_SERVER_PASSWORD=your-email-password
EMAIL_FROM=noreply@example.com

# Netlify
NETLIFY_AUTH_TOKEN=your-netlify-auth-token
NETLIFY_SITE_ID=your-netlify-site-id
EOL

# Backend .env
cat > backend/.env << EOL
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aistm7

# Blockchain
SOLANA_RPC_URL=your-solana-rpc-url
TOKEN_MINT_ADDRESS=your-token-mint-address

# AI Service
OPENAI_API_KEY=your-openai-api-key

# Email
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email
EMAIL_SERVER_PASSWORD=your-email-password
EMAIL_FROM=noreply@example.com
EOL

echo "📋 Environment Setup Instructions:"
echo "1. Edit frontend/.env.local with your configuration"
echo "2. Edit backend/.env with your configuration"
echo "3. Required External Services:"
echo "   - PostgreSQL database"
echo "   - Solana RPC node"
echo "   - SMTP server for emails"
echo "   - OpenAI API access"
echo "   - Netlify account and site"

echo "✅ Development environment setup complete!"
echo "⚠️ Please configure your environment variables before proceeding with deployment."

# Create a checklist file
cat > DEPLOYMENT-CHECKLIST.md << EOL
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
EOL

echo "📝 Created DEPLOYMENT-CHECKLIST.md to track setup progress"