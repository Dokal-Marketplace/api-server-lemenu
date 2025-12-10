#!/bin/bash

# Additional Categories Seeding Script
# Adds new categories with relevant products

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
echo -e "${CYAN}║       ADDITIONAL CATEGORIES SEEDING SCRIPT                 ║${NC}"
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

# Step 2: Create Desserts Category and Products
echo -e "\n${BLUE}[2/5] Creating Desserts Category...${NC}"
DESSERTS_RESPONSE=$(curl -s -X POST "$BASE_URL/categories" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Desserts",
        "description": "Sweet treats and desserts",
        "imageUrl": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e",
        "position": 4,
        "subDomain": "'"$SUBDOMAIN"'",
        "localId": "'"$LOCALID"'"
    }')

DESSERTS_CATEGORY_ID=$(echo "$DESSERTS_RESPONSE" | grep -o '"rId":"[^"]*' | sed 's/"rId":"//' | head -1)
echo -e "${GREEN}✓ Desserts Category Created: ${YELLOW}$DESSERTS_CATEGORY_ID${NC}"

echo -e "\n${YELLOW}Adding Dessert Products...${NC}"

# Tiramisu
echo -e "  Creating Tiramisu..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Tiramisu",
        "description": "Classic Italian dessert with coffee-soaked ladyfingers and mascarpone cream",
        "price": 6.99,
        "categoryId": "'"$DESSERTS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 10,
        "imageUrl": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Tiramisu${NC}"

# Chocolate Lava Cake
echo -e "  Creating Chocolate Lava Cake..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Chocolate Lava Cake",
        "description": "Warm chocolate cake with a molten chocolate center, served with vanilla ice cream",
        "price": 7.99,
        "categoryId": "'"$DESSERTS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 15,
        "imageUrl": "https://images.unsplash.com/photo-1624353365286-3f8d62daad51"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Chocolate Lava Cake${NC}"

# Cheesecake
echo -e "  Creating New York Cheesecake..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "New York Cheesecake",
        "description": "Creamy cheesecake with graham cracker crust and berry compote",
        "price": 6.50,
        "categoryId": "'"$DESSERTS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 10,
        "imageUrl": "https://images.unsplash.com/photo-1533134486753-c833f0ed4866"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created New York Cheesecake${NC}"

# Crème Brûlée
echo -e "  Creating Crème Brûlée..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Crème Brûlée",
        "description": "Vanilla custard with caramelized sugar crust",
        "price": 5.99,
        "categoryId": "'"$DESSERTS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 12,
        "imageUrl": "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Crème Brûlée${NC}"

# Step 3: Create Appetizers Category and Products
echo -e "\n${BLUE}[3/5] Creating Appetizers Category...${NC}"
APPETIZERS_RESPONSE=$(curl -s -X POST "$BASE_URL/categories" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Appetizers",
        "description": "Starters and small plates",
        "imageUrl": "https://images.unsplash.com/photo-1541529086526-db283c563270",
        "position": 5,
        "subDomain": "'"$SUBDOMAIN"'",
        "localId": "'"$LOCALID"'"
    }')

APPETIZERS_CATEGORY_ID=$(echo "$APPETIZERS_RESPONSE" | grep -o '"rId":"[^"]*' | sed 's/"rId":"//' | head -1)
echo -e "${GREEN}✓ Appetizers Category Created: ${YELLOW}$APPETIZERS_CATEGORY_ID${NC}"

echo -e "\n${YELLOW}Adding Appetizer Products...${NC}"

# Spring Rolls
echo -e "  Creating Spring Rolls..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Spring Rolls",
        "description": "Crispy vegetable spring rolls served with sweet chili sauce",
        "price": 5.99,
        "categoryId": "'"$APPETIZERS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 10,
        "imageUrl": "https://images.unsplash.com/photo-1588803321411-7a8f0dfc06bf"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Spring Rolls${NC}"

# Chicken Wings
echo -e "  Creating Chicken Wings..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Buffalo Chicken Wings",
        "description": "Spicy buffalo wings served with blue cheese dip and celery sticks",
        "price": 8.99,
        "categoryId": "'"$APPETIZERS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 20,
        "imageUrl": "https://images.unsplash.com/photo-1608039755401-742074f0548d"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Buffalo Chicken Wings${NC}"

# Mozzarella Sticks
echo -e "  Creating Mozzarella Sticks..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Mozzarella Sticks",
        "description": "Golden fried mozzarella sticks with marinara sauce",
        "price": 6.99,
        "categoryId": "'"$APPETIZERS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 12,
        "imageUrl": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Mozzarella Sticks${NC}"

# Bruschetta
echo -e "  Creating Bruschetta..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Bruschetta",
        "description": "Toasted bread topped with fresh tomatoes, basil, and garlic",
        "price": 5.50,
        "categoryId": "'"$APPETIZERS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 8,
        "imageUrl": "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Bruschetta${NC}"

# Calamari
echo -e "  Creating Fried Calamari..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Fried Calamari",
        "description": "Crispy fried squid rings with lemon aioli",
        "price": 9.99,
        "categoryId": "'"$APPETIZERS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 15,
        "imageUrl": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Fried Calamari${NC}"

# Step 4: Create Burgers Category and Products
echo -e "\n${BLUE}[4/5] Creating Burgers Category...${NC}"
BURGERS_RESPONSE=$(curl -s -X POST "$BASE_URL/categories" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Burgers",
        "description": "Juicy burgers and sandwiches",
        "imageUrl": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
        "position": 6,
        "subDomain": "'"$SUBDOMAIN"'",
        "localId": "'"$LOCALID"'"
    }')

BURGERS_CATEGORY_ID=$(echo "$BURGERS_RESPONSE" | grep -o '"rId":"[^"]*' | sed 's/"rId":"//' | head -1)
echo -e "${GREEN}✓ Burgers Category Created: ${YELLOW}$BURGERS_CATEGORY_ID${NC}"

echo -e "\n${YELLOW}Adding Burger Products...${NC}"

# Classic Burger
echo -e "  Creating Classic Burger..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Classic Burger",
        "description": "Beef patty with lettuce, tomato, onion, pickles, and special sauce",
        "price": 10.99,
        "categoryId": "'"$BURGERS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 15,
        "imageUrl": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Classic Burger${NC}"

# Cheeseburger
echo -e "  Creating Cheeseburger..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Cheeseburger",
        "description": "Classic burger with melted cheddar cheese",
        "price": 11.99,
        "categoryId": "'"$BURGERS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 15,
        "imageUrl": "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Cheeseburger${NC}"

# Bacon Burger
echo -e "  Creating Bacon Burger..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Bacon Burger",
        "description": "Beef patty topped with crispy bacon, cheese, and BBQ sauce",
        "price": 13.99,
        "categoryId": "'"$BURGERS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 18,
        "imageUrl": "https://images.unsplash.com/photo-1553979459-d2229ba7433b"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Bacon Burger${NC}"

# Veggie Burger
echo -e "  Creating Veggie Burger..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Veggie Burger",
        "description": "Plant-based patty with avocado, lettuce, tomato, and chipotle mayo",
        "price": 11.99,
        "categoryId": "'"$BURGERS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 15,
        "imageUrl": "https://images.unsplash.com/photo-1520072959219-c595dc870360"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Veggie Burger${NC}"

# Step 5: Create Salads Category and Products
echo -e "\n${BLUE}[5/5] Creating Salads Category...${NC}"
SALADS_RESPONSE=$(curl -s -X POST "$BASE_URL/categories" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Salads",
        "description": "Fresh and healthy salads",
        "imageUrl": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
        "position": 7,
        "subDomain": "'"$SUBDOMAIN"'",
        "localId": "'"$LOCALID"'"
    }')

SALADS_CATEGORY_ID=$(echo "$SALADS_RESPONSE" | grep -o '"rId":"[^"]*' | sed 's/"rId":"//' | head -1)
echo -e "${GREEN}✓ Salads Category Created: ${YELLOW}$SALADS_CATEGORY_ID${NC}"

echo -e "\n${YELLOW}Adding Salad Products...${NC}"

# Caesar Salad
echo -e "  Creating Caesar Salad..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Caesar Salad",
        "description": "Romaine lettuce with parmesan, croutons, and Caesar dressing",
        "price": 8.99,
        "categoryId": "'"$SALADS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 10,
        "imageUrl": "https://images.unsplash.com/photo-1546793665-c74683f339c1"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Caesar Salad${NC}"

# Greek Salad
echo -e "  Creating Greek Salad..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Greek Salad",
        "description": "Fresh vegetables with feta cheese, olives, and olive oil dressing",
        "price": 9.50,
        "categoryId": "'"$SALADS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 10,
        "imageUrl": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Greek Salad${NC}"

# Caprese Salad
echo -e "  Creating Caprese Salad..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Caprese Salad",
        "description": "Fresh mozzarella, tomatoes, and basil with balsamic glaze",
        "price": 8.50,
        "categoryId": "'"$SALADS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 8,
        "imageUrl": "https://images.unsplash.com/photo-1608897013039-887f21d8c804"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Caprese Salad${NC}"

# Chicken Salad
echo -e "  Creating Grilled Chicken Salad..."
curl -s -X POST "$BASE_URL/products/$SUBDOMAIN/$LOCALID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Grilled Chicken Salad",
        "description": "Mixed greens with grilled chicken, cherry tomatoes, and honey mustard dressing",
        "price": 11.99,
        "categoryId": "'"$SALADS_CATEGORY_ID"'",
        "isAvailable": true,
        "preparationTime": 15,
        "imageUrl": "https://images.unsplash.com/photo-1604909052743-94e838986d24"
    }' > /dev/null
echo -e "${GREEN}  ✓ Created Grilled Chicken Salad${NC}"

# Summary
echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           ADDITIONAL SEEDING COMPLETED                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}✓ Additional Categories and Products Seeding Complete${NC}"
echo -e "${BLUE}Summary:${NC}"
echo -e "  ${YELLOW}4${NC} Desserts added"
echo -e "  ${YELLOW}5${NC} Appetizers added"
echo -e "  ${YELLOW}4${NC} Burgers added"
echo -e "  ${YELLOW}4${NC} Salads added"
echo -e "  ${YELLOW}Total: 17${NC} new products in ${YELLOW}4${NC} new categories\n"
