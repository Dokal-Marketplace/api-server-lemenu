import { NextFunction, Request, Response } from 'express'
import User from '../models/User'
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