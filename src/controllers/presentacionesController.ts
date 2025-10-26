import { Request, Response, NextFunction } from "express"
import {
  listPresentations,
  getPresentationsByProduct,
  createPresentation,
  updatePresentationById,
  deletePresentationById,
  getPresentationsLikeProduct
} from "../services/productService"
import logger from "../utils/logger"

export const getByProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.query

    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        error: "productId query parameter is required" 
      })
    }

    const presentations = await getPresentationsByProduct(productId as string)
    res.json({ success: true, data: presentations })
  } catch (error) {
    next(error)
  }
}


export const getAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { subDomain, localId } = req.params
      const filters = {
        subDomain,
        localId,
        ...req.query
      }

      const result = await listPresentations(filters)
      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }

  export const getAllLikeProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { subDomain, localId } = req.params
      const { productId } = req.query

      if (!productId) {
        return res.status(400).json({ 
          success: false, 
          error: "productId query parameter is required" 
        })
      }

      const result = await getPresentationsLikeProduct(
        productId as string, 
        subDomain, 
        localId
      )

      if (result.error) {
        return res.status(404).json({ 
          success: false, 
          error: result.error 
        })
      }

      res.json({ success: true, data: result.presentations })
    } catch (error) {
      next(error)
    }
  }

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.warn('🎯 [PRESENTATION CREATE] Starting presentation creation');
    logger.warn('📝 [PRESENTATION CREATE] Request params:', { subDomain: req.params.subDomain, localId: req.params.localId });
    logger.warn('📝 [PRESENTATION CREATE] Request query:', req.query);
    logger.warn('📝 [PRESENTATION CREATE] Request body:', JSON.stringify(req.body, null, 2));
    
    const { subDomain, localId } = req.params
    const { productId } = req.query

    if (!productId) {
      logger.warn('❌ [PRESENTATION CREATE] Missing productId query parameter');
      return res.status(400).json({ 
        success: false, 
        error: "productId query parameter is required" 
      })
    }

    logger.warn('🔄 [PRESENTATION CREATE] Calling createPresentation service...');
    const result = await createPresentation({
      subDomain,
      localId,
      productId: productId as string,
      payload: req.body
    })

    logger.log('📊 [PRESENTATION CREATE] Service result:', result);

    if (result.error) {
      logger.log('❌ [PRESENTATION CREATE] Service returned error:', result.error);
      return res.status(400).json({ 
        success: false, 
        error: result.error 
      })
    }

    logger.log('✅ [PRESENTATION CREATE] Presentation created successfully:', result.presentation?._id);
    res.status(201).json({ success: true, data: result.presentation })
  } catch (error) {
    logger.error('💥 [PRESENTATION CREATE] Unexpected error:', error);
    logger.error('💥 [PRESENTATION CREATE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    next(error)
  }
}
  
  export const deleteOne = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { presentationId } = req.params

      const result = await deletePresentationById(presentationId)

      if (result.error) {
        return res.status(404).json({ 
          success: false, 
          error: result.error 
        })
      }

      res.json({ success: true, data: result.deleted })
    } catch (error) {
      next(error)
    }
  }
  
  export const update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { presentationId } = req.params

      const result = await updatePresentationById(presentationId, req.body)

      if (result.error) {
        return res.status(404).json({ 
          success: false, 
          error: result.error 
        })
      }

      res.json({ success: true, data: result.presentation })
    } catch (error) {
      next(error)
    }
  }
  
  