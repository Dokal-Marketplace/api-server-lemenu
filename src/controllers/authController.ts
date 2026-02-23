import { Request, Response, NextFunction } from "express"
import logger from "../utils/logger"
import { AuthService } from "../services/auth"
import { BusinessService } from "../services/business/businessService"

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

/**
 * Facebook OAuth callback handler
 * TODO: Full OAuth flow (token exchange, user creation) is pending implementation.
 */
export const facebookCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, error, error_description } = req.query

    // Handle OAuth errors from Facebook
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

    logger.info(`Facebook OAuth callback received`)

    // OAuth token exchange and user creation is not yet implemented.
    res.status(501).json({
      type: "701",
      message: "Facebook OAuth token exchange is not yet implemented",
      data: null
    })
  } catch (error) {
    logger.error(`Facebook callback error: ${error}`)
    next(error)
  }
}

/**
 * Facebook webhook verification handler (GET request)
 * Handles webhook verification from Facebook/Workplace
 */
export const facebookWebhookVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': verifyToken } = req.query

    logger.info(`Facebook webhook verification - Mode: ${mode}, Challenge: ${challenge}, Verify Token: ${verifyToken}`)

    // Check if this is a webhook verification request
    if (mode === 'subscribe') {
      // Verify the token matches our configured token
      const expectedToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN

      if (!expectedToken) {
        logger.error('FACEBOOK_WEBHOOK_VERIFY_TOKEN environment variable not set')
        res.status(500).json({
          type: "701",
          message: "Webhook verification token not configured",
          data: null
        })
        return
      }

      if (verifyToken === expectedToken) {
        logger.info('Facebook webhook verification successful')
        // Return the challenge to complete verification
        res.status(200).send(challenge)
        return
      } else {
        logger.error(`Facebook webhook verification failed - Invalid token. Expected: ${expectedToken}, Received: ${verifyToken}`)
        res.status(403).json({
          type: "701",
          message: "Invalid verification token",
          data: null
        })
        return
      }
    }

    // If not a verification request, return error
    logger.error(`Facebook webhook verification failed - Invalid mode: ${mode}`)
    res.status(400).json({
      type: "701",
      message: "Invalid webhook verification request",
      data: null
    })
  } catch (error) {
    logger.error(`Facebook webhook verification error: ${error}`)
    next(error)
  }
}

/**
 * Facebook webhook event handler (POST request)
 * Handles incoming webhook events from Facebook/Workplace
 */
export const facebookWebhookHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logger.info('Facebook webhook event received')
    logger.info(`Headers: ${JSON.stringify(req.headers)}`)
    logger.info(`Body: ${JSON.stringify(req.body)}`)

    // Verify webhook signature for security
    const signature = req.headers['x-hub-signature-256'] as string
    const webhookSecret = process.env.FACEBOOK_WEBHOOK_SECRET

    if (webhookSecret && signature) {
      const isValidSignature = verifyWebhookSignature(req.body, signature, webhookSecret)

      if (!isValidSignature) {
        logger.error('Invalid webhook signature')
        res.status(403).json({
          type: "701",
          message: "Invalid webhook signature",
          data: null
        })
        return
      }
    } else if (webhookSecret && !signature) {
      logger.error('Webhook signature missing')
      res.status(403).json({
        type: "701",
        message: "Webhook signature required",
        data: null
      })
      return
    }

    // Process the webhook event
    const event = req.body

    if (event.object === 'page') {
      // Handle Page webhook events
      await handlePageWebhookEvents(event)
    } else if (event.object === 'group') {
      // Handle Group webhook events
      await handleGroupWebhookEvents(event)
    } else if (event.object === 'user') {
      // Handle User webhook events
      await handleUserWebhookEvents(event)
    } else if (event.object === 'security') {
      // Handle Security webhook events
      await handleSecurityWebhookEvents(event)
    } else {
      logger.info(`Unknown webhook object type: ${event.object}`)
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({
      type: "1",
      message: "Webhook event processed",
      data: null
    })
  } catch (error) {
    logger.error(`Facebook webhook handler error: ${error}`)
    next(error)
  }
}

/**
 * Verify webhook signature using X-Hub-Signature-256
 */
const verifyWebhookSignature = (payload: any, signature: string, secret: string): boolean => {
  try {
    const crypto = require('crypto')
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    logger.error(`Error verifying webhook signature: ${error}`)
    return false
  }
}

/**
 * Handle Page webhook events
 */
const handlePageWebhookEvents = async (event: any) => {
  logger.info('Processing Page webhook events')

  if (event.entry) {
    for (const entry of event.entry) {
      if (entry.changes) {
        for (const change of entry.changes) {
          logger.info(`Page webhook change: ${JSON.stringify(change)}`)

          // Handle different page events
          switch (change.field) {
            case 'mention':
              await handleMentionEvent(change)
              break
            case 'messages':
              await handleMessagesEvent(change)
              break
            case 'message_deliveries':
              await handleMessageDeliveriesEvent(change)
              break
            case 'messaging_postbacks':
              await handleMessagingPostbacksEvent(change)
              break
            case 'message_reads':
              await handleMessageReadsEvent(change)
              break
            default:
              logger.info(`Unhandled page webhook field: ${change.field}`)
          }
        }
      }
    }
  }
}

/**
 * Handle Group webhook events
 */
const handleGroupWebhookEvents = async (event: any) => {
  logger.info('Processing Group webhook events')

  if (event.entry) {
    for (const entry of event.entry) {
      if (entry.changes) {
        for (const change of entry.changes) {
          logger.info(`Group webhook change: ${JSON.stringify(change)}`)

          // Handle different group events
          switch (change.field) {
            case 'posts':
              await handlePostsEvent(change)
              break
            case 'comments':
              await handleCommentsEvent(change)
              break
            case 'membership':
              await handleMembershipEvent(change)
              break
            default:
              logger.info(`Unhandled group webhook field: ${change.field}`)
          }
        }
      }
    }
  }
}

/**
 * Handle User webhook events
 */
const handleUserWebhookEvents = async (event: any) => {
  logger.info('Processing User webhook events')

  if (event.entry) {
    for (const entry of event.entry) {
      if (entry.changes) {
        for (const change of entry.changes) {
          logger.info(`User webhook change: ${JSON.stringify(change)}`)

          // Handle different user events
          switch (change.field) {
            case 'status':
              await handleStatusEvent(change)
              break
            case 'events':
              await handleEventsEvent(change)
              break
            case 'message_sends':
              await handleMessageSendsEvent(change)
              break
            default:
              logger.info(`Unhandled user webhook field: ${change.field}`)
          }
        }
      }
    }
  }
}

/**
 * Handle Security webhook events
 */
const handleSecurityWebhookEvents = async (event: any) => {
  logger.info('Processing Security webhook events')

  if (event.entry) {
    for (const entry of event.entry) {
      if (entry.changes) {
        for (const change of entry.changes) {
          logger.info(`Security webhook change: ${JSON.stringify(change)}`)

          // Handle different security events
          switch (change.field) {
            case 'sessions':
              await handleSessionsEvent(change)
              break
            case 'passwords':
              await handlePasswordsEvent(change)
              break
            case 'admin_activity':
              await handleAdminActivityEvent(change)
              break
            case 'two_factor':
              await handleTwoFactorEvent(change)
              break
            default:
              logger.info(`Unhandled security webhook field: ${change.field}`)
          }
        }
      }
    }
  }
}

// Individual event handlers (implement based on your business logic)
const handleMentionEvent = async (change: any) => {
  logger.info('Handling mention event:', change)
  // Implement mention handling logic
}

const handleMessagesEvent = async (change: any) => {
  logger.info('Handling messages event:', change)
  // Implement message handling logic
}

const handleMessageDeliveriesEvent = async (change: any) => {
  logger.info('Handling message deliveries event:', change)
  // Implement message delivery handling logic
}

const handleMessagingPostbacksEvent = async (change: any) => {
  logger.info('Handling messaging postbacks event:', change)
  // Implement postback handling logic
}

const handleMessageReadsEvent = async (change: any) => {
  logger.info('Handling message reads event:', change)
  // Implement message read handling logic
}

const handlePostsEvent = async (change: any) => {
  logger.info('Handling posts event:', change)
  // Implement posts handling logic
}

const handleCommentsEvent = async (change: any) => {
  logger.info('Handling comments event:', change)
  // Implement comments handling logic
}

const handleMembershipEvent = async (change: any) => {
  logger.info('Handling membership event:', change)
  // Implement membership handling logic
}

const handleStatusEvent = async (change: any) => {
  logger.info('Handling status event:', change)
  // Implement status handling logic
}

const handleEventsEvent = async (change: any) => {
  logger.info('Handling events event:', change)
  // Implement events handling logic
}

const handleMessageSendsEvent = async (change: any) => {
  logger.info('Handling message sends event:', change)
  // Implement message sends handling logic
}

const handleSessionsEvent = async (change: any) => {
  logger.info('Handling sessions event:', change)
  // Implement sessions handling logic
}

const handlePasswordsEvent = async (change: any) => {
  logger.info('Handling passwords event:', change)
  // Implement passwords handling logic
}

const handleAdminActivityEvent = async (change: any) => {
  logger.info('Handling admin activity event:', change)
  // Implement admin activity handling logic
}

const handleTwoFactorEvent = async (change: any) => {
  logger.info('Handling two factor event:', change)
  // Implement two factor handling logic
}
