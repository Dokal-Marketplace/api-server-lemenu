# WhatsApp API Endpoints - Complete Reference Guide

## Base URL

All endpoints are prefixed with: `/api/v1/whatsapp`

## Authentication

Most endpoints require JWT authentication via Bearer token:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Exceptions:** Webhook endpoints and template library endpoints don't require authentication.

---

## Table of Contents

1. [Messaging Endpoints](#messaging-endpoints)
2. [Template Management](#template-management)
3. [Template Library](#template-library)
4. [Phone Number Management](#phone-number-management)
5. [Webhook Management](#webhook-management)
6. [OAuth & Authentication](#oauth--authentication)
7. [Health & Setup](#health--setup)
8. [Migration](#migration)
9. [Webhook Handler](#webhook-handler)

---

## Messaging Endpoints

### 1. Send Text Message

**Endpoint:** `POST /api/v1/whatsapp/send-message`

**Auth:** ✅ Required

**Request Body:**
```json
{
  "to": "15551234567",
  "text": "Hello, this is a test message!",
  "previewUrl": true
}
```

**Required Fields:**
- `to` (string) - Recipient phone number in E.164 format (e.g., +1234567890)
- `text` (string) - Message text

**Optional Fields:**
- `previewUrl` (boolean) - Enable URL preview (default: false)

**Response:**
```json
{
  "type": "1",
  "message": "Message sent successfully",
  "data": {
    "messageId": "wamid.abc123..."
  }
}
```

---

### 2. Send Template Message

**Endpoint:** `POST /api/v1/whatsapp/send-template`

**Auth:** ✅ Required

**Request Body:**
```json
{
  "to": "15551234567",
  "templateName": "order_confirmation",
  "languageCode": "en_US",
  "parameters": ["#12345", "January 15, 2025"]
}
```

**Required Fields:**
- `to` (string) - Recipient phone number in E.164 format
- `templateName` (string) - Template name (alphanumeric with underscores, max 512 chars)

**Optional Fields:**
- `languageCode` (string) - Language code (e.g., en_US, es_PE)
- `parameters` (array) - Template variable values

**Response:**
```json
{
  "type": "1",
  "message": "Template message sent successfully",
  "data": {
    "messageId": "wamid.abc123..."
  }
}
```

---

### 3. Send Interactive Message

**Endpoint:** `POST /api/v1/whatsapp/send-interactive`

**Auth:** ✅ Required

**Request Body (Button):**
```json
{
  "to": "15551234567",
  "type": "button",
  "body": "How can we help you today?",
  "footer": "Reply anytime",
  "header": {
    "type": "text",
    "text": "Customer Support"
  },
  "action": {
    "buttons": [
      {
        "type": "reply",
        "reply": {
          "id": "track_order",
          "title": "Track Order"
        }
      },
      {
        "type": "reply",
        "reply": {
          "id": "contact_support",
          "title": "Contact Support"
        }
      }
    ]
  }
}
```

**Request Body (List):**
```json
{
  "to": "15551234567",
  "type": "list",
  "body": "Choose an option from the menu below",
  "footer": "Powered by LeMenu",
  "action": {
    "button": "View Menu",
    "sections": [
      {
        "title": "Main Dishes",
        "rows": [
          {
            "id": "dish_1",
            "title": "Pasta Carbonara",
            "description": "Creamy pasta with bacon"
          }
        ]
      }
    ]
  }
}
```

**Required Fields:**
- `to` (string) - Recipient phone number
- `type` (string) - Must be "button" or "list"
- `body` (string) - Message body text
- `action` (object) - Interactive action definition

**Optional Fields:**
- `footer` (string) - Footer text
- `header` (object) - Header (text, image, video, or document)

**Response:**
```json
{
  "type": "1",
  "message": "Interactive message sent successfully",
  "data": {
    "messageId": "wamid.abc123..."
  }
}
```

---

### 4. Send Product Message

**Endpoint:** `POST /api/v1/whatsapp/send-product`

**Auth:** ✅ Required

**Request Body:**
```json
{
  "to": "15551234567",
  "catalogId": "886457576629319",
  "productRetailerId": "product_sku_123",
  "body": "Check out this amazing product!",
  "footer": "Limited time offer",
  "header": {
    "type": "text",
    "text": "Featured Product"
  }
}
```

**Required Fields:**
- `to` (string) - Recipient phone number
- `catalogId` (string) - Facebook catalog ID
- `productRetailerId` (string) - Product SKU/retailer ID

**Optional Fields:**
- `body` (string) - Message body text
- `footer` (string) - Footer text
- `header` (object) - Header

**Response:**
```json
{
  "type": "1",
  "message": "Product message sent successfully",
  "data": {
    "messageId": "wamid.abc123..."
  }
}
```

---

### 5. Send Product List Message

**Endpoint:** `POST /api/v1/whatsapp/send-product-list`

**Auth:** ✅ Required

**Request Body:**
```json
{
  "to": "15551234567",
  "catalogId": "886457576629319",
  "body": "Browse our products",
  "footer": "Shop now",
  "header": {
    "type": "text",
    "text": "Our Catalog"
  },
  "sections": [
    {
      "title": "Featured Items",
      "productItems": [
        { "productRetailerId": "sku_001" },
        { "productRetailerId": "sku_002" }
      ]
    },
    {
      "title": "New Arrivals",
      "productItems": [
        { "productRetailerId": "sku_003" }
      ]
    }
  ]
}
```

**Required Fields:**
- `to` (string) - Recipient phone number
- `catalogId` (string) - Facebook catalog ID
- `sections` (array) - Product sections (non-empty)
  - Each section must have `title` and `productItems` array

**Optional Fields:**
- `body` (string) - Message body text
- `footer` (string) - Footer text
- `header` (object) - Header

**Response:**
```json
{
  "type": "1",
  "message": "Product list message sent successfully",
  "data": {
    "messageId": "wamid.abc123..."
  }
}
```

---

### 6. Send Media Message

**Endpoint:** `POST /api/v1/whatsapp/send-media`

**Auth:** ✅ Required

**Request Body:**
```json
{
  "to": "15551234567",
  "type": "image",
  "mediaUrl": "https://example.com/image.jpg",
  "caption": "Check out this image!"
}
```

**Or with Media ID:**
```json
{
  "to": "15551234567",
  "type": "document",
  "mediaId": "1234567890",
  "filename": "invoice.pdf",
  "caption": "Your invoice is attached"
}
```

**Required Fields:**
- `to` (string) - Recipient phone number
- `type` (string) - Media type: "image", "audio", "video", or "document"
- `mediaId` OR `mediaUrl` (string) - Media identifier or URL

**Optional Fields:**
- `caption` (string) - Media caption (for image, video, document)
- `filename` (string) - File name (for document type)

**Response:**
```json
{
  "type": "1",
  "message": "Media message sent successfully",
  "data": {
    "messageId": "wamid.abc123..."
  }
}
```

---

### 7. Mark Message as Read

**Endpoint:** `POST /api/v1/whatsapp/messages/:messageId/read`

**Auth:** ✅ Required

**URL Parameters:**
- `messageId` (string) - WhatsApp message ID

**Request Body:**
```json
{
  "subDomain": "customer-business"
}
```

**Response:**
```json
{
  "type": "1",
  "message": "Message marked as read",
  "data": {
    "success": true
  }
}
```

---

### 8. Get Conversations (Datatable)

**Endpoint:** `GET /api/v1/whatsapp/conversations`

**Auth:** ✅ Required

**Query Parameters:**

**Pagination:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)

**Sorting:**
- `sortBy` (string) - Sort field (default: lastActivity)
- `sortOrder` (string) - asc or desc (default: desc)

**Filtering:**
- `search` (string) - Search phone/name/email
- `intent` (string) - Filter by intent (menu, order, support, etc.)
- `isActive` (string) - Filter by status (true, false, all)
- `dateFrom` (string) - From date (ISO 8601)
- `dateTo` (string) - To date (ISO 8601)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/whatsapp/conversations?page=1&limit=20&intent=order&isActive=true&sortBy=lastActivity&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "type": "1",
  "message": "Conversations retrieved successfully",
  "data": {
    "conversations": [
      {
        "id": "conv_123",
        "sessionId": "session_abc",
        "userId": "+15551234567",
        "phoneNumber": "+15551234567",
        "customerName": "John Doe",
        "customerEmail": "john@example.com",
        "bot": {
          "id": "bot_789",
          "name": "Restaurant Bot"
        },
        "currentIntent": "order",
        "currentStep": "payment",
        "isActive": true,
        "lastActivity": "2025-01-27T10:30:00.000Z",
        "messageCount": 15,
        "lastMessage": {
          "role": "user",
          "content": "I'll pay with credit card",
          "timestamp": "2025-01-27T10:30:00.000Z"
        },
        "duration": 5400,
        "context": {
          "selectedItemsCount": 3,
          "orderTotal": 45.50,
          "paymentMethod": "card",
          "hasDeliveryAddress": true
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 127,
      "totalPages": 7,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "search": null,
      "intent": "order",
      "isActive": "true"
    }
  }
}
```

**See:** [CONVERSATIONS_API.md](CONVERSATIONS_API.md) for complete documentation

---

### 9. Check Conversation Window

**Endpoint:** `GET /api/v1/whatsapp/conversations/:phone/window`

**Auth:** ✅ Required

**URL Parameters:**
- `phone` (string) - Customer phone number

**Query Parameters:**
- `subDomain` (string) - Business subdomain

**Response:**
```json
{
  "type": "1",
  "message": "Conversation window status retrieved",
  "data": {
    "isOpen": true,
    "expiresAt": "2025-01-15T10:30:00.000Z"
  }
}
```

---

## Template Management

### 9. Get Templates

**Endpoint:** `GET /api/v1/whatsapp/templates`

**Auth:** ✅ Required

**Query Parameters:**
- `subDomain` (string) - Business subdomain (from JWT context)

**Response:**
```json
{
  "type": "1",
  "message": "Templates retrieved successfully",
  "data": {
    "data": [
      {
        "name": "order_confirmation",
        "id": "1234567890",
        "status": "APPROVED",
        "category": "UTILITY",
        "language": "en_US"
      }
    ]
  }
}
```

---

### 10. Create Template

**Endpoint:** `POST /api/v1/whatsapp/templates`

**Auth:** ✅ Required

**Request Body:**
```json
{
  "name": "order_confirmation",
  "category": "UTILITY",
  "language": "en_US",
  "components": [
    {
      "type": "BODY",
      "text": "Your order {{1}} has been confirmed.",
      "example": {
        "body_text": [["#12345"]]
      }
    }
  ]
}
```

**Required Fields:**
- `name` (string) - Template name (lowercase, underscores, max 512 chars)
- `category` (string) - "UTILITY", "MARKETING", or "AUTHENTICATION"
- `language` (string) - Language code (e.g., en_US)
- `components` (array) - Template components

**Response:**
```json
{
  "type": "1",
  "message": "Template created successfully",
  "data": {
    "success": true,
    "id": "1234567890",
    "status": "PENDING"
  }
}
```

---

### 11. Get Template Status

**Endpoint:** `GET /api/v1/whatsapp/templates/:templateName/status`

**Auth:** ✅ Required

**URL Parameters:**
- `templateName` (string) - Template name

**Response:**
```json
{
  "type": "1",
  "message": "Template status retrieved successfully",
  "data": {
    "name": "order_confirmation",
    "status": "APPROVED",
    "id": "1234567890"
  }
}
```

---

### 12. Delete Template

**Endpoint:** `DELETE /api/v1/whatsapp/templates/:templateName`

**Auth:** ✅ Required

**URL Parameters:**
- `templateName` (string) - Template name

**Request Body:**
```json
{
  "hsmId": "1234567890"
}
```

**Required Fields:**
- `hsmId` (string) - Template ID

**Response:**
```json
{
  "type": "1",
  "message": "Template deleted successfully",
  "data": {
    "success": true
  }
}
```

---

### 13. Check Template Statuses

**Endpoint:** `GET /api/v1/whatsapp/templates/statuses`

**Auth:** ✅ Required

**Response:**
```json
{
  "type": "1",
  "message": "Template statuses retrieved successfully",
  "data": {
    "templates": [
      {
        "name": "order_confirmation",
        "status": "APPROVED",
        "id": "1234567890"
      }
    ]
  }
}
```

---

### 14. Provision Templates

**Endpoint:** `POST /api/v1/whatsapp/templates/provision`

**Auth:** ✅ Required

**Request Body:**
```json
{
  "language": "es_PE"
}
```

**Optional Fields:**
- `language` (string) - Language code (default: es_PE)

**Response:**
```json
{
  "type": "1",
  "message": "Templates provisioned successfully",
  "data": {
    "success": true,
    "results": [
      {
        "templateId": "order_confirmation",
        "templateName": "order_confirmation",
        "status": "PENDING",
        "success": true
      }
    ]
  }
}
```

---

## Template Library

### 15. Get Template Library

**Endpoint:** `GET /api/v1/whatsapp/templates/library`

**Auth:** ❌ Not Required

**Query Parameters:**
- `language` (string) - Language code (default: en)

**Response:**
```json
{
  "type": "1",
  "message": "Template library retrieved successfully",
  "data": {
    "templates": [
      {
        "id": "order_confirmation",
        "name": "order_confirmation",
        "category": "UTILITY",
        "language": "en"
      }
    ],
    "totalCount": 15,
    "language": "en"
  }
}
```

---

### 16. Get Template from Library

**Endpoint:** `GET /api/v1/whatsapp/templates/library/:templateId`

**Auth:** ❌ Not Required

**URL Parameters:**
- `templateId` (string) - Template ID from library

**Query Parameters:**
- `language` (string) - Language code (default: en)

**Response:**
```json
{
  "type": "1",
  "message": "Template retrieved successfully",
  "data": {
    "id": "order_confirmation",
    "name": "order_confirmation",
    "category": "UTILITY",
    "language": "en",
    "components": [...]
  }
}
```

---

### 17. Provision Selected Templates

**Endpoint:** `POST /api/v1/whatsapp/templates/provision-selected`

**Auth:** ✅ Required

**Request Body:**
```json
{
  "templateIds": [
    "order_confirmation",
    "shipping_update"
  ],
  "language": "en_US"
}
```

**Required Fields:**
- `templateIds` (array) - Non-empty array of template IDs

**Optional Fields:**
- `language` (string) - Language code (default: en)

**Response:**
```json
{
  "type": "1",
  "message": "Templates provisioned successfully",
  "data": {
    "results": [
      {
        "templateId": "order_confirmation",
        "templateName": "order_confirmation",
        "success": true,
        "status": "PENDING"
      }
    ]
  }
}
```

---

## Phone Number Management

### 18. Get Phone Numbers

**Endpoint:** `GET /api/v1/whatsapp/phone-numbers`

**Auth:** ✅ Required

**Response:**
```json
{
  "type": "1",
  "message": "Phone numbers retrieved successfully",
  "data": {
    "data": [
      {
        "id": "123456789",
        "displayPhoneNumber": "+1 555 123 4567",
        "verifiedName": "Business Name"
      }
    ]
  }
}
```

---

### 19. Get Phone Number Details

**Endpoint:** `GET /api/v1/whatsapp/phone-numbers/:phoneNumberId`

**Auth:** ✅ Required

**URL Parameters:**
- `phoneNumberId` (string) - Phone number ID

**Response:**
```json
{
  "type": "1",
  "message": "Phone number details retrieved successfully",
  "data": {
    "id": "123456789",
    "displayPhoneNumber": "+1 555 123 4567",
    "verifiedName": "Business Name",
    "qualityRating": "GREEN"
  }
}
```

---

### 20. Check Two-Step Verification

**Endpoint:** `GET /api/v1/whatsapp/phone-numbers/:phoneNumberId/two-step`

**Auth:** ✅ Required

**URL Parameters:**
- `phoneNumberId` (string) - Phone number ID

**Response:**
```json
{
  "type": "1",
  "message": "Two-step verification status retrieved",
  "data": {
    "isEnabled": true
  }
}
```

---

### 21. Disable Two-Step Verification

**Endpoint:** `POST /api/v1/whatsapp/phone-numbers/:phoneNumberId/two-step/disable`

**Auth:** ✅ Required

**URL Parameters:**
- `phoneNumberId` (string) - Phone number ID

**Response:**
```json
{
  "type": "1",
  "message": "Two-step verification disabled successfully",
  "data": {
    "success": true
  }
}
```

---

### 22. Verify Phone Number

**Endpoint:** `POST /api/v1/whatsapp/phone-numbers/:phoneNumberId/verify`

**Auth:** ✅ Required

**URL Parameters:**
- `phoneNumberId` (string) - Phone number ID

**Request Body:**
```json
{
  "code": "123456"
}
```

**Required Fields:**
- `code` (string) - Verification code

**Response:**
```json
{
  "type": "1",
  "message": "Phone number verified successfully",
  "data": {
    "success": true
  }
}
```

---

## Webhook Management

### 23. Get Webhook Subscriptions

**Endpoint:** `GET /api/v1/whatsapp/webhooks/subscriptions`

**Auth:** ✅ Required

**Query Parameters:**
- `subDomain` (string) - Business subdomain

**Response:**
```json
{
  "type": "1",
  "message": "Webhook subscriptions retrieved successfully",
  "data": {
    "data": [
      {
        "id": "app_id",
        "name": "App Name",
        "link": "https://...",
        "subscribed_fields": null,
        "_note": "Webhook fields must be configured in Facebook App Dashboard"
      }
    ],
    "_meta": {
      "important": "subscribed_fields are NOT available via this API endpoint",
      "configuration": "Configure webhook fields in Facebook App Dashboard"
    }
  }
}
```

---

### 24. Subscribe Webhook

**Endpoint:** `POST /api/v1/whatsapp/webhooks/subscribe`

**Auth:** ✅ Required

**Request Body:**
```json
{
  "subDomain": "customer-business",
  "webhookUrl": "https://api.example.com/webhook",
  "verifyToken": "your_verify_token",
  "fields": ["messages", "message_template_status_update"]
}
```

**Required Fields:**
- `subDomain` (string) - Business subdomain
- `webhookUrl` (string) - Webhook callback URL
- `verifyToken` (string) - Webhook verification token
- `fields` (array) - Non-empty array of webhook field names (strings only)

**Field Validation:**
- Must be non-empty array
- All values must be non-empty strings
- Unknown fields trigger warnings but don't fail
- Recommended fields: "messages", "message_template_status_update"

**Response:**
```json
{
  "type": "1",
  "message": "Webhook subscribed successfully",
  "data": {
    "success": true
  }
}
```

---

### 25. Update Webhook Subscription

**Endpoint:** `PUT /api/v1/whatsapp/webhooks/subscriptions`

**Auth:** ✅ Required

**Request Body:**
```json
{
  "subDomain": "customer-business",
  "fields": ["messages", "message_template_status_update"]
}
```

**Required Fields:**
- `subDomain` (string) - Business subdomain
- `fields` (array) - Non-empty array of webhook field names

**Response:**
```json
{
  "type": "1",
  "message": "Webhook subscription updated successfully",
  "data": {
    "success": true
  }
}
```

---

### 26. Delete Webhook Subscription

**Endpoint:** `DELETE /api/v1/whatsapp/webhooks/subscriptions/:appId`

**Auth:** ✅ Required

**URL Parameters:**
- `appId` (string) - Facebook App ID

**Response:**
```json
{
  "type": "1",
  "message": "Webhook unsubscribed successfully",
  "data": {
    "success": true
  }
}
```

---

## OAuth & Authentication

### 27. Exchange Token

**Endpoint:** `POST /api/v1/whatsapp/facebook/exchange-token`

**Auth:** ✅ Required

**Request Body:**
```json
{
  "code": "authorization_code_from_facebook",
  "waba_id": "25543497612004704",
  "phone_number_id": "935651219628941",
  "business_id": "644860301218731",
  "redirect_uri": "https://your-app.com/oauth/callback",
  "catalog_ids": ["886457576629319"],
  "page_ids": [],
  "instagram_account_ids": [],
  "dataset_ids": []
}
```

**Required Fields:**
- `code` (string) - OAuth authorization code (expires in ~10 minutes)
- `waba_id` (string) - WhatsApp Business Account ID
- `phone_number_id` (string) - Phone number ID

**Optional Fields:**
- `business_id` (string) - Facebook Business Manager ID
- `redirect_uri` (string) - OAuth redirect URI (must match authorization request)
- `catalog_ids` (array) - Facebook Catalog IDs
- `page_ids` (array) - Facebook Page IDs (logged, not stored yet)
- `instagram_account_ids` (array) - Instagram Account IDs (logged, not stored yet)
- `dataset_ids` (array) - Dataset IDs (logged, not stored yet)

**Response:**
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

---

## Health & Setup

### 28. Check Health

**Endpoint:** `GET /api/v1/whatsapp/health`

**Auth:** ✅ Required

**Response:**
```json
{
  "type": "1",
  "message": "WhatsApp integration is healthy",
  "data": {
    "status": "healthy",
    "wabaId": "25543497612004704",
    "phoneNumbers": ["123456789"]
  }
}
```

---

### 29. Validate Setup

**Endpoint:** `GET /api/v1/whatsapp/setup/validate`

**Auth:** ✅ Required

**Response:**
```json
{
  "type": "1",
  "message": "Setup validation completed",
  "data": {
    "isValid": true,
    "issues": []
  }
}
```

---

### 30. Get Account Status

**Endpoint:** `GET /api/v1/whatsapp/account/status`

**Auth:** ✅ Required

**Response:**
```json
{
  "type": "1",
  "message": "Account status retrieved successfully",
  "data": {
    "accountStatus": "ACTIVE",
    "qualityRating": "GREEN"
  }
}
```

---

## Migration

### 31. Validate Migration

**Endpoint:** `POST /api/v1/whatsapp/migrate/validate`

**Auth:** ✅ Required

**Response:**
```json
{
  "type": "1",
  "message": "Migration validation completed",
  "data": {
    "canMigrate": true,
    "issues": []
  }
}
```

---

### 32. Execute Migration

**Endpoint:** `POST /api/v1/whatsapp/migrate/execute`

**Auth:** ✅ Required

**Response:**
```json
{
  "type": "1",
  "message": "Migration executed successfully",
  "data": {
    "success": true,
    "migrationId": "migration_123"
  }
}
```

---

### 33. Get Migration Status

**Endpoint:** `GET /api/v1/whatsapp/migrate/status`

**Auth:** ✅ Required

**Response:**
```json
{
  "type": "1",
  "message": "Migration status retrieved",
  "data": {
    "status": "completed",
    "progress": 100
  }
}
```

---

### 34. Rollback Migration

**Endpoint:** `POST /api/v1/whatsapp/migrate/rollback`

**Auth:** ✅ Required

**Response:**
```json
{
  "type": "1",
  "message": "Migration rolled back successfully",
  "data": {
    "success": true
  }
}
```

---

## Webhook Handler

### 35. Webhook Handler (POST)

**Endpoint:** `POST /api/v1/whatsapp/webhook`

**Auth:** ❌ Not Required (Meta calls this)

**Headers:**
- `x-hub-signature-256` - Webhook signature for verification

**Request Body:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "messages": [...]
          }
        }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "status": "ok"
}
```

---

### 36. Webhook Verification (GET)

**Endpoint:** `GET /api/v1/whatsapp/webhook`

**Auth:** ❌ Not Required (Meta calls this)

**Query Parameters:**
- `hub.mode` (string) - Must be "subscribe"
- `hub.verify_token` (string) - Verification token
- `hub.challenge` (string) - Challenge string to return

**Response:**
Returns the challenge string if verification succeeds.

---

## Common Validation Rules

### Phone Number Format
- Must be in E.164 format: `+[country_code][number]`
- Examples: `+15551234567`, `+51987654321`
- No spaces, dashes, or parentheses

### Template Name Format
- Lowercase letters only
- Underscores allowed
- Max 512 characters
- Alphanumeric only
- Examples: `order_confirmation`, `shipping_update_v2`

### Language Codes
- ISO 639-1 language code + underscore + ISO 3166-1 alpha-2 country code
- Examples: `en_US`, `es_PE`, `pt_BR`, `fr_FR`

---

## Error Response Format

All errors follow this format:

```json
{
  "type": "3",
  "message": "Error message here",
  "data": null
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Validation error or bad request
- `401` - Unauthorized (missing or invalid JWT token)
- `404` - Resource not found
- `500` - Internal server error

---

## Summary Table

| Category | Endpoints | Auth Required |
|----------|-----------|---------------|
| Messaging | 8 | ✅ Yes (all) |
| Conversations | 2 | ✅ Yes (all) |
| Templates | 6 | ✅ Yes (most) |
| Template Library | 3 | ❌ No |
| Phone Numbers | 5 | ✅ Yes (all) |
| Webhooks | 4 | ✅ Yes (all) |
| OAuth | 1 | ✅ Yes |
| Health & Setup | 3 | ✅ Yes (all) |
| Migration | 4 | ✅ Yes (all) |
| Webhook Handler | 2 | ❌ No |

**Total Endpoints:** 37

**Total Authenticated:** 31

**Total Public:** 6

---

## Related Documentation

- [CONVERSATIONS_API.md](CONVERSATIONS_API.md) - Conversations datatable endpoint details
- [WHATSAPP_TEMPLATES_API.md](WHATSAPP_TEMPLATES_API.md) - Template management details
- [EXCHANGE_TOKEN_API.md](EXCHANGE_TOKEN_API.md) - OAuth token exchange details
- [META_WEBHOOK_SYSTEM_EXPLAINED.md](META_WEBHOOK_SYSTEM_EXPLAINED.md) - Webhook system architecture
- [WEBHOOK_FIELD_VALIDATION.md](WEBHOOK_FIELD_VALIDATION.md) - Webhook validation details

---

**Last Updated:** 2025-01-XX

**API Version:** v1

**Status:** Production Ready ✅
