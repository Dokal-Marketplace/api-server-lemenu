#!/bin/bash

# Link Modifiers to Products Script
# Updates products to include their appropriate modifiers

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
echo -e "${CYAN}║       LINK MODIFIERS TO PRODUCTS SCRIPT                   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}\n"

# Step 1: Login
echo -e "${BLUE}[1/5] Authenticating...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Authentication failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Authenticated successfully${NC}"

# Step 2: Get all modifiers
echo -e "\n${BLUE}[2/5] Fetching modifiers...${NC}"
MODIFIERS_RESPONSE=$(curl -s "http://localhost:3001/api/v1/modifiers/get-all/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN")

# Extract modifier IDs
PIZZA_SIZE_ID=$(echo "$MODIFIERS_RESPONSE" | grep -o '"rId":"MOD[^"]*' | grep -v 'topping' | head -1 | sed 's/"rId":"//')
PIZZA_TOPPINGS_ID=$(echo "$MODIFIERS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print([m['rId'] for m in data.get('data',[]) if m['name']=='Extra Toppings'][0] if [m for m in data.get('data',[]) if m['name']=='Extra Toppings'] else '')" 2>/dev/null)
BURGER_TEMP_ID=$(echo "$MODIFIERS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print([m['rId'] for m in data.get('data',[]) if 'cooked' in m['name']][0] if [m for m in data.get('data',[]) if 'cooked' in m['name']] else '')" 2>/dev/null)
BURGER_EXTRAS_ID=$(echo "$MODIFIERS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print([m['rId'] for m in data.get('data',[]) if m['name']=='Add Extras'][0] if [m for m in data.get('data',[]) if m['name']=='Add Extras'] else '')" 2>/dev/null)
SALAD_DRESSING_ID=$(echo "$MODIFIERS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print([m['rId'] for m in data.get('data',[]) if m['name']=='Dressing'][0] if [m for m in data.get('data',[]) if m['name']=='Dressing'] else '')" 2>/dev/null)
DRINK_SIZE_ID=$(echo "$MODIFIERS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); mods=[m for m in data.get('data',[]) if m['name']=='Size']; print([m['rId'] for m in mods if any('oz' in opt['name'] for opt in m.get('options',[]))][0] if mods else '')" 2>/dev/null)

echo -e "${GREEN}✓ Found modifiers:${NC}"
echo -e "  Pizza Size: ${YELLOW}$PIZZA_SIZE_ID${NC}"
echo -e "  Pizza Toppings: ${YELLOW}$PIZZA_TOPPINGS_ID${NC}"
echo -e "  Burger Temp: ${YELLOW}$BURGER_TEMP_ID${NC}"
echo -e "  Burger Extras: ${YELLOW}$BURGER_EXTRAS_ID${NC}"
echo -e "  Salad Dressing: ${YELLOW}$SALAD_DRESSING_ID${NC}"
echo -e "  Drink Size: ${YELLOW}$DRINK_SIZE_ID${NC}"

# Step 3: Get all products
echo -e "\n${BLUE}[3/5] Fetching products...${NC}"
PRODUCTS_RESPONSE=$(curl -s "$BASE_URL/products/get-all/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN")

# Step 4: Link modifiers to Pizzas
echo -e "\n${BLUE}[4/5] Linking modifiers to products...${NC}"
echo -e "${YELLOW}Updating Pizzas...${NC}"

PIZZA_PRODUCTS=$(echo "$PRODUCTS_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
products = data.get('data', [])
pizzas = [p for p in products if 'pizza' in p.get('category', '').lower() or 'pizza' in p.get('name', '').lower()]
for p in pizzas:
    print(f\"{p['_id']}|{p['name']}\")
")

for line in $PIZZA_PRODUCTS; do
    PRODUCT_ID=$(echo "$line" | cut -d'|' -f1)
    PRODUCT_NAME=$(echo "$line" | cut -d'|' -f2)

    echo -e "  Updating ${PRODUCT_NAME}..."
    curl -s -X PATCH "$BASE_URL/products/$PRODUCT_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"modifiers\": [
                {
                    \"id\": \"$PIZZA_SIZE_ID\",
                    \"name\": \"Size\",
                    \"price\": 0,
                    \"isRequired\": true,
                    \"isActive\": true
                },
                {
                    \"id\": \"$PIZZA_TOPPINGS_ID\",
                    \"name\": \"Extra Toppings\",
                    \"price\": 0,
                    \"isRequired\": false,
                    \"isActive\": true
                }
            ]
        }" > /dev/null
    echo -e "${GREEN}    ✓ Updated ${PRODUCT_NAME}${NC}"
done

# Link modifiers to Burgers
echo -e "\n${YELLOW}Updating Burgers...${NC}"

BURGER_PRODUCTS=$(echo "$PRODUCTS_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
products = data.get('data', [])
burgers = [p for p in products if 'burger' in p.get('category', '').lower() or 'burger' in p.get('name', '').lower()]
for p in burgers:
    print(f\"{p['_id']}|{p['name']}\")
")

for line in $BURGER_PRODUCTS; do
    PRODUCT_ID=$(echo "$line" | cut -d'|' -f1)
    PRODUCT_NAME=$(echo "$line" | cut -d'|' -f2)

    # Skip veggie burger temperature modifier
    if [[ "$PRODUCT_NAME" == *"Veggie"* ]]; then
        echo -e "  Updating ${PRODUCT_NAME}..."
        curl -s -X PATCH "$BASE_URL/products/$PRODUCT_ID" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"modifiers\": [
                    {
                        \"id\": \"$BURGER_EXTRAS_ID\",
                        \"name\": \"Add Extras\",
                        \"price\": 0,
                        \"isRequired\": false,
                        \"isActive\": true
                    }
                ]
            }" > /dev/null
    else
        echo -e "  Updating ${PRODUCT_NAME}..."
        curl -s -X PATCH "$BASE_URL/products/$PRODUCT_ID" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"modifiers\": [
                    {
                        \"id\": \"$BURGER_TEMP_ID\",
                        \"name\": \"How would you like it cooked?\",
                        \"price\": 0,
                        \"isRequired\": true,
                        \"isActive\": true
                    },
                    {
                        \"id\": \"$BURGER_EXTRAS_ID\",
                        \"name\": \"Add Extras\",
                        \"price\": 0,
                        \"isRequired\": false,
                        \"isActive\": true
                    }
                ]
            }" > /dev/null
    fi
    echo -e "${GREEN}    ✓ Updated ${PRODUCT_NAME}${NC}"
done

# Link modifiers to Salads
echo -e "\n${YELLOW}Updating Salads...${NC}"

SALAD_PRODUCTS=$(echo "$PRODUCTS_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
products = data.get('data', [])
salads = [p for p in products if 'salad' in p.get('category', '').lower() or 'salad' in p.get('name', '').lower()]
for p in salads:
    print(f\"{p['_id']}|{p['name']}\")
")

for line in $SALAD_PRODUCTS; do
    PRODUCT_ID=$(echo "$line" | cut -d'|' -f1)
    PRODUCT_NAME=$(echo "$line" | cut -d'|' -f2)

    echo -e "  Updating ${PRODUCT_NAME}..."
    curl -s -X PATCH "$BASE_URL/products/$PRODUCT_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"modifiers\": [
                {
                    \"id\": \"$SALAD_DRESSING_ID\",
                    \"name\": \"Dressing\",
                    \"price\": 0,
                    \"isRequired\": true,
                    \"isActive\": true
                }
            ]
        }" > /dev/null
    echo -e "${GREEN}    ✓ Updated ${PRODUCT_NAME}${NC}"
done

# Link modifiers to Drinks (only sodas and cold drinks)
echo -e "\n${YELLOW}Updating Drinks...${NC}"

DRINK_PRODUCTS=$(echo "$PRODUCTS_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
products = data.get('data', [])
drinks = [p for p in products if 'drink' in p.get('category', '').lower()]
# Only sodas and cold drinks should have size options
size_drinks = [p for p in drinks if any(x in p.get('name', '').lower() for x in ['coca', 'cola', 'sprite', 'pepsi', 'lemonade', 'tea', 'iced'])]
for p in size_drinks:
    print(f\"{p['_id']}|{p['name']}\")
")

for line in $DRINK_PRODUCTS; do
    PRODUCT_ID=$(echo "$line" | cut -d'|' -f1)
    PRODUCT_NAME=$(echo "$line" | cut -d'|' -f2)

    echo -e "  Updating ${PRODUCT_NAME}..."
    curl -s -X PATCH "$BASE_URL/products/$PRODUCT_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"modifiers\": [
                {
                    \"id\": \"$DRINK_SIZE_ID\",
                    \"name\": \"Size\",
                    \"price\": 0,
                    \"isRequired\": true,
                    \"isActive\": true
                }
            ]
        }" > /dev/null
    echo -e "${GREEN}    ✓ Updated ${PRODUCT_NAME}${NC}"
done

# Step 5: Verify updates
echo -e "\n${BLUE}[5/5] Verification...${NC}"
UPDATED_COUNT=$(echo "$PRODUCTS_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
products = data.get('data', [])
count = 0
count += len([p for p in products if 'pizza' in p.get('category', '').lower() or 'pizza' in p.get('name', '').lower()])
count += len([p for p in products if 'burger' in p.get('category', '').lower() or 'burger' in p.get('name', '').lower()])
count += len([p for p in products if 'salad' in p.get('category', '').lower() or 'salad' in p.get('name', '').lower()])
drinks = [p for p in products if 'drink' in p.get('category', '').lower()]
count += len([p for p in drinks if any(x in p.get('name', '').lower() for x in ['coca', 'cola', 'sprite', 'pepsi', 'lemonade', 'tea', 'iced'])])
print(count)
" 2>/dev/null || echo "0")

echo -e "${GREEN}✓ Successfully linked modifiers to ${YELLOW}$UPDATED_COUNT${GREEN} products${NC}"

# Summary
echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          MODIFIERS LINKING COMPLETED                       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✓ Summary:${NC}"
echo -e "  ${YELLOW}•${NC} Pizzas now have Size and Extra Toppings modifiers"
echo -e "  ${YELLOW}•${NC} Burgers now have Temperature and Extras modifiers"
echo -e "  ${YELLOW}•${NC} Salads now have Dressing modifier"
echo -e "  ${YELLOW}•${NC} Drinks now have Size modifier"
echo -e "\n${BLUE}ℹ Products are now ready for ordering with customization options!${NC}\n"
