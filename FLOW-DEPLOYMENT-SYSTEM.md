# WhatsApp Flow Deployment System

## Overview

The Flow Deployment System automatically creates, updates, and manages WhatsApp Flows in Meta's API whenever products change. This ensures that product customization flows are always up-to-date without manual intervention.

---

## 🎯 Key Features

### 1. **Automatic Flow Deployment**
- Flows are automatically created when products are created/updated
- Only products with presentations (sizes) or modifiers get flows
- Existing flows are updated when products change
- Flows are deleted when products are removed

### 2. **Manual Deployment Controls**
- Deploy individual product flows via API
- Batch deploy flows for an entire category
- Force update existing flows
- Delete flows manually

### 3. **Flow Mapping & Tracking**
- Business model stores Product ID → Flow ID mapping
- Track which products have deployed flows
- Query flow IDs programmatically

### 4. **Smart Deployment Logic**
- Skip products that don't need flows (no presentations/modifiers)
- Check if catalog sync is enabled before deploying
- Validate WhatsApp Business configuration
- Handle rate limiting with delays

---

## 📊 Architecture

### Database Schema

**Business Model** ([src/models/Business.ts](src/models/Business.ts#L53)):
```typescript
interface IBusiness {
  // ... other fields
  fbFlowMapping?: Record<string, string>; // Product ID → Flow ID
  whatsappAccessToken?: string;
  fbBusinessId?: string;
  catalogSyncEnabled?: boolean;
}
```

**Schema Definition** ([src/models/Business.ts](src/models/Business.ts#L379-L384)):
```typescript
fbFlowMapping: {
  type: Map,
  of: String,
  required: false,
  default: () => new Map()
}
```

**Example Data**:
```javascript
{
  subDomain: 'my-restaurant',
  fbBusinessId: '123456789',
  whatsappAccessToken: 'EAAB...',
  catalogSyncEnabled: true,
  fbFlowMapping: {
    'prod:pizza-margherita': '987654321',  // flowId
    'prod:custom-burger': '987654322',
    'prod:build-salad': '987654323'
  }
}
```

---

### Automatic Deployment Hooks

**Product Post-Save Hook** ([src/models/Product.ts](src/models/Product.ts#L267-L349)):

```typescript
ProductSchema.post('save', async function(doc: IProduct) {
  // 1. Sync product to catalog (existing)
  await CatalogSyncService.syncProductToCatalog(doc);

  // 2. Deploy WhatsApp Flow (new)
  if (business.whatsappAccessToken && business.fbBusinessId) {
    const flowResult = await WhatsAppFlowService.deployFlowToMeta(
      doc.rId,
      doc.subDomain,
      doc.localId,
      !this.isNew // Force update if not new
    );
  }
});
```

**Triggers**:
- Creating a new product
- Updating an existing product
- Changing product modifiers
- Changing product presentations

**Product Post-Remove Hook** ([src/models/Product.ts](src/models/Product.ts#L351-L393)):

```typescript
ProductSchema.post('remove', async function(doc: IProduct) {
  // 1. Remove from catalog
  await CatalogSyncService.removeProductFromCatalog(/*...*/);

  // 2. Delete WhatsApp Flow
  await WhatsAppFlowService.deleteFlowFromMeta(
    doc.rId,
    doc.subDomain
  );
});
```

---

## 🔧 Service Methods

### WhatsAppFlowService

Located in: [src/services/whatsapp/whatsappFlowService.ts](src/services/whatsapp/whatsappFlowService.ts)

#### 1. `deployFlowToMeta()`

**Purpose**: Deploy or update a flow for a product

**Signature**:
```typescript
static async deployFlowToMeta(
  productId: string,
  subDomain: string,
  localId?: string,
  forceUpdate: boolean = false
): Promise<{
  success: boolean;
  flowId?: string;
  action?: 'created' | 'updated' | 'skipped';
  error?: string;
}>
```

**Logic Flow**:
```
1. Get business with WhatsApp credentials
   ↓
2. Validate business has WhatsApp configured
   ↓
3. Check if catalog sync is enabled
   ↓
4. Get product and check if active
   ↓
5. Check if product needs a flow:
   - Has multiple presentations? → Yes
   - Has modifiers? → Yes
   - Neither? → Skip
   ↓
6. Check if flow already exists
   - Exists & forceUpdate=false? → Skip
   - Exists & forceUpdate=true? → Update
   - Doesn't exist? → Create
   ↓
7. Generate flow template JSON
   ↓
8. Call Meta API (create or update)
   ↓
9. Store flowId in business.fbFlowMapping
   ↓
10. Return success with flowId and action
```

**Meta API Calls**:

**Create Flow**:
```typescript
POST https://graph.facebook.com/v18.0/{businessId}/flows
Headers:
  Authorization: Bearer {accessToken}
  Content-Type: application/json

Body:
{
  "name": "{productName} - Customization Flow",
  "categories": ["PRODUCT_CATALOG"],
  "endpoint_uri": "{apiBaseUrl}/api/v1/whatsapp/flow/submit-order/{subDomain}/{localId}",
  "version": "3.0",
  "screens": [...],
  "data_api_version": "3.0"
}

Response:
{
  "id": "987654321"  // Flow ID
}
```

**Update Flow**:
```typescript
POST https://graph.facebook.com/v18.0/{flowId}
Headers:
  Authorization: Bearer {accessToken}
  Content-Type: application/json

Body:
{
  "name": "{productName} - Customization Flow",
  "categories": ["PRODUCT_CATALOG"],
  "endpoint_uri": "{apiBaseUrl}/api/v1/whatsapp/flow/submit-order/{subDomain}/{localId}",
  ...flowJson
}
```

**Example Usage**:
```typescript
const result = await WhatsAppFlowService.deployFlowToMeta(
  'prod:pizza-margherita',
  'my-restaurant',
  'LOC123',
  false // Don't force update
);

// Result:
{
  success: true,
  flowId: '987654321',
  action: 'created'
}
```

---

#### 2. `getFlowIdForProduct()`

**Purpose**: Retrieve stored flow ID for a product

**Signature**:
```typescript
static async getFlowIdForProduct(
  productId: string,
  subDomain: string
): Promise<string | null>
```

**Example**:
```typescript
const flowId = await WhatsAppFlowService.getFlowIdForProduct(
  'prod:pizza-margherita',
  'my-restaurant'
);

// Returns: '987654321' or null
```

---

#### 3. `deleteFlowFromMeta()`

**Purpose**: Delete a deployed flow and remove mapping

**Signature**:
```typescript
static async deleteFlowFromMeta(
  productId: string,
  subDomain: string
): Promise<{
  success: boolean;
  error?: string;
}>
```

**Logic Flow**:
```
1. Get business
   ↓
2. Get flowId from mapping
   ↓
3. If no flowId → Return success (nothing to delete)
   ↓
4. Call Meta API DELETE
   ↓
5. Remove from business.fbFlowMapping
   ↓
6. Save business
   ↓
7. Return success
```

**Meta API Call**:
```typescript
DELETE https://graph.facebook.com/v18.0/{flowId}
Headers:
  Authorization: Bearer {accessToken}
```

---

#### 4. `deployFlowsForCategory()`

**Purpose**: Batch deploy flows for all products in a category

**Signature**:
```typescript
static async deployFlowsForCategory(
  categoryId: string,
  subDomain: string,
  localId?: string
): Promise<{
  success: boolean;
  deployed: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ productId: string; error: string }>;
}>
```

**Logic Flow**:
```
1. Get all active products in category
   ↓
2. For each product:
   a. Deploy flow
   b. Track result (deployed/updated/skipped/failed)
   c. Wait 500ms (rate limiting)
   ↓
3. Return summary with counts and errors
```

**Example**:
```typescript
const result = await WhatsAppFlowService.deployFlowsForCategory(
  'cat:pizza',
  'my-restaurant',
  'LOC123'
);

// Result:
{
  success: true,
  deployed: 8,
  updated: 2,
  skipped: 3,
  failed: 0,
  errors: []
}
```

---

## 📋 API Endpoints

### 1. Deploy Flow for Product

**Endpoint**: `POST /api/v1/whatsapp/flow/deploy/:productId/:subDomain/:localId?`

**Purpose**: Manually deploy or update a flow for a product

**Request**:
```bash
POST /api/v1/whatsapp/flow/deploy/prod:pizza-margherita/my-restaurant/LOC123
Authorization: Basic {credentials}
Content-Type: application/json

{
  "forceUpdate": true  // Optional: force update even if flow exists
}
```

**Response**:
```json
{
  "type": "success",
  "message": "Flow created successfully",
  "data": {
    "flowId": "987654321",
    "action": "created"
  }
}
```

**Possible Actions**:
- `created` - New flow created
- `updated` - Existing flow updated
- `skipped` - Product doesn't need a flow or already has one

---

### 2. Delete Flow for Product

**Endpoint**: `DELETE /api/v1/whatsapp/flow/deploy/:productId/:subDomain`

**Purpose**: Delete deployed flow for a product

**Request**:
```bash
DELETE /api/v1/whatsapp/flow/deploy/prod:pizza-margherita/my-restaurant
Authorization: Basic {credentials}
```

**Response**:
```json
{
  "type": "success",
  "message": "Flow deleted successfully",
  "data": null
}
```

---

### 3. Deploy Flows for Category

**Endpoint**: `POST /api/v1/whatsapp/flow/deploy-category/:categoryId/:subDomain/:localId?`

**Purpose**: Batch deploy flows for all products in a category

**Request**:
```bash
POST /api/v1/whatsapp/flow/deploy-category/cat:pizza/my-restaurant/LOC123
Authorization: Basic {credentials}
```

**Response**:
```json
{
  "type": "success",
  "message": "Successfully deployed 8 flows",
  "data": {
    "deployed": 8,
    "updated": 2,
    "skipped": 3,
    "failed": 0,
    "errors": []
  }
}
```

**Partial Success Example**:
```json
{
  "type": "partial",
  "message": "Deployed 8 flows with 2 failures",
  "data": {
    "deployed": 8,
    "updated": 0,
    "skipped": 3,
    "failed": 2,
    "errors": [
      {
        "productId": "prod:special-pizza",
        "error": "Product not found or inactive"
      },
      {
        "productId": "prod:old-burger",
        "error": "Failed to generate flow template"
      }
    ]
  }
}
```

---

### 4. Get Flow ID

**Endpoint**: `GET /api/v1/whatsapp/flow/flow-id/:productId/:subDomain`

**Purpose**: Check if product has a deployed flow

**Request**:
```bash
GET /api/v1/whatsapp/flow/flow-id/prod:pizza-margherita/my-restaurant
Authorization: Basic {credentials}
```

**Response** (Flow exists):
```json
{
  "type": "success",
  "message": "Flow ID retrieved",
  "data": {
    "flowId": "987654321",
    "hasFlow": true
  }
}
```

**Response** (No flow):
```json
{
  "type": "success",
  "message": "No flow found for product",
  "data": {
    "flowId": null,
    "hasFlow": false
  }
}
```

---

## 🧪 Testing Guide

### Test 1: Automatic Deployment on Product Create

```bash
# Create a new product with presentations
POST /api/v1/products/create/my-restaurant/LOC123

{
  "name": "Custom Pizza",
  "description": "Build your own pizza",
  "categoryId": "cat:pizza",
  "basePrice": 15.00,
  "modifiers": ["mod:toppings", "mod:crust"],
  "isActive": true
}
```

**Expected Result**:
1. Product created in database
2. Product synced to catalog
3. WhatsApp Flow automatically deployed
4. `business.fbFlowMapping['prod:custom-pizza']` contains flowId
5. Logs show: "Product flow auto-deployed successfully"

**Verification**:
```bash
# Check if flow was deployed
GET /api/v1/whatsapp/flow/flow-id/prod:custom-pizza/my-restaurant

# Should return flowId
```

---

### Test 2: Manual Flow Deployment

```bash
# Deploy flow manually
POST /api/v1/whatsapp/flow/deploy/prod:pizza-margherita/my-restaurant/LOC123
```

**Expected Result**:
- Flow created/updated in Meta
- Response includes flowId and action
- Business mapping updated

---

### Test 3: Batch Category Deployment

```bash
# Deploy all pizza flows
POST /api/v1/whatsapp/flow/deploy-category/cat:pizza/my-restaurant/LOC123
```

**Expected Result**:
- All pizza products with presentations/modifiers get flows
- Summary includes counts (deployed, updated, skipped, failed)
- Rate limiting prevents API throttling (500ms delay between deployments)

---

### Test 4: Flow Update on Product Modification

```bash
# Update product (add new modifier)
PUT /api/v1/products/update/prod:pizza-margherita/my-restaurant/LOC123

{
  "modifiers": ["mod:toppings", "mod:crust", "mod:cheese"]  # Added mod:cheese
}
```

**Expected Result**:
1. Product updated in database
2. Product re-synced to catalog
3. WhatsApp Flow automatically updated
4. Flow now includes cheese modifier options
5. Logs show: "Product flow auto-deployed successfully" with action: "updated"

---

### Test 5: Flow Deletion on Product Removal

```bash
# Delete product
DELETE /api/v1/products/delete/prod:old-pizza/my-restaurant
```

**Expected Result**:
1. Product removed from database
2. Product removed from catalog
3. WhatsApp Flow deleted from Meta
4. Flow mapping removed from business
5. Logs show: "Product flow auto-deleted"

---

## 🔍 Deployment Logic Decision Tree

```
┌─────────────────────────────┐
│  Product Save Triggered     │
└──────────┬──────────────────┘
           │
           ↓
    ┌──────────────────┐
    │ Catalog sync     │ NO
    │ enabled?         ├──────→ SKIP (no deployment)
    └────┬─────────────┘
         │ YES
         ↓
    ┌──────────────────┐
    │ WhatsApp         │ NO
    │ configured?      ├──────→ SKIP (no deployment)
    └────┬─────────────┘
         │ YES
         ↓
    ┌──────────────────┐
    │ Product active?  │ NO
    └────┬─────────────┼──────→ SKIP (inactive products)
         │ YES
         ↓
    ┌──────────────────┐
    │ Has presentations│ NO
    │ (>1) or          ├──┐
    │ modifiers?       │  │
    └────┬─────────────┘  │
         │ YES            │
         ↓                ↓
    ┌──────────────────┐ SKIP (simple products don't need flows)
    │ Flow exists?     │
    └────┬────────┬────┘
         │        │
      YES│        │NO
         │        │
         ↓        ↓
    ┌──────┐  ┌──────┐
    │UPDATE│  │CREATE│
    └──────┘  └──────┘
         │        │
         └────┬───┘
              ↓
    ┌──────────────────┐
    │ Deploy to Meta   │
    │ Store flowId     │
    └──────────────────┘
```

---

## 💡 Best Practices

### 1. **Initial Setup**

When setting up flows for the first time:

```bash
# 1. Ensure business has WhatsApp configured
# Verify: business.whatsappAccessToken and business.fbBusinessId exist

# 2. Deploy flows for all categories
POST /api/v1/whatsapp/flow/deploy-category/cat:pizza/my-restaurant
POST /api/v1/whatsapp/flow/deploy-category/cat:burgers/my-restaurant
POST /api/v1/whatsapp/flow/deploy-category/cat:salads/my-restaurant
```

---

### 2. **Monitoring Deployments**

Check logs for deployment status:

```bash
# Successful deployment
"Product flow auto-deployed successfully" {
  productId: 'prod:pizza',
  flowId: '987654321',
  action: 'created'
}

# Skipped deployment
"Product flow deployment skipped" {
  productId: 'prod:simple-water'  # No presentations/modifiers
}

# Failed deployment
"Product flow auto-deployment failed" {
  productId: 'prod:pizza',
  error: 'Meta API error: Invalid access token'
}
```

---

### 3. **Handling Failures**

If automatic deployment fails:

```bash
# 1. Check error logs
# 2. Verify WhatsApp Business configuration
# 3. Manually retry deployment
POST /api/v1/whatsapp/flow/deploy/prod:pizza-margherita/my-restaurant

{
  "forceUpdate": true
}
```

---

### 4. **Rate Limiting**

Meta API has rate limits:

- **Individual deployments**: Handled automatically
- **Batch deployments**: 500ms delay between each product
- **Recommendation**: Deploy in batches of <50 products at a time

```bash
# Good: Deploy category by category
POST /api/v1/whatsapp/flow/deploy-category/cat:pizza/my-restaurant

# Avoid: Deploying 1000s of flows simultaneously
```

---

### 5. **Environment Variables**

Set API base URL for flow endpoints:

```bash
# .env
API_BASE_URL=https://api.yourdomain.com

# Used in endpoint_uri:
# https://api.yourdomain.com/api/v1/whatsapp/flow/submit-order/{subDomain}/{localId}
```

---

## 🐛 Troubleshooting

### Issue 1: Flows not deploying automatically

**Symptoms**:
- Products created/updated
- No "auto-deployed" logs
- No flowId in business.fbFlowMapping

**Possible Causes**:
1. `catalogSyncEnabled` is false
2. Missing WhatsApp credentials
3. Product has no presentations/modifiers
4. Product is inactive

**Solution**:
```typescript
// Check business configuration
const business = await Business.findOne({ subDomain: 'my-restaurant' });

console.log({
  catalogSyncEnabled: business.catalogSyncEnabled,
  hasAccessToken: !!business.whatsappAccessToken,
  hasBusinessId: !!business.fbBusinessId
});

// Check product
const product = await Product.findOne({ rId: 'prod:pizza' });
const presentations = await Presentation.find({ productId: product.rId });

console.log({
  isActive: product.isActive,
  presentationCount: presentations.length,
  modifierCount: product.modifiers?.length || 0
});
```

---

### Issue 2: Meta API Errors

**Symptoms**:
- "Failed to deploy flow to Meta"
- Meta API error in logs

**Common Errors**:

**Invalid Access Token**:
```json
{
  "error": {
    "message": "Invalid OAuth access token",
    "code": 190
  }
}
```
**Solution**: Refresh WhatsApp access token in business settings

**Business Not Found**:
```json
{
  "error": {
    "message": "Business account not found",
    "code": 100
  }
}
```
**Solution**: Verify `business.fbBusinessId` is correct

**Flow Validation Error**:
```json
{
  "error": {
    "message": "Flow JSON validation failed",
    "code": 400
  }
}
```
**Solution**: Check flow template generation, ensure valid JSON structure

---

### Issue 3: Flow mapping not updating

**Symptoms**:
- Flow deployed successfully
- flowId in response
- But `business.fbFlowMapping` doesn't show flowId

**Cause**: Business document not saved after update

**Solution**: Already handled in code (line 699 in whatsappFlowService.ts):
```typescript
await business.save();
```

**Verification**:
```typescript
const business = await Business.findOne({ subDomain: 'my-restaurant' });
const mapping = business.fbFlowMapping as any;
console.log('Flow ID:', mapping['prod:pizza-margherita']);
```

---

## 📊 Metrics & Monitoring

### Key Metrics to Track

1. **Flow Deployment Success Rate**
   - Total deployments attempted
   - Successful deployments
   - Failed deployments
   - Skip rate

2. **Deployment Performance**
   - Average deployment time
   - Meta API response time
   - Rate limit hits

3. **Flow Usage**
   - Products with flows
   - Products without flows (that should have them)
   - Flow completion rates (future)

### Example Monitoring Query

```typescript
// Get deployment statistics
const business = await Business.findOne({ subDomain: 'my-restaurant' });
const flowMapping = business.fbFlowMapping as any;
const totalFlows = Object.keys(flowMapping).length;

const products = await Product.find({
  subDomain: 'my-restaurant',
  isActive: true
});

const productsNeedingFlows = await Promise.all(
  products.map(async (p) => {
    const presentations = await Presentation.find({ productId: p.rId });
    return presentations.length > 1 || p.modifiers?.length > 0;
  })
);

const shouldHaveFlows = productsNeedingFlows.filter(Boolean).length;

console.log({
  totalFlows,
  shouldHaveFlows,
  coverage: `${((totalFlows / shouldHaveFlows) * 100).toFixed(1)}%`
});
```

---

## 🔜 Future Enhancements

### 1. **Batch Deployment Optimization**
- Parallel deployments (respecting rate limits)
- Queue-based deployment system
- Retry logic for failed deployments

### 2. **Flow Analytics**
- Track flow opens
- Track completion rates
- A/B test different flow designs

### 3. **Flow Versioning**
- Track flow version history
- Rollback to previous versions
- Compare flow performance across versions

### 4. **Advanced Flow Templates**
- Dynamic screen generation based on product type
- Customizable flow templates per category
- Multi-language flow support

---

## 📚 Related Documentation

- [PHASE-3-IMPLEMENTATION-SUMMARY.md](PHASE-3-IMPLEMENTATION-SUMMARY.md) - WhatsApp Flow Integration
- [PHASE-2-IMPLEMENTATION-SUMMARY.md](PHASE-2-IMPLEMENTATION-SUMMARY.md) - Lifecycle Automation
- [PHASE-1-IMPLEMENTATION-SUMMARY.md](PHASE-1-IMPLEMENTATION-SUMMARY.md) - Category Catalogs
- [CATEGORY-BASED-CATALOG-STRATEGY.md](CATEGORY-BASED-CATALOG-STRATEGY.md) - Overall Strategy
- [WhatsApp Flows API Reference](https://developers.facebook.com/docs/whatsapp/flows)

---

**Status**: ✅ Implementation Complete

**Last Updated**: 2025-11-29
