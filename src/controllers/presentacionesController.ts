import { Request, Response, NextFunction } from "express"
import {
  listPresentations,
  getPresentationsByProduct,
  createPresentation,
  updatePresentationById,
  deletePresentationById,
  getPresentationsLikeProduct
} from "../services/productService"

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
      const { subDomain, localId } = req.params
      const { productId } = req.query

      if (!productId) {
        return res.status(400).json({ 
          success: false, 
          error: "productId query parameter is required" 
        })
      }

      const result = await createPresentation({
        subDomain,
        localId,
        productId: productId as string,
        payload: req.body
      })

      if (result.error) {
        return res.status(400).json({ 
          success: false, 
          error: result.error 
        })
      }

      res.status(201).json({ success: true, data: result.presentation })
    } catch (error) {
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
  
  