import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import s3Service from "../services/s3Service"

// GET /api/v1/menu-pic?subDomain={subDomain}&localId={localId}
export const getMenuImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.query

    if (!subDomain || !localId) {
      return res.status(400).json({
        type: "3",
        message: "subDomain and localId are required",
        data: null
      })
    }

    // Get images from S3 for the location
    const folder = `menu-images/${subDomain}/${localId}`
    const images = await s3Service.listFiles(folder)
    
    logger.info(`Found ${images.length} images for subDomain: ${subDomain}, localId: ${localId}`)
    
    res.json({
      type: "1",
      message: "Images retrieved successfully",
      data: {
        subDomain,
        localId,
        images: images.map(image => ({
          key: image,
          url: `${process.env.S3_PUBLIC_URL || `https://${process.env.S3_BUCKET_NAME || 'lemenu-uploads'}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`}/${image}`
        })),
        hasImages: images.length > 0
      }
    })
  } catch (error) {
    logger.error("Error getting menu images:", error)
    next(error)
  }
}

// POST /api/v1/menu-pic?subDomain={subDomain}&localId={localId}
export const uploadMenuImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.query

    if (!subDomain || !localId) {
      return res.status(400).json({
        type: "3",
        message: "subDomain and localId are required",
        data: null
      })
    }

    // Check if files were uploaded
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return res.status(400).json({
        type: "3",
        message: "No files uploaded",
        data: null
      })
    }

    const files = Array.isArray(req.files) ? req.files : req.files.files
    const uploadedFiles = Array.isArray(files) ? files : [files]

    logger.info(`Uploading ${uploadedFiles.length} images for subDomain: ${subDomain}, localId: ${localId}`)
    
    // Upload files to S3
    const folder = `menu-images/${subDomain}/${localId}`
    const uploadResults = await s3Service.uploadMultipleFiles(uploadedFiles, folder)
    
    const uploadedUrls = uploadResults.map((result, index) => ({
      id: `img_${Date.now()}_${index}`,
      url: result.url,
      key: result.key,
      filename: uploadedFiles[index].originalname,
      originalName: uploadedFiles[index].originalname,
      size: result.size,
      mimetype: uploadedFiles[index].mimetype
    }))

    res.json({
      type: "1",
      message: "Images uploaded successfully",
      data: {
        subDomain,
        localId,
        uploadedImages: uploadedUrls,
        totalUploaded: uploadedUrls.length
      }
    })
  } catch (error) {
    logger.error("Error uploading menu images:", error)
    next(error)
  }
}

// POST /api/v1/menu-pic/update-images?subDomain={subDomain}&localId={localId}
export const updateMenuImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId } = req.query

    if (!subDomain || !localId) {
      return res.status(400).json({
        type: "3",
        message: "subDomain and localId are required",
        data: null
      })
    }

    // Check if files were uploaded
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return res.status(400).json({
        type: "3",
        message: "No files uploaded",
        data: null
      })
    }

    const files = Array.isArray(req.files) ? req.files : req.files.files
    const uploadedFiles = Array.isArray(files) ? files : [files]

    logger.info(`Updating images for subDomain: ${subDomain}, localId: ${localId} with ${uploadedFiles.length} files`)
    
    // Upload new files to S3 (replacing existing ones)
    const folder = `menu-images/${subDomain}/${localId}`
    const uploadResults = await s3Service.uploadMultipleFiles(uploadedFiles, folder)
    
    const updatedUrls = uploadResults.map((result, index) => ({
      id: `img_${Date.now()}_${index}`,
      url: result.url,
      key: result.key,
      filename: uploadedFiles[index].originalname,
      originalName: uploadedFiles[index].originalname,
      size: result.size,
      mimetype: uploadedFiles[index].mimetype
    }))

    res.json({
      type: "1",
      message: "Images updated successfully",
      data: {
        subDomain,
        localId,
        updatedImages: updatedUrls,
        totalUpdated: updatedUrls.length
      }
    })
  } catch (error) {
    logger.error("Error updating menu images:", error)
    next(error)
  }
}

// DELETE /api/v1/menu-pic?subDomain={subDomain}&localId={localId}&url={imageUrl}
export const deleteMenuImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subDomain, localId, url } = req.query

    if (!subDomain || !localId || !url) {
      return res.status(400).json({
        type: "3",
        message: "subDomain, localId, and url are required",
        data: null
      })
    }

    logger.info(`Deleting image for subDomain: ${subDomain}, localId: ${localId}, url: ${url}`)
    
    // Extract object key from URL
    const urlString = Array.isArray(url) ? url[0] : url
    const urlParts = typeof urlString === 'string' ? urlString.split('/') : []
    const objectKey = urlParts.slice(-2).join('/') // Get the last two parts (folder/filename)
    
    // Delete file from S3
    const deleted = await s3Service.deleteFile(objectKey)
    
    if (!deleted) {
      return res.status(500).json({
        type: "3",
        message: "Failed to delete image",
        data: null
      })
    }
    
    res.json({
      type: "1",
      message: "Image deleted successfully",
      data: {
        subDomain,
        localId,
        deletedUrl: url,
        deletedKey: objectKey,
        deletedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error("Error deleting menu image:", error)
    next(error)
  }
}
