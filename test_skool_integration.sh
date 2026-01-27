#!/bin/bash

# Skool Integration Test Script
# This script provides quick tests for Skool webhook integration

BASE_URL="http://localhost:8000"
WEBHOOK_URL="${BASE_URL}/api/v1/membership/webhook/skool"

echo "=========================================="
echo "Skool Integration Test Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Create Basic User
echo -e "${YELLOW}Test 1: Create Basic User (member.joined - Hair Hu\$tlers Co)${NC}"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.joined",
    "data": {
      "member": {
        "id": "skool_member_123",
        "email": "test_basic_'$(date +%s)'@example.com",
        "name": "Test Basic User",
        "username": "testbasic"
      },
      "group": {
        "id": "skool_group_1",
        "name": "Hair Hu$tlers Co."
      }
    }
  }')

echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q '"status":"created"'; then
  echo -e "${GREEN}✓ Test 1 PASSED${NC}"
else
  echo -e "${RED}✗ Test 1 FAILED${NC}"
fi
echo ""

# Test 2: Create VIP User
echo -e "${YELLOW}Test 2: Create VIP User (member.joined - Hair Hu\$tlers Elite)${NC}"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.joined",
    "data": {
      "member": {
        "id": "skool_member_456",
        "email": "test_vip_'$(date +%s)'@example.com",
        "name": "Test VIP User",
        "username": "testvip"
      },
      "group": {
        "id": "skool_group_2",
        "name": "Hair Hu$tlers Elite"
      }
    }
  }')

echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q '"status":"created"'; then
  echo -e "${GREEN}✓ Test 2 PASSED${NC}"
else
  echo -e "${RED}✗ Test 2 FAILED${NC}"
fi
echo ""

# Test 3: Subscription Upgrade
echo -e "${YELLOW}Test 3: Subscription Upgrade (member.paid)${NC}"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.paid",
    "data": {
      "member": {
        "id": "skool_member_789",
        "email": "test@example.com",
        "name": "Test User"
      },
      "group": {
        "id": "skool_group_2",
        "name": "Hair Hu$tlers Elite"
      }
    }
  }')

echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q '"status":"updated"'; then
  echo -e "${GREEN}✓ Test 3 PASSED${NC}"
else
  echo -e "${RED}✗ Test 3 FAILED${NC}"
fi
echo ""

# Test 4: Subscription Cancelled
echo -e "${YELLOW}Test 4: Subscription Cancelled (member.cancelled)${NC}"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.cancelled",
    "data": {
      "member": {
        "id": "skool_member_789",
        "email": "vip@example.com",
        "name": "VIP User"
      },
      "group": {
        "id": "skool_group_2",
        "name": "Hair Hu$tlers Elite"
      }
    }
  }')

echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q '"status":"downgraded"'; then
  echo -e "${GREEN}✓ Test 4 PASSED${NC}"
else
  echo -e "${RED}✗ Test 4 FAILED${NC}"
fi
echo ""

# Test 5: Missing Email (Error Handling)
echo -e "${YELLOW}Test 5: Missing Email (Error Handling)${NC}"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.joined",
    "data": {
      "member": {
        "id": "skool_member_000"
      },
      "group": {
        "name": "Hair Hu$tlers Co."
      }
    }
  }')

echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q '"status":"ignored"'; then
  echo -e "${GREEN}✓ Test 5 PASSED${NC}"
else
  echo -e "${RED}✗ Test 5 FAILED${NC}"
fi
echo ""

# Test 6: Invalid Platform
echo -e "${YELLOW}Test 6: Invalid Platform${NC}"
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/membership/webhook/invalid" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q "Unsupported platform"; then
  echo -e "${GREEN}✓ Test 6 PASSED${NC}"
else
  echo -e "${RED}✗ Test 6 FAILED${NC}"
fi
echo ""

# Test 7: Direct Skool Format (no Zapier wrapper)
echo -e "${YELLOW}Test 7: Direct Skool Format (no Zapier wrapper)${NC}"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.joined",
    "member": {
      "id": "skool_member_999",
      "email": "direct_'$(date +%s)'@example.com",
      "name": "Direct User",
      "username": "directuser"
    },
    "group": {
      "id": "skool_group_1",
      "name": "Hair Hu$tlers Co"
    }
  }')

echo "Response: $RESPONSE"
if echo "$RESPONSE" | grep -q '"status":"created"'; then
  echo -e "${GREEN}✓ Test 7 PASSED${NC}"
else
  echo -e "${RED}✗ Test 7 FAILED${NC}"
fi
echo ""

echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check database for created/updated users"
echo "2. Test admin endpoints (see SKOOL_TESTING_GUIDE.md)"
echo "3. View API docs: ${BASE_URL}/docs"
echo ""
