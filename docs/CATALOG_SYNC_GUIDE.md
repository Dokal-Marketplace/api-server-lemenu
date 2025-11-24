# Catalog Sync Service - Implementation Guide

## Overview

The Catalog Sync Service automatically synchronizes your internal restaurant products (MongoDB) with Facebook Catalogs for WhatsApp integration. This enables you to send product cards and product lists to customers via WhatsApp.

### Architecture

```
┌─────────────────────┐
│  Internal Products  │ ← Master (Source of Truth)
│  (MongoDB Database) │
└──────────┬──────────┘
           │ Auto-sync on changes
           ▼
┌─────────────────────┐
│ Facebook Catalog    │ ← Slave (WhatsApp Display)
│  (Meta Graph API)   │
└─────────────────────┘
```

**Benefits:**
- ✅ Single source of truth (your product database)
- ✅ Automatic synchronization
- ✅ No data conflicts
- ✅ Preserve your complex product features (modifiers, combos, etc.)
- ✅ WhatsApp product messaging enabled

---

## Configuration

### Business Model Fields

New fields added to the Business model:

```typescript
interface IBusiness {
  // ... existing fields ...

  // Catalog sync configuration
  catalogSyncEnabled?: boolean;              // Enable/disable sync (default: true)
  catalogSyncSchedule?: 'manual' | 'realtime' | 'daily';  // Sync mode (default: 'realtime')
  lastCatalogSyncAt?: Date;                  // Last sync timestamp
}
```

### Sync Modes

| Mode | Description | Best For |
|------|-------------|----------|
| `realtime` | Syncs immediately when products are created/updated/deleted | **Recommended** - Real-time inventory management |
| `manual` | Only syncs when manually triggered via API | Fine-grained control |
| `daily` | Scheduled daily batch sync (future enhancement) | Large catalogs with infrequent changes |

---

## API Endpoints

### 1. Batch Sync All Products

Sync all active products to the Facebook Catalog.

**Endpoint:** `POST /api/v1/products/sync-to-catalog/:subDomain/:localId`

**Request:**
```bash
curl -X POST \
  'https://your-api.com/api/v1/products/sync-to-catalog/yoursubdomain/location1' \
  -H 'Content-Type: application/json' \
  -d '{
    "catalogId": "1234567890"
  }'
```

**Response:**
```json
{
  "type": "success",
  "message": "Successfully synced 45 products to catalog",
  "data": {
    "success": true,
    "synced": 45,
    "failed": 0,
    "skipped": 0,
    "errors": []
  }
}
```

---

### 2. Sync Single Product

Manually sync a specific product to the catalog.

**Endpoint:** `POST /api/v1/products/sync-product-to-catalog/:productId`

**Request:**
```bash
curl -X POST \
  'https://your-api.com/api/v1/products/sync-product-to-catalog/507f1f77bcf86cd799439011' \
  -H 'Content-Type: application/json' \
  -d '{
    "catalogId": "1234567890"
  }'
```

**Response:**
```json
{
  "type": "1",
  "message": "Product synced to catalog successfully",
  "data": {
    "success": true,
    "productId": "PIZZA_001",
    "catalogId": "1234567890",
    "action": "update"
  }
}
```

---

### 3. Sync Product Availability

Quickly update only product availability (stock status) without syncing all fields.

**Endpoint:** `POST /api/v1/products/sync-availability/:productId`

**Request:**
```bash
curl -X POST \
  'https://your-api.com/api/v1/products/sync-availability/507f1f77bcf86cd799439011' \
  -H 'Content-Type: application/json' \
  -d '{
    "catalogId": "1234567890"
  }'
```

**Use Case:** When a product goes out of stock, quickly update the catalog without syncing price, images, etc.

---

### 4. Get Sync Status

Check the sync configuration and status for a business.

**Endpoint:** `GET /api/v1/products/sync-status/:subDomain/:localId`

**Request:**
```bash
curl -X GET \
  'https://your-api.com/api/v1/products/sync-status/yoursubdomain/location1'
```

**Response:**
```json
{
  "type": "1",
  "message": "Sync status retrieved successfully",
  "data": {
    "catalogId": "1234567890",
    "syncEnabled": true,
    "lastSyncAt": "2025-01-14T10:30:00.000Z",
    "totalProducts": 45,
    "syncedProducts": 0
  }
}
```

---

## Automatic Syncing

### How It Works

When `catalogSyncEnabled: true` and `catalogSyncSchedule: 'realtime'`:

1. **Product Created** → Automatically synced to catalog
2. **Product Updated** → Automatically synced to catalog
3. **Product Deleted** → Automatically removed from catalog

### Product Mapping

Internal products are mapped to Facebook Catalog format:

| Internal Field | Catalog Field | Notes |
|----------------|---------------|-------|
| `rId` | `retailer_id` | Unique product ID |
| `name` | `name` | Product name |
| `basePrice` | `price` | Numeric price |
| `description` | `description` | Product description |
| `imageUrl` | `image_url` | Main product image |
| `category` | `category` | Product category |
| `isAvailable` + `isOutOfStock` | `availability` | "in stock", "out of stock", etc. |
| `isActive` | `availability` | If false → "discontinued" |

### Availability Logic

```javascript
if (!product.isActive) {
  availability = 'discontinued';
} else if (product.isOutOfStock) {
  availability = 'out of stock';
} else if (product.isAvailable) {
  availability = 'in stock';
} else {
  availability = 'available for order';
}
```

---

## Configuration Examples

### Enable Realtime Sync (Default)

```javascript
// Update business settings
await Business.updateOne(
  { subDomain: 'yoursubdomain' },
  {
    $set: {
      catalogSyncEnabled: true,
      catalogSyncSchedule: 'realtime',
      fbCatalogIds: ['1234567890']
    }
  }
);
```

### Disable Auto-Sync (Manual Only)

```javascript
await Business.updateOne(
  { subDomain: 'yoursubdomain' },
  {
    $set: {
      catalogSyncEnabled: true,
      catalogSyncSchedule: 'manual'
    }
  }
);
```

### Disable Sync Completely

```javascript
await Business.updateOne(
  { subDomain: 'yoursubdomain' },
  {
    $set: {
      catalogSyncEnabled: false
    }
  }
);
```

---

## Usage Workflow

### Initial Setup

1. **Create a Facebook Catalog** (if not exists):
```bash
POST /api/v1/whatsapp/catalogs
{
  "subDomain": "yoursubdomain",
  "name": "Restaurant Menu",
  "vertical": "commerce"
}
```

2. **Save catalog ID** to business:
```javascript
await Business.updateOne(
  { subDomain: 'yoursubdomain' },
  { $set: { fbCatalogIds: ['<catalog-id>'] } }
);
```

3. **Perform initial bulk sync**:
```bash
POST /api/v1/products/sync-to-catalog/yoursubdomain/location1
{
  "catalogId": "<catalog-id>"
}
```

4. **Enable realtime sync**:
```javascript
await Business.updateOne(
  { subDomain: 'yoursubdomain' },
  {
    $set: {
      catalogSyncEnabled: true,
      catalogSyncSchedule: 'realtime'
    }
  }
);
```

### Ongoing Usage

Once configured, products automatically sync. You can:

- **Create products** → Auto-synced
- **Update products** → Auto-synced
- **Delete products** → Auto-removed from catalog
- **Manual sync** → Use sync endpoints when needed

---

## Error Handling

### Sync Failures

If automatic sync fails:
- ✅ Error is logged but product operation succeeds
- ✅ Response is not blocked
- ✅ Can manually re-sync later

### Common Issues

**1. Catalog Not Configured**
```json
{
  "success": false,
  "productId": "PIZZA_001",
  "action": "skip",
  "error": "No catalog configured or sync disabled"
}
```
**Solution:** Configure `fbCatalogIds` in Business model

**2. Invalid Access Token**
```json
{
  "success": false,
  "error": "WhatsApp access token not configured"
}
```
**Solution:** Ensure `whatsappAccessToken` is valid and not expired

**3. Product Not Found in Catalog**
- First sync attempt creates the product
- Subsequent syncs update it
- Use batch sync to ensure all products are in catalog

---

## Best Practices

### 1. Initial Setup
✅ Create catalog first
✅ Perform bulk sync before enabling realtime
✅ Verify sync status before going live

### 2. Product Management
✅ Use realtime sync for most restaurants
✅ Ensure product images are optimized (< 1MB)
✅ Use meaningful `rId` (retailer IDs)
✅ Keep product names concise for WhatsApp display

### 3. Error Monitoring
✅ Monitor logs for sync failures
✅ Set up alerts for repeated failures
✅ Use manual sync to recover from failures

### 4. Performance
✅ Realtime sync is non-blocking (background)
✅ Batch sync for initial setup or recovery
✅ Use availability sync for quick stock updates

---

## Monitoring & Debugging

### Check Sync Logs

```bash
# Search logs for sync events
grep "catalog.*sync" logs/app.log

# Check for sync failures
grep "Background catalog sync failed" logs/app.log
```

### Verify Catalog Products

```bash
GET /api/v1/whatsapp/catalogs/:catalogId/products
```

### Manual Verification

1. Check business configuration:
```javascript
const business = await Business.findOne({ subDomain: 'yoursubdomain' });
console.log({
  catalogSyncEnabled: business.catalogSyncEnabled,
  catalogSyncSchedule: business.catalogSyncSchedule,
  fbCatalogIds: business.fbCatalogIds
});
```

2. Test single product sync:
```bash
POST /api/v1/products/sync-product-to-catalog/:productId
```

3. Check catalog via Meta:
```bash
GET /api/v1/whatsapp/catalogs/:catalogId/products
```

---

## Future Enhancements

### Planned Features

- [ ] **Scheduled Daily Sync** - Automatic daily batch sync
- [ ] **Sync History** - Track individual sync events
- [ ] **Conflict Resolution** - Handle concurrent updates
- [ ] **Selective Sync** - Sync only specific product categories
- [ ] **Webhook Integration** - Listen for catalog changes from Meta
- [ ] **Sync Retry Logic** - Automatic retry on transient failures
- [ ] **Sync Analytics** - Dashboard showing sync metrics

---

## Support

For issues or questions:
- Check the error logs
- Verify business configuration
- Use manual sync endpoints for troubleshooting
- Contact support with catalog ID and product ID

---

## Changelog

### v1.0.0 (2025-01-14)
- Initial implementation
- Realtime and manual sync modes
- Automatic sync on create/update/delete
- Batch sync endpoint
- Availability-only sync
- Sync status endpoint
