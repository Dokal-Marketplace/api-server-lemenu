import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"

export const toggleArchived = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.warn("/health endpoint hit")
    res.json({ status: "ok" })
  } catch (error) {
    logger.error("Error with Health Controller")
    next(error)
  }
}


export const autoChangeStatus = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.warn("/health endpoint hit")
    res.json({ status: "ok" })
  } catch (error) {
    logger.error("Error with Health Controller")
    next(error)
  }
}

export const getAll = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.warn("/health endpoint hit")
    res.json({ status: "ok" })
  } catch (error) {
    logger.error("Error with Health Controller")
    next(error)
  }
}

export const getAllAdmin = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.warn("/health endpoint hit")
    res.json({ status: "ok" })
  } catch (error) {
    logger.error("Error with Health Controller")
    next(error)
  }
}


export const getOrder = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.warn("/health endpoint hit")
    res.json({ status: "ok" })
  } catch (error) {
    logger.error("Error with Health Controller")
    next(error)
  }
}

export const changeStatus = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.warn("/health endpoint hit")
    res.json({ status: "ok" })
  } catch (error) {
    logger.error("Error with Health Controller")
    next(error)
  }
}
