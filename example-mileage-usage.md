# Quick Start: Mileage-Based Delivery

## Step 1: Create a Mileage Zone

```bash
curl -X POST http://localhost:3000/api/v1/delivery/zones/my-restaurant/LOC123 \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

This creates a zone where:
- First 2km costs $5 (base)
- Each additional 1km adds $2
- Minimum order: $15
- Estimated delivery: 30 minutes

## Step 2: Calculate Delivery Cost

```bash
curl -X POST http://localhost:3000/api/v1/delivery/calculate-cost \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantLocation": { "lat": -12.0464, "lng": -77.0428 },
    "deliveryLocation": { "lat": -12.0764, "lng": -77.0728 },
    "subDomain": "my-restaurant",
    "localId": "LOC123"
  }'
```

Response shows:
```json
{
  "type": "1",
  "message": "Success",
  "data": {
    "distance": 3.5,
    "deliveryCost": 9,
    "estimatedTime": 30,
    "zone": { ... }
  }
}
```

## Frontend Example (React/TypeScript)

```typescript
import { useState } from 'react';

interface DeliveryCostResponse {
  distance: number;
  deliveryCost: number;
  estimatedTime: number;
}

function DeliveryCalculator() {
  const [cost, setCost] = useState<DeliveryCostResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateCost = async (deliveryLat: number, deliveryLng: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/delivery/calculate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantLocation: { lat: -12.0464, lng: -77.0428 },
          deliveryLocation: { lat: deliveryLat, lng: deliveryLng },
          subDomain: 'my-restaurant',
          localId: 'LOC123'
        })
      });

      const data = await response.json();
      if (data.type === '1') {
        setCost(data.data);
      }
    } catch (error) {
      console.error('Error calculating delivery cost:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {cost && (
        <div className="delivery-info">
          <p>Distance: {cost.distance} km</p>
          <p>Delivery Fee: ${cost.deliveryCost}</p>
          <p>Estimated Time: {cost.estimatedTime} min</p>
        </div>
      )}
    </div>
  );
}
```

## Pricing Examples

Given the zone configuration above:

| Delivery Distance | Calculation | Total Cost |
|------------------|-------------|------------|
| 1.0 km | Base only | $5 |
| 2.0 km | Base only | $5 |
| 2.5 km | $5 + 1×$2 | $7 |
| 3.5 km | $5 + 2×$2 | $9 |
| 5.0 km | $5 + 3×$2 | $11 |
| 7.2 km | $5 + 6×$2 | $17 |

## Update Pricing

```bash
curl -X PATCH http://localhost:3000/api/v1/delivery/zones/ZONE_ID/my-restaurant/LOC123 \
  -H "Content-Type: application/json" \
  -d '{
    "baseCost": 6,
    "incrementalCost": 2.5
  }'
```

## Get All Zones

```bash
curl http://localhost:3000/api/v1/delivery/zones/my-restaurant/LOC123
```

## Common Pricing Strategies

### Urban Restaurant (Short Distances)
```json
{
  "baseCost": 3,
  "baseDistance": 1,
  "incrementalCost": 1.5,
  "distanceIncrement": 0.5
}
```
- 0-1 km: $3
- 1.5 km: $4.50
- 2 km: $6
- 3 km: $9

### Suburban Restaurant (Longer Distances)
```json
{
  "baseCost": 5,
  "baseDistance": 3,
  "incrementalCost": 2,
  "distanceIncrement": 2
}
```
- 0-3 km: $5
- 4 km: $7
- 6 km: $9
- 10 km: $13

### Premium Restaurant
```json
{
  "baseCost": 8,
  "baseDistance": 2,
  "incrementalCost": 3,
  "distanceIncrement": 1
}
```
- 0-2 km: $8
- 3 km: $11
- 5 km: $17
- 7 km: $23
