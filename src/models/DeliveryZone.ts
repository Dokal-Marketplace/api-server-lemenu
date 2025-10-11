import mongoose, { Schema, Document } from "mongoose";

export interface IGeoPoint {
  latitude: number;
  longitude: number;
}

export interface IDeliveryZone extends Document {
  zoneName: string;
  deliveryCost: number;
  minimumOrder: number;
  estimatedTime: number;
  allowsFreeDelivery: boolean;
  minimumForFreeDelivery?: number;
  coordinates?: IGeoPoint[]; // For polygon zones
  localId: string; // Reference to Local
  status: string; // '1' = active, '0' = inactive
  type: 'polygon' | 'simple' | 'radius';
  subDomain: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GeoPointSchema = new Schema<IGeoPoint>({
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  }
}, { _id: false });

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
  coordinates: [GeoPointSchema],
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
    enum: ['polygon', 'simple', 'radius'],
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

// Text search index for zone search
DeliveryZoneSchema.index({ 
  zoneName: 'text'
});

// Compound indexes for common queries
DeliveryZoneSchema.index({ subDomain: 1, localId: 1, isActive: 1 });
DeliveryZoneSchema.index({ subDomain: 1, status: 1, isActive: 1 });
DeliveryZoneSchema.index({ localId: 1, type: 1, isActive: 1 });

// Validate and transform coordinates to GeoJSON format for MongoDB 2dsphere index
DeliveryZoneSchema.pre('save', function(next) {
  if (this.type === 'polygon' && (!this.coordinates || this.coordinates.length < 3)) {
    return next(new Error('Polygon zones must have at least 3 points'));
  }
  
  // Transform coordinates from {latitude, longitude} to [longitude, latitude] for GeoJSON
  if (this.coordinates && this.coordinates.length > 0) {
    const transformedCoords: any[] = [];
    
    for (const coord of this.coordinates) {
      // Check if coordinate has valid latitude and longitude
      if (coord && 
          typeof coord === 'object' && 
          typeof coord.latitude === 'number' && 
          typeof coord.longitude === 'number' &&
          !isNaN(coord.latitude) && 
          !isNaN(coord.longitude)) {
        // GeoJSON format: [longitude, latitude]
        transformedCoords.push([coord.longitude, coord.latitude]);
      } else if (Array.isArray(coord) && 
                 coord.length === 2 && 
                 typeof coord[0] === 'number' && 
                 typeof coord[1] === 'number' &&
                 !isNaN(coord[0]) && 
                 !isNaN(coord[1])) {
        // Already in [longitude, latitude] format
        transformedCoords.push(coord);
      } else {
        return next(new Error(`Invalid coordinate format at index ${transformedCoords.length}. Expected {latitude: number, longitude: number} or [longitude, latitude]`));
      }
    }
    
    this.coordinates = transformedCoords as any;
  }
  
  next();
});

// Transform coordinates back to {latitude, longitude} format when retrieving
DeliveryZoneSchema.post(['find', 'findOne', 'findOneAndUpdate'], function(docs) {
  if (!docs) return;
  
  const transformDoc = (doc: any) => {
    if (doc && doc.coordinates && Array.isArray(doc.coordinates)) {
      doc.coordinates = doc.coordinates.map((coord: any) => {
        if (Array.isArray(coord) && coord.length === 2 && 
            typeof coord[0] === 'number' && typeof coord[1] === 'number') {
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

export const DeliveryZone = mongoose.model<IDeliveryZone>('DeliveryZone', DeliveryZoneSchema);