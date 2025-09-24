# CartaAI Restaurant Management API Documentation

## Table of Contents
- [Base Architecture](#base-architecture)
- [Authentication](#authentication)  
- [Business Management](#business-management)
- [Menu Management](#menu-management)
- [Order Management](#order-management)
- [Delivery Management](#delivery-management)
- [Staff Management](#staff-management)
- [Coverage Zones](#coverage-zones)
- [Notifications](#notifications)
- [Token Monitoring](#token-monitoring)
- [Error Handling](#error-handling)

## Base Architecture

### API Base URLs
- **Production**: `https://ssgg.api.cartaai.pe`
- **Development**: `https://dev.ssgg.api.cartaai.pe`  
- **Local**: `http://localhost:3000`

### Dynamic Bot Provider URLs
Pattern: `https://{subdomain}-provider-{environment}.up.railway.app`

### Standard Response Format
All API responses follow this structure:
```json
{
  "type": "string",    // Response type code
  "message": "string", // Human readable message
  "data": object       // Response payload
}
```

### Response Type Codes
- `"1"` - Success
- `"2"` - Warning  
- `"3"` - Error
- `"4"` - Info
- `"200"` - HTTP OK
- `"401"` - Permission Error
- `"403"` - Access Denied
- `"601"` - Code Not Defined
- `"701"` - Malformed JSON

## Authentication

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "type": "1",
  "message": "Login successful",
  "data": {
    "accessToken": "jwt_token_here"
  }
}
```

### Get User Profile
```http
GET /api/v1/user
Authorization: Bearer {token}
```

### Get User Businesses
```http
GET /api/v1/user-business/get-by-user-id/{userId}
Authorization: Bearer {token}
```

## Business Management

### Get Business Information
```http
GET /api/v1/business?subDomain={subDomain}&localId={localId}
```

### Create New Business
```http
POST /api/v1/business
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "address": "string",
  "settings": {}
}
```

### Update Business Settings
```http
PATCH /api/v1/business/update/{subDomain}/{localId}
Authorization: Bearer {token}
Content-Type: application/json
```

### Create Complete Business Setup
```http
POST /api/v1/business/v2/create-complete
Authorization: Bearer {token}
```

### Add New Local/Branch
```http
POST /api/v1/business/new-local
Authorization: Bearer {token}
```

### Get All Locals for Subdomain
```http
GET /api/v1/business/locals/{subDomain}
Authorization: Bearer {token}
```

### Update Business Status
```http
PATCH /api/v1/business/{subDomain}/{localId}/status
Content-Type: application/json

{
  "status": "open|closed"
}
```

### Get All Businesses (Admin)
```http
GET /api/v1/business/admin/businesses
Authorization: Bearer {token}
```

## Menu Management

### Categories

#### Get All Categories
```http
GET /api/v1/categories/get-all?subDomain={subDomain}&localId={localId}&includeInactive=true
Authorization: Bearer {token}
```

#### Get Category (by rId or id)
```http
GET /api/v1/categories?rId={rId}
Authorization: Bearer {token}
```

#### Create Category
```http
POST /api/v1/categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "imageUrl": "string",
  "position": 0,
  "subDomain": "string",
  "localId": "string"
}
```

#### Update Category
```http
PATCH /api/v1/categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "rId": "string",
  "name": "string",
  "description": "string",
  "imageUrl": "string",
  "position": 1,
  "isActive": true
}
```

#### Delete Category (soft delete)
```http
DELETE /api/v1/categories?rId={rId}
Authorization: Bearer {token}
```

### Products

#### Get All Products
```http
GET /api/v1/productos/get-all/{subDomain}/{localId}
```

#### Create Product
```http
POST /api/v1/productos/{subDomain}/{localId}
Content-Type: application/json

{
  "name": "string",
  "price": "number",
  "categoryId": "string",
  "description": "string"
}
```

#### Create Product with Presentation
```http
POST /api/v1/productos/with-presentation/{subDomain}/{localId}
Content-Type: application/json
```

#### Update Product
```http
PATCH /api/v1/productos/{productId}
Content-Type: application/json
```

#### Delete Product
```http
DELETE /api/v1/productos/{productId}
```

#### Convert Product to Modifier
```http
POST /api/v1/productos/convert-to-modifier
Content-Type: application/json
```

### Modifiers

#### Get All Modifiers
```http
GET /api/v1/modificadores/get-all/{subDomain}/{localId}
```

#### Create Modifier
```http
POST /api/v1/modificadores/create/{subDomain}/{localId}
Content-Type: application/json
```

#### Update Modifier
```http
PATCH /api/v1/modificadores/{modifierId}
Content-Type: application/json
```

#### Delete Modifier
```http
DELETE /api/v1/modificadores/{modifierId}
```

### Modifier Items

#### Create Modifier Item
```http
POST /api/v1/modificador-items
Content-Type: application/json
```

#### Update Modifier Item
```http
PATCH /api/v1/modificador-items/{itemId}
Content-Type: application/json
```

#### Delete Modifier Item
```http
DELETE /api/v1/modificador-items/{itemId}
```

### Presentations

#### Get All Presentations
```http
GET /api/v1/presentaciones/get-all/{subDomain}/{localId}
```

#### Create Presentation
```http
POST /api/v1/presentaciones
Content-Type: application/json
```

#### Update Presentation
```http
PATCH /api/v1/presentaciones/{presentationId}
Content-Type: application/json
```

#### Delete Presentation
```http
DELETE /api/v1/presentaciones/{presentationId}
```

### Menu Integration

#### Get Product Details in Menu
```http
POST /api/v1/menu/getProductInMenu/{localId}/{subDomain}
Content-Type: application/json

["productId1", "productId2"]
```

#### Get Menu Integration Data
```http
GET /api/v1/menu2/v2/integration/{subDomain}
Authorization: Bearer {token}
```

#### Get Menu Integration for Local
```http
GET /api/v1/menu2/integration/{subDomain}/{localId}
```

#### Update Multiple Local Items
```http
POST /api/v1/menu2/update-multiple-local/{itemType}/{rId}
Content-Type: application/json
```

## Order Management

### Get Orders for Restaurant
```http
GET /api/v1/order/filled-orders/{subDomain}/{localId}
```

**Response includes:**
- Complete order details
- Client information
- Product list with modifiers
- Delivery information
- Timer configuration

### Get Orders for Admin (Paginated)
```http
GET /api/v1/order/filled-orders/admin?page={page}&limit={limit}&startDate={date}&endDate={date}
```

**Response includes:**
- Paginated order list
- Pagination metadata
- Timer configuration

### Get Specific Order
```http
GET /api/v1/order/get-order/{orderId}
```

### Update Order Status
```http
PATCH /api/v1/order/{orderId}/status
Content-Type: application/json

{
  "status": "string",
  "statusReason": "string"
}
```

### Configure Auto Status Change
```http
POST /api/v1/order/change-status/{subDomain}/{localId}
Content-Type: application/json

{
  "isActive": "boolean",
  "intervalTime": "number"
}
```

## Delivery Management

### Companies

#### Get All Companies
```http
GET /api/v1/delivery/companies
```

#### Get Companies for Restaurant
```http
GET /api/v1/delivery/companies/restaurant/{subDomain}/{localId}
```

#### Create Company
```http
POST /api/v1/delivery/companies
Content-Type: application/json

{
  "name": "string",
  "contact": "string",
  "subDomain": "string",
  "localId": "string"
}
```

#### Update Company
```http
PATCH /api/v1/delivery/companies/{companyId}
Content-Type: application/json
```

#### Delete Company
```http
DELETE /api/v1/delivery/companies/{companyId}
```

#### Link Company to Restaurant
```http
POST /api/v1/delivery/companies/link
Content-Type: application/json

{
  "companyId": "string",
  "subDomain": "string",
  "localId": "string"
}
```

#### Unlink Company from Restaurant
```http
DELETE /api/v1/delivery/companies/unlink
Content-Type: application/json

{
  "companyId": "string",
  "subDomain": "string",
  "localId": "string"
}
```

### Drivers

#### Get All Drivers
```http
GET /api/v1/delivery/drivers
```

#### Get Drivers for Restaurant
```http
GET /api/v1/delivery/drivers/restaurant/{subDomain}/{localId}
```

#### Get Drivers by Company
```http
GET /api/v1/delivery/drivers/company/{companyId}
```

#### Create Driver
```http
POST /api/v1/delivery/drivers
Content-Type: application/json

{
  "name": "string",
  "phone": "string",
  "vehicle": "string",
  "subDomain": "string",
  "localIds": ["string"]
}
```

#### Update Driver
```http
PATCH /api/v1/delivery/drivers/{driverId}
Content-Type: application/json
```

#### Delete Driver
```http
DELETE /api/v1/delivery/drivers/{driverId}
```

#### Link Driver to Restaurant
```http
POST /api/v1/delivery/drivers/link
Content-Type: application/json

{
  "driverId": "string",
  "subDomain": "string",
  "localIds": ["string"]
}
```

#### Unlink Driver from Restaurant
```http
DELETE /api/v1/delivery/drivers/unlink
Content-Type: application/json

{
  "driverId": "string",
  "subDomain": "string",
  "localIds": ["string"]
}
```

#### Assign Driver to Local
```http
POST /api/v1/delivery/drivers/{driverId}/local/{localId}
Content-Type: application/json

{
  "subDomain": "string"
}
```

## Staff Management

### Get Available Roles
```http
GET /api/v1/roles
Authorization: Bearer {token}
```

### User-Business Relationships

#### Create User-Business Relationship
```http
POST /api/v1/user-business/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "userId": "string",
  "subDomain": "string"
}
```

## Coverage Zones

### Create Complex Coverage Zone
```http
POST /api/v1/coverage-zone
Content-Type: application/json

{
  "type": "complex",
  "coordinates": [],
  "deliveryFee": "number"
}
```

### Create Simple Coverage Zone
```http
POST /api/v1/coverage-zone/simple
Content-Type: application/json

{
  "type": "simple",
  "radius": "number",
  "center": {},
  "deliveryFee": "number"
}
```

## Notifications

### Get Unread Notifications
```http
GET /api/v1/notifications/unread/{subDomain}/{localId}
Authorization: Bearer {token}
```

### Mark Notification as Read
```http
PATCH /api/v1/notifications/{notificationId}/read
Authorization: Bearer {token}
```

## Token Monitoring

### Get Token Usage Analytics
```http
GET /api/v1/tokens-usage
Authorization: Bearer {token}
```

**Response includes:**
- Usage data by subdomain
- Usage data by localId
- Token consumption metrics

## External Integration

### Third-party Restaurant API
```http
GET https://{subDomain}.restaurant.pe/restaurant/facebook/rest/delivery/cargarCartaMenuEnLinea/{localId}/0
```

## Error Handling

### Standard Error Response
```json
{
  "type": "3",
  "message": "Error description",
  "data": null
}
```

### Common Error Types
- **401**: Permission errors - Invalid or expired token
- **403**: Access denied - Insufficient permissions
- **701**: Malformed JSON - Invalid request format

## Key Architecture Patterns

### Multi-tenant Architecture
- Uses `subDomain` and `localId` for tenant isolation
- Each restaurant can have multiple locations (locals)
- Admin users can access cross-tenant data

### Authentication Flow
1. POST to `/api/v1/auth/login` with credentials
2. Receive `accessToken` in response
3. GET `/api/v1/user` to fetch user profile
4. GET `/api/v1/user-business/get-by-user-id/{userId}` to get associated businesses
5. User selects business (sets `subDomain` and `localId` in state)
6. All subsequent API calls include tenant parameters

### Real-time Features
- Socket.IO integration for live order updates
- Bot provider URLs for WhatsApp integration
- Automatic order status changes with configurable timers

### Session Management
- 6-hour session duration with automatic expiration
- JWT bearer token authentication
- Mock mode available for development

This API serves a comprehensive restaurant management platform with features for menu management, order processing, delivery coordination, staff management, and business analytics.