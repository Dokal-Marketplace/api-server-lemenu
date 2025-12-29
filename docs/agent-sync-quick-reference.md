# Agent Conversation Sync - Quick Reference

## Overview

These endpoints allow your external Langchain agent to sync conversations without needing subdomain from WhatsApp webhooks.

## Endpoints

### 1️⃣ Lookup Tenant by Phone
```
GET /api/v1/whatsapp/lookup/tenant/:phoneNumber
```
Returns: `{ subDomain, botId, sessionId, isActive }`

### 2️⃣ Get Full Conversation
```
GET /api/v1/whatsapp/lookup/conversation/:phoneNumber?botId=optional
```
Returns: Complete conversation state with context and history

### 3️⃣ Sync Conversation State
```
PUT /api/v1/whatsapp/agent/conversations/:sessionId/sync
Body: { intent, step, context, metadata, isActive }
```
Updates conversation after agent processing

### 4️⃣ Add Message
```
POST /api/v1/whatsapp/agent/conversations/:sessionId/messages
Body: { role: "user"|"bot", content: "message text" }
```
Records messages in conversation history

## Typical Flow

```javascript
// 1. When agent receives webhook with phone number
const tenant = await GET(`/lookup/tenant/${phoneNumber}`);
// → { subDomain: "restaurant-abc", sessionId: "..." }

// 2. Get conversation context
const conversation = await GET(`/lookup/conversation/${phoneNumber}`);
// → { context: { selectedItems: [...], orderTotal: 50 }, ... }

// 3. Process with your agent using subdomain for tenant data
const response = await langchainAgent.process({
  message: userMessage,
  context: conversation.context,
  tenant: tenant.subDomain
});

// 4. Add messages
await POST(`/agent/conversations/${sessionId}/messages`, {
  role: "user",
  content: userMessage
});

await POST(`/agent/conversations/${sessionId}/messages`, {
  role: "bot",
  content: response.text
});

// 5. Sync updated state
await PUT(`/agent/conversations/${sessionId}/sync`, {
  intent: response.intent,
  step: response.step,
  context: response.updatedContext,
  metadata: { agentVersion: "1.0" }
});
```

## Key Points

✅ **Phone number is the key** - Use it to lookup tenant/subdomain
✅ **Session ID from lookup** - Use for all subsequent operations
✅ **Context persists** - Conversation context syncs between systems
✅ **Messages tracked** - Both user and bot messages recorded
✅ **Tenant isolation** - Each subdomain has separate data

## Error Handling

```javascript
try {
  const tenant = await lookupTenant(phoneNumber);
} catch (error) {
  if (error.status === 404) {
    // No active conversation - webhook might not have created it yet
    // Wait and retry, or log error
  }
}
```

## Response Format

All endpoints return:
```json
{
  "type": "1",      // "1" = success, "3" = error
  "message": "...",
  "data": { ... }
}
```

## Implementation Checklist

- [ ] Create API client for conversation sync
- [ ] Implement tenant lookup by phone number
- [ ] Get conversation context before agent processing
- [ ] Process message with Langchain using tenant-specific data
- [ ] Add user and bot messages to history
- [ ] Sync updated conversation state
- [ ] Handle 404 errors (no active conversation)
- [ ] Implement retry logic for network failures
- [ ] Add logging and monitoring
- [ ] Test with multiple tenants

## Need More Details?

See [agent-conversation-sync.md](./agent-conversation-sync.md) for:
- Complete API documentation
- Full Python & TypeScript examples
- Best practices & patterns
- Security considerations
- Monitoring & troubleshooting
