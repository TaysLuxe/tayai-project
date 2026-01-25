#!/bin/bash
# Automated sync using GitHub API to update files directly in TaysLuxe repo

set -e

REPO="TaysLuxe/tayai-project"
GITHUB_TOKEN=$(gh auth token 2>/dev/null || echo "")

if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GitHub token not found. Please run: gh auth login"
    exit 1
fi

echo "Syncing files to $REPO using GitHub API..."

# Get list of changed files (excluding data directory)
CHANGED_FILES=$(git diff upstream/main --name-only 2>/dev/null | grep -v "backend/data/" | grep -v "^$" || echo "")

if [ -z "$CHANGED_FILES" ]; then
    echo "No changes detected (excluding data files)"
    echo "Checking if we need to sync specific files..."
    
    # Check for important files that might need syncing
    IMPORTANT_FILES=(
        "backend/app/services/rag_service.py"
        "backend/app/db/models.py"
        "backend/alembic/versions/"
        "README.md"
        "RAILWAY_DEPLOYMENT_GUIDE.md"
    )
    
    for file in "${IMPORTANT_FILES[@]}"; do
        if [ -f "$file" ] || [ -d "$file" ]; then
            echo "Found: $file"
        fi
    done
fi

echo ""
echo "Since direct push is failing, here's the best automated solution:"
echo ""
echo "OPTION 1: Use GitHub Web Interface (Recommended)"
echo "1. Go to: https://github.com/TaysLuxe/tayai-project"
echo "2. Click 'Upload files' or edit files directly"
echo "3. Upload/update the changed files"
echo ""
echo "OPTION 2: I can create a detailed file list for manual sync"
echo ""
echo "OPTION 3: Use GitHub Desktop or another Git client that handles large files better"
echo ""

# Try to get the file list for manual sync
echo "Files that need syncing (excluding backend/data/):"
git diff upstream/main --name-only 2>/dev/null | grep -v "backend/data/" | head -20 || echo "Unable to determine changed files"
