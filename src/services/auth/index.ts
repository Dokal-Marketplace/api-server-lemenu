
interface SignupInput {
       email: string;
       password:  string;
       firstName:  string;
       lastName:  string;
       restaurantName:  string;
       phoneNumber: string;
}


interface LoginInput {
   email: string;
   password:  string;
}

import User from '../../models/User'
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
    try {
      user = await User.create({
        email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
        restaurantName: input.restaurantName ?? null,
        phoneNumber: input.phoneNumber ?? null,
      })
    } catch (e: any) {
      if (e && e.code === 11000) {
        const dupErr: any = new Error('Email already registered')
        dupErr.status = 409
        throw dupErr
      }
      throw e
    }

    const token = generateToken(user.id)
    const safeUser = user.toObject()
    delete (safeUser as any).password

    return { token, user: safeUser }
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
}