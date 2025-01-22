#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Initializing AISTM7 Repository${NC}"

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo -e "${GREEN}Initializing git repository...${NC}"
    git init
else
    echo -e "${GREEN}Git repository already initialized${NC}"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo -e "${GREEN}Creating .gitignore...${NC}"
    cat > .gitignore << EOL
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

# Supabase
**/supabase/.branches
**/supabase/.temp
EOL
fi

# Add all files
echo -e "${GREEN}Adding files to git...${NC}"
git add .

# Initial commit
echo -e "${GREEN}Creating initial commit...${NC}"
git commit -m "Initial commit: AISTM7 platform"

echo -e "${BLUE}Repository initialized successfully!${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo "1. Create a new repository on GitHub"
echo "2. Run the following commands to push to GitHub:"
echo "   git remote add origin https://github.com/yourusername/AISTM7.git"
echo "   git branch -M main"
echo "   git push -u origin main"