#!/bin/bash
# Railway Seed Script Wrapper
# This script ensures the seed script runs correctly on Railway

set -e  # Exit on error

echo "Current directory: $(pwd)"
echo "Python version: $(python3 --version 2>&1 || python --version 2>&1 || echo 'Python not found')"
echo "Looking for seed_users.py..."

# Try to find seed_users.py in current directory or parent
if [ -f "seed_users.py" ]; then
    SCRIPT_PATH="seed_users.py"
elif [ -f "./backend/seed_users.py" ]; then
    SCRIPT_PATH="./backend/seed_users.py"
    cd backend
elif [ -f "../backend/seed_users.py" ]; then
    SCRIPT_PATH="../backend/seed_users.py"
    cd ../backend
else
    echo "Error: seed_users.py not found!"
    echo "Searched in:"
    echo "  - $(pwd)/seed_users.py"
    echo "  - $(pwd)/backend/seed_users.py"
    echo "  - $(dirname $(pwd))/backend/seed_users.py"
    exit 1
fi

echo "Found seed script at: $SCRIPT_PATH"
echo "Running from: $(pwd)"

# Try python3 first, then python
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "Error: Python not found!"
    exit 1
fi

echo "Using Python: $PYTHON_CMD"
$PYTHON_CMD "$SCRIPT_PATH"
