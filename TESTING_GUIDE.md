# Testing Guide - Meta Credentials & Webhook Management

## Prerequisites

### 1. Server Running
```bash
npm run dev
# Server should be running on http://localhost:3000
```

### 2. Valid JWT Token
You need a valid JWT token for authentication. The test scripts use this token:
```bash
export JWT_TOKEN="your-jwt-token-here"
```

Current token in scripts (expires 2025-02-05):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGU3ZjEwNWVjM2I0YmNhZGRmOTcyZjciLCJpYXQiOjE3NjQ4Nzg1MjMsImV4cCI6MTc2NTQ4MzMyM30.AH3dO8IPGYd_T3wce9o0CVmWrVeDnuMiJzbFct8mOOM
```

### 3. Valid Subdomain
Use a real subdomain from your database. Check with:
```bash
# MongoDB query
use lemenu_db
db.businesses.find({}, { subDomain: 1, businessName: 1, whatsappEnabled: 1 })
```

## Test Scenarios

### Scenario 1: Test Meta Credentials Reset

**Purpose:** Verify the reset endpoint works correctly

**Steps:**

1. **Choose a test business** (one you can safely reset)
   ```bash
   SUBDOMAIN="your-test-subdomain"
   ```

2. **Check current state**
   ```bash
   # Using MongoDB
   db.businesses.findOne({ subDomain: "$SUBDOMAIN" }, {
     whatsappAccessToken: 1,
     whatsappPhoneNumberIds: 1,
     fbCatalogIds: 1,
     whatsappTemplates: 1
   })
   ```

3. **Run reset test**
   ```bash
   # Using bash script
   ./test-reset-meta.sh $SUBDOMAIN

   # OR using Node.js script
   node test-reset-meta.js $SUBDOMAIN
   ```

4. **Verify reset**
   ```bash
   # Check MongoDB again - fields should be cleared
   db.businesses.findOne({ subDomain: "$SUBDOMAIN" })
   ```

**Expected Results:**
- ✅ Status 200 with success message
- ✅ `whatsappAccessToken` removed
- ✅ `whatsappPhoneNumberIds` cleared to []
- ✅ `fbCatalogIds` cleared to []
- ✅ `whatsappEnabled` set to false

### Scenario 2: Test Webhook Field Validation

**Purpose:** Verify strict validation prevents empty fields

**⚠️ Important:** These tests will fail with 404 if the subdomain doesn't exist. This is expected!

**Steps:**

1. **Use a real subdomain with WhatsApp configured**
   ```bash
   SUBDOMAIN="subdomain-with-whatsapp"
   node test-webhook-validation.js $SUBDOMAIN
   ```

2. **Expected test results:**
   - Tests 1-5: Should FAIL with 400 (validation errors)
   - Test 6: Should SUCCEED or FAIL with specific WABA error
   - Tests 7-8: Should FAIL with 400 (validation errors)
   - Test 9: Should SUCCEED or FAIL with specific WABA error
   - Test 10: Should WARN but not fail

**What each test validates:**
- Test 1: Rejects empty fields array ✅
- Test 2: Rejects missing fields property ✅
- Test 3: Rejects non-array fields ✅
- Test 4: Rejects empty strings in fields ✅
- Test 5: Rejects non-string values ✅
- Test 6: Accepts valid subscription (if WABA configured)
- Test 7: Rejects empty fields in update ✅
- Test 8: Rejects missing fields in update ✅
- Test 9: Accepts valid update (if WABA configured)
- Test 10: Warns on unknown fields but doesn't fail

### Scenario 3: Check Webhook Subscriptions

**Purpose:** Verify Meta API response transformation

**Steps:**

1. **Get current subscriptions**
   ```bash
   curl -X GET "http://localhost:3000/api/v1/whatsapp/webhooks/subscriptions?subDomain=$SUBDOMAIN" \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -H "Content-Type: application/json"
   ```

2. **Examine response structure**
   ```json
   {
     "type": "1",
     "message": "Webhook subscriptions retrieved successfully",
     "data": {
       "data": [{
         "id": "app_id",
         "name": "App Name",
         "link": "https://...",
         "subscribed_fields": null,  // ⚠️ This is EXPECTED!
         "_note": "Webhook fields must be configured in Facebook App Dashboard"
       }],
       "_meta": {
         "important": "subscribed_fields are NOT available via this API endpoint",
         "configuration": "Configure webhook fields in Facebook App Dashboard",
         "documentation": "https://developers.facebook.com/..."
       }
     }
   }
   ```

3. **Check server logs**
   Look for these log entries:
   ```
   [WEBHOOK SUBSCRIPTIONS] Raw Meta API response
   [WEBHOOK SUBSCRIPTIONS] Transformed Meta response
   ```

**Expected Results:**
- ✅ Response includes `data` array with apps
- ✅ Each app has `id`, `name`, `link`
- ✅ `subscribed_fields` is explicitly `null`
- ✅ `_note` explains dashboard configuration requirement
- ✅ `_meta` provides documentation links

### Scenario 4: Test Subscribe Endpoint with Validation

**Purpose:** Verify strict validation on subscribe

**⚠️ Warning:** This will fail if WABA is not configured. That's expected!

**Test 1: Try to subscribe with empty fields (should FAIL)**
```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/webhooks/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "{
    \"subDomain\": \"$SUBDOMAIN\",
    \"webhookUrl\": \"https://api.example.com/webhook\",
    \"verifyToken\": \"test_token\",
    \"fields\": []
  }"
```

**Expected:** 400 with error message about empty fields

**Test 2: Try to subscribe with invalid field types (should FAIL)**
```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/webhooks/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "{
    \"subDomain\": \"$SUBDOMAIN\",
    \"webhookUrl\": \"https://api.example.com/webhook\",
    \"verifyToken\": \"test_token\",
    \"fields\": [\"messages\", 123, null]
  }"
```

**Expected:** 400 with error message about non-string fields

**Test 3: Subscribe with valid fields (may fail if WABA not configured)**
```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/webhooks/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "{
    \"subDomain\": \"$SUBDOMAIN\",
    \"webhookUrl\": \"https://api.example.com/webhook\",
    \"verifyToken\": \"test_token\",
    \"fields\": [\"messages\", \"message_template_status_update\"]
  }"
```

**Expected:**
- If WABA configured: 200 success
- If WABA not configured: 400 with specific error about missing configuration

### Scenario 5: Fix Empty Webhook Fields

**Purpose:** Detect and fix existing subscriptions with empty fields

**Steps:**

1. **Check if subscription has empty fields**
   ```bash
   node fix-webhook-fields.js $SUBDOMAIN
   ```

2. **The script will:**
   - ✅ Fetch current subscription
   - ✅ Check if `subscribed_fields` is empty
   - ✅ If empty, update with recommended fields
   - ✅ Verify the update

**Expected Output:**
```
========================================
Webhook Subscription Field Fixer
========================================
Subdomain: your-subdomain

Step 1: Checking current subscription...
✅ Found subscription: App Name (ID: 123456)
   Current subscribed_fields: []

⚠️  WARNING: subscribed_fields is empty!
   Recommended fields: ["messages","message_template_status_update"]

Step 2: Updating subscription with recommended fields...
✅ SUCCESS: Subscription updated!

Step 3: Verifying update...
   New subscribed_fields: ["messages","message_template_status_update"]

✅ ALL DONE! Webhook subscription fields are now configured.
========================================
```

**⚠️ Important Note:**
Even after running this script, **the actual webhook fields must still be configured in Facebook App Dashboard**. This script only updates your local database validation, not Meta's configuration.

## Common Issues

### Issue 1: All Tests Return 404

**Cause:** Subdomain doesn't exist in database

**Solution:**
```bash
# Check available subdomains
db.businesses.find({}, { subDomain: 1 }).pretty()

# Use a valid subdomain
node test-webhook-validation.js <valid-subdomain>
```

### Issue 2: Server Not Running

**Error:** `ECONNREFUSED`

**Solution:**
```bash
npm run dev
# Wait for "Server running on port 3000"
```

### Issue 3: JWT Token Expired

**Error:** `401 Unauthorized`

**Solution:**
```bash
# Generate new token (or get from login)
export JWT_TOKEN="new-token-here"

# Update in test scripts if needed
```

### Issue 4: WABA Not Configured

**Error:** `WABA ID not found` or `WhatsApp access token not found`

**Solution:**
This is expected if WhatsApp is not configured for the subdomain. Use a subdomain that has:
- `whatsappAccessToken` set
- `wabaId` set
- `whatsappEnabled: true`

Check with:
```bash
db.businesses.findOne({ subDomain: "your-subdomain" }, {
  whatsappEnabled: 1,
  wabaId: 1,
  whatsappAccessToken: { $exists: 1 }
})
```

### Issue 5: subscribed_fields is null

**This is NOT an issue!** This is expected behavior.

**Explanation:**
Meta's API does NOT return `subscribed_fields`. See [META_WEBHOOK_SYSTEM_EXPLAINED.md](META_WEBHOOK_SYSTEM_EXPLAINED.md)

## Manual Testing Workflow

### Complete End-to-End Test

1. **Setup Phase**
   ```bash
   # Start server
   npm run dev

   # Set environment
   export JWT_TOKEN="your-token"
   export SUBDOMAIN="test-business"
   ```

2. **Test Reset Endpoint**
   ```bash
   # Reset credentials
   ./test-reset-meta.sh $SUBDOMAIN

   # Verify in MongoDB
   db.businesses.findOne({ subDomain: "$SUBDOMAIN" })
   ```

3. **Test Webhook Validation**
   ```bash
   # Run validation tests
   node test-webhook-validation.js $SUBDOMAIN

   # Check logs for validation messages
   tail -f logs/app.log | grep "WEBHOOK"
   ```

4. **Test Webhook Subscriptions**
   ```bash
   # Get subscriptions
   curl -X GET "http://localhost:3000/api/v1/whatsapp/webhooks/subscriptions?subDomain=$SUBDOMAIN" \
     -H "Authorization: Bearer $JWT_TOKEN"

   # Check response includes _meta and subscribed_fields: null
   ```

5. **Verify Logs**
   ```bash
   # Check for validation logs
   grep "Webhook subscription" logs/app.log

   # Check for Meta API response logs
   grep "WEBHOOK SUBSCRIPTIONS" logs/app.log
   ```

## Production Testing Checklist

Before deploying to production, verify:

- [ ] Reset endpoint works correctly
- [ ] Validation prevents empty fields arrays
- [ ] Validation prevents non-string field values
- [ ] Validation provides helpful error messages
- [ ] Webhook subscriptions return transformed response
- [ ] subscribed_fields is explicitly null
- [ ] _meta object includes documentation links
- [ ] Logs capture all validation attempts
- [ ] Unknown field names trigger warnings (not errors)
- [ ] Service-level validation catches bypassed controller validation

## Quick Reference

### Test Files
```bash
# Reset endpoint tests
./test-reset-meta.sh <subdomain>
node test-reset-meta.js <subdomain>

# Validation tests
node test-webhook-validation.js <subdomain>

# Fix helper
node fix-webhook-fields.js <subdomain>
```

### Documentation
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Complete overview
- [META_WEBHOOK_SYSTEM_EXPLAINED.md](META_WEBHOOK_SYSTEM_EXPLAINED.md) - How Meta webhooks work
- [WEBHOOK_FIELD_VALIDATION.md](WEBHOOK_FIELD_VALIDATION.md) - Validation details
- [RESET_META_CREDENTIALS.md](RESET_META_CREDENTIALS.md) - Reset endpoint docs

### Key Endpoints
```
POST   /api/v1/business/:subDomain/reset-meta-credentials
GET    /api/v1/whatsapp/webhooks/subscriptions?subDomain=<subdomain>
POST   /api/v1/whatsapp/webhooks/subscribe
PUT    /api/v1/whatsapp/webhooks/subscriptions
DELETE /api/v1/whatsapp/webhooks/subscriptions/:appId
```

## Success Criteria

Your implementation is working correctly when:

1. ✅ Reset endpoint successfully clears Meta credentials
2. ✅ Validation rejects empty fields arrays with clear error messages
3. ✅ Validation rejects non-string field values
4. ✅ Webhook subscriptions return `subscribed_fields: null` (not missing, explicitly null)
5. ✅ Response includes `_meta` object with documentation links
6. ✅ Logs show validation attempts and Meta API responses
7. ✅ Unknown field names log warnings but don't fail requests
8. ✅ Client understands that webhook fields must be configured in dashboard

**Status: Ready for Testing** ✅
