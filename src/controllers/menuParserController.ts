import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import minioService from "../services/minioService"

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
    
    // Upload file to MinIO
    const folder = `parser-images/${subDomain}/${localId}`
    const uploadResult = await minioService.uploadFile(req.file, folder)
    
    // TODO: Implement actual menu parser image processing logic
    // This would typically process the image to extract menu information
    
    res.json({
      type: "1",
      message: "Menu parser image uploaded successfully",
      data: {
        subDomain,
        localId,
        filename: uploadResult.key,
        originalName: req.file.originalname,
        size: uploadResult.size,
        mimetype: req.file.mimetype,
        url: uploadResult.url,
        uploadedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error("Error uploading menu parser image:", error)
    next(error)
  }
}
