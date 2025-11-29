/**
 * Product Management Routes Test Script
 *
 * Usage: node test-products.js
 *
 * Tests all product management endpoints with the provided credentials
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const SUB_DOMAIN = 'my-restaurant';
const LOCAL_ID = 'LOC1760097779968WGX4I';
const USERNAME = 'tcbsgpm91wpw-az@ptltrybrmvpmok.hz';
const PASSWORD = 'Etalon12345@';

// Create axios instance with auth
const api = axios.create({
  baseURL: BASE_URL,
  auth: {
    username: USERNAME,
    password: PASSWORD
  },
  headers: {
    'Content-Type': 'application/json'
  }
});

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

async function testGetAllProducts() {
  log(colors.blue, '\n=== Test 1: Get All Products for Location ===');
  try {
    const response = await api.get(`/api/v1/products/get-all/${SUB_DOMAIN}/${LOCAL_ID}`);
    log(colors.green, '✓ Success:', response.data.message);
    log(colors.yellow, `  Found ${response.data.data?.length || 0} products`);
    return response.data.data;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetProductsWithQuery() {
  log(colors.blue, '\n=== Test 2: Get Products with Query Filters ===');
  try {
    const response = await api.get('/api/v1/products', {
      params: {
        subDomain: SUB_DOMAIN,
        localId: LOCAL_ID,
        page: 1,
        limit: 10
      }
    });
    log(colors.green, '✓ Success:', response.data.message);
    log(colors.yellow, `  Items: ${response.data.data?.length || 0}`);
    log(colors.yellow, `  Pagination:`, response.data.pagination);
    return response.data.data;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testCreateProduct(categoryId) {
  log(colors.blue, '\n=== Test 3: Create a New Product ===');
  try {
    const productData = {
      name: `Test Product ${Date.now()}`,
      description: 'A test product created by automated test',
      price: 15.99,
      categoryId: categoryId,
      available: true,
      sku: `TEST-${Date.now()}`
    };

    const response = await api.post(`/api/v1/products/${SUB_DOMAIN}/${LOCAL_ID}`, productData);
    log(colors.green, '✓ Success:', response.data.message);
    log(colors.yellow, `  Product _id: ${response.data.data?._id}`);
    log(colors.yellow, `  Product rId: ${response.data.data?.rId}`);
    log(colors.yellow, `  Name: ${response.data.data?.name}`);
    return response.data.data;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetSingleProduct(productId) {
  log(colors.blue, `\n=== Test 4: Get Single Product (${productId}) ===`);
  try {
    const response = await api.get(`/api/v1/products/${productId}`);
    log(colors.green, '✓ Success:', response.data.message);
    log(colors.yellow, `  Name: ${response.data.data?.name}`);
    log(colors.yellow, `  Price: ${response.data.data?.basePrice || response.data.data?.price}`);
    return response.data.data;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateProduct(productId) {
  log(colors.blue, `\n=== Test 5: Update Product (${productId}) ===`);
  try {
    const updates = {
      name: `Updated Product ${Date.now()}`,
      price: 19.99,
      description: 'Updated description'
    };

    const response = await api.patch(`/api/v1/products/${productId}`, updates);
    log(colors.green, '✓ Success:', response.data.message);
    log(colors.yellow, `  Updated name: ${response.data.data?.name}`);
    return response.data.data;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testSyncProductsToCatalog() {
  log(colors.blue, '\n=== Test 6: Sync All Products to Catalog ===');
  try {
    const response = await api.post(`/api/v1/products/sync-to-catalog/${SUB_DOMAIN}/${LOCAL_ID}`);
    log(colors.green, '✓ Success:', response.data.message || 'Sync initiated');
    return response.data;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testSyncSingleProduct(productId, catalogId) {
  log(colors.blue, `\n=== Test 7: Sync Single Product to Catalog (${productId}) ===`);
  try {
    const payload = catalogId ? { catalogId } : {};
    const response = await api.post(`/api/v1/products/sync-product-to-catalog/${productId}`, payload);
    log(colors.green, '✓ Success:', response.data.message || 'Product synced');
    return response.data;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testSyncProductAvailability(productId, catalogId) {
  log(colors.blue, `\n=== Test 8: Sync Product Availability (${productId}) ===`);
  try {
    const payload = catalogId ? { catalogId } : {};
    const response = await api.post(`/api/v1/products/sync-availability/${productId}`, payload);
    log(colors.green, '✓ Success:', response.data.message || 'Availability synced');
    return response.data;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testGetSyncStatus() {
  log(colors.blue, '\n=== Test 9: Get Sync Status ===');
  try {
    const response = await api.get(`/api/v1/products/sync-status/${SUB_DOMAIN}/${LOCAL_ID}`);
    log(colors.green, '✓ Success:', response.data.message || 'Status retrieved');
    log(colors.yellow, '  Status:', JSON.stringify(response.data.data, null, 2));
    return response.data;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return null;
  }
}

async function testDeleteProduct(productId) {
  log(colors.blue, `\n=== Test 10: Delete Product (${productId}) ===`);
  try {
    const response = await api.delete(`/api/v1/products/${productId}`);
    log(colors.green, '✓ Success: Product deleted (Status 204)');
    return true;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  log(colors.magenta, '\n╔════════════════════════════════════════════════╗');
  log(colors.magenta, '║   Product Management Routes Test Suite        ║');
  log(colors.magenta, '╚════════════════════════════════════════════════╝');
  log(colors.yellow, `\nBase URL: ${BASE_URL}`);
  log(colors.yellow, `Restaurant: ${SUB_DOMAIN}`);
  log(colors.yellow, `Location: ${LOCAL_ID}\n`);

  let createdProductId = null;
  let testProductId = null;
  let categoryId = null;
  let catalogId = null;

  // Test 9: Get sync status first to retrieve catalogId
  const syncStatus = await testGetSyncStatus();
  if (syncStatus?.data?.catalogId) {
    catalogId = syncStatus.data.catalogId;
    log(colors.yellow, `  Using catalogId: ${catalogId}`);
  }

  // Test 1: Get all products
  const allProducts = await testGetAllProducts();
  if (allProducts && allProducts.length > 0) {
    testProductId = allProducts[0]._id; // Use MongoDB _id
    categoryId = allProducts[0].categoryId; // Get categoryId from existing product
    log(colors.yellow, `  Using existing product for tests: ${testProductId}`);
    log(colors.yellow, `  Using categoryId: ${categoryId}`);
  }

  // Test 2: Get products with query
  await testGetProductsWithQuery();

  // Test 3: Create product (only if we have a categoryId)
  if (categoryId) {
    const createdProduct = await testCreateProduct(categoryId);
    if (createdProduct) {
      createdProductId = createdProduct._id; // Use MongoDB _id
    }
  } else {
    log(colors.yellow, '\nℹ Skipping product creation tests (no categoryId available)');
  }

  // Use created product or existing product for remaining tests
  const productIdForTests = createdProductId || testProductId;

  if (productIdForTests) {
    // Test 4: Get single product
    await testGetSingleProduct(productIdForTests);

    // Test 5: Update product
    await testUpdateProduct(productIdForTests);

    // Test 6-8: Catalog sync tests
    await testSyncProductsToCatalog();
    await testSyncSingleProduct(productIdForTests, catalogId);
    await testSyncProductAvailability(productIdForTests, catalogId);

    // Test 10: Delete product (only if we created one)
    if (createdProductId) {
      await testDeleteProduct(createdProductId);
    }
  } else {
    log(colors.yellow, '\nℹ Skipping tests that require a product ID (no products available)');
  }

  log(colors.magenta, '\n╔════════════════════════════════════════════════╗');
  log(colors.magenta, '║   Test Suite Complete                          ║');
  log(colors.magenta, '╚════════════════════════════════════════════════╝\n');
}

// Run the tests
runTests().catch(error => {
  log(colors.red, '\n✗ Fatal error running tests:', error.message);
  process.exit(1);
});
