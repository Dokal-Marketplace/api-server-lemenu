# WhatsApp Conversations API - Datatable Endpoint

## Overview

The Conversations API provides a powerful datatable endpoint for retrieving and managing WhatsApp conversations with full support for pagination, sorting, filtering, and search.

## Endpoint

**URL:** `GET /api/v1/whatsapp/conversations`

**Authentication:** Required (Bearer JWT token)

---

## Features

✅ **Pagination** - Page-based navigation with configurable page size
✅ **Sorting** - Sort by any field (lastActivity, createdAt, etc.)
✅ **Filtering** - Filter by intent, active status, date range
✅ **Search** - Search by phone number, customer name, or email
✅ **Enriched Data** - Includes message counts, duration, last message preview
✅ **Bot Info** - Populated bot details
✅ **Order Tracking** - Current order and order history

---

## Query Parameters

### Pagination

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 10 | Number of items per page |

### Sorting

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sortBy` | string | `lastActivity` | Field to sort by |
| `sortOrder` | string | `desc` | Sort order: `asc` or `desc` |

**Available Sort Fields:**
- `lastActivity` - Last conversation activity
- `createdAt` - Conversation creation date
- `updatedAt` - Last update timestamp
- `currentIntent` - Current conversation intent
- `userId` - Phone number

### Filtering

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Search in phone number, customer name, or email |
| `intent` | string | `all` | Filter by intent (menu, order, support, etc.) |
| `isActive` | string | `all` | Filter by active status (`true`, `false`, or `all`) |
| `dateFrom` | string | - | Filter conversations from this date (ISO 8601) |
| `dateTo` | string | - | Filter conversations until this date (ISO 8601) |

**Available Intents:**
- `menu` - Browsing menu
- `order` - Placing order
- `support` - Customer support
- `info` - Information request
- `payment` - Payment processing
- `delivery` - Delivery tracking
- `idle` - No active intent

---

## Example Requests

### 1. Basic Request (Default Pagination)

```bash
curl -X GET "http://localhost:3000/api/v1/whatsapp/conversations" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. With Pagination

```bash
curl -X GET "http://localhost:3000/api/v1/whatsapp/conversations?page=2&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. With Sorting

```bash
# Sort by creation date, oldest first
curl -X GET "http://localhost:3000/api/v1/whatsapp/conversations?sortBy=createdAt&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Sort by last activity, newest first (default)
curl -X GET "http://localhost:3000/api/v1/whatsapp/conversations?sortBy=lastActivity&sortOrder=desc" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Filter by Intent

```bash
# Only show conversations with 'order' intent
curl -X GET "http://localhost:3000/api/v1/whatsapp/conversations?intent=order" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Only show conversations with 'support' intent
curl -X GET "http://localhost:3000/api/v1/whatsapp/conversations?intent=support" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Filter by Active Status

```bash
# Only show active conversations
curl -X GET "http://localhost:3000/api/v1/whatsapp/conversations?isActive=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Only show inactive conversations
curl -X GET "http://localhost:3000/api/v1/whatsapp/conversations?isActive=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Filter by Date Range

```bash
# Conversations from the last 7 days
curl -X GET "http://localhost:3000/api/v1/whatsapp/conversations?dateFrom=2025-01-20T00:00:00Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Conversations between specific dates
curl -X GET "http://localhost:3000/api/v1/whatsapp/conversations?dateFrom=2025-01-01&dateTo=2025-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. Search

```bash
# Search by phone number
curl -X GET "http://localhost:3000/api/v1/whatsapp/conversations?search=555123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search by customer name
curl -X GET "http://localhost:3000/api/v1/whatsapp/conversations?search=John" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8. Combined Filters

```bash
# Active order conversations, sorted by last activity, page 1, 25 items
curl -X GET "http://localhost:3000/api/v1/whatsapp/conversations?intent=order&isActive=true&sortBy=lastActivity&sortOrder=desc&page=1&limit=25" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search active conversations from last week
curl -X GET "http://localhost:3000/api/v1/whatsapp/conversations?search=John&isActive=true&dateFrom=2025-01-20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 9. JavaScript/React Example

```javascript
const getConversations = async (filters = {}) => {
  const params = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 10,
    sortBy: filters.sortBy || 'lastActivity',
    sortOrder: filters.sortOrder || 'desc',
    ...(filters.search && { search: filters.search }),
    ...(filters.intent && { intent: filters.intent }),
    ...(filters.isActive && { isActive: filters.isActive }),
    ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && { dateTo: filters.dateTo })
  });

  const response = await fetch(
    `/api/v1/whatsapp/conversations?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.json();
};

// Usage
const conversations = await getConversations({
  page: 1,
  limit: 20,
  intent: 'order',
  isActive: 'true',
  search: 'John'
});
```

---

## Response Format

```json
{
  "type": "1",
  "message": "Conversations retrieved successfully",
  "data": {
    "conversations": [
      {
        "id": "conv_123456",
        "sessionId": "session_abc123",
        "userId": "+15551234567",
        "phoneNumber": "+15551234567",
        "customerName": "John Doe",
        "customerEmail": "john@example.com",
        "bot": {
          "id": "bot_789",
          "name": "Restaurant Bot",
          "description": "Handles restaurant orders"
        },
        "currentIntent": "order",
        "currentStep": "payment",
        "previousIntent": "menu",
        "isActive": true,
        "lastActivity": "2025-01-27T10:30:00.000Z",
        "createdAt": "2025-01-27T09:00:00.000Z",
        "updatedAt": "2025-01-27T10:30:00.000Z",
        "expiresAt": "2025-01-28T10:30:00.000Z",
        "currentOrderId": "order_456",
        "orderHistory": ["order_123", "order_456"],
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
        },
        "metadata": {
          "language": "en",
          "platform": "whatsapp"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 127,
      "totalPages": 13,
      "hasNextPage": true,
      "hasPrevPage": false,
      "count": 10
    },
    "filters": {
      "search": null,
      "intent": "all",
      "isActive": "all",
      "dateFrom": null,
      "dateTo": null
    },
    "sorting": {
      "sortBy": "lastActivity",
      "sortOrder": "desc"
    }
  }
}
```

---

## Response Field Descriptions

### Conversation Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Conversation ID |
| `sessionId` | string | Unique session identifier |
| `userId` | string | User phone number |
| `phoneNumber` | string | Same as userId (for clarity) |
| `customerName` | string\|null | Customer name if available |
| `customerEmail` | string\|null | Customer email if available |
| `bot` | object\|null | Bot information |
| `bot.id` | string | Bot ID |
| `bot.name` | string | Bot name |
| `bot.description` | string\|null | Bot description |
| `currentIntent` | string | Current conversation intent |
| `currentStep` | string | Current conversation step |
| `previousIntent` | string\|null | Previous intent |
| `isActive` | boolean | Whether conversation is active |
| `lastActivity` | string | ISO timestamp of last activity |
| `createdAt` | string | ISO timestamp of creation |
| `updatedAt` | string | ISO timestamp of last update |
| `expiresAt` | string | ISO timestamp when conversation expires |
| `currentOrderId` | string\|null | Current order ID if any |
| `orderHistory` | string[] | Array of order IDs |
| `messageCount` | number | Total number of messages |
| `lastMessage` | object\|null | Last message preview |
| `lastMessage.role` | string | "user" or "bot" |
| `lastMessage.content` | string | Message content |
| `lastMessage.timestamp` | string | Message timestamp |
| `duration` | number | Conversation duration in seconds |
| `context.selectedItemsCount` | number | Number of items in cart |
| `context.orderTotal` | number | Order total amount |
| `context.paymentMethod` | string\|null | Selected payment method |
| `context.hasDeliveryAddress` | boolean | Whether delivery address is set |
| `metadata` | object | Additional metadata |

### Pagination Object

| Field | Type | Description |
|-------|------|-------------|
| `page` | number | Current page number |
| `limit` | number | Items per page |
| `totalCount` | number | Total number of conversations |
| `totalPages` | number | Total number of pages |
| `hasNextPage` | boolean | Whether next page exists |
| `hasPrevPage` | boolean | Whether previous page exists |
| `count` | number | Number of items in current page |

### Filters Object

| Field | Type | Description |
|-------|------|-------------|
| `search` | string\|null | Active search query |
| `intent` | string | Active intent filter |
| `isActive` | string | Active status filter |
| `dateFrom` | string\|null | Date range start |
| `dateTo` | string\|null | Date range end |

### Sorting Object

| Field | Type | Description |
|-------|------|-------------|
| `sortBy` | string | Field being sorted by |
| `sortOrder` | string | Sort direction (asc/desc) |

---

## Use Cases

### 1. Recent Active Conversations Dashboard

```javascript
// Show most recent active conversations
const activeConversations = await api.get('/api/v1/whatsapp/conversations', {
  params: {
    isActive: 'true',
    sortBy: 'lastActivity',
    sortOrder: 'desc',
    limit: 20
  }
});
```

### 2. Order Management View

```javascript
// Show all conversations with order intent
const orderConversations = await api.get('/api/v1/whatsapp/conversations', {
  params: {
    intent: 'order',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 50
  }
});
```

### 3. Customer Support Queue

```javascript
// Show active support conversations
const supportQueue = await api.get('/api/v1/whatsapp/conversations', {
  params: {
    intent: 'support',
    isActive: 'true',
    sortBy: 'lastActivity',
    sortOrder: 'asc' // Oldest first
  }
});
```

### 4. Search Customer

```javascript
// Find conversations for a specific customer
const customerConversations = await api.get('/api/v1/whatsapp/conversations', {
  params: {
    search: customer.phoneNumber,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }
});
```

### 5. Analytics - Last 30 Days

```javascript
// Get all conversations from last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const recentConversations = await api.get('/api/v1/whatsapp/conversations', {
  params: {
    dateFrom: thirtyDaysAgo.toISOString(),
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 100
  }
});
```

---

## React DataTable Component Example

```jsx
import React, { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';

const ConversationsDataTable = () => {
  const [conversations, setConversations] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'lastActivity',
    sortOrder: 'desc',
    search: '',
    intent: 'all',
    isActive: 'all'
  });

  // Fetch conversations
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(
        Object.entries(filters).filter(([_, v]) => v)
      );

      const response = await fetch(
        `/api/v1/whatsapp/conversations?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const data = await response.json();

      if (data.type === '1') {
        setConversations(data.data.conversations);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [filters]);

  // Column definitions
  const columns = [
    {
      header: 'Customer',
      accessorKey: 'customerName',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">
            {row.original.customerName || 'Unknown'}
          </div>
          <div className="text-sm text-gray-500">
            {row.original.phoneNumber}
          </div>
        </div>
      )
    },
    {
      header: 'Intent',
      accessorKey: 'currentIntent',
      cell: ({ row }) => (
        <span className={`badge badge-${getIntentColor(row.original.currentIntent)}`}>
          {row.original.currentIntent}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: ({ row }) => (
        <span className={`badge ${row.original.isActive ? 'badge-success' : 'badge-secondary'}`}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Messages',
      accessorKey: 'messageCount',
      cell: ({ row }) => (
        <div className="text-center">{row.original.messageCount}</div>
      )
    },
    {
      header: 'Last Activity',
      accessorKey: 'lastActivity',
      cell: ({ row }) => (
        <div className="text-sm">
          {formatDistanceToNow(new Date(row.original.lastActivity), { addSuffix: true })}
        </div>
      )
    },
    {
      header: 'Last Message',
      accessorKey: 'lastMessage',
      cell: ({ row }) => (
        <div className="max-w-xs truncate text-sm text-gray-600">
          {row.original.lastMessage?.content || 'No messages'}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          className="input"
        />

        <select
          value={filters.intent}
          onChange={(e) => setFilters({ ...filters, intent: e.target.value, page: 1 })}
          className="select"
        >
          <option value="all">All Intents</option>
          <option value="menu">Menu</option>
          <option value="order">Order</option>
          <option value="support">Support</option>
          <option value="payment">Payment</option>
          <option value="delivery">Delivery</option>
        </select>

        <select
          value={filters.isActive}
          onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
          className="select"
        >
          <option value="all">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={conversations}
        loading={loading}
        pagination={{
          page: pagination.page,
          pageSize: pagination.limit,
          total: pagination.totalCount,
          onPageChange: (page) => setFilters({ ...filters, page }),
          onPageSizeChange: (limit) => setFilters({ ...filters, limit, page: 1 })
        }}
        sorting={{
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          onSortChange: (sortBy, sortOrder) => setFilters({ ...filters, sortBy, sortOrder })
        }}
      />
    </div>
  );
};

export default ConversationsDataTable;
```

---

## Performance Considerations

### Indexes

The ConversationState model includes optimized indexes for:
- `subDomain` + `isActive`
- `botId` + `userId`
- `lastActivity`
- `currentIntent`
- `sessionId` (unique)

### Pagination

- Default limit: 10 items
- Maximum recommended: 100 items per page
- Use smaller page sizes for better performance

### Search

- Search uses regex with case-insensitive matching
- Searches across: phone number, customer name, customer email
- For large datasets, consider adding text indexes

---

## Error Responses

### Invalid Pagination

```json
{
  "type": "3",
  "message": "Invalid page number"
}
```

### Unauthorized

```json
{
  "type": "3",
  "message": "Unauthorized"
}
```

### Server Error

```json
{
  "type": "3",
  "message": "Failed to get conversations",
  "data": null
}
```

---

## Related Documentation

- [WHATSAPP_ENDPOINTS_REFERENCE.md](WHATSAPP_ENDPOINTS_REFERENCE.md) - All WhatsApp endpoints
- [ConversationState Model](src/models/ConversationState.ts) - Data model details

---

## Summary

The Conversations API provides:

✅ **Full datatable support** - Pagination, sorting, filtering
✅ **Powerful search** - Phone, name, email search
✅ **Rich data** - Message counts, duration, context
✅ **Flexible filtering** - Intent, status, date range
✅ **Performance optimized** - Indexed queries, lean documents
✅ **Production ready** - Error handling, logging

**Status:** Production Ready ✅

**Endpoint:** `GET /api/v1/whatsapp/conversations`

**Authentication:** Required
