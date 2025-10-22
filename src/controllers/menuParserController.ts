import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"

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
    
    // TODO: Implement actual menu parser image processing logic
    // This would typically process the image to extract menu information
    
    res.json({
      type: "1",
      message: "Menu parser image uploaded successfully",
      data: {
        subDomain,
        localId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error("Error uploading menu parser image:", error)
    next(error)
  }
}
