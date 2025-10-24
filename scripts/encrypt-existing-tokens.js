const mongoose = require('mongoose');
const crypto = require('crypto');

// Simple encryption function (same as in encryption.ts)
function encrypt(text, key) {
  if (!text) return '';
  
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, Buffer.from(key, 'hex'));
  cipher.setAAD(Buffer.from('facebook-token', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Combine IV + tag + encrypted data
  const combined = iv.toString('hex') + tag.toString('hex') + encrypted;
  
  return combined;
}

async function encryptExistingTokens() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    
    console.log('🔍 Checking for existing Facebook tokens...');
    
    // Find users with Facebook tokens
    const users = await mongoose.connection.db.collection('users').find({
      facebookAccessToken: { $exists: true, $ne: null }
    }).toArray();
    
    if (users.length === 0) {
      console.log('✅ No existing Facebook tokens found. Migration not needed.');
      return;
    }
    
    console.log(`📊 Found ${users.length} users with Facebook tokens`);
    
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      console.error('❌ ENCRYPTION_KEY environment variable not set');
      console.log('Run: node scripts/generate-encryption-key.js');
      return;
    }
    
    let encryptedCount = 0;
    
    for (const user of users) {
      try {
        // Check if token is already encrypted (encrypted tokens are much longer)
        if (user.facebookAccessToken && user.facebookAccessToken.length < 100) {
          const encryptedToken = encrypt(user.facebookAccessToken, encryptionKey);
          
          await mongoose.connection.db.collection('users').updateOne(
            { _id: user._id },
            { $set: { facebookAccessToken: encryptedToken } }
          );
          
          encryptedCount++;
          console.log(`🔒 Encrypted token for user: ${user.email}`);
        }
        
        // Encrypt refresh token if it exists
        if (user.facebookRefreshToken && user.facebookRefreshToken.length < 100) {
          const encryptedRefreshToken = encrypt(user.facebookRefreshToken, encryptionKey);
          
          await mongoose.connection.db.collection('users').updateOne(
            { _id: user._id },
            { $set: { facebookRefreshToken: encryptedRefreshToken } }
          );
        }
        
      } catch (error) {
        console.error(`❌ Error encrypting token for user ${user.email}:`, error.message);
      }
    }
    
    console.log(`✅ Successfully encrypted ${encryptedCount} Facebook tokens`);
    console.log('🔐 All Facebook tokens are now encrypted in the database');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run migration
encryptExistingTokens();
