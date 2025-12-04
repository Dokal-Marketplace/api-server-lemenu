import mongoose, { Schema, Document } from "mongoose";

export interface IOrderModifierOption extends Document {
  optionId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface IOrderModifier extends Document {
  modifierId: string;
  name: string;
  options: IOrderModifierOption[];
}

export interface IOrderItem extends Document {
  id: string;
  productId: string;
  presentationId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers?: IOrderModifier[];
  notes?: string;
  imageUrl?: string;
}

export interface ICustomerInfo extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  customerId?: string;
  loyaltyPoints?: number;
}

export interface IDeliveryInfo extends Document {
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  deliveryInstructions?: string;
  estimatedTime: number; // minutes
  assignedDriver?: {
    id: string;
    name: string;
    phone: string;
  };
  deliveryCompany?: {
    id: string;
    name: string;
  };
}

export interface IOrder extends Document {
  orderNumber: string;
  customer: ICustomerInfo;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'cancelled' | 'rejected';
  type: 'delivery' | 'pickup' | 'on_site' | 'scheduled_delivery' | 'scheduled_pickup';
  paymentMethod: 'cash' | 'card' | 'yape' | 'plin' | 'mercado_pago' | 'bank_transfer';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';
  source: 'digital_menu' | 'whatsapp' | 'phone' | 'pos' | 'website';
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
    // Add conversation reference
  conversationId?: string; // Reference to ConversationState sessionId
  botId?: string; // Reference to WhatsAppBot
  notes?: string;
  deliveryInfo?: IDeliveryInfo;
  localId: string;
  subDomain: string;
  archived: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderModifierOptionSchema = new Schema<IOrderModifierOption>({
  optionId: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, { _id: false });

const OrderModifierSchema = new Schema<IOrderModifier>({
  modifierId: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  options: [OrderModifierOptionSchema]
}, { _id: false });

const OrderItemSchema = new Schema<IOrderItem>({
  id: {
    type: String,
    required: true,
    trim: true
  },
  productId: {
    type: String,
    required: true,
    ref: 'Product',
    trim: true
  },
  presentationId: {
    type: String,
    ref: 'Presentation',
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  modifiers: [OrderModifierSchema],
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Image URL must be a valid URL'
    }
  }
}, { _id: false });

const CustomerInfoSchema = new Schema<ICustomerInfo>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]{7,15}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100
    },
    zipCode: {
      type: String,
      trim: true,
      maxlength: 20
    },
    country: {
      type: String,
      trim: true,
      maxlength: 100
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  customerId: {
    type: String,
    trim: true
  },
  loyaltyPoints: {
    type: Number,
    min: 0,
    default: 0
  }
}, { _id: false });

const DeliveryInfoSchema = new Schema<IDeliveryInfo>({
  address: {
    street: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  deliveryInstructions: {
    type: String,
    trim: true,
    maxlength: 500
  },
  estimatedTime: {
    type: Number,
    required: true,
    min: 0
  },
  assignedDriver: {
    id: {
      type: String,
      trim: true
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[0-9\s\-\(\)]{7,15}$/, 'Please enter a valid phone number']
    }
  },
  deliveryCompany: {
    id: {
      type: String,
      trim: true
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100
    }
  }
}, { _id: false });

const OrderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: false, // Set by pre-save hook
    unique: true,
    trim: true,
    uppercase: true
  },
  customer: {
    type: CustomerInfoSchema,
    required: true
  },
  items: [OrderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  deliveryFee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled', 'rejected'],
    default: 'pending'
  },
  type: {
    type: String,
    required: true,
    enum: ['delivery', 'pickup', 'on_site', 'scheduled_delivery', 'scheduled_pickup']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'yape', 'plin', 'mercado_pago', 'bank_transfer']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partial'],
    default: 'pending'
  },
  source: {
    type: String,
    required: true,
    enum: ['digital_menu', 'whatsapp', 'phone', 'pos', 'website']
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  deliveryInfo: DeliveryInfoSchema,
  localId: {
    type: String,
    required: true,
    ref: 'Local',
    trim: true
  },
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  // Add conversation reference fields
  conversationId: {
    type: String,
    ref: 'ConversationState',
    trim: true,
    index: true
  },
  botId: {
    type: String,
    ref: 'WhatsAppBot',
    trim: true,
    index: true
  },
  archived: {
    type: Boolean,
    default: false,
    index: true
  },
  archivedAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
});

// Add compound index for conversation queries
OrderSchema.index({ conversationId: 1, subDomain: 1 });
OrderSchema.index({ botId: 1, status: 1 });

// Pre-save middleware to generate order number
OrderSchema.pre('save', function(this: any, next: any) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.orderNumber = `ORD${timestamp}${random}`;
  }
  next();
});

// Pre-save middleware to calculate totals
OrderSchema.pre('save', function(this: any, next: any) {
  // Calculate item totals
  this.items.forEach((item: any) => {
    item.totalPrice = item.unitPrice * item.quantity;
    
    // Add modifier costs
    if (item.modifiers && item.modifiers.length > 0) {
      item.modifiers.forEach((modifier: any) => {
        modifier.options.forEach((option: any) => {
          item.totalPrice += option.price * option.quantity;
        });
      });
    }
  });

  // Calculate subtotal
  this.subtotal = this.items.reduce((sum: any, item: any) => sum + item.totalPrice, 0);

  // Calculate total
  this.total = this.subtotal + this.tax + this.deliveryFee - this.discount;

  // Ensure total is not negative
  this.total = Math.max(0, this.total);
  
  next();
});

// Indexes for better query performance
OrderSchema.index({ status: 1 });
OrderSchema.index({ type: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ source: 1 });
OrderSchema.index({ localId: 1 });
OrderSchema.index({ subDomain: 1 });
OrderSchema.index({ 'customer.phone': 1 });
OrderSchema.index({ 'customer.email': 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ estimatedDeliveryTime: 1 });
OrderSchema.index({ actualDeliveryTime: 1 });

// Compound indexes
OrderSchema.index({ subDomain: 1, status: 1 });
OrderSchema.index({ localId: 1, status: 1 });
OrderSchema.index({ subDomain: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ subDomain: 1, archived: 1 });
OrderSchema.index({ localId: 1, archived: 1 });
OrderSchema.index({ archived: 1, createdAt: -1 });

// Text search index
OrderSchema.index({ 
  orderNumber: 'text',
  'customer.name': 'text',
  'customer.phone': 'text',
  notes: 'text'
});

// Static methods
OrderSchema.statics.findByStatus = function(status: string, subDomain?: string) {
  const query: any = { status };
  if (subDomain) {
    query.subDomain = subDomain;
  }
  return this.find(query).sort({ createdAt: -1 });
};

OrderSchema.statics.findByCustomer = function(customerPhone: string, subDomain?: string) {
  const query: any = { 'customer.phone': customerPhone };
  if (subDomain) {
    query.subDomain = subDomain;
  }
  return this.find(query).sort({ createdAt: -1 });
};

OrderSchema.statics.findByDateRange = function(startDate: Date, endDate: Date, subDomain?: string) {
  const query: any = {
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  if (subDomain) {
    query.subDomain = subDomain;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Instance methods
OrderSchema.methods.updateStatus = function(this: any, newStatus: string) {
  this.status = newStatus as any;
  if (newStatus === 'delivered') {
    this.actualDeliveryTime = new Date();
  }
  return this.save();
};

OrderSchema.methods.addItem = function(this: any, item: IOrderItem) {
  this.items.push(item);
  return this.save();
};

OrderSchema.methods.removeItem = function(this: any, itemId: string) {
  this.items = this.items.filter((item: any) => item.id !== itemId);
  return this.save();
};

// Virtual for order summary
OrderSchema.virtual('summary').get(function(this: any) {
  return {
    orderNumber: this.orderNumber,
    customerName: this.customer.name,
    total: this.total,
    status: this.status,
    itemCount: this.items.length
  };
});

// Ensure virtual fields are serialized
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
