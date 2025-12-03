# API Key Scope: User vs Business Access

## 🎯 Direct Answer to Your Question

**By default, an API key gives access to ALL businesses that the user owns.**

The `businessId` and `subDomain` fields on the API key are **optional metadata** - they are stored but **NOT enforced** by default.

---

## 📊 Current Behavior

### What Happens Now

```typescript
// User owns 3 restaurants
User: "john@example.com"
├── Restaurant A (subDomain: "restaurant-a")
├── Restaurant B (subDomain: "restaurant-b")
└── Restaurant C (subDomain: "restaurant-c")

// Create API key
{
  "name": "My Integration",
  "userId": "john@example.com",
  "businessId": "restaurant-a-id",  // ⚠️ This is just a label
  "subDomain": "restaurant-a",      // ⚠️ This is just a label
  "scopes": ["read:products"]
}

// This key can access:
✅ /products/get-all/restaurant-a/...
✅ /products/get-all/restaurant-b/...  (Even though businessId says restaurant-a!)
✅ /products/get-all/restaurant-c/...  (Can access all user's businesses)
```

### Why This Happens

1. API key authentication checks `userId`
2. Sets `req.user` to the user who owns the key
3. No validation of `businessId` or `subDomain` occurs
4. All of the user's businesses are accessible

---

## 🔒 Recommended Solution

I've created a business scope middleware that **enforces** the businessId/subDomain restriction.

### New File Created

**`src/middleware/apiKeyBusinessScope.ts`**

This middleware provides:
- `enforceBusinessScope` - Automatically enforces business restrictions
- `requireBusinessMatch` - Ensures specific parameters match

---

## 🛠️ How to Enforce Business Scope

### Step 1: Apply Middleware to Routes

```typescript
import { authenticateApiKey } from '../middleware/apiKeyAuth';
import { enforceBusinessScope } from '../middleware/apiKeyBusinessScope';

// Before (no enforcement)
router.get(
  '/products/get-all/:subDomain/:localId',
  authenticateApiKey,
  getProducts
);

// After (enforces business scope)
router.get(
  '/products/get-all/:subDomain/:localId',
  authenticateApiKey,
  enforceBusinessScope,  // ← Add this line
  getProducts
);
```

### Step 2: Test the Difference

**Without enforceBusinessScope:**
```bash
# Key scoped to restaurant-a
API_KEY="carta_live_abc123..."

# Can access restaurant-a ✅
curl http://localhost:3001/api/v1/products/get-all/restaurant-a/LOC1 \
  -H "X-API-Key: $API_KEY"
# Response: 200 OK

# Can also access restaurant-b ✅ (UNINTENDED!)
curl http://localhost:3001/api/v1/products/get-all/restaurant-b/LOC2 \
  -H "X-API-Key: $API_KEY"
# Response: 200 OK (Should be 403!)
```

**With enforceBusinessScope:**
```bash
# Same key scoped to restaurant-a
API_KEY="carta_live_abc123..."

# Can access restaurant-a ✅
curl http://localhost:3001/api/v1/products/get-all/restaurant-a/LOC1 \
  -H "X-API-Key: $API_KEY"
# Response: 200 OK

# Cannot access restaurant-b ❌ (ENFORCED!)
curl http://localhost:3001/api/v1/products/get-all/restaurant-b/LOC2 \
  -H "X-API-Key: $API_KEY"
# Response: 403 Forbidden
# Message: "API key is not authorized to access this business"
```

---

## 🎯 Two Types of API Keys

### 1. User-Level Keys (Unrestricted)

**When to use:**
- Admin tools
- Personal scripts
- Multi-location dashboards
- Internal use only

**How to create:**
```json
{
  "name": "Admin Dashboard",
  "scopes": ["read:products", "read:orders"]
  // NO businessId or subDomain
}
```

**Access:** All businesses the user owns ✅

---

### 2. Business-Level Keys (Restricted)

**When to use:**
- Third-party integrations
- POS systems
- External partners
- Location-specific tools

**How to create:**
```json
{
  "name": "POS Integration - Location A",
  "scopes": ["read:products", "write:orders"],
  "businessId": "BIZ123",
  "subDomain": "restaurant-a"
}
```

**Access:** ONLY the specified business ✅

---

## 📋 Example Scenarios

### Scenario 1: Restaurant Chain Owner

**User:** Sarah owns 5 locations

**Option A: One unrestricted key for her admin dashboard**
```json
{
  "name": "My Admin Dashboard",
  "scopes": ["read:products", "read:orders", "read:analytics"]
  // No business restriction
}
```
✅ Can see all 5 locations in one dashboard

**Option B: Separate keys for each location's POS**
```json
// Downtown POS
{
  "name": "POS - Downtown",
  "scopes": ["read:products", "write:orders"],
  "subDomain": "restaurant-downtown"
}

// Airport POS
{
  "name": "POS - Airport",
  "scopes": ["read:products", "write:orders"],
  "subDomain": "restaurant-airport"
}
```
✅ Each POS can only access its own location

---

### Scenario 2: Third-Party Integration

**User:** Restaurant integrating with delivery platform

```json
{
  "name": "UberEats Integration",
  "scopes": ["read:menu", "write:orders"],
  "subDomain": "my-restaurant",
  "ipWhitelist": ["ubereats-ip"],
  "expiresIn": 365
}
```

✅ UberEats can only access this specific restaurant
✅ Cannot access owner's other restaurants
✅ Additional security with IP whitelist

---

## ⚠️ Security Implications

### Without Business Scope Enforcement

**Risk:** A compromised API key for one restaurant can access ALL of the user's restaurants.

```typescript
// If this key is leaked:
{
  "name": "Restaurant A POS",
  "subDomain": "restaurant-a"  // Just metadata, not enforced!
}

// Attacker can access:
- Restaurant A ❌ (intended)
- Restaurant B ❌ (unintended - user also owns this)
- Restaurant C ❌ (unintended - user also owns this)
```

### With Business Scope Enforcement

**Protection:** Each key can only access its designated business.

```typescript
// If this key is leaked:
{
  "name": "Restaurant A POS",
  "subDomain": "restaurant-a"  // ENFORCED by middleware!
}

// Attacker can access:
- Restaurant A ❌ (limited damage)
- Restaurant B ✅ (BLOCKED by middleware)
- Restaurant C ✅ (BLOCKED by middleware)
```

---

## 🚀 Action Items

### For Immediate Use

**If you want unrestricted keys (all businesses):**
- Create keys without `businessId`/`subDomain`
- Current behavior works as-is
- Use for admin/internal tools

**If you want restricted keys (one business only):**
1. Add the `enforceBusinessScope` middleware to your routes
2. Create keys WITH `businessId`/`subDomain`
3. Keys will be enforced to their specified business

### Example Route Update

```typescript
// File: src/routes/productsRoute.ts
import { enforceBusinessScope } from '../middleware/apiKeyBusinessScope';

// Add to all routes that need business scope
router.get(
  '/get-all/:subDomain/:localId',
  authenticateApiKey,      // Existing
  enforceBusinessScope,    // Add this
  getAll
);
```

---

## 📖 Documentation

For complete details, see:
- **[BUSINESS_SCOPED_API_KEYS.md](docs/BUSINESS_SCOPED_API_KEYS.md)** - Full guide on business scoping
- **[API_KEY_AUTHENTICATION.md](docs/API_KEY_AUTHENTICATION.md)** - Complete API key documentation

---

## ✅ Summary

| Question | Answer |
|----------|--------|
| Can one API key access multiple businesses? | **Yes, by default** (if user owns them) |
| Is businessId/subDomain enforced? | **No, not by default** (just metadata) |
| How to restrict to one business? | Add `enforceBusinessScope` middleware |
| Should I use business restrictions? | **Yes, for third-party integrations** |
| Should I use unrestricted keys? | **Only for admin/internal use** |

---

*Created: 2025-12-03*
*For security, always scope third-party keys to specific businesses!*
