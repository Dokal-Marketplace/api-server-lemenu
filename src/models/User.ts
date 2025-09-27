import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    restaurantName: { type: String, default: null },
    phoneNumber: { type: String, default: null },
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

const User = mongoose.model('User', userSchema)

export default User