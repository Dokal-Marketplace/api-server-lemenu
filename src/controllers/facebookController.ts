import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import { FacebookApiService } from "../utils/facebookApi"

/**
 * Get user's Facebook profile using stored token
 */
export const getFacebookProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user._id
    
    if (!userId) {
      res.status(401).json({ 
        type: "701", 
        message: "User authentication required", 
        data: null 
      })
      return
    }

    logger.info(`Getting Facebook profile for user ${userId}`)
    const profile = await FacebookApiService.getUserProfile(userId)
    
    res.json({ 
      type: "1", 
      message: "Facebook profile retrieved successfully", 
      data: profile 
    })
  } catch (error) {
    logger.error(`Error getting Facebook profile: ${error}`)
    next(error)
  }
}

/**
 * Get user's Facebook pages
 */
export const getFacebookPages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user._id
    
    if (!userId) {
      res.status(401).json({ 
        type: "701", 
        message: "User authentication required", 
        data: null 
      })
      return
    }

    logger.info(`Getting Facebook pages for user ${userId}`)
    const pages = await FacebookApiService.getUserPages(userId)
    
    res.json({ 
      type: "1", 
      message: "Facebook pages retrieved successfully", 
      data: pages 
    })
  } catch (error) {
    logger.error(`Error getting Facebook pages: ${error}`)
    next(error)
  }
}

/**
 * Post to a Facebook page
 */
export const postToFacebookPage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user._id
    const { pageId, message } = req.body
    
    if (!userId) {
      res.status(401).json({ 
        type: "701", 
        message: "User authentication required", 
        data: null 
      })
      return
    }

    if (!pageId || !message) {
      res.status(400).json({ 
        type: "701", 
        message: "Page ID and message are required", 
        data: null 
      })
      return
    }

    logger.info(`Posting to Facebook page ${pageId} for user ${userId}`)
    const result = await FacebookApiService.postToPage(userId, pageId, message)
    
    res.json({ 
      type: "1", 
      message: "Post created successfully", 
      data: result 
    })
  } catch (error) {
    logger.error(`Error posting to Facebook page: ${error}`)
    next(error)
  }
}
