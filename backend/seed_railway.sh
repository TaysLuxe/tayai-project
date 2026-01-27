#!/bin/bash
# Railway Seed Script Wrapper
# This script ensures the seed script runs correctly on Railway

set -e  # Exit on error

echo "Current directory: $(pwd)"
echo "Python version: $(python3 --version 2>&1 || python --version 2>&1 || echo 'Python not found')"
echo "Looking for seed_users.py or run_seed.py..."

# Railway containers use /app as working directory
# Try multiple locations to find the seed script
SCRIPT_PATH=""
WORK_DIR=""

# Check common locations
if [ -f "/app/seed_users.py" ]; then
    # Railway Docker container - files are in /app
    SCRIPT_PATH="/app/seed_users.py"
    WORK_DIR="/app"
elif [ -f "/app/run_seed.py" ]; then
    # Railway Docker container - using run_seed.py
    SCRIPT_PATH="/app/run_seed.py"
    WORK_DIR="/app"
elif [ -f "seed_users.py" ]; then
    # Current directory
    SCRIPT_PATH="seed_users.py"
    WORK_DIR="$(pwd)"
elif [ -f "run_seed.py" ]; then
    # Current directory
    SCRIPT_PATH="run_seed.py"
    WORK_DIR="$(pwd)"
elif [ -f "./backend/seed_users.py" ]; then
    # Project root, backend subdirectory
    SCRIPT_PATH="./backend/seed_users.py"
    WORK_DIR="./backend"
elif [ -f "./backend/run_seed.py" ]; then
    # Project root, backend subdirectory
    SCRIPT_PATH="./backend/run_seed.py"
    WORK_DIR="./backend"
elif [ -f "../backend/seed_users.py" ]; then
    # One level up
    SCRIPT_PATH="../backend/seed_users.py"
    WORK_DIR="../backend"
else
    echo "Error: seed_users.py or run_seed.py not found!"
    echo "Searched in:"
    echo "  - /app/seed_users.py"
    echo "  - /app/run_seed.py"
    echo "  - $(pwd)/seed_users.py"
    echo "  - $(pwd)/run_seed.py"
    echo "  - $(pwd)/backend/seed_users.py"
    echo "  - $(pwd)/backend/run_seed.py"
    echo ""
    echo "Current directory contents:"
    ls -la
    exit 1
fi

echo "Found seed script at: $SCRIPT_PATH"
if [ -n "$WORK_DIR" ] && [ "$WORK_DIR" != "$(pwd)" ]; then
    echo "Changing to directory: $WORK_DIR"
    cd "$WORK_DIR"
fi
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
echo "Executing: $PYTHON_CMD $SCRIPT_PATH"
$PYTHON_CMD "$SCRIPT_PATH"
