# Facebook Token Security Implementation

## 🔐 Security Overview

This document outlines the secure implementation of Facebook token storage and management in the application.

## ⚠️ Security Issues with Plain Text Storage

**NEVER store Facebook tokens as plain text!** This creates serious security vulnerabilities:

- **Database breach**: Tokens are immediately usable by attackers
- **Insider threats**: Database administrators can access tokens
- **Log exposure**: Tokens may appear in application logs
- **Backup exposure**: Database backups contain sensitive tokens
- **Compliance violations**: Violates data protection regulations

## ✅ Secure Implementation

### 1. **Encryption at Rest**
- Facebook tokens are encrypted using **AES-256-GCM** encryption
- Each token is encrypted with a unique initialization vector (IV)
- Authentication tags prevent tampering
- Encryption key is stored separately from the database

### 2. **Key Management**
```bash
# Generate encryption key
node scripts/generate-encryption-key.js

# Add to environment variables
ENCRYPTION_KEY=your_64_character_hex_key
```

### 3. **Automatic Encryption**
- Tokens are automatically encrypted when saved to database
- Pre-save middleware handles encryption transparently
- No manual encryption/decryption needed in application code

### 4. **Secure Decryption**
- Tokens are decrypted only when needed for API calls
- Decryption happens in memory, not stored
- Failed decryption attempts are logged and handled gracefully

## 🛠️ Implementation Details

### Database Schema
```typescript
// User model with encrypted Facebook fields
{
  facebookId: String,           // Facebook user ID (not encrypted)
  facebookAccessToken: String,  // ENCRYPTED access token
  facebookTokenExpiresAt: Date, // Token expiration
  facebookRefreshToken: String  // ENCRYPTED refresh token
}
```

### Encryption Process
1. **Token received** from Facebook OAuth
2. **Automatic encryption** via pre-save middleware
3. **Encrypted storage** in database
4. **Decryption on demand** for API calls
5. **Memory cleanup** after use

### Security Features
- **AES-256-GCM**: Military-grade encryption
- **Unique IVs**: Each token encrypted differently
- **Authentication tags**: Prevent tampering
- **Key derivation**: PBKDF2 with 100,000 iterations
- **Secure key storage**: Environment variables only

## 🚀 Usage Examples

### Storing Tokens (Automatic)
```typescript
// Tokens are automatically encrypted when saving
user.facebookAccessToken = "facebook_token_here"
await user.save() // Automatically encrypted
```

### Using Tokens (Automatic)
```typescript
// Tokens are automatically decrypted when needed
const token = await FacebookApiService.getValidAccessToken(userId)
// Token is decrypted in memory, never stored in plain text
```

### API Calls (Secure)
```typescript
// Make Facebook API calls with encrypted tokens
const profile = await FacebookApiService.getUserProfile(userId)
const pages = await FacebookApiService.getUserPages(userId)
```

## 🔧 Migration for Existing Data

If you have existing plain text tokens:

```bash
# 1. Generate encryption key
node scripts/generate-encryption-key.js

# 2. Add key to .env file
ENCRYPTION_KEY=your_generated_key

# 3. Run migration script
node scripts/encrypt-existing-tokens.js
```

## 🛡️ Security Best Practices

### 1. **Environment Variables**
```bash
# Production
ENCRYPTION_KEY=your_production_key_here

# Development
ENCRYPTION_KEY=your_development_key_here

# Staging
ENCRYPTION_KEY=your_staging_key_here
```

### 2. **Key Rotation**
- Rotate encryption keys periodically
- Use different keys for different environments
- Store keys in secure key management services

### 3. **Access Control**
- Limit database access to authorized personnel only
- Use database encryption at rest
- Implement proper backup encryption

### 4. **Monitoring**
- Log encryption/decryption failures
- Monitor for unusual token usage patterns
- Set up alerts for security events

## 🔍 Security Verification

### Check Token Encryption
```typescript
// Encrypted tokens are much longer than plain text
const user = await User.findById(userId)
console.log(user.facebookAccessToken.length) // Should be > 100 characters
```

### Verify Decryption
```typescript
// Test decryption works
const decryptedToken = user.getDecryptedFacebookAccessToken()
console.log(decryptedToken) // Should show actual Facebook token
```

## 🚨 Security Warnings

### ❌ NEVER DO THIS
```typescript
// DON'T: Store tokens in plain text
user.facebookAccessToken = "plain_text_token"

// DON'T: Log tokens
console.log("Token:", user.facebookAccessToken)

// DON'T: Return tokens in API responses
res.json({ token: user.facebookAccessToken })
```

### ✅ ALWAYS DO THIS
```typescript
// DO: Let the system handle encryption automatically
user.facebookAccessToken = token
await user.save()

// DO: Use the service methods
const token = await FacebookApiService.getValidAccessToken(userId)

// DO: Log security events
logger.info("Facebook token refreshed for user", { userId })
```

## 📋 Security Checklist

- [ ] Encryption key generated and stored securely
- [ ] Environment variables configured
- [ ] Existing tokens migrated to encrypted format
- [ ] Database access properly restricted
- [ ] Backup encryption enabled
- [ ] Security monitoring in place
- [ ] Team trained on secure practices
- [ ] Regular security audits scheduled

## 🔐 Compliance

This implementation helps meet:
- **GDPR**: Personal data protection
- **CCPA**: Consumer privacy rights
- **SOC 2**: Security controls
- **ISO 27001**: Information security management

## 📞 Support

For security questions or issues:
1. Check the logs for encryption errors
2. Verify environment variables are set
3. Test with a new Facebook OAuth flow
4. Contact security team for assistance

---

**Remember: Security is not optional. Always encrypt sensitive data!**
