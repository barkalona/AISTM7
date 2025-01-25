#!/bin/bash

# Exit on error
set -e

echo "🔒 Running Security Checks..."

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check required tools
echo "Checking required security tools..."
REQUIRED_TOOLS=("npm" "snyk" "eslint" "prettier")
MISSING_TOOLS=()

for tool in "${REQUIRED_TOOLS[@]}"; do
  if ! command_exists "$tool"; then
    MISSING_TOOLS+=("$tool")
  fi
done

if [ ${#MISSING_TOOLS[@]} -ne 0 ]; then
  echo "❌ Missing required tools: ${MISSING_TOOLS[*]}"
  echo "Please install missing tools and try again"
  exit 1
fi

# Directory for security reports
REPORT_DIR="security-reports"
mkdir -p "$REPORT_DIR"

echo "📝 Running dependency security audit..."
# Run npm audit
npm audit --json > "$REPORT_DIR/npm-audit.json" || true
echo "NPM audit report saved to $REPORT_DIR/npm-audit.json"

# Run Snyk security test if available
if command_exists snyk; then
  echo "🔍 Running Snyk security test..."
  snyk test --json > "$REPORT_DIR/snyk-report.json" || true
  echo "Snyk report saved to $REPORT_DIR/snyk-report.json"
fi

echo "🔍 Checking for sensitive data in code..."
# Check for potential secrets in code
SECRETS_PATTERN="(password|secret|key|token|auth|credential)[\"']?\s*[:=]\s*[\"'][^\"\']+"
find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" \) -not -path "./node_modules/*" -not -path "./build/*" -exec grep -H -n "$SECRETS_PATTERN" {} \; > "$REPORT_DIR/secrets-check.txt" || true

# Check environment variables
echo "🔐 Checking environment variables..."
REQUIRED_ENV_VARS=(
  "NEXT_PUBLIC_APP_URL"
  "NEXTAUTH_SECRET"
  "SOLANA_RPC_URL"
  "TOKEN_MINT_ADDRESS"
  "DATABASE_URL"
  "EMAIL_SERVER_HOST"
)

MISSING_ENV=()
for var in "${REQUIRED_ENV_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_ENV+=("$var")
  fi
done

if [ ${#MISSING_ENV[@]} -ne 0 ]; then
  echo "⚠️ Missing required environment variables: ${MISSING_ENV[*]}"
  echo "Please set these variables before deployment"
fi

# Check security headers
echo "🛡️ Checking security headers..."
if ! grep -q "Content-Security-Policy" frontend/netlify.toml; then
  echo "⚠️ Warning: Content-Security-Policy header not found in netlify.toml"
fi

if ! grep -q "X-Frame-Options" frontend/netlify.toml; then
  echo "⚠️ Warning: X-Frame-Options header not found in netlify.toml"
fi

# Check authentication implementation
echo "🔑 Checking authentication implementation..."
AUTH_FILES=(
  "frontend/src/app/api/auth"
  "frontend/src/hooks/useAuth.ts"
  "backend/middleware/auth.js"
)

for file in "${AUTH_FILES[@]}"; do
  if [ ! -e "$file" ]; then
    echo "⚠️ Warning: Authentication file not found: $file"
  fi
done

# Check CORS configuration
echo "🌐 Checking CORS configuration..."
if ! grep -q "cors" backend/services/api.js; then
  echo "⚠️ Warning: CORS configuration not found in API service"
fi

# Check rate limiting
echo "⚡ Checking rate limiting..."
if ! grep -q "rate-limit" backend/services/api.js; then
  echo "⚠️ Warning: Rate limiting not found in API service"
fi

# Run ESLint security plugin
echo "🔍 Running ESLint security checks..."
npx eslint --plugin security --config .eslintrc.js . --format json > "$REPORT_DIR/eslint-security.json" || true

# Generate summary report
echo "📊 Generating security summary..."
cat << EOF > "$REPORT_DIR/security-summary.md"
# Security Check Summary
Date: $(date)

## Environment Variables
- Total Required: ${#REQUIRED_ENV_VARS[@]}
- Missing: ${#MISSING_ENV[@]}

## Dependency Audit
- NPM Audit: Complete (see npm-audit.json)
- Snyk Test: Complete (see snyk-report.json)

## Code Analysis
- ESLint Security: Complete (see eslint-security.json)
- Secrets Check: Complete (see secrets-check.txt)

## Security Headers
- Content-Security-Policy
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options

## Authentication
- NextAuth.js Implementation
- JWT Handling
- Session Management

## API Security
- CORS Configuration
- Rate Limiting
- Input Validation

Please review the detailed reports in the $REPORT_DIR directory.
EOF

echo "✅ Security check complete! Review the reports in $REPORT_DIR"

# Exit with warning if there are any missing environment variables
if [ ${#MISSING_ENV[@]} -ne 0 ]; then
  exit 1
fi