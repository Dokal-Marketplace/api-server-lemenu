# WhatsApp Message Templates API - Complete Documentation

## Overview

WhatsApp message templates are pre-approved message formats that businesses can use to send notifications to customers. All templates must be approved by Meta/WhatsApp before they can be used.

This API provides comprehensive template management including creation, retrieval, deletion, status checking, and a built-in template library.

## Available Endpoints

### Template Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/whatsapp/templates` | Get all templates for a business | ✅ Yes |
| POST | `/api/v1/whatsapp/templates` | Create a new template | ✅ Yes |
| GET | `/api/v1/whatsapp/templates/:templateName/status` | Get status of a specific template | ✅ Yes |
| DELETE | `/api/v1/whatsapp/templates/:templateName` | Delete a template | ✅ Yes |
| GET | `/api/v1/whatsapp/templates/statuses` | Check status of all templates | ✅ Yes |

### Template Library (Pre-built Templates)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/whatsapp/templates/library` | Get all templates from library | ❌ No |
| GET | `/api/v1/whatsapp/templates/library/:templateId` | Get specific template from library | ❌ No |
| POST | `/api/v1/whatsapp/templates/provision-selected` | Provision selected templates from library | ✅ Yes |
| POST | `/api/v1/whatsapp/templates/provision` | Provision all default templates | ✅ Yes |

### Template Usage

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/whatsapp/send-template` | Send a template message to a customer | ✅ Yes |

---

## 1. Get All Templates

Get all WhatsApp message templates associated with a business.

**Endpoint:** `GET /api/v1/whatsapp/templates`

**Authentication:** Required

### Request

```bash
curl -X GET "http://localhost:3000/api/v1/whatsapp/templates" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response

```json
{
  "type": "1",
  "message": "Templates retrieved successfully",
  "data": {
    "data": [
      {
        "name": "order_confirmation",
        "id": "1234567890",
        "category": "TRANSACTIONAL",
        "language": "en_US",
        "status": "APPROVED",
        "components": [
          {
            "type": "BODY",
            "text": "Your order {{1}} has been confirmed. Expected delivery: {{2}}."
          }
        ]
      }
    ]
  }
}
```

---

## 2. Create Template

Create a new WhatsApp message template. Templates must be approved by Meta before use.

**Endpoint:** `POST /api/v1/whatsapp/templates`

**Authentication:** Required

### Request Body

```json
{
  "name": "order_confirmation",
  "category": "UTILITY",
  "language": "en_US",
  "components": [
    {
      "type": "BODY",
      "text": "Your order {{1}} has been confirmed. Expected delivery: {{2}}.",
      "example": {
        "body_text": [
          ["#12345", "January 15, 2025"]
        ]
      }
    }
  ]
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ Yes | Template name (lowercase, underscores only, max 512 chars) |
| `category` | string | ✅ Yes | Template category: `UTILITY`, `MARKETING`, or `AUTHENTICATION` |
| `language` | string | ✅ Yes | Language code (e.g., `en_US`, `es_ES`, `es_PE`) |
| `components` | array | ✅ Yes | Array of template components (HEADER, BODY, FOOTER, BUTTONS) |

### Template Categories

- **UTILITY** - Transactional updates (order confirmations, shipping updates, etc.)
- **MARKETING** - Promotional content (requires opt-in)
- **AUTHENTICATION** - OTP and verification codes

### Component Types

#### BODY Component (Required)

```json
{
  "type": "BODY",
  "text": "Your order {{1}} has been confirmed.",
  "example": {
    "body_text": [["#12345"]]
  }
}
```

#### HEADER Component (Optional)

```json
{
  "type": "HEADER",
  "format": "TEXT",
  "text": "Order Update"
}
```

Or with media:

```json
{
  "type": "HEADER",
  "format": "IMAGE",
  "example": {
    "header_handle": ["https://example.com/image.jpg"]
  }
}
```

#### FOOTER Component (Optional)

```json
{
  "type": "FOOTER",
  "text": "Thank you for your order!"
}
```

#### BUTTONS Component (Optional)

```json
{
  "type": "BUTTONS",
  "buttons": [
    {
      "type": "QUICK_REPLY",
      "text": "Track Order"
    },
    {
      "type": "URL",
      "text": "View Order",
      "url": "https://example.com/orders/{{1}}"
    }
  ]
}
```

### Example Request

```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/templates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "order_confirmation",
    "category": "UTILITY",
    "language": "en_US",
    "components": [
      {
        "type": "BODY",
        "text": "Your order {{1}} has been confirmed. Expected delivery: {{2}}.",
        "example": {
          "body_text": [["#12345", "January 15, 2025"]]
        }
      },
      {
        "type": "FOOTER",
        "text": "Thank you for shopping with us!"
      }
    ]
  }'
```

### Success Response

```json
{
  "type": "1",
  "message": "Template created successfully",
  "data": {
    "success": true,
    "id": "1234567890",
    "status": "PENDING",
    "name": "order_confirmation"
  }
}
```

### Error Response

```json
{
  "type": "3",
  "message": "Template name already exists",
  "data": {
    "success": false,
    "error": "Template with this name already exists"
  }
}
```

---

## 3. Get Template Status

Check the approval status of a specific template.

**Endpoint:** `GET /api/v1/whatsapp/templates/:templateName/status`

**Authentication:** Required

### Request

```bash
curl -X GET "http://localhost:3000/api/v1/whatsapp/templates/order_confirmation/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response

```json
{
  "type": "1",
  "message": "Template status retrieved successfully",
  "data": {
    "name": "order_confirmation",
    "status": "APPROVED",
    "category": "UTILITY",
    "language": "en_US",
    "id": "1234567890"
  }
}
```

### Template Statuses

- **PENDING** - Template submitted, awaiting Meta approval
- **APPROVED** - Template approved, ready to use
- **REJECTED** - Template rejected by Meta
- **DISABLED** - Template disabled due to quality issues
- **PAUSED** - Template paused (can be re-enabled)

---

## 4. Delete Template

Delete a WhatsApp message template.

**Endpoint:** `DELETE /api/v1/whatsapp/templates/:templateName`

**Authentication:** Required

### Request Body

```json
{
  "hsmId": "1234567890"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hsmId` | string | ✅ Yes | Template ID (HSM = Highly Structured Message) |

### Example Request

```bash
curl -X DELETE http://localhost:3000/api/v1/whatsapp/templates/order_confirmation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "hsmId": "1234567890"
  }'
```

### Success Response

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

## 5. Check All Template Statuses

Check the status of all templates for a business.

**Endpoint:** `GET /api/v1/whatsapp/templates/statuses`

**Authentication:** Required

### Request

```bash
curl -X GET "http://localhost:3000/api/v1/whatsapp/templates/statuses" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response

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
      },
      {
        "name": "shipping_update",
        "status": "PENDING",
        "id": "0987654321"
      }
    ],
    "summary": {
      "total": 2,
      "approved": 1,
      "pending": 1,
      "rejected": 0
    }
  }
}
```

---

## 6. Get Template Library

Get all pre-built templates from the template library.

**Endpoint:** `GET /api/v1/whatsapp/templates/library`

**Authentication:** Not required

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `language` | string | ❌ No | Filter by language (default: `en`) |

### Request

```bash
curl -X GET "http://localhost:3000/api/v1/whatsapp/templates/library?language=en"
```

### Response

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
        "language": "en",
        "description": "Confirm order placement",
        "components": [...]
      }
    ],
    "totalCount": 15,
    "language": "en"
  }
}
```

---

## 7. Get Specific Template from Library

Get a specific pre-built template from the library.

**Endpoint:** `GET /api/v1/whatsapp/templates/library/:templateId`

**Authentication:** Not required

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `language` | string | ❌ No | Language code (default: `en`) |

### Request

```bash
curl -X GET "http://localhost:3000/api/v1/whatsapp/templates/library/order_confirmation?language=en"
```

### Response

```json
{
  "type": "1",
  "message": "Template retrieved successfully",
  "data": {
    "id": "order_confirmation",
    "name": "order_confirmation",
    "category": "UTILITY",
    "language": "en",
    "description": "Confirm order placement",
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
}
```

---

## 8. Provision Selected Templates

Create multiple templates from the library at once.

**Endpoint:** `POST /api/v1/whatsapp/templates/provision-selected`

**Authentication:** Required

### Request Body

```json
{
  "templateIds": [
    "order_confirmation",
    "shipping_update",
    "delivery_notification"
  ],
  "language": "en_US"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `templateIds` | string[] | ✅ Yes | Array of template IDs from library |
| `language` | string | ❌ No | Language code (default: `en`) |

### Example Request

```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/templates/provision-selected \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "templateIds": [
      "order_confirmation",
      "shipping_update"
    ],
    "language": "en_US"
  }'
```

### Response

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
      },
      {
        "templateId": "shipping_update",
        "templateName": "shipping_update",
        "success": true,
        "status": "PENDING"
      }
    ],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0
    }
  }
}
```

---

## 9. Provision All Default Templates

Provision all default templates for a specific language.

**Endpoint:** `POST /api/v1/whatsapp/templates/provision`

**Authentication:** Required

### Request Body

```json
{
  "language": "es_PE"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `language` | string | ❌ No | Language code (default: `es_PE`) |

### Example Request

```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/templates/provision \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "language": "es_PE"
  }'
```

### Response

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
    ],
    "summary": {
      "total": 10,
      "successful": 10,
      "failed": 0
    }
  }
}
```

### What Happens

- Creates all default templates from the library
- Updates business model with template tracking
- Sets `templatesProvisioned: true` and `templatesProvisionedAt: Date`
- Stores template metadata in `business.whatsappTemplates` array

---

## 10. Send Template Message

Send a template message to a customer.

**Endpoint:** `POST /api/v1/whatsapp/send-template`

**Authentication:** Required

### Request Body

```json
{
  "to": "15551234567",
  "templateName": "order_confirmation",
  "language": "en_US",
  "parameters": [
    "#12345",
    "January 15, 2025"
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | string | ✅ Yes | Recipient phone number (international format) |
| `templateName` | string | ✅ Yes | Template name |
| `language` | string | ✅ Yes | Language code |
| `parameters` | array | ❌ No | Parameter values for template variables |

### Example Request

```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "15551234567",
    "templateName": "order_confirmation",
    "language": "en_US",
    "parameters": ["#12345", "January 15, 2025"]
  }'
```

### Response

```json
{
  "type": "1",
  "message": "Template message sent successfully",
  "data": {
    "messageId": "wamid.abc123...",
    "status": "sent"
  }
}
```

---

## Template Naming Rules

- **Lowercase only** - `order_confirmation` ✅, `Order_Confirmation` ❌
- **Underscores only** - `order_confirmation` ✅, `order-confirmation` ❌
- **Max 512 characters**
- **No special characters** - except underscores
- **Must be unique** per WABA

---

## Template Variables

Use `{{1}}`, `{{2}}`, `{{3}}` etc. for dynamic content:

```
Your order {{1}} will be delivered on {{2}}.
```

When sending, provide parameters in order:

```json
{
  "parameters": ["#12345", "January 15, 2025"]
}
```

Result:
```
Your order #12345 will be delivered on January 15, 2025.
```

---

## Best Practices

### 1. Template Design

- **Be specific** - "Your order #12345 has shipped" not "Your order has shipped"
- **Use templates for notifications** - Not for conversations
- **Include branding** - Add footer with company name
- **Test with examples** - Provide realistic example data

### 2. Approval Process

- **Allow 24-48 hours** for Meta approval
- **Check status regularly** using `/templates/statuses`
- **Avoid promotional language** in UTILITY templates
- **Follow Meta's policies** - No spammy or misleading content

### 3. Using Templates

- **Only send to opted-in users** (except transactional)
- **Don't spam** - Templates have rate limits
- **Track quality** - Poor quality can get templates disabled
- **Keep templates updated** - Delete unused templates

### 4. Template Quality

Meta monitors template quality based on:
- User blocks after receiving template
- User reports
- Response rates
- Delivery rates

Poor quality templates may be:
- **PAUSED** - Temporarily disabled
- **DISABLED** - Permanently disabled
- **Rejected** - Not approved in the first place

---

## Common Errors

### Template Already Exists

```json
{
  "type": "3",
  "message": "Template with this name already exists"
}
```

**Solution:** Use a different template name or delete the existing template first.

### Template Not Approved

```json
{
  "type": "3",
  "message": "Template not approved yet. Current status: PENDING"
}
```

**Solution:** Wait for Meta approval before sending template messages.

### Invalid Template Format

```json
{
  "type": "3",
  "message": "Invalid template components"
}
```

**Solution:** Ensure components follow Meta's template format requirements.

### Missing Required Fields

```json
{
  "type": "3",
  "message": "Missing required fields: name, category, language, components"
}
```

**Solution:** Provide all required fields in the request body.

---

## Language Codes

Common language codes for WhatsApp templates:

| Language | Code |
|----------|------|
| English (US) | `en_US` |
| English (UK) | `en_GB` |
| Spanish (Spain) | `es_ES` |
| Spanish (Mexico) | `es_MX` |
| Spanish (Peru) | `es_PE` |
| Portuguese (Brazil) | `pt_BR` |
| French | `fr` |
| German | `de` |
| Italian | `it` |

---

## Database Storage

Templates are tracked in the Business model:

```javascript
{
  whatsappTemplates: [
    {
      name: "order_confirmation",
      templateId: "1234567890",
      status: "APPROVED",
      createdAt: ISODate("2025-01-01"),
      approvedAt: ISODate("2025-01-02"),
      language: "en_US",
      category: "UTILITY"
    }
  ],
  templatesProvisioned: true,
  templatesProvisionedAt: ISODate("2025-01-01")
}
```

---

## Related Documentation

- [Meta WhatsApp Template Guide](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [Template Components](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components)
- [Template Categories](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/categories)

---

## Summary

The WhatsApp Templates API provides:

1. ✅ **Complete CRUD operations** for templates
2. ✅ **Pre-built template library** with ready-to-use templates
3. ✅ **Bulk provisioning** for quick setup
4. ✅ **Status tracking** for approval monitoring
5. ✅ **Template sending** integrated with messaging
6. ✅ **Database persistence** for template metadata

**Status:** Production Ready ✅
