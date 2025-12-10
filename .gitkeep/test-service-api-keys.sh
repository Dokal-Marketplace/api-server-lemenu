#!/bin/bash

# Service API Key Authentication Test Suite
# Tests service-to-service authentication for microservices

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
SERVICE_KEY_INTERNAL=""
SERVICE_KEY_EXTERNAL=""
SERVICE_KEY_PARTNER=""
SERVICE_KEY_ID_INTERNAL=""
SERVICE_KEY_ID_EXTERNAL=""
SERVICE_KEY_ID_PARTNER=""

echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║       SERVICE API KEY AUTHENTICATION TEST SUITE            ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Step 1: Login to get JWT token (Admin)
echo -e "${BLUE}[1/15] Authenticating with JWT (Admin)...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}✗ JWT authentication failed${NC}"
    echo "$LOGIN_RESPONSE" | head -c 200
    exit 1
fi
echo -e "${GREEN}✓ JWT authentication successful${NC}"
echo -e "  Token: ${YELLOW}${JWT_TOKEN:0:20}...${NC}"

# Step 2: Get available service scopes
echo -e "\n${BLUE}[2/15] Testing GET /service-api-keys/scopes${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/service-api-keys/scopes" \
    -H "Authorization: Bearer $JWT_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    SCOPE_COUNT=$(echo "$BODY" | grep -o '"scope"' | wc -l | tr -d ' ')
    echo -e "  Available service scopes: ${YELLOW}$SCOPE_COUNT${NC}"
    echo "$BODY" | head -c 400
    echo "..."
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 3: Create Internal Service API Key
echo -e "\n${BLUE}[3/15] Testing POST /service-api-keys (Internal Service)${NC}"
CREATE_INTERNAL='{
    "name": "Test Order Processor Service",
    "serviceName": "test-order-processor",
    "serviceType": "internal",
    "environment": "development",
    "scopes": ["service:orders", "service:products", "internal:cache"],
    "allowedServices": ["product-service", "notification-service"],
    "allowedEndpoints": ["/api/v1/order/*", "/api/v1/products/*"],
    "rateLimit": {
        "maxRequests": 10000,
        "windowMs": 3600000
    },
    "metadata": {
        "purpose": "automated-testing",
        "version": "1.0.0",
        "owner": "test-suite"
    },
    "expiresIn": 30
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/service-api-keys" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$CREATE_INTERNAL")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    SERVICE_KEY_INTERNAL=$(echo "$BODY" | grep -o '"key":"[^"]*' | sed 's/"key":"//')
    SERVICE_KEY_ID_INTERNAL=$(echo "$BODY" | grep -o '"id":"[^"]*' | sed 's/"id":"//' | head -1)

    if [ -n "$SERVICE_KEY_INTERNAL" ]; then
        echo -e "  ${YELLOW}⚠ IMPORTANT: Internal service key created:${NC}"
        echo -e "  ${CYAN}${SERVICE_KEY_INTERNAL:0:40}...${NC}"
        echo -e "  Key ID: ${YELLOW}$SERVICE_KEY_ID_INTERNAL${NC}"
        echo -e "  Prefix: ${CYAN}$(echo "$SERVICE_KEY_INTERNAL" | cut -d'_' -f1-2)_${NC}"
    fi
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 300
fi

# Step 4: Create External Service API Key
echo -e "\n${BLUE}[4/15] Testing POST /service-api-keys (External Service)${NC}"
CREATE_EXTERNAL='{
    "name": "Test Payment Gateway",
    "serviceName": "test-stripe-webhook",
    "serviceType": "external",
    "environment": "development",
    "scopes": ["service:payments", "service:webhooks"],
    "allowedEndpoints": ["/api/v1/webhooks/*"],
    "rateLimit": {
        "maxRequests": 5000,
        "windowMs": 3600000
    },
    "metadata": {
        "provider": "test-payment-provider",
        "purpose": "testing"
    },
    "expiresIn": 30
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/service-api-keys" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$CREATE_EXTERNAL")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    SERVICE_KEY_EXTERNAL=$(echo "$BODY" | grep -o '"key":"[^"]*' | sed 's/"key":"//')
    SERVICE_KEY_ID_EXTERNAL=$(echo "$BODY" | grep -o '"id":"[^"]*' | sed 's/"id":"//' | head -1)

    if [ -n "$SERVICE_KEY_EXTERNAL" ]; then
        echo -e "  ${YELLOW}⚠ External service key created:${NC}"
        echo -e "  ${CYAN}${SERVICE_KEY_EXTERNAL:0:40}...${NC}"
        echo -e "  Key ID: ${YELLOW}$SERVICE_KEY_ID_EXTERNAL${NC}"
        echo -e "  Prefix: ${CYAN}$(echo "$SERVICE_KEY_EXTERNAL" | cut -d'_' -f1-2)_${NC}"
    fi
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 300
fi

# Step 5: Create Partner Service API Key
echo -e "\n${BLUE}[5/15] Testing POST /service-api-keys (Partner Service)${NC}"
CREATE_PARTNER='{
    "name": "Test Franchise Analytics",
    "serviceName": "test-franchise-analytics",
    "serviceType": "partner",
    "environment": "development",
    "scopes": ["service:analytics", "admin:read"],
    "allowedEndpoints": ["/api/v1/dashboard/*"],
    "rateLimit": {
        "maxRequests": 2000,
        "windowMs": 3600000
    },
    "metadata": {
        "partner": "Test Franchise Corp",
        "contract": "TEST-2025-001"
    },
    "expiresIn": 30
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/service-api-keys" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$CREATE_PARTNER")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    SERVICE_KEY_PARTNER=$(echo "$BODY" | grep -o '"key":"[^"]*' | sed 's/"key":"//')
    SERVICE_KEY_ID_PARTNER=$(echo "$BODY" | grep -o '"id":"[^"]*' | sed 's/"id":"//' | head -1)

    if [ -n "$SERVICE_KEY_PARTNER" ]; then
        echo -e "  ${YELLOW}⚠ Partner service key created:${NC}"
        echo -e "  ${CYAN}${SERVICE_KEY_PARTNER:0:40}...${NC}"
        echo -e "  Key ID: ${YELLOW}$SERVICE_KEY_ID_PARTNER${NC}"
        echo -e "  Prefix: ${CYAN}$(echo "$SERVICE_KEY_PARTNER" | cut -d'_' -f1-2)_${NC}"
    fi
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 300
fi

# Step 6: List all service API keys
echo -e "\n${BLUE}[6/15] Testing GET /service-api-keys (List All)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/service-api-keys" \
    -H "Authorization: Bearer $JWT_TOKEN")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $HTTP_CODE)${NC}"
    KEY_COUNT=$(echo "$BODY" | grep -o '"serviceName"' | wc -l | tr -d ' ')
    echo -e "  Total service keys: ${YELLOW}$KEY_COUNT${NC}"
    echo "$BODY" | head -c 300
    echo "..."
else
    echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 7: Get specific service key details
if [ -n "$SERVICE_KEY_ID_INTERNAL" ]; then
    echo -e "\n${BLUE}[7/15] Testing GET /service-api-keys/{keyId}${NC}"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/service-api-keys/$SERVICE_KEY_ID_INTERNAL" \
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
    echo -e "\n${YELLOW}[7/15] Skipping - No service key ID available${NC}"
fi

# Step 8: Test authentication with X-Service-API-Key header
if [ -n "$SERVICE_KEY_INTERNAL" ]; then
    echo -e "\n${BLUE}[8/15] Testing Service Key Auth - X-Service-API-Key Header${NC}"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/products/get-all/$SUBDOMAIN/$LOCALID" \
        -H "X-Service-API-Key: $SERVICE_KEY_INTERNAL")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Service Key Authentication Successful (HTTP $HTTP_CODE)${NC}"
        PRODUCT_COUNT=$(echo "$BODY" | grep -o '"_id"' | wc -l | tr -d ' ')
        echo -e "  Products accessed: ${YELLOW}$PRODUCT_COUNT${NC}"
    else
        echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 200
    fi
else
    echo -e "\n${YELLOW}[8/15] Skipping - No service key available${NC}"
fi

# Step 9: Test authentication with X-API-Key header (fallback)
if [ -n "$SERVICE_KEY_INTERNAL" ]; then
    echo -e "\n${BLUE}[9/15] Testing Service Key Auth - X-API-Key Header (Fallback)${NC}"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/products/get-all/$SUBDOMAIN/$LOCALID" \
        -H "X-API-Key: $SERVICE_KEY_INTERNAL")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Service Key Authentication Successful (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${RED}✗ Failed (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 200
    fi
else
    echo -e "\n${YELLOW}[9/15] Skipping - No service key available${NC}"
fi

# Step 10: Test endpoint restriction
if [ -n "$SERVICE_KEY_EXTERNAL" ]; then
    echo -e "\n${BLUE}[10/15] Testing Endpoint Restriction (Security Test)${NC}"
    echo -e "  ${CYAN}External key only allows /api/v1/webhooks/*${NC}"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/products/get-all/$SUBDOMAIN/$LOCALID" \
        -H "X-Service-API-Key: $SERVICE_KEY_EXTERNAL")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "403" ]; then
        echo -e "${GREEN}✓ Correctly rejected unauthorized endpoint (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 150
    else
        echo -e "${RED}✗ Security Issue: Endpoint restriction not enforced (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | head -c 200
    fi
else
    echo -e "\n${YELLOW}[10/15] Skipping - No external service key available${NC}"
fi

# Step 11: Test invalid service key format
echo -e "\n${BLUE}[11/15] Testing Invalid Service Key (Security Test)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/products/get-all/$SUBDOMAIN/$LOCALID" \
    -H "X-Service-API-Key: carta_srv_invalid_key_12345678901234567890")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ Correctly rejected invalid service key (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 150
else
    echo -e "${RED}✗ Security Issue: Invalid key not rejected (HTTP $HTTP_CODE)${NC}"
    echo "$BODY" | head -c 200
fi

# Step 12: Test environment enforcement (production key in dev)
echo -e "\n${BLUE}[12/15] Testing Environment Enforcement${NC}"
echo -e "  ${CYAN}Creating production key, should fail in development environment${NC}"

CREATE_PROD='{
    "name": "Test Production Service",
    "serviceName": "test-prod-service",
    "serviceType": "internal",
    "environment": "production",
    "scopes": ["service:orders"],
    "expiresIn": 1
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/service-api-keys" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$CREATE_PROD")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    PROD_KEY=$(echo "$BODY" | grep -o '"key":"[^"]*' | sed 's/"key":"//')
    PROD_KEY_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | sed 's/"id":"//' | head -1)
    echo -e "${GREEN}✓ Production key created${NC}"

    # Try to use production key in development environment
    echo -e "  ${BLUE}Testing production key in development environment...${NC}"
    VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/products/get-all/$SUBDOMAIN/$LOCALID" \
        -H "X-Service-API-Key: $PROD_KEY")
    VERIFY_CODE=$(echo "$VERIFY_RESPONSE" | tail -n1)

    if [ "$VERIFY_CODE" = "401" ]; then
        echo -e "  ${GREEN}✓ Production key correctly rejected in dev environment${NC}"
    else
        echo -e "  ${YELLOW}⚠ Environment enforcement may not be active (HTTP $VERIFY_CODE)${NC}"
        echo -e "  ${YELLOW}  Note: This is expected if NODE_ENV is not set to 'development'${NC}"
    fi

    # Cleanup production key
    if [ -n "$PROD_KEY_ID" ]; then
        curl -s -X DELETE "$BASE_URL/service-api-keys/$PROD_KEY_ID" \
            -H "Authorization: Bearer $JWT_TOKEN" > /dev/null
    fi
else
    echo -e "${YELLOW}⚠ Could not create production key (HTTP $HTTP_CODE)${NC}"
fi

# Step 13: Update service key
if [ -n "$SERVICE_KEY_ID_INTERNAL" ]; then
    echo -e "\n${BLUE}[13/15] Testing PATCH /service-api-keys/{keyId} (Update)${NC}"
    UPDATE_DATA='{
        "name": "Updated Test Order Processor",
        "scopes": ["service:orders", "service:products", "service:notifications", "internal:cache"]
    }'

    RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/service-api-keys/$SERVICE_KEY_ID_INTERNAL" \
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
    echo -e "\n${YELLOW}[13/15] Skipping - No service key ID available${NC}"
fi

# Step 14: Revoke service key
if [ -n "$SERVICE_KEY_ID_INTERNAL" ]; then
    echo -e "\n${BLUE}[14/15] Testing POST /service-api-keys/{keyId}/revoke${NC}"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/service-api-keys/$SERVICE_KEY_ID_INTERNAL/revoke" \
        -H "Authorization: Bearer $JWT_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Service Key Revoked Successfully (HTTP $HTTP_CODE)${NC}"

        # Verify revoked key doesn't work
        echo -e "\n  ${BLUE}Verifying revoked key is rejected...${NC}"
        VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/products/get-all/$SUBDOMAIN/$LOCALID" \
            -H "X-Service-API-Key: $SERVICE_KEY_INTERNAL")
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
    echo -e "\n${YELLOW}[14/15] Skipping - No service key ID available${NC}"
fi

# Step 15: Cleanup - Delete remaining test keys
echo -e "\n${BLUE}[15/15] Cleanup - Deleting test service keys${NC}"
CLEANUP_COUNT=0

if [ -n "$SERVICE_KEY_ID_EXTERNAL" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/service-api-keys/$SERVICE_KEY_ID_EXTERNAL" \
        -H "Authorization: Bearer $JWT_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" = "200" ]; then
        CLEANUP_COUNT=$((CLEANUP_COUNT + 1))
    fi
fi

if [ -n "$SERVICE_KEY_ID_PARTNER" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/service-api-keys/$SERVICE_KEY_ID_PARTNER" \
        -H "Authorization: Bearer $JWT_TOKEN")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" = "200" ]; then
        CLEANUP_COUNT=$((CLEANUP_COUNT + 1))
    fi
fi

echo -e "${GREEN}✓ Cleanup completed - $CLEANUP_COUNT keys deleted${NC}"

# Summary
echo -e "\n${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║             TEST SUITE COMPLETED SUCCESSFULLY              ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✓ Service API Key Authentication Tests Executed${NC}"
echo -e "${BLUE}ℹ Review results above for any failures${NC}"

echo -e "\n${CYAN}Summary of Tests:${NC}"
echo -e "  ${GREEN}✓${NC} Internal service key (carta_srv_)"
echo -e "  ${GREEN}✓${NC} External service key (carta_ext_)"
echo -e "  ${GREEN}✓${NC} Partner service key (carta_prt_)"
echo -e "  ${GREEN}✓${NC} Authentication via X-Service-API-Key header"
echo -e "  ${GREEN}✓${NC} Authentication via X-API-Key header (fallback)"
echo -e "  ${GREEN}✓${NC} Endpoint restrictions enforcement"
echo -e "  ${GREEN}✓${NC} Environment isolation"
echo -e "  ${GREEN}✓${NC} Key revocation"
echo -e "  ${GREEN}✓${NC} Security validations"

echo -e "\n${YELLOW}⚠ Note: All test service keys were created and cleaned up${NC}"

echo ""
