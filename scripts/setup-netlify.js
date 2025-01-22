#!/usr/bin/env node

const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate secure secrets
const generateSecret = () => crypto.randomBytes(32).toString('base64');

// Configuration templates
const netlifyConfig = {
  dev: {
    NEXTAUTH_URL: 'http://localhost:3000',
    NEXT_PUBLIC_API_URL: 'http://localhost:8000/api',
    NEXT_PUBLIC_WS_URL: 'ws://localhost:8000',
    NEXT_PUBLIC_SOLANA_NETWORK: 'devnet',
  },
  production: {
    NEXTAUTH_URL: 'https://${NETLIFY_SITE_NAME}.netlify.app',
    NEXT_PUBLIC_API_URL: 'https://api.${NETLIFY_SITE_NAME}.netlify.app',
    NEXT_PUBLIC_WS_URL: 'wss://api.${NETLIFY_SITE_NAME}.netlify.app',
    NEXT_PUBLIC_SOLANA_NETWORK: 'mainnet-beta',
  },
};

// Main setup function
async function setupNetlify() {
  try {
    console.log('🚀 Starting Netlify setup...\n');

    // Check Netlify CLI installation
    try {
      execSync('netlify --version', { stdio: 'ignore' });
    } catch (error) {
      console.log('Installing Netlify CLI...');
      execSync('npm install -g netlify-cli', { stdio: 'inherit' });
    }

    // Generate secrets
    const secrets = {
      NEXTAUTH_SECRET: generateSecret(),
      JWT_SECRET: generateSecret(),
      ENCRYPTION_KEY: generateSecret(),
    };

    // Initialize Netlify project
    console.log('\n📦 Initializing Netlify project...');
    execSync('netlify init', { stdio: 'inherit' });

    // Get site name from Netlify
    const netlifyData = JSON.parse(fs.readFileSync('.netlify/state.json', 'utf8'));
    const siteName = netlifyData.siteId;

    // Set up environment variables
    console.log('\n🔒 Setting up environment variables...');
    Object.entries({ ...netlifyConfig.production, ...secrets })
      .forEach(([key, value]) => {
        const command = `netlify env:set ${key} "${value}"`;
        execSync(command, { stdio: 'inherit' });
      });

    // Create IBKR OAuth setup instructions
    console.log('\n📝 Creating IBKR OAuth setup instructions...');
    const oauthInstructions = `
# IBKR OAuth Setup Instructions

1. Go to IBKR Client Portal API Settings:
   - Log in to your IBKR account
   - Navigate to Settings > API Settings

2. Register OAuth Application:
   - Name: AISTM7
   - Redirect URI: https://${siteName}.netlify.app/api/auth/callback/ibkr
   - Scope: trading

3. Copy the credentials and set in Netlify:
   netlify env:set IBKR_OAUTH_CLIENT_ID "your-client-id"
   netlify env:set IBKR_OAUTH_CLIENT_SECRET "your-client-secret"

4. Update local environment:
   Copy .env.example to .env.local and update with development credentials
`;

    fs.writeFileSync('IBKR_OAUTH_SETUP.md', oauthInstructions);

    // Create deployment script
    const deployScript = `
#!/bin/bash

# Build and deploy to Netlify
echo "🏗️ Building project..."
npm run build

echo "🚀 Deploying to Netlify..."
netlify deploy --prod

echo "✅ Deployment complete!"
`;

    fs.writeFileSync('deploy.sh', deployScript);
    execSync('chmod +x deploy.sh');

    // Success message
    console.log(`
✅ Netlify setup complete!

Next steps:
1. Follow the IBKR OAuth setup instructions in IBKR_OAUTH_SETUP.md
2. Update your local .env.local with development credentials
3. Run 'npm run dev' to test locally
4. Deploy to Netlify using './deploy.sh'

For more information, see the deployment documentation in docs/deployment.md
`);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupNetlify().catch(console.error);