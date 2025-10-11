import mongoose from 'mongoose';
import { migrateDeliveryZoneIndexes, rollbackDeliveryZoneIndexes } from './deliveryZoneIndexMigration';
import config from '../config';

/**
 * Migration runner script
 * Usage: 
 *   npm run migrate:delivery-zones
 *   npm run migrate:rollback:delivery-zones
 */

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Check command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
      case 'migrate':
        await migrateDeliveryZoneIndexes();
        break;
      case 'rollback':
        await rollbackDeliveryZoneIndexes();
        break;
      default:
        console.log('Usage:');
        console.log('  npm run migrate:delivery-zones     - Run migration');
        console.log('  npm run migrate:rollback:delivery-zones - Rollback migration');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

export default runMigration;
