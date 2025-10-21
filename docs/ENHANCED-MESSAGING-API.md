# Enhanced Messaging API Documentation

## Overview

This document describes the enhanced messaging capabilities implemented in the WhatsApp integration, providing support for interactive messages, media sharing, location sharing, and advanced messaging features.

## New Messaging Endpoints

### Interactive Messages

#### Send Buttons
**Endpoint:** `POST /api/whatsapp/send-buttons`

Send interactive button messages to users.

**Request Body:**
```json
{
  "botId": "string",
  "to": "string",
  "buttons": [
    {
      "text": "View Menu",
      "id": "menu",
      "type": "reply"
    },
    {
      "text": "Call Us",
      "id": "call",
      "type": "call",
      "phoneNumber": "+1234567890"
    },
    {
      "text": "Visit Website",
      "id": "website",
      "type": "url",
      "url": "https://example.com"
    }
  ]
}
```

#### Send List
**Endpoint:** `POST /api/whatsapp/send-list`

Send interactive list messages to users.

**Request Body:**
```json
{
  "botId": "string",
  "to": "string",
  "list": {
    "title": "Menu Categories",
    "description": "Choose a category to browse our menu",
    "buttonText": "View Menu",
    "sections": [
      {
        "title": "Food Categories",
        "rows": [
          {
            "id": "appetizers",
            "title": "Appetizers",
            "description": "Start your meal right"
          },
          {
            "id": "mains",
            "title": "Main Courses",
            "description": "Our signature dishes"
          }
        ]
      }
    ]
  }
}
```

### Media Messages

#### Send Image
**Endpoint:** `POST /api/whatsapp/send-image`

Send image messages with optional captions.

**Request Body:**
```json
{
  "botId": "string",
  "to": "string",
  "image": {
    "url": "https://example.com/image.jpg",
    "filename": "menu.jpg",
    "mimetype": "image/jpeg"
  },
  "caption": "Our delicious menu for today!"
}
```

#### Send Video
**Endpoint:** `POST /api/whatsapp/send-video`

Send video messages with optional captions.

**Request Body:**
```json
{
  "botId": "string",
  "to": "string",
  "video": {
    "url": "https://example.com/video.mp4",
    "filename": "promo.mp4",
    "mimetype": "video/mp4"
  },
  "caption": "Check out our new dishes!"
}
```

#### Send Document
**Endpoint:** `POST /api/whatsapp/send-document`

Send document files with optional captions.

**Request Body:**
```json
{
  "botId": "string",
  "to": "string",
  "document": {
    "url": "https://example.com/menu.pdf",
    "filename": "menu.pdf",
    "mimetype": "application/pdf"
  },
  "caption": "Complete menu with prices"
}
```

#### Send Voice
**Endpoint:** `POST /api/whatsapp/send-voice`

Send voice messages.

**Request Body:**
```json
{
  "botId": "string",
  "to": "string",
  "voice": {
    "url": "https://example.com/voice.ogg",
    "filename": "welcome.ogg",
    "mimetype": "audio/ogg"
  }
}
```

### Location and Contact Messages

#### Send Location
**Endpoint:** `POST /api/whatsapp/send-location`

Send location messages.

**Request Body:**
```json
{
  "botId": "string",
  "to": "string",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "title": "Our Restaurant",
    "address": "123 Main St, New York, NY"
  }
}
```

#### Send Contact
**Endpoint:** `POST /api/whatsapp/send-contact`

Send contact information.

**Request Body:**
```json
{
  "botId": "string",
  "to": "string",
  "contact": {
    "fullName": "John Doe",
    "phoneNumber": "+1234567890",
    "organization": "Restaurant Manager",
    "vcard": "BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nTEL:+1234567890\nEND:VCARD"
  }
}
```

### Template Messages

#### Send Template
**Endpoint:** `POST /api/whatsapp/send-template`

Send WhatsApp Business template messages.

**Request Body:**
```json
{
  "botId": "string",
  "to": "string",
  "template": {
    "name": "order_confirmation",
    "language": "en",
    "components": [
      {
        "type": "header",
        "parameters": [
          {
            "type": "text",
            "text": "Order #12345"
          }
        ]
      },
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "Your order has been confirmed"
          }
        ]
      }
    ]
  }
}
```

### Poll Messages

#### Send Poll
**Endpoint:** `POST /api/whatsapp/send-poll`

Send poll messages to gather user feedback.

**Request Body:**
```json
{
  "botId": "string",
  "to": "string",
  "poll": {
    "name": "Customer Satisfaction",
    "options": [
      "Excellent",
      "Good",
      "Average",
      "Poor"
    ],
    "multipleAnswers": false
  }
}
```

### Link Preview

#### Send Link Preview
**Endpoint:** `POST /api/whatsapp/send-link-preview`

Send messages with rich link previews.

**Request Body:**
```json
{
  "botId": "string",
  "to": "string",
  "text": "Check out our new menu: https://example.com/menu",
  "preview": {
    "url": "https://example.com/menu",
    "title": "New Menu Available",
    "description": "Discover our latest dishes and specials",
    "image": {
      "url": "https://example.com/menu-preview.jpg"
    }
  }
}
```

## TypeScript Types

### Button Message
```typescript
interface ButtonMessage {
  text: string;
  id: string;
  type?: 'reply' | 'url' | 'call' | 'copy';
  url?: string;
  phoneNumber?: string;
  copyCode?: string;
}
```

### List Message
```typescript
interface ListMessage {
  title: string;
  description: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
}
```

### Media Message
```typescript
interface MediaMessage {
  url?: string;
  filename?: string;
  mimetype?: string;
  data?: string; // base64
}
```

### Location Message
```typescript
interface LocationMessage {
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
}
```

### Contact Message
```typescript
interface ContactMessage {
  fullName: string;
  phoneNumber: string;
  organization?: string;
  vcard?: string;
}
```

### Template Message
```typescript
interface TemplateMessage {
  name: string;
  language: string;
  components?: Array<{
    type: 'header' | 'body' | 'footer' | 'button';
    parameters?: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
      text?: string;
      currency?: {
        fallback_value: string;
        code: string;
        amount_1000: number;
      };
      date_time?: {
        fallback_value: string;
      };
      image?: {
        link: string;
      };
      document?: {
        link: string;
        filename: string;
      };
    }>;
  }>;
}
```

### Poll Message
```typescript
interface PollMessage {
  name: string;
  options: string[];
  multipleAnswers?: boolean;
}
```

### Link Preview Message
```typescript
interface LinkPreviewMessage {
  url: string;
  title: string;
  description: string;
  image?: {
    url?: string;
    data?: string;
  };
}
```

## Usage Examples

### Restaurant Menu with Buttons
```javascript
// Send menu with action buttons
const menuButtons = {
  botId: "restaurant_bot_123",
  to: "+1234567890",
  buttons: [
    { text: "View Menu", id: "menu", type: "reply" },
    { text: "Order Now", id: "order", type: "reply" },
    { text: "Call Us", id: "call", type: "call", phoneNumber: "+1234567890" }
  ]
};

await fetch('/api/whatsapp/send-buttons', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(menuButtons)
});
```

### Product Catalog with List
```javascript
// Send product categories as a list
const productList = {
  botId: "restaurant_bot_123",
  to: "+1234567890",
  list: {
    title: "Our Menu",
    description: "Choose a category to see our delicious options",
    buttonText: "Browse Menu",
    sections: [{
      title: "Categories",
      rows: [
        { id: "appetizers", title: "Appetizers", description: "Start your meal" },
        { id: "mains", title: "Main Courses", description: "Signature dishes" },
        { id: "desserts", title: "Desserts", description: "Sweet endings" }
      ]
    }]
  }
};

await fetch('/api/whatsapp/send-list', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(productList)
});
```

### Send Restaurant Location
```javascript
// Send restaurant location
const location = {
  botId: "restaurant_bot_123",
  to: "+1234567890",
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    title: "LeMenu Restaurant",
    address: "123 Main St, New York, NY 10001"
  }
};

await fetch('/api/whatsapp/send-location', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(location)
});
```

### Order Confirmation Template
```javascript
// Send order confirmation using template
const orderTemplate = {
  botId: "restaurant_bot_123",
  to: "+1234567890",
  template: {
    name: "order_confirmation",
    language: "en",
    components: [
      {
        type: "header",
        parameters: [{ type: "text", text: "Order #12345" }]
      },
      {
        type: "body",
        parameters: [
          { type: "text", text: "John" },
          { type: "text", text: "2x Pizza Margherita" },
          { type: "currency", currency: { fallback_value: "$25.99", code: "USD", amount_1000: 25990 } }
        ]
      }
    ]
  }
};

await fetch('/api/whatsapp/send-template', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderTemplate)
});
```

## Error Handling

All endpoints return standardized responses:

**Success Response:**
```json
{
  "type": "1",
  "message": "Message sent successfully",
  "data": {
    "messageId": "wamid.xxx",
    "status": "sent"
  }
}
```

**Error Response:**
```json
{
  "type": "3",
  "message": "Bot not found",
  "data": null
}
```

## Compliance Features

All messaging endpoints include built-in compliance features:

- **Rate Limiting**: Automatic message throttling
- **Spam Detection**: Content filtering and analysis
- **Human-like Behavior**: Random delays and typing indicators
- **Message Variations**: Automatic message variation generation

## Best Practices

1. **Use Interactive Messages**: Prefer buttons and lists for better user experience
2. **Optimize Media**: Compress images and videos for faster delivery
3. **Template Messages**: Use for important notifications and confirmations
4. **Location Sharing**: Provide clear addresses and landmarks
5. **Contact Sharing**: Include complete contact information
6. **Poll Usage**: Use polls for feedback and surveys
7. **Link Previews**: Enhance link sharing with rich previews

## Rate Limits

- **Text Messages**: 100 per minute per bot
- **Media Messages**: 50 per minute per bot
- **Interactive Messages**: 30 per minute per bot
- **Template Messages**: 20 per minute per bot

## Security Considerations

- All endpoints require authentication via `tokenAuthHandler`
- Media files are validated for type and size
- User input is sanitized and validated
- Rate limiting prevents abuse
- Compliance features maintain WhatsApp account health
