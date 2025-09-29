import { NextFunction, Request, Response } from 'express'
import User from '../models/User'
import { Staff } from '../models/Staff'
import { verifyToken } from '../utils/jwt'

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      res.status(401).json({ error: 'Access denied. No token provided.' })
      return
    }

    const decoded = verifyToken(token)
    const user = await User.findById(decoded.userId).select('-password')

    if (!user) {
      res.status(401).json({ error: 'Invalid token.' })
      return
    }

    ;(req as any).user = user
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' })
  }
}

export default authenticate

export const requireRole = (requiredRole: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authUser = (req as any).user
      if (!authUser) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      // Look up Staff by linked user to determine role
      const staff = await Staff.findOne({ user: authUser._id, isActive: true }).select('role subDomain')

      // Allow if explicitly flagged on user (future-proof)
      const userRole = (authUser as any).role || undefined

      const hasRole =
        (staff && (staff.role === requiredRole || staff.role === 'superadmin')) ||
        (userRole && (userRole === requiredRole || userRole === 'superadmin'))

      if (!hasRole) {
        res.status(403).json({ error: 'Forbidden: insufficient permissions' })
        return
      }

      next()
    } catch (_err) {
      res.status(403).json({ error: 'Forbidden' })
    }
  }
}