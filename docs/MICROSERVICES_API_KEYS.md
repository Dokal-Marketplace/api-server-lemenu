# Microservices API Keys - Service-to-Service Authentication

Complete guide for implementing service-to-service authentication using service API keys.

---

## Table of Contents

1. [Overview](#overview)
2. [Service vs User API Keys](#service-vs-user-api-keys)
3. [Quick Start](#quick-start)
4. [Service Types](#service-types)
5. [Creating Service Keys](#creating-service-keys)
6. [Using Service Keys](#using-service-keys)
7. [Scopes and Permissions](#scopes-and-permissions)
8. [Security Best Practices](#security-best-practices)
9. [Environments](#environments)
10. [Examples](#examples)

---

## Overview

Service API keys enable secure service-to-service communication in your microservices architecture. Unlike user API keys, service keys:

- Don't require a user account
- Have system-wide or service-specific permissions
- Support environment-based isolation (dev/staging/prod)
- Include service-to-service authorization
- Track usage and request counts

### Key Features

✅ **Three service types:** Internal, External, Partner
✅ **Environment isolation:** Dev, Staging, Production
✅ **Service-specific scopes:** Fine-grained permissions
✅ **Endpoint restrictions:** Limit which APIs can be called
✅ **Service allowlists:** Control which services can communicate
✅ **Request tracking:** Monitor service-to-service calls
✅ **IP whitelisting:** CIDR notation support
✅ **High rate limits:** 10,000 requests/hour by default

---

## Service vs User API Keys

| Feature | User API Keys | Service API Keys |
|---------|---------------|------------------|
| **Prefix** | `carta_live_` | `carta_srv_/ext_/prt_` |
| **Owner** | User account | Service account (no user) |
| **Creation** | User creates via JWT | Admin/system creates |
| **Scope** | Business operations | Service-level operations |
| **Environment** | Not enforced | Strictly enforced (dev/staging/prod) |
| **Rate Limit** | 1,000/hour | 10,000/hour |
| **Use Case** | Third-party integrations | Microservice communication |
| **Header** | `X-API-Key` | `X-Service-API-Key` |

---

## Quick Start

### 1. Create a Service API Key (Admin)

```bash
curl -X POST http://localhost:3001/api/v1/service-api-keys \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Order Processor Service",
    "serviceName": "order-processor",
    "serviceType": "internal",
    "environment": "production",
    "scopes": ["service:orders", "service:products"],
    "expiresIn": 365
  }'
```

**Response:**
```json
{
  "type": "1",
  "message": "Service API key created successfully. Save this key securely - it will not be shown again.",
  "data": {
    "key": "carta_srv_abc123xyz456...",
    "serviceName": "order-processor",
    "serviceType": "internal",
    "environment": "production"
  }
}
```

⚠️ **Save the key immediately - it won't be shown again!**

### 2. Use the Service API Key

```bash
curl http://localhost:3001/api/v1/order/filled-orders/my-restaurant/LOC123 \
  -H "X-Service-API-Key: carta_srv_abc123xyz456..."
```

---

## Service Types

### 1. Internal Services (`carta_srv_`)

**Use for:** Your own microservices

```json
{
  "serviceType": "internal",
  "serviceName": "order-processor",
  "scopes": ["service:orders", "service:products", "internal:cache"]
}
```

**Examples:**
- Order processing service
- Analytics service
- Notification service
- Cache service
- Queue worker

---

### 2. External Services (`carta_ext_`)

**Use for:** Third-party services you don't control

```json
{
  "serviceType": "external",
  "serviceName": "payment-gateway",
  "scopes": ["service:payments"],
  "ipWhitelist": ["payment-provider-ip"]
}
```

**Examples:**
- Payment processors (Stripe, PayPal)
- Delivery platforms (UberEats, DoorDash)
- SMS providers (Twilio)
- Email services (SendGrid)

---

### 3. Partner Services (`carta_prt_`)

**Use for:** Trusted business partners

```json
{
  "serviceType": "partner",
  "serviceName": "franchise-analytics",
  "scopes": ["service:analytics", "admin:read"]
}
```

**Examples:**
- Franchise management systems
- POS system vendors
- Business intelligence partners
- Compliance/reporting services

---

## Creating Service Keys

### Basic Creation

```bash
curl -X POST http://localhost:3001/api/v1/service-api-keys \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Microservice",
    "serviceName": "my-service",
    "serviceType": "internal",
    "scopes": ["service:orders"],
    "environment": "development"
  }'
```

### Advanced Creation with Restrictions

```bash
curl -X POST http://localhost:3001/api/v1/service-api-keys \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Order Processor - Production",
    "serviceName": "order-processor",
    "serviceType": "internal",
    "environment": "production",
    "scopes": ["service:orders", "service:products", "service:notifications"],
    "allowedServices": ["product-service", "notification-service"],
    "allowedEndpoints": [
      "/api/v1/orders/*",
      "/api/v1/products/*",
      "/api/v1/notifications/send"
    ],
    "rateLimit": {
      "maxRequests": 50000,
      "windowMs": 3600000
    },
    "ipWhitelist": ["10.0.0.0/24", "172.16.0.5"],
    "expiresIn": 365,
    "metadata": {
      "version": "2.1.0",
      "owner": "platform-team",
      "contactEmail": "platform@example.com"
    }
  }'
```

---

## Using Service Keys

### Method 1: X-Service-API-Key Header (Recommended)

```bash
curl http://localhost:3001/api/v1/orders \
  -H "X-Service-API-Key: carta_srv_abc123..."
```

### Method 2: X-API-Key Header

```bash
curl http://localhost:3001/api/v1/orders \
  -H "X-API-Key: carta_srv_abc123..."
```

### In Node.js Microservice

```javascript
const axios = require('axios');

class CartaServiceClient {
  constructor(serviceApiKey) {
    this.apiKey = serviceApiKey;
    this.baseUrl = process.env.CARTA_API_URL;
  }

  async callService(endpoint, options = {}) {
    return axios({
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'X-Service-API-Key': this.apiKey,
        ...options.headers
      },
      ...options
    });
  }
}

// Usage
const client = new CartaServiceClient(process.env.SERVICE_API_KEY);
const orders = await client.callService('/api/v1/orders');
```

---

## Scopes and Permissions

### Available Service Scopes

| Scope | Description |
|-------|-------------|
| `*` | Full access (use only for admin services) |
| `service:orders` | Order service operations |
| `service:products` | Product service operations |
| `service:menu` | Menu service operations |
| `service:analytics` | Analytics service access |
| `service:payments` | Payment service access |
| `service:notifications` | Notification service access |
| `service:webhooks` | Webhook service access |
| `admin:read` | Admin read operations |
| `admin:write` | Admin write operations |
| `internal:cache` | Internal cache service |
| `internal:queue` | Internal queue service |
| `internal:events` | Internal event bus |

### Scope Examples

**Read-Only Analytics Service:**
```json
{
  "scopes": ["service:analytics", "service:orders", "admin:read"]
}
```

**Order Processing Service:**
```json
{
  "scopes": ["service:orders", "service:products", "service:notifications", "internal:queue"]
}
```

**Payment Gateway Integration:**
```json
{
  "scopes": ["service:payments"]
}
```

---

## Security Best Practices

### 1. Use Environment-Specific Keys

```bash
# Development
{
  "environment": "development",
  "ipWhitelist": [] // No restrictions for dev
}

# Production
{
  "environment": "production",
  "ipWhitelist": ["10.0.0.0/24"], // Strict IP restrictions
  "allowedEndpoints": ["/api/v1/orders/*"], // Only specific endpoints
  "expiresIn": 90 // Short expiration
}
```

### 2. Restrict Endpoints

```json
{
  "allowedEndpoints": [
    "/api/v1/orders/*",      // All order endpoints
    "/api/v1/products/*/status", // Only product status
    "/api/v1/webhooks/receive"   // Specific webhook
  ]
}
```

### 3. Limit Service Communication

```json
{
  "serviceName": "order-processor",
  "allowedServices": [
    "product-service",
    "inventory-service",
    "notification-service"
  ]
}
```

### 4. Use Minimal Scopes

```json
{
  "scopes": ["service:orders"] // Only what's needed
  // Not: ["*"] // Too broad!
}
```

### 5. Rotate Keys Regularly

```bash
# Create new key
curl -X POST /api/v1/service-api-keys ...

# Update service with new key
kubectl set env deployment/order-processor SERVICE_API_KEY=new_key

# Revoke old key after grace period
curl -X POST /api/v1/service-api-keys/OLD_KEY_ID/revoke
```

### 6. Monitor Usage

```bash
# Check service key stats
curl http://localhost:3001/api/v1/service-api-keys/KEY_ID \
  -H "Authorization: Bearer $ADMIN_JWT"

# Response includes:
{
  "requestCount": 45230,
  "lastUsedAt": "2025-12-03T10:30:00Z"
}
```

---

## Environments

Service keys are strictly environment-bound. A production key **cannot** be used in development.

### Environment Enforcement

```typescript
// Service key
{
  "environment": "production"
}

// In production (NODE_ENV=production)
✅ Key works

// In development (NODE_ENV=development)
❌ 401: Invalid or inactive service API key
```

### Multi-Environment Setup

```bash
# Development key
{
  "name": "Order Processor - Dev",
  "environment": "development",
  "expiresIn": 30
}

# Staging key
{
  "name": "Order Processor - Staging",
  "environment": "staging",
  "expiresIn": 90
}

# Production key
{
  "name": "Order Processor - Prod",
  "environment": "production",
  "expiresIn": 365,
  "ipWhitelist": ["prod-subnet"],
  "allowedEndpoints": ["specific-endpoints"]
}
```

---

## Examples

### Example 1: Order Processing Microservice

**Create Key:**
```bash
curl -X POST http://localhost:3001/api/v1/service-api-keys \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -d '{
    "name": "Order Processor",
    "serviceName": "order-processor",
    "serviceType": "internal",
    "environment": "production",
    "scopes": [
      "service:orders",
      "service:products",
      "service:notifications",
      "internal:queue"
    ],
    "rateLimit": {
      "maxRequests": 50000,
      "windowMs": 3600000
    }
  }'
```

**Use in Service:**
```javascript
// order-processor/src/services/cartaClient.js
const axios = require('axios');

class CartaClient {
  constructor() {
    this.apiKey = process.env.CARTA_SERVICE_API_KEY;
    this.baseUrl = process.env.CARTA_API_URL;
  }

  async getOrder(orderId) {
    const { data } = await axios.get(
      `${this.baseUrl}/api/v1/order/get-order/${orderId}`,
      {
        headers: { 'X-Service-API-Key': this.apiKey }
      }
    );
    return data;
  }

  async updateOrderStatus(orderId, status) {
    const { data } = await axios.patch(
      `${this.baseUrl}/api/v1/order/${orderId}/status`,
      { status },
      {
        headers: { 'X-Service-API-Key': this.apiKey }
      }
    );
    return data;
  }
}

module.exports = new CartaClient();
```

---

### Example 2: Analytics Service (Read-Only)

```bash
curl -X POST http://localhost:3001/api/v1/service-api-keys \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -d '{
    "name": "Analytics Service",
    "serviceName": "analytics-service",
    "serviceType": "internal",
    "environment": "production",
    "scopes": [
      "service:analytics",
      "service:orders",
      "service:products",
      "admin:read"
    ],
    "allowedEndpoints": [
      "/api/v1/dashboard/*",
      "/api/v1/order/filled-orders/*",
      "/api/v1/products/get-all/*"
    ]
  }'
```

---

### Example 3: External Payment Gateway

```bash
curl -X POST http://localhost:3001/api/v1/service-api-keys \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -d '{
    "name": "Stripe Webhook Handler",
    "serviceName": "stripe-webhook",
    "serviceType": "external",
    "environment": "production",
    "scopes": ["service:payments", "service:webhooks"],
    "allowedEndpoints": ["/api/v1/webhooks/stripe"],
    "ipWhitelist": [
      "3.18.12.63",
      "3.130.192.231",
      "13.235.14.237"
    ]
  }'
```

---

### Example 4: Partner Integration

```bash
curl -X POST http://localhost:3001/api/v1/service-api-keys \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -d '{
    "name": "Franchise Analytics Platform",
    "serviceName": "franchise-analytics",
    "serviceType": "partner",
    "environment": "production",
    "scopes": [
      "service:analytics",
      "admin:read"
    ],
    "allowedServices": ["analytics-service"],
    "metadata": {
      "partner": "FranchiseMetrics Inc",
      "contactEmail": "api@franchisemetrics.com",
      "contract": "FRM-2025-001"
    }
  }'
```

---

## API Reference

### Management Endpoints (Admin JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/service-api-keys/scopes` | Get available scopes |
| POST | `/service-api-keys` | Create service key |
| GET | `/service-api-keys` | List all service keys |
| GET | `/service-api-keys/:keyId` | Get key details |
| PATCH | `/service-api-keys/:keyId` | Update key |
| DELETE | `/service-api-keys/:keyId` | Delete key |
| POST | `/service-api-keys/:keyId/revoke` | Revoke key |

---

## Troubleshooting

### 401: Invalid or inactive service API key

**Causes:**
- Wrong environment (prod key in dev)
- Key is revoked or expired
- Invalid key format

**Solutions:**
- Verify environment matches
- Check key is active
- Verify key format (carta_srv_/ext_/prt_)

### 403: Endpoint not authorized

**Cause:** Endpoint restrictions in place

**Solution:**
- Check `allowedEndpoints` in key config
- Update key to allow the endpoint

### 403: Service not authorized

**Cause:** Service restrictions in place

**Solution:**
- Check `allowedServices` in key config
- Update key to allow the target service

---

## Migration from User API Keys

If you're currently using user API keys for microservices:

1. **Create service keys** for each microservice
2. **Update environment variables** in your services
3. **Test thoroughly** in development
4. **Deploy** to staging/production
5. **Revoke** old user API keys

---

*For general API key documentation, see [API_KEY_AUTHENTICATION.md](API_KEY_AUTHENTICATION.md)*
*For business-scoped keys, see [BUSINESS_SCOPED_API_KEYS.md](BUSINESS_SCOPED_API_KEYS.md)*

---

*Created: 2025-12-03*
*Status: ✅ Production Ready*
