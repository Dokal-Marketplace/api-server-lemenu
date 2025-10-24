import crypto from 'crypto'
import logger from './logger'

// Encryption configuration
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const TAG_LENGTH = 16 // 128 bits

/**
 * Get encryption key from environment variable
 * In production, this should be a strong, randomly generated key
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  
  if (!key) {
    logger.error('ENCRYPTION_KEY environment variable is not set')
    throw new Error('Encryption key not configured')
  }
  
  // If key is hex string, convert to buffer
  if (key.length === 64) { // 32 bytes = 64 hex chars
    return Buffer.from(key, 'hex')
  }
  
  // Otherwise, derive key from string using PBKDF2
  return crypto.pbkdf2Sync(key, 'salt', 100000, KEY_LENGTH, 'sha512')
}

/**
 * Encrypt sensitive data (like Facebook tokens)
 */
export function encrypt(text: string): string {
  try {
    if (!text) return ''
    
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    cipher.setAAD(Buffer.from('facebook-token', 'utf8'))
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    // Combine IV + tag + encrypted data
    const combined = iv.toString('hex') + tag.toString('hex') + encrypted
    
    return combined
  } catch (error) {
    logger.error(`Encryption error: ${error}`)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  try {
    if (!encryptedText) return ''
    
    const key = getEncryptionKey()
    
    // Extract IV, tag, and encrypted data
    const iv = Buffer.from(encryptedText.slice(0, IV_LENGTH * 2), 'hex')
    const tag = Buffer.from(encryptedText.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2), 'hex')
    const encrypted = encryptedText.slice((IV_LENGTH + TAG_LENGTH) * 2)
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAAD(Buffer.from('facebook-token', 'utf8'))
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    logger.error(`Decryption error: ${error}`)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Generate a secure encryption key (for initial setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}
