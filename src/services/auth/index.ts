interface SignupInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  restaurantName: string;
  phoneNumber: string;
  // Optional fields for local creation
  address?: string;
  department?: string;
  province?: string;
  district?: string;
  description?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

import User from '../../models/User'
import { Integration } from '../../models/Integration'
import { Staff } from '../../models/Staff'
import { Business } from '../../models/Business'
import { generateToken } from '../../utils/jwt'

export class AuthService {
  static async signup(input: SignupInput) {
    const email = input.email.toLowerCase().trim()
    const existing = await User.findOne({ email })
    if (existing) {
      const error: any = new Error('Email already registered')
      error.status = 409
      throw error
    }
  
    let user
    let business
  
    try {
      // Create user
      user = await User.create({
        email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        role: "admin",
        restaurantName: input.restaurantName ?? null,
        phoneNumber: input.phoneNumber ?? null,
      })
  
      // Generate subdomain for the business
      const restaurantName = input.restaurantName || `${input.firstName}-${input.lastName}`.toLowerCase()
      const subdomain = AuthService.generateSubdomain(restaurantName)
      
      // Create business record
      business = await Business.create({
        // Required fields from your schema
        subDomain: subdomain, // You have both fields in schema
        domainLink: `${subdomain}.yourdomain.com`, // Replace with your actual domain
        localId: `LOC${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        commercialName: input.restaurantName || restaurantName,
        name: input.restaurantName || restaurantName,
        userId: user._id.toString(),
        
        // Required contact fields (use user phone as default)
        phone: input.phoneNumber || "+51999999999",
        whatsapp: input.phoneNumber || "+51999999999",
        phoneCountryCode: "+51",
        whatsappCountryCode: "+51",
        
        // Required owner object
        owner: {
          userId: user._id.toString(),
          name: `${input.firstName} ${input.lastName}`,
          email: email
        },
        
        // Optional location fields (your frontend may send these)
        department: input.department || undefined,
        province: input.province || undefined,
        district: input.district || undefined,
        description: input.description || undefined,
        
        // Default values
        acceptsDelivery: true,
        acceptsPickup: true,
        acceptsOnlinePayment: true,
        soloPagoEnLinea: false,
        isOpenForDelivery: true,
        isOpenForPickup: true,
        isActive: true,
        status: 'active',
        
        // Initialize address object (required fields)
        address: {
          street: input.address || "Not specified",
          city: input.district || "Not specified",
          state: input.province || "Not specified",
          zipCode: "",
          country: "Peru"
        }
      })
  
    } catch (e: any) {
      // Clean up user if business creation fails
      if (user) {
        try {
          await User.findByIdAndDelete(user._id)
        } catch (cleanupError) {
          console.error('Failed to cleanup user after business creation error:', cleanupError)
        }
      }
      
      if (e && e.code === 11000) {
        const dupErr: any = new Error('Email already registered')
        dupErr.status = 409
        throw dupErr
      }
      throw e
    }
  
    try {
      const token = generateToken(user.id)
      const safeUser = user.toObject()
      delete (safeUser as any).password
  
      return { 
        token, 
        user: safeUser, 
        business: business
      }
    } catch (error) {
      // Clean up: if token generation fails, remove created records
      if (user) {
        try {
          await User.findByIdAndDelete(user._id)
          if (business) {
            await Business.findByIdAndDelete(business._id)
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup after signup error:', cleanupError)
        }
      }
      throw error
    }
  }
  
  // Make this method public so it can be called from signup
  public static generateSubdomain(restaurantName: string | null | undefined): string {
    // Handle null/undefined by using a default
    const name = restaurantName || 'restaurant'
    let subdomain = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    
    // Ensure subdomain is not empty
    if (!subdomain) {
      subdomain = 'restaurant'
    }
    
    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    subdomain = `${subdomain}-${randomSuffix}`
    
    return subdomain
  }

  static async login(input: LoginInput) {
    const email = input.email.toLowerCase().trim()
    const user = await User.findOne({ email })
    if (!user) {
      const error: any = new Error('Invalid credentials')
      error.status = 401
      throw error
    }

    const isMatch = await (user as any).comparePassword(input.password)
    if (!isMatch) {
      const error: any = new Error('Invalid credentials')
      error.status = 401
      throw error
    }

    const token = generateToken(user.id)
    const safeUser = user.toObject()
    delete (safeUser as any).password

    return { token, user: safeUser }
  }

  static async getUserProfile(userId: string) {
    const user = await User.findById(userId).select('-password')
    if (!user) {
      const error: any = new Error('User not found')
      error.status = 404
      throw error
    }

    return user
  }

  static async getUserBusinesses(userId: string) {
    // Get businesses where user is the owner
    const ownedBusinesses = await Business.find({ userId }).select('-password')
    
    // Get businesses where user is staff
    const staffRelations = await Staff.find({ user: userId, isActive: true })
      .populate('assignedLocals.localId')
      .select('-password')
    
    // Get businesses where user has integration access
    const integrations = await Integration.find({ userId, isActive: true })
      .populate('businessId')
      .select('-password')

    return {
      ownedBusinesses,
      staffRelations,
      integrations
    }
  }

  static async createUserBusinessRelationship(data: {
    userId: string
    businessId: string
    subDomain: string
    name: string
    role: string
    permissions?: string[]
  }) {
    const { userId, businessId, subDomain, name, role, permissions = [] } = data

    // Check if relationship already exists
    const existingIntegration = await Integration.findOne({ 
      userId, 
      businessId,
      isActive: true 
    })
    
    if (existingIntegration) {
      const error: any = new Error('User-business relationship already exists')
      error.status = 409
      throw error
    }

    // Create integration record
    const integration = await Integration.create({
      userId,
      businessId,
      subDomain,
      name,
      role,
      permissions,
      isActive: true,
      integrationStatus: 'active'
    })

    return integration
  }
}