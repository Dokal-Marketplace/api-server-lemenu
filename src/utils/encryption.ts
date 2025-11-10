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
    
    // Validate minimum length (IV + TAG = 64 hex chars minimum)
    const minLength = (IV_LENGTH + TAG_LENGTH) * 2 // 64 hex characters
    if (encryptedText.length < minLength) {
      logger.error(`Decryption error: Encrypted text too short. Expected at least ${minLength} chars, got ${encryptedText.length}`)
      throw new Error(`Invalid encrypted data format: too short (${encryptedText.length} chars, minimum ${minLength})`)
    }
    
    // Validate that the token is hex-encoded (for IV and TAG parts)
    const ivHex = encryptedText.slice(0, IV_LENGTH * 2)
    const tagHex = encryptedText.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2)
    
    if (!/^[0-9a-fA-F]+$/.test(ivHex)) {
      logger.error(`Decryption error: IV part is not valid hex. IV: ${ivHex.substring(0, 20)}...`)
      throw new Error(`Invalid encrypted data format: IV is not hex-encoded`)
    }
    
    if (!/^[0-9a-fA-F]+$/.test(tagHex)) {
      logger.error(`Decryption error: TAG part is not valid hex. TAG: ${tagHex.substring(0, 20)}...`)
      throw new Error(`Invalid encrypted data format: TAG is not hex-encoded`)
    }
    
    // Extract IV, tag, and encrypted data
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const encrypted = encryptedText.slice((IV_LENGTH + TAG_LENGTH) * 2)
    
    // Validate IV and TAG buffer lengths
    if (iv.length !== IV_LENGTH) {
      logger.error(`Decryption error: Invalid IV length. Expected ${IV_LENGTH} bytes, got ${iv.length}`)
      throw new Error(`Invalid IV length: expected ${IV_LENGTH} bytes, got ${iv.length}`)
    }
    
    if (tag.length !== TAG_LENGTH) {
      logger.error(`Decryption error: Invalid TAG length. Expected ${TAG_LENGTH} bytes, got ${tag.length}`)
      throw new Error(`Invalid TAG length: expected ${TAG_LENGTH} bytes, got ${tag.length}`)
    }
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAAD(Buffer.from('facebook-token', 'utf8'))
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`Decryption error: ${errorMessage}`, {
      encryptedTextLength: encryptedText?.length || 0,
      errorName: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(`Failed to decrypt data: ${errorMessage}`)
  }
}

/**
 * Generate a secure encryption key (for initial setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}
