import mongoose, { Document, Schema } from 'mongoose';

export type ConversationIntent = 'menu' | 'order' | 'support' | 'info' | 'payment' | 'delivery' | 'idle';

export interface IConversationContext {
  selectedItems?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  deliveryAddress?: {
    street?: string;
    city?: string;
    postalCode?: string;
    notes?: string;
  };
  orderTotal?: number;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'yape' | 'plin' | 'mercado_pago' | 'bank_transfer';
  customerName?: string;
  customerEmail?: string;
  previousMessages?: Array<{
    role: 'user' | 'bot';
    content: string;
    timestamp: Date;
  }>;
  lastUserMessage?: string;
  retryCount?: number;
  // Add order reference
  currentOrderId?: string; // Reference to Order
  orderHistory?: string[]; // Array of order IDs for this conversation
  [key: string]: any; // Allow custom fields
}

export interface IConversationState extends Document {
  sessionId: string;
  userId: string; // Phone number
  botId: mongoose.Types.ObjectId;
  subDomain: string;
  currentIntent: ConversationIntent;
  currentStep: string;
  previousIntent?: ConversationIntent;
  previousStep?: string;
  context: IConversationContext;
  metadata: {
    language?: string;
    timezone?: string;
    userAgent?: string;
    platform?: string;
    [key: string]: any;
  };
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  // Add order reference
  currentOrderId?: string; // Reference to current active order
  orderHistory?: string[]; // Array of all orders from this conversation
}

const ConversationStateSchema = new Schema<IConversationState>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    botId: {
      type: Schema.Types.ObjectId,
      ref: 'WhatsAppBot',
      required: true,
      index: true
    },
    subDomain: {
      type: String,
      required: true,
      index: true
    },
    currentIntent: {
      type: String,
      enum: ['menu', 'order', 'support', 'info', 'payment', 'delivery', 'idle'],
      default: 'idle',
      index: true
    },
    currentStep: {
      type: String,
      default: 'initial'
    },
    previousIntent: {
      type: String,
      enum: ['menu', 'order', 'support', 'info', 'payment', 'delivery', 'idle']
    },
    previousStep: {
      type: String
    },
    context: {
      type: Schema.Types.Mixed,
      default: {}
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    // Add order reference fields
    currentOrderId: {
      type: String,
      ref: 'Order',
      trim: true,
      index: true
    },
    orderHistory: [{
      type: String,
      ref: 'Order'
    }]
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
ConversationStateSchema.index({ botId: 1, userId: 1 });
ConversationStateSchema.index({ subDomain: 1, isActive: 1 });
ConversationStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup
ConversationStateSchema.index({ currentOrderId: 1, isActive: 1 });
ConversationStateSchema.index({ botId: 1, currentOrderId: 1 });

// Methods
ConversationStateSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

ConversationStateSchema.methods.updateIntent = function(intent: ConversationIntent, step?: string) {
  this.previousIntent = this.currentIntent;
  this.previousStep = this.currentStep;
  this.currentIntent = intent;
  if (step) this.currentStep = step;
  this.lastActivity = new Date();
  return this.save();
};

ConversationStateSchema.methods.addMessage = function(role: 'user' | 'bot', content: string) {
  if (!this.context.previousMessages) {
    this.context.previousMessages = [];
  }
  
  // Keep only last 20 messages to avoid document size issues
  if (this.context.previousMessages.length >= 20) {
    this.context.previousMessages.shift();
  }
  
  this.context.previousMessages.push({
    role,
    content,
    timestamp: new Date()
  });
  
  if (role === 'user') {
    this.context.lastUserMessage = content;
  }
  
  this.lastActivity = new Date();
  return this.save();
};

ConversationStateSchema.methods.resetContext = function(keepHistory = false) {
  const history = keepHistory ? this.context.previousMessages : [];
  this.context = {
    previousMessages: history
  };
  this.currentIntent = 'idle';
  this.currentStep = 'initial';
  return this.save();
};

ConversationStateSchema.methods.extendExpiration = function(hours = 24) {
  this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  return this.save();
};

export const ConversationState = mongoose.model<IConversationState>(
  'ConversationState',
  ConversationStateSchema
);
