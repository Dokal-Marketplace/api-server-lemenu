#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:3001/api/v1"
EMAIL="tcbsgpm91wpw-az@ptltrybrmvpmok.hz"
PASSWORD="Etalon12345@"

echo -e "${CYAN}Testing multiple products...${NC}\n"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

SUBDOMAIN="my-restaurant"
LOCALID="LOC1760097779968WGX4I"

# Test with multiple products
echo -e "${BLUE}Testing with 3 products${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/menu/getProductInMenu/$LOCALID/$SUBDOMAIN" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '["PROD17601042157470SR6K", "PROD1760104233832KLLBZ", "PROD1760104245255B4LEX"]')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
