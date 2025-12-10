#!/bin/bash

# Delivery Zones Seeding Script
# Creates delivery zones with different pricing tiers

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

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         DELIVERY ZONES SEEDING SCRIPT                      ║${NC}"
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

# Step 2: Create Downtown/City Center Zone (Free delivery on orders over $30)
echo -e "\n${BLUE}[2/4] Creating Downtown Zone...${NC}"
curl -s -X POST "$BASE_URL/delivery/zones/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "zoneName": "Downtown / City Center",
        "deliveryCost": 2.00,
        "minimumOrder": 15.00,
        "estimatedTime": 30,
        "allowsFreeDelivery": true,
        "minimumForFreeDelivery": 30.00,
        "type": "simple",
        "status": "1",
        "coordinates": []
    }' > /dev/null

echo -e "${GREEN}✓ Downtown Zone created${NC}"
echo -e "  ${YELLOW}•${NC} Delivery Cost: \$2.00"
echo -e "  ${YELLOW}•${NC} Minimum Order: \$15.00"
echo -e "  ${YELLOW}•${NC} Free delivery on orders over \$30.00"
echo -e "  ${YELLOW}•${NC} Estimated Time: 30 minutes"

# Step 3: Create Nearby Neighborhoods Zone
echo -e "\n${BLUE}[3/4] Creating Nearby Neighborhoods Zone...${NC}"
curl -s -X POST "$BASE_URL/delivery/zones/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "zoneName": "Nearby Neighborhoods",
        "deliveryCost": 3.50,
        "minimumOrder": 20.00,
        "estimatedTime": 45,
        "allowsFreeDelivery": true,
        "minimumForFreeDelivery": 50.00,
        "type": "simple",
        "status": "1",
        "coordinates": []
    }' > /dev/null

echo -e "${GREEN}✓ Nearby Neighborhoods Zone created${NC}"
echo -e "  ${YELLOW}•${NC} Delivery Cost: \$3.50"
echo -e "  ${YELLOW}•${NC} Minimum Order: \$20.00"
echo -e "  ${YELLOW}•${NC} Free delivery on orders over \$50.00"
echo -e "  ${YELLOW}•${NC} Estimated Time: 45 minutes"

# Step 4: Create Suburbs / Extended Area Zone
echo -e "\n${BLUE}[4/4] Creating Suburbs Zone...${NC}"
curl -s -X POST "$BASE_URL/delivery/zones/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "zoneName": "Suburbs / Extended Area",
        "deliveryCost": 5.00,
        "minimumOrder": 25.00,
        "estimatedTime": 60,
        "allowsFreeDelivery": true,
        "minimumForFreeDelivery": 75.00,
        "type": "simple",
        "status": "1",
        "coordinates": []
    }' > /dev/null

echo -e "${GREEN}✓ Suburbs Zone created${NC}"
echo -e "  ${YELLOW}•${NC} Delivery Cost: \$5.00"
echo -e "  ${YELLOW}•${NC} Minimum Order: \$25.00"
echo -e "  ${YELLOW}•${NC} Free delivery on orders over \$75.00"
echo -e "  ${YELLOW}•${NC} Estimated Time: 60 minutes"

# Summary
echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          DELIVERY ZONES SEEDING COMPLETED                  ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✓ Delivery Zones Summary:${NC}"
echo -e "\n${YELLOW}1. Downtown / City Center${NC}"
echo -e "   Delivery: \$2.00 (FREE over \$30) | Min Order: \$15 | ETA: 30min"
echo -e "\n${YELLOW}2. Nearby Neighborhoods${NC}"
echo -e "   Delivery: \$3.50 (FREE over \$50) | Min Order: \$20 | ETA: 45min"
echo -e "\n${YELLOW}3. Suburbs / Extended Area${NC}"
echo -e "   Delivery: \$5.00 (FREE over \$75) | Min Order: \$25 | ETA: 60min"

echo -e "\n${BLUE}ℹ All zones are now active and ready for delivery orders!${NC}\n"
