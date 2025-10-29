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
  "deliveryHours": [
    {
      "id": "local123_1_1",
      "status": "1",
      "day": "1",
      "localId": "local123",
      "type": "1",
      "timeSlots": [
        {
          "id": "local123_1_1_1",
          "startTime": "09:00",
          "endTime": "17:00",
          "dayId": "local123_1_1",
          "anticipationHours": "1"
        }
      ]
    }
  ],
  "pickupHours": [],
  "scheduledOrderHours": [],
  "dispatchHours": []
}
```

**Response:**
```json
{
  "type": "1",
  "message": "Working hours created successfully",
  "data": {
    "deliveryHours": [...],
    "pickupHours": [...],
    "scheduledOrderHours": [...],
    "dispatchHours": [...]
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
  "deliveryHours": [
    {
      "id": "local123_1_1",
      "status": "1",
      "day": "1",
      "localId": "local123",
      "type": "1",
      "timeSlots": [
        {
          "id": "local123_1_1_1",
          "startTime": "09:00",
          "endTime": "17:00",
          "dayId": "local123_1_1",
          "anticipationHours": "1"
        }
      ]
    }
  ],
  "pickupHours": [],
  "scheduledOrderHours": [],
  "dispatchHours": []
}
```


## Data Models

### WorkingHourDay (Modern Format)

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `id` | string | Unique identifier for the day | Yes |
| `status` | string | "1" for enabled, "0" for disabled | Yes |
| `day` | string | Day number: "1"=Monday, "2"=Tuesday, etc. | Yes |
| `localId` | string | Business location ID | Yes |
| `type` | string | Schedule type: "1"=delivery, "2"=scheduled, "3"=pickup, "4"=dispatch | Yes |
| `timeSlots` | WorkingHourItem[] | Array of time slots for the day | Yes |

### WorkingHourItem (Modern Format)

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `id` | string | Unique identifier for the time slot | Yes |
| `startTime` | string | Start time in HH:MM format | Yes |
| `endTime` | string | End time in HH:MM format | Yes |
| `dayId` | string | Reference to the parent day | Yes |
| `anticipationHours` | string | Hours of anticipation required | Yes |

### UpdateWorkingHoursDto (Modern Format)

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `deliveryHours` | WorkingHourDay[] | Working hours for delivery service | Yes |
| `pickupHours` | WorkingHourDay[] | Working hours for pickup service | Yes |
| `scheduledOrderHours` | WorkingHourDay[] | Working hours for scheduled orders | Yes |
| `dispatchHours` | WorkingHourDay[] | Working hours for dispatch service | Yes |

## Schedule Types

| Type Code | Description | Field Name |
|-----------|-------------|------------|
| "1" | Delivery | `deliveryHours` |
| "2" | Scheduled Orders | `scheduledOrderHours` |
| "3" | Pickup | `pickupHours` |
| "4" | Dispatch | `dispatchHours` |

## Day Codes

| Day Code | Day Name |
|----------|----------|
| "1" | Monday |
| "2" | Tuesday |
| "3" | Wednesday |
| "4" | Thursday |
| "5" | Friday |
| "6" | Saturday |
| "7" | Sunday |

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
  "deliveryHours": [
    {
      "id": "local123_1_1",
      "status": "1",
      "day": "1",
      "localId": "local123",
      "type": "1",
      "timeSlots": [
        {
          "id": "local123_1_1_1",
          "startTime": "09:00",
          "endTime": "17:00",
          "dayId": "local123_1_1",
          "anticipationHours": "1"
        },
        {
          "id": "local123_1_1_2",
          "startTime": "19:00",
          "endTime": "23:00",
          "dayId": "local123_1_1",
          "anticipationHours": "2"
        }
      ]
    }
  ],
  "pickupHours": [
    {
      "id": "local123_3_1",
      "status": "1",
      "day": "1",
      "localId": "local123",
      "type": "3",
      "timeSlots": [
        {
          "id": "local123_3_1_1",
          "startTime": "10:00",
          "endTime": "18:00",
          "dayId": "local123_3_1",
          "anticipationHours": "0.5"
        }
      ]
    }
  ],
  "scheduledOrderHours": [],
  "dispatchHours": []
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
