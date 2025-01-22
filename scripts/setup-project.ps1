# PowerShell script for setting up AISTM7 project

# Output colors
$Green = [System.ConsoleColor]::Green
$Blue = [System.ConsoleColor]::Cyan
$Red = [System.ConsoleColor]::Red

Write-Host "Starting AISTM7 Project Setup" -ForegroundColor $Blue

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check required tools
Write-Host "Checking required tools..." -ForegroundColor $Blue
$requiredTools = @("git", "node", "npm")
foreach ($tool in $requiredTools) {
    if (-not (Test-Command $tool)) {
        Write-Host "Error: $tool is not installed" -ForegroundColor $Red
        exit 1
    }
}

# Generate secrets
function New-Secret {
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $bytes = New-Object byte[] 32
    $random.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Setup environment variables
Write-Host "Setting up environment variables..." -ForegroundColor $Green

$NEXTAUTH_SECRET = New-Secret
$JWT_SECRET = New-Secret

# Create .env.local for frontend
$frontendEnv = @"
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

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
"@

New-Item -Path "frontend/.env.local" -Value $frontendEnv -Force

# Create .env for backend
$backendEnv = @"
# Server Configuration
PORT=8000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:aistm7@localhost:5432/aistm7

# JWT
JWT_SECRET=$JWT_SECRET
JWT_EXPIRY=24h

# Solana
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
"@

New-Item -Path "backend/.env" -Value $backendEnv -Force

# Connect to GitHub repository
Write-Host "Connecting to GitHub repository..." -ForegroundColor $Green
git remote remove origin 2>$null
git remote add origin https://github.com/barkalona/AISTM7.git
git fetch

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor $Green
Write-Host "Installing frontend dependencies..." -ForegroundColor $Blue
Set-Location frontend
npm install

Write-Host "Installing backend dependencies..." -ForegroundColor $Blue
Set-Location ../backend
npm install

# Build the project
Write-Host "Building the project..." -ForegroundColor $Green
Set-Location ../frontend
npm run build

# Create Netlify configuration
Write-Host "Creating Netlify configuration..." -ForegroundColor $Green
$netlifyConfig = @"
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[plugins]]
  package = "@netlify/plugin-nextjs"
"@

New-Item -Path "netlify.toml" -Value $netlifyConfig -Force

# Push changes to GitHub
Write-Host "Pushing changes to GitHub..." -ForegroundColor $Green
Set-Location ..
git add .
git commit -m "Initial project setup"
git push -u origin main

Write-Host @"

Setup complete! Next steps:

1. Set up Netlify:
   - Go to https://app.netlify.com/start
   - Choose 'Deploy with GitHub'
   - Select the AISTM7 repository
   - Configure the following environment variables in Netlify:
     * NEXTAUTH_URL=https://your-netlify-site.netlify.app
     * NEXTAUTH_SECRET=$NEXTAUTH_SECRET
     * DATABASE_URL=<your-supabase-connection-string>
     * NEXT_PUBLIC_SOLANA_NETWORK=devnet
     * NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

2. Set up Supabase Database:
   - Create a new project at https://supabase.com
   - Get the connection string
   - Update DATABASE_URL in Netlify environment variables
   - Run migrations:
     npm run prisma:deploy

3. Test the deployment:
   - Check the Netlify deployment logs
   - Verify the site is accessible
   - Test authentication flow
   - Verify database connection

"@ -ForegroundColor $Blue

# Return to original directory
Set-Location $PSScriptRoot