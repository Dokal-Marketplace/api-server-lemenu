# CartaAI Restaurant Management API Documentation

## Table of Contents
- [Base Architecture](#base-architecture)
- [Authentication](#authentication)  
- [Business Management](#business-management)
- [Menu Management](#menu-management)
- [Order Management](#order-management)
- [Delivery Management](#delivery-management)
- [Staff Management](#staff-management)
- [WhatsApp Integration](#whatsapp-integration)
- [Notifications](#notifications)
- [Additional Features](#additional-features)
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
GET /api/v1/categories/get-all/{subDomain}/{localId}
```

#### Create Category
```http
POST /api/v1/categories
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "position": "number"
}
```

#### Update Category
```http
PATCH /api/v1/categories/{categoryId}
Content-Type: application/json
```

#### Delete Category
```http
DELETE /api/v1/categories/{categoryId}
```

### Products

#### Get All Products
```http
GET /api/v1/products/get-all/{subDomain}/{localId}
```

#### Create Product
```http
POST /api/v1/products/{subDomain}/{localId}
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
POST /api/v1/products/with-presentation/{subDomain}/{localId}
Content-Type: application/json
```

#### Update Product
```http
PATCH /api/v1/products/{productId}
Content-Type: application/json
```

#### Delete Product
```http
DELETE /api/v1/products/{productId}
```

#### Convert Product to Modifier
```http
POST /api/v1/products/convert-to-modifier
Content-Type: application/json
```

### Modifiers

#### Get All Modifiers
```http
GET /api/v1/modificadores/get-all
Authorization: Bearer {token}
```

#### Create Modifier
```http
POST /api/v1/modificadores/create
Authorization: Bearer {token}
Content-Type: application/json
```

#### Update Modifier
```http
PATCH /api/v1/modificadores
Authorization: Bearer {token}
Content-Type: application/json
```

#### Delete Modifier
```http
DELETE /api/v1/modificadores
Authorization: Bearer {token}
```

### Modifier Items

#### Create Modifier Item
```http
POST /api/v1/modificador-items
Authorization: Bearer {token}
Content-Type: application/json
```

#### Update Modifier Item
```http
PATCH /api/v1/modificador-items
Authorization: Bearer {token}
Content-Type: application/json
```

#### Delete Modifier Item
```http
DELETE /api/v1/modificador-items
Authorization: Bearer {token}
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

### Toggle Order Archived Status
```http
PATCH /api/v1/order/{orderId}/toggle-archived
```

### Get Archived Orders
```http
GET /api/v1/order/archived/{subDomain}/{localId}
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

#### Get Companies for Restaurant
```http
GET /api/v1/delivery/companies/{subDomain}/{localId}
```

#### Get Company by ID
```http
GET /api/v1/delivery/companies/{companyId}/{subDomain}/{localId}
```

#### Get Company with Drivers
```http
GET /api/v1/delivery/companies/{companyId}/with-drivers/{subDomain}/{localId}
```

#### Get Drivers by Company
```http
GET /api/v1/delivery/companies/{companyId}/drivers/{subDomain}/{localId}
```

#### Create Company
```http
POST /api/v1/delivery/companies/{subDomain}/{localId}
Content-Type: application/json

{
  "name": "string",
  "contact": "string"
}
```

#### Update Company
```http
PATCH /api/v1/delivery/companies/{companyId}/{subDomain}/{localId}
Content-Type: application/json
```

#### Delete Company
```http
DELETE /api/v1/delivery/companies/{companyId}/{subDomain}/{localId}
```

### Drivers

#### Get Available Drivers
```http
GET /api/v1/delivery/drivers/available/{subDomain}/{localId}
```

#### Get Drivers for Restaurant
```http
GET /api/v1/delivery/drivers/{subDomain}/{localId}
```

#### Get Driver by ID
```http
GET /api/v1/delivery/drivers/{driverId}/{subDomain}/{localId}
```

#### Create Driver
```http
POST /api/v1/delivery/drivers/{subDomain}/{localId}
Content-Type: application/json

{
  "name": "string",
  "phone": "string",
  "vehicle": "string"
}
```

#### Update Driver
```http
PATCH /api/v1/delivery/drivers/{driverId}/{subDomain}/{localId}
Content-Type: application/json
```

#### Update Driver Location
```http
PATCH /api/v1/delivery/drivers/{driverId}/location/{subDomain}/{localId}
Content-Type: application/json
```

#### Update Driver Status
```http
PATCH /api/v1/delivery/drivers/{driverId}/status/{subDomain}/{localId}
Content-Type: application/json
```

#### Delete Driver
```http
DELETE /api/v1/delivery/drivers/{driverId}/{subDomain}/{localId}
```

### Delivery Zones

#### Get Delivery Zones
```http
GET /api/v1/delivery/zones/{subDomain}/{localId}
```

#### Get Delivery Zone by ID
```http
GET /api/v1/delivery/zones/{zoneId}/{subDomain}/{localId}
```

#### Create Delivery Zone
```http
POST /api/v1/delivery/zones/{subDomain}/{localId}
Content-Type: application/json
```

#### Update Delivery Zone
```http
PATCH /api/v1/delivery/zones/{zoneId}/{subDomain}/{localId}
Content-Type: application/json
```

#### Delete Delivery Zone
```http
DELETE /api/v1/delivery/zones/{zoneId}/{subDomain}/{localId}
```

## Staff Management

### Roles

#### Get Available Roles
```http
GET /api/v1/staff/roles/{subDomain}/{localId}
Authorization: Bearer {token}
```

#### Create Role
```http
POST /api/v1/staff/roles/{subDomain}/{localId}
Authorization: Bearer {token}
Content-Type: application/json
```

### Staff Members

#### Get Staff by Local
```http
GET /api/v1/staff/{subDomain}/{localId}
Authorization: Bearer {token}
```

#### Create Staff Member
```http
POST /api/v1/staff/{subDomain}/{localId}
Authorization: Bearer {token}
Content-Type: application/json
```

#### Get Staff by ID
```http
GET /api/v1/staff/{subDomain}/{localId}/staff/{staffId}
Authorization: Bearer {token}
```

#### Update Staff Member
```http
PUT /api/v1/staff/{subDomain}/{localId}/staff/{staffId}
Authorization: Bearer {token}
Content-Type: application/json
```

#### Delete Staff Member
```http
DELETE /api/v1/staff/{subDomain}/{localId}/staff/{staffId}
Authorization: Bearer {token}
```

#### Search Staff
```http
GET /api/v1/staff/{subDomain}/{localId}/search
Authorization: Bearer {token}
```

#### Get Staff Statistics
```http
GET /api/v1/staff/{subDomain}/{localId}/stats
Authorization: Bearer {token}
```

#### Get Staff Performance
```http
GET /api/v1/staff/{subDomain}/{localId}/staff/{staffId}/performance
Authorization: Bearer {token}
```

#### Update Staff Performance
```http
PUT /api/v1/staff/{subDomain}/{localId}/staff/{staffId}/performance
Authorization: Bearer {token}
Content-Type: application/json
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

## WhatsApp Integration

### Health Check
```http
GET /api/v1/whatsapp-providers/health
```

### Bot Management

#### Create WhatsApp Bot
```http
POST /api/v1/whatsapp-providers/bots
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "string",
  "phoneNumber": "string",
  "subDomain": "string",
  "localId": "string",
  "configuration": {}
}
```

#### Get WhatsApp Bot
```http
GET /api/v1/whatsapp-providers/bots/{botId}
Authorization: Bearer {token}
```

#### Get Bot by Subdomain
```http
GET /api/v1/whatsapp-providers/bots/subdomain/{subDomain}
Authorization: Bearer {token}
```

#### Start Bot
```http
POST /api/v1/whatsapp-providers/bots/{botId}/start
Authorization: Bearer {token}
```

#### Stop Bot
```http
POST /api/v1/whatsapp-providers/bots/{botId}/stop
Authorization: Bearer {token}
```

#### Get Bot Status
```http
GET /api/v1/whatsapp-providers/bots/{botId}/status
Authorization: Bearer {token}
```

#### Get QR Code
```http
GET /api/v1/whatsapp-providers/bots/{botId}/qr?format=raw|image
Authorization: Bearer {token}
```

### Messaging

#### Send Message
```http
POST /api/v1/whatsapp-providers/send-message
Authorization: Bearer {token}
Content-Type: application/json

{
  "botId": "string",
  "to": "string",
  "message": {}
}
```

#### Send Text Message
```http
POST /api/v1/whatsapp-providers/send-text
Authorization: Bearer {token}
Content-Type: application/json

{
  "botId": "string",
  "to": "string",
  "text": "string"
}
```

#### Send Welcome Message
```http
POST /api/v1/whatsapp-providers/send-welcome
Authorization: Bearer {token}
Content-Type: application/json

{
  "botId": "string",
  "to": "string"
}
```

### Webhook
```http
POST /api/v1/whatsapp-providers/webhook
Content-Type: application/json
```

### Conversation Management

#### Get Conversation State
```http
GET /api/v1/whatsapp-providers/conversations/{sessionId}
Authorization: Bearer {token}
```

#### Get Active Conversations
```http
GET /api/v1/whatsapp-providers/bots/{botId}/conversations?limit=100
Authorization: Bearer {token}
```

#### Update Conversation Intent
```http
PUT /api/v1/whatsapp-providers/conversations/{sessionId}/intent
Authorization: Bearer {token}
Content-Type: application/json

{
  "intent": "menu|order|support|info|payment|delivery|idle",
  "step": "string"
}
```

#### End Conversation
```http
DELETE /api/v1/whatsapp-providers/conversations/{sessionId}
Authorization: Bearer {token}
```

#### Get Conversation Statistics
```http
GET /api/v1/whatsapp-providers/bots/{botId}/statistics?days=7
Authorization: Bearer {token}
```

### Order Management

#### Create Order from Conversation
```http
POST /api/v1/whatsapp-providers/conversations/{sessionId}/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [],
  "customer": {},
  "deliveryInfo": {},
  "notes": "string",
  "paymentMethod": "cash|card|yape|plin|mercado_pago|bank_transfer"
}
```

#### Get Conversation Order
```http
GET /api/v1/whatsapp-providers/conversations/{sessionId}/order
Authorization: Bearer {token}
```

#### Get Bot Orders
```http
GET /api/v1/whatsapp-providers/bots/{botId}/orders?limit=50&status=pending&offset=0
Authorization: Bearer {token}
```

## Notifications

### Get Unread Notifications
```http
GET /api/v1/notifications/unread
```

### Get All Notifications
```http
GET /api/v1/notifications
Authorization: Bearer {token}
```

## Additional Features

### Menu Excel Import
```http
POST /api/v1/menu-excel/import
Content-Type: multipart/form-data
```

### Menu Parser
```http
POST /api/v1/menu-parser/parse
Content-Type: application/json
```

### Integration Import
```http
POST /api/v1/integration-import/import
Content-Type: application/json
```

### Bot Context Management
```http
GET /api/v1/bot-ctx/context
POST /api/v1/bot-ctx/context
PATCH /api/v1/bot-ctx/context
DELETE /api/v1/bot-ctx/context
```

### User Context Management
```http
GET /api/v1/user-ctx/context
POST /api/v1/user-ctx/context
PATCH /api/v1/user-ctx/context
DELETE /api/v1/user-ctx/context
```

### Combo Management
```http
GET /api/v1/combos
POST /api/v1/combos
PATCH /api/v1/combos/{comboId}
DELETE /api/v1/combos/{comboId}
```

### History Management
```http
GET /api/v1/history
POST /api/v1/history
```


### Health Check
```http
GET /api/v1/health
```

### Logs
```http
GET /api/v1/logs
POST /api/v1/logs
```

### Metrics/Dashboard
```http
GET /api/v1/dashboard/metrics
```

### Options
```http
GET /api/v1/options
POST /api/v1/options
PATCH /api/v1/options/{optionId}
DELETE /api/v1/options/{optionId}
```

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
- WhatsApp bot integration for customer communication
- Automatic order status changes with configurable timers
- Real-time conversation management

### Session Management
- JWT bearer token authentication
- Token-based authentication for WhatsApp services
- Multi-tenant architecture with subdomain and localId isolation

### Additional Features
- Menu Excel import functionality
- Menu parsing capabilities
- Integration import tools
- Bot and user context management
- Combo management system
- Historical data tracking
- Comprehensive logging and metrics

This API serves a comprehensive restaurant management platform with features for menu management, order processing, delivery coordination, staff management, WhatsApp integration, and business analytics.