#!/bin/bash

# Exit on error
set -e

echo "🚀 Setting up AISTM7 Development Environment"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Node.js
install_node() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Installing Node.js using Homebrew..."
        if ! command_exists brew; then
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install node
    else
        echo "Installing Node.js using apt..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
}

# Check and install Node.js if needed
if ! command_exists node; then
    echo "Node.js not found. Installing..."
    install_node
fi

echo "📦 Installing project dependencies..."

# Install Netlify CLI globally
echo "Installing Netlify CLI..."
npm install -g netlify-cli

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install

# Install polyfills and build dependencies
echo "Installing build dependencies..."
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

# Install function dependencies
echo "Installing function dependencies..."
cd netlify/functions
npm install
cd ../..

echo "🔧 Setting up environment variables..."
# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    cat > .env.local << EOL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key-change-this-in-production
SOLANA_RPC_URL=https://api.devnet.solana.com
TOKEN_MINT_ADDRESS=your-token-mint-address
DATABASE_URL=postgresql://user:password@localhost:5432/aistm7
EOL
    echo "Created .env.local with default values"
fi

echo "🔐 Setting up Netlify..."
# Check if already logged in to Netlify
if ! netlify status &>/dev/null; then
    echo "Please log in to Netlify:"
    netlify login
fi

# Initialize Netlify site if not already done
if [ ! -f .netlify/state.json ]; then
    echo "Initializing Netlify site..."
    netlify init
fi

echo "📝 Making scripts executable..."
chmod +x scripts/setup-environment.sh
chmod +x scripts/pre-deployment-check.sh
chmod +x frontend/scripts/deploy.sh

echo "🏗️ Building project..."
npm run build

echo "✅ Setup complete!"
echo
echo "Next steps:"
echo "1. Edit .env.local with your configuration"
echo "2. Run 'netlify link' to connect to your Netlify site"
echo "3. Run 'npm run dev' to start development server"
echo "4. Run './frontend/scripts/deploy.sh' to deploy"
echo
echo "For detailed instructions, see DEPLOYMENT-STEPS.md"