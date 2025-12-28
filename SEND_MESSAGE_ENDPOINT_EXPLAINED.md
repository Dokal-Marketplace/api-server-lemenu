# Send Message Endpoint - Complete Explanation

## Overview

The `/api/v1/whatsapp/send-message` endpoint sends text messages to WhatsApp users via the Meta WhatsApp Business API. This is the most basic and commonly used messaging endpoint.

---

## Endpoint Details

**URL:** `POST /api/v1/whatsapp/send-message`

**Authentication:** Required (Bearer JWT token)

**Route Definition:** [metaWhatsAppRoute.ts:45](src/routes/metaWhatsAppRoute.ts#L45)

**Controller:** [metaWhatsAppController.ts:70-102](src/controllers/metaWhatsAppController.ts#L70-L102)

**Service:** [metaWhatsAppService.ts:819-887](src/services/whatsapp/metaWhatsAppService.ts#L819-L887)

---

## How It Works - Complete Flow

### 1. Request Arrives

```javascript
POST /api/v1/whatsapp/send-message
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "to": "+15551234567",
  "text": "Hello, this is a test message!",
  "previewUrl": true
}
```

### 2. Authentication Middleware

The `authenticate` middleware verifies the JWT token and extracts user information.

**File:** [middleware/auth.ts](src/middleware/auth.ts)

**What it does:**
- Validates the JWT token
- Extracts user ID and business context
- Attaches user info to `req.user`
- Returns 401 if token is invalid or expired

### 3. Controller Layer - Validation

**File:** [metaWhatsAppController.ts:70-102](src/controllers/metaWhatsAppController.ts#L70-L102)

**Step-by-step:**

```typescript
export const sendTextMessage = async (req, res, next) => {
  try {
    // 1. Extract business context (subDomain, localId)
    const { subDomain, localId } = getBusinessContext(req);

    // 2. Extract request body parameters
    const { to, text, previewUrl } = req.body;

    // 3. Validate required fields
    if (!to || !text) {
      return next(createValidationError('Missing required fields: to, text'));
    }

    // 4. Validate phone number format (E.164)
    if (!validatePhoneNumber(to)) {
      return next(createValidationError('Phone number must be in E.164 format'));
    }

    // 5. Call service layer
    const result = await MetaWhatsAppService.sendTextMessage(
      subDomain,
      { to, text, previewUrl },
      localId
    );

    // 6. Return success response
    res.json({
      type: '1',
      message: 'Message sent successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error sending text message:', error);
    next(createServerError(error.message || 'Failed to send message', error));
  }
};
```

**Validations performed:**

1. **Required Fields Check:**
   - `to` - Recipient phone number (required)
   - `text` - Message content (required)

2. **Phone Number Format Validation:**
   ```typescript
   const validatePhoneNumber = (phone: string): boolean => {
     return /^\+[1-9]\d{1,14}$/.test(phone);
   };
   ```
   - Must start with `+`
   - Must include country code
   - Must be 1-15 digits after `+`
   - Examples: `+15551234567`, `+51987654321`

### 4. Service Layer - Business Logic

**File:** [metaWhatsAppService.ts:819-887](src/services/whatsapp/metaWhatsAppService.ts#L819-L887)

**Step-by-step:**

```typescript
static async sendTextMessage(subDomain, params, localId) {
  // 1. Log the request
  logger.info('[META API] sendTextMessage called', {
    subDomain,
    to: params.to,
    localId,
    timestamp: new Date().toISOString()
  });

  // 2. Get business configuration
  const config = await this.getBusinessConfig(subDomain, localId);
  if (!config) {
    throw new Error('Business configuration not found or invalid');
  }

  // 3. Extract parameters
  const { to, text, previewUrl = false } = params;

  // 4. Build Meta API payload
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: {
      preview_url: previewUrl,
      body: text,
    },
  };

  // 5. Make API call to Meta
  const response = await this.makeApiCall(
    config.phoneNumberId,
    config.accessToken,
    'messages',
    'POST',
    payload
  );

  // 6. Save message to database
  if (response.messages && response.messages.length > 0) {
    const messageId = response.messages[0].id;
    await this.saveOutboundMessage(
      subDomain,
      to,
      'text',
      { text },
      messageId,
      localId
    );
  }

  // 7. Return response
  return response;
}
```

**What happens:**

1. **Logging:** Request details are logged for debugging
2. **Config Retrieval:** Gets WhatsApp credentials from database
3. **Payload Construction:** Builds Meta-compliant message payload
4. **API Call:** Sends HTTP POST to Meta's WhatsApp API
5. **Database Storage:** Saves outbound message for tracking
6. **Response:** Returns Meta's response with message ID

### 5. Get Business Configuration

**What it retrieves:**

```typescript
{
  phoneNumberId: "123456789",      // WhatsApp phone number ID
  accessToken: "encrypted_token",   // Meta access token (decrypted)
  wabaId: "987654321"              // WhatsApp Business Account ID
}
```

**From where:**
- `Business` model (MongoDB)
- Filters by `subDomain` (and optionally `localId`)
- Decrypts access token automatically

### 6. Make API Call to Meta

**Endpoint Called:**
```
POST https://graph.facebook.com/v22.0/{phone_number_id}/messages
```

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {access_token}
```

**Payload:**
```json
{
  "messaging_product": "whatsapp",
  "to": "+15551234567",
  "type": "text",
  "text": {
    "preview_url": true,
    "body": "Hello, this is a test message!"
  }
}
```

**Meta's Response:**
```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "+15551234567",
      "wa_id": "15551234567"
    }
  ],
  "messages": [
    {
      "id": "wamid.HBgLMTU1NTEyMzQ1NjcVAgARGBI5QUFEMEY2RjQ3RDFBQTU5OTcA"
    }
  ]
}
```

### 7. Save Outbound Message

**Why:** Track all sent messages for:
- Message history
- Analytics
- Debugging
- Conversation context

**What's saved:**
```typescript
{
  subDomain: "business-name",
  localId: "location-123",
  to: "+15551234567",
  messageType: "text",
  content: { text: "Hello, this is a test message!" },
  messageId: "wamid.HBgLMTU...",
  status: "sent",
  timestamp: Date.now()
}
```

### 8. Response Sent to Client

```json
{
  "type": "1",
  "message": "Message sent successfully",
  "data": {
    "messaging_product": "whatsapp",
    "contacts": [
      {
        "input": "+15551234567",
        "wa_id": "15551234567"
      }
    ],
    "messages": [
      {
        "id": "wamid.HBgLMTU1NTEyMzQ1NjcVAgARGBI5QUFEMEY2RjQ3RDFBQTU5OTcA"
      }
    ]
  }
}
```

---

## Request Parameters

### Required Parameters

| Parameter | Type | Description | Validation |
|-----------|------|-------------|------------|
| `to` | string | Recipient phone number | Must be E.164 format (+country_code + number) |
| `text` | string | Message text content | Required, max 4096 characters |

### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `previewUrl` | boolean | false | Enable URL preview in the message |

---

## Request Examples

### 1. Basic Text Message

```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/send-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "+15551234567",
    "text": "Hello! Your order has been confirmed."
  }'
```

### 2. Message with URL Preview

```bash
curl -X POST http://localhost:3000/api/v1/whatsapp/send-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "to": "+15551234567",
    "text": "Check out our website: https://example.com",
    "previewUrl": true
  }'
```

### 3. JavaScript/React Example

```javascript
const sendMessage = async (phoneNumber, messageText) => {
  try {
    const response = await fetch('/api/v1/whatsapp/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        to: phoneNumber,
        text: messageText,
        previewUrl: false
      })
    });

    const data = await response.json();

    if (data.type === '1') {
      console.log('Message sent!', data.data.messages[0].id);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};

// Usage
await sendMessage('+15551234567', 'Hello from our app!');
```

### 4. Node.js Example

```javascript
const axios = require('axios');

async function sendWhatsAppMessage(to, text, previewUrl = false) {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/v1/whatsapp/send-message',
      {
        to,
        text,
        previewUrl
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.JWT_TOKEN}`
        }
      }
    );

    console.log('Message sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
sendWhatsAppMessage('+15551234567', 'Your order is ready for pickup!');
```

---

## Response Format

### Success Response (200)

```json
{
  "type": "1",
  "message": "Message sent successfully",
  "data": {
    "messaging_product": "whatsapp",
    "contacts": [
      {
        "input": "+15551234567",
        "wa_id": "15551234567"
      }
    ],
    "messages": [
      {
        "id": "wamid.HBgLMTU1NTEyMzQ1NjcVAgARGBI5QUFEMEY2RjQ3RDFBQTU5OTcA"
      }
    ]
  }
}
```

**Response Fields:**

- `type: "1"` - Success indicator
- `message` - Human-readable success message
- `data.messaging_product` - Always "whatsapp"
- `data.contacts[0].input` - Phone number as sent
- `data.contacts[0].wa_id` - WhatsApp ID (phone without +)
- `data.messages[0].id` - **Message ID** (use this to track message status)

---

## Error Responses

### 1. Missing Required Fields (400)

```json
{
  "type": "3",
  "message": "Missing required fields: to, text",
  "data": null
}
```

### 2. Invalid Phone Number Format (400)

```json
{
  "type": "3",
  "message": "Phone number must be in E.164 format (e.g., +1234567890)",
  "data": null
}
```

### 3. Unauthorized (401)

```json
{
  "type": "3",
  "message": "Unauthorized",
  "data": null
}
```

**Cause:** Missing or invalid JWT token

### 4. Business Not Found (500)

```json
{
  "type": "3",
  "message": "Business configuration not found or invalid",
  "data": null
}
```

**Cause:**
- Business doesn't exist
- WhatsApp not configured
- Missing access token or phone number ID

### 5. Meta API Error (500)

```json
{
  "type": "3",
  "message": "Failed to send message",
  "data": {
    "error": {
      "message": "Message failed to send because more than 24 hours have passed since the customer last replied to this number.",
      "type": "OAuthException",
      "code": 131047,
      "error_subcode": 2388003,
      "fbtrace_id": "ABC123"
    }
  }
}
```

**Common Meta API Errors:**

| Error Code | Subcode | Description | Solution |
|------------|---------|-------------|----------|
| 131047 | 2388003 | 24-hour window closed | Use template message |
| 100 | - | Invalid phone number | Check phone format |
| 131031 | - | Unsupported message type | Check message format |
| 131026 | - | Message too long | Reduce message length |
| 131051 | - | Rate limit exceeded | Slow down sending |

---

## Phone Number Format (E.164)

### Valid Formats ✅

```
+15551234567    (USA)
+51987654321    (Peru)
+5511987654321  (Brazil)
+447911123456   (UK)
+33612345678    (France)
```

### Invalid Formats ❌

```
15551234567     (Missing +)
+1 555 123 4567 (Has spaces)
+1-555-123-4567 (Has dashes)
(555) 123-4567  (Has parentheses)
001551234567    (Wrong format)
```

### Validation Regex

```typescript
/^\+[1-9]\d{1,14}$/
```

**Explanation:**
- `^` - Start of string
- `\+` - Must start with +
- `[1-9]` - First digit cannot be 0
- `\d{1,14}` - 1 to 14 more digits
- `$` - End of string

---

## URL Preview Feature

### When `previewUrl: true`

WhatsApp will fetch and display a preview of URLs in the message:

**Message:**
```
Check out our latest products: https://shop.example.com
```

**User sees:**
```
Check out our latest products: https://shop.example.com

[Preview Card]
┌─────────────────────────┐
│ [Image]                 │
│ Shop Example            │
│ Amazing products...     │
└─────────────────────────┘
```

### When `previewUrl: false` (default)

URL is displayed as plain text without preview.

---

## Message Limits

### Character Limits

- **Maximum message length:** 4,096 characters
- **Recommended:** Keep under 1,000 characters for best UX

### Rate Limits

Meta enforces rate limits per phone number:

- **Tier 1:** 1,000 messages/24 hours
- **Tier 2:** 10,000 messages/24 hours
- **Tier 3:** 100,000 messages/24 hours

Your tier depends on phone number quality and message quality.

---

## 24-Hour Messaging Window

### The Rule

You can only send **text messages** to users who have:
- Messaged you in the last 24 hours, OR
- Opted in to receive messages

### After 24 Hours

Use **template messages** instead:
- Pre-approved message formats
- Requires template creation and approval
- Use `/api/v1/whatsapp/send-template` endpoint

### Example Flow

```
Customer messages: "Hi"              ← Opens 24-hour window
You can send text: "Hello! How can I help?"  ✅ Works
...
24 hours pass
...
You try text: "Still need help?"     ❌ Fails (131047 error)
You send template: order_update      ✅ Works
```

---

## Message Tracking

Every sent message is saved to the database for tracking:

### What's Stored

```typescript
{
  _id: ObjectId("..."),
  subDomain: "business-name",
  localId: "location-123",
  to: "+15551234567",
  messageType: "text",
  content: {
    text: "Hello, your order is ready!"
  },
  messageId: "wamid.HBgL...",
  status: "sent",
  createdAt: Date,
  updatedAt: Date
}
```

### Message Statuses

Messages can have these statuses (updated via webhooks):

1. **sent** - Message sent to Meta
2. **delivered** - Message delivered to user's device
3. **read** - User opened the message
4. **failed** - Message failed to send

---

## Use Cases

### 1. Order Confirmation

```javascript
await sendMessage(
  customer.phone,
  `Your order #${orderId} has been confirmed! We'll notify you when it's ready.`
);
```

### 2. Customer Support Response

```javascript
await sendMessage(
  customer.phone,
  `Hi ${customer.name}, thanks for reaching out! Our team will respond shortly.`
);
```

### 3. Delivery Update

```javascript
await sendMessage(
  customer.phone,
  `Your order is out for delivery! Track it here: ${trackingUrl}`,
  { previewUrl: true }
);
```

### 4. Appointment Reminder

```javascript
await sendMessage(
  customer.phone,
  `Reminder: Your appointment is tomorrow at ${appointmentTime}. Reply CONFIRM to confirm.`
);
```

---

## Security Considerations

### 1. Phone Number Privacy

- Never log full phone numbers in public logs
- Mask phone numbers: `+1***4567`
- Store phone numbers encrypted if required

### 2. Message Content

- Sanitize user input before sending
- Don't include sensitive data (passwords, full credit card numbers)
- Validate URLs before sending with `previewUrl: true`

### 3. Rate Limiting

Implement your own rate limiting to prevent:
- Spam
- API abuse
- Tier downgrades

```javascript
// Example rate limiter
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute per user
  message: 'Too many messages, please try again later'
});

router.post('/send-message', authenticate, rateLimiter, sendTextMessage);
```

---

## Performance Optimization

### 1. Async Processing

For bulk messages, use a queue:

```javascript
// Using Bull Queue
const messageQueue = new Queue('whatsapp-messages');

// Add to queue
await messageQueue.add({
  to: customer.phone,
  text: 'Your order is ready!'
});

// Process queue
messageQueue.process(async (job) => {
  await sendMessage(job.data.to, job.data.text);
});
```

### 2. Batch Operations

Send multiple messages efficiently:

```javascript
const sendBulkMessages = async (recipients, message) => {
  const promises = recipients.map(phone =>
    sendMessage(phone, message)
  );

  // Send in batches of 10
  for (let i = 0; i < promises.length; i += 10) {
    await Promise.all(promises.slice(i, i + 10));
    await delay(1000); // Wait 1 second between batches
  }
};
```

---

## Troubleshooting

### Problem: "Business configuration not found"

**Check:**
1. Business exists in database
2. `whatsappEnabled: true`
3. `whatsappAccessToken` is set
4. `whatsappPhoneNumberIds` array not empty

### Problem: "24-hour window closed"

**Solution:**
- Use template message instead
- Check if customer has messaged recently
- Verify conversation window: `GET /api/v1/whatsapp/conversations/:phone/window`

### Problem: "Rate limit exceeded"

**Solution:**
- Slow down sending rate
- Implement queue system
- Check your phone number tier
- Contact Meta to increase tier

### Problem: "Invalid phone number"

**Check:**
1. Format is E.164 (+country_code + number)
2. No spaces, dashes, or special characters
3. Country code is valid
4. Number length is correct for country

---

## Summary

The `send-message` endpoint:

✅ **Sends text messages** via WhatsApp Business API
✅ **Validates** phone format and required fields
✅ **Tracks** all sent messages in database
✅ **Supports** URL previews
✅ **Handles** errors gracefully
✅ **Logs** all operations for debugging
✅ **Respects** 24-hour messaging window

**Key Points:**
- Use for conversations within 24-hour window
- Switch to templates after 24 hours
- Always validate phone numbers
- Track message IDs for status updates
- Handle rate limits appropriately

**Related Endpoints:**
- [Send Template Message](WHATSAPP_TEMPLATES_API.md) - For messages outside 24-hour window
- [Send Interactive Message](WHATSAPP_ENDPOINTS_REFERENCE.md#3-send-interactive-message) - For buttons and lists
- [Check Conversation Window](WHATSAPP_ENDPOINTS_REFERENCE.md#9-check-conversation-window) - Check if text message allowed

---

**Status:** Production Ready ✅
