# Required Routes for Chatbot Integration

## Priority Classification

Routes are organized by priority for building a conversational ordering chatbot.

---

## 🔴 CRITICAL - Must Have (Tier 1)

These routes are absolutely essential for basic chatbot functionality.

### 1. Menu Discovery

#### `/menu2/bot-structure` ⭐ PRIMARY MENU ENDPOINT
- **Method:** GET
- **Query Params:** `subDomain`, `localId` (optional)
- **Purpose:** Load complete menu structure optimized for bot navigation
- **Returns:** Categories with nested products
- **Use Case:** Initial menu display, category browsing
- **Example:**
  ```
  GET /menu2/bot-structure?subDomain=myrestaurant&localId=branch01
  ```

### 2. Product Details

#### `/menu/getProductInMenu/{localId}/{subDomain}` ⭐ PRIMARY PRODUCT ENDPOINT
- **Method:** POST
- **Path Params:** `localId`, `subDomain`
- **Body:** Array of product IDs
- **Purpose:** Get detailed product info with presentations and modifiers
- **Returns:** Complete product details with customization options
- **Use Case:** When user selects a product to customize
- **Example:**
  ```
  POST /menu/getProductInMenu/branch01/myrestaurant
  Body: ["prod001", "prod002"]
  ```

### 3. Order Creation

#### `/order` ⭐ PRIMARY ORDER ENDPOINT
- **Method:** POST
- **Query Params:** `subDomain`, `localId`
- **Body:** Order object with customer, items, type, paymentMethod
- **Purpose:** Create new order from conversation
- **Returns:** Created order with orderNumber and orderId
- **Use Case:** When user confirms their order
- **Example:**
  ```
  POST /order?subDomain=myrestaurant&localId=branch01
  ```

### 4. Order Tracking

#### `/order/get-order/{orderId}` ⭐ PRIMARY TRACKING ENDPOINT
- **Method:** GET
- **Path Params:** `orderId`
- **Purpose:** Track order status and get details
- **Returns:** Complete order information with current status
- **Use Case:** After order creation, periodic status updates
- **Example:**
  ```
  GET /order/get-order/order123abc
  ```

---

## 🟡 IMPORTANT - Should Have (Tier 2)

These routes provide important features for a complete ordering experience.

### 5. Delivery Zones

#### `/delivery/zones/{subDomain}/{localId}`
- **Method:** GET
- **Path Params:** `subDomain`, `localId`
- **Purpose:** Check delivery availability, fees, and minimums
- **Returns:** Array of delivery zones with costs and requirements
- **Use Case:** Before order creation to validate address and show delivery fee
- **Why Important:** Prevents failed orders due to delivery zone issues
- **Example:**
  ```
  GET /delivery/zones/myrestaurant/branch01
  ```

### 6. Category List

#### `/categories/get-all/{subDomain}/{localId}`
- **Method:** GET
- **Path Params:** `subDomain`, `localId`
- **Purpose:** Get all menu categories
- **Returns:** Array of categories
- **Use Case:** Alternative menu navigation, filtering
- **Why Important:** Provides structured menu organization
- **Example:**
  ```
  GET /categories/get-all/myrestaurant/branch01
  ```

### 7. Product List

#### `/products/get-all/{subDomain}/{localId}`
- **Method:** GET
- **Path Params:** `subDomain`, `localId`
- **Query Params:** `categoryId` (optional)
- **Purpose:** Get all products or filter by category
- **Returns:** Array of products with basic info
- **Use Case:** Product search, category-based filtering
- **Why Important:** Enables flexible product browsing
- **Example:**
  ```
  GET /products/get-all/myrestaurant/branch01?categoryId=cat001
  ```

### 8. Order History

#### `/order/filled-orders/{subDomain}/{localId}`
- **Method:** GET
- **Path Params:** `subDomain`, `localId`
- **Query Params:** `phone` (optional), `status` (optional)
- **Purpose:** Retrieve customer's past orders
- **Returns:** Array of orders
- **Use Case:** "Show my orders", reorder functionality
- **Why Important:** Improves customer experience with order history
- **Example:**
  ```
  GET /order/filled-orders/myrestaurant/branch01?phone=%2B51987654321
  ```

---

## 🟢 NICE TO HAVE - Enhanced Features (Tier 3)

These routes provide additional functionality for advanced features.

### 9. Available Drivers

#### `/delivery/drivers/available/{subDomain}/{localId}`
- **Method:** GET
- **Path Params:** `subDomain`, `localId`
- **Purpose:** Check if delivery drivers are available
- **Returns:** Array of available drivers
- **Use Case:** Real-time delivery availability check
- **Why Nice:** Shows customers if drivers are available now

### 10. Order Status Update

#### `/order/{orderId}/status`
- **Method:** PATCH
- **Path Params:** `orderId`
- **Body:** `{ status, notes }`
- **Purpose:** Update order status (admin/restaurant use)
- **Returns:** Updated order
- **Use Case:** Restaurant confirms/updates order
- **Why Nice:** Allows restaurant to manage orders via chatbot

### 11. Full Menu Integration

#### `/menu2/integration/{subDomain}/{businessLocationId}`
- **Method:** GET
- **Path Params:** `subDomain`, `businessLocationId`
- **Purpose:** Get complete menu data
- **Returns:** Full menu structure with all details
- **Use Case:** Advanced menu caching, offline support
- **Why Nice:** Enables more sophisticated menu management

---

## 📋 Summary by Functionality

### Menu Browsing (3 routes)
1. ⭐ **CRITICAL:** `/menu2/bot-structure` - Bot-optimized menu
2. 🔸 **IMPORTANT:** `/categories/get-all/{subDomain}/{localId}` - Category list
3. 🔸 **IMPORTANT:** `/products/get-all/{subDomain}/{localId}` - Product list

### Product Details (1 route)
1. ⭐ **CRITICAL:** `/menu/getProductInMenu/{localId}/{subDomain}` - Detailed product info

### Order Management (3 routes)
1. ⭐ **CRITICAL:** `/order` POST - Create order
2. ⭐ **CRITICAL:** `/order/get-order/{orderId}` - Track order
3. 🔸 **IMPORTANT:** `/order/filled-orders/{subDomain}/{localId}` - Order history

### Delivery Management (2 routes)
1. 🔸 **IMPORTANT:** `/delivery/zones/{subDomain}/{localId}` - Check delivery zones
2. 🟢 **NICE:** `/delivery/drivers/available/{subDomain}/{localId}` - Check drivers

---

## 🎯 Minimum Viable Chatbot

To build a basic working chatbot, you **only need these 4 endpoints**:

1. `/menu2/bot-structure` - Browse menu
2. `/menu/getProductInMenu/{localId}/{subDomain}` - Get product details
3. `/order` (POST) - Create order
4. `/order/get-order/{orderId}` - Track order

**This will allow:**
- ✅ Browse menu categories
- ✅ View products
- ✅ See product details with modifiers
- ✅ Create orders
- ✅ Track order status

**Missing without Tier 2:**
- ❌ Delivery fee calculation
- ❌ Address validation
- ❌ Order history
- ❌ Reorder functionality

---

## 🔑 Required Parameters

### Authentication
All endpoints require:
```http
Authorization: Bearer {jwt_token}
```

### Location Identification
All endpoints require:
- **`subDomain`**: Business identifier (e.g., "myrestaurant")
- **`localId`**: Branch identifier (e.g., "branch-01")

---

## 📊 Data Flow Diagram

```
USER                    CHATBOT                      API
 |                         |                          |
 |----"Show menu"--------->|                          |
 |                         |---GET /menu2/bot-------->|
 |                         |<----Categories+Products--|
 |<----Shows categories----|                          |
 |                         |                          |
 |----"Burgers"----------->|                          |
 |<----Shows burgers-------|                          |
 |                         |                          |
 |----"Classic Burger"---->|                          |
 |                         |---POST /menu/getProduct->|
 |                         |<----Product+Modifiers----|
 |<----Shows customization-|                          |
 |                         |                          |
 |----"Large + Cheese"---->|                          |
 |<----"Added to cart"-----|                          |
 |                         |                          |
 |----"Checkout"---------->|                          |
 |<----"Name/Phone?"-------|                          |
 |                         |                          |
 |----Customer info------->|                          |
 |<----"Delivery address?"-|                          |
 |                         |                          |
 |----Address------------->|                          |
 |                         |---GET /delivery/zones--->|
 |                         |<----Zone+Fee+Validation--|
 |<----"Fee: $5"-----------|                          |
 |                         |                          |
 |----"Confirm"----------->|                          |
 |                         |---POST /order----------->|
 |                         |<----Order Created--------|
 |<----"Order #1234"-------|                          |
 |                         |                          |
 |                         |---GET /order/{id}------->|
 |                         |<----Status: preparing----|
 |<----"Being prepared"----|                          |
```

---

## 🧪 Testing Priority

Test in this order:

1. **Menu Loading** → Test `/menu2/bot-structure`
2. **Product Details** → Test `/menu/getProductInMenu`
3. **Order Creation** → Test `/order` POST
4. **Order Tracking** → Test `/order/get-order/{orderId}`
5. **Delivery Zones** → Test `/delivery/zones`
6. **Order History** → Test `/order/filled-orders`

---

## 📖 Next Steps

1. **Get Authentication Token** - Contact CartaAI support
2. **Download Spec** - Use [openapi-chatbot.yaml](./openapi-chatbot.yaml)
3. **Read Full Guide** - See [CHATBOT_INTEGRATION.md](./CHATBOT_INTEGRATION.md)
4. **Start Integration** - Begin with Tier 1 endpoints
5. **Test Thoroughly** - Use the testing checklist in full guide

---

## 💬 Quick Reference Card

| Need to... | Use this endpoint |
|-----------|-------------------|
| Show menu to user | `GET /menu2/bot-structure` |
| Display product details | `POST /menu/getProductInMenu` |
| Create an order | `POST /order` |
| Check order status | `GET /order/get-order/{orderId}` |
| Validate delivery address | `GET /delivery/zones` |
| Show order history | `GET /order/filled-orders` |
| Check delivery availability | `GET /delivery/drivers/available` |

---

**Questions?** See [CHATBOT_INTEGRATION.md](./CHATBOT_INTEGRATION.md) for detailed documentation or contact support@cartaai.pe
