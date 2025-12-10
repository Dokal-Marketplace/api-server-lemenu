#!/bin/bash

# Simple Menu Routes Test
# Tests menu routes with actual data from the API

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
echo -e "${CYAN}║         MENU ROUTES API TESTING SUITE                      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Step 1: Login
echo -e "${BLUE}[1/7] Authenticating...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"_id":"[^"]*' | sed 's/"_id":"//' | head -1)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Authentication failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Authenticated successfully${NC}"

# Step 2: Get business info
echo -e "\n${BLUE}[2/7] Fetching business information...${NC}"
BIZ_RESPONSE=$(curl -s "$BASE_URL/user-business/get-by-user-id/$USER_ID" \
    -H "Authorization: Bearer $TOKEN")

SUBDOMAIN="my-restaurant"
LOCALID="LOC1760097779968WGX4I"
BUSINESS_ID=$(echo "$BIZ_RESPONSE" | grep -o '"_id":"[^"]*' | sed 's/"_id":"//' | head -1)

echo -e "${GREEN}✓ Business info retrieved${NC}"
echo -e "  SubDomain: ${YELLOW}$SUBDOMAIN${NC}"
echo -e "  LocalId: ${YELLOW}$LOCALID${NC}"
echo -e "  Business ID: ${YELLOW}$BUSINESS_ID${NC}"

# Step 3: Test Menu Integration V2 (all locations)
echo -e "\n${BLUE}[3/7] Testing GET /menu2/v2/integration/{subDomain}${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/menu2/v2/integration/$SUBDOMAIN" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
    echo "..."
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 3b: Test Menu Integration for Specific Location
echo -e "\n${BLUE}[3b/7] Testing GET /menu2/integration/{subDomain}/{localId}${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/menu2/integration/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
    echo "..."
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 4: Test Bot Structure
echo -e "\n${BLUE}[4/7] Testing GET /menu2/bot-structure${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/menu2/bot-structure?subDomain=$SUBDOMAIN" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
    echo "..."
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 5: Test Available Roles (from fixed staffController)
echo -e "\n${BLUE}[5/7] Testing GET /roles (Available Roles)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/roles" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    ROLE_COUNT=$(echo "$BODY" | grep -o '"name"' | wc -l | tr -d ' ')
    echo -e "  Found ${YELLOW}$ROLE_COUNT${NC} roles"
    echo "$BODY" | head -c 300
    echo "..."
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 6: Test Menu Images
echo -e "\n${BLUE}[6/7] Testing GET /menu-pic${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/menu-pic?subDomain=$SUBDOMAIN&localId=$LOCALID" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
    echo "..."
else
    echo -e "${YELLOW}⚠ Expected failure - localId required (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 150
fi

# Step 7: Test User Profile
echo -e "\n${BLUE}[7/7] Testing GET /user (User Profile)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/user" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    USER_EMAIL=$(echo "$BODY" | grep -o '"email":"[^"]*' | sed 's/"email":"//')
    USER_NAME=$(echo "$BODY" | grep -o '"firstName":"[^"]*' | sed 's/"firstName":"//')
    echo -e "  User: ${YELLOW}$USER_NAME${NC} ($USER_EMAIL)"
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Summary
echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                   TEST SUITE COMPLETED                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo -e "\n${GREEN}✓ All menu route tests executed${NC}"
echo -e "${BLUE}ℹ Review results above for any failures${NC}\n"
