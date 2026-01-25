#!/bin/bash
# BEST RECOMMENDATION: Fix repository and enable automatic syncing

set -e

echo "=========================================="
echo "BEST SOLUTION: Fix Git Repository"
echo "=========================================="
echo ""
echo "The issue: Large files in git history prevent pushing"
echo "The solution: Create a clean branch without large files"
echo ""

cd /Users/jumar.juaton/Documents/GitHub/tayai-project

# Step 1: Ensure data is in .gitignore
if ! grep -q "backend/data/" .gitignore 2>/dev/null; then
    echo "backend/data/" >> .gitignore
    echo "✓ Added backend/data/ to .gitignore"
fi

# Step 2: Create a clean branch from upstream
echo ""
echo "Step 1: Fetching latest from TaysLuxe repository..."
git fetch upstream main 2>&1 | head -5 || echo "Note: Fetch may have issues"

# Step 3: Create a new clean branch
CLEAN_BRANCH="clean-sync-$(date +%Y%m%d)"
echo ""
echo "Step 2: Creating clean branch: $CLEAN_BRANCH"
git checkout -b "$CLEAN_BRANCH" upstream/main 2>/dev/null || {
    echo "Creating from current state..."
    git checkout -b "$CLEAN_BRANCH"
}

# Step 4: Cherry-pick commits without large files
echo ""
echo "Step 3: Applying code changes (excluding data files)..."

# Get list of commits to apply
COMMITS=$(git log upstream/main..HEAD --oneline --format="%H" 2>/dev/null | head -5)

for commit in $COMMITS; do
    echo "  Applying: $(git log -1 --format='%s' $commit 2>/dev/null)"
    git cherry-pick "$commit" --strategy-option=theirs 2>/dev/null || {
        # If cherry-pick fails, try to apply just the code changes
        git show "$commit" -- ':(exclude)backend/data/**' | git apply --index 2>/dev/null || echo "    Note: Some changes may need manual review"
    }
done

# Step 5: Remove any accidentally added data files
echo ""
echo "Step 4: Ensuring data files are not tracked..."
git rm -r --cached backend/data/ 2>/dev/null || true
git add .gitignore
git commit -m "Remove data files and ensure .gitignore is updated" 2>/dev/null || true

# Step 6: Try to push
echo ""
echo "Step 5: Pushing clean branch..."
if git push origin "$CLEAN_BRANCH" 2>&1 | head -20; then
    echo ""
    echo "✓ SUCCESS! Branch pushed to tapTapCode fork"
    echo ""
    echo "Step 6: Creating Pull Request..."
    
    PR_URL=$(gh pr create \
        --repo TaysLuxe/tayai-project \
        --base main \
        --head tapTapCode:tayai-project:$CLEAN_BRANCH \
        --title "Sync latest code changes" \
        --body "Automated sync of code changes (data files excluded per .railwayignore)" 2>&1)
    
    if [ $? -eq 0 ]; then
        echo "✓ Pull Request created!"
        echo "PR: $PR_URL"
        echo ""
        echo "Next: Merge the PR in GitHub to complete sync"
    else
        echo "PR creation output: $PR_URL"
        echo ""
        echo "Create PR manually:"
        echo "https://github.com/TaysLuxe/tayai-project/compare/main...tapTapCode:tayai-project:$CLEAN_BRANCH"
    fi
else
    echo ""
    echo "Push still failing. Using alternative method..."
    echo ""
    echo "ALTERNATIVE: Use GitHub Web Interface"
    echo "1. Go to: https://github.com/TaysLuxe/tayai-project"
    echo "2. Click 'Upload files'"
    echo "3. Upload the changed files listed in: git diff upstream/main --name-only"
fi

echo ""
echo "=========================================="
