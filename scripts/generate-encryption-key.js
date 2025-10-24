const crypto = require('crypto');

/**
 * Generate a secure encryption key for Facebook tokens
 * Run this script to generate your ENCRYPTION_KEY
 */
function generateEncryptionKey() {
  const key = crypto.randomBytes(32).toString('hex');
  console.log('🔐 Generated Encryption Key:');
  console.log('ENCRYPTION_KEY=' + key);
  console.log('');
  console.log('⚠️  IMPORTANT SECURITY NOTES:');
  console.log('1. Add this key to your .env file');
  console.log('2. Keep this key secure and never commit it to version control');
  console.log('3. Use different keys for development, staging, and production');
  console.log('4. Store production keys in a secure key management service');
  console.log('');
  console.log('🔒 This key will be used to encrypt Facebook tokens in your database');
}

generateEncryptionKey();
