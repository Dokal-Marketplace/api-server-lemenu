# API Key Authentication - Quick Reference

## 🎯 What is this?

API Key Authentication allows external applications and services to securely access your CartaAI API without requiring user login credentials. Perfect for:

- Third-party integrations (POS systems, delivery platforms)
- Mobile app backends
- Automated scripts and cron jobs
- Webhook receivers
- Analytics dashboards

---

## 🚀 Quick Start (3 Steps)

### Step 1: Get Your API Key

Login to get a JWT token, then create an API key:

```bash
# 1. Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Response will include: "accessToken": "YOUR_JWT_TOKEN"

# 2. Create API Key
curl -X POST http://localhost:3001/api/v1/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First API Key",
    "scopes": ["read:products", "read:orders"]
  }'

# Response will include: "key": "carta_live_abc123..." (SAVE THIS!)
```

### Step 2: Use Your API Key

```bash
curl http://localhost:3001/api/v1/products/get-all/my-restaurant/LOC123 \
  -H "X-API-Key: carta_live_abc123..."
```

### Step 3: Integrate

Copy the [example client](examples/api-key-client.js) and start building!

---

## 📚 Documentation

- **[Complete Guide](docs/API_KEY_AUTHENTICATION.md)** - Full documentation with examples
- **[Summary](API_KEY_SUMMARY.md)** - Implementation details and features
- **[Example Client](examples/api-key-client.js)** - Ready-to-use JavaScript client

---

## 🔑 Available Scopes

| Scope | What It Does |
|-------|-------------|
| `*` | **Full access** - Use with caution |
| `read:products` | View products |
| `write:products` | Create/edit/delete products |
| `read:orders` | View orders |
| `write:orders` | Create/edit orders |
| `read:menu` | View menu data |
| `read:analytics` | View reports and analytics |

---

## 🛠️ Common Use Cases

### 1. Read-Only Access (Analytics Dashboard)

```json
{
  "name": "Analytics Dashboard",
  "scopes": ["read:products", "read:orders", "read:analytics"]
}
```

### 2. POS System Integration

```json
{
  "name": "POS Integration",
  "scopes": ["read:products", "write:orders", "read:menu"],
  "rateLimit": {
    "maxRequests": 5000,
    "windowMs": 3600000
  }
}
```

### 3. Mobile App Backend

```json
{
  "name": "Mobile App",
  "scopes": ["read:products", "read:menu", "write:orders"],
  "expiresIn": 365,
  "ipWhitelist": ["your-server-ip"]
}
```

---

## 💻 Code Examples

### JavaScript

```javascript
const CartaAIClient = require('./examples/api-key-client');

const client = new CartaAIClient(process.env.CARTA_API_KEY);

// Get products
const products = await client.getProducts('my-restaurant', 'LOC123');
console.log('Products:', products.data);
```

### Python

```python
import requests

headers = {'X-API-Key': 'carta_live_abc123...'}
response = requests.get(
    'http://localhost:3001/api/v1/products/get-all/my-restaurant/LOC123',
    headers=headers
)
products = response.json()
```

### cURL

```bash
curl http://localhost:3001/api/v1/products/get-all/my-restaurant/LOC123 \
  -H "X-API-Key: carta_live_abc123..."
```

---

## 🧪 Testing

```bash
# Run comprehensive test suite
chmod +x test-api-keys.sh
./test-api-keys.sh
```

Tests cover:
- ✅ API key creation
- ✅ Authentication methods
- ✅ Scope verification
- ✅ Security validation
- ✅ Key revocation

---

## 🔒 Security Best Practices

### ✅ DO

- Store API keys in environment variables
- Use specific scopes (not `*`)
- Set expiration dates
- Use IP whitelisting for production
- Rotate keys regularly
- Revoke unused keys

### ❌ DON'T

- Commit API keys to version control
- Use keys in client-side code
- Share keys between applications
- Use `*` scope unless necessary
- Leave expired keys active

---

## 📋 API Management

### Create API Key
```bash
POST /api/v1/api-keys
```

### List Your Keys
```bash
GET /api/v1/api-keys
```

### Get Key Details
```bash
GET /api/v1/api-keys/:keyId
```

### Update Key
```bash
PATCH /api/v1/api-keys/:keyId
```

### Revoke Key
```bash
POST /api/v1/api-keys/:keyId/revoke
```

### Delete Key
```bash
DELETE /api/v1/api-keys/:keyId
```

All management endpoints require JWT authentication.

---

## 🐛 Troubleshooting

### "Invalid or inactive API key" (401)

✅ **Solutions:**
- Verify the key is correct (copy-paste errors are common!)
- Check if key has been revoked
- Check expiration date

### "Insufficient permissions" (403)

✅ **Solutions:**
- Add required scope to the key
- Use a key with appropriate permissions
- Check [available scopes](docs/API_KEY_AUTHENTICATION.md#scopes-and-permissions)

### "IP address not authorized" (403)

✅ **Solutions:**
- Add your IP to whitelist
- Remove IP restrictions if not needed

---

## 📊 Files Structure

```
api-server-lemenu/
├── src/
│   ├── models/
│   │   └── ApiKey.ts              # Database model
│   ├── controllers/
│   │   └── apiKeyController.ts    # API endpoints
│   ├── middleware/
│   │   └── apiKeyAuth.ts          # Authentication middleware
│   └── routes/
│       └── apiKeyRoute.ts         # Route definitions
├── docs/
│   └── API_KEY_AUTHENTICATION.md  # Full documentation
├── examples/
│   └── api-key-client.js          # Example client
├── test-api-keys.sh               # Test suite
├── API_KEY_SUMMARY.md             # Implementation summary
└── API_KEY_README.md              # This file
```

---

## 🎓 Learning Resources

1. **[Full Documentation](docs/API_KEY_AUTHENTICATION.md)**
   - Complete guide with detailed examples
   - Security best practices
   - Troubleshooting guide

2. **[Example Client](examples/api-key-client.js)**
   - Production-ready JavaScript client
   - Error handling examples
   - Batch operations

3. **[Test Suite](test-api-keys.sh)**
   - Comprehensive testing
   - Security validation
   - Real-world scenarios

---

## 🚦 Getting Started Checklist

- [ ] Read this README
- [ ] Start API server (`npm run dev`)
- [ ] Create your first API key
- [ ] Test with cURL
- [ ] Copy example client
- [ ] Integrate into your application
- [ ] Set up environment variables
- [ ] Configure rate limits
- [ ] Add IP whitelist (production)
- [ ] Test thoroughly
- [ ] Deploy!

---

## 💡 Tips

1. **Start Simple:** Begin with read-only scopes (`read:products`)
2. **Test First:** Use the test suite before production
3. **Use Examples:** Copy and modify the example client
4. **Monitor Usage:** Check `lastUsedAt` timestamps
5. **Plan Ahead:** Set expiration dates from the start

---

## 📞 Support

- **Documentation:** See [docs/API_KEY_AUTHENTICATION.md](docs/API_KEY_AUTHENTICATION.md)
- **Examples:** Check [examples/api-key-client.js](examples/api-key-client.js)
- **Testing:** Run `./test-api-keys.sh`

---

## ✨ Features at a Glance

| Feature | Status |
|---------|--------|
| Secure key generation | ✅ |
| Scope-based permissions | ✅ |
| Rate limiting | ✅ |
| IP whitelisting | ✅ |
| Expiration dates | ✅ |
| Activity tracking | ✅ |
| Two auth methods | ✅ |
| Full documentation | ✅ |
| Test suite | ✅ |
| Example code | ✅ |

---

*Ready to integrate? Start with [Quick Start](#-quick-start-3-steps) above!*
