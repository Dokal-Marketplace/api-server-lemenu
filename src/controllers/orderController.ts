import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
 
import {
  configureAutoStatusChange,
  createOrder,
  deleteOrder,
  getOrderById,
  getOrderStats,
  getOrdersAdminPaginated,
  getOrdersByCustomer,
  getOrdersByStatus,
  getOrdersForRestaurant,
  searchOrders,
  updateOrder,
  updateOrderStatus,
  toggleOrderArchived,
  getArchivedOrders
} from "../services/orderService"

export const toggleArchived = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: "Order ID is required" 
      });
    }

    const order = await toggleOrderArchived(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    res.json({ 
      success: true, 
      message: `Order ${order.archived ? 'archived' : 'unarchived'} successfully`,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        archived: order.archived,
        archivedAt: order.archivedAt
      }
    });
  } catch (error) {
    logger.error("Error on toggleArchived", { error, orderId: req.params.orderId });
    next(error);
  }
}


export const autoChangeStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params
    const { isActive, intervalTime } = req.body || {}

    if (typeof isActive !== "boolean" || typeof intervalTime !== "number") {
      return res.status(400).json({ type: "701", message: "Invalid body", data: null })
    }

    const data = configureAutoStatusChange(subDomain, localId, isActive, intervalTime)
    return res.json({ type: "1", message: "Auto change status configuration accepted", data })
  } catch (error) {
    logger.error("Error on autoChangeStatus", { error })
    next(error)
  }
}

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params
    const orders = await getOrdersForRestaurant({
      subDomain,
      localId,
      status: req.query.status as any,
      type: req.query.type as any,
      source: req.query.source as any,
      dateFrom: req.query.dateFrom as any,
      dateTo: req.query.dateTo as any,
      minAmount: req.query.minAmount as any,
      maxAmount: req.query.maxAmount as any
    })
    return res.json({ type: "1", message: "Success", data: orders })
  } catch (error) {
    logger.error("Error fetching orders", { error })
    next(error)
  }
}

export const getAllAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query
    const result = await getOrdersAdminPaginated({
      page: Number(req.query.page) as any,
      limit: Number(req.query.limit) as any,
      startDate: startDate as any,
      endDate: endDate as any
    })
    return res.json({ type: "1", message: "Success", data: result })
  } catch (error) {
    logger.error("Error fetching admin orders", { error })
    next(error)
  }
}


export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params
    const order = await getOrderById(orderId)
    if (!order) {
      return res.status(404).json({ type: "3", message: "Order not found", data: null })
    }
    return res.json({ type: "1", message: "Success", data: order })
  } catch (error) {
    logger.error("Error fetching order", { error })
    next(error)
  }
}

export const changeStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params
    const { status, statusReason } = req.body || {}
    if (!status) {
      return res.status(400).json({ type: "701", message: "Missing status", data: null })
    }

    const order = await updateOrderStatus(orderId, status, statusReason)
    if (!order) {
      return res.status(404).json({ type: "3", message: "Order not found", data: null })
    }
    return res.json({ type: "1", message: "Status updated", data: order })
  } catch (error) {
    logger.error("Error changing order status", { error })
    next(error)
  }
}

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderData = req.body
    
    // Validate required fields
    if (!orderData.customer || !orderData.customer.name || !orderData.customer.phone) {
      return res.status(400).json({ 
        type: "701", 
        message: "Customer name and phone are required", 
        data: null 
      })
    }

    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return res.status(400).json({ 
        type: "701", 
        message: "At least one item is required", 
        data: null 
      })
    }

    if (!orderData.type || !orderData.paymentMethod || !orderData.source) {
      return res.status(400).json({ 
        type: "701", 
        message: "Order type, payment method, and source are required", 
        data: null 
      })
    }

    if (!orderData.subDomain || !orderData.localId) {
      return res.status(400).json({ 
        type: "701", 
        message: "SubDomain and localId are required", 
        data: null 
      })
    }

    // Validate items
    for (const item of orderData.items) {
      if (!item.productId || !item.name || !item.quantity || !item.unitPrice) {
        return res.status(400).json({ 
          type: "701", 
          message: "Each item must have productId, name, quantity, and unitPrice", 
          data: null 
        })
      }
    }

    // Validate WhatsApp is configured and healthy (only if WhatsApp is enabled)
    const { Business } = await import('../models/Business');
    const business = await Business.findOne({ subDomain: orderData.subDomain });
    
    if (business?.whatsappEnabled) {
      const { MetaWhatsAppService } = await import('../services/whatsapp/metaWhatsAppService');
      const health = await MetaWhatsAppService.checkHealth(orderData.subDomain, orderData.localId);
      
      if (!health.isHealthy) {
        return res.status(503).json({
          type: "701",
          message: health.reason || "WhatsApp service is currently unavailable. Orders cannot be created.",
          data: {
            reason: health.reason,
            details: health.details
          }
        });
      }
    }

    const order = await createOrder(orderData)
    return res.status(201).json({ type: "1", message: "Order created successfully", data: order })
  } catch (error) {
    logger.error("Error creating order", { error })
    next(error)
  }
}

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params
    const updateData = req.body
    
    if (!orderId) {
      return res.status(400).json({ type: "701", message: "Order ID is required", data: null })
    }

    // Validate status if provided
    if (updateData.status) {
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled', 'rejected']
      if (!validStatuses.includes(updateData.status)) {
        return res.status(400).json({ 
          type: "701", 
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 
          data: null 
        })
      }
    }

    // Validate payment status if provided
    if (updateData.paymentStatus) {
      const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded', 'partial']
      if (!validPaymentStatuses.includes(updateData.paymentStatus)) {
        return res.status(400).json({ 
          type: "701", 
          message: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`, 
          data: null 
        })
      }
    }

    const order = await updateOrder(orderId, updateData)
    if (!order) {
      return res.status(404).json({ type: "3", message: "Order not found", data: null })
    }
    return res.json({ type: "1", message: "Order updated successfully", data: order })
  } catch (error) {
    logger.error("Error updating order", { error })
    next(error)
  }
}

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params
    
    if (!orderId) {
      return res.status(400).json({ type: "701", message: "Order ID is required", data: null })
    }
    
    const deleted = await deleteOrder(orderId)
    if (!deleted) {
      return res.status(404).json({ type: "3", message: "Order not found", data: null })
    }
    return res.json({ type: "1", message: "Order deleted successfully", data: null })
  } catch (error) {
    logger.error("Error deleting order", { error })
    next(error)
  }
}

export const search = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const searchParams = {
      subDomain: req.query.subDomain as string,
      localId: req.query.localId as string,
      status: req.query.status as string | string[],
      type: req.query.type as string | string[],
      paymentStatus: req.query.paymentStatus as string | string[],
      source: req.query.source as string | string[],
      customerPhone: req.query.customerPhone as string,
      customerEmail: req.query.customerEmail as string,
      orderNumber: req.query.orderNumber as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
      maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    }

    const result = await searchOrders(searchParams)
    return res.json({ type: "1", message: "Search completed", data: result })
  } catch (error) {
    logger.error("Error searching orders", { error })
    next(error)
  }
}

export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const statsParams = {
      subDomain: req.query.subDomain as string,
      localId: req.query.localId as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      groupBy: req.query.groupBy as 'day' | 'week' | 'month'
    }

    const stats = await getOrderStats(statsParams)
    return res.json({ type: "1", message: "Statistics retrieved", data: stats })
  } catch (error) {
    logger.error("Error getting order stats", { error })
    next(error)
  }
}

export const getByCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { customerPhone } = req.params
    const { subDomain } = req.query
    
    if (!customerPhone) {
      return res.status(400).json({ type: "701", message: "Customer phone is required", data: null })
    }
    
    const orders = await getOrdersByCustomer(customerPhone, subDomain as string)
    return res.json({ type: "1", message: "Customer orders retrieved", data: orders })
  } catch (error) {
    logger.error("Error getting orders by customer", { error })
    next(error)
  }
}

export const getByStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.params
    const { subDomain } = req.query
    
    if (!status) {
      return res.status(400).json({ type: "701", message: "Status is required", data: null })
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'dispatched', 'delivered', 'cancelled', 'rejected']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        type: "701", 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 
        data: null 
      })
    }
    
    const orders = await getOrdersByStatus(status as any, subDomain as string)
    return res.json({ type: "1", message: "Orders by status retrieved", data: orders })
  } catch (error) {
    logger.error("Error getting orders by status", { error })
    next(error)
  }
}

export const getArchivedOrdersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params;
    const { page, limit, dateFrom, dateTo } = req.query;

    const result = await getArchivedOrders({
      subDomain,
      localId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string
    });

    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error("Error getting archived orders", { error, params: req.params });
    next(error);
  }
}
