import { Business } from "@/models/Business"
import { NextFunction, Request, Response } from "express"

async function authorizeBusinessAccess(req: Request, res: Response, next: NextFunction) {
    const businessId = req.params.businessId
    const userId = (req as any).user?.id // from authenticate middleware
    
    // Verify user owns or has access to this business
    const business = await Business.findOne({ _id: businessId, owner: userId })
    if (!business) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    
    next()
  }

export default authorizeBusinessAccess
  