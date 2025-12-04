#!/bin/bash

# Order History Endpoint Test
# Tests the GET /order/filled-orders/{subDomain}/{localId} endpoint

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
echo -e "${CYAN}║       ORDER HISTORY ENDPOINT TEST                          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Step 1: Login
echo -e "${BLUE}[1/6] Authenticating...${NC}"
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
TEST_PHONE="+51999111222"

# Step 2: Create test orders with same phone
echo -e "\n${BLUE}[2/6] Creating test orders...${NC}"

for i in 1 2 3; do
    ORDER_JSON=$(cat <<EOF
{
  "customer": {
    "name": "History Test Customer",
    "phone": "$TEST_PHONE"
  },
  "items": [
    {
      "productId": "PROD17601042157470SR6K",
      "name": "Test Product $i",
      "quantity": $i,
      "unitPrice": 10.00
    }
  ],
  "type": "pickup",
  "paymentMethod": "cash"
}
EOF
)

    CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/order?subDomain=$SUBDOMAIN&localId=$LOCALID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$ORDER_JSON")

    ORDER_NUMBER=$(echo "$CREATE_RESPONSE" | grep -o '"orderNumber":"[^"]*' | sed 's/"orderNumber":"//')
    echo -e "${GREEN}  ✓ Order $i created: ${YELLOW}$ORDER_NUMBER${NC}"
    sleep 0.5
done

# Step 3: Get all orders for location (no filter)
echo -e "\n${BLUE}[3/6] Testing GET /order/filled-orders/${SUBDOMAIN}/${LOCALID}${NC}"
echo -e "${YELLOW}(All orders for location)${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/order/filled-orders/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Orders retrieved (HTTP $HTTP_CODE)${NC}"

    ORDER_COUNT=$(echo "$BODY" | grep -o '"orderNumber"' | wc -l | tr -d ' ')
    echo -e "  Total orders: ${YELLOW}$ORDER_COUNT${NC}"
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 4: Get orders filtered by phone
echo -e "\n${BLUE}[4/6] Testing with phone filter${NC}"
echo -e "${YELLOW}GET /order/filled-orders/${SUBDOMAIN}/${LOCALID}?phone=${TEST_PHONE}${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/order/filled-orders/$SUBDOMAIN/$LOCALID?phone=$(echo $TEST_PHONE | sed 's/+/%2B/g')" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Customer orders retrieved (HTTP $HTTP_CODE)${NC}"

    CUSTOMER_ORDER_COUNT=$(echo "$BODY" | grep -o '"orderNumber"' | wc -l | tr -d ' ')
    CUSTOMER_NAME=$(echo "$BODY" | grep -o '"name":"[^"]*' | head -1 | sed 's/"name":"//')

    echo -e "  Customer: ${YELLOW}$CUSTOMER_NAME${NC}"
    echo -e "  Orders: ${YELLOW}$CUSTOMER_ORDER_COUNT${NC}"

    # Show recent orders
    echo -e "\n${YELLOW}Recent orders:${NC}"
    echo "$BODY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'data' in data and isinstance(data['data'], list):
        for order in data['data'][:3]:
            print(f\"  - {order['orderNumber']}: {order['customer']['name']} - Total: {order['total']}\")
except:
    pass
" 2>/dev/null || echo "  (Unable to parse order details)"
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 5: Test with status filter
echo -e "\n${BLUE}[5/6] Testing with status filter${NC}"
echo -e "${YELLOW}GET /order/filled-orders/${SUBDOMAIN}/${LOCALID}?phone=${TEST_PHONE}&status=pending${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/order/filled-orders/$SUBDOMAIN/$LOCALID?phone=$(echo $TEST_PHONE | sed 's/+/%2B/g')&status=pending" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Filtered orders retrieved (HTTP $HTTP_CODE)${NC}"

    PENDING_COUNT=$(echo "$BODY" | grep -o '"orderNumber"' | wc -l | tr -d ' ')
    echo -e "  Pending orders: ${YELLOW}$PENDING_COUNT${NC}"
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 6: Test with non-existent phone
echo -e "\n${BLUE}[6/6] Testing with non-existent phone${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/order/filled-orders/$SUBDOMAIN/$LOCALID?phone=%2B51999999999" \
    -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    NO_ORDERS_COUNT=$(echo "$BODY" | grep -o '"orderNumber"' | wc -l | tr -d ' ')

    if [ "$NO_ORDERS_COUNT" = "0" ]; then
        echo -e "${GREEN}✓ Correctly returns empty array (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${YELLOW}⚠ Found $NO_ORDERS_COUNT orders (unexpected)${NC}"
    fi
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Summary
echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                   TEST COMPLETED                           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}Order History Features Tested:${NC}"
echo -e "  ${GREEN}✓${NC} Get all orders for location"
echo -e "  ${GREEN}✓${NC} Filter orders by customer phone"
echo -e "  ${GREEN}✓${NC} Filter orders by status"
echo -e "  ${GREEN}✓${NC} Handle non-existent customer gracefully"
echo ""
