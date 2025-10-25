import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import s3Service from "../services/s3Service"
import { inngest } from "../services/inngestService"
import { MenuParserService } from "../services/menuParserService"

// Upload and process menu parser image
export const uploadMenuParser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params

    if (!subDomain || !localId) {
      return res.status(400).json({
        type: "3",
        message: "subDomain and localId are required",
        data: null
      })
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        type: "3",
        message: "No file uploaded",
        data: null
      })
    }

    logger.info(`Uploading menu parser image for subDomain: ${subDomain}, localId: ${localId}`)
    logger.info(`File details: ${req.file.originalname}, size: ${req.file.size} bytes`)
    
    // Upload file to S3
    const folder = `parser-images/${subDomain}/${localId}`
    const uploadResult = await s3Service.uploadFile(req.file, folder)
    
    // Generate unique menu ID
    const menuId = `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Trigger background processing with Inngest
    const { ids } = await inngest.send({
      name: 'menu/process.url',
      data: {
        imageUrl: uploadResult.url,
        menuId,
        userId: (req as any).user?.id || 'anonymous', // Assuming user is attached to request
        restaurantId: `${subDomain}_${localId}`,
        subDomain,
        localId
      }
    })
    
    res.json({
      type: "1",
      message: "Menu parser image uploaded and processing started",
      data: {
        subDomain,
        localId,
        menuId,
        filename: uploadResult.key,
        originalName: req.file.originalname,
        size: uploadResult.size,
        mimetype: req.file.mimetype,
        url: uploadResult.url,
        runId: ids?.[0],
        uploadedAt: new Date().toISOString(),
        status: 'processing'
      }
    })
  } catch (error) {
    logger.error("Error uploading menu parser image:", error)
    next(error)
  }
}

// Process menu from URL
export const processMenuFromUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { imageUrl, menuId, userId, restaurantId, subDomain, localId } = req.body

    if (!imageUrl || !menuId || !userId) {
      return res.status(400).json({
        type: "3",
        message: "Missing required fields: imageUrl, menuId, userId",
        data: null
      })
    }

    const { ids } = await inngest.send({
      name: 'menu/process.url',
      data: { imageUrl, menuId, userId, restaurantId, subDomain, localId }
    })

    res.json({
      type: "1",
      message: "Menu processing started",
      data: {
        menuId,
        runId: ids?.[0],
        status: 'processing'
      }
    })
  } catch (error) {
    logger.error("Error starting menu processing:", error)
    next(error)
  }
}

// Process menu from S3
export const processMenuFromS3 = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { bucket, key, menuId, userId, restaurantId, subDomain, localId } = req.body

    if (!bucket || !key || !menuId || !userId) {
      return res.status(400).json({
        type: "3",
        message: "Missing required fields: bucket, key, menuId, userId",
        data: null
      })
    }

    const { ids } = await inngest.send({
      name: 'menu/process.s3',
      data: { bucket, key, menuId, userId, restaurantId, subDomain, localId }
    })

    res.json({
      type: "1",
      message: "S3 menu processing started",
      data: {
        menuId,
        runId: ids?.[0],
        status: 'processing'
      }
    })
  } catch (error) {
    logger.error("Error starting S3 menu processing:", error)
    next(error)
  }
}

// Batch process multiple menus
export const batchProcessMenus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { menus, batchId, userId } = req.body

    if (!menus || !Array.isArray(menus) || menus.length === 0) {
      return res.status(400).json({
        type: "3",
        message: "Invalid menus array",
        data: null
      })
    }

    const finalBatchId = batchId || `batch_${Date.now()}`

    const { ids } = await inngest.send({
      name: 'menu/batch.process',
      data: { menus, batchId: finalBatchId, userId }
    })

    res.json({
      type: "1",
      message: "Batch processing started",
      data: {
        batchId: finalBatchId,
        count: menus.length,
        runId: ids?.[0],
        status: 'processing'
      }
    })
  } catch (error) {
    logger.error("Error starting batch processing:", error)
    next(error)
  }
}

// Retry failed menu processing
export const retryFailedMenu = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { menuId, originalError } = req.body

    if (!menuId) {
      return res.status(400).json({
        type: "3",
        message: "Menu ID is required",
        data: null
      })
    }

    await inngest.send({
      name: 'menu/retry',
      data: { menuId, originalError, ...req.body }
    })

    res.json({
      type: "1",
      message: "Retry triggered",
      data: {
        menuId,
        status: 'retrying'
      }
    })
  } catch (error) {
    logger.error("Error triggering retry:", error)
    next(error)
  }
}

// Direct menu parsing (synchronous) - for testing or immediate results
export const parseMenuDirect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.params

    if (!subDomain || !localId) {
      return res.status(400).json({
        type: "3",
        message: "subDomain and localId are required",
        data: null
      })
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        type: "3",
        message: "No file uploaded",
        data: null
      })
    }

    logger.info(`Direct parsing menu for subDomain: ${subDomain}, localId: ${localId}`)
    
    // Process image directly
    const menuParserService = new MenuParserService()
    const parsedMenu = await menuParserService.parseMenuFromImage(req.file.buffer)
    
    res.json({
      type: "1",
      message: "Menu parsed successfully",
      data: {
        subDomain,
        localId,
        restaurantName: parsedMenu.restaurantName,
        sections: parsedMenu.sections,
        metadata: parsedMenu.metadata,
        parsedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error("Error parsing menu directly:", error)
    next(error)
  }
}
