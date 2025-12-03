# API Testing Guide

Quick reference for testing the CartaAI Restaurant Management API.

## Quick Start

### Run All Tests
```bash
./run-all-tests.sh
```

### Run Individual Test Suites
```bash
# Menu routes only
./test-menu-simple.sh

# Product management and orders
./test-products.sh
```

---

## Test Scripts

### 1. run-all-tests.sh
**Master test runner** - Executes all test suites sequentially with summaries.

**Usage**:
```bash
chmod +x run-all-tests.sh
./run-all-tests.sh
```

**Features**:
- API availability check
- Sequential test execution
- Interactive mode with pauses between suites
- Final summary report

---

### 2. test-menu-simple.sh
**Menu Routes Testing** - Tests menu-related endpoints.

**Endpoints Tested**:
- `POST /auth/login` - Authentication
- `GET /menu2/v2/integration/{subDomain}` - Menu integration
- `GET /menu2/integration/{subDomain}/{localId}` - Location menu
- `GET /menu2/bot-structure` - Bot menu structure
- `GET /roles` - Available staff roles
- `GET /menu-pic` - Menu images
- `GET /user` - User profile

**Configuration**:
- SubDomain: `my-restaurant`
- LocalId: `LOC1760097779968WGX4I`

---

### 3. test-products.sh
**Product & Order Testing** - Tests product CRUD and order processing.

**Endpoints Tested**:

**Products**:
- `GET /products/get-all/{subDomain}/{localId}` - List all products
- `GET /products/{productId}` - Get product details
- `POST /products/{subDomain}/{localId}` - Create product
- `PATCH /products/{productId}` - Update product
- `GET /products/sync-status/{subDomain}/{localId}` - Catalog sync status
- `GET /products` - General products list

**Orders**:
- `GET /order/filled-orders/{subDomain}/{localId}` - List orders
- `GET /order/get-order/{orderId}` - Get order details
- `PATCH /order/{orderId}/status` - Update order status
- `GET /order/archived/{subDomain}/{localId}` - Archived orders
- `GET /order/filled-orders/admin` - Admin orders view

---

## Test Configuration

All tests use the following configuration:

```bash
BASE_URL="http://localhost:3001/api/v1"
EMAIL="tcbsgpm91wpw-az@ptltrybrmvpmok.hz"
PASSWORD="Etalon12345@"
SUBDOMAIN="my-restaurant"
LOCALID="LOC1760097779968WGX4I"
```

---

## Prerequisites

### API Server Running
Ensure the API server is running on port 3001:

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Check API Status
```bash
curl http://localhost:3001/api/v1/health
```

---

## Test Results

### Expected Success Rate: ~82%

**✅ Should Pass** (14 tests):
- Authentication
- Product listing and details
- Product updates
- Order listing
- Menu images
- Staff roles
- User profile
- Bot structure
- Sync status

**⚠️ Expected Warnings** (1 test):
- Product creation (invalid categoryId - by design)

**❌ Known Failures** (2 tests):
- Menu integration V2 (404 - requires data setup)
- Location menu integration (404 - requires data setup)

---

## Interpreting Results

### Color Coding

- 🟢 **Green** `✓` - Test passed successfully
- 🔴 **Red** `✗` - Test failed
- 🟡 **Yellow** `⚠` - Warning or expected failure

### HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation error)
- `401` - Unauthorized
- `404` - Not found
- `500` - Server error

---

## Troubleshooting

### API Not Running
```
✗ API is not running on port 3001
```
**Solution**: Start the API server with `npm run dev`

### Authentication Failed
```
✗ Authentication failed (HTTP 400)
```
**Solution**: Check credentials in test script

### Permission Denied
```
permission denied: ./test-menu-simple.sh
```
**Solution**: Make script executable with `chmod +x test-menu-simple.sh`

---

## Advanced Usage

### Custom Test Parameters

Edit the test scripts to use different credentials or endpoints:

```bash
# Edit configuration in test script
nano test-menu-simple.sh

# Modify these variables:
EMAIL="your-email@example.com"
PASSWORD="your-password"
SUBDOMAIN="your-subdomain"
LOCALID="your-local-id"
```

### Test Specific Endpoint

Use curl directly:

```bash
# Get authentication token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tcbsgpm91wpw-az@ptltrybrmvpmok.hz","password":"Etalon12345@"}' \
  | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

# Test endpoint
curl -s http://localhost:3001/api/v1/products/get-all/my-restaurant/LOC1760097779968WGX4I \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Test Output

### Successful Test Output
```
[1/7] Testing GET /products/get-all/{subDomain}/{localId}
✓ Success (HTTP 200)
  Found 5 products
  Sample Product ID: 68e90f173831c8ba6576df5a
```

### Failed Test Output
```
[3/7] Testing GET /menu2/v2/integration/{subDomain}
✗ Failed (HTTP 404)
{"success":false,"message":"No businesses found for this subdomain"}
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start API Server
        run: |
          npm install
          npm run dev &
          sleep 10
      - name: Run Tests
        run: ./run-all-tests.sh
```

---

## Additional Resources

- **API Documentation**: See `docs/openapi-menu.yaml`
- **Test Results**: See `TEST_RESULTS.md`
- **Source Code**: See `src/controllers/`

---

## Test Coverage Summary

| Category | Endpoints | Tested | Coverage |
|----------|-----------|--------|----------|
| Authentication | 1 | 1 | 100% |
| Menu Routes | 5 | 5 | 100% |
| Products | 6 | 6 | 100% |
| Orders | 5 | 5 | 100% |
| **Total** | **17** | **17** | **100%** |

---

*Last Updated: 2025-12-03*
*API Version: v1*
