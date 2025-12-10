#!/bin/bash

# Modifiers Seeding Script
# Adds modifiers/options to existing products

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
echo -e "${CYAN}║            MODIFIERS SEEDING SCRIPT                        ║${NC}"
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

# Step 2: Create Pizza Size Modifier
echo -e "\n${BLUE}[2/6] Creating Pizza Size Modifier...${NC}"
PIZZA_SIZE_RESPONSE=$(curl -s -X POST "$BASE_URL/modifiers/create/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Size",
        "isMultiple": false,
        "minQuantity": 1,
        "maxQuantity": 1,
        "options": [
            {
                "optionId": "size-small",
                "name": "Small (10 inch)",
                "price": 0,
                "isActive": true
            },
            {
                "optionId": "size-medium",
                "name": "Medium (12 inch)",
                "price": 3.00,
                "isActive": true
            },
            {
                "optionId": "size-large",
                "name": "Large (14 inch)",
                "price": 5.00,
                "isActive": true
            },
            {
                "optionId": "size-xlarge",
                "name": "Extra Large (16 inch)",
                "price": 7.00,
                "isActive": true
            }
        ]
    }')
PIZZA_SIZE_ID=$(echo "$PIZZA_SIZE_RESPONSE" | grep -o '"rId":"[^"]*' | sed 's/"rId":"//' | head -1)
echo -e "${GREEN}✓ Pizza Size Modifier Created: ${YELLOW}$PIZZA_SIZE_ID${NC}"

# Step 3: Create Pizza Toppings Modifier
echo -e "\n${BLUE}[3/6] Creating Pizza Toppings Modifier...${NC}"
PIZZA_TOPPINGS_RESPONSE=$(curl -s -X POST "$BASE_URL/modifiers/create/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Extra Toppings",
        "isMultiple": true,
        "minQuantity": 0,
        "maxQuantity": 5,
        "options": [
            {
                "optionId": "topping-pepperoni",
                "name": "Extra Pepperoni",
                "price": 2.00,
                "isActive": true
            },
            {
                "optionId": "topping-mushrooms",
                "name": "Mushrooms",
                "price": 1.50,
                "isActive": true
            },
            {
                "optionId": "topping-olives",
                "name": "Olives",
                "price": 1.50,
                "isActive": true
            },
            {
                "optionId": "topping-onions",
                "name": "Onions",
                "price": 1.00,
                "isActive": true
            },
            {
                "optionId": "topping-peppers",
                "name": "Bell Peppers",
                "price": 1.50,
                "isActive": true
            },
            {
                "optionId": "topping-cheese",
                "name": "Extra Cheese",
                "price": 2.50,
                "isActive": true
            }
        ]
    }')
PIZZA_TOPPINGS_ID=$(echo "$PIZZA_TOPPINGS_RESPONSE" | grep -o '"rId":"[^"]*' | sed 's/"rId":"//' | head -1)
echo -e "${GREEN}✓ Pizza Toppings Modifier Created: ${YELLOW}$PIZZA_TOPPINGS_ID${NC}"

# Step 4: Create Burger Options
echo -e "\n${BLUE}[4/6] Creating Burger Modifiers...${NC}"

# Burger Temperature
BURGER_TEMP_RESPONSE=$(curl -s -X POST "$BASE_URL/modifiers/create/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "How would you like it cooked?",
        "isMultiple": false,
        "minQuantity": 1,
        "maxQuantity": 1,
        "options": [
            {
                "optionId": "temp-rare",
                "name": "Rare",
                "price": 0,
                "isActive": true
            },
            {
                "optionId": "temp-medium",
                "name": "Medium",
                "price": 0,
                "isActive": true
            },
            {
                "optionId": "temp-well",
                "name": "Well Done",
                "price": 0,
                "isActive": true
            }
        ]
    }')
BURGER_TEMP_ID=$(echo "$BURGER_TEMP_RESPONSE" | grep -o '"rId":"[^"]*' | sed 's/"rId":"//' | head -1)
echo -e "${GREEN}  ✓ Burger Temperature: ${YELLOW}$BURGER_TEMP_ID${NC}"

# Burger Extras
BURGER_EXTRAS_RESPONSE=$(curl -s -X POST "$BASE_URL/modifiers/create/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Add Extras",
        "isMultiple": true,
        "minQuantity": 0,
        "maxQuantity": 5,
        "options": [
            {
                "optionId": "extra-bacon",
                "name": "Extra Bacon",
                "price": 2.00,
                "isActive": true
            },
            {
                "optionId": "extra-cheese",
                "name": "Extra Cheese",
                "price": 1.50,
                "isActive": true
            },
            {
                "optionId": "extra-avocado",
                "name": "Avocado",
                "price": 2.50,
                "isActive": true
            },
            {
                "optionId": "extra-egg",
                "name": "Fried Egg",
                "price": 1.50,
                "isActive": true
            },
            {
                "optionId": "extra-mushrooms",
                "name": "Sautéed Mushrooms",
                "price": 2.00,
                "isActive": true
            }
        ]
    }')
BURGER_EXTRAS_ID=$(echo "$BURGER_EXTRAS_RESPONSE" | grep -o '"rId":"[^"]*' | sed 's/"rId":"//' | head -1)
echo -e "${GREEN}  ✓ Burger Extras: ${YELLOW}$BURGER_EXTRAS_ID${NC}"

# Step 5: Create Salad Dressing Modifier
echo -e "\n${BLUE}[5/6] Creating Salad Dressing Modifier...${NC}"
SALAD_DRESSING_RESPONSE=$(curl -s -X POST "$BASE_URL/modifiers/create/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Dressing",
        "isMultiple": false,
        "minQuantity": 1,
        "maxQuantity": 1,
        "options": [
            {
                "optionId": "dressing-caesar",
                "name": "Caesar Dressing",
                "price": 0,
                "isActive": true
            },
            {
                "optionId": "dressing-ranch",
                "name": "Ranch Dressing",
                "price": 0,
                "isActive": true
            },
            {
                "optionId": "dressing-balsamic",
                "name": "Balsamic Vinaigrette",
                "price": 0,
                "isActive": true
            },
            {
                "optionId": "dressing-honey",
                "name": "Honey Mustard",
                "price": 0,
                "isActive": true
            },
            {
                "optionId": "dressing-italian",
                "name": "Italian Dressing",
                "price": 0,
                "isActive": true
            }
        ]
    }')
SALAD_DRESSING_ID=$(echo "$SALAD_DRESSING_RESPONSE" | grep -o '"rId":"[^"]*' | sed 's/"rId":"//' | head -1)
echo -e "${GREEN}✓ Salad Dressing Modifier Created: ${YELLOW}$SALAD_DRESSING_ID${NC}"

# Step 6: Create Drink Size Modifier
echo -e "\n${BLUE}[6/6] Creating Drink Size Modifier...${NC}"
DRINK_SIZE_RESPONSE=$(curl -s -X POST "$BASE_URL/modifiers/create/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Size",
        "isMultiple": false,
        "minQuantity": 1,
        "maxQuantity": 1,
        "options": [
            {
                "optionId": "drink-small",
                "name": "Small (12 oz)",
                "price": 0,
                "isActive": true
            },
            {
                "optionId": "drink-medium",
                "name": "Medium (16 oz)",
                "price": 1.00,
                "isActive": true
            },
            {
                "optionId": "drink-large",
                "name": "Large (20 oz)",
                "price": 1.50,
                "isActive": true
            }
        ]
    }')
DRINK_SIZE_ID=$(echo "$DRINK_SIZE_RESPONSE" | grep -o '"rId":"[^"]*' | sed 's/"rId":"//' | head -1)
echo -e "${GREEN}✓ Drink Size Modifier Created: ${YELLOW}$DRINK_SIZE_ID${NC}"

# Summary
echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║             MODIFIERS SEEDING COMPLETED                    ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✓ Modifier Groups Created:${NC}"
echo -e "  ${YELLOW}•${NC} Pizza Size (4 options)"
echo -e "  ${YELLOW}•${NC} Pizza Toppings (6 options)"
echo -e "  ${YELLOW}•${NC} Burger Temperature (3 options)"
echo -e "  ${YELLOW}•${NC} Burger Extras (5 options)"
echo -e "  ${YELLOW}•${NC} Salad Dressing (5 options)"
echo -e "  ${YELLOW}•${NC} Drink Size (3 options)"

echo -e "\n${BLUE}ℹ Note: Modifiers are created. To link them to products,${NC}"
echo -e "${BLUE}  use the product update endpoint with the modifier IDs above.${NC}\n"

echo -e "${YELLOW}Modifier IDs for reference:${NC}"
echo -e "  Pizza Size: ${CYAN}$PIZZA_SIZE_ID${NC}"
echo -e "  Pizza Toppings: ${CYAN}$PIZZA_TOPPINGS_ID${NC}"
echo -e "  Burger Temp: ${CYAN}$BURGER_TEMP_ID${NC}"
echo -e "  Burger Extras: ${CYAN}$BURGER_EXTRAS_ID${NC}"
echo -e "  Salad Dressing: ${CYAN}$SALAD_DRESSING_ID${NC}"
echo -e "  Drink Size: ${CYAN}$DRINK_SIZE_ID${NC}\n"
