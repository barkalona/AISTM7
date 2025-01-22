# PowerShell script to generate secure secrets for environment variables

# Output colors
$Green = [System.ConsoleColor]::Green
$Blue = [System.ConsoleColor]::Cyan
$Red = [System.ConsoleColor]::Red

Write-Host "Generating secure secrets for AISTM7..." -ForegroundColor $Blue

# Function to generate a secure random string
function New-SecureSecret {
    param (
        [int]$length = 32
    )
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $bytes = New-Object byte[] $length
    $random.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Generate secrets
$NEXTAUTH_SECRET = New-SecureSecret
$JWT_SECRET = New-SecureSecret

# Create output
$output = @"
# Generated Secrets for AISTM7
# Generated on: $(Get-Date)

# NextAuth Secret (Required for authentication)
NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# JWT Secret (Required for API authentication)
JWT_SECRET=$JWT_SECRET

# Instructions:
# 1. Add these secrets to your Netlify environment variables
# 2. Update your .env.local and .env.production files
# 3. Keep these secrets secure and never commit them to version control

# Note: Generate new secrets for each environment (development, staging, production)
"@

# Save to file
$outputPath = "secrets.txt"
$output | Out-File -FilePath $outputPath -Encoding UTF8

Write-Host @"

Secrets generated successfully!

The following files have been created:
- $outputPath (Contains your generated secrets)

Next steps:
1. Add these secrets to Netlify:
   - Go to Site settings > Environment variables
   - Add NEXTAUTH_SECRET
   - Add JWT_SECRET

2. Update your local environment:
   - Copy secrets to .env.local
   - Copy secrets to .env.production

IMPORTANT: Keep these secrets secure and never commit them to version control!

"@ -ForegroundColor $Green

# Add secrets.txt to .gitignore if it's not already there
$gitignorePath = ".gitignore"
if (Test-Path $gitignorePath) {
    $gitignoreContent = Get-Content $gitignorePath
    if ($gitignoreContent -notcontains "secrets.txt") {
        Add-Content $gitignorePath "`nsecrets.txt"
        Write-Host "Added secrets.txt to .gitignore" -ForegroundColor $Blue
    }
} else {
    "secrets.txt" | Out-File -FilePath $gitignorePath -Encoding UTF8
    Write-Host "Created .gitignore and added secrets.txt" -ForegroundColor $Blue
}