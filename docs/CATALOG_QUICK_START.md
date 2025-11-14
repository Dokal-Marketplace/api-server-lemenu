# Meta Catalog API - Quick Start Guide

Get started with Meta Product Catalog management in 5 minutes.

## Prerequisites Checklist

Before you begin, ensure:

- [ ] Your Business has a Meta Business Manager ID
- [ ] WhatsApp Business API is configured
- [ ] You have a valid JWT authentication token
- [ ] Your Business has `businessManagerId` and `whatsappAccessToken` configured

## Quick Test

### 1. Check Your Configuration

```bash
# Replace with your actual values
export API_URL="http://localhost:3000"
export JWT_TOKEN="your_jwt_token_here"
export SUBDOMAIN="yoursubdomain"

# Test authentication
curl -X GET "$API_URL/api/v1/whatsapp/health?subDomain=$SUBDOMAIN" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Expected Response:**
```json
{
  "type": "1",
  "message": "WhatsApp is healthy and operational"
}
```

---

### 2. List Existing Catalogs

```bash
curl -X GET "$API_URL/api/v1/whatsapp/catalogs?subDomain=$SUBDOMAIN" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Expected Response:**
```json
{
  "type": "1",
  "message": "Catalogs retrieved successfully",
  "data": {
    "catalogs": []
  }
}
```

---

### 3. Create Your First Catalog

```bash
curl -X POST "$API_URL/api/v1/whatsapp/catalogs" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"subDomain\": \"$SUBDOMAIN\",
    \"name\": \"My Restaurant Menu\",
    \"vertical\": \"commerce\"
  }"
```

**Expected Response:**
```json
{
  "type": "1",
  "message": "Catalog created successfully",
  "data": {
    "id": "1234567890",
    "success": true
  }
}
```

**Save the catalog ID for next steps:**
```bash
export CATALOG_ID="1234567890"
```

---

### 4. Add Your First Product

```bash
curl -X POST "$API_URL/api/v1/whatsapp/catalogs/$CATALOG_ID/products" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"subDomain\": \"$SUBDOMAIN\",
    \"retailer_id\": \"PIZZA_MARGHERITA_001\",
    \"name\": \"Pizza Margherita\",
    \"description\": \"Classic Italian pizza with tomato sauce, mozzarella, and fresh basil\",
    \"price\": 25.00,
    \"currency\": \"PEN\",
    \"availability\": \"in stock\",
    \"condition\": \"new\",
    \"image_url\": \"https://example.com/pizza.jpg\",
    \"category\": \"Pizza\"
  }"
```

**Expected Response:**
```json
{
  "type": "1",
  "message": "Product created successfully",
  "data": {
    "id": "prod_123",
    "success": true
  }
}
```

---

### 5. View Your Products

```bash
curl -X GET "$API_URL/api/v1/whatsapp/catalogs/$CATALOG_ID/products?subDomain=$SUBDOMAIN&limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**Expected Response:**
```json
{
  "type": "1",
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": "prod_123",
        "retailer_id": "PIZZA_MARGHERITA_001",
        "name": "Pizza Margherita",
        "price": "25.00",
        "currency": "PEN",
        "availability": "in stock"
      }
    ]
  }
}
```

---

### 6. Send a WhatsApp Product Message

```bash
export PHONE_NUMBER="+51999999999"  # Replace with actual phone number

curl -X POST "$API_URL/api/v1/whatsapp/send-product" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"subDomain\": \"$SUBDOMAIN\",
    \"to\": \"$PHONE_NUMBER\",
    \"catalogId\": \"$CATALOG_ID\",
    \"productRetailerId\": \"PIZZA_MARGHERITA_001\",
    \"body\": \"Check out our delicious Pizza Margherita! 🍕\",
    \"footer\": \"Order now via WhatsApp\"
  }"
```

**Expected Response:**
```json
{
  "type": "1",
  "message": "Product message sent successfully",
  "data": {
    "messaging_product": "whatsapp",
    "contacts": [...],
    "messages": [...]
  }
}
```

---

## Bulk Operations Example

### Add Multiple Products at Once

```bash
curl -X POST "$API_URL/api/v1/whatsapp/catalogs/$CATALOG_ID/products/batch" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"subDomain\": \"$SUBDOMAIN\",
    \"operations\": [
      {
        \"method\": \"CREATE\",
        \"retailer_id\": \"BURGER_CLASSIC_001\",
        \"data\": {
          \"retailer_id\": \"BURGER_CLASSIC_001\",
          \"name\": \"Classic Burger\",
          \"description\": \"Juicy beef burger with lettuce and tomato\",
          \"price\": 18.00,
          \"currency\": \"PEN\",
          \"availability\": \"in stock\",
          \"category\": \"Burgers\"
        }
      },
      {
        \"method\": \"CREATE\",
        \"retailer_id\": \"PASTA_CARBONARA_001\",
        \"data\": {
          \"retailer_id\": \"PASTA_CARBONARA_001\",
          \"name\": \"Pasta Carbonara\",
          \"description\": \"Creamy pasta with bacon and parmesan\",
          \"price\": 22.00,
          \"currency\": \"PEN\",
          \"availability\": \"in stock\",
          \"category\": \"Pasta\"
        }
      },
      {
        \"method\": \"CREATE\",
        \"retailer_id\": \"TIRAMISU_001\",
        \"data\": {
          \"retailer_id\": \"TIRAMISU_001\",
          \"name\": \"Tiramisu\",
          \"description\": \"Classic Italian dessert\",
          \"price\": 12.00,
          \"currency\": \"PEN\",
          \"availability\": \"in stock\",
          \"category\": \"Desserts\"
        }
      }
    ]
  }"
```

---

## Send Product List Message

```bash
curl -X POST "$API_URL/api/v1/whatsapp/send-product-list" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"subDomain\": \"$SUBDOMAIN\",
    \"to\": \"$PHONE_NUMBER\",
    \"catalogId\": \"$CATALOG_ID\",
    \"header\": {
      \"type\": \"text\",
      \"content\": \"Our Menu 🍽️\"
    },
    \"body\": \"Choose from our delicious options!\",
    \"footer\": \"Tap to order\",
    \"sections\": [
      {
        \"title\": \"Main Dishes\",
        \"productItems\": [
          { \"productRetailerId\": \"PIZZA_MARGHERITA_001\" },
          { \"productRetailerId\": \"BURGER_CLASSIC_001\" },
          { \"productRetailerId\": \"PASTA_CARBONARA_001\" }
        ]
      },
      {
        \"title\": \"Desserts\",
        \"productItems\": [
          { \"productRetailerId\": \"TIRAMISU_001\" }
        ]
      }
    ]
  }"
```

---

## Update Product Price

```bash
curl -X PUT "$API_URL/api/v1/whatsapp/catalogs/$CATALOG_ID/products/PIZZA_MARGHERITA_001" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"subDomain\": \"$SUBDOMAIN\",
    \"price\": 27.00,
    \"availability\": \"in stock\"
  }"
```

---

## Mark Product as Out of Stock

```bash
curl -X PUT "$API_URL/api/v1/whatsapp/catalogs/$CATALOG_ID/products/BURGER_CLASSIC_001" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"subDomain\": \"$SUBDOMAIN\",
    \"availability\": \"out of stock\"
  }"
```

---

## Delete a Product

```bash
curl -X DELETE "$API_URL/api/v1/whatsapp/catalogs/$CATALOG_ID/products/TIRAMISU_001?subDomain=$SUBDOMAIN" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## JavaScript/Node.js Example

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000';
const JWT_TOKEN = 'your_jwt_token';
const SUBDOMAIN = 'yoursubdomain';

// Create catalog and add products
async function setupCatalog() {
  try {
    // 1. Create catalog
    const catalogResponse = await axios.post(
      `${API_URL}/api/v1/whatsapp/catalogs`,
      {
        subDomain: SUBDOMAIN,
        name: 'My Restaurant Menu',
        vertical: 'commerce'
      },
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const catalogId = catalogResponse.data.data.id;
    console.log('Catalog created:', catalogId);

    // 2. Add products
    const products = [
      {
        retailer_id: 'PIZZA_001',
        name: 'Pizza Margherita',
        price: 25.00,
        currency: 'PEN',
        availability: 'in stock'
      },
      {
        retailer_id: 'BURGER_001',
        name: 'Classic Burger',
        price: 18.00,
        currency: 'PEN',
        availability: 'in stock'
      }
    ];

    for (const product of products) {
      await axios.post(
        `${API_URL}/api/v1/whatsapp/catalogs/${catalogId}/products`,
        {
          subDomain: SUBDOMAIN,
          ...product
        },
        {
          headers: {
            'Authorization': `Bearer ${JWT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Product added:', product.name);
    }

    // 3. Send WhatsApp message
    await axios.post(
      `${API_URL}/api/v1/whatsapp/send-product`,
      {
        subDomain: SUBDOMAIN,
        to: '+51999999999',
        catalogId: catalogId,
        productRetailerId: 'PIZZA_001',
        body: 'Check out our Pizza! 🍕'
      },
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('WhatsApp message sent!');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

setupCatalog();
```

---

## Python Example

```python
import requests
import json

API_URL = "http://localhost:3000"
JWT_TOKEN = "your_jwt_token"
SUBDOMAIN = "yoursubdomain"

headers = {
    "Authorization": f"Bearer {JWT_TOKEN}",
    "Content-Type": "application/json"
}

# 1. Create catalog
response = requests.post(
    f"{API_URL}/api/v1/whatsapp/catalogs",
    headers=headers,
    json={
        "subDomain": SUBDOMAIN,
        "name": "My Restaurant Menu",
        "vertical": "commerce"
    }
)
catalog_id = response.json()["data"]["id"]
print(f"Catalog created: {catalog_id}")

# 2. Add product
response = requests.post(
    f"{API_URL}/api/v1/whatsapp/catalogs/{catalog_id}/products",
    headers=headers,
    json={
        "subDomain": SUBDOMAIN,
        "retailer_id": "PIZZA_001",
        "name": "Pizza Margherita",
        "price": 25.00,
        "currency": "PEN",
        "availability": "in stock"
    }
)
print("Product added!")

# 3. Send WhatsApp message
response = requests.post(
    f"{API_URL}/api/v1/whatsapp/send-product",
    headers=headers,
    json={
        "subDomain": SUBDOMAIN,
        "to": "+51999999999",
        "catalogId": catalog_id,
        "productRetailerId": "PIZZA_001",
        "body": "Check out our Pizza! 🍕"
    }
)
print("Message sent!")
```

---

## Common Issues & Solutions

### Issue 1: "Business Manager ID not configured"

**Solution:** Add `businessManagerId` to your Business document:

```javascript
// In MongoDB or via API
{
  businessManagerId: "YOUR_META_BUSINESS_MANAGER_ID"
}
```

### Issue 2: "WhatsApp access token not configured"

**Solution:** Exchange OAuth code for access token first:

```bash
curl -X POST "$API_URL/api/v1/whatsapp/facebook/exchange-token" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"subDomain\": \"$SUBDOMAIN\",
    \"code\": \"OAUTH_CODE_FROM_FACEBOOK\",
    \"waba_id\": \"YOUR_WABA_ID\",
    \"phone_number_id\": \"YOUR_PHONE_NUMBER_ID\"
  }"
```

### Issue 3: 401 Authentication Error

**Solution:** Verify your JWT token is valid and not expired.

---

## Next Steps

1. ✅ Test all endpoints with your development environment
2. ✅ Sync your existing menu items to the catalog
3. ✅ Test WhatsApp product messaging with real phone numbers
4. ✅ Implement automatic menu synchronization
5. ✅ Set up monitoring for catalog updates

## Resources

- **Full Documentation**: `CATALOG_API_DOCUMENTATION.md`
- **Implementation Details**: `CATALOG_IMPLEMENTATION_SUMMARY.md`
- **Meta API Reference**: https://developers.facebook.com/docs/marketing-api/catalog/

---

**Ready to go? Start with step 1 and work your way through!** 🚀
