import mongoose from 'mongoose';
import { DeliveryZone } from '../models/DeliveryZone';

/**
 * Migration script to update DeliveryZone indexes
 * This script drops old indexes with Spanish field names and creates new ones with English field names
 */
export async function migrateDeliveryZoneIndexes() {
  try {
    console.log('Starting DeliveryZone index migration...');
    
    const collection = DeliveryZone.collection;
    
    // List of old indexes to drop (Spanish field names)
    const oldIndexesToDrop = [
      'coberturaLocalNombre_1',
      'coberturaLocalCostoEnvio_1', 
      'coberturaLocalPedidoMinimo_1',
      'coberturaLocalTiempoEstimado_1',
      'coberturaLocalId_1',
      'coberturaLocalEstado_1',
      'coberturaLocalRuta_2dsphere',
      'coberturaLocalNombre_text'
    ];
    
    // Drop old indexes
    console.log('Dropping old indexes...');
    for (const indexName of oldIndexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`✓ Dropped index: ${indexName}`);
      } catch (error: any) {
        if (error.code === 27) {
          console.log(`- Index ${indexName} does not exist, skipping...`);
        } else {
          console.warn(`⚠ Warning dropping index ${indexName}:`, error.message);
        }
      }
    }
    
    // Create new indexes with English field names
    console.log('Creating new indexes...');
    
    // Single field indexes
    const singleFieldIndexes = [
      { localId: 1 },
      { subDomain: 1 },
      { type: 1 },
      { status: 1 },
      { isActive: 1 },
      { deliveryCost: 1 },
      { minimumOrder: 1 },
      { estimatedTime: 1 }
    ];
    
    for (const indexSpec of singleFieldIndexes) {
      try {
        await collection.createIndex(indexSpec);
        const fieldName = Object.keys(indexSpec)[0];
        console.log(`✓ Created index: ${fieldName}_1`);
      } catch (error: any) {
        console.warn(`⚠ Warning creating index for ${Object.keys(indexSpec)[0]}:`, error.message);
      }
    }
    
    // Geospatial index for coordinates
    try {
      await collection.createIndex({ coordinates: '2dsphere' });
      console.log('✓ Created geospatial index: coordinates_2dsphere');
    } catch (error: any) {
      console.warn('⚠ Warning creating geospatial index:', error.message);
    }
    
    // Text search index
    try {
      await collection.createIndex({ zoneName: 'text' });
      console.log('✓ Created text index: zoneName_text');
    } catch (error: any) {
      console.warn('⚠ Warning creating text index:', error.message);
    }
    
    // Compound indexes for common queries
    const compoundIndexes = [
      { subDomain: 1, localId: 1, isActive: 1 },
      { subDomain: 1, status: 1, isActive: 1 },
      { localId: 1, type: 1, isActive: 1 }
    ];
    
    for (const indexSpec of compoundIndexes) {
      try {
        await collection.createIndex(indexSpec);
        const indexName = Object.keys(indexSpec).join('_');
        console.log(`✓ Created compound index: ${indexName}`);
      } catch (error: any) {
        console.warn(`⚠ Warning creating compound index:`, error.message);
      }
    }
    
    console.log('✅ DeliveryZone index migration completed successfully!');
    
    // List current indexes for verification
    console.log('\nCurrent indexes:');
    const indexes = await collection.indexes();
    indexes.forEach((index: any) => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
  } catch (error) {
    console.error('❌ Error during DeliveryZone index migration:', error);
    throw error;
  }
}

/**
 * Rollback function to restore old indexes (if needed)
 */
export async function rollbackDeliveryZoneIndexes() {
  try {
    console.log('Rolling back DeliveryZone indexes...');
    
    const collection = DeliveryZone.collection;
    
    // Drop new indexes
    const newIndexesToDrop = [
      'localId_1',
      'subDomain_1', 
      'type_1',
      'status_1',
      'isActive_1',
      'deliveryCost_1',
      'minimumOrder_1',
      'estimatedTime_1',
      'coordinates_2dsphere',
      'zoneName_text',
      'subDomain_1_localId_1_isActive_1',
      'subDomain_1_status_1_isActive_1',
      'localId_1_type_1_isActive_1'
    ];
    
    for (const indexName of newIndexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`✓ Dropped index: ${indexName}`);
      } catch (error: any) {
        if (error.code === 27) {
          console.log(`- Index ${indexName} does not exist, skipping...`);
        } else {
          console.warn(`⚠ Warning dropping index ${indexName}:`, error.message);
        }
      }
    }
    
    console.log('✅ Rollback completed!');
    
  } catch (error) {
    console.error('❌ Error during rollback:', error);
    throw error;
  }
}

// Export for use in migration scripts
export default {
  migrate: migrateDeliveryZoneIndexes,
  rollback: rollbackDeliveryZoneIndexes
};
