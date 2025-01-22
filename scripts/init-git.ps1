# PowerShell script for initializing git repository and pushing to GitHub

# Output colors
$Green = [System.ConsoleColor]::Green
$Blue = [System.ConsoleColor]::Cyan
$Red = [System.ConsoleColor]::Red

Write-Host "Starting Git initialization for AISTM7..." -ForegroundColor $Blue

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check if git is installed
if (-not (Test-Command "git")) {
    Write-Host "Error: Git is not installed. Please install Git first." -ForegroundColor $Red
    exit 1
}

# Initialize git if not already initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor $Green
    git init
} else {
    Write-Host "Git repository already initialized" -ForegroundColor $Green
}

# Create .gitignore if it doesn't exist
if (-not (Test-Path ".gitignore")) {
    Write-Host "Creating .gitignore..." -ForegroundColor $Green
    @"
# Dependencies
node_modules/
.pnp/
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.production

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Database
*.sqlite
*.db

# Supabase
**/supabase/.branches
**/supabase/.temp
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
}

# Add remote if not already added
$remotes = git remote
if ($remotes -notcontains "origin") {
    Write-Host "Adding remote repository..." -ForegroundColor $Green
    git remote add origin https://github.com/barkalona/AISTM7.git
} else {
    Write-Host "Remote 'origin' already exists" -ForegroundColor $Green
}

# Stage all files
Write-Host "Staging files..." -ForegroundColor $Green
git add .

# Commit changes
Write-Host "Committing changes..." -ForegroundColor $Green
git commit -m "Initial project setup"

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor $Green
git branch -M main
git push -u origin main

Write-Host @"

Repository setup complete!

Next steps:
1. Go to Netlify (https://app.netlify.com/start)
2. Click 'Import from Git'
3. Select the AISTM7 repository
4. Configure build settings:
   - Build command: npm run build
   - Publish directory: .next
5. Set up environment variables in Netlify dashboard

For detailed instructions, see docs/setup-steps.md
"@ -ForegroundColor $Blue