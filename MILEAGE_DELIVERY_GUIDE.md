# Mileage-Based Delivery Pricing Guide

## Overview

The mileage-based delivery pricing feature allows restaurants to set dynamic delivery costs based on the distance between the restaurant and the customer's delivery location. This provides more flexible and fair pricing compared to flat-rate or zone-based delivery fees.

## How It Works

### Pricing Structure

Mileage zones use a tiered pricing model:
- **Base Cost**: A fixed delivery fee for distances up to the base distance
- **Base Distance**: The distance (in km) covered by the base cost
- **Incremental Cost**: Additional fee charged per distance increment
- **Distance Increment**: The distance unit (in km) for incremental pricing

### Calculation Formula

```
if distance <= baseDistance:
    deliveryCost = baseCost
else:
    extraDistance = distance - baseDistance
    extraIncrements = ceil(extraDistance / distanceIncrement)
    deliveryCost = baseCost + (extraIncrements × incrementalCost)
```

### Example

Given a mileage zone with:
- Base Cost: $5
- Base Distance: 2 km
- Incremental Cost: $2
- Distance Increment: 1 km

**Delivery Cost Calculations:**

| Distance | Calculation | Cost |
|----------|-------------|------|
| 1.2 km | Base cost only | $5 |
| 2.0 km | Base cost only | $5 |
| 2.5 km | $5 + ceil(0.5/1) × $2 = $5 + $2 | $7 |
| 3.5 km | $5 + ceil(1.5/1) × $2 = $5 + $4 | $9 |
| 5.8 km | $5 + ceil(3.8/1) × $2 = $5 + $8 | $13 |

## API Reference

### 1. Create Mileage-Based Delivery Zone

**Endpoint:** `POST /api/v1/delivery/zones/:subDomain/:localId`

**Request Body:**
```json
{
  "zoneName": "City-Wide Delivery",
  "type": "mileage",
  "deliveryCost": 0,
  "minimumOrder": 15,
  "estimatedTime": 30,
  "baseCost": 5,
  "baseDistance": 2,
  "incrementalCost": 2,
  "distanceIncrement": 1,
  "allowsFreeDelivery": false,
  "status": "1"
}
```

**Required Fields for Mileage Zones:**
- `zoneName`: Name of the delivery zone
- `type`: Must be "mileage"
- `minimumOrder`: Minimum order value required
- `estimatedTime`: Estimated delivery time in minutes
- `baseCost`: Base delivery cost (must be ≥ 0)
- `baseDistance`: Base distance in km (must be ≥ 0)
- `incrementalCost`: Additional cost per increment (must be ≥ 0)
- `distanceIncrement`: Distance increment in km (must be ≥ 0)

**Optional Fields:**
- `priceRanges`: Pre-calculated price ranges for faster lookups
  ```json
  "priceRanges": [
    { "minDistance": 0, "maxDistance": 2, "cost": 5 },
    { "minDistance": 2, "maxDistance": 5, "cost": 9 },
    { "minDistance": 5, "maxDistance": 10, "cost": 15 }
  ]
  ```

**Response:**
```json
{
  "type": "1",
  "message": "Delivery zone created successfully",
  "data": {
    "_id": "zone123",
    "zoneName": "City-Wide Delivery",
    "type": "mileage",
    "baseCost": 5,
    "baseDistance": 2,
    "incrementalCost": 2,
    "distanceIncrement": 1,
    "minimumOrder": 15,
    "estimatedTime": 30,
    "subDomain": "my-restaurant",
    "localId": "LOC123",
    "isActive": true,
    "createdAt": "2025-12-05T10:00:00.000Z",
    "updatedAt": "2025-12-05T10:00:00.000Z"
  }
}
```

### 2. Calculate Delivery Cost

**Endpoint:** `POST /api/v1/delivery/calculate-cost`

**Request Body:**
```json
{
  "restaurantLocation": { "lat": -12.0464, "lng": -77.0428 },
  "deliveryLocation": { "lat": -12.0564, "lng": -77.0528 },
  "subDomain": "my-restaurant",
  "localId": "LOC123"
}
```

**Response:**
```json
{
  "type": "1",
  "message": "Success",
  "data": {
    "distance": 1.23,
    "zone": {
      "_id": "zone123",
      "zoneName": "City-Wide Delivery",
      "type": "mileage",
      "baseCost": 5,
      "baseDistance": 2,
      "incrementalCost": 2,
      "distanceIncrement": 1,
      "minimumOrder": 15,
      "estimatedTime": 30
    },
    "deliveryCost": 5,
    "estimatedTime": 30,
    "meetsMinimum": true
  }
}
```

### 3. Get All Delivery Zones

**Endpoint:** `GET /api/v1/delivery/zones/:subDomain/:localId`

Returns all active delivery zones, including mileage-based zones.

### 4. Update Mileage Zone

**Endpoint:** `PATCH /api/v1/delivery/zones/:zoneId/:subDomain/:localId`

Update any field of the mileage zone. Validation ensures mileage-specific fields remain valid.

### 5. Delete Mileage Zone

**Endpoint:** `DELETE /api/v1/delivery/zones/:zoneId/:subDomain/:localId`

Soft-deletes the zone by setting `isActive: false`.

## Frontend Integration

### TypeScript Interface

```typescript
interface MileageDeliveryZone extends DeliveryZone {
  type: 'mileage';

  // Base pricing
  baseCost: number;           // Base cost
  baseDistance: number;       // Base distance in km

  // Incremental pricing
  incrementalCost: number;    // Additional cost per increment
  distanceIncrement: number;  // Distance increment (e.g., every 1km)

  // Optional: Pre-calculated price ranges
  priceRanges?: Array<{
    minDistance: number;
    maxDistance: number;
    cost: number;
  }>;
}
```

### Example Usage

```typescript
// Calculate delivery cost
async function calculateDeliveryCost(
  restaurantLat: number,
  restaurantLng: number,
  deliveryLat: number,
  deliveryLng: number
) {
  const response = await fetch('/api/v1/delivery/calculate-cost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      restaurantLocation: { lat: restaurantLat, lng: restaurantLng },
      deliveryLocation: { lat: deliveryLat, lng: deliveryLng },
      subDomain: 'my-restaurant',
      localId: 'LOC123'
    })
  });

  const data = await response.json();

  if (data.type === '1') {
    console.log(`Distance: ${data.data.distance}km`);
    console.log(`Delivery Cost: $${data.data.deliveryCost}`);
    console.log(`Estimated Time: ${data.data.estimatedTime} minutes`);
    return data.data;
  }
}
```

## Database Schema

The `DeliveryZone` model now supports mileage-based zones:

```javascript
{
  zoneName: String,
  type: 'polygon' | 'simple' | 'radius' | 'mileage',

  // Standard fields (all zone types)
  deliveryCost: Number,
  minimumOrder: Number,
  estimatedTime: Number,
  allowsFreeDelivery: Boolean,
  minimumForFreeDelivery: Number,
  coordinates: Array,

  // Mileage-specific fields (optional, required when type='mileage')
  baseCost: Number,
  baseDistance: Number,
  incrementalCost: Number,
  distanceIncrement: Number,
  priceRanges: Array,

  // Metadata
  localId: String,
  subDomain: String,
  status: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Validation Rules

### For Mileage Zones

1. **Type validation**: `type` must be `'mileage'`
2. **Required fields**: All mileage-specific fields are required:
   - `baseCost` (≥ 0)
   - `baseDistance` (≥ 0)
   - `incrementalCost` (≥ 0)
   - `distanceIncrement` (≥ 0)
3. **Coordinates**: Should be empty (not used for mileage zones)
4. **Business rules**:
   - Base distance should be reasonable (e.g., 0-50 km)
   - Incremental cost should not exceed base cost (recommended)
   - Distance increment should be practical (e.g., 0.5-5 km)

### Error Responses

**Missing required field:**
```json
{
  "type": "701",
  "message": "baseCost is required for mileage zones",
  "data": null
}
```

**No zone found:**
```json
{
  "type": "3",
  "message": "No delivery zone found for this location",
  "data": null
}
```

## Testing

Run the included test script to verify the implementation:

```bash
# Make sure the server is running
npm run dev

# In another terminal
node test-mileage-delivery.js
```

The test script will:
1. Create a mileage-based delivery zone
2. Calculate costs for various distances
3. Verify the calculations match expected values
4. Retrieve and display zone details

## Distance Calculation

The system uses the Haversine formula to calculate the great-circle distance between two points on Earth:

```javascript
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

This provides accurate distance measurements for delivery cost calculations.

## Best Practices

### Pricing Strategy

1. **Set reasonable base distances**: 1-3 km is typical for urban areas
2. **Use sensible increments**: 0.5-2 km increments work well
3. **Balance costs**: Ensure profitability while remaining competitive
4. **Consider peak times**: You may want different zones for peak/off-peak hours

### Performance Optimization

1. **Use price ranges**: Pre-calculate common distances for faster lookups
2. **Cache zone data**: Reduce database queries for frequently accessed zones
3. **Index properly**: Ensure `subDomain`, `localId`, and `type` are indexed

### User Experience

1. **Show distance**: Display the calculated distance to customers
2. **Explain pricing**: Show how the delivery cost is calculated
3. **Provide estimates**: Give a delivery cost range based on typical distances
4. **Update dynamically**: Recalculate when the delivery address changes

## Migration from Flat-Rate Zones

If you're migrating from flat-rate zones:

1. **Analyze historical data**: Review average delivery distances
2. **Calculate equivalent pricing**: Set base cost near your current flat rate
3. **Test thoroughly**: Compare costs for common delivery locations
4. **Communicate changes**: Inform customers about the new pricing model
5. **Run both systems**: Consider supporting both mileage and flat-rate zones during transition

## Troubleshooting

### "No delivery zone found" error

- Ensure a mileage zone exists for the subdomain and localId
- Check that the zone is active (`isActive: true`, `status: '1'`)
- Verify the zone was created successfully

### Incorrect cost calculations

- Verify the distance calculation is accurate
- Check that mileage-specific fields are set correctly
- Ensure the `calculateDeliveryCost` method is being called
- Review the formula: `baseCost + ceil(extraDistance / distanceIncrement) × incrementalCost`

### TypeScript errors

- Run `npm run build` to check for compilation errors
- Ensure all required fields are present when creating zones
- Verify interface definitions match the implementation

## Future Enhancements

Potential improvements to consider:

1. **Time-based pricing**: Different rates for peak hours
2. **Maximum distance limits**: Set a maximum delivery radius
3. **Multiple zone support**: Apply different rates to different areas
4. **Surge pricing**: Dynamic pricing based on demand
5. **Discounts**: Volume discounts for larger orders
6. **Route optimization**: Consider actual driving distance vs straight-line distance
