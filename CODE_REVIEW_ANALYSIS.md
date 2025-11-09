# Code Review Analysis - WhatsApp Integration Areas

## Executive Summary

This document provides a detailed analysis of 5 critical areas requiring attention in the WhatsApp integration codebase. Each section identifies issues, provides recommendations, and suggests code improvements.

---

## 1. whatsappHealthMonitor.ts - Periodic Health Monitoring

### Issues Identified

#### 1.1 Interval Configuration Validation
**Location:** Lines 26-33, 45
**Issue:** No validation for `checkIntervalMinutes` - accepts invalid values (negative, zero, extremely large)
**Risk:** Could cause resource exhaustion or ineffective monitoring

```typescript
// Current code accepts any number
checkIntervalMinutes: config.checkIntervalMinutes || 15,
```

**Recommendation:**
```typescript
constructor(config: MonitoringConfig = {}) {
  const intervalMinutes = config.checkIntervalMinutes || 15;
  if (intervalMinutes < 1 || intervalMinutes > 1440) {
    throw new Error('checkIntervalMinutes must be between 1 and 1440 (24 hours)');
  }
  this.config = {
    checkIntervalMinutes: intervalMinutes,
    // ...
  };
}
```

#### 1.2 Error Handling for Failed Health Checks
**Location:** Lines 92-135
**Issue:** Individual business health check failures are caught but don't prevent other checks from running (good), but there's no circuit breaker or backoff mechanism for repeatedly failing businesses
**Risk:** Wasted resources checking businesses that consistently fail

**Recommendation:** Add circuit breaker pattern:
```typescript
private failureCounts: Map<string, number> = new Map();
private readonly MAX_FAILURES = 5;

// In checkAllBusinesses, before checking:
const failureCount = this.failureCounts.get(business.subDomain) || 0;
if (failureCount >= this.MAX_FAILURES) {
  logger.warn(`Skipping health check for ${business.subDomain} - too many consecutive failures`);
  continue;
}

// After catch block:
this.failureCounts.set(business.subDomain, (this.failureCounts.get(business.subDomain) || 0) + 1);

// On success:
this.failureCounts.delete(business.subDomain);
```

#### 1.3 Memory/Resource Implications
**Location:** Lines 55-59, 77-141
**Issues:**
1. **No cleanup of interval on process exit** - interval continues running even if server shuts down
2. **No concurrency control** - if health check takes longer than interval, multiple checks could run simultaneously
3. **No memory limits** - `results` and `unhealthy` arrays grow unbounded (though cleared each cycle)

**Recommendations:**

1. **Add cleanup on shutdown:**
```typescript
// In server.ts, add graceful shutdown:
process.on('SIGTERM', () => {
  whatsappHealthMonitor.stop();
  // ... other cleanup
});
```

2. **Add concurrency control:**
```typescript
private isChecking: boolean = false;

private async checkAllBusinesses(): Promise<void> {
  if (this.isChecking) {
    logger.warn('Health check already in progress, skipping');
    return;
  }
  
  this.isChecking = true;
  try {
    // ... existing code
  } finally {
    this.isChecking = false;
  }
}
```

3. **Add timeout protection:**
```typescript
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Health check timeout')), 5 * 60 * 1000)
);

await Promise.race([
  this.checkAllBusinesses(),
  timeoutPromise
]);
```

---

## 2. Business.ts - Post-Save Hook Template Provisioning

### Issues Identified

#### 2.1 Idempotency Concerns
**Location:** Lines 652-703
**Issue:** The hook checks `!doc.templatesProvisioned` but doesn't verify if templates were actually created successfully. If provisioning fails partially, `templatesProvisioned` might remain `false`, causing repeated attempts.

**Current Logic:**
```typescript
if (doc.wabaId && !doc.templatesProvisioned && doc.whatsappAccessToken) {
  // Provision templates
  await Business.updateOne(
    { _id: doc._id },
    { $set: { templatesProvisioned: provisionResult.success } }
  );
}
```

**Issues:**
- If `provisionResult.success` is `false`, `templatesProvisioned` is set to `false`, but hook will trigger again on next save
- No check if templates already exist before creating
- No deduplication of template names

**Recommendation:**
```typescript
// Check if templates already exist
const existingTemplates = await MetaWhatsAppService.getTemplates(doc.subDomain);
const existingTemplateNames = new Set(
  existingTemplates?.data?.map((t: any) => t.name) || []
);

// Only provision if truly needed
if (doc.wabaId && !doc.templatesProvisioned && doc.whatsappAccessToken) {
  // Check if this is a new WABA link (not just a save with existing WABA)
  const wasWabaJustSet = this.isModified('wabaId') && this.wabaId;
  
  if (wasWabaJustSet || (!doc.templatesProvisioned && existingTemplateNames.size === 0)) {
    // Provision templates
  }
}
```

#### 2.2 Error Suppression
**Location:** Lines 698-701
**Issue:** Errors are caught and logged but not re-thrown. This is correct for post-save hooks, but there's no retry mechanism or error tracking.

**Current Code:**
```typescript
} catch (error: any) {
  logger.error(`Template auto-provisioning failed for ${doc.subDomain}:`, error);
  // Don't throw - this is a background operation
}
```

**Recommendation:** Add error tracking and optional retry:
```typescript
} catch (error: any) {
  logger.error(`Template auto-provisioning failed for ${doc.subDomain}:`, error);
  
  // Track failure for manual retry or background job
  await Business.updateOne(
    { _id: doc._id },
    { 
      $set: { 
        templatesProvisioned: false,
        templateProvisioningError: error.message,
        templateProvisioningFailedAt: new Date()
      }
    }
  );
}
```

#### 2.3 Background Job Deferral
**Location:** Lines 652-703
**Issue:** Template provisioning runs synchronously in post-save hook, which can:
- Block the save operation if API calls are slow
- Cause timeouts if Meta API is slow
- Prevent transaction completion

**Recommendation:** Defer to background job (Inngest is available):
```typescript
// In post-save hook:
if (doc.wabaId && !doc.templatesProvisioned && doc.whatsappAccessToken) {
  try {
    const { inngest } = await import('../services/inngestService');
    await inngest.send({
      name: 'whatsapp/templates.provision',
      data: {
        subDomain: doc.subDomain,
        businessId: doc._id.toString(),
        language: 'es_PE',
        localId: doc.localId
      }
    });
    logger.info(`Queued template provisioning for ${doc.subDomain}`);
  } catch (error: any) {
    logger.error(`Failed to queue template provisioning:`, error);
    // Fallback to synchronous if queue fails
  }
}
```

---

## 3. metaWhatsAppService.ts - Graph API Integration

### Issues Identified

#### 3.1 Payload Construction Issues

**3.1.1 Template Message Parameters**
**Location:** Lines 444-467
**Issue:** Parameter mapping assumes all parameters are text type, doesn't handle different parameter types (currency, date_time, etc.)

**Current Code:**
```typescript
parameters: parameters.map((param) => ({
  type: param.type || 'text',
  text: param.value || param,
}))
```

**Recommendation:**
```typescript
parameters: parameters.map((param) => {
  if (typeof param === 'string') {
    return { type: 'text', text: param };
  }
  return {
    type: param.type || 'text',
    ...(param.type === 'currency' && { currency: param.currency, amount_1000: param.amount_1000 }),
    ...(param.type === 'date_time' && { date_time: param.date_time }),
    ...(param.type === 'text' && { text: param.value || param.text }),
  };
})
```

**3.1.2 Interactive Message Action**
**Location:** Lines 517-532
**Issue:** No validation that `action` structure matches `type` (button vs list have different required fields)

**Recommendation:**
```typescript
// Validate action structure
if (type === 'button' && (!action.buttons || !Array.isArray(action.buttons))) {
  throw new Error('Button type requires action.buttons array');
}
if (type === 'list' && (!action.button || !action.sections)) {
  throw new Error('List type requires action.button and action.sections');
}
```

**3.1.3 Media Message Payload**
**Location:** Lines 590-609
**Issue:** For document type with `mediaUrl`, filename is optional but should be extracted from URL if not provided

**Recommendation:**
```typescript
if (type === 'document' && mediaUrl && !filename) {
  // Extract filename from URL
  try {
    const urlObj = new URL(mediaUrl);
    const pathParts = urlObj.pathname.split('/');
    filename = pathParts[pathParts.length - 1] || 'document';
  } catch {
    filename = 'document';
  }
}
```

#### 3.2 Error Handling Consistency

**3.2.1 Token Refresh Error Handling**
**Location:** Lines 140-212
**Issue:** `refreshAccessToken` returns `null` on error, but caller doesn't distinguish between "token expired" vs "refresh failed"

**Recommendation:**
```typescript
private static async refreshAccessToken(
  currentToken: string
): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    // ... existing code
  } catch (error) {
    logger.error(`Error refreshing token: ${error}`);
    // Return structured error instead of null
    throw new Error(`Token refresh failed: ${error.message}`);
  }
}

// In getValidAccessToken:
try {
  const refreshed = await this.refreshAccessToken(decryptedToken);
  // ...
} catch (refreshError: any) {
  logger.error(`Failed to refresh token: ${refreshError.message}`);
  // Could attempt to use refresh token if available
  if (businessDoc.whatsappRefreshToken) {
    // Try refresh token flow
  }
  return null;
}
```

**3.2.2 API Call Error Messages**
**Location:** Lines 294-302
**Issue:** Error messages don't include request context (endpoint, method, business) making debugging difficult

**Recommendation:**
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  const errorMessage = errorData.error?.message || 'Unknown error';
  logger.error(`Meta WhatsApp API call failed: ${method} ${endpoint}`, {
    status: response.status,
    error: errorData,
    phoneNumberId,
  });
  throw new Error(
    `Meta WhatsApp API error (${method} ${endpoint}): ${errorMessage}`
  );
}
```

#### 3.3 Token Refresh/Expiry Logic

**3.3.1 Token Expiry Check**
**Location:** Lines 103-124
**Issue:** Only checks if token is expired, doesn't check if it's about to expire (should refresh proactively)

**Recommendation:**
```typescript
// Refresh if expired OR expiring within 1 hour
const expiresAt = businessDoc.whatsappTokenExpiresAt;
const now = new Date();
const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

if (expiresAt && expiresAt <= oneHourFromNow) {
  logger.info(
    `WhatsApp token expiring soon for business ${subDomain}, refreshing proactively`
  );
  // ... refresh logic
}
```

**3.3.2 Refresh Token Not Used**
**Location:** Lines 81-133
**Issue:** `whatsappRefreshToken` is stored but never used - only short-lived token refresh is attempted

**Recommendation:**
```typescript
// If token refresh fails, try using refresh token
if (!refreshed && businessDoc.whatsappRefreshToken) {
  const refreshToken = (businessDoc as any).getDecryptedWhatsAppRefreshToken();
  if (refreshToken) {
    // Use OAuth refresh token flow
    const refreshed = await this.refreshWithRefreshToken(refreshToken);
    // ...
  }
}
```

---

## 4. metaWhatsAppController.ts - Input Validation

### Issues Identified

#### 4.1 Validation Completeness

**4.1.1 Missing Array Validation**
**Location:** Multiple handlers
**Issue:** Some handlers validate arrays exist but don't validate array contents

**Examples:**
- Line 357: `newPhoneNumberIds` validated as non-empty array, but not validated as non-empty strings
- Line 734: `fields` validated as non-empty array, but not validated as valid field names

**Recommendation:**
```typescript
// For phoneNumberIds:
if (!Array.isArray(newPhoneNumberIds) || newPhoneNumberIds.length === 0) {
  return next(createValidationError('newPhoneNumberIds must be a non-empty array'));
}
if (!newPhoneNumberIds.every(id => typeof id === 'string' && id.trim().length > 0)) {
  return next(createValidationError('All phone number IDs must be non-empty strings'));
}

// For fields:
const validFields = ['messages', 'message_status', 'message_template_status_update'];
if (!fields.every(field => validFields.includes(field))) {
  return next(createValidationError(`Fields must be one of: ${validFields.join(', ')}`));
}
```

**4.1.2 Missing Type Validation**
**Location:** Lines 122-128, 168-171
**Issue:** Type validation exists but doesn't validate nested structure

**Example - Interactive Message:**
```typescript
// Current: Only validates type is 'button' or 'list'
if (type !== 'button' && type !== 'list') {
  return next(createValidationError('Type must be either "button" or "list"'));
}

// Missing: Validation of action structure
if (type === 'button' && (!action.buttons || !Array.isArray(action.buttons))) {
  return next(createValidationError('Button type requires action.buttons array'));
}
```

**4.1.3 Missing Format Validation**
**Location:** Lines 52, 86, 120
**Issue:** Phone numbers, template names, etc. not validated for format

**Recommendation:**
```typescript
// Phone number validation
const phoneRegex = /^\+[1-9]\d{1,14}$/; // E.164 format
if (!phoneRegex.test(to)) {
  return next(createValidationError('Phone number must be in E.164 format (e.g., +1234567890)'));
}

// Template name validation
const templateNameRegex = /^[a-z0-9_]{1,512}$/i;
if (!templateNameRegex.test(templateName)) {
  return next(createValidationError('Template name must be 1-512 alphanumeric characters and underscores'));
}
```

#### 4.2 Error Response Format Consistency

**4.2.1 Inconsistent Status Codes**
**Location:** Multiple handlers
**Issue:** Similar errors return different status codes

**Examples:**
- Line 295: Health check failure returns 503 (correct)
- Line 328: Setup validation failure returns 400 (correct)
- Line 376: Migration validation failure returns 400 (correct)
- But: Some validation errors use `next()` (which may return 400 or 500 depending on error handler)

**Recommendation:** Standardize:
- 400: Client errors (validation, bad request)
- 401: Authentication errors
- 403: Authorization errors
- 404: Not found
- 500: Server errors
- 503: Service unavailable (health check failures)

**4.2.2 Inconsistent Error Response Structure**
**Location:** All handlers
**Issue:** Some handlers return different error structures

**Current Pattern:**
```typescript
res.status(400).json({
  type: '3',
  message: 'Error message',
  data: result,
});
```

**Recommendation:** Create consistent error response helper:
```typescript
const sendErrorResponse = (res: Response, statusCode: number, message: string, data?: any) => {
  res.status(statusCode).json({
    type: statusCode >= 500 ? '3' : '3', // Or use different type codes
    message,
    data: data || null,
    timestamp: new Date().toISOString(),
  });
};
```

---

## 5. server.ts - Startup Sequence

### Issues Identified

#### 5.1 Database Connection Failure Handling
**Location:** Lines 103-110
**Issue:** If database connection fails, health monitor still starts, and server still listens. No graceful degradation.

**Current Code:**
```typescript
connectToDB().then(() => {
  whatsappHealthMonitor.start();
  console.log('WhatsApp health monitor started');
}).catch((error) => {
  console.error('Failed to connect to database:', error);
})
```

**Issues:**
1. Server starts even if DB connection fails
2. Health monitor could start before DB is ready
3. No retry mechanism
4. No graceful shutdown if DB fails after startup

**Recommendation:**
```typescript
let dbConnected = false;

connectToDB()
  .then(() => {
    dbConnected = true;
    // Start health monitor only after DB is connected
    const { whatsappHealthMonitor } = require('./services/whatsapp/whatsappHealthMonitor');
    whatsappHealthMonitor.start();
    console.log('WhatsApp health monitor started');
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    // Option 1: Exit process (fail fast)
    // process.exit(1);
    
    // Option 2: Retry connection
    const retryConnection = async () => {
      try {
        await connectToDB();
        dbConnected = true;
        const { whatsappHealthMonitor } = require('./services/whatsapp/whatsappHealthMonitor');
        whatsappHealthMonitor.start();
        console.log('Database connected and health monitor started after retry');
      } catch (retryError) {
        console.error('Retry connection failed:', retryError);
        setTimeout(retryConnection, 5000); // Retry after 5 seconds
      }
    };
    setTimeout(retryConnection, 5000);
  });

// Start server regardless (or conditionally)
if (process.env.REQUIRE_DB === 'true') {
  // Wait for DB before starting server
} else {
  server.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}/${baseRoute}/${version}`);
  });
}
```

#### 5.2 Clean Server Shutdown
**Location:** Entire file
**Issue:** No graceful shutdown handlers - intervals, database connections, and HTTP server don't close cleanly

**Recommendation:**
```typescript
// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  // Stop health monitor
  try {
    const { whatsappHealthMonitor } = require('./services/whatsapp/whatsappHealthMonitor');
    whatsappHealthMonitor.stop();
    console.log('Health monitor stopped');
  } catch (error) {
    console.error('Error stopping health monitor:', error);
  }
  
  // Close database connection
  try {
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
  
  // Force exit after timeout
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});
```

---

## Priority Recommendations

### High Priority (Fix Immediately)
1. **Business.ts post-save hook** - Move template provisioning to background job
2. **server.ts** - Add graceful shutdown handlers
3. **whatsappHealthMonitor.ts** - Add concurrency control and cleanup

### Medium Priority (Fix Soon)
1. **metaWhatsAppService.ts** - Improve token refresh logic with proactive refresh
2. **metaWhatsAppController.ts** - Add comprehensive validation for all inputs
3. **whatsappHealthMonitor.ts** - Add circuit breaker for failing businesses

### Low Priority (Nice to Have)
1. **metaWhatsAppService.ts** - Use refresh tokens when available
2. **Business.ts** - Add idempotency checks for template provisioning
3. **metaWhatsAppController.ts** - Standardize error response format

---

## Testing Recommendations

1. **Health Monitor:**
   - Test with 100+ businesses
   - Test with slow API responses
   - Test interval cleanup on shutdown

2. **Template Provisioning:**
   - Test idempotency (save business twice)
   - Test with slow Meta API
   - Test with API failures

3. **Token Refresh:**
   - Test proactive refresh (1 hour before expiry)
   - Test refresh token fallback
   - Test concurrent refresh attempts

4. **Server Shutdown:**
   - Test SIGTERM handling
   - Test with active connections
   - Test database disconnection scenarios

