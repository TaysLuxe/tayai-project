#!/bin/bash
# One-time seed script for Railway
# This script seeds users only if they don't already exist

set -e

echo "=========================================="
echo "Railway User Seeding Script"
echo "=========================================="
echo ""

# Check if seed_users.py exists
if [ ! -f "seed_users.py" ]; then
    echo "Error: seed_users.py not found!"
    echo "Current directory: $(pwd)"
    echo "Files in current directory:"
    ls -la
    exit 1
fi

echo "Running seed script..."
python3 seed_users.py

echo ""
echo "=========================================="
echo "Seeding completed!"
echo "=========================================="
