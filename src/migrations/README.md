# Delivery Zone Index Migration

This migration updates the DeliveryZone model indexes from Spanish field names to English field names.

## Overview

The migration performs the following operations:

1. **Drops old indexes** with Spanish field names:
   - `coberturaLocalNombre_1`
   - `coberturaLocalCostoEnvio_1`
   - `coberturaLocalPedidoMinimo_1`
   - `coberturaLocalTiempoEstimado_1`
   - `coberturaLocalId_1`
   - `coberturaLocalEstado_1`
   - `coberturaLocalRuta_2dsphere`
   - `coberturaLocalNombre_text`

2. **Creates new indexes** with English field names:
   - `localId_1`
   - `subDomain_1`
   - `type_1`
   - `status_1`
   - `isActive_1`
   - `deliveryCost_1`
   - `minimumOrder_1`
   - `estimatedTime_1`
   - `coordinates_2dsphere` (geospatial)
   - `zoneName_text` (text search)

3. **Creates compound indexes** for common queries:
   - `subDomain_1_localId_1_isActive_1`
   - `subDomain_1_status_1_isActive_1`
   - `localId_1_type_1_isActive_1`

## Field Name Mapping

| Spanish (Old) | English (New) |
|---------------|---------------|
| `coberturaLocalNombre` | `zoneName` |
| `coberturaLocalCostoEnvio` | `deliveryCost` |
| `coberturaLocalPedidoMinimo` | `minimumOrder` |
| `coberturaLocalTiempoEstimado` | `estimatedTime` |
| `coberturaLocalPermiteEnvioGratis` | `allowsFreeDelivery` |
| `coberturaLocalMinimoParaEnvioGratis` | `minimumForFreeDelivery` |
| `coberturaLocalRuta` | `coordinates` |
| `coberturaLocalId` | `localId` |
| `coberturaLocalEstado` | `status` |

## Running the Migration

### Prerequisites
- Ensure MongoDB is running
- Ensure the application is not running (to avoid conflicts)
- Backup your database before running the migration

### Run Migration
```bash
npm run migrate:delivery-zones
```

### Rollback Migration
```bash
npm run migrate:rollback:delivery-zones
```

## Migration Process

1. **Connect to MongoDB** using the configured connection string
2. **Drop old indexes** - safely handles cases where indexes don't exist
3. **Create new indexes** - creates all required indexes with English field names
4. **Create compound indexes** - optimizes common query patterns
5. **Verify indexes** - lists all current indexes for verification

## Safety Features

- **Non-destructive**: Only affects indexes, not data
- **Idempotent**: Can be run multiple times safely
- **Error handling**: Continues even if some indexes fail
- **Rollback support**: Can revert changes if needed
- **Verification**: Shows current indexes after migration

## Monitoring

The migration script provides detailed logging:
- ✅ Success messages for completed operations
- ⚠️ Warning messages for non-critical issues
- ❌ Error messages for critical failures
- 📋 Final index listing for verification

## Troubleshooting

### Common Issues

1. **Index already exists**: The script handles this gracefully
2. **Index doesn't exist**: The script skips non-existent indexes
3. **Permission errors**: Ensure database user has index management permissions
4. **Connection issues**: Verify MongoDB connection string and network access

### Recovery

If the migration fails:
1. Check the error logs
2. Fix any configuration issues
3. Re-run the migration (it's idempotent)
4. If needed, use the rollback script

## Performance Impact

- **During migration**: Minimal impact, indexes are created in background
- **After migration**: Improved query performance with optimized indexes
- **Storage**: Slight increase due to additional compound indexes

## Next Steps

After successful migration:
1. Update any application code that references old field names
2. Update API documentation
3. Test all delivery zone related functionality
4. Monitor query performance
