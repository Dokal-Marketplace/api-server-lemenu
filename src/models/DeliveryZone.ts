import mongoose, { Schema, Document } from "mongoose";

export interface IGeoPoint {
  latitude: number;
  longitude: number;
}

export interface IDeliveryZone extends Document {
  coberturaLocalNombre: string;
  coberturaLocalCostoEnvio: number;
  coberturaLocalPedidoMinimo: number;
  coberturaLocalTiempoEstimado: number;
  coberturaLocalPermiteEnvioGratis: boolean;
  coberturaLocalMinimoParaEnvioGratis?: number;
  coberturaLocalRuta?: IGeoPoint[]; // For polygon zones
  coberturaLocalId: string; // Reference to Local
  coberturaLocalEstado: string; // '1' = active, '0' = inactive
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
  coberturaLocalNombre: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  coberturaLocalCostoEnvio: {
    type: Number,
    required: true,
    min: 0
  },
  coberturaLocalPedidoMinimo: {
    type: Number,
    required: true,
    min: 0
  },
  coberturaLocalTiempoEstimado: {
    type: Number,
    required: true,
    min: 1
  },
  coberturaLocalPermiteEnvioGratis: {
    type: Boolean,
    default: false
  },
  coberturaLocalMinimoParaEnvioGratis: {
    type: Number,
    min: 0
  },
  coberturaLocalRuta: [GeoPointSchema],
  coberturaLocalId: {
    type: String,
    required: true,
    ref: 'Local',
    trim: true
  },
  coberturaLocalEstado: {
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
DeliveryZoneSchema.index({ coberturaLocalRuta: '2dsphere' });

// Indexes for better query performance
DeliveryZoneSchema.index({ coberturaLocalId: 1 });
DeliveryZoneSchema.index({ subDomain: 1 });
DeliveryZoneSchema.index({ type: 1 });
DeliveryZoneSchema.index({ coberturaLocalEstado: 1 });
DeliveryZoneSchema.index({ isActive: 1 });
DeliveryZoneSchema.index({ coberturaLocalCostoEnvio: 1 });
DeliveryZoneSchema.index({ coberturaLocalPedidoMinimo: 1 });

// Text search index for zone search
DeliveryZoneSchema.index({ 
  coberturaLocalNombre: 'text'
});

// Validation for polygon zones
DeliveryZoneSchema.pre('save', function(next) {
  if (this.type === 'polygon' && (!this.coberturaLocalRuta || this.coberturaLocalRuta.length < 3)) {
    return next(new Error('Polygon zones must have at least 3 points'));
  }
  next();
});

export const DeliveryZone = mongoose.model<IDeliveryZone>('DeliveryZone', DeliveryZoneSchema);
