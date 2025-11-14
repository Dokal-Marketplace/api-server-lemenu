# Meta Product Catalog API Documentation

Complete guide for managing Meta/Facebook Business Manager Product Catalogs through your WhatsApp API.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Authentication](#authentication)
3. [Catalog Management](#catalog-management)
4. [Product Management](#product-management)
5. [User Permissions](#user-permissions)
6. [Error Handling](#error-handling)
7. [Examples](#examples)

---

## Prerequisites

Before using the Catalog API, ensure:

1. **Business Manager ID** is configured in your Business model (`businessManagerId` or `fbBusinessId`)
2. **WhatsApp Access Token** is stored in the Business model (`whatsappAccessToken`)
3. **Appropriate permissions** granted to your Meta app:
   - `catalog_management`
   - `business_management`
   - `whatsapp_business_management`

---

## Authentication

All endpoints require authentication via JWT token:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

Business context can be provided via:
- Query parameters: `?subDomain=yoursubdomain&localId=location1`
- Request body: `{ "subDomain": "yoursubdomain", "localId": "location1" }`
- Authenticated user's business (automatic)

---

## Catalog Management

### 1. Get All Catalogs

**Endpoint:** `GET /api/v1/whatsapp/catalogs`

Retrieve all product catalogs owned by your business.

**Request:**
```bash
curl -X GET \
  'https://your-api.com/api/v1/whatsapp/catalogs?subDomain=yoursubdomain' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Response:**
```json
{
  "type": "1",
  "message": "Catalogs retrieved successfully",
  "data": {
    "catalogs": [
      {
        "id": "1234567890",
        "name": "Main Product Catalog",
        "vertical": "commerce",
        "product_count": 150,
        "feed_count": 2
      }
    ]
  }
}
```

---

### 2. Get Specific Catalog

**Endpoint:** `GET /api/v1/whatsapp/catalogs/:catalogId`

Get details of a specific catalog.

**Request:**
```bash
curl -X GET \
  'https://your-api.com/api/v1/whatsapp/catalogs/1234567890?subDomain=yoursubdomain' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Response:**
```json
{
  "type": "1",
  "message": "Catalog retrieved successfully",
  "data": {
    "id": "1234567890",
    "name": "Main Product Catalog",
    "vertical": "commerce",
    "product_count": 150,
    "feed_count": 2,
    "default_image_url": "https://example.com/default.jpg",
    "business": {
      "id": "987654321",
      "name": "Your Business"
    }
  }
}
```

---

### 3. Create Catalog

**Endpoint:** `POST /api/v1/whatsapp/catalogs`

Create a new product catalog.

**Request:**
```bash
curl -X POST \
  'https://your-api.com/api/v1/whatsapp/catalogs' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "subDomain": "yoursubdomain",
    "name": "Restaurant Menu Catalog",
    "vertical": "commerce",
    "defaultImageUrl": "https://example.com/default-product.jpg"
  }'
```

**Response:**
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

**Supported Verticals:**
- `commerce` (default) - General products
- `hotels` - Hotel rooms and services
- `flights` - Flight tickets
- `vehicles` - Cars, motorcycles, etc.
- `home_listings` - Real estate
- `adoptable_pets` - Pet adoption

---

### 4. Update Catalog

**Endpoint:** `PUT /api/v1/whatsapp/catalogs/:catalogId`

Update an existing catalog's properties.

**Request:**
```bash
curl -X PUT \
  'https://your-api.com/api/v1/whatsapp/catalogs/1234567890' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "subDomain": "yoursubdomain",
    "name": "Updated Catalog Name",
    "defaultImageUrl": "https://example.com/new-default.jpg"
  }'
```

**Response:**
```json
{
  "type": "1",
  "message": "Catalog updated successfully",
  "data": {
    "success": true
  }
}
```

---

### 5. Delete Catalog

**Endpoint:** `DELETE /api/v1/whatsapp/catalogs/:catalogId`

Delete a product catalog.

**Request:**
```bash
curl -X DELETE \
  'https://your-api.com/api/v1/whatsapp/catalogs/1234567890?subDomain=yoursubdomain' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Query Parameters:**
- `allowDeleteWithLiveProductSet` (optional): Set to `true` to force deletion even with active product sets

**Response:**
```json
{
  "type": "1",
  "message": "Catalog deleted successfully",
  "data": {
    "success": true
  }
}
```

---

## Product Management

### 1. Get All Products

**Endpoint:** `GET /api/v1/whatsapp/catalogs/:catalogId/products`

Retrieve all products in a catalog with pagination.

**Request:**
```bash
curl -X GET \
  'https://your-api.com/api/v1/whatsapp/catalogs/1234567890/products?subDomain=yoursubdomain&limit=50' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Query Parameters:**
- `limit` (optional, default: 100): Number of products per page
- `after` (optional): Pagination cursor

**Response:**
```json
{
  "type": "1",
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "id": "prod_123",
        "retailer_id": "PIZZA_MARGHERITA",
        "name": "Pizza Margherita",
        "description": "Classic Italian pizza",
        "price": "25.00",
        "currency": "PEN",
        "availability": "in stock",
        "image_url": "https://example.com/pizza.jpg"
      }
    ],
    "paging": {
      "cursors": {
        "after": "MTAxNTExOTQ1MjAwNzI5NDE",
        "before": "NDMyNzQyODI3OTQw"
      },
      "next": "https://graph.facebook.com/v24.0/..."
    }
  }
}
```

---

### 2. Get Specific Product

**Endpoint:** `GET /api/v1/whatsapp/catalogs/:catalogId/products/:retailerId`

Get a specific product by retailer ID.

**Request:**
```bash
curl -X GET \
  'https://your-api.com/api/v1/whatsapp/catalogs/1234567890/products/PIZZA_MARGHERITA?subDomain=yoursubdomain' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Response:**
```json
{
  "type": "1",
  "message": "Product retrieved successfully",
  "data": {
    "id": "prod_123",
    "retailer_id": "PIZZA_MARGHERITA",
    "name": "Pizza Margherita",
    "description": "Classic Italian pizza with tomato and mozzarella",
    "price": "25.00",
    "currency": "PEN",
    "availability": "in stock",
    "condition": "new",
    "image_url": "https://example.com/pizza.jpg",
    "url": "https://yourstore.com/products/pizza-margherita",
    "brand": "Your Restaurant",
    "category": "Pizza"
  }
}
```

---

### 3. Create Product

**Endpoint:** `POST /api/v1/whatsapp/catalogs/:catalogId/products`

Add a new product to the catalog.

**Request:**
```bash
curl -X POST \
  'https://your-api.com/api/v1/whatsapp/catalogs/1234567890/products' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "subDomain": "yoursubdomain",
    "retailer_id": "BURGER_CLASSIC",
    "name": "Classic Burger",
    "description": "Juicy beef burger with lettuce, tomato, and special sauce",
    "price": 18.50,
    "currency": "PEN",
    "availability": "in stock",
    "condition": "new",
    "image_url": "https://example.com/burger.jpg",
    "url": "https://yourstore.com/products/classic-burger",
    "brand": "Your Restaurant",
    "category": "Burgers"
  }'
```

**Required Fields:**
- `retailer_id`: Unique identifier for the product (use your internal product ID)
- `name`: Product name
- `price`: Product price (numeric)
- `currency`: Currency code (e.g., "PEN", "USD", "EUR")

**Optional Fields:**
- `description`: Product description
- `availability`: "in stock", "out of stock", "preorder", "available for order", "discontinued"
- `condition`: "new", "refurbished", "used"
- `image_url`: Main product image URL
- `url`: Product page URL
- `brand`: Brand name
- `category`: Product category
- `additional_image_urls`: Array of additional image URLs

**Response:**
```json
{
  "type": "1",
  "message": "Product created successfully",
  "data": {
    "id": "prod_456",
    "success": true
  }
}
```

---

### 4. Update Product

**Endpoint:** `PUT /api/v1/whatsapp/catalogs/:catalogId/products/:retailerId`

Update an existing product.

**Request:**
```bash
curl -X PUT \
  'https://your-api.com/api/v1/whatsapp/catalogs/1234567890/products/BURGER_CLASSIC' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "subDomain": "yoursubdomain",
    "price": 20.00,
    "availability": "in stock",
    "description": "Updated description with new ingredients"
  }'
```

**Response:**
```json
{
  "type": "1",
  "message": "Product updated successfully",
  "data": {
    "success": true
  }
}
```

---

### 5. Delete Product

**Endpoint:** `DELETE /api/v1/whatsapp/catalogs/:catalogId/products/:retailerId`

Remove a product from the catalog.

**Request:**
```bash
curl -X DELETE \
  'https://your-api.com/api/v1/whatsapp/catalogs/1234567890/products/BURGER_CLASSIC?subDomain=yoursubdomain' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Response:**
```json
{
  "type": "1",
  "message": "Product deleted successfully",
  "data": {
    "success": true
  }
}
```

---

### 6. Batch Product Operations

**Endpoint:** `POST /api/v1/whatsapp/catalogs/:catalogId/products/batch`

Perform multiple product operations (CREATE, UPDATE, DELETE) in a single request.

**Request:**
```bash
curl -X POST \
  'https://your-api.com/api/v1/whatsapp/catalogs/1234567890/products/batch' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "subDomain": "yoursubdomain",
    "operations": [
      {
        "method": "CREATE",
        "retailer_id": "PASTA_CARBONARA",
        "data": {
          "retailer_id": "PASTA_CARBONARA",
          "name": "Pasta Carbonara",
          "price": 22.00,
          "currency": "PEN",
          "availability": "in stock",
          "image_url": "https://example.com/carbonara.jpg"
        }
      },
      {
        "method": "UPDATE",
        "retailer_id": "PIZZA_MARGHERITA",
        "data": {
          "price": 26.00,
          "availability": "in stock"
        }
      },
      {
        "method": "DELETE",
        "retailer_id": "OLD_PRODUCT_ID"
      }
    ]
  }'
```

**Response:**
```json
{
  "type": "1",
  "message": "Batch operations completed successfully",
  "data": {
    "handle": "batch_handle_123456",
    "success": true
  }
}
```

---

## User Permissions

### 1. Get Catalog Users

**Endpoint:** `GET /api/v1/whatsapp/catalogs/:catalogId/users`

Get all users assigned to a catalog.

**Request:**
```bash
curl -X GET \
  'https://your-api.com/api/v1/whatsapp/catalogs/1234567890/users?subDomain=yoursubdomain' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Response:**
```json
{
  "type": "1",
  "message": "Catalog users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "user_123",
        "name": "John Doe",
        "email": "john@example.com",
        "tasks": ["MANAGE", "ADVERTISE"]
      }
    ]
  }
}
```

---

### 2. Assign User to Catalog

**Endpoint:** `POST /api/v1/whatsapp/catalogs/:catalogId/users`

Assign a user to a catalog with specific permissions.

**Request:**
```bash
curl -X POST \
  'https://your-api.com/api/v1/whatsapp/catalogs/1234567890/users' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "subDomain": "yoursubdomain",
    "userId": "user_456",
    "tasks": ["MANAGE", "ADVERTISE"]
  }'
```

**Available Tasks:**
- `MANAGE`: Full catalog management (create, update, delete products)
- `ADVERTISE`: Can use catalog for advertising
- `MANAGE_AR`: Manage augmented reality assets
- `AA_ANALYZE`: Analytics access

**Response:**
```json
{
  "type": "1",
  "message": "User assigned to catalog successfully",
  "data": {
    "success": true
  }
}
```

---

### 3. Remove User from Catalog

**Endpoint:** `DELETE /api/v1/whatsapp/catalogs/:catalogId/users/:userId`

Remove a user's access to a catalog.

**Request:**
```bash
curl -X DELETE \
  'https://your-api.com/api/v1/whatsapp/catalogs/1234567890/users/user_456?subDomain=yoursubdomain' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

**Response:**
```json
{
  "type": "1",
  "message": "User removed from catalog successfully",
  "data": {
    "success": true
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "type": "3",
  "message": "Error description",
  "data": {
    "error": "Detailed error information",
    "code": "ERROR_CODE"
  },
  "timestamp": "2025-01-14T10:30:00.000Z"
}
```

### Common Error Codes

| Status Code | Type | Description |
|-------------|------|-------------|
| 400 | Validation Error | Missing or invalid parameters |
| 401 | Authentication Error | Invalid or missing JWT token |
| 403 | Permission Error | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

### Common Error Scenarios

**1. Missing Business Manager ID:**
```json
{
  "type": "3",
  "message": "Business Manager ID not configured for yoursubdomain"
}
```

**2. Invalid Access Token:**
```json
{
  "type": "3",
  "message": "WhatsApp access token not configured for yoursubdomain"
}
```

**3. Product Not Found:**
```json
{
  "type": "3",
  "message": "Product with retailer_id INVALID_ID not found"
}
```

---

## Examples

### Example 1: Sync Menu Items to Catalog

```javascript
// Step 1: Create a catalog
const createCatalog = async () => {
  const response = await fetch('https://your-api.com/api/v1/whatsapp/catalogs', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subDomain: 'yoursubdomain',
      name: 'Restaurant Menu 2025',
      vertical: 'commerce'
    })
  });

  const result = await response.json();
  return result.data.id; // Return catalog ID
};

// Step 2: Sync menu items as products
const syncMenuItems = async (catalogId, menuItems) => {
  const operations = menuItems.map(item => ({
    method: 'CREATE',
    retailer_id: item.id,
    data: {
      retailer_id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      currency: 'PEN',
      availability: item.isAvailable ? 'in stock' : 'out of stock',
      image_url: item.imageUrl,
      category: item.category
    }
  }));

  const response = await fetch(
    `https://your-api.com/api/v1/whatsapp/catalogs/${catalogId}/products/batch`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subDomain: 'yoursubdomain',
        operations
      })
    }
  );

  return await response.json();
};

// Usage
const catalogId = await createCatalog();
await syncMenuItems(catalogId, yourMenuItems);
```

---

### Example 2: Send WhatsApp Product Message

After syncing products to a catalog, you can send product messages via WhatsApp:

```javascript
// Send a single product message
const sendProductMessage = async (catalogId, productRetailerId, phoneNumber) => {
  const response = await fetch('https://your-api.com/api/v1/whatsapp/send-product', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subDomain: 'yoursubdomain',
      to: phoneNumber,
      catalogId: catalogId,
      productRetailerId: productRetailerId,
      body: 'Check out this delicious item!',
      footer: 'Order now via WhatsApp'
    })
  });

  return await response.json();
};

// Send a product list message
const sendProductList = async (catalogId, sections, phoneNumber) => {
  const response = await fetch('https://your-api.com/api/v1/whatsapp/send-product-list', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subDomain: 'yoursubdomain',
      to: phoneNumber,
      catalogId: catalogId,
      sections: [
        {
          title: 'Main Dishes',
          productItems: [
            { productRetailerId: 'PIZZA_MARGHERITA' },
            { productRetailerId: 'PASTA_CARBONARA' }
          ]
        },
        {
          title: 'Desserts',
          productItems: [
            { productRetailerId: 'TIRAMISU' },
            { productRetailerId: 'PANNA_COTTA' }
          ]
        }
      ],
      header: {
        type: 'text',
        content: 'Our Menu'
      },
      body: 'Choose from our delicious options!',
      footer: 'Powered by LeMenu'
    })
  });

  return await response.json();
};
```

---

## Best Practices

1. **Use Meaningful Retailer IDs**: Use your internal product IDs as `retailer_id` for easy synchronization
2. **Batch Operations**: Use batch endpoints for bulk operations to improve performance
3. **Image Optimization**: Ensure product images are optimized (< 1MB, recommended 1024x1024px)
4. **Keep Catalogs Updated**: Regularly sync your menu items to keep catalog up-to-date
5. **Handle Errors Gracefully**: Implement retry logic for failed operations
6. **Monitor Token Expiration**: WhatsApp access tokens expire, monitor `whatsappTokenExpiresAt`

---

## Support

For issues or questions:
- Check the error message and status code
- Verify Business Manager configuration
- Ensure access token has required permissions
- Contact Meta support for API-specific issues

---

## Changelog

### v1.0.0 (2025-01-14)
- Initial release
- Full catalog CRUD operations
- Product management (CRUD + batch operations)
- User permission management
- Integrated with existing WhatsApp messaging endpoints
