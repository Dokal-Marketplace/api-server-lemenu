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


export const getModif = async (
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


export const updateModif = async (
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

export const deleteModif = async (
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



export const getModifs = async (
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




export const batchDeleteModif = async (
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



export const createModif = async (
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


export const batchUpdateModif = async (
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


export const batchCreateModif = async (
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
