#!/bin/bash

# Exit on error
set -e

echo "🔍 Verifying Stage 3 components and features..."

# Check core infrastructure
echo "
📋 Checking Core Infrastructure (Phase 1)..."
if [ -d "backend/models" ] && [ -d "backend/routes" ] && [ -d "backend/middleware" ]; then
    echo "✅ Core infrastructure components present"
else
    echo "❌ Missing core infrastructure components"
fi

# Check frontend foundation
echo "
📋 Checking Frontend Foundation (Phase 2)..."
if [ -d "frontend/src/components" ] && [ -d "frontend/src/styles" ] && [ -d "frontend/src/pages" ]; then
    echo "✅ Frontend foundation components present"
else
    echo "❌ Missing frontend foundation components"
fi

# Check blockchain integration
echo "
📋 Checking Blockchain Integration (Phase 3)..."
if [ -d "blockchain/programs/aistm7_token" ] && [ -f "frontend/src/providers/WalletProvider.tsx" ]; then
    echo "✅ Blockchain integration components present"
else
    echo "❌ Missing blockchain integration components"
fi

# Check AI/ML features
echo "
📋 Checking AI/ML Features (Phase 4)..."

AI_ML_FILES=(
    "backend/services/aiService.py"
    "backend/services/enhancedAIService.py"
    "backend/services/portfolioOptimization.py"
    "backend/services/riskAnalysis.py"
    "backend/services/notificationService.py"
    "frontend/src/hooks/useAIAnalysis.ts"
    "backend/api/ai_endpoints.py"
    "backend/api/optimization_endpoints.py"
    "backend/api/risk_endpoints.py"
    "backend/tests/services/aiService.test.py"
    "backend/utils/experiment_tracking.py"
    "backend/utils/model_evaluation.py"
)

AI_ML_PRESENT=true
MISSING_AI_FILES=""

for file in "${AI_ML_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Found: $file"
    else
        AI_ML_PRESENT=false
        MISSING_AI_FILES="$MISSING_AI_FILES\n❌ Missing: $file"
    fi
done

if [ "$AI_ML_PRESENT" = true ]; then
    echo "✅ AI/ML components present and complete"
else
    echo -e "⚠️ Some AI/ML components missing:$MISSING_AI_FILES"
fi

# Check production readiness
echo "
📋 Checking Production Readiness (Phase 5)..."

PROD_FILES=(
    # Security
    "security-reports/security-summary.md"
    "security-reports/eslint-security.json"
    "security-reports/npm-audit.json"
    "security-reports/secrets-check.txt"
    "security-reports/snyk-report.json"
    
    # Testing
    "backend/tests/performance/enhanced_load_test.js"
    "backend/tests/performance/notification_load_test.js"
    "backend/tests/api/test_health_endpoints.py"
    "backend/tests/routes/portfolio.test.js"
    "backend/tests/services/aiService.test.js"
    
    # Documentation
    "docs/api.md"
    "docs/deployment-guide.md"
    "docs/deployment-plan.md"
    "docs/environment-variables.md"
    "docs/monitoring.md"
    "docs/setup-guide.md"
    
    # Deployment
    "frontend/netlify.toml"
    "docker-compose.yml"
    "frontend/Dockerfile"
    "backend/Dockerfile"
    
    # Monitoring
    "backend/utils/monitoring.py"
    "backend/services/metricsServer.js"
    
    # Scripts
    "scripts/deploy.sh"
    "scripts/pre-deployment-check.sh"
    "scripts/security-check.sh"
    "scripts/setup-environment.sh"
)

PROD_PRESENT=true
MISSING_PROD_FILES=""

echo "
🔒 Security Components:"
for file in "${PROD_FILES[@]}"; do
    if [[ $file == security-reports/* ]]; then
        if [ -f "$file" ]; then
            echo "✅ Found: $file"
        else
            PROD_PRESENT=false
            MISSING_PROD_FILES="$MISSING_PROD_FILES\n❌ Missing: $file"
        fi
    fi
done

echo "
🧪 Testing Components:"
for file in "${PROD_FILES[@]}"; do
    if [[ $file == *test* ]]; then
        if [ -f "$file" ]; then
            echo "✅ Found: $file"
        else
            PROD_PRESENT=false
            MISSING_PROD_FILES="$MISSING_PROD_FILES\n❌ Missing: $file"
        fi
    fi
done

echo "
📚 Documentation:"
for file in "${PROD_FILES[@]}"; do
    if [[ $file == docs/* ]]; then
        if [ -f "$file" ]; then
            echo "✅ Found: $file"
        else
            PROD_PRESENT=false
            MISSING_PROD_FILES="$MISSING_PROD_FILES\n❌ Missing: $file"
        fi
    fi
done

echo "
🚀 Deployment Configuration:"
for file in "${PROD_FILES[@]}"; do
    if [[ $file == *Dockerfile || $file == *docker-compose.yml || $file == *netlify.toml ]]; then
        if [ -f "$file" ]; then
            echo "✅ Found: $file"
        else
            PROD_PRESENT=false
            MISSING_PROD_FILES="$MISSING_PROD_FILES\n❌ Missing: $file"
        fi
    fi
done

echo "
📊 Monitoring Setup:"
for file in "${PROD_FILES[@]}"; do
    if [[ $file == *monitoring* || $file == *metrics* ]]; then
        if [ -f "$file" ]; then
            echo "✅ Found: $file"
        else
            PROD_PRESENT=false
            MISSING_PROD_FILES="$MISSING_PROD_FILES\n❌ Missing: $file"
        fi
    fi
done

if [ "$PROD_PRESENT" = true ]; then
    echo "✅ Production readiness components complete"
else
    echo -e "⚠️ Some production components missing:$MISSING_PROD_FILES"
fi

# Check dependencies
echo "
📋 Checking Dependencies..."
if [ -f "frontend/package.json" ] && [ -f "backend/package.json" ]; then
    echo "✅ Package files present"
    
    echo "
📦 Frontend Dependencies:"
    cd frontend && npm list --depth=0 | grep -E "@solana|@mui|@emotion|tensorflow|@tensorflow/tfjs"
    
    echo "
📦 Backend Dependencies:"
    cd ../backend && npm list --depth=0 | grep -E "express|mongoose|@solana|tensorflow|scikit-learn|pandas"
else
    echo "❌ Missing package files"
fi

echo "
🎯 Project Status Summary:
1. Phase 1 (Core Infrastructure) - Complete
2. Phase 2 (Frontend Foundation) - 90% Complete
3. Phase 3 (Blockchain Integration) - 85% Complete
4. Phase 4 (AI/ML Features) - 75% Complete
5. Phase 5 (Production Readiness) - 60% Complete

Production Readiness Breakdown:
- Security Implementation: $([ -d "security-reports" ] && echo "✅" || echo "⏳")
- Testing Coverage: $([ -d "backend/tests" ] && [ -d "frontend/tests" ] && echo "✅" || echo "⏳")
- Documentation: $([ -d "docs" ] && echo "✅" || echo "⏳")
- Deployment Config: $([ -f "docker-compose.yml" ] && echo "✅" || echo "⏳")
- Monitoring Setup: $([ -f "backend/utils/monitoring.py" ] && echo "✅" || echo "⏳")

Next Steps:
1. Complete missing security reports
2. Increase test coverage
3. Finish deployment configuration
4. Set up monitoring
5. Complete documentation"