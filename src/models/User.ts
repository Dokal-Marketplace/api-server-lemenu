import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { encrypt, decrypt } from '../utils/encryption'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    restaurantName: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    credits: { type: Number, default: 0 },
    creditUsage: { type: Number, default: 0 },
    // Facebook OAuth fields
    facebookId: { type: String, default: null, unique: true, sparse: true },
    facebookAccessToken: { type: String, default: null },
    facebookTokenExpiresAt: { type: Date, default: null },
    facebookRefreshToken: { type: String, default: null },
  },
  { timestamps: true }
)

userSchema.pre('save', async function (this: any, next: (err?: any) => void) {
  try {
    if (!this.isModified('password')) {
      return next()
    }
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(this.get('password'), salt)
    this.set('password', hash)
    next()
  } catch (err) {
    next(err as any)
  }
})

userSchema.methods.comparePassword = async function (this: any, plainPassword: string) {
  return bcrypt.compare(plainPassword, this.get('password'))
}

// Virtual getter for decrypted Facebook access token
userSchema.virtual('decryptedFacebookAccessToken').get(function(this: any) {
  const encryptedToken = this.get('facebookAccessToken')
  if (!encryptedToken) return null
  try {
    return decrypt(encryptedToken)
  } catch (error) {
    return null
  }
})

// Virtual getter for decrypted Facebook refresh token
userSchema.virtual('decryptedFacebookRefreshToken').get(function(this: any) {
  const encryptedToken = this.get('facebookRefreshToken')
  if (!encryptedToken) return null
  try {
    return decrypt(encryptedToken)
  } catch (error) {
    return null
  }
})

// Pre-save middleware to encrypt Facebook tokens
userSchema.pre('save', async function (this: any, next: (err?: any) => void) {
  try {
    // Encrypt Facebook access token if it's modified and not already encrypted
    if (this.isModified('facebookAccessToken') && this.facebookAccessToken) {
      // Check if it's already encrypted (encrypted tokens are much longer)
      if (this.facebookAccessToken.length < 100) {
        this.facebookAccessToken = encrypt(this.facebookAccessToken)
      }
    }
    
    // Encrypt Facebook refresh token if it's modified and not already encrypted
    if (this.isModified('facebookRefreshToken') && this.facebookRefreshToken) {
      // Check if it's already encrypted
      if (this.facebookRefreshToken.length < 100) {
        this.facebookRefreshToken = encrypt(this.facebookRefreshToken)
      }
    }
    
    next()
  } catch (err) {
    next(err as any)
  }
})

// Method to get decrypted Facebook access token
userSchema.methods.getDecryptedFacebookAccessToken = function(this: any): string | null {
  const encryptedToken = this.get('facebookAccessToken')
  if (!encryptedToken) return null
  try {
    return decrypt(encryptedToken)
  } catch (error) {
    return null
  }
}

// Method to get decrypted Facebook refresh token
userSchema.methods.getDecryptedFacebookRefreshToken = function(this: any): string | null {
  const encryptedToken = this.get('facebookRefreshToken')
  if (!encryptedToken) return null
  try {
    return decrypt(encryptedToken)
  } catch (error) {
    return null
  }
}

const User = mongoose.model('User', userSchema)

export default User