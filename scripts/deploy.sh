#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting AISTM7 Deployment Process${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required tools
echo -e "${BLUE}Checking required tools...${NC}"
REQUIRED_TOOLS="git node npm"
for tool in $REQUIRED_TOOLS; do
    if ! command_exists "$tool"; then
        echo -e "${RED}Error: $tool is not installed${NC}"
        exit 1
    fi
done

# Generate secrets
generate_secret() {
    openssl rand -base64 32
}

# Initialize Git repository if not already initialized
if [ ! -d ".git" ]; then
    echo -e "${GREEN}Initializing Git repository...${NC}"
    git init
    git add .
    git commit -m "Initial commit: AISTM7 platform"
fi

# Setup environment variables
echo -e "${GREEN}Setting up environment variables...${NC}"

# Generate NextAuth secret
NEXTAUTH_SECRET=$(generate_secret)
JWT_SECRET=$(generate_secret)

# Create .env.local for frontend
cat > frontend/.env.local << EOL
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Database
DATABASE_URL=postgresql://postgres:aistm7@localhost:5432/aistm7

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Token System
NEXT_PUBLIC_MIN_TOKEN_REQUIREMENT=700000
EOL

# Create .env for backend
cat > backend/.env << EOL
# Server Configuration
PORT=8000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:aistm7@localhost:5432/aistm7

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRY=24h

# Solana
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
EOL

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd frontend && npm install

echo -e "${BLUE}Installing backend dependencies...${NC}"
cd ../backend && npm install

# Build the project
echo -e "${GREEN}Building the project...${NC}"
cd ../frontend && npm run build

# Create Netlify configuration
echo -e "${GREEN}Creating Netlify configuration...${NC}"
cat > netlify.toml << EOL
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[plugins]]
  package = "@netlify/plugin-nextjs"
EOL

echo -e "${BLUE}Deployment setup complete!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo "1. Create a new repository on GitHub"
echo "2. Push the code with:"
echo "   git remote add origin https://github.com/yourusername/AISTM7.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo "3. Create a new site on Netlify and connect it to your GitHub repository"
echo "4. Set up the environment variables in Netlify dashboard"
echo "5. Deploy!"

# Create deployment instructions
echo -e "${GREEN}Creating deployment instructions...${NC}"
cat > DEPLOYMENT.md << EOL
# AISTM7 Deployment Instructions

## Environment Variables to Set in Netlify

\`\`\`env
NEXTAUTH_URL=https://<your-netlify-domain>.netlify.app
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
DATABASE_URL=<your-supabase-connection-string>
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
\`\`\`

## Database Setup

1. Create Supabase project
2. Get connection string
3. Run migrations:
   \`\`\`bash
   DATABASE_URL="your-supabase-url" npx prisma migrate deploy
   \`\`\`

## Deployment Steps

1. Push to GitHub
2. Connect repository to Netlify
3. Set environment variables
4. Deploy
EOL

echo -e "${BLUE}Setup complete! Check DEPLOYMENT.md for next steps.${NC}"