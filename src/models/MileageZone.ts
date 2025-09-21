import mongoose, { Schema, Document } from "mongoose";

export interface ICoordenadasLocal {
  latitude: number;
  longitude: number;
}

export interface IMileageZone extends Document {
  coberturaLocalNombre: string;
  coberturaLocalHoraInicio: string; // Format: "HH:MM"
  coberturaLocalHoraFin: string; // Format: "HH:MM"
  coberturaLocalPedidoMinimo: number;
  coberturaLocalTiempoEstimado: number;
  distanciaBase: number; // Base distance in km
  costoBase: number; // Base cost
  incrementoPorKm: number; // Distance increment per km
  incrementoCosto: number; // Cost increment per distance unit
  coordenadasLocal: ICoordenadasLocal;
  coberturaLocalId: string; // Reference to Local
  coberturaLocalEstado: string; // '1' = active, '0' = inactive
  type: 'mileage';
  subDomain: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CoordenadasLocalSchema = new Schema<ICoordenadasLocal>({
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

const MileageZoneSchema = new Schema<IMileageZone>({
  coberturaLocalNombre: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  coberturaLocalHoraInicio: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
  },
  coberturaLocalHoraFin: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
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
  distanciaBase: {
    type: Number,
    required: true,
    min: 0
  },
  costoBase: {
    type: Number,
    required: true,
    min: 0
  },
  incrementoPorKm: {
    type: Number,
    required: true,
    min: 0
  },
  incrementoCosto: {
    type: Number,
    required: true,
    min: 0
  },
  coordenadasLocal: {
    type: CoordenadasLocalSchema,
    required: true
  },
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
    enum: ['mileage'],
    default: 'mileage'
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

// Geospatial index for location-based queries
MileageZoneSchema.index({ coordenadasLocal: '2dsphere' });

// Indexes for better query performance
MileageZoneSchema.index({ coberturaLocalId: 1 });
MileageZoneSchema.index({ subDomain: 1 });
MileageZoneSchema.index({ coberturaLocalEstado: 1 });
MileageZoneSchema.index({ isActive: 1 });
MileageZoneSchema.index({ coberturaLocalPedidoMinimo: 1 });
MileageZoneSchema.index({ distanciaBase: 1 });
MileageZoneSchema.index({ costoBase: 1 });

// Text search index for zone search
MileageZoneSchema.index({ 
  coberturaLocalNombre: 'text'
});

// Validation for time range
MileageZoneSchema.pre('save', function(next) {
  const startTime = this.coberturaLocalHoraInicio;
  const endTime = this.coberturaLocalHoraFin;
  
  if (startTime && endTime) {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    
    if (start >= end) {
      return next(new Error('End time must be after start time'));
    }
  }
  next();
});

// Method to calculate delivery cost based on distance
MileageZoneSchema.methods.calculateDeliveryCost = function(distance: number): number {
  if (distance <= this.distanciaBase) {
    return this.costoBase;
  }
  
  const extraDistance = distance - this.distanciaBase;
  const extraIncrements = Math.ceil(extraDistance / this.incrementoPorKm);
  const extraCost = extraIncrements * this.incrementoCosto;
  
  return this.costoBase + extraCost;
};

export const MileageZone = mongoose.model<IMileageZone>('MileageZone', MileageZoneSchema);
