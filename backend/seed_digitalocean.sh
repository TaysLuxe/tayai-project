#!/bin/bash
# Digital Ocean Seed Script Wrapper
# This script ensures the seed script runs correctly on Digital Ocean

set -e  # Exit on error

echo "=========================================="
echo "Digital Ocean Seeder Script"
echo "=========================================="
echo "Current directory: $(pwd)"
echo "Python version: $(python3 --version 2>&1 || python --version 2>&1 || echo 'Python not found')"
echo ""

# Navigate to backend directory if not already there
if [ -f "seed_users.py" ]; then
    SCRIPT_DIR="$(pwd)"
elif [ -f "./backend/seed_users.py" ]; then
    cd backend
    SCRIPT_DIR="$(pwd)"
elif [ -f "../backend/seed_users.py" ]; then
    cd ../backend
    SCRIPT_DIR="$(pwd)"
else
    echo "Error: seed_users.py not found!"
    echo "Searched in:"
    echo "  - $(pwd)/seed_users.py"
    echo "  - $(pwd)/backend/seed_users.py"
    echo "  - $(dirname $(pwd))/backend/seed_users.py"
    exit 1
fi

echo "Found seed script in: $SCRIPT_DIR"
echo "Running from: $(pwd)"
echo ""

# Check if virtual environment exists and activate it
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
elif [ -d ".venv" ]; then
    echo "Activating virtual environment..."
    source .venv/bin/activate
fi

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
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Warning: DATABASE_URL environment variable not set!"
    echo "Make sure your .env file is loaded or DATABASE_URL is exported."
    echo ""
fi

# Run the seed script
echo "=========================================="
echo "Running seeder..."
echo "=========================================="
$PYTHON_CMD run_seed.py

echo ""
echo "=========================================="
echo "Seeder completed!"
echo "=========================================="
