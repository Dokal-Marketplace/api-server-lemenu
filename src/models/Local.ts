import mongoose, { Schema, Document } from "mongoose";

export interface ILocal extends Document {
  name: string;
  subDomain: string;
  subdominio: string;
  linkDominio?: string;
  localNombreComercial: string;
  localDescripcion?: string;
  localDireccion?: string;
  localDepartamento?: string;
  localProvincia?: string;
  localDistrito?: string;
  localTelefono?: string;
  localWpp?: string;
  localAceptaRecojo: boolean;
  localAceptaPagoEnLinea: boolean;
  localPorcentajeImpuesto: number;
  estaAbiertoParaDelivery: boolean;
  estaAbiertoParaRecojo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocalSchema = new Schema<ILocal>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  subDomain: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Subdomin can only contain lowercase letters, numbers, and hyphens']
  },
  subdominio: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Subdominio can only contain lowercase letters, numbers, and hyphens']
  },
  linkDominio: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Link dominio must be a valid URL'
    }
  },
  localNombreComercial: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  localDescripcion: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  localDireccion: {
    type: String,
    required: false,
    trim: true,
    maxlength: 300
  },
  localDepartamento: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  localProvincia: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  localDistrito: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  localTelefono: {
    type: String,
    required: false,
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]{7,15}$/, 'Please enter a valid phone number']
  },
  localWpp: {
    type: String,
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]{7,15}$/, 'Please enter a valid WhatsApp number']
  },
  localAceptaRecojo: {
    type: Boolean,
    default: true
  },
  localAceptaPagoEnLinea: {
    type: Boolean,
    default: true
  },
  localPorcentajeImpuesto: {
    type: Number,
    required: false,
    min: 0,
    max: 100,
    default: 18
  },
  estaAbiertoParaDelivery: {
    type: Boolean,
    default: true
  },
  estaAbiertoParaRecojo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
LocalSchema.index({ subdominio: 1 });
LocalSchema.index({ localDepartamento: 1, localProvincia: 1, localDistrito: 1 });
LocalSchema.index({ localAceptaRecojo: 1 });
LocalSchema.index({ localAceptaPagoEnLinea: 1 });
LocalSchema.index({ estaAbiertoParaDelivery: 1 });
LocalSchema.index({ estaAbiertoParaRecojo: 1 });

export const Local = mongoose.model<ILocal>('Local', LocalSchema);
