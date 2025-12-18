# Debugging Webhook Subscription Response

## Issue

Client is receiving:
```javascript
{
  application: 'https://ava-whatsapp-agent-production.up.railway.app/whatsapp_response'
}
```

Instead of expected format with `subscribed_fields`.

## Root Cause

Meta's WhatsApp Business Account (WABA) `/{waba-id}/subscribed_apps` endpoint can return different response structures depending on:
1. API version
2. Whether app is subscribed or not
3. Type of subscription

## Expected vs Actual Response

### Expected (Standard Format)
```json
{
  "data": [
    {
      "link": "https://example.com",
      "name": "My App",
      "id": "123456",
      "subscribed_fields": ["messages", "message_template_status_update"]
    }
  ]
}
```

### Actual (Alternative Format)
```json
{
  "application": "https://ava-whatsapp-agent-production.up.railway.app/whatsapp_response"
  // Missing subscribed_fields!
}
```

## Solution Implemented

The code has been updated in [metaWhatsAppService.ts:2544-2626](src/services/whatsapp/metaWhatsAppService.ts#L2544-L2626) to:

1. **Log raw API response** for debugging
2. **Detect response format** (standard vs alternative)
3. **Transform to standard format** if needed
4. **Handle missing fields** gracefully

### Transformation Logic

```typescript
if (rawResponse?.application) {
  // Alternative format detected - transform it
  const transformedResponse = {
    data: [{
      link: rawResponse.application,
      name: rawResponse.application,
      id: rawResponse.id || 'unknown',
      subscribed_fields: rawResponse.subscribed_fields || []  // Will be empty if not present
    }]
  };
  return transformedResponse;
}
```

## How to Debug

### Step 1: Check Server Logs

After the code update, when you call GET `/api/v1/whatsapp/webhooks/subscriptions`, look for these log entries:

```
[WEBHOOK SUBSCRIPTIONS] Raw Meta API response
  - responseType: object
  - responseKeys: ['application'] or ['data']
  - hasData: true/false
  - fullResponse: {...}
```

### Step 2: Check What Meta Returns

The logs will show exactly what Meta's API returned, which helps us understand:
- Is `subscribed_fields` in the response?
- Is the response in alternative format?
- Are we calling the right endpoint?

### Step 3: Verify Transformation

If alternative format is detected, you'll see:
```
[WEBHOOK SUBSCRIPTIONS] Alternative format detected
  - application: https://...
  - hasWhatsappData: true/false

[WEBHOOK SUBSCRIPTIONS] Transformed response
  - original: {...}
  - transformed: {...}
```

## Possible Reasons for Missing subscribed_fields

### 1. Subscription Has No Fields

The app is subscribed but with empty `subscribed_fields` array:
```json
{
  "data": [{
    "id": "...",
    "subscribed_fields": []  // EMPTY!
  }]
}
```

**Fix:** Use the update endpoint to add fields:
```bash
curl -X PUT http://localhost:3000/api/v1/whatsapp/webhooks/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "subDomain": "your-subdomain",
    "fields": ["messages", "message_template_status_update"]
  }'
```

### 2. Using Wrong Endpoint

There are two different webhook systems in Meta:

**App-level Webhooks** (`/{app-id}/subscriptions`):
- For Facebook Pages, Users, Permissions, Payments
- NOT for WhatsApp!

**WABA-level Webhooks** (`/{waba-id}/subscribed_apps`):
- For WhatsApp Business API
- This is what we use ✅

Make sure you're using the correct WABA ID.

### 3. Different API Version

Meta Graph API versions return different structures. Current code uses `v22.0`.

Check which version your WABA uses:
```javascript
const META_API_BASE_URL = 'https://graph.facebook.com/v22.0';
```

### 4. App Not Subscribed

The app might not be subscribed at all. Check Meta Developer Console:
1. Go to Meta Developer Portal
2. Your App → WhatsApp → Configuration
3. Check "Webhook fields"

## Next Steps

### If subscribed_fields is Empty

Run the fix script:
```bash
node fix-webhook-fields.js <subdomain>
```

This will:
1. Check current subscription
2. Detect empty fields
3. Update with recommended fields
4. Verify update succeeded

### If Still Not Working

1. **Check server logs** for the raw API response
2. **Verify WABA ID** is correct
3. **Check Meta Developer Portal** webhook configuration
4. **Try manual API call** to Meta:
   ```bash
   curl "https://graph.facebook.com/v22.0/{WABA_ID}/subscribed_apps" \
     -H "Authorization: Bearer {ACCESS_TOKEN}"
   ```

## Client-Side Handling

Your React client should handle both formats:

```javascript
// In your WebhooksConfig component
const handleWebhookData = (response) => {
  // response.data.data is the array of subscribed apps
  const apps = response?.data?.data || [];

  if (apps.length === 0) {
    console.warn('No subscribed apps found');
    return [];
  }

  return apps.map(app => ({
    id: app.id,
    name: app.name || app.link,
    link: app.link || app.application,
    subscribedFields: app.subscribed_fields || [],
    isEmpty: !app.subscribed_fields || app.subscribed_fields.length === 0
  }));
};

// Usage
const webhooks = handleWebhookData(apiResponse);
webhooks.forEach(webhook => {
  if (webhook.isEmpty) {
    console.warn(`Webhook ${webhook.name} has no subscribed fields!`);
    // Show warning to user
    // Offer to fix it
  }
});
```

## Testing

### Test 1: Get Current Subscriptions
```bash
curl -X GET "http://localhost:3000/api/v1/whatsapp/webhooks/subscriptions?subDomain=YOUR_SUBDOMAIN" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 2: Check Response Format
```bash
# Should see in logs:
[WEBHOOK SUBSCRIPTIONS] Raw Meta API response
{
  responseKeys: ['data'] or ['application']
}
```

### Test 3: Update Fields If Empty
```bash
curl -X PUT http://localhost:3000/api/v1/whatsapp/webhooks/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "subDomain": "YOUR_SUBDOMAIN",
    "fields": ["messages", "message_template_status_update"]
  }'
```

### Test 4: Verify Fields Appear
```bash
# GET again and check subscribed_fields is populated
curl -X GET "http://localhost:3000/api/v1/whatsapp/webhooks/subscriptions?subDomain=YOUR_SUBDOMAIN" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Summary

The code now:
- ✅ Logs raw Meta API response for debugging
- ✅ Detects and handles alternative response formats
- ✅ Transforms to consistent format
- ✅ Returns `subscribed_fields` even if empty
- ✅ Warns when fields are missing

Check your server logs after calling the endpoint to see exactly what Meta is returning!

## Sources

- [Subscribe App to WhatsApp Business Account (Postman)](https://www.postman.com/meta/whatsapp-business-platform/request/0yubu4i/subscribe-app-to-whatsapp-business-account)
- [WhatsApp Cloud API Documentation (Postman)](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api)
- [Subscribe app to WABA's webhooks (Postman)](https://www.postman.com/meta/whatsapp-business-platform/request/ju40fld/subscribe-app-to-waba-s-webhooks)
