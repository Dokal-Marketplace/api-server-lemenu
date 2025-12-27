# Exchange Token API - Complete Documentation

## Overview

The Exchange Token endpoint handles Facebook OAuth authorization code exchange and stores the resulting access token securely in the database. It also captures additional Meta Business metadata including business IDs, catalog IDs, page IDs, Instagram accounts, and datasets.

## Endpoint

**URL:** `POST /api/v1/whatsapp/facebook/exchange-token`

**Authentication:** Required (Bearer JWT token)

## Request Format

### Complete Request Body

```json
{
  "code": "authorization_code_from_facebook_oauth",
  "waba_id": "25543497612004704",
  "phone_number_id": "935651219628941",
  "business_id": "644860301218731",
  "redirect_uri": "https://your-app.com/oauth/callback",
  "catalog_ids": ["886457576629319"],
  "page_ids": ["123456789"],
  "instagram_account_ids": ["987654321"],
  "dataset_ids": ["111222333"]
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | ✅ **Yes** | Authorization code received from Facebook OAuth flow. Expires after ~10 minutes. |
| `waba_id` | string | ✅ **Yes** | WhatsApp Business Account ID (25 digits). |
| `phone_number_id` | string | ✅ **Yes** | WhatsApp phone number ID (15 digits). |
| `business_id` | string | ❌ No | Facebook Business Manager ID. Stored as `fbBusinessId` and `businessManagerId`. |
| `redirect_uri` | string | ⚠️ Optional | OAuth redirect URI. Must exactly match the one used in authorization request. Falls back to `FACEBOOK_REDIRECT_URI` env variable if not provided. |
| `catalog_ids` | string[] | ❌ No | Array of Facebook Catalog IDs. Stored in `fbCatalogIds` array. |
| `page_ids` | string[] | ❌ No | Array of Facebook Page IDs. Currently logged but not stored (future implementation). |
| `instagram_account_ids` | string[] | ❌ No | Array of Instagram Account IDs. Currently logged but not stored (future implementation). |
| `dataset_ids` | string[] | ❌ No | Array of Facebook Dataset IDs. Currently logged but not stored (future implementation). |

## What Gets Stored

### Business Model Fields Updated

```javascript
{
  // Required fields - always updated
  whatsappAccessToken: "encrypted_token",        // Encrypted access token
  whatsappTokenExpiresAt: ISODate("2025-03-15"), // Token expiration date
  whatsappEnabled: true,                          // Set to true on successful exchange
  wabaId: "25543497612004704",                   // WhatsApp Business Account ID
  whatsappPhoneNumberIds: [                       // Array of phone number IDs
    "935651219628941"
  ],

  // Optional fields - updated if provided
  fbBusinessId: "644860301218731",               // Facebook Business Manager ID
  businessManagerId: "644860301218731",          // Alias for fbBusinessId
  fbCatalogIds: [                                 // Array of catalog IDs (deduplicated)
    "886457576629319"
  ],

  // Future implementation (currently only logged)
  // page_ids -> Not stored yet
  // instagram_account_ids -> Not stored yet
  // dataset_ids -> Not stored yet
}
```

### Array Handling Logic

- **Phone Number IDs:** Appends to array if not already present (deduplication)
- **Catalog IDs:** Appends to array if not already present (deduplication)
- **Business ID:** Overwrites existing value if provided

## Example Requests

### Minimal Request (Required Fields Only)

```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/facebook/exchange-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "code": "AQDxJ8HKj_example_code",
    "waba_id": "25543497612004704",
    "phone_number_id": "935651219628941"
  }'
```

### Complete Request (All Fields)

```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/facebook/exchange-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "code": "AQDxJ8HKj_example_code",
    "waba_id": "25543497612004704",
    "phone_number_id": "935651219628941",
    "business_id": "644860301218731",
    "redirect_uri": "https://your-app.com/oauth/callback",
    "catalog_ids": ["886457576629319"],
    "page_ids": ["123456789"],
    "instagram_account_ids": ["987654321"],
    "dataset_ids": ["111222333"]
  }'
```

### From Client Application (React Example)

```javascript
const exchangeToken = async (oauthData) => {
  try {
    const response = await api.post('/api/v1/whatsapp/facebook/exchange-token', {
      code: oauthData.code,
      waba_id: oauthData.waba_id,
      phone_number_id: oauthData.phone_number_id,
      business_id: oauthData.business_id,
      redirect_uri: oauthData.redirect_uri,
      catalog_ids: oauthData.catalog_ids || [],
      page_ids: oauthData.page_ids || [],
      instagram_account_ids: oauthData.instagram_account_ids || [],
      dataset_ids: oauthData.dataset_ids || []
    });

    if (response.data.type === '1') {
      console.log('Token exchanged successfully:', response.data.data);
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('Token exchange failed:', error);
    throw error;
  }
};
```

## Response Format

### Success Response (200 OK)

```json
{
  "type": "1",
  "message": "Token exchanged and stored successfully",
  "data": {
    "expiresAt": "2025-03-15T10:30:00.000Z",
    "expiresIn": 5184000,
    "wabaId": "25543497612004704",
    "phoneNumberIds": ["935651219628941"],
    "fbBusinessId": "644860301218731",
    "catalogIds": ["886457576629319"],
    "whatsappEnabled": true
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | "1" for success |
| `message` | string | Success message |
| `data.expiresAt` | string | ISO 8601 timestamp when token expires |
| `data.expiresIn` | number | Seconds until token expires (typically 5184000 = 60 days) |
| `data.wabaId` | string | WhatsApp Business Account ID |
| `data.phoneNumberIds` | string[] | Array of phone number IDs associated with the business |
| `data.fbBusinessId` | string | Facebook Business Manager ID (if provided) |
| `data.catalogIds` | string[] | Array of catalog IDs (if provided) |
| `data.whatsappEnabled` | boolean | Always true after successful exchange |

## Error Responses

### Missing Required Fields

**Status:** 400 Bad Request

```json
{
  "type": "3",
  "message": "WABA ID is required"
}
```

```json
{
  "type": "3",
  "message": "Phone number ID is required"
}
```

```json
{
  "type": "3",
  "message": "Authorization code is required"
}
```

### Expired Authorization Code

**Status:** 500 Internal Server Error

```json
{
  "type": "3",
  "message": "Authorization code has expired. Facebook OAuth codes expire after approximately 10 minutes. Please initiate a new OAuth flow to get a fresh authorization code."
}
```

**Solution:** Start a new OAuth flow to get a fresh authorization code.

### Redirect URI Mismatch

**Status:** 500 Internal Server Error

```json
{
  "type": "3",
  "message": "Redirect URI mismatch: The redirect_uri used in the token exchange must exactly match the one used in the OAuth authorization request. Provided redirect_uri: https://wrong-url.com, Environment redirect_uri: https://correct-url.com. Please ensure the redirect_uri parameter in your OAuth authorization URL matches exactly (including protocol, domain, path, and trailing slashes)."
}
```

**Solution:** Ensure the `redirect_uri` parameter exactly matches the one used in the OAuth authorization URL.

### Missing Redirect URI

**Status:** 500 Internal Server Error

```json
{
  "type": "3",
  "message": "Redirect URI is required for OAuth token exchange. Please provide redirect_uri in the request body or set FACEBOOK_REDIRECT_URI environment variable."
}
```

**Solution:** Either provide `redirect_uri` in the request body or set the `FACEBOOK_REDIRECT_URI` environment variable.

### Business Not Found

**Status:** 500 Internal Server Error

```json
{
  "type": "3",
  "message": "Business not found"
}
```

**Solution:** Ensure the subdomain in the JWT token corresponds to an existing business.

### Token Exchange Failed

**Status:** 500 Internal Server Error

```json
{
  "type": "3",
  "message": "Failed to exchange authorization code for access token"
}
```

**Possible Causes:**
- Invalid authorization code
- Code already used
- Network error with Facebook API
- Invalid app credentials

## Complete OAuth Flow

### Step 1: Initiate OAuth Flow

Redirect user to Facebook OAuth URL:

```
https://www.facebook.com/v22.0/dialog/oauth
  ?client_id=YOUR_APP_ID
  &redirect_uri=https://your-app.com/oauth/callback
  &state=RANDOM_STATE_STRING
  &scope=whatsapp_business_messaging,whatsapp_business_management,business_management
```

### Step 2: User Approves Permissions

User is shown Facebook's permission dialog and approves.

### Step 3: Facebook Redirects Back

Facebook redirects to your `redirect_uri` with authorization code:

```
https://your-app.com/oauth/callback
  ?code=AUTHORIZATION_CODE
  &state=RANDOM_STATE_STRING
  &waba_id=25543497612004704
  &phone_number_id=935651219628941
  &business_id=644860301218731
```

### Step 4: Extract OAuth Data

```javascript
// In your OAuth callback handler
const urlParams = new URLSearchParams(window.location.search);
const oauthData = {
  code: urlParams.get('code'),
  waba_id: urlParams.get('waba_id'),
  phone_number_id: urlParams.get('phone_number_id'),
  business_id: urlParams.get('business_id'),
  redirect_uri: 'https://your-app.com/oauth/callback', // Must match!
  // Optional: extract additional parameters
  catalog_ids: urlParams.getAll('catalog_ids'),
  page_ids: urlParams.getAll('page_ids')
};
```

### Step 5: Exchange Token (This Endpoint)

Call this endpoint with the OAuth data:

```javascript
const result = await api.post('/api/v1/whatsapp/facebook/exchange-token', oauthData);
```

### Step 6: Success!

Access token is now securely stored in the database, encrypted at rest.

## Logging

All requests are logged with comprehensive details:

### Request Logging

```javascript
logger.info('Exchange token request received', {
  subDomain: 'customer-subdomain',
  localId: '12345',
  waba_id: '25543497612004704',
  phone_number_id: '935651219628941',
  business_id: '644860301218731',
  catalog_ids: ['886457576629319'],
  page_ids: ['123456789'],
  instagram_account_ids: ['987654321'],
  dataset_ids: ['111222333'],
  hasRedirectUri: true
});
```

### Success Logging

```javascript
logger.info('Successfully exchanged authorization code and stored access token', {
  subDomain: 'customer-subdomain',
  localId: '12345',
  wabaId: '25543497612004704',
  phoneNumberId: '935651219628941',
  businessId: '644860301218731',
  catalogIds: ['886457576629319'],
  expiresAt: '2025-03-15T10:30:00.000Z'
});
```

### Debug Logging

```javascript
// When business_id is updated
logger.debug('Updated Facebook Business ID', {
  business_id: '644860301218731'
});

// When catalog_ids are updated
logger.debug('Updated catalog IDs', {
  providedCatalogIds: ['886457576629319'],
  storedCatalogIds: ['886457576629319', 'existing_catalog_123']
});
```

### Future Implementation Logging

```javascript
// Fields not yet stored in schema
logger.info('Facebook Page IDs received (not stored yet)', {
  page_ids: ['123456789']
});

logger.info('Instagram Account IDs received (not stored yet)', {
  instagram_account_ids: ['987654321']
});

logger.info('Dataset IDs received (not stored yet)', {
  dataset_ids: ['111222333']
});
```

## Security Considerations

### Token Encryption

- Access tokens are automatically encrypted using the Business model's pre-save middleware
- Tokens are encrypted at rest in the database
- Encryption uses the `ENCRYPTION_KEY` environment variable

### Authorization Code Handling

- Authorization codes expire after ~10 minutes
- Codes can only be used once
- Expired codes are detected and return user-friendly error messages

### Redirect URI Validation

- Redirect URI must exactly match the one used in OAuth authorization
- Mismatches are detected and logged with detailed error messages
- Helps prevent authorization code interception attacks

## Environment Variables Required

```bash
# Required
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
ENCRYPTION_KEY=your_encryption_key_for_tokens

# Optional (fallback if not provided in request)
FACEBOOK_REDIRECT_URI=https://your-app.com/oauth/callback
```

## Testing

### Test with cURL

```bash
# Set your JWT token
export JWT_TOKEN="your_jwt_token_here"

# Test token exchange
curl -X POST http://localhost:3000/api/v1/whatsapp/facebook/exchange-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "code": "test_code",
    "waba_id": "25543497612004704",
    "phone_number_id": "935651219628941",
    "business_id": "644860301218731",
    "catalog_ids": ["886457576629319"]
  }'
```

### Test with Node.js

```javascript
const http = require('http');

const exchangeToken = (data) => {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/whatsapp/facebook/exchange-token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'Authorization': `Bearer ${process.env.JWT_TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
};

// Test
exchangeToken({
  code: 'test_code',
  waba_id: '25543497612004704',
  phone_number_id: '935651219628941',
  business_id: '644860301218731',
  catalog_ids: ['886457576629319']
})
  .then(result => console.log('Success:', result))
  .catch(error => console.error('Error:', error));
```

## Troubleshooting

### "Authorization code has expired"

**Cause:** OAuth codes expire after ~10 minutes

**Solution:** Start a new OAuth flow to get a fresh code

### "Redirect URI mismatch"

**Cause:** The `redirect_uri` doesn't match the one used in OAuth authorization

**Solution:**
1. Check that `redirect_uri` in request matches OAuth URL
2. Check for trailing slashes, protocol (http vs https), case sensitivity
3. Set `FACEBOOK_REDIRECT_URI` environment variable as fallback

### "Business not found"

**Cause:** The subdomain in the JWT token doesn't exist

**Solution:** Ensure the user is authenticated with a valid business subdomain

### Token not saving

**Cause:** Pre-save middleware error or validation failure

**Solution:**
1. Check server logs for detailed error messages
2. Ensure `ENCRYPTION_KEY` environment variable is set
3. Verify Business model schema allows the fields being saved

## Summary

The Exchange Token endpoint:

1. ✅ Accepts Facebook OAuth authorization codes
2. ✅ Exchanges codes for access tokens via Facebook API
3. ✅ Encrypts and stores access tokens securely
4. ✅ Updates WABA ID and phone number IDs
5. ✅ Stores Facebook Business Manager ID
6. ✅ Stores catalog IDs (deduplicated array)
7. ✅ Logs page IDs, Instagram IDs, dataset IDs for future use
8. ✅ Sets `whatsappEnabled` to true
9. ✅ Comprehensive error handling and logging
10. ✅ Returns detailed success response with all stored data

**Status:** Production Ready ✅

## Related Documentation

- [META_WEBHOOK_SYSTEM_EXPLAINED.md](META_WEBHOOK_SYSTEM_EXPLAINED.md) - Webhook system overview
- [RESET_META_CREDENTIALS.md](RESET_META_CREDENTIALS.md) - Reset credentials endpoint
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Complete implementation summary

## Change Log

**Latest Update (2024-01-XX):**
- ✅ Added support for `business_id` parameter
- ✅ Added support for `catalog_ids` array (stored in `fbCatalogIds`)
- ✅ Added logging for `page_ids`, `instagram_account_ids`, `dataset_ids` (not stored yet)
- ✅ Now sets `whatsappEnabled: true` on successful exchange
- ✅ Enhanced response to include all stored data
- ✅ Comprehensive logging at all stages
