## API Key Authentication

Comprehensive guide for implementing and using API key authentication for third-party integrations.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Creating API Keys](#creating-api-keys)
4. [Using API Keys](#using-api-keys)
5. [Managing API Keys](#managing-api-keys)
6. [Security Best Practices](#security-best-practices)
7. [API Reference](#api-reference)
8. [Scopes and Permissions](#scopes-and-permissions)
9. [Rate Limiting](#rate-limiting)
10. [Examples](#examples)

---

## Overview

API keys provide a secure way for external applications to authenticate and access your CartaAI API without requiring user login credentials. Each API key:

- Is unique and belongs to a specific user
- Has defined scopes (permissions)
- Can be restricted to specific IP addresses
- Includes rate limiting
- Can expire after a set period
- Can be revoked at any time

### Key Features

✅ Secure authentication for integrations
✅ Granular permission control with scopes
✅ Rate limiting per key
✅ IP whitelisting
✅ Automatic expiration
✅ Activity tracking (last used timestamp)
✅ Easy revocation

---

## Quick Start

### 1. Create an API Key

```bash
curl -X POST http://localhost:3001/api/v1/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Integration",
    "scopes": ["read:products", "read:orders"],
    "expiresIn": 365
  }'
```

**Response:**
```json
{
  "type": "1",
  "message": "API key created successfully. Save this key securely - it will not be shown again.",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "My Integration",
    "key": "carta_live_abc123xyz456...",
    "keyPrefix": "carta_live_abc123xy",
    "scopes": ["read:products", "read:orders"],
    "expiresAt": "2026-12-03T00:00:00.000Z",
    "createdAt": "2025-12-03T00:00:00.000Z"
  }
}
```

⚠️ **IMPORTANT:** Save the `key` value immediately - it will only be shown once!

### 2. Use the API Key

**Method 1: X-API-Key Header (Recommended)**
```bash
curl http://localhost:3001/api/v1/products/get-all/my-restaurant/LOC123 \
  -H "X-API-Key: carta_live_abc123xyz456..."
```

**Method 2: Authorization Bearer**
```bash
curl http://localhost:3001/api/v1/products/get-all/my-restaurant/LOC123 \
  -H "Authorization: Bearer carta_live_abc123xyz456..."
```

---

## Creating API Keys

### Endpoint
```
POST /api/v1/api-keys
```

### Authentication
Requires JWT token (user must be logged in)

### Request Body

```typescript
{
  name: string;              // Required: Human-readable name
  scopes: string[];          // Required: Array of permission scopes
  businessId?: string;       // Optional: Associated business ID
  subDomain?: string;        // Optional: Business subdomain
  expiresIn?: number;        // Optional: Days until expiration
  rateLimit?: {              // Optional: Custom rate limits
    maxRequests: number;
    windowMs: number;
  };
  ipWhitelist?: string[];    // Optional: Allowed IP addresses
  metadata?: object;         // Optional: Custom metadata
}
```

### Example

```javascript
const response = await fetch('http://localhost:3001/api/v1/api-keys', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Production Integration',
    scopes: ['*'],  // Full access
    businessId: 'BIZ123',
    subDomain: 'my-restaurant',
    expiresIn: 365,
    rateLimit: {
      maxRequests: 1000,
      windowMs: 3600000  // 1 hour
    },
    ipWhitelist: ['192.168.1.100', '10.0.0.1'],
    metadata: {
      environment: 'production',
      application: 'pos-system'
    }
  })
});

const data = await response.json();
console.log('API Key:', data.data.key);
```

---

## Using API Keys

### Authentication Methods

#### 1. X-API-Key Header (Recommended)

```bash
curl http://localhost:3001/api/v1/products \
  -H "X-API-Key: carta_live_abc123xyz456..."
```

#### 2. Authorization Bearer

```bash
curl http://localhost:3001/api/v1/products \
  -H "Authorization: Bearer carta_live_abc123xyz456..."
```

### Example with Different Languages

#### JavaScript/Node.js
```javascript
const axios = require('axios');

const apiKey = 'carta_live_abc123xyz456...';

const response = await axios.get(
  'http://localhost:3001/api/v1/products/get-all/my-restaurant/LOC123',
  {
    headers: {
      'X-API-Key': apiKey
    }
  }
);
```

#### Python
```python
import requests

api_key = 'carta_live_abc123xyz456...'

response = requests.get(
    'http://localhost:3001/api/v1/products/get-all/my-restaurant/LOC123',
    headers={'X-API-Key': api_key}
)
```

#### PHP
```php
<?php
$api_key = 'carta_live_abc123xyz456...';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL,
    'http://localhost:3001/api/v1/products/get-all/my-restaurant/LOC123');
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'X-API-Key: ' . $api_key
));
$response = curl_exec($ch);
curl_close($ch);
?>
```

---

## Managing API Keys

### List All API Keys

```bash
GET /api/v1/api-keys
```

**Query Parameters:**
- `businessId` - Filter by business ID
- `isActive` - Filter by active status (true/false)

**Example:**
```bash
curl "http://localhost:3001/api/v1/api-keys?isActive=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get API Key Details

```bash
GET /api/v1/api-keys/:keyId
```

**Example:**
```bash
curl http://localhost:3001/api/v1/api-keys/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update API Key

```bash
PATCH /api/v1/api-keys/:keyId
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "scopes": ["read:products", "write:products"],
  "isActive": true,
  "rateLimit": {
    "maxRequests": 2000,
    "windowMs": 3600000
  }
}
```

### Revoke API Key

```bash
POST /api/v1/api-keys/:keyId/revoke
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/v1/api-keys/507f1f77bcf86cd799439011/revoke \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Delete API Key (Permanent)

```bash
DELETE /api/v1/api-keys/:keyId
```

---

## Scopes and Permissions

### Available Scopes

| Scope | Description |
|-------|-------------|
| `*` | Full access to all API endpoints |
| `read:products` | Read product information |
| `write:products` | Create, update, and delete products |
| `read:orders` | Read order information |
| `write:orders` | Create, update, and delete orders |
| `read:menu` | Read menu information |
| `write:menu` | Update menu information |
| `read:categories` | Read category information |
| `write:categories` | Create, update, and delete categories |
| `read:customers` | Read customer information |
| `write:customers` | Create, update, and delete customers |
| `read:analytics` | Access analytics and reports |
| `webhook:receive` | Receive webhook events |

### Get Available Scopes

```bash
GET /api/v1/api-keys/scopes
```

**Response:**
```json
{
  "type": "1",
  "message": "Available scopes retrieved successfully",
  "data": [
    {
      "scope": "*",
      "description": "Full access to all API endpoints"
    },
    {
      "scope": "read:products",
      "description": "Read product information"
    }
    // ... more scopes
  ]
}
```

### Scope Examples

#### Read-Only Access
```json
{
  "scopes": ["read:products", "read:orders", "read:menu"]
}
```

#### Full Product Management
```json
{
  "scopes": ["read:products", "write:products", "read:categories"]
}
```

#### Order Processing
```json
{
  "scopes": ["read:orders", "write:orders", "read:customers"]
}
```

---

## Rate Limiting

Each API key has rate limiting to prevent abuse.

### Default Rate Limits
- **Max Requests:** 1000
- **Time Window:** 1 hour (3600000ms)

### Custom Rate Limits

```json
{
  "rateLimit": {
    "maxRequests": 5000,
    "windowMs": 3600000  // 1 hour in milliseconds
  }
}
```

### Common Configurations

**Light Usage:**
```json
{
  "maxRequests": 100,
  "windowMs": 3600000  // 100 requests per hour
}
```

**Medium Usage:**
```json
{
  "maxRequests": 1000,
  "windowMs": 3600000  // 1000 requests per hour
}
```

**Heavy Usage:**
```json
{
  "maxRequests": 10000,
  "windowMs": 3600000  // 10000 requests per hour
}
```

---

## Security Best Practices

### 1. Keep API Keys Secret

❌ **DON'T:**
```javascript
// Don't commit to version control
const apiKey = 'carta_live_abc123xyz456...';

// Don't expose in client-side code
<script>
  const apiKey = 'carta_live_abc123xyz456...';
</script>
```

✅ **DO:**
```javascript
// Use environment variables
const apiKey = process.env.CARTA_API_KEY;

// Store securely in backend only
```

### 2. Use Appropriate Scopes

Give keys only the permissions they need:

```json
{
  "name": "Read-Only Analytics",
  "scopes": ["read:analytics"]  // Minimum permissions
}
```

### 3. Set Expiration Dates

```json
{
  "expiresIn": 90  // Expires in 90 days
}
```

### 4. Use IP Whitelisting

```json
{
  "ipWhitelist": ["203.0.113.1", "198.51.100.0/24"]
}
```

### 5. Rotate Keys Regularly

1. Create new API key
2. Update integration to use new key
3. Revoke old key

### 6. Monitor Usage

Check `lastUsedAt` timestamp:
```bash
GET /api/v1/api-keys/:keyId
```

### 7. Revoke Compromised Keys Immediately

```bash
POST /api/v1/api-keys/:keyId/revoke
```

---

## Examples

### Complete Integration Example

```javascript
const CartaAIClient = class {
  constructor(apiKey, baseUrl = 'http://localhost:3001/api/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  async getProducts(subDomain, localId) {
    return this.request(`/products/get-all/${subDomain}/${localId}`);
  }

  async getOrders(subDomain, localId) {
    return this.request(`/order/filled-orders/${subDomain}/${localId}`);
  }

  async createProduct(subDomain, localId, productData) {
    return this.request(`/products/${subDomain}/${localId}`, {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }
};

// Usage
const client = new CartaAIClient('carta_live_abc123xyz456...');

try {
  const products = await client.getProducts('my-restaurant', 'LOC123');
  console.log('Products:', products);
} catch (error) {
  console.error('Error:', error.message);
}
```

---

## Testing

Run the comprehensive test suite:

```bash
chmod +x test-api-keys.sh
./test-api-keys.sh
```

The test suite covers:
- ✅ API key creation
- ✅ Listing API keys
- ✅ Getting key details
- ✅ Authentication with X-API-Key header
- ✅ Authentication with Authorization Bearer
- ✅ Updating API keys
- ✅ Invalid key rejection
- ✅ Key revocation
- ✅ Revoked key rejection

---

## Troubleshooting

### 401: Invalid or inactive API key

**Cause:** API key is invalid, revoked, or expired

**Solution:**
- Verify the key is correct
- Check if the key has been revoked
- Check expiration date

### 403: Insufficient permissions

**Cause:** API key doesn't have required scope

**Solution:**
- Update key scopes
- Use a key with appropriate permissions

### 403: IP address not authorized

**Cause:** Request IP not in whitelist

**Solution:**
- Add IP to whitelist
- Remove IP restrictions if not needed

### 429: Rate limit exceeded

**Cause:** Too many requests in time window

**Solution:**
- Reduce request frequency
- Request higher rate limits
- Implement exponential backoff

---

## Migration Guide

### From JWT to API Keys

If you're currently using JWT tokens and want to migrate to API keys:

1. Create API key with required scopes
2. Update application to use API key
3. Test thoroughly
4. Deploy changes
5. Remove JWT dependency

---

*Last Updated: 2025-12-03*
*API Version: v1*
