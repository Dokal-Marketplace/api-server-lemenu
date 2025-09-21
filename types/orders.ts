import { BaseEntity, Address, Location } from './common';
import { ModalityAttention } from '@/constants/orderConstants';

export interface Order extends BaseEntity {
  orderNumber: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  type: OrderType;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatus;
  source: OrderSource;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  notes?: string;
  deliveryInfo?: DeliveryInfo;
  localId: string;
  subDomain: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address?: Address;
  customerId?: string;
  loyaltyPoints?: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  presentationId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers?: OrderModifier[];
  notes?: string;
  imageUrl?: string;
}

export interface OrderModifier {
  modifierId: string;
  name: string;
  options: OrderModifierOption[];
}

export interface OrderModifierOption {
  optionId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface DeliveryInfo {
  address: Address;
  coordinates?: Location;
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

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'dispatched' 
  | 'delivered' 
  | 'cancelled' 
  | 'rejected';

export type OrderType = 
  | 'delivery' 
  | 'pickup' 
  | 'on_site' 
  | 'scheduled_delivery' 
  | 'scheduled_pickup';

export type PaymentMethodType = 
  | 'cash' 
  | 'card' 
  | 'yape' 
  | 'plin' 
  | 'mercado_pago' 
  | 'bank_transfer';

export type PaymentStatus = 
  | 'pending' 
  | 'paid' 
  | 'failed' 
  | 'refunded' 
  | 'partial';

export type OrderSource = 
  | 'digital_menu' 
  | 'whatsapp' 
  | 'phone' 
  | 'pos' 
  | 'website';

export interface OrderFilters {
  status?: OrderStatus[];
  type?: OrderType[];
  source?: OrderSource[];
  dateFrom?: string;
  dateTo?: string;
  customer?: string;
  minAmount?: number;
  maxAmount?: number;
  localId?: string;
}

export interface OrderStats {
  total: number;
  pending: number;
  preparing: number;
  ready: number;
  delivered: number;
  cancelled: number;
  revenue: number;
  averageOrderValue: number;
}

export interface OrderUpdateData {
  status?: OrderStatus;
  estimatedDeliveryTime?: string;
  notes?: string;
  assignedDriver?: string;
}

// Kanban board types
export interface OrderColumn {
  id: OrderStatus;
  title: string;
  orders: Order[];
}

export interface OrderDragResult {
  draggableId: string;
  type: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  } | null;
}