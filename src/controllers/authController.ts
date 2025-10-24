import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import { AuthService } from "../services/auth"
import { BusinessService } from "../services/business/businessService"
import User from "../models/User"
import { generateToken } from "../utils/jwt"

// Validation helper functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }
  if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number")
  }
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push("Password must contain at least one special character (@$!%*?&)")
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

const validatePhoneNumber = (phoneNumber: string): boolean => {
  if (!phoneNumber) return true // Optional field
  // Basic international phone number validation
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phoneNumber.replace(/\s/g, ''))
}

const validateName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false
  const trimmedName = name.trim()
  return trimmedName.length >= 2 && trimmedName.length <= 50 && /^[a-zA-Z\s\-']+$/.test(trimmedName)
}

const validateRestaurantName = (name: string): boolean => {
  if (!name) return true // Optional field
  if (typeof name !== 'string') return false
  const trimmedName = name.trim()
  return trimmedName.length >= 2 && trimmedName.length <= 100
}

const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return ''
  return input.trim()
}

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body || {}
    
    // Basic validation
    if (!email || !password) {
      res.status(400).json({ 
        type: "701", 
        message: "Email and password are required", 
        data: null 
      })
      return
    }

    // Email format validation
    if (!validateEmail(email)) {
      res.status(400).json({ 
        type: "701", 
        message: "Please provide a valid email address", 
        data: null 
      })
      return
    }

    logger.info(`Auth login attempt for ${email}`)
    const { token, user } = await AuthService.login({ email: email.toLowerCase().trim(), password })
    res.json({ 
      type: "1", 
      message: "Login successful", 
      data: { accessToken: token, user } 
    })
  } catch (error) {
    next(error)
  }
}

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { 
      email, 
      password,
      confirmPassword,
      firstName,
      lastName,
      businessName, 
      phone 
    } = req.body || {}

    // Check for required fields
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ 
        type: "701", 
        message: "Email, password, firstName, and lastName are required", 
        data: null 
      })
      return
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      res.status(400).json({ 
        type: "701", 
        message: "Password and confirm password do not match", 
        data: null 
      })
      return
    }

    // Validate email format
    if (!validateEmail(email)) {
      res.status(400).json({ 
        type: "701", 
        message: "Please provide a valid email address", 
        data: null 
      })
      return
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      res.status(400).json({ 
        type: "701", 
        message: "Password does not meet requirements", 
        data: { 
          errors: passwordValidation.errors 
        }
      })
      return
    }

    // Validate first name
    if (!validateName(firstName)) {
      res.status(400).json({ 
        type: "701", 
        message: "Name must contain valid characters (letters, spaces, hyphens, and apostrophes)", 
        data: null 
      })
      return
    }

    // Validate phone number (optional)
    if (phone && !validatePhoneNumber(phone)) {
      res.status(400).json({ 
        type: "701", 
        message: "Please provide a valid phone number", 
        data: null 
      })
      return
    }

    // Validate business name (optional)
    if (businessName && !validateRestaurantName(businessName)) {
      res.status(400).json({ 
        type: "701", 
        message: "Business name must be 2-100 characters long", 
        data: null 
      })
      return
    }

    // Sanitize inputs
    const sanitizedData: any = {
      email: sanitizeInput(email).toLowerCase(),
      password, // Don't sanitize password as it might change the actual password
      firstName: sanitizeInput(firstName),
      lastName: sanitizeInput(lastName),
    }

    // Only include optional fields if they have values
    if (businessName) {
      sanitizedData.restaurantName = sanitizeInput(businessName)
    }
    if (phone) {
      sanitizedData.phoneNumber = sanitizeInput(phone)
    }

    logger.info(`Auth signup for ${sanitizedData.email}`)
    
    const { token, user } = await AuthService.signup(sanitizedData)
    
    res.status(201).json({ 
      type: "1", 
      message: "Signup successful", 
      data: { accessToken: token, user } 
    })
  } catch (error) {
    next(error)
  }
}

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user._id
    
    if (!userId) {
      res.status(401).json({ 
        type: "701", 
        message: "User authentication required", 
        data: null 
      })
      return
    }

    logger.info(`Getting user profile for ${userId}`)
    const user = await AuthService.getUserProfile(userId)
    res.json({ 
      type: "1", 
      message: "User profile retrieved successfully", 
      data: user 
    })
  } catch (error) {
    next(error)
  }
}

export const getUserBusinesses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params
    
    if (!userId) {
      res.status(400).json({ 
        type: "701", 
        message: "User ID is required", 
        data: null 
      })
      return
    }

    logger.info(`Getting businesses for user ${userId}`)
    const businesses = await BusinessService.getBusinessesByUserId(userId)
    res.json({ 
      type: "1", 
      message: "User businesses retrieved successfully", 
      data: businesses 
    })
  } catch (error) {
    next(error)
  }
}

export const createUserBusinessRelationship = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, businessId, subDomain, name, role, permissions } = req.body
    
    if (!userId || !businessId || !subDomain || !name || !role) {
      res.status(400).json({ 
        type: "701", 
        message: "userId, businessId, subDomain, name, and role are required", 
        data: null 
      })
      return
    }

    // Validate subdomain format
    const subDomainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/
    if (!subDomainRegex.test(subDomain)) {
      res.status(400).json({ 
        type: "701", 
        message: "Subdomain must be 3-63 characters, lowercase letters, numbers, and hyphens only", 
        data: null 
      })
      return
    }

    // Validate name
    if (!validateName(name)) {
      res.status(400).json({ 
        type: "701", 
        message: "Name must be 2-50 characters and contain only letters, spaces, hyphens, and apostrophes", 
        data: null 
      })
      return
    }

    // Validate role (you might want to define allowed roles)
    const allowedRoles = ['admin', 'manager', 'staff', 'owner']
    if (!allowedRoles.includes(role.toLowerCase())) {
      res.status(400).json({ 
        type: "701", 
        message: `Role must be one of: ${allowedRoles.join(', ')}`, 
        data: null 
      })
      return
    }

    logger.info(`Creating user-business relationship for user ${userId} and business ${businessId}`)
    
    const relationship = await AuthService.createUserBusinessRelationship({
      userId: sanitizeInput(userId),
      businessId: sanitizeInput(businessId),
      subDomain: sanitizeInput(subDomain).toLowerCase(),
      name: sanitizeInput(name),
      role: sanitizeInput(role).toLowerCase(),
      permissions
    })
    
    res.status(201).json({ 
      type: "1", 
      message: "User-business relationship created successfully", 
      data: relationship 
    })
  } catch (error) {
    next(error)
  }
}

export const facebookCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Immediate logging to see if this function is called at all
    console.log('=== FACEBOOK CALLBACK HIT ===')
    logger.info('=== FACEBOOK CALLBACK FUNCTION CALLED ===')
    
    // Facebook sends data as query parameters, but we should also check body
    const { code, error, error_description } = req.query
    const bodyData = req.body || {}
    
    // Log all parameters for debugging
    logger.info(`Facebook callback received - Query: ${JSON.stringify(req.query)}`)
    logger.info(`Facebook callback received - Body: ${JSON.stringify(bodyData)}`)
    logger.info(`Facebook callback received - Headers: ${JSON.stringify(req.headers)}`)
    
    // Handle OAuth errors
    if (error) {
      logger.error(`Facebook OAuth error: ${error} - ${error_description}`)
      res.status(400).json({
        type: "701",
        message: `Facebook authentication failed: ${error_description || error}`,
        data: null
      })
      return
    }

    // Check for authorization code
    if (!code) {
      logger.error('Facebook callback missing authorization code')
      res.status(400).json({
        type: "701",
        message: "Missing authorization code from Facebook",
        data: null
      })
      return
    }

    logger.info(`Facebook callback received with code: ${code}`)
    
    // Check for required environment variables
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET || !process.env.FACEBOOK_REDIRECT_URI) {
      logger.error('Missing Facebook OAuth environment variables')
      res.status(500).json({
        type: "701",
        message: "Facebook OAuth not configured properly",
        data: null
      })
      return
    }
    
    // Exchange code for access token using the latest Meta API format
    const tokenResponse = await fetch('https://graph.facebook.com/v22.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        code: code as string
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      logger.error(`Facebook token exchange failed: ${JSON.stringify(errorData)}`)
      res.status(400).json({
        type: "701",
        message: "Failed to exchange code for access token",
        data: null
      })
      return
    }

    const tokenData = await tokenResponse.json()
    const { access_token } = tokenData

    // Get user profile from Facebook
    const profileResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${access_token}`)
    
    if (!profileResponse.ok) {
      logger.error('Failed to fetch Facebook user profile')
      res.status(400).json({
        type: "701",
        message: "Failed to fetch user profile from Facebook",
        data: null
      })
      return
    }

    const profile = await profileResponse.json();
    logger.info(`Facebook user profile: ${JSON.stringify(profile)}`)
    const { id: facebookId, name, email } = profile

    // Calculate token expiration (Facebook tokens typically last 60 days)
    const tokenExpiresAt = new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)) // 60 days from now

    // Check if user exists in database by Facebook ID or email
    let user = await User.findOne({ 
      $or: [
        { facebookId: facebookId },
        { email: email }
      ]
    })
    
    if (!user) {
      // Create new user
      const [firstName, ...lastNameParts] = name.split(' ')
      const lastName = lastNameParts.join(' ') || ''
      
      user = await User.create({
        email,
        password: '', // No password for OAuth users
        firstName,
        lastName,
        role: "admin",
        facebookId: facebookId,
        facebookAccessToken: access_token,
        facebookTokenExpiresAt: tokenExpiresAt,
      })
    } else {
      // Update existing user with new Facebook token
      user.facebookId = facebookId
      user.facebookAccessToken = access_token
      user.facebookTokenExpiresAt = tokenExpiresAt
      await user.save()
    }

    // Generate JWT token
    const token = generateToken(user.id)
    const safeUser = user.toObject()
    delete (safeUser as any).password

    // Return success response
    res.json({
      type: "1",
      message: "Facebook authentication successful",
      data: {
        accessToken: token,
        user: safeUser,
        facebookProfile: {
          id: facebookId,
          name,
          email
        }
      }
    })
  } catch (error) {
    logger.error(`Facebook callback error: ${error}`)
    next(error)
  }
}

export const testCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('=== TEST CALLBACK HIT ===')
    logger.info('=== TEST CALLBACK FUNCTION CALLED ===')
    res.json({
      type: "1",
      message: "Test callback working",
      data: {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        query: req.query
      }
    })
  } catch (error) {
    logger.error(`Test callback error: ${error}`)
    next(error)
  }
}