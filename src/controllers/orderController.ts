import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
 
import {
  configureAutoStatusChange,
  getOrderById,
  getOrdersAdminPaginated,
  getOrdersForRestaurant,
  updateOrderStatus
} from "../services/orderService"

export const toggleArchived = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Not specified in API docs; provide a simple noop endpoint
    res.json({ type: "1", message: "Not implemented", data: null })
  } catch (error) {
    logger.error("Error on toggleArchived", { error })
    next(error)
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
