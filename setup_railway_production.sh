#!/bin/bash

# Railway Production Setup Script
# This script helps configure production environment variables for Railway

set -e

echo "=========================================="
echo "TayAI - Railway Production Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}✗ Railway CLI not found${NC}"
    echo "Install with: curl -fsSL https://railway.app/install.sh | sh"
    exit 1
fi

echo -e "${GREEN}✓ Railway CLI found${NC}"
echo ""

# Check if project is linked
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}⚠ Not linked to Railway project${NC}"
    echo "Run: railway link"
    exit 1
fi

echo -e "${GREEN}✓ Project linked${NC}"
echo ""

# Generate secure JWT key
echo -e "${BLUE}Generating secure JWT secret key...${NC}"
JWT_SECRET=$(openssl rand -hex 32)
echo -e "${GREEN}✓ JWT Secret generated${NC}"
echo ""

# Display Railway project info
echo "=========================================="
echo "Railway Project Info"
echo "=========================================="
railway status
echo ""

# Function to set Railway variable
set_railway_var() {
    local service=$1
    local key=$2
    local value=$3

    echo -e "${BLUE}Setting $key for $service...${NC}"
    railway variables --set "$key=$value" --service "$service" 2>&1
}

echo "=========================================="
echo "Setting Backend Environment Variables"
echo "=========================================="
echo ""

# Prompt for OpenAI API Key
read -p "Enter your OpenAI API Key (or press Enter to skip): " OPENAI_KEY
if [ -n "$OPENAI_KEY" ]; then
    echo -e "${BLUE}Setting OPENAI_API_KEY...${NC}"
    railway variables --set "OPENAI_API_KEY=$OPENAI_KEY" --service backend
    echo -e "${GREEN}✓ OpenAI API Key set${NC}"
else
    echo -e "${YELLOW}⚠ Skipped OpenAI API Key${NC}"
fi
echo ""

# Set JWT Secret
echo -e "${BLUE}Setting JWT_SECRET_KEY...${NC}"
railway variables --set "JWT_SECRET_KEY=$JWT_SECRET" --service backend
echo -e "${GREEN}✓ JWT Secret set${NC}"
echo ""

# Set Environment
echo -e "${BLUE}Setting production environment variables...${NC}"
railway variables --set "ENVIRONMENT=production" --service backend
railway variables --set "DEBUG=false" --service backend
railway variables --set "JWT_ALGORITHM=HS256" --service backend
railway variables --set "JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30" --service backend
railway variables --set "JWT_REFRESH_TOKEN_EXPIRE_DAYS=7" --service backend
echo -e "${GREEN}✓ Environment variables set${NC}"
echo ""

# Set CORS
echo -e "${BLUE}Setting CORS origins...${NC}"
railway variables --set "BACKEND_CORS_ORIGINS=https://ai.taysluxeacademy.com,https://www.taysluxeacademy.com" --service backend
echo -e "${GREEN}✓ CORS origins set${NC}"
echo ""

# Set Usage Limits
echo -e "${BLUE}Setting usage limits...${NC}"
railway variables --set "BASIC_MEMBER_MESSAGES_PER_MONTH=50" --service backend
railway variables --set "VIP_MEMBER_MESSAGES_PER_MONTH=1000" --service backend
railway variables --set "BASIC_TIER_ACCESS_DAYS=21" --service backend
echo -e "${GREEN}✓ Usage limits set${NC}"
echo ""

# Set Skool Integration
echo -e "${BLUE}Setting Skool integration...${NC}"
railway variables --set "SKOOL_COMMUNITY_URL=https://www.skool.com/tla-hair-hutlers-co" --service backend
railway variables --set "SKOOL_ACCESS_START_DATE=2026-02-06T00:00:00Z" --service backend
railway variables --set "UPGRADE_URL_BASIC=https://www.skool.com/tla-hair-hutlers-co/about" --service backend
railway variables --set "UPGRADE_URL_VIP=https://www.skool.com/tla-hair-hutlers-co/about" --service backend
railway variables --set "UPGRADE_URL_GENERIC=https://www.skool.com/tla-hair-hutlers-co/about" --service backend
echo -e "${GREEN}✓ Skool integration configured${NC}"
echo ""

# Prompt for Skool Webhook Secret
read -p "Enter your Skool Webhook Secret (or press Enter to skip): " SKOOL_SECRET
if [ -n "$SKOOL_SECRET" ]; then
    railway variables --set "SKOOL_WEBHOOK_SECRET=$SKOOL_SECRET" --service backend
    echo -e "${GREEN}✓ Skool Webhook Secret set${NC}"
else
    echo -e "${YELLOW}⚠ Skipped Skool Webhook Secret${NC}"
fi
echo ""

echo "=========================================="
echo "Setting Frontend Environment Variables"
echo "=========================================="
echo ""

# Set Frontend API URLs
echo -e "${BLUE}Setting frontend API URLs...${NC}"
railway variables --set "NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com" --service frontend
railway variables --set "NEXT_PUBLIC_WS_URL=wss://api.taysluxeacademy.com" --service frontend
railway variables --set "NODE_ENV=production" --service frontend
echo -e "${GREEN}✓ Frontend variables set${NC}"
echo ""

echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo -e "${GREEN}✓ Backend environment variables configured${NC}"
echo -e "${GREEN}✓ Frontend environment variables configured${NC}"
echo -e "${GREEN}✓ JWT Secret generated and set${NC}"
echo -e "${GREEN}✓ Production settings applied${NC}"
echo ""

echo "=========================================="
echo "Generated Credentials"
echo "=========================================="
echo ""
echo -e "${YELLOW}JWT_SECRET_KEY:${NC}"
echo "$JWT_SECRET"
echo ""
echo -e "${RED}⚠ SAVE THIS KEY SECURELY - YOU WON'T SEE IT AGAIN!${NC}"
echo ""

echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Redeploy services to apply changes:"
echo "   ${BLUE}railway up --service backend${NC}"
echo "   ${BLUE}railway up --service frontend${NC}"
echo ""
echo "2. Monitor deployment logs:"
echo "   ${BLUE}railway logs --service backend --tail${NC}"
echo "   ${BLUE}railway logs --service frontend --tail${NC}"
echo ""
echo "3. Test endpoints:"
echo "   Backend: https://api.taysluxeacademy.com/docs"
echo "   Frontend: https://ai.taysluxeacademy.com"
echo ""
echo "4. Test Skool webhook:"
echo "   URL: https://api.taysluxeacademy.com/api/v1/membership/webhook/skool"
echo ""

read -p "Do you want to redeploy services now? (y/N): " REDEPLOY
if [[ $REDEPLOY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}Redeploying backend...${NC}"
    railway up --service backend
    echo ""
    echo -e "${BLUE}Redeploying frontend...${NC}"
    railway up --service frontend
    echo ""
    echo -e "${GREEN}✓ Services redeployed!${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠ Remember to redeploy services to apply changes!${NC}"
fi

echo ""
echo "=========================================="
echo "Setup Complete! 🚀"
echo "=========================================="
