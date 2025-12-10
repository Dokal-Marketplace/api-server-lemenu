import mongoose, { Schema, Document } from "mongoose";

export interface IGeoPoint {
  latitude: number;
  longitude: number;
}

export interface IPriceRange {
  minDistance: number;
  maxDistance: number;
  cost: number;
}

export interface IDeliveryZone extends Document {
  zoneName: string;
  deliveryCost: number;
  minimumOrder: number;
  estimatedTime: number;
  allowsFreeDelivery: boolean;
  minimumForFreeDelivery?: number;
  coordinates?: any[]; // Store as any[] to allow both formats
  localId: string;
  status: string;
  type: 'polygon' | 'simple' | 'radius' | 'mileage';
  subDomain: string;
  isActive: boolean;

  // Mileage-specific fields (optional, only for type='mileage')
  baseCost?: number;              // Base delivery cost
  baseDistance?: number;          // Base distance in km
  incrementalCost?: number;       // Additional cost per increment
  distanceIncrement?: number;     // Distance increment in km
  priceRanges?: IPriceRange[];    // Optional pre-calculated ranges

  createdAt: Date;
  updatedAt: Date;

  // Method to calculate delivery cost based on distance
  calculateDeliveryCost?(distance: number): number;
}

const DeliveryZoneSchema = new Schema<IDeliveryZone>({
  zoneName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  deliveryCost: {
    type: Number,
    required: true,
    min: 0
  },
  minimumOrder: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedTime: {
    type: Number,
    required: true,
    min: 1
  },
  allowsFreeDelivery: {
    type: Boolean,
    default: false
  },
  minimumForFreeDelivery: {
    type: Number,
    min: 0
  },
  coordinates: {
    type: [Schema.Types.Mixed],
    default: []
  },
  localId: {
    type: String,
    required: true,
    ref: 'Local',
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['0', '1'],
    default: '1'
  },
  type: {
    type: String,
    required: true,
    enum: ['polygon', 'simple', 'radius', 'mileage'],
    default: 'simple'
  },
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Mileage-specific fields
  baseCost: {
    type: Number,
    min: 0,
    required: false
  },
  baseDistance: {
    type: Number,
    min: 0,
    required: false
  },
  incrementalCost: {
    type: Number,
    min: 0,
    required: false
  },
  distanceIncrement: {
    type: Number,
    min: 0,
    required: false
  },
  priceRanges: {
    type: [{
      minDistance: {
        type: Number,
        required: true,
        min: 0
      },
      maxDistance: {
        type: Number,
        required: true,
        min: 0
      },
      cost: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    default: undefined
  }
}, {
  timestamps: true
});

// Geospatial index for polygon zones
DeliveryZoneSchema.index({ coordinates: '2dsphere' });

// Indexes for better query performance
DeliveryZoneSchema.index({ localId: 1 });
DeliveryZoneSchema.index({ subDomain: 1 });
DeliveryZoneSchema.index({ type: 1 });
DeliveryZoneSchema.index({ status: 1 });
DeliveryZoneSchema.index({ isActive: 1 });
DeliveryZoneSchema.index({ deliveryCost: 1 });
DeliveryZoneSchema.index({ minimumOrder: 1 });

// Text search index
DeliveryZoneSchema.index({ 
  zoneName: 'text'
});

// Compound indexes
DeliveryZoneSchema.index({ subDomain: 1, localId: 1, isActive: 1 });
DeliveryZoneSchema.index({ subDomain: 1, status: 1, isActive: 1 });
DeliveryZoneSchema.index({ localId: 1, type: 1, isActive: 1 });

// Transform coordinates to GeoJSON format [longitude, latitude] for MongoDB
DeliveryZoneSchema.pre('save', function(next) {
  console.log('Pre-save hook - original coordinates:', JSON.stringify(this.coordinates));

  // Validation for mileage zones
  if (this.type === 'mileage') {
    // For mileage zones, mileage-specific fields are required
    if (this.baseCost === undefined || this.baseCost === null) {
      return next(new Error('baseCost is required for mileage zones'));
    }
    if (this.baseDistance === undefined || this.baseDistance === null) {
      return next(new Error('baseDistance is required for mileage zones'));
    }
    if (this.incrementalCost === undefined || this.incrementalCost === null) {
      return next(new Error('incrementalCost is required for mileage zones'));
    }
    if (this.distanceIncrement === undefined || this.distanceIncrement === null) {
      return next(new Error('distanceIncrement is required for mileage zones'));
    }

    // Mileage zones should not have coordinates
    if (this.coordinates && this.coordinates.length > 0) {
      console.log('Clearing coordinates for mileage zone');
      this.coordinates = [];
    }

    return next();
  }

  // Validation for polygon zones
  if (this.type === 'polygon' && (!this.coordinates || this.coordinates.length < 3)) {
    return next(new Error('Polygon zones must have at least 3 points'));
  }

  // Only transform if we have coordinates
  if (this.coordinates && Array.isArray(this.coordinates) && this.coordinates.length > 0) {
    try {
      const transformedCoords: number[][] = [];

      for (let i = 0; i < this.coordinates.length; i++) {
        const coord = this.coordinates[i];

        // Already in GeoJSON format [lng, lat]
        if (Array.isArray(coord) && coord.length === 2 &&
            typeof coord[0] === 'number' && typeof coord[1] === 'number') {
          transformedCoords.push([coord[0], coord[1]]);
        }
        // Object format {latitude, longitude}
        else if (coord && typeof coord === 'object' &&
                 typeof coord.latitude === 'number' &&
                 typeof coord.longitude === 'number') {
          // Convert to GeoJSON: [longitude, latitude]
          transformedCoords.push([coord.longitude, coord.latitude]);
        }
        else {
          console.error('Invalid coordinate:', coord);
          return next(new Error(`Invalid coordinate at index ${i}: ${JSON.stringify(coord)}`));
        }
      }

      console.log('Pre-save hook - transformed coordinates:', JSON.stringify(transformedCoords));

      // Set the transformed coordinates
      this.coordinates = transformedCoords;
      this.markModified('coordinates');

    } catch (error: any) {
      console.error('Error in pre-save transformation:', error);
      return next(error);
    }
  }

  next();
});

// Transform back to {latitude, longitude} when retrieving
DeliveryZoneSchema.post(['find', 'findOne', 'findOneAndUpdate'], function(docs) {
  if (!docs) return;
  
  const transformDoc = (doc: any) => {
    if (doc && doc.coordinates && Array.isArray(doc.coordinates)) {
      doc.coordinates = doc.coordinates.map((coord: any) => {
        // GeoJSON format [lng, lat] -> {latitude, longitude}
        if (Array.isArray(coord) && coord.length === 2) {
          return {
            longitude: coord[0],
            latitude: coord[1]
          };
        }
        return coord;
      });
    }
  };
  
  if (Array.isArray(docs)) {
    docs.forEach(transformDoc);
  } else {
    transformDoc(docs);
  }
});

// Method to calculate delivery cost based on distance (for mileage zones)
DeliveryZoneSchema.methods.calculateDeliveryCost = function(distance: number): number {
  if (this.type !== 'mileage') {
    // For non-mileage zones, return the flat delivery cost
    return this.deliveryCost;
  }

  // For mileage zones, calculate based on distance
  if (distance <= this.baseDistance) {
    return this.baseCost;
  }

  const extraDistance = distance - this.baseDistance;
  const extraIncrements = Math.ceil(extraDistance / this.distanceIncrement);
  const extraCost = extraIncrements * this.incrementalCost;

  return this.baseCost + extraCost;
};

export const DeliveryZone = mongoose.model<IDeliveryZone>('DeliveryZone', DeliveryZoneSchema);