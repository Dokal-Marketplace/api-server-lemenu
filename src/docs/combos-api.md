# Combos API Documentation

## Overview
The Combos API provides full CRUD operations with advanced filtering capabilities for managing combo items in the restaurant menu system.

## Endpoints

### 1. Create Combo
**POST** `/api/combos`

Creates a new combo item.

**Request Body:**
```json
{
  "name": "Family Combo",
  "description": "Perfect for the whole family",
  "price": 29.99,
  "category": "Family Meals",
  "isActive": true,
  "items": [
    {
      "productId": "prod123",
      "quantity": 2,
      "name": "Burger"
    },
    {
      "productId": "prod456",
      "quantity": 1,
      "name": "Fries"
    }
  ],
  "tags": ["family", "value", "popular"]
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* combo object */ },
  "message": "Combo created successfully"
}
```

### 2. Get All Combos (with filtering)
**GET** `/api/combos`

Retrieves combos with advanced filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `category` (optional): Filter by category (case-insensitive)
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `isActive` (optional): Filter by active status (true/false)
- `tags` (optional): Filter by tags (comma-separated)
- `search` (optional): Search in name, description, and tags
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort direction (asc/desc, default: desc)

**Example Requests:**
```
GET /api/combos?page=1&limit=5&category=Family&minPrice=20&maxPrice=50
GET /api/combos?search=burger&tags=popular,value&sortBy=price&sortOrder=asc
GET /api/combos?isActive=true&category=Breakfast
```

**Response:**
```json
{
  "success": true,
  "data": [ /* array of combo objects */ ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 50,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 3. Get Single Combo
**GET** `/api/combos/:id`

Retrieves a specific combo by ID.

**Response:**
```json
{
  "success": true,
  "data": { /* combo object */ }
}
```

### 4. Get Categories
**GET** `/api/combos/categories`

Retrieves all unique categories.

**Response:**
```json
{
  "success": true,
  "data": ["Family Meals", "Breakfast", "Lunch", "Dinner"]
}
```

### 5. Get Combo Statistics
**GET** `/api/combos/stats`

Retrieves statistical information about combos.

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "totalCombos": 100,
      "activeCombos": 85,
      "averagePrice": 18.50,
      "minPrice": 5.99,
      "maxPrice": 49.99
    },
    "byCategory": [
      {
        "_id": "Family Meals",
        "count": 25,
        "averagePrice": 28.50
      }
    ]
  }
}
```

### 6. Update Combo
**PATCH** `/api/combos/:id`

Updates an existing combo.

**Request Body:** (partial update)
```json
{
  "price": 24.99,
  "isActive": false
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated combo object */ },
  "message": "Combo updated successfully"
}
```

### 7. Delete Combo
**DELETE** `/api/combos/:id`

Deletes a combo by ID.

**Response:**
```json
{
  "success": true,
  "message": "Combo deleted successfully"
}
```

## Data Model

### Combo Schema
```typescript
interface ICombo {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  isActive: boolean;
  items: Array<{
    productId: string;
    quantity: number;
    name: string;
  }>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Filtering Examples

### Price Range Filtering
```
GET /api/combos?minPrice=10&maxPrice=30
```

### Category and Status Filtering
```
GET /api/combos?category=Breakfast&isActive=true
```

### Tag-based Filtering
```
GET /api/combos?tags=popular,value,new
```

### Text Search
```
GET /api/combos?search=burger
```

### Complex Filtering
```
GET /api/combos?category=Family&minPrice=20&tags=popular&search=combo&sortBy=price&sortOrder=asc&page=1&limit=10
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error

Error responses include:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Performance Features

- **Indexing**: Database indexes on frequently queried fields (name, category, isActive, price, tags)
- **Pagination**: Efficient pagination with skip/limit
- **Lean Queries**: Optimized queries using `.lean()` for better performance
- **Aggregation**: MongoDB aggregation pipeline for statistics
