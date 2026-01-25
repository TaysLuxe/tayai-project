#!/bin/bash
# Automated sync of critical files using GitHub API

set -e

REPO="TaysLuxe/tayai-project"
BRANCH="main"

echo "Automated sync to $REPO"
echo "========================"
echo ""

# Get GitHub token
TOKEN=$(gh auth token 2>/dev/null || echo "")
if [ -z "$TOKEN" ]; then
    echo "Error: GitHub CLI not authenticated"
    echo "Run: gh auth login"
    exit 1
fi

# Critical files to sync (most important first)
CRITICAL_FILES=(
    "backend/app/services/rag_service.py"
    "backend/app/db/models.py"
    "backend/alembic/versions/33b4f801267b_rename_metadata_to_meta_data_in_vector_.py"
    "backend/app/services/knowledge_service.py"
    "README.md"
)

echo "Syncing critical files..."
echo ""

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing: $file"
        
        # Get file content and encode
        CONTENT=$(cat "$file" | base64)
        SHA=$(gh api "repos/$REPO/contents/$file?ref=$BRANCH" 2>/dev/null | jq -r '.sha' || echo "")
        
        if [ -n "$SHA" ] && [ "$SHA" != "null" ]; then
            # Update existing file
            gh api -X PUT "repos/$REPO/contents/$file" \
                -f message="Update $file" \
                -f content="$CONTENT" \
                -f sha="$SHA" \
                -f branch="$BRANCH" >/dev/null 2>&1 && echo "  ✓ Updated" || echo "  ✗ Failed"
        else
            # Create new file
            gh api -X PUT "repos/$REPO/contents/$file" \
                -f message="Add $file" \
                -f content="$CONTENT" \
                -f branch="$BRANCH" >/dev/null 2>&1 && echo "  ✓ Created" || echo "  ✗ Failed"
        fi
    else
        echo "Skipping (not found): $file"
    fi
done

echo ""
echo "Critical files sync complete!"
echo ""
echo "For remaining files, use: https://github.com/$REPO/upload"
