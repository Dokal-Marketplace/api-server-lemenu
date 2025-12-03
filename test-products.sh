#!/bin/bash

# Product Management & Order Processing Test Suite
# Tests product CRUD operations and order workflow

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:3001/api/v1"
EMAIL="tcbsgpm91wpw-az@ptltrybrmvpmok.hz"
PASSWORD="Etalon12345@"
SUBDOMAIN="my-restaurant"
LOCALID="LOC1760097779968WGX4I"

TOKEN=""
PRODUCT_ID=""
ORDER_ID=""

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    PRODUCT MANAGEMENT & ORDER PROCESSING TEST SUITE        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Step 1: Login
echo -e "${BLUE}[1/12] Authenticating...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Authentication failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Authenticated successfully${NC}"

# Step 2: Get all products
echo -e "\n${BLUE}[2/12] Testing GET /products/get-all/{subDomain}/{localId}${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/products/get-all/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    PRODUCT_COUNT=$(echo "$BODY" | grep -o '"_id"' | wc -l | tr -d ' ')
    echo -e "  Found ${YELLOW}$PRODUCT_COUNT${NC} products"
    # Extract first product ID for later tests
    PRODUCT_ID=$(echo "$BODY" | grep -o '"_id":"[^"]*' | sed 's/"_id":"//' | head -1)
    if [ -n "$PRODUCT_ID" ]; then
        echo -e "  Sample Product ID: ${YELLOW}$PRODUCT_ID${NC}"
    fi
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 3: Get specific product details
if [ -n "$PRODUCT_ID" ]; then
    echo -e "\n${BLUE}[3/12] Testing GET /products/{productId}${NC}"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/products/$PRODUCT_ID" \
        -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
        PRODUCT_NAME=$(echo "$BODY" | grep -o '"name":"[^"]*' | sed 's/"name":"//' | head -1)
        echo -e "  Product Name: ${YELLOW}$PRODUCT_NAME${NC}"
        echo "$BODY" | head -c 250
        echo "..."
    else
        echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 200
    fi
else
    echo -e "\n${YELLOW}[3/12] Skipping product details test - no product ID available${NC}"
fi

# Step 4: Create a new product
echo -e "\n${BLUE}[4/12] Testing POST /products/{subDomain}/{localId} (Create Product)${NC}"
NEW_PRODUCT_DATA='{
    "name": "Test Product",
    "description": "A test product created by automation",
    "price": 15.99,
    "categoryId": "test-category",
    "isAvailable": true,
    "imageUrl": "https://example.com/test-product.jpg"
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$NEW_PRODUCT_DATA")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    NEW_PRODUCT_ID=$(echo "$BODY" | grep -o '"_id":"[^"]*' | sed 's/"_id":"//' | head -1)
    if [ -n "$NEW_PRODUCT_ID" ]; then
        echo -e "  Created Product ID: ${YELLOW}$NEW_PRODUCT_ID${NC}"
        PRODUCT_ID="$NEW_PRODUCT_ID"
    fi
else
    echo -e "${YELLOW}⚠ Product creation returned (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 250
fi

# Step 5: Update product
if [ -n "$PRODUCT_ID" ]; then
    echo -e "\n${BLUE}[5/12] Testing PATCH /products/{productId} (Update Product)${NC}"
    UPDATE_DATA='{
        "price": 19.99,
        "description": "Updated test product description"
    }'

    RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/products/$PRODUCT_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$UPDATE_DATA")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 200
    else
        echo -e "${YELLOW}⚠ Update returned (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 200
    fi
else
    echo -e "\n${YELLOW}[5/12] Skipping product update test - no product ID available${NC}"
fi

# Step 6: Get all orders
echo -e "\n${BLUE}[6/12] Testing GET /order/filled-orders/{subDomain}/{localId}${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/order/filled-orders/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    ORDER_COUNT=$(echo "$BODY" | grep -o '"orderId"' | wc -l | tr -d ' ')
    echo -e "  Found ${YELLOW}$ORDER_COUNT${NC} orders"
    # Extract first order ID for later tests
    ORDER_ID=$(echo "$BODY" | grep -o '"_id":"[^"]*' | sed 's/"_id":"//' | head -1)
    if [ -n "$ORDER_ID" ]; then
        echo -e "  Sample Order ID: ${YELLOW}$ORDER_ID${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Get orders returned (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 7: Get specific order details
if [ -n "$ORDER_ID" ]; then
    echo -e "\n${BLUE}[7/12] Testing GET /order/get-order/{orderId}${NC}"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/order/get-order/$ORDER_ID" \
        -H "Authorization: Bearer $TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
        ORDER_STATUS=$(echo "$BODY" | grep -o '"status":"[^"]*' | sed 's/"status":"//' | head -1)
        echo -e "  Order Status: ${YELLOW}$ORDER_STATUS${NC}"
        echo "$BODY" | head -c 300
        echo "..."
    else
        echo -e "${YELLOW}⚠ Failed (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 200
    fi
else
    echo -e "\n${YELLOW}[7/12] Skipping order details test - no order ID available${NC}"
fi

# Step 8: Change order status
if [ -n "$ORDER_ID" ]; then
    echo -e "\n${BLUE}[8/12] Testing PATCH /order/{orderId}/status (Change Order Status)${NC}"
    STATUS_DATA='{
        "status": "preparing"
    }'

    RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/order/$ORDER_ID/status" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$STATUS_DATA")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 200
    else
        echo -e "${YELLOW}⚠ Status change returned (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 200
    fi
else
    echo -e "\n${YELLOW}[8/12] Skipping order status test - no order ID available${NC}"
fi

# Step 9: Get archived orders
echo -e "\n${BLUE}[9/12] Testing GET /order/archived/{subDomain}/{localId}${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/order/archived/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    ARCHIVED_COUNT=$(echo "$BODY" | grep -o '"_id"' | wc -l | tr -d ' ')
    echo -e "  Found ${YELLOW}$ARCHIVED_COUNT${NC} archived orders"
else
    echo -e "${YELLOW}⚠ Get archived orders returned (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 10: Get product sync status
echo -e "\n${BLUE}[10/12] Testing GET /products/sync-status/{subDomain}/{localId}${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/products/sync-status/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 250
    echo "..."
else
    echo -e "${YELLOW}⚠ Sync status returned (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 11: Get general products list
echo -e "\n${BLUE}[11/12] Testing GET /products (General Products List)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/products?subDomain=$SUBDOMAIN&localId=$LOCALID" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
    echo "..."
else
    echo -e "${YELLOW}⚠ Products list returned (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 12: Test admin orders view
echo -e "\n${BLUE}[12/12] Testing GET /order/filled-orders/admin${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/order/filled-orders/admin?page=1&limit=10" \
    -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
    echo "..."
else
    echo -e "${YELLOW}⚠ Admin orders returned (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Summary
echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              TEST SUITE COMPLETED                          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✓ Product Management & Order Processing Tests Executed${NC}"
echo -e "${BLUE}ℹ Review results above for any failures or warnings${NC}"

# Clean up test data if product was created
if [ -n "$NEW_PRODUCT_ID" ]; then
    echo -e "\n${YELLOW}⚠ Note: Test product was created (ID: $NEW_PRODUCT_ID)${NC}"
    echo -e "${YELLOW}  You may want to delete it manually if needed${NC}"
fi

echo ""
