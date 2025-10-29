# Working Hours API Documentation

## Overview

The Working Hours API provides endpoints to manage business operating hours for different service types (delivery, pickup, scheduled orders, and dispatch). The API uses modern English parameter names for all operations.

## Base URLs

- **Production**: `https://ssgg.api.cartaai.pe`
- **Development**: `https://dev.ssgg.api.cartaai.pe`
- **Local**: `http://localhost:3000`

## Authentication

Most endpoints require authentication using Bearer token:

```http
Authorization: Bearer {accessToken}
```

## API Endpoints

### 1. Get Working Hours (Modern Format)

```http
GET /api/v1/business/working-hours/{subDomain}/{localId}
```

**Parameters:**
- `subDomain` (string, required): Business subdomain (3-63 characters, lowercase letters, numbers, and hyphens only)
- `localId` (string, required): Business location ID

**Response:**
```json
{
  "type": "1",
  "message": "Working hours retrieved successfully",
  "data": {
    "deliveryHours": {
      "monday": [
        {
          "start": "09:00",
          "end": "17:00"
        }
      ],
      "tuesday": [
        {
          "start": "09:00",
          "end": "17:00"
        }
      ],
      "wednesday": [
        {
          "start": "09:00",
          "end": "17:00"
        }
      ],
      "thursday": [
        {
          "start": "09:00",
          "end": "17:00"
        }
      ],
      "friday": [
        {
          "start": "09:00",
          "end": "17:00"
        }
      ],
      "saturday": [
        {
          "start": "09:00",
          "end": "17:00"
        }
      ],
      "sunday": null
    },
    "pickupHours": {
      "monday": [
        {
          "start": "10:00",
          "end": "18:00"
        }
      ],
      "tuesday": null,
      "wednesday": null,
      "thursday": null,
      "friday": null,
      "saturday": null,
      "sunday": null
    },
    "onSiteHours": {
      "monday": null,
      "tuesday": null,
      "wednesday": null,
      "thursday": null,
      "friday": null,
      "saturday": null,
      "sunday": null
    },
    "scheduledOrderHours": {
      "monday": null,
      "tuesday": null,
      "wednesday": null,
      "thursday": null,
      "friday": null,
      "saturday": null,
      "sunday": null
    }
  }
}
```

### 2. Create Working Hours

```http
POST /api/v1/business/working-hours/{subDomain}/{localId}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "deliveryHours": {
    "monday": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "tuesday": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "wednesday": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "thursday": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "friday": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "saturday": [
      {
        "start": "10:00",
        "end": "15:00"
      }
    ],
    "sunday": null
  },
  "pickupHours": {
    "monday": [
      {
        "start": "10:00",
        "end": "18:00"
      }
    ],
    "tuesday": null,
    "wednesday": null,
    "thursday": null,
    "friday": null,
    "saturday": null,
    "sunday": null
  },
  "onSiteHours": {
    "monday": null,
    "tuesday": null,
    "wednesday": null,
    "thursday": null,
    "friday": null,
    "saturday": null,
    "sunday": null
  },
  "scheduledOrderHours": {
    "monday": [
      {
        "start": "08:00",
        "end": "20:00"
      }
    ],
    "tuesday": [
      {
        "start": "08:00",
        "end": "20:00"
      }
    ],
    "wednesday": [
      {
        "start": "08:00",
        "end": "20:00"
      }
    ],
    "thursday": [
      {
        "start": "08:00",
        "end": "20:00"
      }
    ],
    "friday": [
      {
        "start": "08:00",
        "end": "20:00"
      }
    ],
    "saturday": [
      {
        "start": "09:00",
        "end": "18:00"
      }
    ],
    "sunday": null
  }
}
```

**Response:**
```json
{
  "type": "1",
  "message": "Working hours created successfully",
  "data": {
    "deliveryHours": {
      "monday": [
        {
          "start": "09:00",
          "end": "17:00"
        }
      ],
      "tuesday": [
        {
          "start": "09:00",
          "end": "17:00"
        }
      ],
      "wednesday": [
        {
          "start": "09:00",
          "end": "17:00"
        }
      ],
      "thursday": [
        {
          "start": "09:00",
          "end": "17:00"
        }
      ],
      "friday": [
        {
          "start": "09:00",
          "end": "17:00"
        }
      ],
      "saturday": [
        {
          "start": "10:00",
          "end": "15:00"
        }
      ],
      "sunday": null
    },
    "pickupHours": {
      "monday": [
        {
          "start": "10:00",
          "end": "18:00"
        }
      ],
      "tuesday": null,
      "wednesday": null,
      "thursday": null,
      "friday": null,
      "saturday": null,
      "sunday": null
    },
    "onSiteHours": {
      "monday": null,
      "tuesday": null,
      "wednesday": null,
      "thursday": null,
      "friday": null,
      "saturday": null,
      "sunday": null
    },
    "scheduledOrderHours": {
      "monday": [
        {
          "start": "08:00",
          "end": "20:00"
        }
      ],
      "tuesday": [
        {
          "start": "08:00",
          "end": "20:00"
        }
      ],
      "wednesday": [
        {
          "start": "08:00",
          "end": "20:00"
        }
      ],
      "thursday": [
        {
          "start": "08:00",
          "end": "20:00"
        }
      ],
      "friday": [
        {
          "start": "08:00",
          "end": "20:00"
        }
      ],
      "saturday": [
        {
          "start": "09:00",
          "end": "18:00"
        }
      ],
      "sunday": null
    }
  }
}
```

### 3. Update Working Hours

```http
PATCH /api/v1/business/working-hours/{subDomain}/{localId}
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "deliveryHours": {
    "monday": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "tuesday": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "wednesday": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "thursday": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "friday": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "saturday": [
      {
        "start": "10:00",
        "end": "15:00"
      }
    ],
    "sunday": null
  },
  "pickupHours": {
    "monday": [
      {
        "start": "10:00",
        "end": "18:00"
      }
    ],
    "tuesday": null,
    "wednesday": null,
    "thursday": null,
    "friday": null,
    "saturday": null,
    "sunday": null
  },
  "onSiteHours": {
    "monday": null,
    "tuesday": null,
    "wednesday": null,
    "thursday": null,
    "friday": null,
    "saturday": null,
    "sunday": null
  },
  "scheduledOrderHours": {
    "monday": [
      {
        "start": "08:00",
        "end": "20:00"
      }
    ],
    "tuesday": [
      {
        "start": "08:00",
        "end": "20:00"
      }
    ],
    "wednesday": [
      {
        "start": "08:00",
        "end": "20:00"
      }
    ],
    "thursday": [
      {
        "start": "08:00",
        "end": "20:00"
      }
    ],
    "friday": [
      {
        "start": "08:00",
        "end": "20:00"
      }
    ],
    "saturday": [
      {
        "start": "09:00",
        "end": "18:00"
      }
    ],
    "sunday": null
  }
}
```


## Data Models

### TimeSlot

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `start` | string | Start time in HH:MM format | Yes |
| `end` | string | End time in HH:MM format | Yes |

### WorkingHours

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `monday` | TimeSlot[] \| null | Monday working hours | No |
| `tuesday` | TimeSlot[] \| null | Tuesday working hours | No |
| `wednesday` | TimeSlot[] \| null | Wednesday working hours | No |
| `thursday` | TimeSlot[] \| null | Thursday working hours | No |
| `friday` | TimeSlot[] \| null | Friday working hours | No |
| `saturday` | TimeSlot[] \| null | Saturday working hours | No |
| `sunday` | TimeSlot[] \| null | Sunday working hours | No |

### UpdateWorkingHoursDto

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `deliveryHours` | WorkingHours | Working hours for delivery service | Yes |
| `pickupHours` | WorkingHours | Working hours for pickup service | Yes |
| `onSiteHours` | WorkingHours | Working hours for on-site service | Yes |
| `scheduledOrderHours` | WorkingHours | Working hours for scheduled orders | No |

## Service Types

| Service Type | Field Name | Description |
|--------------|------------|-------------|
| Delivery | `deliveryHours` | Working hours for delivery service |
| Pickup | `pickupHours` | Working hours for pickup service |
| On-Site | `onSiteHours` | Working hours for on-site service |
| Scheduled Orders | `scheduledOrderHours` | Working hours for scheduled orders |

## Day Names

| Day Name | Description |
|----------|-------------|
| `monday` | Monday working hours |
| `tuesday` | Tuesday working hours |
| `wednesday` | Wednesday working hours |
| `thursday` | Thursday working hours |
| `friday` | Friday working hours |
| `saturday` | Saturday working hours |
| `sunday` | Sunday working hours |

## Validation Rules

### SubDomain Validation
- Must be 3-63 characters long
- Must start and end with alphanumeric characters
- Can contain lowercase letters, numbers, and hyphens
- Pattern: `^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$`

### Time Format Validation
- Must be in HH:MM format (24-hour)
- Valid range: 00:00 to 23:59
- Pattern: `^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$`

### Status Validation
- Must be "0" (disabled) or "1" (enabled)

### Day Validation
- Must be between "1" and "7"

### Type Validation
- Must be "1", "2", "3", or "4"

## Error Responses

### 400 Bad Request
```json
{
  "type": "701",
  "message": "subDomain and localId are required",
  "data": null
}
```

### 401 Unauthorized
```json
{
  "type": "401",
  "message": "Invalid or expired token",
  "data": null
}
```

### 500 Internal Server Error
```json
{
  "type": "3",
  "message": "Internal server error",
  "data": null
}
```

## Examples

### Complete Working Hours Configuration

```json
{
  "deliveryHours": {
    "monday": [
      {
        "start": "09:00",
        "end": "17:00"
      },
      {
        "start": "19:00",
        "end": "23:00"
      }
    ],
    "tuesday": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "wednesday": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "thursday": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "friday": [
      {
        "start": "09:00",
        "end": "17:00"
      }
    ],
    "saturday": [
      {
        "start": "10:00",
        "end": "15:00"
      }
    ],
    "sunday": null
  },
  "pickupHours": {
    "monday": [
      {
        "start": "10:00",
        "end": "18:00"
      }
    ],
    "tuesday": null,
    "wednesday": null,
    "thursday": null,
    "friday": null,
    "saturday": null,
    "sunday": null
  },
  "onSiteHours": {
    "monday": null,
    "tuesday": null,
    "wednesday": null,
    "thursday": null,
    "friday": null,
    "saturday": null,
    "sunday": null
  },
  "scheduledOrderHours": {
    "monday": [
      {
        "start": "08:00",
        "end": "20:00"
      }
    ],
    "tuesday": [
      {
        "start": "08:00",
        "end": "20:00"
      }
    ],
    "wednesday": [
      {
        "start": "08:00",
        "end": "20:00"
      }
    ],
    "thursday": [
      {
        "start": "08:00",
        "end": "20:00"
      }
    ],
    "friday": [
      {
        "start": "08:00",
        "end": "20:00"
      }
    ],
    "saturday": [
      {
        "start": "09:00",
        "end": "18:00"
      }
    ],
    "sunday": null
  }
}
```

## Client Implementation

```javascript
// Get working hours
const getResponse = await fetch('/api/v1/business/working-hours/restaurant1/local123', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Create working hours
const createResponse = await fetch('/api/v1/business/working-hours/restaurant1/local123', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    deliveryHours: [...],
    pickupHours: [...],
    scheduledOrderHours: [...],
    dispatchHours: [...]
  })
});

// Update working hours
const updateResponse = await fetch('/api/v1/business/working-hours/restaurant1/local123', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    deliveryHours: [...],
    pickupHours: [...],
    scheduledOrderHours: [...],
    dispatchHours: [...]
  })
});
```
