#!/bin/bash

# API Key Authentication Test Suite
# Tests API key creation, management, and authentication

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
SUBDOMAIN="my-restaurant"
LOCALID="LOC1760097779968WGX4I"

JWT_TOKEN=""
API_KEY=""
API_KEY_ID=""

echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║         API KEY AUTHENTICATION TEST SUITE                  ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Step 1: Login to get JWT token
echo -e "${BLUE}[1/10] Authenticating with JWT...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}✗ JWT authentication failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ JWT authentication successful${NC}"
echo -e "  Token: ${YELLOW}${JWT_TOKEN:0:20}...${NC}"

# Step 2: Get available scopes
echo -e "\n${BLUE}[2/10] Testing GET /api-keys/scopes${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api-keys/scopes" \
    -H "Authorization: Bearer $JWT_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    SCOPE_COUNT=$(echo "$BODY" | grep -o '"scope"' | wc -l | tr -d ' ')
    echo -e "  Available scopes: ${YELLOW}$SCOPE_COUNT${NC}"
    echo "$BODY" | head -c 400
    echo "..."
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 3: Create a new API key
echo -e "\n${BLUE}[3/10] Testing POST /api-keys (Create API Key)${NC}"
CREATE_DATA='{
    "name": "Test API Key",
    "scopes": ["read:products", "read:orders", "read:menu"],
    "businessId": "test-business-123",
    "subDomain": "'"$SUBDOMAIN"'",
    "expiresIn": 365,
    "rateLimit": {
        "maxRequests": 500,
        "windowMs": 3600000
    },
    "metadata": {
        "purpose": "automated-testing",
        "createdBy": "test-suite"
    }
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api-keys" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$CREATE_DATA")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    API_KEY=$(echo "$BODY" | grep -o '"key":"[^"]*' | sed 's/"key":"//')
    API_KEY_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | sed 's/"id":"//' | head -1)

    if [ -n "$API_KEY" ]; then
        echo -e "  ${YELLOW}⚠ IMPORTANT: API Key created (save securely):${NC}"
        echo -e "  ${CYAN}$API_KEY${NC}"
        echo -e "  Key ID: ${YELLOW}$API_KEY_ID${NC}"
    fi
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 300
fi

# Step 4: List all API keys
echo -e "\n${BLUE}[4/10] Testing GET /api-keys (List API Keys)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api-keys" \
    -H "Authorization: Bearer $JWT_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    KEY_COUNT=$(echo "$BODY" | grep -o '"keyPrefix"' | wc -l | tr -d ' ')
    echo -e "  Total API keys: ${YELLOW}$KEY_COUNT${NC}"
    echo "$BODY" | head -c 300
    echo "..."
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 5: Get specific API key details
if [ -n "$API_KEY_ID" ]; then
    echo -e "\n${BLUE}[5/10] Testing GET /api-keys/{keyId}${NC}"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api-keys/$API_KEY_ID" \
        -H "Authorization: Bearer $JWT_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 400
        echo "..."
    else
        echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 200
    fi
else
    echo -e "\n${YELLOW}[5/10] Skipping - No API key ID available${NC}"
fi

# Step 6: Test authentication with API key (via X-API-Key header)
if [ -n "$API_KEY" ]; then
    echo -e "\n${BLUE}[6/10] Testing API Key Auth - X-API-Key Header${NC}"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/products/get-all/$SUBDOMAIN/$LOCALID" \
        -H "X-API-Key: $API_KEY")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ API Key Authentication Successful (HTTP $HTTP_CODE)${NC}"
        PRODUCT_COUNT=$(echo "$BODY" | grep -o '"_id"' | wc -l | tr -d ' ')
        echo -e "  Products accessed: ${YELLOW}$PRODUCT_COUNT${NC}"
    else
        echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 200
    fi
else
    echo -e "\n${YELLOW}[6/10] Skipping - No API key available${NC}"
fi

# Step 7: Test authentication with API key (via Authorization Bearer)
if [ -n "$API_KEY" ]; then
    echo -e "\n${BLUE}[7/10] Testing API Key Auth - Authorization Bearer${NC}"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/products/get-all/$SUBDOMAIN/$LOCALID" \
        -H "Authorization: Bearer $API_KEY")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ API Key Authentication Successful (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 200
    fi
else
    echo -e "\n${YELLOW}[7/10] Skipping - No API key available${NC}"
fi

# Step 8: Update API key
if [ -n "$API_KEY_ID" ]; then
    echo -e "\n${BLUE}[8/10] Testing PATCH /api-keys/{keyId} (Update)${NC}"
    UPDATE_DATA='{
        "name": "Updated Test API Key",
        "scopes": ["read:products", "read:orders", "read:menu", "read:analytics"]
    }'

    RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/api-keys/$API_KEY_ID" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$UPDATE_DATA")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 300
        echo "..."
    else
        echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 200
    fi
else
    echo -e "\n${YELLOW}[8/10] Skipping - No API key ID available${NC}"
fi

# Step 9: Test invalid API key
echo -e "\n${BLUE}[9/10] Testing Invalid API Key (Security Test)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/products/get-all/$SUBDOMAIN/$LOCALID" \
    -H "X-API-Key: carta_live_invalid_key_12345678901234567890")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Correctly rejected invalid API key (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 150
else
    echo -e "${RED}✗ Security Issue: Invalid key not rejected (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 10: Revoke API key
if [ -n "$API_KEY_ID" ]; then
    echo -e "\n${BLUE}[10/10] Testing POST /api-keys/{keyId}/revoke${NC}"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api-keys/$API_KEY_ID/revoke" \
        -H "Authorization: Bearer $JWT_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ API Key Revoked Successfully (HTTP $HTTP_CODE)${NC}"

        # Verify revoked key doesn't work
        echo -e "\n  ${BLUE}Verifying revoked key is rejected...${NC}"
        VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/products/get-all/$SUBDOMAIN/$LOCALID" \
            -H "X-API-Key: $API_KEY")
        VERIFY_CODE=$(echo "$VERIFY_RESPONSE" | tail -n1)

        if [ "$VERIFY_CODE" = "401" ]; then
            echo -e "  ${GREEN}✓ Revoked key correctly rejected${NC}"
        else
            echo -e "  ${RED}✗ Security Issue: Revoked key still works!${NC}"
        fi
    else
        echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 200
    fi
else
    echo -e "\n${YELLOW}[10/10] Skipping - No API key ID available${NC}"
fi

# Summary
echo -e "\n${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                  TEST SUITE COMPLETED                      ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✓ API Key Authentication Tests Executed${NC}"
echo -e "${BLUE}ℹ Review results above for any failures${NC}"

if [ -n "$API_KEY" ]; then
    echo -e "\n${YELLOW}⚠ Note: API key was created and revoked during testing${NC}"
    echo -e "${YELLOW}  Key ID: $API_KEY_ID${NC}"
fi

echo ""
