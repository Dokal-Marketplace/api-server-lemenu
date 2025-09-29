import { FilterQuery } from "mongoose";
import { Order, IOrder } from "../models/Order";

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


