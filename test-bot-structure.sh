#!/bin/bash

# Bot Structure Endpoint Detailed Test
# Tests the /menu2/bot-structure endpoint with detailed output

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:3001/api/v1"
EMAIL="tcbsgpm91wpw-az@ptltrybrmvpmok.hz"
PASSWORD="Etalon12345@"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       BOT STRUCTURE ENDPOINT DETAILED TEST                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Step 1: Login
echo -e "${BLUE}[1/4] Authenticating...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Authentication failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Authenticated successfully${NC}"

SUBDOMAIN="my-restaurant"
LOCALID="LOC1760097779968WGX4I"

# Test 1: Bot Structure with subDomain only
echo -e "\n${BLUE}[2/4] Testing GET /menu2/bot-structure?subDomain=${SUBDOMAIN}${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/menu2/bot-structure?subDomain=$SUBDOMAIN" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    echo -e "\n${YELLOW}Response structure:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi

# Test 2: Bot Structure with subDomain and localId
echo -e "\n${BLUE}[3/4] Testing GET /menu2/bot-structure?subDomain=${SUBDOMAIN}&localId=${LOCALID}${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/menu2/bot-structure?subDomain=$SUBDOMAIN&localId=$LOCALID" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    echo -e "\n${YELLOW}Response structure:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi

# Test 3: Bot Structure without subDomain (should fail)
echo -e "\n${BLUE}[4/4] Testing GET /menu2/bot-structure (no params - should fail)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/menu2/bot-structure" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ Validation working correctly (HTTP $HTTP_CODE)${NC}"
    echo -e "${YELLOW}Error message: ${NC}$BODY"
else
    echo -e "${RED}✗ Expected HTTP 400 but got $HTTP_CODE${NC}"
    echo "$BODY"
fi

# Summary
echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                   TEST COMPLETED                           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}\n"
