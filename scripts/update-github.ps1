# PowerShell script to update GitHub repository

# Output colors
$Green = [System.ConsoleColor]::Green
$Blue = [System.ConsoleColor]::Cyan
$Red = [System.ConsoleColor]::Red

Write-Host "Starting GitHub repository update for AISTM7..." -ForegroundColor $Blue

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check if git is installed
if (-not (Test-Command "git")) {
    Write-Host "Error: Git is not installed. Please install Git first." -ForegroundColor $Red
    exit 1
}

# Check if we're in the correct directory
$currentDir = Split-Path -Leaf (Get-Location)
if ($currentDir -ne "AISTM7") {
    Write-Host "Error: Please run this script from the AISTM7 root directory" -ForegroundColor $Red
    exit 1
}

try {
    # Initialize git if not already initialized
    if (-not (Test-Path ".git")) {
        Write-Host "Initializing git repository..." -ForegroundColor $Green
        git init
        if ($LASTEXITCODE -ne 0) { throw "Git init failed" }
    } else {
        Write-Host "Git repository already initialized" -ForegroundColor $Green
    }

    # Add all files
    Write-Host "Staging files..." -ForegroundColor $Green
    git add .
    if ($LASTEXITCODE -ne 0) { throw "Git add failed" }

    # Commit changes
    Write-Host "Committing changes..." -ForegroundColor $Green
    git commit -m "Setup deployment configuration"
    if ($LASTEXITCODE -ne 0) { throw "Git commit failed" }

    # Add remote if not already added
    $remotes = git remote
    if ($remotes -notcontains "origin") {
        Write-Host "Adding remote repository..." -ForegroundColor $Green
        git remote add origin "https://github.com/barkalona/AISTM7.git"
        if ($LASTEXITCODE -ne 0) { throw "Adding remote failed" }
    } else {
        Write-Host "Remote 'origin' already exists" -ForegroundColor $Green
    }

    # Push to GitHub
    Write-Host "Pushing to GitHub..." -ForegroundColor $Green
    git push -u origin main
    if ($LASTEXITCODE -ne 0) { throw "Git push failed" }

    Write-Host @"

Repository successfully updated!

Next steps:
1. Go to Netlify (https://app.netlify.com/start)
2. Click 'Import from Git'
3. Select the AISTM7 repository
4. Configure build settings:
   - Base directory: frontend
   - Build command: npm run build
   - Publish directory: .next
5. Add environment variables from secrets.txt

"@ -ForegroundColor $Green

} catch {
    Write-Host "Error: $_" -ForegroundColor $Red
    exit 1
}