#!/bin/bash
# Script to restore railway.json after seeding (keep migrations, remove seeding)

echo "Updating railway.json configuration..."

# Keep migrations in start command (they should run on every deployment)
# But remove the seed command (only needed once)
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "sh -c \"python run_migrations.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}\"",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

echo "✓ Updated railway.json"
echo ""
echo "Migrations will continue to run on each deployment (this is good!)"
echo "Seed command has been removed (users already created)"
echo ""
echo "The start command now:"
echo "  1. Runs migrations (ensures DB schema is up to date)"
echo "  2. Starts the FastAPI server"
