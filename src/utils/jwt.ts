import jwt from 'jsonwebtoken'

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set. Server cannot start without it.')
  }
  return secret
}

export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: '7d' })
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, getJwtSecret()) as { userId: string; iat: number; exp: number }
}