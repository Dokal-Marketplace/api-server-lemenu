
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
    const existing = await User.findOne({ email: input.email })
    if (existing) {
      const error: any = new Error('Email already registered')
      error.status = 409
      throw error
    }

    const user = await User.create({
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      restaurantName: input.restaurantName ?? null,
      phoneNumber: input.phoneNumber ?? null,
    })

    const token = generateToken(user.id)
    const safeUser = user.toObject()
    delete (safeUser as any).password

    return { token, user: safeUser }
  }

  static async login(input: LoginInput) {
    const user = await User.findOne({ email: input.email })
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