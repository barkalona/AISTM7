#!/bin/bash

# Exit on error
set -e

echo "🔧 Setting up environment variables for AISTM7"

# Function to prompt for variable
prompt_var() {
    local var_name=$1
    local default_value=$2
    local description=$3
    
    echo
    echo "📝 $description"
    read -p "$var_name [$default_value]: " value
    value=${value:-$default_value}
    echo "export $var_name=\"$value\"" >> frontend/.env.local
}

# Create or clear .env.local
echo "# AISTM7 Environment Variables" > frontend/.env.local

# Netlify setup
echo "First, let's set up Netlify..."
echo "Please run 'netlify login' if you haven't already"
echo "Then create a new site or select existing one with 'netlify sites:create' or 'netlify link'"

# Get Netlify site info
if command -v netlify >/dev/null 2>&1; then
    echo "Getting Netlify site information..."
    site_id=$(netlify api listSites --json | jq -r '.[0].site_id')
    site_name=$(netlify api listSites --json | jq -r '.[0].name')
    site_url="https://$site_name.netlify.app"
else
    echo "⚠️ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
    echo "Please run this script again after installing Netlify CLI"
    exit 1
fi

# App URLs
echo "Setting up application URLs..."
prompt_var "NEXT_PUBLIC_APP_URL" "$site_url" "Your application URL (usually your Netlify URL)"
prompt_var "NEXT_PUBLIC_API_URL" "${site_url}/api" "Your API URL"
prompt_var "NEXT_PUBLIC_WS_URL" "wss://${site_name}.netlify.app" "Your WebSocket URL"

# Solana Configuration
echo "Setting up Solana configuration..."
prompt_var "NEXT_PUBLIC_SOLANA_NETWORK" "devnet" "Solana network (devnet/mainnet-beta)"
prompt_var "SOLANA_RPC_URL" "https://api.devnet.solana.com" "Solana RPC URL"
prompt_var "TOKEN_MINT_ADDRESS" "" "Your token mint address"

# Authentication
echo "Setting up authentication..."
# Generate a random secret for NextAuth
RANDOM_SECRET=$(openssl rand -base64 32)
prompt_var "NEXTAUTH_URL" "$site_url" "NextAuth URL (usually same as APP_URL)"
prompt_var "NEXTAUTH_SECRET" "$RANDOM_SECRET" "NextAuth secret (leave as is for security)"

# Database
echo "Setting up database connection..."
prompt_var "DATABASE_URL" "postgresql://user:password@localhost:5432/aistm7" "Database connection URL"

# Email Configuration
echo "Setting up email service..."
prompt_var "EMAIL_SERVER_HOST" "smtp.example.com" "SMTP server host"
prompt_var "EMAIL_SERVER_PORT" "587" "SMTP server port"
prompt_var "EMAIL_SERVER_USER" "" "SMTP server username"
prompt_var "EMAIL_SERVER_PASSWORD" "" "SMTP server password"
prompt_var "EMAIL_FROM" "noreply@example.com" "From email address"

# Netlify Configuration
echo "Setting up Netlify configuration..."
prompt_var "NETLIFY_SITE_ID" "$site_id" "Netlify site ID"
auth_token=$(netlify api getAccessToken --json | jq -r '.access_token')
prompt_var "NETLIFY_AUTH_TOKEN" "$auth_token" "Netlify authentication token"

echo "✅ Environment variables have been set up in frontend/.env.local"
echo
echo "Next steps:"
echo "1. Review the variables in frontend/.env.local"
echo "2. Run './scripts/deploy.sh' to deploy your application"
echo
echo "To modify any values, edit frontend/.env.local directly"