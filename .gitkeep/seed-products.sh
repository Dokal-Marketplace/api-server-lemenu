#!/bin/bash

# Product Seeding Script
# Seeds categories with relevant products

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
PIZZA_CATEGORY_ID="my-restaurant:LOC1760097779968WGX4I:cat:1761042384427"
DRINKS_CATEGORY_ID="my-restaurant:LOC1760097779968WGX4I:cat:1760101891813"
LOCAL_DISHES_CATEGORY_ID="my-restaurant:LOC1760097779968WGX4I:cat:1760101910770"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         PRODUCT SEEDING SCRIPT                             ║${NC}"
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

# Step 2: Create Pizza Products
echo -e "\n${BLUE}[2/4] Creating Pizza Products...${NC}"

# Margherita Pizza
echo -e "${YELLOW}Creating Margherita Pizza...${NC}"
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Margherita",
        "description": "Classic pizza with fresh tomatoes, mozzarella, and basil",
        "price": 12.99,
        "categoryId": "'"$PIZZA_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 20,
        "imageUrl": "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca"
    }' > /dev/null
echo -e "${GREEN}✓ Created Margherita${NC}"

# Pepperoni Pizza
echo -e "${YELLOW}Creating Pepperoni Pizza...${NC}"
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Pepperoni",
        "description": "Classic pepperoni with mozzarella and tomato sauce",
        "price": 14.99,
        "categoryId": "'"$PIZZA_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 20,
        "imageUrl": "https://images.unsplash.com/photo-1628840042765-356cda07504e"
    }' > /dev/null
echo -e "${GREEN}✓ Created Pepperoni${NC}"

# Quattro Formaggi
echo -e "${YELLOW}Creating Quattro Formaggi...${NC}"
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Quattro Formaggi",
        "description": "Four cheese pizza: mozzarella, gorgonzola, parmesan, and fontina",
        "price": 15.99,
        "categoryId": "'"$PIZZA_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 20,
        "imageUrl": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38"
    }' > /dev/null
echo -e "${GREEN}✓ Created Quattro Formaggi${NC}"

# Vegetarian Pizza
echo -e "${YELLOW}Creating Vegetarian Pizza...${NC}"
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Vegetarian",
        "description": "Fresh vegetables including bell peppers, mushrooms, onions, and olives",
        "price": 13.99,
        "categoryId": "'"$PIZZA_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 20,
        "imageUrl": "https://images.unsplash.com/photo-1571407970349-bc81e7e96e47"
    }' > /dev/null
echo -e "${GREEN}✓ Created Vegetarian${NC}"

# BBQ Chicken Pizza
echo -e "${YELLOW}Creating BBQ Chicken Pizza...${NC}"
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "BBQ Chicken",
        "description": "Grilled chicken with BBQ sauce, red onions, and cilantro",
        "price": 16.99,
        "categoryId": "'"$PIZZA_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 25,
        "imageUrl": "https://images.unsplash.com/photo-1565299507177-b0ac66763828"
    }' > /dev/null
echo -e "${GREEN}✓ Created BBQ Chicken${NC}"

# Step 3: Create More Drink Products
echo -e "\n${BLUE}[3/4] Creating Additional Drink Products...${NC}"

# Coca-Cola
echo -e "${YELLOW}Creating Coca-Cola...${NC}"
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Coca-Cola",
        "description": "Classic Coca-Cola 330ml can",
        "price": 2.50,
        "categoryId": "'"$DRINKS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 0,
        "imageUrl": "https://images.unsplash.com/photo-1554866585-cd94860890b7"
    }' > /dev/null
echo -e "${GREEN}✓ Created Coca-Cola${NC}"

# Fresh Orange Juice
echo -e "${YELLOW}Creating Fresh Orange Juice...${NC}"
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Fresh Orange Juice",
        "description": "Freshly squeezed orange juice",
        "price": 4.50,
        "categoryId": "'"$DRINKS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 5,
        "imageUrl": "https://images.unsplash.com/photo-1600271886742-f049cd451bba"
    }' > /dev/null
echo -e "${GREEN}✓ Created Fresh Orange Juice${NC}"

# Lemonade
echo -e "${YELLOW}Creating Lemonade...${NC}"
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Lemonade",
        "description": "Homemade lemonade with fresh lemons",
        "price": 3.50,
        "categoryId": "'"$DRINKS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 5,
        "imageUrl": "https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9d"
    }' > /dev/null
echo -e "${GREEN}✓ Created Lemonade${NC}"

# Iced Tea
echo -e "${YELLOW}Creating Iced Tea...${NC}"
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Iced Tea",
        "description": "Refreshing iced tea with lemon",
        "price": 3.00,
        "categoryId": "'"$DRINKS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 0,
        "imageUrl": "https://images.unsplash.com/photo-1556679343-c7306c1976bc"
    }' > /dev/null
echo -e "${GREEN}✓ Created Iced Tea${NC}"

# Step 4: Create Local Dishes
echo -e "\n${BLUE}[4/4] Creating Local Dishes...${NC}"

# Riz Gras (West African Jollof)
echo -e "${YELLOW}Creating Riz Gras...${NC}"
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Riz Gras",
        "description": "Traditional West African rice dish with meat and vegetables",
        "price": 8.99,
        "categoryId": "'"$LOCAL_DISHES_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 30,
        "imageUrl": "https://images.unsplash.com/photo-1585937421612-70a008356fbe"
    }' > /dev/null
echo -e "${GREEN}✓ Created Riz Gras${NC}"

# Poulet Braisé
echo -e "${YELLOW}Creating Poulet Braisé...${NC}"
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Poulet Braisé",
        "description": "Grilled chicken marinated with African spices, served with attieke",
        "price": 10.99,
        "categoryId": "'"$LOCAL_DISHES_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 35,
        "imageUrl": "https://images.unsplash.com/photo-1598103442097-8b74394b95c6"
    }' > /dev/null
echo -e "${GREEN}✓ Created Poulet Braisé${NC}"

# Alloco
echo -e "${YELLOW}Creating Alloco...${NC}"
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Alloco",
        "description": "Fried plantains with spicy tomato sauce and onions",
        "price": 5.99,
        "categoryId": "'"$LOCAL_DISHES_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 15,
        "imageUrl": "https://images.unsplash.com/photo-1587573089551-e855b1fa08e9"
    }' > /dev/null
echo -e "${GREEN}✓ Created Alloco${NC}"

# Sauce Arachide
echo -e "${YELLOW}Creating Sauce Arachide...${NC}"
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Sauce Arachide",
        "description": "Peanut butter stew with meat and vegetables, served with rice",
        "price": 9.99,
        "categoryId": "'"$LOCAL_DISHES_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 40,
        "imageUrl": "https://images.unsplash.com/photo-1589302168068-964664d93dc0"
    }' > /dev/null
echo -e "${GREEN}✓ Created Sauce Arachide${NC}"

# Tô (Millet porridge)
echo -e "${YELLOW}Creating Tô...${NC}"
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Tô",
        "description": "Traditional millet porridge served with okra or baobab leaf sauce",
        "price": 7.99,
        "categoryId": "'"$LOCAL_DISHES_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 25,
        "imageUrl": "https://images.unsplash.com/photo-1609501676725-7186f017a4b7"
    }' > /dev/null
echo -e "${GREEN}✓ Created Tô${NC}"

# Brochettes
echo -e "${YELLOW}Creating Brochettes...${NC}"
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Brochettes",
        "description": "Grilled meat skewers with African spices",
        "price": 6.99,
        "categoryId": "'"$LOCAL_DISHES_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 20,
        "imageUrl": "https://images.unsplash.com/photo-1633504581786-316c8002b1b2"
    }' > /dev/null
echo -e "${GREEN}✓ Created Brochettes${NC}"

# Summary
echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              SEEDING COMPLETED                             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✓ Product Seeding Complete${NC}"
echo -e "${BLUE}Summary:${NC}"
echo -e "  ${YELLOW}5${NC} Pizzas added"
echo -e "  ${YELLOW}4${NC} Drinks added"
echo -e "  ${YELLOW}6${NC} Local Dishes added"
echo -e "  ${YELLOW}Total: 15${NC} new products\n"
