#!/bin/bash

# Exit on error
set -e

echo "🔄 Redeploying AISTM7 with updated configuration..."

# Clean up
echo "🧹 Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing UI dependencies..."
npm install --save @mui/material @mui/icons-material @emotion/react @emotion/styled qrcode.react

echo "📦 Installing function dependencies..."
cd netlify/functions && npm install && cd ../..

# Build the project
echo "🏗️ Building Next.js application..."
NODE_ENV=production npm run build

# Run Netlify build
echo "🏗️ Running Netlify build..."
netlify build

# Deploy
echo "🚀 Deploying to Netlify..."
netlify deploy --prod --message "Deploy with updated routing configuration"

echo "
✅ Deployment process complete!

To verify the deployment:
1. Check your site at: https://aistm7.netlify.app
2. Test these routes:
   - Homepage: https://aistm7.netlify.app
   - API: https://aistm7.netlify.app/api/health
   - WebSocket: wss://aistm7.netlify.app

If you encounter any issues:
1. Check Netlify deployment logs
2. Verify environment variables
3. Check browser console for errors
"