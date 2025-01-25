#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Pre-deployment Checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
        FAILED_CHECKS+=("$2")
    fi
}

# Array to store failed checks
FAILED_CHECKS=()

echo "🔒 Running Security Checks..."
chmod +x scripts/security-check.sh
if ./scripts/security-check.sh; then
    print_status 0 "Security checks passed"
else
    print_status 1 "Security checks failed"
fi

echo "🔍 Checking Environment Variables..."
# Required environment variables
ENV_VARS=(
    "NEXT_PUBLIC_APP_URL"
    "NEXT_PUBLIC_WS_URL"
    "NEXTAUTH_SECRET"
    "SOLANA_RPC_URL"
    "TOKEN_MINT_ADDRESS"
    "DATABASE_URL"
    "EMAIL_SERVER_HOST"
    "EMAIL_SERVER_PORT"
    "EMAIL_SERVER_USER"
    "EMAIL_SERVER_PASSWORD"
    "EMAIL_FROM"
    "NETLIFY_AUTH_TOKEN"
    "NETLIFY_SITE_ID"
)

for var in "${ENV_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        print_status 1 "Missing environment variable: $var"
    else
        print_status 0 "Environment variable present: $var"
    fi
done

echo "🧪 Running Tests..."
# Frontend tests
echo "Running frontend tests..."
cd frontend
npm run test || print_status 1 "Frontend tests failed"
cd ..

# Backend tests
echo "Running backend tests..."
cd backend
npm run test || print_status 1 "Backend tests failed"
cd ..

echo "⚡ Running Load Tests..."
cd backend
if npm run test:load; then
    print_status 0 "Load tests passed"
else
    print_status 1 "Load tests failed"
fi
cd ..

echo "📦 Checking Build..."
# Frontend build check
cd frontend
if npm run build; then
    print_status 0 "Frontend build successful"
else
    print_status 1 "Frontend build failed"
fi
cd ..

# Check Netlify functions
cd frontend/netlify/functions
if npm run build; then
    print_status 0 "Netlify functions build successful"
else
    print_status 1 "Netlify functions build failed"
fi
cd ../../..

echo "🌐 Checking API Endpoints..."
# Test critical API endpoints
ENDPOINTS=(
    "/api/health"
    "/api/blockchain/analytics"
    "/api/ai/prediction"
)

for endpoint in "${ENDPOINTS[@]}"; do
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint" | grep -q "200"; then
        print_status 0 "Endpoint $endpoint is responding"
    else
        print_status 1 "Endpoint $endpoint is not responding"
    fi
done

echo "🔌 Checking WebSocket Connection..."
# Test WebSocket connection
if node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/ws');
ws.on('open', () => {
    console.log('Connected');
    process.exit(0);
});
ws.on('error', () => process.exit(1));
"; then
    print_status 0 "WebSocket connection successful"
else
    print_status 1 "WebSocket connection failed"
fi

echo "📊 Pre-deployment Check Summary"
echo "=============================="
if [ ${#FAILED_CHECKS[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}✗ Failed Checks:${NC}"
    for check in "${FAILED_CHECKS[@]}"; do
        echo -e "${RED}  - $check${NC}"
    done
    echo -e "\n${YELLOW}Please fix the above issues before deploying.${NC}"
    exit 1
fi