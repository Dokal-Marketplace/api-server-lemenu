import mongoose, { Schema, Document } from "mongoose";

export interface IWhatsAppBot extends Document {
  name: string;
  phoneNumber: string;
  status: 'active' | 'inactive' | 'connecting' | 'disconnected' | 'error';
  isConnected: boolean;
  qrCode?: string;
  lastActivity?: Date;
  configuration: IBotConfiguration;
  statistics: IBotStatistics;
  subDomain: string;
  localId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBotConfiguration {
  autoReply: boolean;
  businessHours: {
    enabled: boolean;
    schedule: {
      [day: string]: {
        start: string;
        end: string;
      } | null;
    };
  };
  welcomeMessage: string;
  offlineMessage: string;
  orderConfirmationTemplate: string;
  paymentReminderTemplate: string;
  deliveryUpdateTemplate: string;
  language: 'es' | 'en' | 'pt';
  features: {
    menuSharing: boolean;
    orderTracking: boolean;
    paymentLinks: boolean;
    promotions: boolean;
    customerSupport: boolean;
  };
  integrations: {
    cartaAI: boolean;
    pos: boolean;
    delivery: boolean;
  };
}

export interface IBotStatistics {
  totalMessages: number;
  totalOrders: number;
  totalCustomers: number;
  conversionRate: number;
  averageResponseTime: number; // seconds
  messagesThisMonth: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
}

export interface IWhatsAppChat extends Document {
  customerPhone: string;
  customerName?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  messageCount: number;
  isActive: boolean;
  tags: string[];
  assignedAgent?: string;
  context: IChatContext;
  orders: string[]; // Array of order IDs
  subDomain: string;
  localId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatContext {
  currentFlow?: 'menu_browsing' | 'order_creation' | 'order_tracking' | 'customer_support' | 'payment_assistance' | 'feedback_collection';
  currentStep?: string;
  userData: Record<string, any>;
  orderDraft?: IOrderDraft;
  lastIntent?: string;
  conversationHistory: IChatMessage[];
}

export interface IOrderDraft {
  items: Array<{
    id: string;
    productId: string;
    presentationId?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    modifiers?: Array<{
      modifierId: string;
      name: string;
      options: Array<{
        optionId: string;
        name: string;
        price: number;
        quantity: number;
      }>;
    }>;
    notes?: string;
    imageUrl?: string;
  }>;
  customerInfo?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  orderType?: 'delivery' | 'pickup';
  paymentMethod?: string;
  notes?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface IChatMessage extends Document {
  chatId: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'interactive' | 'template';
  direction: 'inbound' | 'outbound';
  content: IMessageContent;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  metadata?: Record<string, any>;
  subDomain: string;
  localId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageContent {
  text?: string;
  mediaUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contact?: {
    name: string;
    phone: string;
  };
  interactive?: IInteractiveMessage;
  template?: ITemplateMessage;
}

export interface IInteractiveMessage {
  type: 'button' | 'list' | 'product' | 'product_list';
  header?: {
    type: 'text' | 'image' | 'video';
    content: string;
  };
  body: string;
  footer?: string;
  action: IInteractiveAction;
}

export interface IInteractiveAction {
  buttons?: Array<{
    id: string;
    title: string;
  }>;
  sections?: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
  catalogId?: string;
  productRetailerId?: string;
}

export interface ITemplateMessage {
  name: string;
  language: string;
  components: Array<{
    type: 'header' | 'body' | 'footer' | 'button';
    parameters?: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
      text?: string;
      currency?: {
        fallback_value: string;
        code: string;
        amount_1000: number;
      };
      date_time?: {
        fallback_value: string;
      };
      image?: {
        link: string;
      };
      document?: {
        link: string;
        filename: string;
      };
    }>;
  }>;
}

export interface IWhatsAppCustomer extends Document {
  phone: string;
  name?: string;
  profilePictureUrl?: string;
  labels: string[];
  isBlocked: boolean;
  lastInteraction: Date;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  preferences: ICustomerPreferences;
  interactions: ICustomerInteraction[];
  subDomain: string;
  localId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerPreferences {
  language: string;
  communicationFrequency: 'high' | 'medium' | 'low';
  preferredOrderType: 'delivery' | 'pickup';
  favoriteProducts: string[];
  dietaryRestrictions: string[];
  paymentMethod: string;
}

export interface ICustomerInteraction {
  type: 'message' | 'order' | 'complaint' | 'feedback';
  timestamp: Date;
  description: string;
  value?: number;
  orderId?: string;
  rating?: number;
}

export interface IBotAutomation extends Document {
  name: string;
  description: string;
  trigger: IAutomationTrigger;
  conditions: IAutomationCondition[];
  actions: IAutomationAction[];
  isActive: boolean;
  executionCount: number;
  lastExecuted?: Date;
  subDomain: string;
  localId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAutomationTrigger {
  type: 'message_received' | 'order_status_change' | 'time_based' | 'customer_action';
  config: Record<string, any>;
}

export interface IAutomationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface IAutomationAction {
  type: 'send_message' | 'add_tag' | 'remove_tag' | 'create_task' | 'update_customer' | 'webhook';
  config: Record<string, any>;
}

export interface IWhatsAppMetrics extends Document {
  subDomain: string;
  localId?: string;
  date: string;
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  activeChats: number;
  responseTime: number;
  conversionRate: number;
  orderConversions: number;
  customerSatisfaction: number;
  createdAt: Date;
  updatedAt: Date;
}

// BotConfiguration Schema
const BotConfigurationSchema = new Schema<IBotConfiguration>({
  autoReply: {
    type: Boolean,
    default: true
  },
  businessHours: {
    enabled: {
      type: Boolean,
      default: true
    },
    schedule: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  welcomeMessage: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: '¡Hola! Bienvenido a nuestro restaurante. ¿En qué puedo ayudarte?'
  },
  offlineMessage: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: 'Estamos cerrados en este momento. Te responderemos pronto.'
  },
  orderConfirmationTemplate: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  paymentReminderTemplate: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  deliveryUpdateTemplate: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  language: {
    type: String,
    enum: ['es', 'en', 'pt'],
    default: 'es'
  },
  features: {
    menuSharing: { type: Boolean, default: true },
    orderTracking: { type: Boolean, default: true },
    paymentLinks: { type: Boolean, default: false },
    promotions: { type: Boolean, default: true },
    customerSupport: { type: Boolean, default: true }
  },
  integrations: {
    cartaAI: { type: Boolean, default: false },
    pos: { type: Boolean, default: false },
    delivery: { type: Boolean, default: false }
  }
}, { _id: false });

// BotStatistics Schema
const BotStatisticsSchema = new Schema<IBotStatistics>({
  totalMessages: { type: Number, default: 0, min: 0 },
  totalOrders: { type: Number, default: 0, min: 0 },
  totalCustomers: { type: Number, default: 0, min: 0 },
  conversionRate: { type: Number, default: 0, min: 0, max: 100 },
  averageResponseTime: { type: Number, default: 0, min: 0 },
  messagesThisMonth: { type: Number, default: 0, min: 0 },
  ordersThisMonth: { type: Number, default: 0, min: 0 },
  revenueThisMonth: { type: Number, default: 0, min: 0 }
}, { _id: false });

// WhatsAppBot Schema
const WhatsAppBotSchema = new Schema<IWhatsAppBot>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]{7,15}$/, 'Please enter a valid phone number']
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'connecting', 'disconnected', 'error'],
    default: 'inactive'
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  qrCode: {
    type: String,
    trim: true
  },
  lastActivity: {
    type: Date
  },
  configuration: {
    type: BotConfigurationSchema,
    required: true,
    default: {}
  },
  statistics: {
    type: BotStatisticsSchema,
    required: true,
    default: {}
  },
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  localId: {
    type: String,
    ref: 'Local',
    trim: true
  }
}, {
  timestamps: true
});

// OrderDraft Schema
const OrderDraftSchema = new Schema<IOrderDraft>({
  items: [{
    id: { type: String, required: true },
    productId: { type: String, required: true },
    presentationId: { type: String },
    name: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    modifiers: [{
      modifierId: { type: String, required: true },
      name: { type: String, required: true },
      options: [{
        optionId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 }
      }]
    }],
    notes: { type: String },
    imageUrl: { type: String }
  }],
  customerInfo: {
    name: { type: String },
    phone: { type: String },
    address: { type: String }
  },
  orderType: {
    type: String,
    enum: ['delivery', 'pickup']
  },
  paymentMethod: { type: String },
  notes: { type: String },
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

// ChatContext Schema
const ChatContextSchema = new Schema<IChatContext>({
  currentFlow: {
    type: String,
    enum: ['menu_browsing', 'order_creation', 'order_tracking', 'customer_support', 'payment_assistance', 'feedback_collection']
  },
  currentStep: { type: String },
  userData: {
    type: Schema.Types.Mixed,
    default: {}
  },
  orderDraft: OrderDraftSchema,
  lastIntent: { type: String },
  conversationHistory: [{
    type: Schema.Types.ObjectId,
    ref: 'ChatMessage'
  }]
}, { _id: false });

// InteractiveAction Schema
const InteractiveActionSchema = new Schema<IInteractiveAction>({
  buttons: [{
    id: { type: String, required: true },
    title: { type: String, required: true }
  }],
  sections: [{
    title: { type: String, required: true },
    rows: [{
      id: { type: String, required: true },
      title: { type: String, required: true },
      description: { type: String }
    }]
  }],
  catalogId: { type: String },
  productRetailerId: { type: String }
}, { _id: false });

// InteractiveMessage Schema
const InteractiveMessageSchema = new Schema<IInteractiveMessage>({
  type: {
    type: String,
    enum: ['button', 'list', 'product', 'product_list']
  },
  header: {
    type: { type: String, enum: ['text', 'image', 'video'] },
    content: { type: String }
  },
  body: { type: String, required: true },
  footer: { type: String },
  action: InteractiveActionSchema
}, { _id: false });

// TemplateMessage Schema
const TemplateMessageSchema = new Schema<ITemplateMessage>({
  name: { type: String, required: true },
  language: { type: String, required: true },
  components: [{
    type: {
      type: String,
      enum: ['header', 'body', 'footer', 'button']
    },
    parameters: [{
      type: {
        type: String,
        enum: ['text', 'currency', 'date_time', 'image', 'document']
      },
      text: { type: String },
      currency: {
        fallback_value: { type: String },
        code: { type: String },
        amount_1000: { type: Number }
      },
      date_time: {
        fallback_value: { type: String }
      },
      image: {
        link: { type: String }
      },
      document: {
        link: { type: String },
        filename: { type: String }
      }
    }]
  }]
}, { _id: false });

// MessageContent Schema
const MessageContentSchema = new Schema<IMessageContent>({
  text: { type: String },
  mediaUrl: { type: String },
  location: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    name: { type: String },
    address: { type: String }
  },
  contact: {
    name: { type: String },
    phone: { type: String }
  },
  interactive: InteractiveMessageSchema,
  template: TemplateMessageSchema
}, { _id: false });

// WhatsAppChat Schema
const WhatsAppChatSchema = new Schema<IWhatsAppChat>({
  customerPhone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]{7,15}$/, 'Please enter a valid phone number']
  },
  customerName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  lastMessage: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  lastMessageTime: {
    type: Date
  },
  messageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  assignedAgent: {
    type: String,
    ref: 'Staff',
    trim: true
  },
  context: {
    type: ChatContextSchema,
    required: true,
    default: {}
  },
  orders: [{
    type: String,
    ref: 'Order'
  }],
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  localId: {
    type: String,
    ref: 'Local',
    trim: true
  }
}, {
  timestamps: true
});

// ChatMessage Schema
const ChatMessageSchema = new Schema<IChatMessage>({
  chatId: {
    type: String,
    required: true,
    ref: 'WhatsAppChat',
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'image', 'audio', 'video', 'document', 'location', 'contact', 'interactive', 'template']
  },
  direction: {
    type: String,
    required: true,
    enum: ['inbound', 'outbound']
  },
  content: {
    type: MessageContentSchema,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['sent', 'delivered', 'read', 'failed', 'pending'],
    default: 'pending'
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  localId: {
    type: String,
    ref: 'Local',
    trim: true
  }
}, {
  timestamps: true
});

// CustomerPreferences Schema
const CustomerPreferencesSchema = new Schema<ICustomerPreferences>({
  language: {
    type: String,
    default: 'es'
  },
  communicationFrequency: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  preferredOrderType: {
    type: String,
    enum: ['delivery', 'pickup'],
    default: 'delivery'
  },
  favoriteProducts: [{
    type: String,
    ref: 'Product'
  }],
  dietaryRestrictions: [{
    type: String,
    trim: true
  }],
  paymentMethod: {
    type: String,
    trim: true
  }
}, { _id: false });

// CustomerInteraction Schema
const CustomerInteractionSchema = new Schema<ICustomerInteraction>({
  type: {
    type: String,
    required: true,
    enum: ['message', 'order', 'complaint', 'feedback']
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: Number,
    min: 0
  },
  orderId: {
    type: String,
    ref: 'Order'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
}, { _id: false });

// WhatsAppCustomer Schema
const WhatsAppCustomerSchema = new Schema<IWhatsAppCustomer>({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]{7,15}$/, 'Please enter a valid phone number']
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  profilePictureUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Profile picture URL must be a valid URL'
    }
  },
  labels: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  isBlocked: {
    type: Boolean,
    default: false
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0,
    min: 0
  },
  preferences: {
    type: CustomerPreferencesSchema,
    required: true,
    default: {}
  },
  interactions: [CustomerInteractionSchema],
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  localId: {
    type: String,
    ref: 'Local',
    trim: true
  }
}, {
  timestamps: true
});

// AutomationTrigger Schema
const AutomationTriggerSchema = new Schema<IAutomationTrigger>({
  type: {
    type: String,
    required: true,
    enum: ['message_received', 'order_status_change', 'time_based', 'customer_action']
  },
  config: {
    type: Schema.Types.Mixed,
    required: true,
    default: {}
  }
}, { _id: false });

// AutomationCondition Schema
const AutomationConditionSchema = new Schema<IAutomationCondition>({
  field: {
    type: String,
    required: true,
    trim: true
  },
  operator: {
    type: String,
    required: true,
    enum: ['equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in']
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  }
}, { _id: false });

// AutomationAction Schema
const AutomationActionSchema = new Schema<IAutomationAction>({
  type: {
    type: String,
    required: true,
    enum: ['send_message', 'add_tag', 'remove_tag', 'create_task', 'update_customer', 'webhook']
  },
  config: {
    type: Schema.Types.Mixed,
    required: true,
    default: {}
  }
}, { _id: false });

// BotAutomation Schema
const BotAutomationSchema = new Schema<IBotAutomation>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  trigger: {
    type: AutomationTriggerSchema,
    required: true
  },
  conditions: [AutomationConditionSchema],
  actions: [AutomationActionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  executionCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastExecuted: {
    type: Date
  },
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  localId: {
    type: String,
    ref: 'Local',
    trim: true
  }
}, {
  timestamps: true
});

// WhatsAppMetrics Schema
const WhatsAppMetricsSchema = new Schema<IWhatsAppMetrics>({
  subDomain: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  localId: {
    type: String,
    ref: 'Local',
    trim: true
  },
  date: {
    type: String,
    required: true,
    trim: true
  },
  totalMessages: {
    type: Number,
    required: true,
    min: 0
  },
  inboundMessages: {
    type: Number,
    required: true,
    min: 0
  },
  outboundMessages: {
    type: Number,
    required: true,
    min: 0
  },
  activeChats: {
    type: Number,
    required: true,
    min: 0
  },
  responseTime: {
    type: Number,
    required: true,
    min: 0
  },
  conversionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  orderConversions: {
    type: Number,
    required: true,
    min: 0
  },
  customerSatisfaction: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  }
}, {
  timestamps: true
});

// Indexes for WhatsAppBot
WhatsAppBotSchema.index({ status: 1 });
WhatsAppBotSchema.index({ subDomain: 1 });
WhatsAppBotSchema.index({ localId: 1 });
WhatsAppBotSchema.index({ subDomain: 1, status: 1 });

// Indexes for WhatsAppChat
WhatsAppChatSchema.index({ customerPhone: 1 });
WhatsAppChatSchema.index({ isActive: 1 });
WhatsAppChatSchema.index({ subDomain: 1 });
WhatsAppChatSchema.index({ localId: 1 });
WhatsAppChatSchema.index({ assignedAgent: 1 });
WhatsAppChatSchema.index({ subDomain: 1, customerPhone: 1 });

// Indexes for ChatMessage
ChatMessageSchema.index({ chatId: 1 });
ChatMessageSchema.index({ timestamp: 1 });
ChatMessageSchema.index({ type: 1 });
ChatMessageSchema.index({ direction: 1 });
ChatMessageSchema.index({ status: 1 });
ChatMessageSchema.index({ subDomain: 1 });
ChatMessageSchema.index({ chatId: 1, timestamp: 1 });

// Indexes for WhatsAppCustomer
WhatsAppCustomerSchema.index({ subDomain: 1 });
WhatsAppCustomerSchema.index({ localId: 1 });
WhatsAppCustomerSchema.index({ isBlocked: 1 });
WhatsAppCustomerSchema.index({ lastInteraction: 1 });

// Indexes for BotAutomation
BotAutomationSchema.index({ subDomain: 1 });
BotAutomationSchema.index({ localId: 1 });
BotAutomationSchema.index({ isActive: 1 });
BotAutomationSchema.index({ subDomain: 1, isActive: 1 });

// Indexes for WhatsAppMetrics
WhatsAppMetricsSchema.index({ subDomain: 1 });
WhatsAppMetricsSchema.index({ localId: 1 });
WhatsAppMetricsSchema.index({ date: 1 });
WhatsAppMetricsSchema.index({ subDomain: 1, date: 1 });

// Static methods for WhatsAppBot
WhatsAppBotSchema.statics.findBySubDomain = function(subDomain: string) {
  return this.findOne({ subDomain, status: { $ne: 'error' } });
};

WhatsAppBotSchema.statics.findActiveBots = function() {
  return this.find({ status: 'active', isConnected: true });
};

// Static methods for WhatsAppChat
WhatsAppChatSchema.statics.findByCustomer = function(customerPhone: string, subDomain?: string) {
  const query: any = { customerPhone };
  if (subDomain) {
    query.subDomain = subDomain;
  }
  return this.findOne(query);
};

WhatsAppChatSchema.statics.findActiveChats = function(subDomain?: string) {
  const query: any = { isActive: true };
  if (subDomain) {
    query.subDomain = subDomain;
  }
  return this.find(query).sort({ lastMessageTime: -1 });
};

// Static methods for ChatMessage
ChatMessageSchema.statics.findByChat = function(chatId: string, limit: number = 50) {
  return this.find({ chatId }).sort({ timestamp: -1 }).limit(limit);
};

// Static methods for WhatsAppCustomer
WhatsAppCustomerSchema.statics.findByPhone = function(phone: string, subDomain?: string) {
  const query: any = { phone };
  if (subDomain) {
    query.subDomain = subDomain;
  }
  return this.findOne(query);
};

// Instance methods for WhatsAppBot
WhatsAppBotSchema.methods.updateStatus = function(newStatus: string) {
  this.status = newStatus;
  if (newStatus === 'active') {
    this.isConnected = true;
  } else if (newStatus === 'disconnected' || newStatus === 'error') {
    this.isConnected = false;
  }
  return this.save();
};

WhatsAppBotSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Instance methods for WhatsAppChat
WhatsAppChatSchema.methods.addMessage = function(message: IChatMessage) {
  this.lastMessage = message.content.text || 'Media message';
  this.lastMessageTime = message.timestamp;
  this.messageCount += 1;
  return this.save();
};

WhatsAppChatSchema.methods.addOrder = function(orderId: string) {
  if (!this.orders.includes(orderId)) {
    this.orders.push(orderId);
  }
  return this.save();
};

// Instance methods for WhatsAppCustomer
WhatsAppCustomerSchema.methods.addInteraction = function(interaction: ICustomerInteraction) {
  this.interactions.push(interaction);
  this.lastInteraction = new Date();
  return this.save();
};

WhatsAppCustomerSchema.methods.updateOrderStats = function(orderValue: number) {
  this.totalOrders += 1;
  this.totalSpent += orderValue;
  this.averageOrderValue = this.totalSpent / this.totalOrders;
  return this.save();
};

export const WhatsAppBot = mongoose.model<IWhatsAppBot>('WhatsAppBot', WhatsAppBotSchema);
export const WhatsAppChat = mongoose.model<IWhatsAppChat>('WhatsAppChat', WhatsAppChatSchema);
export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
export const WhatsAppCustomer = mongoose.model<IWhatsAppCustomer>('WhatsAppCustomer', WhatsAppCustomerSchema);
export const BotAutomation = mongoose.model<IBotAutomation>('BotAutomation', BotAutomationSchema);
export const WhatsAppMetrics = mongoose.model<IWhatsAppMetrics>('WhatsAppMetrics', WhatsAppMetricsSchema);
