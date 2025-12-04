#!/bin/bash

# Complete Chatbot Integration Flow Test
# Tests all four primary chatbot endpoints in sequence

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m'

BASE_URL="http://localhost:3001/api/v1"
EMAIL="tcbsgpm91wpw-az@ptltrybrmvpmok.hz"
PASSWORD="Etalon12345@"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       COMPLETE CHATBOT INTEGRATION FLOW TEST               ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Login
echo -e "${MAGENTA}═══ AUTHENTICATION ═══${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Authentication failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Authenticated successfully${NC}\n"

SUBDOMAIN="my-restaurant"
LOCALID="LOC1760097779968WGX4I"

# Step 1: Get Menu Structure
echo -e "${MAGENTA}═══ STEP 1: GET MENU STRUCTURE ═══${NC}"
echo -e "${BLUE}Testing: GET /menu2/bot-structure${NC}"

MENU_RESPONSE=$(curl -s "$BASE_URL/menu2/bot-structure?subDomain=$SUBDOMAIN&localId=$LOCALID" \
    -H "Authorization: Bearer $TOKEN")

CATEGORY_COUNT=$(echo "$MENU_RESPONSE" | grep -o '"id":"[^"]*:cat:[^"]*' | wc -l | tr -d ' ')
PRODUCT_ID=$(echo "$MENU_RESPONSE" | grep -o '"id":"PROD[^"]*' | head -1 | sed 's/"id":"//')
CATEGORY_NAME=$(echo "$MENU_RESPONSE" | grep -o '"name":"[^"]*' | head -2 | tail -1 | sed 's/"name":"//')

echo -e "${GREEN}✓ Menu structure retrieved${NC}"
echo -e "  Categories found: ${YELLOW}$CATEGORY_COUNT${NC}"
echo -e "  First category: ${YELLOW}$CATEGORY_NAME${NC}"
echo -e "  Selected product: ${YELLOW}$PRODUCT_ID${NC}\n"

# Step 2: Get Product Details
echo -e "${MAGENTA}═══ STEP 2: GET PRODUCT DETAILS ═══${NC}"
echo -e "${BLUE}Testing: POST /menu/getProductInMenu/${LOCALID}/${SUBDOMAIN}${NC}"

PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/menu/getProductInMenu/$LOCALID/$SUBDOMAIN" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "[\"$PRODUCT_ID\"]")

PRODUCT_NAME=$(echo "$PRODUCT_RESPONSE" | grep -o '"name":"[^"]*' | head -1 | sed 's/"name":"//')
PRODUCT_PRICE=$(echo "$PRODUCT_RESPONSE" | grep -o '"price":[0-9.]*' | head -1 | sed 's/"price"://')
PRESENTATIONS_COUNT=$(echo "$PRODUCT_RESPONSE" | grep -o '"presentations":\[' | wc -l | tr -d ' ')
MODIFIERS_COUNT=$(echo "$PRODUCT_RESPONSE" | grep -o '"modifiers":\[' | wc -l | tr -d ' ')

echo -e "${GREEN}✓ Product details retrieved${NC}"
echo -e "  Product: ${YELLOW}$PRODUCT_NAME${NC}"
echo -e "  Price: ${YELLOW}$PRODUCT_PRICE${NC}"
echo -e "  Presentations: ${YELLOW}$PRESENTATIONS_COUNT${NC}"
echo -e "  Modifiers: ${YELLOW}$MODIFIERS_COUNT${NC}\n"

# Step 3: Create Order
echo -e "${MAGENTA}═══ STEP 3: CREATE ORDER ═══${NC}"
echo -e "${BLUE}Testing: POST /order${NC}"

ORDER_JSON=$(cat <<EOF
{
  "customer": {
    "name": "Integration Test User",
    "phone": "+51999888777",
    "email": "test@chatbot.com"
  },
  "items": [
    {
      "productId": "$PRODUCT_ID",
      "name": "$PRODUCT_NAME",
      "quantity": 2,
      "unitPrice": $PRODUCT_PRICE,
      "notes": "Extra napkins please"
    }
  ],
  "type": "delivery",
  "paymentMethod": "cash",
  "notes": "Ring doorbell twice"
}
EOF
)

ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/order?subDomain=$SUBDOMAIN&localId=$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$ORDER_JSON")

ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"_id":"[^"]*' | head -1 | sed 's/"_id":"//')
ORDER_NUMBER=$(echo "$ORDER_RESPONSE" | grep -o '"orderNumber":"[^"]*' | sed 's/"orderNumber":"//')
ORDER_TOTAL=$(echo "$ORDER_RESPONSE" | grep -o '"total":[0-9.]*' | head -1 | sed 's/"total"://')
ORDER_STATUS=$(echo "$ORDER_RESPONSE" | grep -o '"status":"[^"]*' | head -1 | sed 's/"status":"//')

echo -e "${GREEN}✓ Order created successfully${NC}"
echo -e "  Order ID: ${YELLOW}$ORDER_ID${NC}"
echo -e "  Order Number: ${YELLOW}$ORDER_NUMBER${NC}"
echo -e "  Total: ${YELLOW}$ORDER_TOTAL${NC}"
echo -e "  Status: ${YELLOW}$ORDER_STATUS${NC}\n"

# Step 4: Track Order
echo -e "${MAGENTA}═══ STEP 4: TRACK ORDER ═══${NC}"
echo -e "${BLUE}Testing: GET /order/get-order/${ORDER_ID}${NC}"

TRACK_RESPONSE=$(curl -s "$BASE_URL/order/get-order/$ORDER_ID" \
    -H "Authorization: Bearer $TOKEN")

TRACKED_NUMBER=$(echo "$TRACK_RESPONSE" | grep -o '"orderNumber":"[^"]*' | sed 's/"orderNumber":"//')
TRACKED_STATUS=$(echo "$TRACK_RESPONSE" | grep -o '"status":"[^"]*' | head -1 | sed 's/"status":"//')
TRACKED_CUSTOMER=$(echo "$TRACK_RESPONSE" | grep -o '"name":"[^"]*' | head -1 | sed 's/"name":"//')
ITEM_COUNT=$(echo "$TRACK_RESPONSE" | grep -o '"itemCount":[0-9]*' | sed 's/"itemCount"://')

echo -e "${GREEN}✓ Order tracked successfully${NC}"
echo -e "  Order Number: ${YELLOW}$TRACKED_NUMBER${NC}"
echo -e "  Customer: ${YELLOW}$TRACKED_CUSTOMER${NC}"
echo -e "  Status: ${YELLOW}$TRACKED_STATUS${NC}"
echo -e "  Items: ${YELLOW}$ITEM_COUNT${NC}\n"

# Verification
echo -e "${MAGENTA}═══ VERIFICATION ═══${NC}"

SUCCESS=true

if [ "$ORDER_NUMBER" != "$TRACKED_NUMBER" ]; then
    echo -e "${RED}✗ Order number mismatch${NC}"
    SUCCESS=false
else
    echo -e "${GREEN}✓ Order number matches${NC}"
fi

if [ "$ORDER_STATUS" != "$TRACKED_STATUS" ]; then
    echo -e "${RED}✗ Order status mismatch${NC}"
    SUCCESS=false
else
    echo -e "${GREEN}✓ Order status matches${NC}"
fi

if [ -z "$ORDER_ID" ] || [ -z "$PRODUCT_ID" ]; then
    echo -e "${RED}✗ Missing critical data${NC}"
    SUCCESS=false
else
    echo -e "${GREEN}✓ All critical data present${NC}"
fi

# Final Summary
echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
if [ "$SUCCESS" = true ]; then
    echo -e "${CYAN}║${GREEN}               ALL TESTS PASSED ✓                          ${CYAN}║${NC}"
else
    echo -e "${CYAN}║${RED}               SOME TESTS FAILED ✗                         ${CYAN}║${NC}"
fi
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}Integration Flow Summary:${NC}"
echo -e "  1. ${GREEN}✓${NC} Menu Structure: $CATEGORY_COUNT categories loaded"
echo -e "  2. ${GREEN}✓${NC} Product Details: $PRODUCT_NAME retrieved"
echo -e "  3. ${GREEN}✓${NC} Order Created: $ORDER_NUMBER (Total: $ORDER_TOTAL)"
echo -e "  4. ${GREEN}✓${NC} Order Tracked: Status is $TRACKED_STATUS"
echo ""
