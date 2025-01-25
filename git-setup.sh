#!/bin/bash

# Exit on error
set -e

echo "🔧 Setting up Git repository for AISTM7"

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "Creating .gitignore..."
    cat > .gitignore << EOL
# Dependencies
node_modules/
.pnp
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

# Debug logs
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

# Netlify
.netlify/
EOL
fi

# Stage all files
echo "Staging files..."
git add .

# Show status
echo "📝 Current Git status:"
git status

echo "
Next steps:

1. Review the files to be committed:
   git status

2. Make initial commit:
   git commit -m 'Initial commit'

3. Add your remote repository:
   git remote add origin <your-repository-url>

4. Push your changes:
   git push -u origin main

5. Then connect to Netlify:
   cd frontend
   netlify init

This will:
- Link your repository to Netlify
- Set up continuous deployment
- Configure build settings

Remember to:
- Keep .env.local out of git (it's in .gitignore)
- Set up environment variables in Netlify dashboard
- Enable automatic deployments in Netlify

Would you like to proceed with the commit now? (y/n)"

read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    # Commit changes
    git commit -m "Initial commit: AISTM7 project setup"
    echo "✅ Changes committed successfully!"
    echo "
Now you can:
1. Add your remote repository:
   git remote add origin <your-repository-url>

2. Push your changes:
   git push -u origin main

3. Set up Netlify:
   cd frontend
   netlify init"
else
    echo "Okay, you can commit the changes later when ready."
fi