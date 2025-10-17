import { Request, Response } from 'express'
import User from '../models/User'

// Get user credits
export const getUserCredits = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      })
    }

    const user = await User.findById(userId).select('credits creditUsage')
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    res.status(200).json({
      success: true,
      data: {
        credits: user.credits || 0,
        creditUsage: user.creditUsage || 0,
        remainingCredits: (user.credits || 0) - (user.creditUsage || 0)
      }
    })
  } catch (error) {
    console.error('Error getting user credits:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Get user credit usage
export const getUserCreditUsage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      })
    }

    const user = await User.findById(userId).select('creditUsage credits')
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    res.status(200).json({
      success: true,
      data: {
        creditUsage: user.creditUsage || 0,
        totalCredits: user.credits || 0,
        remainingCredits: (user.credits || 0) - (user.creditUsage || 0)
      }
    })
  } catch (error) {
    console.error('Error getting user credit usage:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Update user credits (admin function)
export const updateUserCredits = async (req: Request, res: Response) => {
  try {
    const { userId, credits } = req.body
    const currentUserId = (req as any).user?.id

    if (!currentUserId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      })
    }

    // Check if current user is admin (you might want to add role checking here)
    const currentUser = await User.findById(currentUserId)
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      })
    }

    if (!userId || typeof credits !== 'number') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request data' 
      })
    }

    const user = await User.findByIdAndUpdate(
      userId, 
      { credits }, 
      { new: true }
    ).select('credits creditUsage email firstName lastName')
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          credits: user.credits,
          creditUsage: user.creditUsage
        }
      }
    })
  } catch (error) {
    console.error('Error updating user credits:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    })
  }
}

// Consume credits (internal function)
export const consumeCredits = async (userId: string, amount: number): Promise<boolean> => {
  try {
    const user = await User.findById(userId)
    
    if (!user) {
      return false
    }

    const availableCredits = (user.credits || 0) - (user.creditUsage || 0)
    
    if (availableCredits < amount) {
      return false
    }

    await User.findByIdAndUpdate(
      userId, 
      { $inc: { creditUsage: amount } }
    )

    return true
  } catch (error) {
    console.error('Error consuming credits:', error)
    return false
  }
}
