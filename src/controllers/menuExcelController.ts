import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import s3Service from "../services/s3Service"

export const uploadMenu = async (
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

    logger.info(`Uploading Excel menu for subDomain: ${subDomain}, localId: ${localId}`)
    logger.info(`File details: ${req.file.originalname}, size: ${req.file.size} bytes`)
    
    // Upload file to S3
    const folder = `excel-menus/${subDomain}/${localId}`
    const uploadResult = await s3Service.uploadFile(req.file, folder)
    
    // TODO: Implement actual Excel file processing logic
    // This would typically parse the Excel file and import menu data
    
    res.json({
      type: "1",
      message: "Excel menu uploaded successfully",
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
    logger.error("Error uploading Excel menu:", error)
    next(error)
  }
}
