# Business-Scoped API Keys

## Understanding API Key Scope

### 🔑 How API Keys Work

API keys in CartaAI can be scoped at two levels:

1. **User-Level Scope** (Default)
   - Key belongs to a specific user
   - Can access **all businesses** the user has access to
   - Useful for personal integrations, admin tools

2. **Business-Level Scope** (Recommended for Production)
   - Key is restricted to a specific business
   - Cannot access other businesses, even if the user has access
   - Useful for third-party integrations, POS systems, specific locations

---

## 🎯 When to Use Each Scope

### User-Level Keys (No Business Restriction)

**Use When:**
- Building admin tools
- Personal automation scripts
- Managing multiple restaurants
- Internal integrations

**Example:**
```json
{
  "name": "Admin Dashboard",
  "scopes": ["read:products", "read:orders"],
  // No businessId or subDomain - can access all user's businesses
}
```

### Business-Level Keys (Business Restricted)

**Use When:**
- Third-party POS integration
- Location-specific tools
- External partner integrations
- Shared API keys with vendors

**Example:**
```json
{
  "name": "POS Integration - Downtown Location",
  "scopes": ["read:products", "write:orders"],
  "businessId": "BIZ123456",
  "subDomain": "my-restaurant"
}
```

---

## 📋 Creating Business-Scoped Keys

### Option 1: Scope by SubDomain

```bash
curl -X POST http://localhost:3001/api/v1/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Restaurant A Integration",
    "scopes": ["read:products", "write:orders"],
    "subDomain": "restaurant-a"
  }'
```

**This key can ONLY access:**
- `/products/get-all/restaurant-a/...`
- `/order/filled-orders/restaurant-a/...`
- Any endpoint with `subDomain=restaurant-a`

**This key CANNOT access:**
- `/products/get-all/restaurant-b/...` ❌
- Any other subdomain ❌

---

### Option 2: Scope by Business ID

```bash
curl -X POST http://localhost:3001/api/v1/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Business Integration",
    "scopes": ["read:products"],
    "businessId": "BIZ1760091628170D51SL"
  }'
```

---

### Option 3: Scope by Both (Most Restrictive)

```bash
curl -X POST http://localhost:3001/api/v1/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Specific Location Only",
    "scopes": ["read:products", "write:orders"],
    "businessId": "BIZ123",
    "subDomain": "my-restaurant"
  }'
```

---

## 🛡️ Enforcing Business Scope

### Method 1: Automatic Enforcement (Recommended)

Apply the middleware to routes that need business scope enforcement:

```typescript
import { Router } from 'express';
import { authenticateApiKey } from '../middleware/apiKeyAuth';
import { enforceBusinessScope } from '../middleware/apiKeyBusinessScope';

const router = Router();

// Enforce business scope on all product routes
router.get(
  '/products/get-all/:subDomain/:localId',
  authenticateApiKey,
  enforceBusinessScope,  // <-- Add this middleware
  getProducts
);
```

### Method 2: Specific Parameter Match

Enforce that the API key's subDomain matches the route parameter:

```typescript
import { requireBusinessMatch } from '../middleware/apiKeyBusinessScope';

router.get(
  '/products/get-all/:subDomain/:localId',
  authenticateApiKey,
  requireBusinessMatch('subDomain'),  // <-- Match subDomain parameter
  getProducts
);
```

---

## 🧪 Testing Business Scope

### Test 1: User-Level Key (Access All Businesses)

```bash
# Create unrestricted key
curl -X POST http://localhost:3001/api/v1/api-keys \
  -H "Authorization: Bearer $JWT" \
  -d '{"name":"Admin Key","scopes":["read:products"]}'

# Can access any business
curl http://localhost:3001/api/v1/products/get-all/restaurant-a/LOC1 \
  -H "X-API-Key: carta_live_abc123..."  # ✅ Works

curl http://localhost:3001/api/v1/products/get-all/restaurant-b/LOC2 \
  -H "X-API-Key: carta_live_abc123..."  # ✅ Also works
```

### Test 2: Business-Scoped Key (Restricted)

```bash
# Create business-scoped key
curl -X POST http://localhost:3001/api/v1/api-keys \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "name":"Restaurant A Only",
    "scopes":["read:products"],
    "subDomain":"restaurant-a"
  }'

# Can only access specified business
curl http://localhost:3001/api/v1/products/get-all/restaurant-a/LOC1 \
  -H "X-API-Key: carta_live_xyz456..."  # ✅ Works

curl http://localhost:3001/api/v1/products/get-all/restaurant-b/LOC2 \
  -H "X-API-Key: carta_live_xyz456..."  # ❌ 403 Forbidden
```

---

## 🔒 Security Best Practices

### 1. Always Scope Third-Party Keys

```json
{
  "name": "POS Vendor Integration",
  "scopes": ["read:products", "write:orders"],
  "subDomain": "specific-restaurant",  // ✅ Always specify
  "ipWhitelist": ["vendor-ip"],
  "expiresIn": 365
}
```

### 2. Use Minimal Scopes

```json
{
  "scopes": ["read:products"]  // ✅ Only what's needed
  // Not: ["*"]  // ❌ Too broad
}
```

### 3. One Key Per Integration

```bash
# ✅ Good: Separate keys for each integration
"POS System - Location A"
"Analytics Dashboard - Location A"
"Delivery Partner - Location A"

# ❌ Bad: One key for everything
"Master Integration Key"
```

---

## 📊 Current Behavior vs. Recommended

### Current Implementation

```typescript
// API key with businessId/subDomain
{
  userId: "user123",
  businessId: "BIZ123",  // Currently just metadata
  subDomain: "restaurant-a"  // Currently just metadata
}

// When used, can still access ANY business the user owns
// businessId and subDomain are not enforced ⚠️
```

### With Business Scope Middleware

```typescript
// Same API key
{
  userId: "user123",
  businessId: "BIZ123",
  subDomain: "restaurant-a"
}

// With enforceBusinessScope middleware:
// - Can access restaurant-a ✅
// - Cannot access restaurant-b ❌
// - businessId and subDomain are ENFORCED 🔒
```

---

## 🚀 Migration Guide

### Step 1: Add Middleware to Routes

Update your routes to enforce business scope:

```typescript
// Before
router.get('/products/:subDomain/:localId', authenticateApiKey, getProducts);

// After
import { enforceBusinessScope } from '../middleware/apiKeyBusinessScope';

router.get(
  '/products/:subDomain/:localId',
  authenticateApiKey,
  enforceBusinessScope,  // Add this
  getProducts
);
```

### Step 2: Update Existing Keys

Review and update existing API keys to add business scope:

```bash
# List all keys
curl http://localhost:3001/api/v1/api-keys \
  -H "Authorization: Bearer $JWT"

# Update each key with business scope
curl -X PATCH http://localhost:3001/api/v1/api-keys/KEY_ID \
  -H "Authorization: Bearer $JWT" \
  -d '{"businessId":"BIZ123","subDomain":"restaurant-a"}'
```

### Step 3: Test Thoroughly

1. Test business-scoped keys can access their business ✅
2. Test business-scoped keys CANNOT access other businesses ❌
3. Test unrestricted keys still work for multi-business access ✅

---

## 🎯 Use Case Examples

### Example 1: Multi-Location Restaurant Chain

```bash
# Corporate key (unrestricted)
{
  "name": "Corporate Dashboard",
  "scopes": ["read:products", "read:orders", "read:analytics"],
  # No business restriction - can see all locations
}

# Location-specific POS keys
{
  "name": "POS - Downtown",
  "scopes": ["read:products", "write:orders"],
  "subDomain": "restaurant-downtown"
}

{
  "name": "POS - Airport",
  "scopes": ["read:products", "write:orders"],
  "subDomain": "restaurant-airport"
}
```

### Example 2: Third-Party Delivery Integration

```bash
{
  "name": "UberEats Integration",
  "scopes": ["read:menu", "write:orders"],
  "subDomain": "my-restaurant",
  "ipWhitelist": ["uber-eats-ip"],
  "rateLimit": {
    "maxRequests": 5000,
    "windowMs": 3600000
  }
}
```

### Example 3: Franchise Model

```bash
# Franchisor (can access all franchisees)
{
  "name": "Franchisor Admin",
  "scopes": ["read:products", "read:orders", "read:analytics"],
  # No restriction - corporate oversight
}

# Franchisee (restricted to their location)
{
  "name": "Franchisee A - Manager",
  "scopes": ["read:products", "write:products", "read:orders"],
  "subDomain": "franchisee-a"
}
```

---

## 📖 API Reference

### Check Business Scope

When an API key is used, the response headers include scope information:

```bash
curl -I http://localhost:3001/api/v1/products/... \
  -H "X-API-Key: carta_live_..."

# Response includes:
X-API-Key-Business-Id: BIZ123
X-API-Key-Sub-Domain: restaurant-a
X-API-Key-Scopes: read:products,read:orders
```

### Error Responses

#### 403: Business Scope Violation

```json
{
  "type": "403",
  "message": "API key is not authorized to access this business",
  "data": {
    "allowedBusiness": "restaurant-a",
    "requestedBusiness": "restaurant-b"
  }
}
```

---

## ✅ Checklist

Before deploying business-scoped keys:

- [ ] Understand user-level vs business-level scope
- [ ] Add `enforceBusinessScope` middleware to sensitive routes
- [ ] Create business-scoped keys for third-party integrations
- [ ] Test that scoped keys cannot access other businesses
- [ ] Document which keys have which business access
- [ ] Set up monitoring for scope violations
- [ ] Review and update existing keys with appropriate scope

---

*For more information, see [API_KEY_AUTHENTICATION.md](API_KEY_AUTHENTICATION.md)*
