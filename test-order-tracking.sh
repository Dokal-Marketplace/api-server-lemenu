#!/bin/bash

# Order Tracking Endpoint Test
# Tests the GET /order/get-order/{orderId} endpoint

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
echo -e "${CYAN}║       ORDER TRACKING ENDPOINT TEST                         ║${NC}"
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

# Step 2: Create a test order first
echo -e "\n${BLUE}[2/4] Creating test order...${NC}"

ORDER_JSON='{
  "customer": {
    "name": "Test Tracking",
    "phone": "+51987654321"
  },
  "items": [
    {
      "productId": "PROD17601042157470SR6K",
      "name": "Test Product",
      "quantity": 1,
      "unitPrice": 15.50
    }
  ],
  "type": "pickup",
  "paymentMethod": "cash"
}'

CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/order?subDomain=$SUBDOMAIN&localId=$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$ORDER_JSON")

ORDER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | sed 's/"_id":"//')
ORDER_NUMBER=$(echo "$CREATE_RESPONSE" | grep -o '"orderNumber":"[^"]*' | sed 's/"orderNumber":"//')

if [ -z "$ORDER_ID" ]; then
    echo -e "${RED}✗ Failed to create order${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Order created${NC}"
echo -e "${YELLOW}Order ID: ${NC}$ORDER_ID"
echo -e "${YELLOW}Order Number: ${NC}$ORDER_NUMBER"

# Step 3: Track the order by ID
echo -e "\n${BLUE}[3/4] Testing GET /order/get-order/${ORDER_ID}${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/order/get-order/$ORDER_ID" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Order retrieved successfully (HTTP $HTTP_CODE)${NC}"

    # Extract key information
    TRACKED_NUMBER=$(echo "$BODY" | grep -o '"orderNumber":"[^"]*' | sed 's/"orderNumber":"//')
    STATUS=$(echo "$BODY" | grep -o '"status":"[^"]*' | sed 's/"status":"//')
    TOTAL=$(echo "$BODY" | grep -o '"total":[0-9.]*' | sed 's/"total"://')

    echo -e "${YELLOW}Order Number: ${NC}$TRACKED_NUMBER"
    echo -e "${YELLOW}Status: ${NC}$STATUS"
    echo -e "${YELLOW}Total: ${NC}$TOTAL"

    echo -e "\n${YELLOW}Full response:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Failed to retrieve order (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi

# Step 4: Test with invalid order ID (should return 404)
echo -e "\n${BLUE}[4/4] Testing with invalid order ID (should fail)${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/order/get-order/invalid-id-123" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}✓ Correct 404 response for invalid ID (HTTP $HTTP_CODE)${NC}"
    echo -e "${YELLOW}Error message: ${NC}$BODY"
else
    echo -e "${RED}✗ Expected HTTP 404 but got $HTTP_CODE${NC}"
    echo "$BODY"
fi

# Summary
echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                   TEST COMPLETED                           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}\n"
