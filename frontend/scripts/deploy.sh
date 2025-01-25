#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Function to handle errors
handle_error() {
    echo "❌ Error occurred in deployment script:"
    echo "Error on line $1"
    exit 1
}

# Set up error handling
trap 'handle_error $LINENO' ERR

echo "📦 Installing dependencies..."
# Install main dependencies
npm install

# Install Netlify functions dependencies
cd netlify/functions && npm install && cd ../..

echo "📦 Installing build dependencies..."
# Install polyfills and build dependencies
npm install --save-dev \
    crypto-browserify \
    stream-browserify \
    url \
    browserify-zlib \
    stream-http \
    https-browserify \
    assert \
    os-browserify \
    path-browserify \
    process

echo "🔍 Checking environment variables..."
required_vars=(
    "NEXT_PUBLIC_APP_URL"
    "NEXT_PUBLIC_API_URL"
    "NEXT_PUBLIC_WS_URL"
    "NEXT_PUBLIC_SOLANA_NETWORK"
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing required environment variable: $var"
        exit 1
    fi
done

echo "🏗️ Building Next.js application..."
npm run build

echo "🔧 Building Netlify functions..."
cd netlify/functions
npm run build
cd ../..

echo "📝 Creating Netlify deployment configuration..."
cat > netlify.deployment.toml << EOL
[build]
  command = "npm run build"
  publish = ".next"
  functions = "netlify/functions/dist"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[[plugins]]
  package = "netlify-plugin-inline-source-maps"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self' https: wss:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:;"
EOL

echo "🚀 Deploying to Netlify..."
if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
    echo "❌ NETLIFY_AUTH_TOKEN is not set"
    exit 1
fi

if [ -z "$NETLIFY_SITE_ID" ]; then
    echo "❌ NETLIFY_SITE_ID is not set"
    exit 1
fi

# Deploy using Netlify CLI
npx netlify-cli deploy --prod \
    --auth "$NETLIFY_AUTH_TOKEN" \
    --site "$NETLIFY_SITE_ID" \
    --message "Production deployment $(date +'%Y-%m-%d %H:%M:%S')"

echo "✅ Deployment complete!"
echo "🌍 Your site should be live at: $NEXT_PUBLIC_APP_URL"

# Verify deployment
echo "🔍 Verifying deployment..."
if curl -s -f -o /dev/null "$NEXT_PUBLIC_APP_URL"; then
    echo "✅ Site is accessible"
else
    echo "❌ Site verification failed"
    exit 1
fi

echo "📝 Deployment Summary:"
echo "- Frontend: $NEXT_PUBLIC_APP_URL"
echo "- API: $NEXT_PUBLIC_API_URL"
echo "- WebSocket: $NEXT_PUBLIC_WS_URL"
echo "- Solana Network: $NEXT_PUBLIC_SOLANA_NETWORK"

echo "🎉 Deployment process completed successfully!"