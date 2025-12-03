# Critical Fixes - Immediate Action Required

## 🔴 Critical Priority (Fix Before Production)

### 1. Server Graceful Shutdown (server.ts)
**Risk:** Data loss, connection leaks, incomplete operations
**Impact:** High - affects all operations

**Fix:**
```typescript
// Add to server.ts after line 110
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  try {
    const { whatsappHealthMonitor } = require('./services/whatsapp/whatsappHealthMonitor');
    whatsappHealthMonitor.stop();
  } catch (error) {
    console.error('Error stopping health monitor:', error);
  }
  
  try {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error closing database:', error);
  }
  
  setTimeout(() => process.exit(1), 10000);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### 2. Health Monitor Concurrency Control (whatsappHealthMonitor.ts)
**Risk:** Multiple simultaneous health checks, resource exhaustion
**Impact:** High - can cause API rate limiting and memory issues

**Fix:**
```typescript
// Add property to class (line 23)
private isChecking: boolean = false;

// Modify checkAllBusinesses method (line 77)
private async checkAllBusinesses(): Promise<void> {
  if (this.isChecking) {
    logger.warn('Health check already in progress, skipping');
    return;
  }
  
  this.isChecking = true;
  try {
    // ... existing code (lines 78-140)
  } finally {
    this.isChecking = false;
  }
}
```

### 3. Template Provisioning in Background (Business.ts)
**Risk:** Slow saves, timeouts, blocking operations
**Impact:** High - affects user experience during WABA linking

**Fix:**
```typescript
// Replace post-save hook (lines 652-703) with:
BusinessSchema.post('save', async function(doc: any) {
  if (doc.wabaId && !doc.templatesProvisioned && doc.whatsappAccessToken) {
    if (!doc.whatsappEnabled) {
      await Business.updateOne({ _id: doc._id }, { $set: { whatsappEnabled: true } });
      doc.whatsappEnabled = true;
    }
    
    try {
      // Use Inngest for background processing
      const { inngest } = await import('../services/inngestService');
      await inngest.send({
        name: 'whatsapp/templates.provision',
        data: {
          subDomain: doc.subDomain,
          businessId: doc._id.toString(),
          language: 'es_PE',
        }
      });
      logger.info(`Queued template provisioning for business ${doc.subDomain}`);
    } catch (error: any) {
      logger.error(`Failed to queue template provisioning for ${doc.subDomain}:`, error);
      // Mark for manual retry
      await Business.updateOne(
        { _id: doc._id },
        { 
          $set: { 
            templateProvisioningError: error.message,
            templateProvisioningFailedAt: new Date()
          }
        }
      );
    }
  }
});
```

---

## 🟡 High Priority (Fix This Week)

### 4. Database Connection Failure Handling (server.ts)
**Risk:** Server starts without database, health monitor fails silently
**Impact:** Medium-High - affects monitoring and startup reliability

**Fix:**
```typescript
// Replace lines 103-110 with:
let dbConnected = false;

connectToDB()
  .then(() => {
    dbConnected = true;
    const { whatsappHealthMonitor } = require('./services/whatsapp/whatsappHealthMonitor');
    whatsappHealthMonitor.start();
    console.log('Database connected and WhatsApp health monitor started');
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    // Retry connection every 5 seconds
    const retryInterval = setInterval(async () => {
      try {
        await connectToDB();
        dbConnected = true;
        clearInterval(retryInterval);
        const { whatsappHealthMonitor } = require('./services/whatsapp/whatsappHealthMonitor');
        whatsappHealthMonitor.stop(); // Stop if already started
        whatsappHealthMonitor.start();
        console.log('Database connected and health monitor started after retry');
      } catch (retryError) {
        console.error('Retry connection failed:', retryError);
      }
    }, 5000);
  });
```

### 5. Health Monitor Cleanup on Stop (whatsappHealthMonitor.ts)
**Risk:** Interval continues running after stop, memory leak
**Impact:** Medium - memory leak over time

**Fix:**
```typescript
// Enhance stop method (line 65)
stop(): void {
  if (this.monitoringInterval) {
    clearInterval(this.monitoringInterval);
    this.monitoringInterval = null;
  }
  this.isChecking = false; // Reset checking flag
  this.isRunning = false;
  logger.info('WhatsApp health monitor stopped');
}
```

### 6. Token Proactive Refresh (metaWhatsAppService.ts)
**Risk:** Token expires during active use, service interruption
**Impact:** Medium - affects message sending reliability

**Fix:**
```typescript
// Modify getValidAccessToken (line 103)
// Replace lines 103-124 with:
if (
  businessDoc.whatsappTokenExpiresAt &&
  new Date() > new Date(businessDoc.whatsappTokenExpiresAt.getTime() - 60 * 60 * 1000) // 1 hour before expiry
) {
  logger.info(
    `WhatsApp token expiring soon for business ${subDomain}, refreshing proactively`
  );
  // ... existing refresh logic
}
```

---

## 🟢 Medium Priority (Fix This Month)

### 7. Input Validation Enhancement (metaWhatsAppController.ts)
**Risk:** Invalid data causes API errors, poor error messages
**Impact:** Low-Medium - affects API reliability

**Add validation helpers:**
```typescript
// Add to top of file
const validatePhoneNumber = (phone: string): boolean => {
  return /^\+[1-9]\d{1,14}$/.test(phone);
};

const validateTemplateName = (name: string): boolean => {
  return /^[a-z0-9_]{1,512}$/i.test(name);
};

// Use in handlers:
if (!validatePhoneNumber(to)) {
  return next(createValidationError('Phone number must be in E.164 format'));
}
```

### 8. Error Response Standardization (metaWhatsAppController.ts)
**Risk:** Inconsistent API responses, harder debugging
**Impact:** Low - affects developer experience

**Add helper function:**
```typescript
const sendErrorResponse = (res: Response, statusCode: number, message: string, data?: any) => {
  res.status(statusCode).json({
    type: statusCode >= 500 ? '3' : '3',
    message,
    data: data || null,
    timestamp: new Date().toISOString(),
  });
};
```

### 9. Circuit Breaker for Health Checks (whatsappHealthMonitor.ts)
**Risk:** Wasted resources checking repeatedly failing businesses
**Impact:** Low - optimization

**Add to class:**
```typescript
private failureCounts: Map<string, number> = new Map();
private readonly MAX_FAILURES = 5;

// In checkAllBusinesses, before checking each business:
const failureCount = this.failureCounts.get(business.subDomain) || 0;
if (failureCount >= this.MAX_FAILURES) {
  logger.warn(`Skipping ${business.subDomain} - ${failureCount} consecutive failures`);
  continue;
}

// After catch block (line 134):
this.failureCounts.set(business.subDomain, failureCount + 1);

// On success (after line 115):
this.failureCounts.delete(business.subDomain);
```

---

## Testing Checklist

Before deploying fixes, test:

- [ ] Server shutdown with active connections
- [ ] Health monitor with 50+ businesses
- [ ] Template provisioning queue (if using Inngest)
- [ ] Database reconnection after failure
- [ ] Token refresh 1 hour before expiry
- [ ] Concurrent health check prevention
- [ ] Invalid input validation
- [ ] Error response format consistency

---

## Implementation Order

1. **Day 1:** Fixes #1, #2, #5 (shutdown, concurrency, cleanup)
2. **Day 2:** Fix #3 (background job) - requires Inngest function creation
3. **Day 3:** Fixes #4, #6 (DB handling, token refresh)
4. **Week 2:** Fixes #7, #8, #9 (validation, errors, circuit breaker)

