# WhatsApp API Implementation vs OpenAPI Spec Comparison

## Executive Summary

This document compares the actual implementation of WhatsApp endpoints against the OpenAPI specification to identify gaps and discrepancies.

**Status:** ⚠️ **Incomplete** - Core messaging endpoints are implemented but missing from OpenAPI spec. Product messaging and conversation window endpoints are missing from both.

---

## 1. Implemented Endpoints (Code)

### ✅ Core Messaging Endpoints

| Endpoint | Method | Route | Controller | Service | Status |
|---------|--------|-------|------------|---------|--------|
| Send Text Message | POST | `/api/v1/whatsapp/send-message` | `sendTextMessage` | `MetaWhatsAppService.sendTextMessage` | ✅ Implemented |
| Send Template Message | POST | `/api/v1/whatsapp/send-template` | `sendTemplateMessage` | `MetaWhatsAppService.sendTemplateMessage` | ✅ Implemented |
| Send Interactive Message | POST | `/api/v1/whatsapp/send-interactive` | `sendInteractiveMessage` | `MetaWhatsAppService.sendInteractiveMessage` | ✅ Implemented |
| Send Media Message | POST | `/api/v1/whatsapp/send-media` | `sendMediaMessage` | `MetaWhatsAppService.sendMediaMessage` | ✅ Implemented |

### ✅ Message Management

| Endpoint | Method | Route | Controller | Service | Status |
|---------|--------|-------|------------|---------|--------|
| Mark Message as Read | POST | `/api/v1/whatsapp/messages/:messageId/read` | `markMessageAsRead` | `MetaWhatsAppService.markMessageAsRead` | ✅ Implemented |

### ✅ Template Management

| Endpoint | Method | Route | Controller | Service | Status |
|---------|--------|-------|------------|---------|--------|
| Get Templates | GET | `/api/v1/whatsapp/templates` | `getTemplates` | `MetaWhatsAppService.getTemplates` | ✅ Implemented |
| Create Template | POST | `/api/v1/whatsapp/templates` | `createTemplate` | Direct fetch (not via makeApiCall) | ✅ Implemented |
| Get Template Status | GET | `/api/v1/whatsapp/templates/:templateName/status` | `getTemplateStatus` | `MetaWhatsAppService.getTemplateStatus` | ✅ Implemented |
| Delete Template | DELETE | `/api/v1/whatsapp/templates/:templateName` | `deleteTemplate` | Direct fetch | ✅ Implemented |
| Provision Templates | POST | `/api/v1/whatsapp/templates/provision` | `provisionTemplates` | `MetaWhatsAppService.provisionTemplates` | ✅ Implemented |
| Check Template Statuses | GET | `/api/v1/whatsapp/templates/statuses` | `checkTemplateStatuses` | `MetaWhatsAppService.checkTemplateStatuses` | ✅ Implemented |

### ✅ Phone Number Management

| Endpoint | Method | Route | Controller | Service | Status |
|---------|--------|-------|------------|---------|--------|
| Get Phone Numbers | GET | `/api/v1/whatsapp/phone-numbers` | `getPhoneNumbers` | `MetaWhatsAppService.getPhoneNumbers` | ✅ Implemented |
| Get Phone Number Details | GET | `/api/v1/whatsapp/phone-numbers/:phoneNumberId` | `getPhoneNumberDetails` | Direct fetch | ✅ Implemented |
| Check Two-Step Verification | GET | `/api/v1/whatsapp/phone-numbers/:phoneNumberId/two-step` | `checkTwoStepVerification` | Direct fetch | ✅ Implemented |
| Disable Two-Step Verification | POST | `/api/v1/whatsapp/phone-numbers/:phoneNumberId/two-step/disable` | `disableTwoStepVerification` | Direct fetch | ✅ Implemented |
| Verify Phone Number | POST | `/api/v1/whatsapp/phone-numbers/:phoneNumberId/verify` | `verifyPhoneNumber` | `MetaWhatsAppService.verifyPhoneNumber` | ✅ Implemented |

### ✅ Health & Setup

| Endpoint | Method | Route | Controller | Service | Status |
|---------|--------|-------|------------|---------|--------|
| Health Check | GET | `/api/v1/whatsapp/health` | `checkHealth` | `MetaWhatsAppService.checkHealth` | ✅ Implemented |
| Validate Setup | GET | `/api/v1/whatsapp/setup/validate` | `validateSetup` | `MetaWhatsAppService.validateSetup` | ✅ Implemented |
| Get Account Status | GET | `/api/v1/whatsapp/account/status` | `getAccountStatus` | `MetaWhatsAppService.getAccountStatus` | ✅ Implemented |

### ✅ Migration

| Endpoint | Method | Route | Controller | Service | Status |
|---------|--------|-------|------------|---------|--------|
| Validate Migration | POST | `/api/v1/whatsapp/migrate/validate` | `validateMigration` | `MetaWhatsAppService.validateMigration` | ✅ Implemented |
| Execute Migration | POST | `/api/v1/whatsapp/migrate/execute` | `executeMigration` | `MetaWhatsAppService.executeMigration` | ✅ Implemented |
| Get Migration Status | GET | `/api/v1/whatsapp/migrate/status` | `getMigrationStatus` | `MetaWhatsAppService.getMigrationStatus` | ✅ Implemented |
| Rollback Migration | POST | `/api/v1/whatsapp/migrate/rollback` | `rollbackMigration` | `MetaWhatsAppService.rollbackMigration` | ✅ Implemented |

### ✅ Webhook Management

| Endpoint | Method | Route | Controller | Service | Status |
|---------|--------|-------|------------|---------|--------|
| Get Webhook Subscriptions | GET | `/api/v1/whatsapp/webhooks/subscriptions` | `getWebhookSubscriptions` | `MetaWhatsAppService.getWebhookSubscriptions` | ✅ Implemented |
| Subscribe Webhook | POST | `/api/v1/whatsapp/webhooks/subscribe` | `subscribeWebhook` | `MetaWhatsAppService.subscribeWebhook` | ✅ Implemented |
| Update Webhook Subscription | PUT | `/api/v1/whatsapp/webhooks/subscriptions` | `updateWebhookSubscription` | `MetaWhatsAppService.updateWebhookSubscription` | ✅ Implemented |
| Delete Webhook Subscription | DELETE | `/api/v1/whatsapp/webhooks/subscriptions/:appId` | `deleteWebhookSubscription` | `MetaWhatsAppService.deleteWebhookSubscription` | ✅ Implemented |
| Webhook Handler | POST/GET | `/api/v1/whatsapp/webhook` | `handleWebhook` | `MetaWhatsAppWebhookService` | ✅ Implemented |

---

## 2. OpenAPI Spec Endpoints

### ✅ Documented in OpenAPI Spec

| Endpoint | Method | Route | Status |
|---------|--------|-------|--------|
| Health Check | GET | `/whatsapp/health` | ✅ Documented |
| Validate Setup | GET | `/whatsapp/setup/validate` | ✅ Documented |
| Get Account Status | GET | `/whatsapp/account/status` | ✅ Documented |
| Validate Migration | POST | `/whatsapp/migrate/validate` | ✅ Documented |
| Execute Migration | POST | `/whatsapp/migrate/execute` | ✅ Documented |
| Get Migration Status | GET | `/whatsapp/migrate/status` | ✅ Documented |
| Rollback Migration | POST | `/whatsapp/migrate/rollback` | ✅ Documented |
| Get Phone Number Details | GET | `/whatsapp/phone-numbers/{phoneNumberId}` | ✅ Documented |
| Check Two-Step Verification | GET | `/whatsapp/phone-numbers/{phoneNumberId}/two-step` | ✅ Documented |
| Disable Two-Step Verification | POST | `/whatsapp/phone-numbers/{phoneNumberId}/two-step/disable` | ✅ Documented |
| Verify Phone Number | POST | `/whatsapp/phone-numbers/{phoneNumberId}/verify` | ✅ Documented |
| Get Webhook Subscriptions | GET | `/whatsapp/webhooks/subscriptions` | ✅ Documented |
| Subscribe Webhook | POST | `/whatsapp/webhooks/subscribe` | ✅ Documented |
| Update Webhook Subscription | PUT | `/whatsapp/webhooks/subscriptions` | ✅ Documented |
| Delete Webhook Subscription | DELETE | `/whatsapp/webhooks/subscriptions/{appId}` | ✅ Documented |

### ❌ Missing from OpenAPI Spec

The following **implemented** endpoints are **NOT documented** in the OpenAPI spec:

1. **POST** `/whatsapp/send-message` - Send text message
2. **POST** `/whatsapp/send-template` - Send template message
3. **POST** `/whatsapp/send-interactive` - Send interactive message
4. **POST** `/whatsapp/send-media` - Send media message
5. **POST** `/whatsapp/messages/{messageId}/read` - Mark message as read
6. **GET** `/whatsapp/templates` - Get message templates
7. **GET** `/whatsapp/phone-numbers` - Get phone numbers (list)
8. **POST** `/whatsapp/templates` - Create template
9. **GET** `/whatsapp/templates/{templateName}/status` - Get template status
10. **DELETE** `/whatsapp/templates/{templateName}` - Delete template
11. **POST** `/whatsapp/templates/provision` - Provision templates
12. **GET** `/whatsapp/templates/statuses` - Check template statuses
13. **POST/GET** `/whatsapp/webhook` - Webhook handler (incoming messages)

---

## 3. Missing Endpoints (Not Implemented)

The following endpoints are **expected** (based on documentation) but **NOT implemented**:

### ❌ Product Messaging

| Endpoint | Method | Expected Route | Status | Notes |
|---------|--------|----------------|--------|-------|
| Send Product Message | POST | `/api/v1/whatsapp/send-product` | ❌ Not Implemented | Meta API supports product messages via interactive messages with `type: 'product'` |
| Send Product List Message | POST | `/api/v1/whatsapp/send-product-list` | ❌ Not Implemented | Meta API supports product list via interactive messages with `type: 'product_list'` |

**Note:** The service layer (`MetaWhatsAppService`) and models support product/product_list types in interactive messages, but there are no dedicated controller endpoints for them.

### ❌ Conversation Management

| Endpoint | Method | Expected Route | Status | Notes |
|---------|--------|----------------|--------|-------|
| Check Conversation Window | GET | `/api/v1/whatsapp/conversations/{phone}/window` | ❌ Not Implemented | Need to check if 24-hour window is active for a phone number |

**Note:** The codebase has conversation state management (`ConversationStateManager`) with 24-hour expiration logic, but no API endpoint to check the conversation window status.

---

## 4. Implementation Details

### Service Layer Support

The `MetaWhatsAppService` and models **do support** product messages:

- **Models:** `IInteractiveMessage` type includes `'product' | 'product_list'` in `src/models/WhatsApp.ts:154`
- **Types:** `InteractiveMessage` interface supports product types in `src/types/whatsapp.ts:90`
- **Schema:** `InteractiveActionSchema` includes `catalogId` and `productRetailerId` fields

However, there are **no dedicated controller methods** to send product messages. They would need to be sent via the `send-interactive` endpoint with the appropriate type.

### Conversation Window Logic

The codebase has:
- `ConversationStateManager` with 24-hour expiration (`expirationHours = 24`)
- Conversation state tracking with `expiresAt` field
- Automatic expiration checking in `getOrCreate` method

But there's **no API endpoint** to:
- Check if a conversation window is open for a phone number
- Get the expiration time for a conversation
- Manually check window status before sending messages

---

## 5. Recommendations

### Priority 1: Add Missing Endpoints to OpenAPI Spec

**Action:** Document all implemented messaging endpoints in the OpenAPI spec:

1. Add `POST /whatsapp/send-message`
2. Add `POST /whatsapp/send-template`
3. Add `POST /whatsapp/send-interactive`
4. Add `POST /whatsapp/send-media`
5. Add `POST /whatsapp/messages/{messageId}/read`
6. Add `GET /whatsapp/templates`
7. Add `GET /whatsapp/phone-numbers` (list endpoint)
8. Add template management endpoints
9. Add webhook handler endpoint

**Impact:** High - These are core functionality endpoints that clients need to use.

### Priority 2: Implement Product Message Endpoints

**Action:** Create dedicated endpoints for product messaging:

1. **POST** `/api/v1/whatsapp/send-product`
   - Controller: `sendProductMessage`
   - Service: `MetaWhatsAppService.sendProductMessage`
   - Parameters: `to`, `catalogId`, `productRetailerId`, `body`, `footer`, `header`

2. **POST** `/api/v1/whatsapp/send-product-list`
   - Controller: `sendProductListMessage`
   - Service: `MetaWhatsAppService.sendProductListMessage`
   - Parameters: `to`, `catalogId`, `sections`, `body`, `footer`, `header`

**Note:** These can leverage existing `sendInteractiveMessage` logic with `type: 'product'` or `type: 'product_list'`.

**Impact:** Medium - Useful for e-commerce/restaurant product catalogs.

### Priority 3: Implement Conversation Window Endpoint

**Action:** Create endpoint to check conversation window status:

1. **GET** `/api/v1/whatsapp/conversations/{phone}/window`
   - Controller: `checkConversationWindow`
   - Service: `MetaWhatsAppService.checkConversationWindow`
   - Returns: `{ isOpen: boolean, expiresAt: Date, timeRemaining: number }`

**Implementation:**
```typescript
static async checkConversationWindow(
  subDomain: string,
  phone: string,
  localId?: string
): Promise<{
  isOpen: boolean;
  expiresAt?: Date;
  timeRemaining?: number; // milliseconds
}> {
  // Check if there's an active conversation state
  // Check if within 24-hour window
  // Return status
}
```

**Impact:** Medium - Helps clients know when they can send free-form messages vs templates.

---

## 6. Summary Table

| Category | Implemented | In OpenAPI Spec | Missing from Spec | Missing Implementation |
|----------|-------------|----------------|-------------------|----------------------|
| Core Messaging | ✅ 4/4 | ❌ 0/4 | 4 endpoints | 0 endpoints |
| Message Management | ✅ 1/1 | ❌ 0/1 | 1 endpoint | 0 endpoints |
| Template Management | ✅ 6/6 | ❌ 0/6 | 6 endpoints | 0 endpoints |
| Phone Number Management | ✅ 5/5 | ✅ 4/5 | 1 endpoint | 0 endpoints |
| Health & Setup | ✅ 3/3 | ✅ 3/3 | 0 endpoints | 0 endpoints |
| Migration | ✅ 4/4 | ✅ 4/4 | 0 endpoints | 0 endpoints |
| Webhook Management | ✅ 5/5 | ✅ 4/5 | 1 endpoint | 0 endpoints |
| Product Messaging | ❌ 0/2 | ❌ 0/2 | 0 endpoints | 2 endpoints |
| Conversation Window | ❌ 0/1 | ❌ 0/1 | 0 endpoints | 1 endpoint |
| **TOTAL** | **29/33** | **19/33** | **13 endpoints** | **3 endpoints** |

---

## 7. Next Steps

1. ✅ **Immediate:** Add all implemented messaging endpoints to OpenAPI spec
2. ⚠️ **Short-term:** Implement product message endpoints
3. ⚠️ **Short-term:** Implement conversation window check endpoint
4. 📝 **Documentation:** Update API documentation with new endpoints
5. 🧪 **Testing:** Add integration tests for new endpoints

---

## 8. Files to Update

### OpenAPI Spec
- `docs/swagger-openapi3.yaml` - Add missing endpoint definitions

### Implementation
- `src/controllers/metaWhatsAppController.ts` - Add product message controllers
- `src/services/whatsapp/metaWhatsAppService.ts` - Add product message and conversation window methods
- `src/routes/metaWhatsAppRoute.ts` - Add new routes

### Documentation
- `docs/whatsapp-api-client-integration.md` - Update with new endpoints
- `API.md` - Add new endpoints to API reference

---

**Last Updated:** 2025-01-09
**Status:** ⚠️ Needs attention - Core endpoints missing from spec, product/conversation endpoints missing from implementation

