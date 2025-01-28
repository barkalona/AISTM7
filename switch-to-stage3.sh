#!/bin/bash

# Exit on error
set -e

echo "🔄 Switching to stage 3 branch..."

# Stash any local changes
echo "📦 Stashing local changes..."
git stash

# Fetch all branches
echo "⬇️ Fetching latest changes..."
git fetch origin

# Switch to stage 3 branch
echo "🔀 Switching to stage 3 branch..."
git checkout stage3 || git checkout -b stage3 origin/stage3

# Pull latest changes
echo "⬇️ Pulling latest changes..."
git pull origin stage3

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install
cd netlify/functions && npm install && cd ../..

echo "
✅ Successfully switched to stage 3 branch!

Your repository is now on:
$(git branch --show-current)

To start the development server:
cd frontend
npm run dev

To check the current status:
git status
"