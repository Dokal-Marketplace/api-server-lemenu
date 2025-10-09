import { IWhatsAppBot } from 'src/models/WhatsApp';
import { BaseEntity } from './common';
import { Order, OrderItem } from './orders';

export interface WahaSession {
  name: string;
  status: 'STOPPED' | 'STARTING' | 'SCAN_QR_CODE' | 'WORKING' | 'FAILED';
  config: WahaSessionConfig;
  me?: {
    id: string;
    pushName: string;
  };
  engine: {
    engine: 'WEBJS' | 'NOWEB' | 'GOWS';
  };
}

export interface WahaSessionConfig {
  webhooks?: Array<{
    url: string;
    events: string[];
    hmac?: {
      key: string;
    };
    customHeaders?: Array<{
      name: string;
      value: string;
    }>;
    retries?: {
      policy: string;
      delaySeconds: number;
      attempts: number;
    };
  }>;
  metadata?: Record<string, any>;
  ignore?: {
    status?: boolean;
    groups?: boolean;
    channels?: boolean;
    broadcast?: boolean;
  };
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  debug?: boolean;
}

export interface WahaMessage {
  to: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contact' | 'interactive' | 'template';
  text?: string;
  media?: {
    url?: string;
    filename?: string;
    mimetype?: string;
  };
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
  interactive?: {
    type: 'button' | 'list' | 'product' | 'product_list';
    header?: {
      type: 'text' | 'image' | 'video';
      content: string;
    };
    body: string;
    footer?: string;
    action: {
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
    };
  };
  template?: {
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
  };
}

export interface WahaWebhookEvent {
  event: string;
  session: string;
  payload: any;
  timestamp: number;
  me?: {
    id: string;
    pushName: string;
  };
  environment?: {
    version: string;
    engine: string;
    tier: string;
  };
}
export interface CreateBotParams {
  name: string;
  phoneNumber: string;
  subDomain: string;
  localId?: string;
  configuration?: Partial<IWhatsAppBot['configuration']>;
}

export interface SendMessageParams {
  botId: string;
  to: string;
  message: WahaMessage;
}
export interface WhatsAppBot extends BaseEntity {
  name: string;
  phoneNumber: string;
  status: BotStatus;
  isConnected: boolean;
  qrCode?: string;
  lastActivity?: string;
  configuration: BotConfiguration;
  statistics: BotStatistics;
}

export type BotStatus = 'active' | 'inactive' | 'connecting' | 'disconnected' | 'error';

export interface BotConfiguration {
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

export interface BotStatistics {
  totalMessages: number;
  totalOrders: number;
  totalCustomers: number;
  conversionRate: number;
  averageResponseTime: number; // seconds
  messagesThisMonth: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
}

export interface WhatsAppChat extends BaseEntity {
  customerPhone: string;
  customerName?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  messageCount: number;
  isActive: boolean;
  tags: string[];
  assignedAgent?: string;
  context: ChatContext;
  orders: Order[];
}

export interface ChatContext {
  currentFlow?: ChatFlow;
  currentStep?: string;
  userData: Record<string, any>;
  orderDraft?: OrderDraft;
  lastIntent?: string;
  conversationHistory: ChatMessage[];
}

export type ChatFlow = 
  | 'menu_browsing'
  | 'order_creation'
  | 'order_tracking'
  | 'customer_support'
  | 'payment_assistance'
  | 'feedback_collection';

export interface ChatMessage extends BaseEntity {
  chatId: string;
  type: MessageType;
  direction: 'inbound' | 'outbound';
  content: MessageContent;
  timestamp: string;
  status: MessageStatus;
  metadata?: Record<string, any>;
}

export type MessageType = 
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'document'
  | 'location'
  | 'contact'
  | 'interactive'
  | 'template';

export type MessageStatus = 
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'pending';

export interface MessageContent {
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
  interactive?: InteractiveMessage;
  template?: TemplateMessage;
}

export interface InteractiveMessage {
  type: 'button' | 'list' | 'product' | 'product_list';
  header?: {
    type: 'text' | 'image' | 'video';
    content: string;
  };
  body: string;
  footer?: string;
  action: InteractiveAction;
}

export interface InteractiveAction {
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

export interface TemplateMessage {
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

export interface OrderDraft {
  items: OrderItem[];
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

export interface WhatsAppCustomer extends BaseEntity {
  phone: string;
  name?: string;
  profilePictureUrl?: string;
  labels: string[];
  isBlocked: boolean;
  lastInteraction: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  preferences: CustomerPreferences;
  interactions: CustomerInteraction[];
}

export interface CustomerPreferences {
  language: string;
  communicationFrequency: 'high' | 'medium' | 'low';
  preferredOrderType: 'delivery' | 'pickup';
  favoriteProducts: string[];
  dietaryRestrictions: string[];
  paymentMethod: string;
}

export interface CustomerInteraction {
  type: 'message' | 'order' | 'complaint' | 'feedback';
  timestamp: string;
  description: string;
  value?: number;
  orderId?: string;
  rating?: number;
}

export interface BotAutomation extends BaseEntity {
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  executionCount: number;
  lastExecuted?: string;
}

export interface AutomationTrigger {
  type: 'message_received' | 'order_status_change' | 'time_based' | 'customer_action';
  config: Record<string, any>;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface AutomationAction {
  type: 'send_message' | 'add_tag' | 'remove_tag' | 'create_task' | 'update_customer' | 'webhook';
  config: Record<string, any>;
}

export interface WhatsAppMetrics {
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  activeChats: number;
  responseTime: number;
  conversionRate: number;
  orderConversions: number;
  customerSatisfaction: number;
}