import jwt from 'jsonwebtoken'

export const generateToken = (userId: string) => {
  const secret = process.env.JWT_SECRET || 'changeme'
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}

export const verifyToken = (token: string) => {
  const secret = process.env.JWT_SECRET || 'changeme'
  return jwt.verify(token, secret) as { userId: string; iat: number; exp: number }
}