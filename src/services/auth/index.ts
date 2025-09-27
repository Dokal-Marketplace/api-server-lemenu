interface SignupInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  restaurantName: string;
  phoneNumber: string;
}

interface LoginInput {
  email: string;
  password: string;
}

import User from '../../models/User'
import { Integration } from '../../models/Integration'
import { Staff } from '../../models/Staff'
import { Business } from '../../models/Business'
import { Local } from '../../models/Local' // Import the Local model
import { generateToken } from '../../utils/jwt'
import mongoose from 'mongoose'

export class AuthService {
  static async signup(input: SignupInput) {
    const session = await mongoose.startSession()
    session.startTransaction()
    
    try {
      const email = input.email.toLowerCase().trim()
      const existing = await User.findOne({ email }).session(session)
      if (existing) {
        const error: any = new Error('Email already registered')
        error.status = 409
        throw error
      }

      // Create user
      let user
      try {
        user = await User.create([{
          email,
          password: input.password,
          firstName: input.firstName,
          lastName: input.lastName,
          role: "admin",
          restaurantName: input.restaurantName ?? null,
          phoneNumber: input.phoneNumber ?? null,
        }], { session })
        user = user[0] // create with session returns array
      } catch (e: any) {
        if (e && e.code === 11000) {
          const dupErr: any = new Error('Email already registered')
          dupErr.status = 409
          throw dupErr
        }
        throw e
      }

      // Generate subdomain from restaurant name
      const subDomain = this.generateSubdomain(input.restaurantName)
      
      // Create default local
      const defaultLocal = await Local.create([{
        name: input.restaurantName,
        subDomain: subDomain,
        subdominio: subDomain, // Keep both fields as per your schema
        localNombreComercial: input.restaurantName,
        localDescripcion: `Welcome to ${input.restaurantName}`,
        localDireccion: '',
        localDepartamento: '',
        localProvincia: '',
        localDistrito: '',
        localTelefono: input.phoneNumber,
        localWpp: input.phoneNumber, // Use same phone for WhatsApp initially
        localAceptaRecojo: true,
        localAceptaPagoEnLinea: true,
        localPorcentajeImpuesto: 18, // Default tax percentage
        estaAbiertoParaDelivery: true,
        estaAbiertoParaRecojo: true,
      }], { session })

      // Create business record if you have Business model
      const business = await Business.create([{
        userId: user._id,
        name: input.restaurantName,
        localId: defaultLocal[0]._id, // Reference to the created local
        isActive: true,
      }], { session })

      await session.commitTransaction()

      const token = generateToken(user.id)
      const safeUser = user.toObject()
      delete (safeUser as any).password

      return { 
        token, 
        user: safeUser, 
        local: defaultLocal[0],
        business: business[0]
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  // Helper method to generate subdomain from restaurant name
  private static generateSubdomain(restaurantName: string): string {
    let subdomain = restaurantName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    
    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    subdomain = `${subdomain}-${randomSuffix}`
    
    return subdomain
  }

  // Check if subdomain is unique (optional validation method)
  private static async isSubdomainUnique(subdomain: string): Promise<boolean> {
    const existing = await Local.findOne({ 
      $or: [
        { subDomain: subdomain },
        { subdominio: subdomain }
      ]
    })
    return !existing
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