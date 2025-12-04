#!/bin/bash

# Order Creation Endpoint Test
# Tests the POST /order endpoint for chatbot integration

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
echo -e "${CYAN}║       ORDER CREATION ENDPOINT TEST                         ║${NC}"
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

# Step 2: Get a product ID from bot structure
echo -e "\n${BLUE}[2/4] Getting product ID from menu...${NC}"
MENU_RESPONSE=$(curl -s "$BASE_URL/menu2/bot-structure?subDomain=$SUBDOMAIN&localId=$LOCALID" \
    -H "Authorization: Bearer $TOKEN")

PRODUCT_ID=$(echo "$MENU_RESPONSE" | grep -o '"id":"PROD[^"]*' | head -1 | sed 's/"id":"//')

if [ -z "$PRODUCT_ID" ]; then
    echo -e "${RED}✗ No products found in menu${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found product ID: ${YELLOW}$PRODUCT_ID${NC}"

# Step 3: Create a valid order
echo -e "\n${BLUE}[3/4] Testing POST /order (valid order)${NC}"

ORDER_JSON=$(cat <<EOF
{
  "customer": {
    "name": "Juan Pérez",
    "phone": "+51987654321",
    "email": "juan@example.com",
    "address": {
      "street": "Av. Larco 1234",
      "city": "Lima",
      "state": "Lima",
      "zipCode": "15074",
      "country": "Peru"
    }
  },
  "items": [
    {
      "productId": "$PRODUCT_ID",
      "name": "Test Product",
      "quantity": 2,
      "unitPrice": 15.99,
      "notes": "Sin cebolla"
    }
  ],
  "type": "delivery",
  "paymentMethod": "cash",
  "notes": "Llamar al llegar",
  "deliveryInfo": {
    "address": {
      "street": "Av. Larco 1234",
      "city": "Lima",
      "state": "Lima",
      "zipCode": "15074",
      "country": "Peru"
    },
    "deliveryInstructions": "Tocar el timbre 2 veces",
    "estimatedTime": 30
  }
}
EOF
)

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/order?subDomain=$SUBDOMAIN&localId=$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$ORDER_JSON")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Order created successfully (HTTP $HTTP_CODE)${NC}"
    ORDER_ID=$(echo "$BODY" | grep -o '"_id":"[^"]*' | head -1 | sed 's/"_id":"//')
    ORDER_NUMBER=$(echo "$BODY" | grep -o '"orderNumber":"[^"]*' | sed 's/"orderNumber":"//')
    echo -e "${YELLOW}Order ID: ${NC}$ORDER_ID"
    echo -e "${YELLOW}Order Number: ${NC}$ORDER_NUMBER"
    echo -e "\n${YELLOW}Full response:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}✗ Failed to create order (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
fi

# Step 4: Test without query parameters (should fail)
echo -e "\n${BLUE}[4/4] Testing without query parameters (should fail)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/order" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$ORDER_JSON")

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
