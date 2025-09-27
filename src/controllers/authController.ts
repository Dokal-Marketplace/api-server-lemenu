import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import { AuthService } from "../services/auth"

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      res.status(400).json({ type: "701", message: "Email and password are required", data: null })
      return
    }
    logger.info(`Auth login attempt for ${email}`)
    const { token, user } = await AuthService.login({ email, password })
    res.json({ type: "1", message: "Login successful", data: { accessToken: token, user } })
  } catch (error) {
    next(error)
  }
}

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, firstName, lastName, restaurantName, phoneNumber } = req.body || {}
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ type: "701", message: "Missing required fields", data: null })
      return
    }
    logger.info(`Auth signup for ${email}`)
    const { token, user } = await AuthService.signup({
      email,
      password,
      firstName,
      lastName,
      restaurantName,
      phoneNumber,
    })
    res.status(201).json({ type: "1", message: "Signup successful", data: { accessToken: token, user } })
  } catch (error) {
    next(error)
  }
}

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user._id
    logger.info(`Getting user profile for ${userId}`)
    const user = await AuthService.getUserProfile(userId)
    res.json({ type: "1", message: "User profile retrieved successfully", data: user })
  } catch (error) {
    next(error)
  }
}

export const getUserBusinesses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params
    logger.info(`Getting businesses for user ${userId}`)
    const businesses = await AuthService.getUserBusinesses(userId)
    res.json({ type: "1", message: "User businesses retrieved successfully", data: businesses })
  } catch (error) {
    next(error)
  }
}

export const createUserBusinessRelationship = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, businessId, subDomain, name, role, permissions } = req.body
    if (!userId || !businessId || !subDomain || !name || !role) {
      res.status(400).json({ type: "701", message: "Missing required fields", data: null })
      return
    }
    logger.info(`Creating user-business relationship for user ${userId} and business ${businessId}`)
    const relationship = await AuthService.createUserBusinessRelationship({
      userId,
      businessId,
      subDomain,
      name,
      role,
      permissions
    })
    res.status(201).json({ type: "1", message: "User-business relationship created successfully", data: relationship })
  } catch (error) {
    next(error)
  }
}


