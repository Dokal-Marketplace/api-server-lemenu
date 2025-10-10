import { FilterQuery, PipelineStage } from "mongoose";
import { Order, IOrder, IOrderItem, ICustomerInfo, IDeliveryInfo } from "../models/Order";
import logger from "../utils/logger";

export interface GetOrdersParams {
  subDomain: string;
  localId: string;
  status?: string | string[];
  type?: string | string[];
  source?: string | string[];
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string | number;
  maxAmount?: string | number;
}

export async function getOrdersForRestaurant(params: GetOrdersParams) {
  const {
    subDomain,
    localId,
    status,
    type,
    source,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount
  } = params;

  const query: FilterQuery<IOrder> = { subDomain, localId } as any;

  if (status) {
    const statuses = Array.isArray(status) ? status : String(status).split(",");
    (query as any).status = { $in: statuses };
  }
  if (type) {
    const types = Array.isArray(type) ? type : String(type).split(",");
    (query as any).type = { $in: types };
  }
  if (source) {
    const sources = Array.isArray(source) ? source : String(source).split(",");
    (query as any).source = { $in: sources };
  }
  if (dateFrom || dateTo) {
    (query as any).createdAt = {} as any;
    if (dateFrom) (query as any).createdAt.$gte = new Date(String(dateFrom));
    if (dateTo) (query as any).createdAt.$lte = new Date(String(dateTo));
  }
  if (minAmount || maxAmount) {
    (query as any).total = {} as any;
    if (minAmount !== undefined && minAmount !== null && minAmount !== "")
      (query as any).total.$gte = Number(minAmount);
    if (maxAmount !== undefined && maxAmount !== null && maxAmount !== "")
      (query as any).total.$lte = Number(maxAmount);
  }

  return Order.find(query).sort({ createdAt: -1 });
}

export async function getOrdersAdminPaginated({
  page = 1,
  limit = 20,
  startDate,
  endDate
}: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const query: FilterQuery<IOrder> = {} as any;
  if (startDate || endDate) {
    (query as any).createdAt = {} as any;
    if (startDate) (query as any).createdAt.$gte = new Date(String(startDate));
    if (endDate) (query as any).createdAt.$lte = new Date(String(endDate));
  }

  const [total, orders] = await Promise.all([
    Order.countDocuments(query),
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit)
  ]);

  const totalPages = Math.ceil(total / safeLimit);
  return { orders, pagination: { page: safePage, limit: safeLimit, total, totalPages } };
}

export function getOrderById(orderId: string) {
  return Order.findById(orderId);
}

export async function updateOrderStatus(orderId: string, status: IOrder["status"], statusReason?: string) {
  const order = await Order.findById(orderId);
  if (!order) return null;

  order.status = status;
  if (status === "delivered") {
    order.actualDeliveryTime = new Date();
  }
  if (statusReason) {
    order.notes = order.notes ? `${order.notes}\n${statusReason}` : statusReason;
  }
  await order.save();
  return order;
}

// Placeholder for auto status change configuration persistence
export function configureAutoStatusChange(subDomain: string, localId: string, isActive: boolean, intervalTime: number) {
  return { subDomain, localId, isActive, intervalTime };
}

export interface CreateOrderParams {
  customer: ICustomerInfo;
  items: IOrderItem[];
  type: IOrder['type'];
  paymentMethod: IOrder['paymentMethod'];
  source: IOrder['source'];
  subDomain: string;
  localId: string;
  deliveryInfo?: IDeliveryInfo;
  notes?: string;
  conversationId?: string;
  botId?: string;
  tax?: number;
  deliveryFee?: number;
  discount?: number;
}

export async function createOrder(params: CreateOrderParams): Promise<IOrder> {
  try {
    const {
      customer,
      items,
      type,
      paymentMethod,
      source,
      subDomain,
      localId,
      deliveryInfo,
      notes,
      conversationId,
      botId,
      tax = 0,
      deliveryFee = 0,
      discount = 0
    } = params;

    // Validate required fields
    if (!customer || !items || items.length === 0) {
      throw new Error('Customer and items are required');
    }

    if (!subDomain || !localId) {
      throw new Error('SubDomain and localId are required');
    }

    // Calculate subtotal from items
    const subtotal = items.reduce((sum, item) => {
      let itemTotal = item.unitPrice * item.quantity;
      
      // Add modifier costs
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(modifier => {
          modifier.options.forEach(option => {
            itemTotal += option.price * option.quantity;
          });
        });
      }
      
      return sum + itemTotal;
    }, 0);

    const total = subtotal + tax + deliveryFee - discount;

    const order = new Order({
      customer,
      items,
      subtotal,
      tax,
      deliveryFee,
      discount,
      total,
      type,
      paymentMethod,
      source,
      subDomain,
      localId,
      deliveryInfo,
      notes,
      conversationId,
      botId,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await order.save();
    logger.info('Order created successfully', { orderId: order._id, orderNumber: order.orderNumber });
    return order;
  } catch (error) {
    logger.error('Error creating order', { error, params });
    throw error;
  }
}

export interface UpdateOrderParams {
  customer?: Partial<ICustomerInfo>;
  items?: IOrderItem[];
  status?: IOrder['status'];
  paymentStatus?: IOrder['paymentStatus'];
  deliveryInfo?: Partial<IDeliveryInfo>;
  notes?: string;
  tax?: number;
  deliveryFee?: number;
  discount?: number;
  statusReason?: string;
}

export async function updateOrder(orderId: string, params: UpdateOrderParams): Promise<IOrder | null> {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return null;
    }

    // Update fields
    if (params.customer) {
      Object.assign(order.customer, params.customer);
    }

    if (params.items) {
      order.items = params.items;
    }

    if (params.status) {
      order.status = params.status;
      if (params.status === 'delivered') {
        order.actualDeliveryTime = new Date();
      }
    }

    if (params.paymentStatus) {
      order.paymentStatus = params.paymentStatus;
    }

    if (params.deliveryInfo) {
      if (order.deliveryInfo) {
        Object.assign(order.deliveryInfo, params.deliveryInfo);
      } else {
        order.deliveryInfo = params.deliveryInfo as IDeliveryInfo;
      }
    }

    if (params.notes !== undefined) {
      order.notes = params.notes;
    }

    if (params.tax !== undefined) {
      order.tax = params.tax;
    }

    if (params.deliveryFee !== undefined) {
      order.deliveryFee = params.deliveryFee;
    }

    if (params.discount !== undefined) {
      order.discount = params.discount;
    }

    if (params.statusReason) {
      order.notes = order.notes ? `${order.notes}\n${params.statusReason}` : params.statusReason;
    }

    await order.save();
    logger.info('Order updated successfully', { orderId: order._id, orderNumber: order.orderNumber });
    return order;
  } catch (error) {
    logger.error('Error updating order', { error, orderId, params });
    throw error;
  }
}

export async function deleteOrder(orderId: string): Promise<boolean> {
  try {
    const result = await Order.findByIdAndDelete(orderId);
    if (result) {
      logger.info('Order deleted successfully', { orderId, orderNumber: result.orderNumber });
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error deleting order', { error, orderId });
    throw error;
  }
}

export interface SearchOrdersParams {
  subDomain?: string;
  localId?: string;
  status?: string | string[];
  type?: string | string[];
  paymentStatus?: string | string[];
  source?: string | string[];
  customerPhone?: string;
  customerEmail?: string;
  orderNumber?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function searchOrders(params: SearchOrdersParams) {
  try {
    const {
      subDomain,
      localId,
      status,
      type,
      paymentStatus,
      source,
      customerPhone,
      customerEmail,
      orderNumber,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    const query: FilterQuery<IOrder> = {} as any;

    if (subDomain) {
      (query as any).subDomain = subDomain;
    }

    if (localId) {
      (query as any).localId = localId;
    }

    if (status) {
      const statuses = Array.isArray(status) ? status : String(status).split(",");
      (query as any).status = { $in: statuses };
    }

    if (type) {
      const types = Array.isArray(type) ? type : String(type).split(",");
      (query as any).type = { $in: types };
    }

    if (paymentStatus) {
      const paymentStatuses = Array.isArray(paymentStatus) ? paymentStatus : String(paymentStatus).split(",");
      (query as any).paymentStatus = { $in: paymentStatuses };
    }

    if (source) {
      const sources = Array.isArray(source) ? source : String(source).split(",");
      (query as any).source = { $in: sources };
    }

    if (customerPhone) {
      (query as any)['customer.phone'] = { $regex: customerPhone, $options: 'i' };
    }

    if (customerEmail) {
      (query as any)['customer.email'] = { $regex: customerEmail, $options: 'i' };
    }

    if (orderNumber) {
      (query as any).orderNumber = { $regex: orderNumber, $options: 'i' };
    }

    if (dateFrom || dateTo) {
      (query as any).createdAt = {} as any;
      if (dateFrom) (query as any).createdAt.$gte = new Date(String(dateFrom));
      if (dateTo) (query as any).createdAt.$lte = new Date(String(dateTo));
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      (query as any).total = {} as any;
      if (minAmount !== undefined) (query as any).total.$gte = minAmount;
      if (maxAmount !== undefined) (query as any).total.$lte = maxAmount;
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query).sort(sort).skip(skip).limit(safeLimit)
    ]);

    const totalPages = Math.ceil(total / safeLimit);

    return {
      orders,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages
      }
    };
  } catch (error) {
    logger.error('Error searching orders', { error, params });
    throw error;
  }
}

export interface OrderStatsParams {
  subDomain?: string;
  localId?: string;
  dateFrom?: string;
  dateTo?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export async function getOrderStats(params: OrderStatsParams) {
  try {
    const { subDomain, localId, dateFrom, dateTo, groupBy = 'day' } = params;

    const matchQuery: any = {};

    if (subDomain) {
      matchQuery.subDomain = subDomain;
    }

    if (localId) {
      matchQuery.localId = localId;
    }

    if (dateFrom || dateTo) {
      matchQuery.createdAt = {};
      if (dateFrom) matchQuery.createdAt.$gte = new Date(String(dateFrom));
      if (dateTo) matchQuery.createdAt.$lte = new Date(String(dateTo));
    }

    // Group by date format
    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-%U'; // Year-Week
        break;
      case 'month':
        dateFormat = '%Y-%m'; // Year-Month
        break;
      default:
        dateFormat = '%Y-%m-%d'; // Year-Month-Day
    }

    const pipeline: PipelineStage[] = [
      { $match: matchQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            status: '$status',
            type: '$type',
            source: '$source'
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          totalOrders: { $sum: '$count' },
          totalRevenue: { $sum: '$totalRevenue' },
          avgOrderValue: { $avg: '$avgOrderValue' },
          statusBreakdown: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          },
          typeBreakdown: {
            $push: {
              type: '$_id.type',
              count: '$count'
            }
          },
          sourceBreakdown: {
            $push: {
              source: '$_id.source',
              count: '$count'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const stats = await Order.aggregate(pipeline);

    // Get overall totals
    const totalStatsPipeline: PipelineStage[] = [
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' },
          statusCounts: {
            $push: '$status'
          },
          typeCounts: {
            $push: '$type'
          },
          sourceCounts: {
            $push: '$source'
          }
        }
      }
    ];
    
    const totalStats = await Order.aggregate(totalStatsPipeline);

    const overall = totalStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      statusCounts: [],
      typeCounts: [],
      sourceCounts: []
    };

    // Count occurrences
    const statusCounts = overall.statusCounts.reduce((acc: any, status: string) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const typeCounts = overall.typeCounts.reduce((acc: any, type: string) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const sourceCounts = overall.sourceCounts.reduce((acc: any, source: string) => {
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    return {
      timeSeries: stats,
      overall: {
        totalOrders: overall.totalOrders,
        totalRevenue: overall.totalRevenue,
        avgOrderValue: overall.avgOrderValue,
        statusBreakdown: statusCounts,
        typeBreakdown: typeCounts,
        sourceBreakdown: sourceCounts
      }
    };
  } catch (error) {
    logger.error('Error getting order stats', { error, params });
    throw error;
  }
}

export async function getOrdersByCustomer(customerPhone: string, subDomain?: string): Promise<IOrder[]> {
  try {
    const query: FilterQuery<IOrder> = { 'customer.phone': customerPhone } as any;
    
    if (subDomain) {
      (query as any).subDomain = subDomain;
    }

    return Order.find(query).sort({ createdAt: -1 });
  } catch (error) {
    logger.error('Error getting orders by customer', { error, customerPhone, subDomain });
    throw error;
  }
}

export async function getOrdersByStatus(status: IOrder['status'], subDomain?: string): Promise<IOrder[]> {
  try {
    const query: FilterQuery<IOrder> = { status } as any;
    
    if (subDomain) {
      (query as any).subDomain = subDomain;
    }

    return Order.find(query).sort({ createdAt: -1 });
  } catch (error) {
    logger.error('Error getting orders by status', { error, status, subDomain });
    throw error;
  }
}


