# Step-by-Step Deployment Guide for AISTM7

## 1. Install Node.js and npm
First, install Node.js and npm on your system:

### For macOS:
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js and npm
brew install node
```

### For Linux:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 2. Install Project Dependencies
```bash
# Navigate to project directory
cd /Users/stm/Projects/AISTM7

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install function dependencies
cd netlify/functions
npm install
cd ../..
```

## 3. Set Up Environment Variables
```bash
# Create .env.local file
cat > .env.local << EOL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-development-secret-key-min-32-chars
SOLANA_RPC_URL=https://api.devnet.solana.com
TOKEN_MINT_ADDRESS=your-token-mint-address
DATABASE_URL=postgresql://user:password@localhost:5432/aistm7
EOL
```

## 4. Set Up Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize Netlify site (if not already done)
netlify init
```

## 5. Configure Netlify Site
After running `netlify init`, you'll get:
- NETLIFY_SITE_ID
- NETLIFY_AUTH_TOKEN

Add these to your .env.local file:
```bash
echo "NETLIFY_SITE_ID=your-site-id" >> .env.local
echo "NETLIFY_AUTH_TOKEN=your-auth-token" >> .env.local
```

## 6. Build and Test Locally
```bash
# Make scripts executable
chmod +x scripts/setup-environment.sh
chmod +x scripts/pre-deployment-check.sh
chmod +x frontend/scripts/deploy.sh

# Build the project
npm run build

# Test locally
npm run dev
```

## 7. Deploy to Netlify
Once everything is set up and working locally:

```bash
# Deploy using our script
cd frontend && ./scripts/deploy.sh
```

## Troubleshooting

### If Node.js/npm not found:
```bash
# Check if Node.js is installed
node --version
npm --version

# If not installed, follow step 1 above
```

### If build fails:
```bash
# Clear next.js cache
rm -rf frontend/.next

# Clear node_modules
rm -rf frontend/node_modules
rm -rf frontend/netlify/functions/node_modules

# Reinstall dependencies
cd frontend
npm install
cd netlify/functions
npm install
cd ../..
```

### If deployment fails:
1. Check environment variables are set correctly
2. Verify Netlify authentication:
```bash
netlify status
```

3. Check Netlify site configuration:
```bash
netlify sites:list
```

### Common Issues:

1. **Missing Dependencies**
```bash
# Install all required dependencies
cd frontend
npm install --save-dev crypto-browserify stream-browserify url browserify-zlib stream-http https-browserify assert os-browserify path-browserify process
```

2. **TypeScript Errors**
```bash
# Clear TypeScript cache
rm -rf frontend/tsconfig.tsbuildinfo
```

3. **Netlify Function Errors**
```bash
# Build functions separately
cd frontend/netlify/functions
npm run build
```

4. **Environment Variable Issues**
```bash
# Verify environment variables
cat frontend/.env.local

# Check if they're being loaded
echo $NEXT_PUBLIC_APP_URL
```

## Need Help?

If you encounter any issues:
1. Check the error message carefully
2. Look at the Netlify deployment logs
3. Verify all environment variables are set
4. Make sure all dependencies are installed
5. Try building locally first before deploying

For local development and testing:
```bash
# Start development server
cd frontend
npm run dev

# In another terminal, test the API
curl http://localhost:3000/api/health