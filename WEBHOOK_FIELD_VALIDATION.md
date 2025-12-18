# Webhook Field Validation - Implementation Guide

## Overview

Strict validation has been implemented to prevent empty `subscribed_fields` in webhook subscriptions. This ensures that webhook subscriptions always have at least one active field, preventing the issue where subscriptions exist but no events are received.

## Problem Statement

**Before:** It was possible to create webhook subscriptions with empty `subscribed_fields`:
```json
{
  "id": "123456",
  "name": "My App",
  "subscribed_fields": []  // ❌ Empty - no events will be received!
}
```

**After:** The system now enforces that `subscribed_fields` must always contain at least one valid field.

## Validation Layers

### Layer 1: Controller Validation ([metaWhatsAppController.ts](src/controllers/metaWhatsAppController.ts))

**Location:** Lines 927-1020 (subscribe), 1026-1119 (update)

**Checks:**
1. ✅ Fields parameter exists
2. ✅ Fields is an array type
3. ✅ Fields array is not empty
4. ✅ All field values are non-empty strings
5. ✅ Field names are from known valid set (warns on unknown)
6. ✅ Recommends essential fields if missing

**Example Error Responses:**

```json
// Empty array
{
  "type": "3",
  "message": "Fields array cannot be empty. You must subscribe to at least one webhook field. Recommended fields: [\"messages\", \"message_template_status_update\"]"
}

// Invalid types
{
  "type": "3",
  "message": "All fields must be non-empty strings. Invalid fields found: [123, null]"
}

// Not an array
{
  "type": "3",
  "message": "Fields must be an array"
}
```

### Layer 2: Service Validation ([metaWhatsAppService.ts](src/services/whatsapp/metaWhatsAppService.ts))

**Location:** Lines 2580-2607 (subscribe), 2661-2688 (update)

**Additional Protection:**
- Second layer of defense in case controller validation is bypassed
- Logs validation failures with detailed context
- Returns structured error responses

**Example Service Error:**

```json
{
  "success": false,
  "error": "Fields array cannot be empty. At least one webhook field is required."
}
```

## Valid Field Names

The following webhook field names are recognized and validated:

### Essential Fields (Recommended)
- ✅ `messages` - Incoming customer messages
- ✅ `message_template_status_update` - Template approval/rejection

### Additional Fields
- `messaging_postbacks` - Button/quick reply responses
- `messaging_optins` - User opt-in events
- `message_deliveries` - Delivery confirmations
- `message_reads` - Read receipts
- `messaging_referrals` - Referral tracking
- `messaging_account_linking` - Account linking events
- `account_update` - Account policy violations
- `phone_number_name_update` - Phone number name changes
- `phone_number_quality_update` - Phone number quality changes
- `template_category_update` - Template category changes

### Unknown Fields
If you provide a field name not in the list above:
- ⚠️ A warning will be logged
- ✅ The request will NOT fail
- 📝 Reason: Meta may introduce new fields in the future

## API Endpoints

### POST /api/v1/whatsapp/webhooks/subscribe

**Before (would succeed with empty fields):**
```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/webhooks/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "webhookUrl": "https://api.example.com/webhook",
    "verifyToken": "secret",
    "fields": []  // ❌ This would create empty subscription!
  }'
```

**After (strict validation):**
```bash
# ❌ FAILS with validation error
curl -X POST http://localhost:3000/api/v1/whatsapp/webhooks/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "webhookUrl": "https://api.example.com/webhook",
    "verifyToken": "secret",
    "fields": []
  }'

# Response:
{
  "type": "3",
  "message": "Fields array cannot be empty. You must subscribe to at least one webhook field. Recommended fields: [\"messages\", \"message_template_status_update\"]"
}
```

**Correct Usage:**
```bash
# ✅ SUCCEEDS
curl -X POST http://localhost:3000/api/v1/whatsapp/webhooks/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "webhookUrl": "https://api.example.com/webhook",
    "verifyToken": "secret",
    "fields": ["messages", "message_template_status_update"]
  }'
```

### PUT /api/v1/whatsapp/webhooks/subscriptions

**Update Endpoint Validation:**

```bash
# ❌ FAILS - Cannot update to empty fields
curl -X PUT http://localhost:3000/api/v1/whatsapp/webhooks/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "subDomain": "my-business",
    "fields": []
  }'

# Response:
{
  "type": "3",
  "message": "Fields array cannot be empty. You must subscribe to at least one webhook field. To unsubscribe completely, use DELETE /api/v1/whatsapp/webhooks/subscriptions/:appId instead. Recommended fields: [\"messages\", \"message_template_status_update\"]"
}
```

**To Completely Unsubscribe:**
Use the DELETE endpoint instead:
```bash
curl -X DELETE http://localhost:3000/api/v1/whatsapp/webhooks/subscriptions/APP_ID \
  -H "Authorization: Bearer TOKEN"
```

## Testing

### Run Automated Tests

```bash
node test-webhook-validation.js <subdomain>
```

**Test Coverage:**
- ✅ Empty fields array
- ✅ Missing fields property
- ✅ Fields is not an array
- ✅ Fields contains empty strings
- ✅ Fields contains non-string values
- ✅ Valid subscription
- ✅ Update with empty fields
- ✅ Update with missing fields
- ✅ Update with valid fields
- ✅ Unknown field names

### Manual Testing

**Test 1: Try to subscribe with empty fields**
```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/webhooks/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "subDomain": "test",
    "webhookUrl": "https://example.com/webhook",
    "verifyToken": "token",
    "fields": []
  }'

# Expected: 400 Bad Request with validation error
```

**Test 2: Try to subscribe with invalid field types**
```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/webhooks/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "subDomain": "test",
    "webhookUrl": "https://example.com/webhook",
    "verifyToken": "token",
    "fields": ["messages", 123, null]
  }'

# Expected: 400 Bad Request - "All fields must be non-empty strings"
```

**Test 3: Valid subscription**
```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/webhooks/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "subDomain": "test",
    "webhookUrl": "https://example.com/webhook",
    "verifyToken": "token",
    "fields": ["messages", "message_template_status_update"]
  }'

# Expected: 200 OK (or 400 if WABA not configured)
```

## Logging

All validation failures are logged with detailed context:

**Controller Level:**
```javascript
logger.warn('Webhook subscription missing essential fields', {
  subDomain: 'my-business',
  providedFields: ['messaging_postbacks'],
  recommendedFields: ['messages', 'message_template_status_update']
});
```

**Service Level:**
```javascript
logger.error('[WEBHOOK SUBSCRIPTION] Validation failed', {
  subDomain: 'my-business',
  error: 'Fields array cannot be empty',
  providedFields: []
});
```

## Migration Guide

### If You Have Existing Empty Subscriptions

**Step 1: Check current subscriptions**
```bash
curl -X GET "http://localhost:3000/api/v1/whatsapp/webhooks/subscriptions?subDomain=YOUR_SUBDOMAIN" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Step 2: If `subscribed_fields` is empty, update it**
```bash
curl -X PUT http://localhost:3000/api/v1/whatsapp/webhooks/subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "subDomain": "YOUR_SUBDOMAIN",
    "fields": ["messages", "message_template_status_update"]
  }'
```

**Step 3: Verify the update**
```bash
curl -X GET "http://localhost:3000/api/v1/whatsapp/webhooks/subscriptions?subDomain=YOUR_SUBDOMAIN" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Use the Fix Script

A helper script is provided:
```bash
node fix-webhook-fields.js YOUR_SUBDOMAIN
```

This will:
- Check if subscribed_fields is empty
- Automatically update with recommended fields
- Verify the update succeeded

## Benefits

### Before Validation
- ❌ Could create subscriptions with no fields
- ❌ Subscription exists but no events received
- ❌ Confusing debugging experience
- ❌ Silent failures

### After Validation
- ✅ Cannot create empty field subscriptions
- ✅ Clear error messages guide users
- ✅ Recommended fields suggested
- ✅ Comprehensive logging for debugging
- ✅ Two-layer validation (controller + service)
- ✅ Type safety for field values

## Error Messages Reference

| Scenario | Error Message |
|----------|---------------|
| Empty array | `Fields array cannot be empty. You must subscribe to at least one webhook field. Recommended fields: ["messages", "message_template_status_update"]` |
| Missing fields | `Missing required field: fields` |
| Not an array | `Fields must be an array` |
| Empty strings | `All fields must be non-empty strings. Invalid fields found: [""]` |
| Invalid types | `All fields must be non-empty strings. Invalid fields found: [123, null]` |
| Update to empty | `Fields array cannot be empty. To unsubscribe completely, use DELETE /api/v1/whatsapp/webhooks/subscriptions/:appId instead.` |

## Files Modified

| File | Lines | Changes |
|------|-------|---------|
| [metaWhatsAppController.ts](src/controllers/metaWhatsAppController.ts) | 927-1020 | Added strict validation to subscribeWebhook |
| [metaWhatsAppController.ts](src/controllers/metaWhatsAppController.ts) | 1026-1119 | Added strict validation to updateWebhookSubscription |
| [metaWhatsAppService.ts](src/services/whatsapp/metaWhatsAppService.ts) | 2580-2607 | Added service-level validation to subscribeWebhook |
| [metaWhatsAppService.ts](src/services/whatsapp/metaWhatsAppService.ts) | 2661-2688 | Added service-level validation to updateWebhookSubscription |

## Related Documentation

- [WEBHOOK_SUBSCRIPTION_ARCHITECTURE.md](WEBHOOK_SUBSCRIPTION_ARCHITECTURE.md) - Complete webhook subscription flow
- [fix-webhook-fields.js](fix-webhook-fields.js) - Helper script to fix empty subscriptions
- [test-webhook-validation.js](test-webhook-validation.js) - Automated validation tests

## Summary

With strict validation now enforced:
1. ✅ All webhook subscriptions MUST have at least one field
2. ✅ All fields MUST be non-empty strings
3. ✅ Clear error messages guide proper usage
4. ✅ Unknown field names logged but don't fail (future-proof)
5. ✅ Two validation layers provide defense in depth
6. ✅ Comprehensive logging aids debugging

**Result:** No more empty `subscribed_fields` causing silent webhook failures! 🎉
