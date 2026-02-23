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

  // If key is hex string (64 chars = 32 bytes), use directly — no derivation needed
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, 'hex')
  }

  // Otherwise, derive key from passphrase using PBKDF2.
  // The salt MUST be set via ENCRYPTION_KEY_SALT to prevent trivial key
  // reproduction by anyone who can read the source code.
  const salt = process.env.ENCRYPTION_KEY_SALT
  if (!salt) {
    logger.error('ENCRYPTION_KEY_SALT environment variable is not set')
    throw new Error(
      'ENCRYPTION_KEY_SALT is required when ENCRYPTION_KEY is not a 64-char hex string. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }

  return crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha512')
}

/**
 * Detect if a string is base64 or hex encoded
 */
function detectEncoding(str: string): 'hex' | 'base64' | 'unknown' {
  // Check for base64 characters (includes +, /, =, and URL-safe variants -, _)
  if (/^[A-Za-z0-9+/=_-]+$/.test(str) && (str.includes('+') || str.includes('/') || str.includes('-') || str.includes('_') || str.includes('='))) {
    return 'base64';
  }

  // Check for hex (only 0-9, a-f, A-F)
  if (/^[0-9a-fA-F]+$/.test(str)) {
    return 'hex';
  }

  return 'unknown';
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

    // Combine IV + tag + encrypted data (all in hex)
    const combined = iv.toString('hex') + tag.toString('hex') + encrypted

    return combined
  } catch (error) {
    logger.error(`Encryption error: ${error}`)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt sensitive data
 * Handles both hex and base64 encoded encrypted strings
 */
export function decrypt(encryptedText: string): string {
  try {
    if (!encryptedText) return ''

    const key = getEncryptionKey()

    // Detect encoding format
    const encoding = detectEncoding(encryptedText)

    // Convert to hex if needed
    let hexEncrypted = encryptedText;
    if (encoding === 'base64') {
      logger.debug('Detected base64 encoded token, converting to hex for decryption');
      try {
        // Convert base64 to buffer, then to hex
        const buffer = Buffer.from(encryptedText, 'base64');
        hexEncrypted = buffer.toString('hex');
      } catch (conversionError) {
        logger.error(`Failed to convert base64 to hex: ${conversionError}`);
        throw new Error('Invalid base64 format');
      }
    } else if (encoding === 'unknown') {
      logger.error(`Encrypted text has unknown encoding format. First 50 chars: ${encryptedText.substring(0, 50)}...`);
      throw new Error('Invalid encrypted data format: unknown encoding (not hex or base64)');
    }

    // Validate minimum length (IV + TAG = 64 hex chars minimum)
    const minLength = (IV_LENGTH + TAG_LENGTH) * 2 // 64 hex characters
    if (hexEncrypted.length < minLength) {
      logger.error(`Decryption error: Encrypted text too short. Expected at least ${minLength} chars, got ${hexEncrypted.length}`);
      throw new Error(`Invalid encrypted data format: too short (${hexEncrypted.length} chars, minimum ${minLength})`);
    }

    // Extract IV, tag, and encrypted data
    const ivHex = hexEncrypted.slice(0, IV_LENGTH * 2);
    const tagHex = hexEncrypted.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2);
    const encrypted = hexEncrypted.slice((IV_LENGTH + TAG_LENGTH) * 2);

    // Final validation that IV and TAG are hex (should always pass after conversion)
    if (!/^[0-9a-fA-F]+$/.test(ivHex)) {
      logger.error(`Decryption error: IV part is not valid hex after conversion. IV: ${ivHex.substring(0, 20)}...`);
      throw new Error(`Invalid encrypted data format: IV is not hex-encoded`);
    }

    if (!/^[0-9a-fA-F]+$/.test(tagHex)) {
      logger.error(`Decryption error: TAG part is not valid hex after conversion. TAG: ${tagHex.substring(0, 20)}...`);
      throw new Error(`Invalid encrypted data format: TAG is not hex-encoded`);
    }

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    // Validate IV and TAG buffer lengths
    if (iv.length !== IV_LENGTH) {
      logger.error(`Decryption error: Invalid IV length. Expected ${IV_LENGTH} bytes, got ${iv.length}`);
      throw new Error(`Invalid IV length: expected ${IV_LENGTH} bytes, got ${iv.length}`);
    }

    if (tag.length !== TAG_LENGTH) {
      logger.error(`Decryption error: Invalid TAG length. Expected ${TAG_LENGTH} bytes, got ${tag.length}`);
      throw new Error(`Invalid TAG length: expected ${TAG_LENGTH} bytes, got ${tag.length}`);
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('facebook-token', 'utf8'));
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Decryption error: ${errorMessage}`, {
      encryptedTextLength: encryptedText?.length || 0,
      encryptedTextPreview: encryptedText?.substring(0, 50) + '...',
      detectedEncoding: detectEncoding(encryptedText || ''),
      errorName: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`Failed to decrypt data: ${errorMessage}`);
  }
}

/**
 * Generate a secure encryption key (for initial setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}