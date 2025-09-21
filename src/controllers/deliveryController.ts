import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"

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


export const getDriver = async (
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

export const getCompanies = async (
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


export const updateDriver = async (
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

export const deleteDriver = async (
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



export const getDrivers = async (
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
