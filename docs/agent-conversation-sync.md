# Agent Conversation Sync API

This document explains how to integrate your external Langchain-based agent with the API server for conversation synchronization in a multi-tenant WhatsApp environment.

## Problem Statement

When WhatsApp webhook events arrive, they contain the phone number but not the subdomain (tenant identifier). Your external Langchain agent needs to:
1. Identify which tenant the conversation belongs to
2. Sync conversation state back to the API server
3. Maintain conversation context across systems

## Solution Architecture

```
WhatsApp → WAHA → API Server → Agent App
                      ↑            ↓
                      └────────────┘
                    (Conversation Sync)
```

### Flow:

1. **WhatsApp Message Arrives** → WAHA webhook → API Server
2. **API Server** creates/updates ConversationState with subdomain
3. **Agent App** looks up tenant by phone number
4. **Agent App** processes message with Langchain
5. **Agent App** syncs conversation state back to API Server

## API Endpoints

### 1. Lookup Tenant by Phone Number

**Endpoint:** `GET /api/v1/whatsapp/lookup/tenant/:phoneNumber`

**Purpose:** Find the subdomain (tenant) associated with a phone number

**Request:**
```bash
GET /api/v1/whatsapp/lookup/tenant/+51999999999
```

**Response:**
```json
{
  "type": "1",
  "message": "Tenant information retrieved successfully",
  "data": {
    "subDomain": "restaurant-abc",
    "botId": "67890abcdef",
    "sessionId": "bot123_51999999999_1234567890_xyz",
    "isActive": true
  }
}
```

**Use Case:** Your agent receives a phone number and needs to know which tenant it belongs to.

---

### 2. Get Conversation by Phone Number

**Endpoint:** `GET /api/v1/whatsapp/lookup/conversation/:phoneNumber`

**Query Parameters:**
- `botId` (optional): Filter by specific bot ID

**Purpose:** Get the full conversation state for a phone number

**Request:**
```bash
GET /api/v1/whatsapp/lookup/conversation/+51999999999?botId=67890abcdef
```

**Response:**
```json
{
  "type": "1",
  "message": "Conversation retrieved successfully",
  "data": {
    "sessionId": "bot123_51999999999_1234567890_xyz",
    "userId": "+51999999999",
    "botId": "67890abcdef",
    "subDomain": "restaurant-abc",
    "currentIntent": "order",
    "currentStep": "selecting",
    "previousIntent": "menu",
    "previousStep": "browsing",
    "context": {
      "selectedItems": [
        {
          "id": "item_123",
          "name": "Pizza Margherita",
          "quantity": 1,
          "price": 25.00
        }
      ],
      "orderTotal": 25.00,
      "previousMessages": [
        {
          "role": "user",
          "content": "Hola",
          "timestamp": "2025-12-29T10:00:00.000Z"
        },
        {
          "role": "bot",
          "content": "¡Hola! Bienvenido",
          "timestamp": "2025-12-29T10:00:01.000Z"
        }
      ],
      "lastUserMessage": "Quiero una pizza"
    },
    "metadata": {
      "language": "es",
      "platform": "whatsapp"
    },
    "isActive": true,
    "lastActivity": "2025-12-29T10:05:00.000Z",
    "expiresAt": "2025-12-30T10:05:00.000Z",
    "createdAt": "2025-12-29T10:00:00.000Z",
    "updatedAt": "2025-12-29T10:05:00.000Z"
  }
}
```

---

### 3. Sync Conversation State from Agent

**Endpoint:** `PUT /api/v1/whatsapp/agent/conversations/:sessionId/sync`

**Purpose:** Update conversation state after agent processes the message

**Request:**
```bash
PUT /api/v1/whatsapp/agent/conversations/bot123_51999999999_1234567890_xyz/sync
Content-Type: application/json

{
  "intent": "payment",
  "step": "processing_payment",
  "context": {
    "selectedItems": [
      {
        "id": "item_123",
        "name": "Pizza Margherita",
        "quantity": 2,
        "price": 50.00
      }
    ],
    "orderTotal": 50.00,
    "paymentMethod": "yape",
    "deliveryAddress": {
      "street": "Av. Principal 123",
      "city": "Lima"
    }
  },
  "metadata": {
    "agentProcessedAt": "2025-12-29T10:06:00.000Z",
    "agentVersion": "1.0.0"
  },
  "isActive": true
}
```

**Response:**
```json
{
  "type": "1",
  "message": "Conversation synced successfully from agent",
  "data": {
    "sessionId": "bot123_51999999999_1234567890_xyz",
    "currentIntent": "payment",
    "currentStep": "processing_payment",
    "context": { /* updated context */ },
    "lastActivity": "2025-12-29T10:06:00.000Z"
  }
}
```

---

### 4. Add Message from Agent

**Endpoint:** `POST /api/v1/whatsapp/agent/conversations/:sessionId/messages`

**Purpose:** Record messages processed by the agent

**Request:**
```bash
POST /api/v1/whatsapp/agent/conversations/bot123_51999999999_1234567890_xyz/messages
Content-Type: application/json

{
  "role": "bot",
  "content": "Perfecto! Tu pedido está confirmado. Total: S/ 50.00"
}
```

**Response:**
```json
{
  "type": "1",
  "message": "Message added successfully",
  "data": {
    "sessionId": "bot123_51999999999_1234567890_xyz",
    "context": {
      "previousMessages": [
        /* message history including the new message */
      ],
      "lastUserMessage": "Quiero una pizza"
    }
  }
}
```

---

## Integration Example: Langchain Agent

### Python Example

```python
import requests
from typing import Optional, Dict, Any

class ConversationSyncClient:
    def __init__(self, api_base_url: str, api_key: Optional[str] = None):
        self.api_base_url = api_base_url
        self.headers = {
            "Content-Type": "application/json"
        }
        if api_key:
            self.headers["Authorization"] = f"Bearer {api_key}"

    def lookup_tenant(self, phone_number: str) -> Dict[str, Any]:
        """Lookup tenant/subdomain by phone number"""
        response = requests.get(
            f"{self.api_base_url}/api/v1/whatsapp/lookup/tenant/{phone_number}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()["data"]

    def get_conversation(self, phone_number: str, bot_id: Optional[str] = None) -> Dict[str, Any]:
        """Get full conversation state"""
        params = {"botId": bot_id} if bot_id else {}
        response = requests.get(
            f"{self.api_base_url}/api/v1/whatsapp/lookup/conversation/{phone_number}",
            params=params,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()["data"]

    def sync_conversation(
        self,
        session_id: str,
        intent: str,
        step: str,
        context: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None,
        is_active: bool = True
    ) -> Dict[str, Any]:
        """Sync conversation state back to API"""
        payload = {
            "intent": intent,
            "step": step,
            "context": context,
            "metadata": metadata or {},
            "isActive": is_active
        }
        response = requests.put(
            f"{self.api_base_url}/api/v1/whatsapp/agent/conversations/{session_id}/sync",
            json=payload,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()["data"]

    def add_message(self, session_id: str, role: str, content: str) -> Dict[str, Any]:
        """Add message to conversation history"""
        payload = {
            "role": role,  # 'user' or 'bot'
            "content": content
        }
        response = requests.post(
            f"{self.api_base_url}/api/v1/whatsapp/agent/conversations/{session_id}/messages",
            json=payload,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()["data"]


# Usage Example
def process_whatsapp_message(phone_number: str, message_text: str):
    sync_client = ConversationSyncClient("https://your-api-server.com")

    # Step 1: Lookup tenant
    tenant_info = sync_client.lookup_tenant(phone_number)
    subdomain = tenant_info["subDomain"]
    session_id = tenant_info["sessionId"]

    # Step 2: Get conversation context
    conversation = sync_client.get_conversation(phone_number)

    # Step 3: Process with your Langchain agent
    # (Your agent logic here - using subdomain for tenant-specific data)
    agent_response = your_langchain_agent.process(
        message=message_text,
        context=conversation["context"],
        tenant=subdomain
    )

    # Step 4: Add user message
    sync_client.add_message(session_id, "user", message_text)

    # Step 5: Add bot response
    sync_client.add_message(session_id, "bot", agent_response["text"])

    # Step 6: Sync updated conversation state
    sync_client.sync_conversation(
        session_id=session_id,
        intent=agent_response["intent"],
        step=agent_response["step"],
        context=agent_response["updated_context"],
        metadata={
            "agent_confidence": agent_response["confidence"],
            "agent_model": "gpt-4"
        }
    )

    return agent_response["text"]
```

### Node.js/TypeScript Example

```typescript
import axios, { AxiosInstance } from 'axios';

interface TenantInfo {
  subDomain: string;
  botId: string;
  sessionId: string;
  isActive: boolean;
}

interface Conversation {
  sessionId: string;
  userId: string;
  botId: string;
  subDomain: string;
  currentIntent: string;
  currentStep: string;
  context: Record<string, any>;
  metadata: Record<string, any>;
  isActive: boolean;
  lastActivity: string;
}

class ConversationSyncClient {
  private client: AxiosInstance;

  constructor(apiBaseUrl: string, apiKey?: string) {
    this.client = axios.create({
      baseURL: apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
      }
    });
  }

  async lookupTenant(phoneNumber: string): Promise<TenantInfo> {
    const response = await this.client.get(
      `/api/v1/whatsapp/lookup/tenant/${phoneNumber}`
    );
    return response.data.data;
  }

  async getConversation(
    phoneNumber: string,
    botId?: string
  ): Promise<Conversation> {
    const response = await this.client.get(
      `/api/v1/whatsapp/lookup/conversation/${phoneNumber}`,
      { params: botId ? { botId } : {} }
    );
    return response.data.data;
  }

  async syncConversation(
    sessionId: string,
    intent: string,
    step: string,
    context: Record<string, any>,
    metadata?: Record<string, any>,
    isActive: boolean = true
  ): Promise<Conversation> {
    const response = await this.client.put(
      `/api/v1/whatsapp/agent/conversations/${sessionId}/sync`,
      { intent, step, context, metadata: metadata || {}, isActive }
    );
    return response.data.data;
  }

  async addMessage(
    sessionId: string,
    role: 'user' | 'bot',
    content: string
  ): Promise<Conversation> {
    const response = await this.client.post(
      `/api/v1/whatsapp/agent/conversations/${sessionId}/messages`,
      { role, content }
    );
    return response.data.data;
  }
}

// Usage
async function processWhatsAppMessage(
  phoneNumber: string,
  messageText: string
) {
  const syncClient = new ConversationSyncClient('https://your-api-server.com');

  // Lookup tenant
  const tenantInfo = await syncClient.lookupTenant(phoneNumber);
  const { subdomain, sessionId } = tenantInfo;

  // Get conversation
  const conversation = await syncClient.getConversation(phoneNumber);

  // Process with agent (your Langchain logic)
  const agentResponse = await yourLangchainAgent.process({
    message: messageText,
    context: conversation.context,
    tenant: subdomain
  });

  // Sync messages
  await syncClient.addMessage(sessionId, 'user', messageText);
  await syncClient.addMessage(sessionId, 'bot', agentResponse.text);

  // Sync state
  await syncClient.syncConversation(
    sessionId,
    agentResponse.intent,
    agentResponse.step,
    agentResponse.updatedContext,
    { agentModel: 'gpt-4' }
  );

  return agentResponse.text;
}
```

## Best Practices

### 1. Error Handling

Always handle the case where no active conversation exists:

```python
try:
    tenant_info = sync_client.lookup_tenant(phone_number)
except requests.HTTPError as e:
    if e.response.status_code == 404:
        # No active conversation - this shouldn't happen if webhook flow is correct
        # Log and notify admin
        logger.error(f"No conversation found for {phone_number}")
        return "I'm sorry, there was an error. Please try again."
    raise
```

### 2. Caching

Cache tenant lookups to reduce API calls:

```python
from cachetools import TTLCache

tenant_cache = TTLCache(maxsize=1000, ttl=3600)  # 1 hour cache

def get_tenant_cached(phone_number: str):
    if phone_number not in tenant_cache:
        tenant_cache[phone_number] = sync_client.lookup_tenant(phone_number)
    return tenant_cache[phone_number]
```

### 3. Async Processing

Use async/await for better performance:

```python
import asyncio
import aiohttp

async def process_message_async(phone_number: str, message: str):
    async with aiohttp.ClientSession() as session:
        # Parallel requests
        tenant_task = fetch_tenant(session, phone_number)
        conversation_task = fetch_conversation(session, phone_number)

        tenant, conversation = await asyncio.gather(tenant_task, conversation_task)

        # Process and sync
        # ...
```

### 4. Webhook Reliability

Ensure idempotency when processing webhooks:

```python
processed_events = set()  # or use Redis

def process_webhook(event_id: str, phone_number: str, message: str):
    if event_id in processed_events:
        logger.info(f"Event {event_id} already processed, skipping")
        return

    # Process message
    result = process_whatsapp_message(phone_number, message)

    # Mark as processed
    processed_events.add(event_id)

    return result
```

## Webhook Flow Diagram

```
┌──────────┐         ┌──────────┐         ┌────────────┐         ┌──────────┐
│ WhatsApp │────────>│   WAHA   │────────>│ API Server │────────>│  Agent   │
└──────────┘         └──────────┘         └────────────┘         └──────────┘
                                                │                       │
                                                │    1. Lookup Tenant   │
                                                │<──────────────────────│
                                                │                       │
                                                │    2. Get Conversation│
                                                │<──────────────────────│
                                                │                       │
                                                │    3. Sync State      │
                                                │<──────────────────────│
                                                │                       │
                                                │    4. Add Messages    │
                                                │<──────────────────────│
```

## Troubleshooting

### Issue: "No active conversation found"

**Cause:** The conversation might have expired or the webhook didn't create it properly.

**Solution:**
- Check webhook is properly configured in WAHA
- Verify conversation expiration settings (default: 24 hours)
- Check API server logs for webhook processing errors

### Issue: "Conversation state not syncing"

**Cause:** Network issues or API errors.

**Solution:**
- Implement retry logic with exponential backoff
- Check API server health endpoint: `/api/v1/whatsapp/health`
- Verify authentication if using API keys

### Issue: "Messages out of order"

**Cause:** Race conditions with async processing.

**Solution:**
- Use message timestamps for ordering
- Implement message queuing with proper ordering
- Consider using webhook sequence numbers if available

## Security Considerations

1. **API Authentication:** Use API keys or JWT tokens for agent authentication
2. **Rate Limiting:** Implement rate limiting on agent endpoints
3. **Data Validation:** Validate all incoming data from agent
4. **Encryption:** Use HTTPS for all API communications
5. **Access Control:** Ensure agents can only access their assigned tenants

## Monitoring

Track these metrics:
- Tenant lookup latency
- Conversation sync success rate
- Message addition failures
- API error rates
- Agent response times

Use tools like DataDog, New Relic, or Prometheus for monitoring.
