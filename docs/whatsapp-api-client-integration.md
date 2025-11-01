# WhatsApp Business API - Client-Side Integration Specs

## 📋 Overview

This document provides complete specifications for integrating your frontend/client-side application with the WhatsApp Business API backend endpoints.

**Base URL Pattern:**
- Production: `https://ssgg.api.cartaai.pe/api/v1/whatsapp`
- Development: `https://dev.ssgg.api.cartaai.pe/api/v1/whatsapp`
- Local: `http://localhost:3000/api/v1/whatsapp`

---

## 🔐 Authentication

All endpoints (except webhooks) require JWT Bearer token authentication.

**Header Format:**
```
Authorization: Bearer {your_jwt_token}
```

**Token Source:**
Get token from login endpoint: `POST /api/v1/auth/login`

---

## 📤 API Endpoints

### 1. Send Text Message

**Endpoint:** `POST /api/v1/whatsapp/send-message`

**Description:** Send a plain text message to a WhatsApp phone number

**Request Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "to": "+51987654321",           // Required: Recipient phone number (E.164 format)
  "text": "Hello! How can I help?", // Required: Message text
  "previewUrl": false,              // Optional: Enable URL preview (default: false)
  "subDomain": "restaurant123",     // Optional: Business subdomain (if not in query/user context)
  "localId": "local1"               // Optional: Business location ID
}
```

**Response (Success):**
```json
{
  "type": "1",
  "message": "Message sent successfully",
  "data": {
    "messaging_product": "whatsapp",
    "contacts": [{
      "input": "+51987654321",
      "wa_id": "51987654321"
    }],
    "messages": [{
      "id": "wamid.xxx..."
    }]
  }
}
```

**Response (Error):**
```json
{
  "type": "3",
  "message": "Missing required fields: to, text",
  "data": null
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing fields)
- `401` - Unauthorized (invalid token)
- `500` - Server Error

---

### 2. Send Template Message

**Endpoint:** `POST /api/v1/whatsapp/send-template`

**Description:** Send a pre-approved WhatsApp message template

**Request Body:**
```json
{
  "to": "+51987654321",
  "templateName": "hello_world",              // Required: Template name from Meta
  "languageCode": "en_US",                     // Optional: Language code (default: "en_US")
  "parameters": [                              // Optional: Template parameters
    {
      "type": "text",
      "value": "John"
    }
  ],
  "subDomain": "restaurant123",                // Optional
  "localId": "local1"                          // Optional
}
```

**Response (Success):**
```json
{
  "type": "1",
  "message": "Template message sent successfully",
  "data": {
    "messaging_product": "whatsapp",
    "contacts": [...],
    "messages": [{
      "id": "wamid.xxx..."
    }]
  }
}
```

---

### 3. Send Interactive Message

**Endpoint:** `POST /api/v1/whatsapp/send-interactive`

**Description:** Send an interactive message with buttons or list

**Request Body:**
```json
{
  "to": "+51987654321",
  "type": "button",              // Required: "button" or "list"
  "body": "Please choose an option:", // Required: Message body text
  "footer": "Footer text",       // Optional: Footer text
  "header": {                    // Optional: Header (text, image, video, document)
    "type": "text",
    "text": "Header text"
  },
  "action": {                    // Required: Action configuration
    "buttons": [                 // For type: "button"
      {
        "type": "reply",
        "reply": {
          "id": "btn_1",
          "title": "Option 1"
        }
      },
      {
        "type": "reply",
        "reply": {
          "id": "btn_2",
          "title": "Option 2"
        }
      }
    ]
    // OR for type: "list"
    // "button": "View Options",
    // "sections": [...]
  },
  "subDomain": "restaurant123",  // Optional
  "localId": "local1"            // Optional
}
```

**Response:** Same as text message

---

### 4. Send Media Message

**Endpoint:** `POST /api/v1/whatsapp/send-media`

**Description:** Send an image, audio, video, or document

**Request Body:**
```json
{
  "to": "+51987654321",
  "type": "image",               // Required: "image" | "audio" | "video" | "document"
  "mediaId": "123456789",        // Optional: Media ID from Meta (if already uploaded)
  "mediaUrl": "https://...",     // Optional: Public URL to media (if mediaId not provided)
  "caption": "Image caption",    // Optional: Caption (for image/video only)
  "filename": "document.pdf",    // Optional: Filename (for document only)
  "subDomain": "restaurant123",  // Optional
  "localId": "local1"            // Optional
}
```

**Note:** Either `mediaId` OR `mediaUrl` must be provided

**Response:** Same as text message

---

### 5. Mark Message as Read

**Endpoint:** `POST /api/v1/whatsapp/messages/:messageId/read`

**Description:** Mark an incoming message as read

**Path Parameters:**
- `messageId` - The WhatsApp message ID (e.g., `wamid.xxx...`)

**Request Query (Optional):**
```
?subDomain=restaurant123&localId=local1
```

**Request Body:** None (or can include subDomain/localId)

**Response (Success):**
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

### 6. Get Message Templates

**Endpoint:** `GET /api/v1/whatsapp/templates`

**Description:** Get all approved message templates for the business

**Query Parameters (Optional):**
```
?subDomain=restaurant123&localId=local1
```

**Response (Success):**
```json
{
  "type": "1",
  "message": "Templates retrieved successfully",
  "data": {
    "data": [
      {
        "name": "hello_world",
        "language": "en_US",
        "status": "APPROVED",
        "category": "MARKETING",
        "components": [...]
      }
    ],
    "paging": {...}
  }
}
```

---

### 7. Get Phone Numbers

**Endpoint:** `GET /api/v1/whatsapp/phone-numbers`

**Description:** Get WhatsApp Business phone numbers for the business

**Query Parameters (Optional):**
```
?subDomain=restaurant123&localId=local1
```

**Response (Success):**
```json
{
  "type": "1",
  "message": "Phone numbers retrieved successfully",
  "data": {
    "data": [
      {
        "verified_name": "My Business",
        "display_phone_number": "+1234567890",
        "id": "123456789",
        "quality_rating": "GREEN",
        "platform_type": "CLOUD_API"
      }
    ]
  }
}
```

---

## 🔧 Business Context

The API automatically determines which business to use based on priority:

1. **Query Parameters** (`?subDomain=xxx&localId=yyy`)
2. **Request Body** (`subDomain` and `localId` fields)
3. **Authenticated User's Business** (from JWT token)

**Recommendation:** Always include `subDomain` in query params or body for clarity.

---

## 📝 TypeScript Client Example

```typescript
// types/whatsapp.ts
export interface WhatsAppApiResponse<T> {
  type: string;
  message: string;
  data: T | null;
}

export interface SendTextMessageRequest {
  to: string;
  text: string;
  previewUrl?: boolean;
  subDomain?: string;
  localId?: string;
}

export interface SendTemplateMessageRequest {
  to: string;
  templateName: string;
  languageCode?: string;
  parameters?: Array<{
    type?: string;
    value: string;
  }>;
  subDomain?: string;
  localId?: string;
}

export interface SendInteractiveMessageRequest {
  to: string;
  type: 'button' | 'list';
  body: string;
  footer?: string;
  header?: any;
  action: any;
  subDomain?: string;
  localId?: string;
}

export interface SendMediaMessageRequest {
  to: string;
  type: 'image' | 'audio' | 'video' | 'document';
  mediaId?: string;
  mediaUrl?: string;
  caption?: string;
  filename?: string;
  subDomain?: string;
  localId?: string;
}

// api/whatsapp.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ssgg.api.cartaai.pe';
const WHATSAPP_API_BASE = `${API_BASE_URL}/api/v1/whatsapp`;

// Get auth token from your auth store/context
const getAuthToken = () => {
  // Your implementation - e.g., from localStorage, context, etc.
  return localStorage.getItem('accessToken') || '';
};

const apiClient = axios.create({
  baseURL: WHATSAPP_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const whatsappApi = {
  /**
   * Send a text message
   */
  sendTextMessage: async (
    params: SendTextMessageRequest,
    options?: { subDomain?: string; localId?: string }
  ): Promise<WhatsAppApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (options?.subDomain) queryParams.append('subDomain', options.subDomain);
    if (options?.localId) queryParams.append('localId', options.localId);

    const url = `/send-message${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await apiClient.post(url, params);
    return response.data;
  },

  /**
   * Send a template message
   */
  sendTemplateMessage: async (
    params: SendTemplateMessageRequest,
    options?: { subDomain?: string; localId?: string }
  ): Promise<WhatsAppApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (options?.subDomain) queryParams.append('subDomain', options.subDomain);
    if (options?.localId) queryParams.append('localId', options.localId);

    const url = `/send-template${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await apiClient.post(url, params);
    return response.data;
  },

  /**
   * Send an interactive message
   */
  sendInteractiveMessage: async (
    params: SendInteractiveMessageRequest,
    options?: { subDomain?: string; localId?: string }
  ): Promise<WhatsAppApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (options?.subDomain) queryParams.append('subDomain', options.subDomain);
    if (options?.localId) queryParams.append('localId', options.localId);

    const url = `/send-interactive${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await apiClient.post(url, params);
    return response.data;
  },

  /**
   * Send a media message
   */
  sendMediaMessage: async (
    params: SendMediaMessageRequest,
    options?: { subDomain?: string; localId?: string }
  ): Promise<WhatsAppApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (options?.subDomain) queryParams.append('subDomain', options.subDomain);
    if (options?.localId) queryParams.append('localId', options.localId);

    const url = `/send-media${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await apiClient.post(url, params);
    return response.data;
  },

  /**
   * Mark message as read
   */
  markMessageAsRead: async (
    messageId: string,
    options?: { subDomain?: string; localId?: string }
  ): Promise<WhatsAppApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (options?.subDomain) queryParams.append('subDomain', options.subDomain);
    if (options?.localId) queryParams.append('localId', options.localId);

    const url = `/messages/${messageId}/read${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await apiClient.post(url);
    return response.data;
  },

  /**
   * Get message templates
   */
  getTemplates: async (options?: {
    subDomain?: string;
    localId?: string;
  }): Promise<WhatsAppApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (options?.subDomain) queryParams.append('subDomain', options.subDomain);
    if (options?.localId) queryParams.append('localId', options.localId);

    const url = `/templates${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Get phone numbers
   */
  getPhoneNumbers: async (options?: {
    subDomain?: string;
    localId?: string;
  }): Promise<WhatsAppApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (options?.subDomain) queryParams.append('subDomain', options.subDomain);
    if (options?.localId) queryParams.append('localId', options.localId);

    const url = `/phone-numbers${queryParams.toString() ? `?${queryParams}` : ''}`;
    const response = await apiClient.get(url);
    return response.data;
  },
};
```

---

## 💡 Usage Examples

### Example 1: Send Simple Text Message

```typescript
import { whatsappApi } from '@/api/whatsapp';

// Basic usage
const response = await whatsappApi.sendTextMessage({
  to: '+51987654321',
  text: 'Hello! Your order is ready.',
}, {
  subDomain: 'restaurant123',
});

if (response.type === '1') {
  console.log('Message sent!', response.data);
  const messageId = response.data.messages[0].id;
} else {
  console.error('Error:', response.message);
}
```

### Example 2: Send Template Message with Parameters

```typescript
const response = await whatsappApi.sendTemplateMessage({
  to: '+51987654321',
  templateName: 'order_confirmation',
  languageCode: 'es',
  parameters: [
    { type: 'text', value: 'ORD-12345' },
    { type: 'text', value: 'S/ 45.50' },
  ],
}, {
  subDomain: 'restaurant123',
});
```

### Example 3: Send Interactive Button Message

```typescript
const response = await whatsappApi.sendInteractiveMessage({
  to: '+51987654321',
  type: 'button',
  body: 'Would you like to track your order?',
  footer: 'Restaurant Name',
  action: {
    buttons: [
      {
        type: 'reply',
        reply: {
          id: 'btn_track',
          title: 'Track Order'
        }
      },
      {
        type: 'reply',
        reply: {
          id: 'btn_cancel',
          title: 'Cancel Order'
        }
      }
    ]
  }
}, {
  subDomain: 'restaurant123',
});
```

### Example 4: Send Image with Caption

```typescript
const response = await whatsappApi.sendMediaMessage({
  to: '+51987654321',
  type: 'image',
  mediaUrl: 'https://example.com/menu.jpg',
  caption: 'Check out our new menu items!',
}, {
  subDomain: 'restaurant123',
});
```

### Example 5: Get Templates and Phone Numbers

```typescript
// Get templates
const templatesResponse = await whatsappApi.getTemplates({
  subDomain: 'restaurant123',
});

if (templatesResponse.type === '1') {
  const templates = templatesResponse.data.data;
  console.log('Available templates:', templates);
}

// Get phone numbers
const phoneNumbersResponse = await whatsappApi.getPhoneNumbers({
  subDomain: 'restaurant123',
});

if (phoneNumbersResponse.type === '1') {
  const phoneNumbers = phoneNumbersResponse.data.data;
  console.log('Phone numbers:', phoneNumbers);
}
```

---

## ⚠️ Error Handling

**Standard Error Response Format:**
```json
{
  "type": "3",
  "message": "Error description",
  "data": null
}
```

**Common Error Types:**
- `"3"` - Error (operation failed)
- `"401"` - Unauthorized (invalid/missing token)
- `"403"` - Forbidden (insufficient permissions)
- `"701"` - Malformed JSON (invalid request format)

**Error Handling Example:**
```typescript
try {
  const response = await whatsappApi.sendTextMessage({
    to: '+51987654321',
    text: 'Hello',
  });

  if (response.type === '1') {
    // Success
    console.log('Success:', response.data);
  } else {
    // API returned error
    console.error('API Error:', response.message);
    // Handle specific error types
    if (response.type === '401') {
      // Token expired, redirect to login
      router.push('/login');
    }
  }
} catch (error: any) {
  // Network or other errors
  console.error('Request failed:', error.message);
  if (error.response?.status === 401) {
    // Unauthorized - refresh token or redirect
  }
}
```

---

## 🔄 Response Data Structure

### Message Response Data

When a message is sent successfully, `response.data` contains:

```typescript
{
  messaging_product: "whatsapp",
  contacts: [{
    input: "+51987654321",
    wa_id: "51987654321"
  }],
  messages: [{
    id: "wamid.HBgNNT..."
  }]
}
```

**Important:** Store `messages[0].id` to track message status via webhooks.

---

## 📱 Phone Number Format

**Required Format:** E.164 international format
- ✅ Correct: `+51987654321`
- ✅ Correct: `51987654321` (some contexts)
- ❌ Wrong: `987654321`
- ❌ Wrong: `+51 987 654 321`

**Recommendation:** Always use E.164 format with country code (`+51987654321`)

---

## 🔐 Security Best Practices

1. **Never expose tokens:** Keep JWT tokens secure, never log them
2. **Use HTTPS only:** All API calls should be over HTTPS
3. **Store tokens securely:** Use httpOnly cookies or secure storage
4. **Validate phone numbers:** Validate format before sending
5. **Rate limiting:** Respect backend rate limits (not exposed in API)

---

## 📊 Status Codes Reference

| Code | Meaning | Action |
|------|---------|--------|
| `200` | Success | Process data |
| `400` | Bad Request | Check request body |
| `401` | Unauthorized | Refresh/renew token |
| `403` | Forbidden | Check permissions |
| `500` | Server Error | Retry or report |

---

## 🧪 Testing Checklist

- [ ] Authentication: Verify token is sent correctly
- [ ] Business Context: Test with/without subDomain/localId
- [ ] Error Handling: Test invalid phone numbers, missing fields
- [ ] Response Parsing: Extract message IDs correctly
- [ ] Network Errors: Handle offline/timeout scenarios
- [ ] Rate Limiting: Handle 429 Too Many Requests (if applicable)

---

## 🔗 Integration Flow

```
1. User Login → Get JWT Token
2. Store Token → Secure Storage
3. Call WhatsApp API → With Bearer Token
4. Include Business Context → subDomain (+ localId if needed)
5. Handle Response → Check type, extract data
6. Track Messages → Store message IDs for status tracking
```

---

## 📚 Additional Resources

- **Backend Base URL:** `https://ssgg.api.cartaai.pe/api/v1`
- **WhatsApp Route:** `/api/v1/whatsapp/*`
- **Auth Route:** `/api/v1/auth/login`
- **Standard Response Format:** `{ type, message, data }`

---

## ⚡ Quick Start

```typescript
// 1. Install dependencies (if using axios)
// npm install axios

// 2. Create API client
// (see TypeScript example above)

// 3. Use in your component
import { whatsappApi } from '@/api/whatsapp';

const sendMessage = async () => {
  try {
    const result = await whatsappApi.sendTextMessage({
      to: '+51987654321',
      text: 'Hello from my app!',
    }, {
      subDomain: 'mybusiness',
    });
    
    if (result.type === '1') {
      alert('Message sent!');
    }
  } catch (error) {
    console.error('Failed to send:', error);
  }
};
```

---

## 🎯 Summary

- **7 endpoints** for messaging and information
- **JWT Bearer authentication** required
- **Business context** via query params or body
- **Standard response format** (`type`, `message`, `data`)
- **E.164 phone format** required
- **All messages stored** in database automatically
- **Message status tracking** via webhooks

