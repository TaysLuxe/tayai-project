#!/bin/bash
# Test runner script for TayAI backend

set -e

echo "TayAI Backend Test Runner"
echo "========================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
echo "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Run tests
echo ""
echo "Running tests..."
echo ""

if [ "$1" == "unit" ]; then
    echo "Running unit tests only..."
    pytest tests/unit/ -v --tb=short
elif [ "$1" == "integration" ]; then
    echo "Running integration tests only..."
    pytest tests/integration/ -v --tb=short
elif [ "$1" == "coverage" ]; then
    echo "Running tests with coverage..."
    pytest tests/ --cov=app --cov-report=term --cov-report=html -v
    echo ""
    echo "Coverage report generated in htmlcov/index.html"
else
    echo "Running all tests..."
    pytest tests/ -v --tb=short
fi

echo ""
echo "Tests completed!"
