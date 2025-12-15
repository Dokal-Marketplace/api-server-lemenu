# Reset Meta Credentials Endpoint

## Overview
This endpoint allows you to reset Meta/WhatsApp credentials for a business partner. This is useful when you need to disconnect a business from Meta/WhatsApp or clear their integration settings.

## Endpoint Details

**URL:** `POST /api/v1/business/:subDomain/reset-meta-credentials`

**Authentication:** Required (Bearer Token)

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subDomain` | string | Yes | The subdomain of the business |

## Request Body

All parameters are optional. If not provided, they default to `true` except for `resetTemplates` which defaults to `false`.

```json
{
  "resetTokens": true,          // Reset WhatsApp access and refresh tokens
  "resetPhoneNumbers": true,    // Reset phone number IDs and WABA ID
  "resetCatalogs": true,        // Reset catalog IDs and mappings
  "resetTemplates": false       // Reset WhatsApp templates (optional)
}
```

### Request Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `resetTokens` | boolean | true | Clears `whatsappAccessToken`, `whatsappRefreshToken`, `whatsappTokenExpiresAt` and sets `whatsappEnabled` to false |
| `resetPhoneNumbers` | boolean | true | Clears `whatsappPhoneNumberIds` array and `wabaId` |
| `resetCatalogs` | boolean | true | Clears `fbCatalogIds`, `fbCatalogMapping`, sets `catalogSyncEnabled` to false, and removes `lastCatalogSyncAt` |
| `resetTemplates` | boolean | false | Clears `whatsappTemplates` array, sets `templatesProvisioned` to false, and removes `templatesProvisionedAt` |

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Meta credentials reset successfully",
  "data": {
    "_id": "...",
    "subDomain": "example-business",
    "name": "Example Business",
    "whatsappEnabled": false,
    "whatsappPhoneNumberIds": [],
    "fbCatalogIds": [],
    "catalogSyncEnabled": false,
    // ... other business fields
  }
}
```

### Error Responses

#### Business Not Found (404)
```json
{
  "success": false,
  "message": "Business not found"
}
```

#### Missing subDomain (400)
```json
{
  "success": false,
  "message": "subDomain parameter is required"
}
```

#### Unauthorized (401)
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details (only in development mode)"
}
```

## Usage Examples

### Example 1: Reset All Credentials (Default)
```bash
curl -X POST http://localhost:3000/api/v1/business/my-business/reset-meta-credentials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{}'
```

### Example 2: Reset Only Tokens
```bash
curl -X POST http://localhost:3000/api/v1/business/my-business/reset-meta-credentials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "resetTokens": true,
    "resetPhoneNumbers": false,
    "resetCatalogs": false,
    "resetTemplates": false
  }'
```

### Example 3: Reset Everything Including Templates
```bash
curl -X POST http://localhost:3000/api/v1/business/my-business/reset-meta-credentials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "resetTokens": true,
    "resetPhoneNumbers": true,
    "resetCatalogs": true,
    "resetTemplates": true
  }'
```

### Example 4: Using JavaScript/Node.js
```javascript
const axios = require('axios');

async function resetMetaCredentials(subDomain, token) {
  try {
    const response = await axios.post(
      `http://localhost:3000/api/v1/business/${subDomain}/reset-meta-credentials`,
      {
        resetTokens: true,
        resetPhoneNumbers: true,
        resetCatalogs: true,
        resetTemplates: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
resetMetaCredentials('my-business', 'YOUR_JWT_TOKEN');
```

## What Gets Reset

### When `resetTokens: true`
- `whatsappAccessToken` → removed
- `whatsappRefreshToken` → removed
- `whatsappTokenExpiresAt` → removed
- `whatsappEnabled` → set to `false`

### When `resetPhoneNumbers: true`
- `whatsappPhoneNumberIds` → set to `[]`
- `wabaId` → removed

### When `resetCatalogs: true`
- `fbCatalogIds` → set to `[]`
- `fbCatalogMapping` → set to `{}`
- `catalogSyncEnabled` → set to `false`
- `lastCatalogSyncAt` → removed

### When `resetTemplates: true`
- `whatsappTemplates` → set to `[]`
- `templatesProvisioned` → set to `false`
- `templatesProvisionedAt` → removed

## Testing

Two test files are provided:

1. **Bash Script** (`test-reset-meta.sh`):
   ```bash
   ./test-reset-meta.sh <subdomain> <jwt_token>
   ```

2. **Node.js Script** (`test-reset-meta.js`):
   ```bash
   node test-reset-meta.js <subdomain>
   ```

## Notes

- This operation is **irreversible**. Make sure you want to reset the credentials before calling this endpoint.
- The endpoint requires authentication. The user must have permission to modify the business.
- All reset operations are logged for audit purposes.
- The business document is updated atomically using MongoDB's `$set` and `$unset` operations.
- Validation is run on the updated document to ensure data integrity.

## Related Files

- Controller: `src/controllers/businessController.ts` (line 665)
- Service: `src/services/business/businessService.ts` (line 977)
- Route: `src/routes/businessRoute.ts` (line 69)
- Model: `src/models/Business.ts`

## Implementation Details

The endpoint uses:
- MongoDB's `findOneAndUpdate` with `$set` and `$unset` operators
- Mongoose validators to ensure data integrity
- Winston logger for audit trail
- JWT authentication middleware
