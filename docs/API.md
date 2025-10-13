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
- [Logs Management](#logs-management)
- [Options Management](#options-management)
- [Combos Management](#combos-management)
- [Menu V2 Management](#menu-v2-management)
- [Integration Import Management](#integration-import-management)
- [Menu Parser Management](#menu-parser-management)
- [Menu Excel Management](#menu-excel-management)
- [History Management](#history-management)
- [Dashboard Metrics](#dashboard-metrics)
- [Token Monitoring](#token-monitoring)
- [WhatsApp Integration](#whatsapp-integration)
- [Real-time Events (Socket.IO)](#real-time-events-socketio)
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

#### Get Modifier Item
```http
GET /api/v1/modificador-items/{itemId}
Authorization: Bearer {token}
```

#### Get All Modifier Items
```http
GET /api/v1/modificador-items
Authorization: Bearer {token}
```

#### Get Modifier Items by Location
```http
GET /api/v1/modificador-items/location/{subDomain}/{localId}
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

### Configure Auto Status Change
```http
POST /api/v1/order/change-status/{subDomain}/{localId}
Content-Type: application/json

{
  "isActive": "boolean",
  "intervalTime": "number"
}
```

### Toggle Order Archived Status
```http
PATCH /api/v1/order/{orderId}/toggle-archived
Authorization: Bearer {token}
```

### Get Archived Orders
```http
GET /api/v1/order/archived/{subDomain}/{localId}
Authorization: Bearer {token}
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

### Search Staff
```http
GET /api/v1/staff/{subDomain}/{localId}/search
Authorization: Bearer {token}
```

### Get Staff Statistics
```http
GET /api/v1/staff/{subDomain}/{localId}/stats
Authorization: Bearer {token}
```

### Get Staff Performance
```http
GET /api/v1/staff/{subDomain}/{localId}/staff/{staffId}/performance
Authorization: Bearer {token}
```

### Update Staff Performance
```http
PUT /api/v1/staff/{subDomain}/{localId}/staff/{staffId}/performance
Authorization: Bearer {token}
Content-Type: application/json

{
  "performance": {
    "rating": "number",
    "notes": "string",
    "metrics": {}
  }
}
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

## Logs Management

### Download Logs
```http
GET /api/v1/logs/download
Authorization: Bearer {token}
```

**Response:**
```json
{
  "type": "1",
  "message": "Logs downloaded successfully",
  "data": {
    "downloadUrl": "https://api.example.com/logs/2024-01-01.log",
    "expiresAt": "2024-01-01T01:00:00.000Z"
  }
}
```

## Options Management

### Get All Options
```http
GET /api/v1/options/get-all
```

### Create Option
```http
GET /api/v1/options/create
```

### Update Option
```http
PATCH /api/v1/options
```

### Delete Option
```http
DELETE /api/v1/options
```

### Create Multiple Business Location Options
```http
POST /api/v1/options/create-multiple-business-location
```

## Combos Management

### Create Combo
```http
POST /api/v1/combos
```

### Get Combos
```http
GET /api/v1/combos
```

### Get Combo Categories
```http
GET /api/v1/combos/categories
```

### Get Combo Statistics
```http
GET /api/v1/combos/stats
```

### Get Combo by ID
```http
GET /api/v1/combos/{id}
```

### Update Combo
```http
PATCH /api/v1/combos/{id}
```

### Delete Combo
```http
DELETE /api/v1/combos/{id}
```

## Menu V2 Management

### Update Multiple Business Location Items
```http
POST /api/v1/menu2/update-multiple-business-location/{itemType}/{rId}
```

### Get Bot Structure
```http
GET /api/v1/menu2/bot-structure
```

### Get Integration V2
```http
GET /api/v1/menu2/v2/integration/{subDomain}
```

### Get Integration
```http
GET /api/v1/menu2/integration/{subDomain}/{businessLocationId}
```

### Batch Update V2 Products
```http
POST /api/v1/menu2/v2/update-multiple-business-location/productos
```

### Batch Update Modificadores
```http
POST /api/v1/menu2/update-multiple-business-location/modificadores
```

### Batch Update Options
```http
POST /api/v1/menu2/update-multiple-business-location/opciones
```

### Batch Update Products
```http
POST /api/v1/menu2/update-multiple-business-location/productos
```

### Batch Update Categories
```http
POST /api/v1/menu2/update-multiple-business-location/categorias
```

### Download Menu PDF
```http
POST /api/v1/menu2/download-menu-pdf
```

## Integration Import Management

### Add Integration
```http
POST /api/v1/integration-import
Authorization: Bearer {token}
Content-Type: application/json

{
  "integrationType": "string",
  "configuration": {},
  "subDomain": "string",
  "localId": "string"
}
```

## Menu Parser Management

### Upload Menu Parser
```http
GET /api/v1/menu-parser/upload
Authorization: Bearer {token}
```

## Menu Excel Management

### Upload Menu from Excel
```http
GET /api/v1/menu-excel/upload
Authorization: Bearer {token}
```

## History Management

### Get All Chats Grouped
```http
GET /api/v1/history/all-chats-grouped
```

### Get History
```http
GET /api/v1/history/get-history
```

### Get Last Messages
```http
GET /api/v1/history/last-messages
```

## Dashboard Metrics

### Get Dashboard Metrics
```http
GET /api/v1/dashboard/metrics
Authorization: Bearer {token}
```

**Response:**
```json
{
  "type": "1",
  "message": "Metrics retrieved successfully",
  "data": {
    "totalOrders": 150,
    "totalRevenue": 5000.00,
    "activeUsers": 25,
    "averageOrderValue": 33.33
  }
}
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

## WhatsApp Integration

### Health Check
```http
GET /api/v1/whatsapp-providers/health
```

**Response:**
```json
{
  "type": "1",
  "message": "WhatsApp service is healthy",
  "data": {
    "status": "active",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Bot Management

#### Create WhatsApp Bot
```http
POST /api/v1/whatsapp-providers/bots
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Restaurant Bot",
  "phoneNumber": "+1234567890",
  "subDomain": "restaurant1",
  "localId": "local1",
  "configuration": {
    "welcomeMessage": "Welcome to our restaurant!",
    "businessHours": "9:00-22:00"
  }
}
```

#### Get Bot by ID
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

**Response:**
```json
{
  "type": "1",
  "message": "Bot status retrieved",
  "data": {
    "botId": "bot123",
    "status": "connected",
    "phoneNumber": "+1234567890",
    "lastSeen": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get QR Code
```http
GET /api/v1/whatsapp-providers/bots/{botId}/qr
Authorization: Bearer {token}
```

### Messaging

#### Send Message
```http
POST /api/v1/whatsapp-providers/send-message
Authorization: Bearer {token}
Content-Type: application/json

{
  "botId": "bot123",
  "phoneNumber": "+1234567890",
  "message": {
    "type": "text",
    "content": "Hello! How can I help you today?"
  }
}
```

#### Send Text Message
```http
POST /api/v1/whatsapp-providers/send-text
Authorization: Bearer {token}
Content-Type: application/json

{
  "botId": "bot123",
  "phoneNumber": "+1234567890",
  "text": "Hello! How can I help you today?"
}
```

#### Send Welcome Message
```http
POST /api/v1/whatsapp-providers/send-welcome
Authorization: Bearer {token}
Content-Type: application/json

{
  "botId": "bot123",
  "phoneNumber": "+1234567890",
  "welcomeMessage": "Welcome to our restaurant! Here's our menu:"
}
```

### Webhook Handling

#### WhatsApp Webhook
```http
POST /api/v1/whatsapp-providers/webhook
Content-Type: application/json

{
  "event": "message",
  "session": "session123",
  "payload": {
    "from": "+1234567890",
    "message": "I'd like to order food",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Conversation Management

#### Get Conversation State
```http
GET /api/v1/whatsapp-providers/conversations/{sessionId}
Authorization: Bearer {token}
```

#### Get Active Conversations
```http
GET /api/v1/whatsapp-providers/bots/{botId}/conversations
Authorization: Bearer {token}
```

#### Update Conversation Intent
```http
PUT /api/v1/whatsapp-providers/conversations/{sessionId}/intent
Authorization: Bearer {token}
Content-Type: application/json

{
  "intent": "ordering",
  "context": {
    "currentStep": "selecting_items",
    "cart": []
  }
}
```

#### End Conversation
```http
DELETE /api/v1/whatsapp-providers/conversations/{sessionId}
Authorization: Bearer {token}
```

#### Get Conversation Statistics
```http
GET /api/v1/whatsapp-providers/bots/{botId}/statistics
Authorization: Bearer {token}
```

**Response:**
```json
{
  "type": "1",
  "message": "Statistics retrieved",
  "data": {
    "totalConversations": 150,
    "activeConversations": 5,
    "completedOrders": 45,
    "averageResponseTime": "2.5s"
  }
}
```

### Order Integration

#### Create Order from Conversation
```http
POST /api/v1/whatsapp-providers/conversations/{sessionId}/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "productId": "prod123",
      "quantity": 2,
      "modifiers": ["mod1", "mod2"]
    }
  ],
  "customerInfo": {
    "name": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St"
  }
}
```

#### Get Conversation Order
```http
GET /api/v1/whatsapp-providers/conversations/{sessionId}/order
Authorization: Bearer {token}
```

#### Get Bot Orders
```http
GET /api/v1/whatsapp-providers/bots/{botId}/orders
Authorization: Bearer {token}
```

### Bot Context Management

#### Get Bot Context
```http
GET /api/v1/bot-ctx/get-one
```

#### Update Bot Context
```http
PATCH /api/v1/bot-ctx/update-is-on
```

### User Context Management

#### Find User Context
```http
GET /api/v1/user-ctx/find-one
```

#### Update Chat On
```http
PATCH /api/v1/user-ctx/update-chat-on
```

#### Find All User Contexts
```http
GET /api/v1/user-ctx/find-all
```

## Real-time Events (Socket.IO)

### Send New Message
```http
POST /api/v1/socket.io
Content-Type: application/json

{
  "content": "string",
  "subDomain": "string",
  "localId": "string"
}
```

### Send Notification
```http
POST /api/v1/socket.io/notify
Content-Type: application/json

{
  "message": "string",
  "subDomain": "string",
  "localId": "string"
}
```

### Send Order Update
```http
POST /api/v1/socket.io/order-update
Content-Type: application/json

{
  "orderId": "string",
  "subDomain": "string",
  "localId": "string"
}
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
- Socket.IO integration for live order updates
- Bot provider URLs for WhatsApp integration
- Automatic order status changes with configurable timers

### Session Management
- 6-hour session duration with automatic expiration
- JWT bearer token authentication
- Mock mode available for development

This API serves a comprehensive restaurant management platform with features for menu management, order processing, delivery coordination, staff management, and business analytics.