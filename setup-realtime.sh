#!/bin/bash

# Exit on error
set -e

echo "🔧 Setting up real-time components..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install --save ws winston
npm install --save-dev chai mocha @types/ws

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install --save @types/ws

# Run tests
echo "🧪 Running real-time integration tests..."
cd ../backend
npm test tests/services/realtime.test.js

echo "
✅ Setup complete!

Real-time components are ready:
1. WebSocket Manager
2. Market Data Manager
3. Validation System
4. Logging System

To test manually:
1. Start the backend server:
   cd backend && npm start

2. Connect using WebSocket client:
   ws://localhost:3000

Example subscription message:
{
    \"type\": \"marketData\",
    \"data\": {
        \"symbol\": \"BTC-USD\",
        \"interval\": 1000,
        \"action\": \"subscribe\"
    }
}

Next steps:
1. Implement frontend WebSocket hooks
2. Add real-time UI components
3. Connect to production data sources
"