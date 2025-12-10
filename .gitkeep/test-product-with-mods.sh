#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:3001/api/v1"
EMAIL="tcbsgpm91wpw-az@ptltrybrmvpmok.hz"
PASSWORD="Etalon12345@"

echo -e "${CYAN}Testing product with presentations...${NC}\n"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

SUBDOMAIN="my-restaurant"
LOCALID="LOC1760097779968WGX4I"

# Test with product that has presentations in the name
PRODUCT_ID="PROD1764411380926DVC8O"

echo -e "${BLUE}Testing with product: ${YELLOW}$PRODUCT_ID${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/menu/getProductInMenu/$LOCALID/$SUBDOMAIN" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "[\"$PRODUCT_ID\"]")

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
