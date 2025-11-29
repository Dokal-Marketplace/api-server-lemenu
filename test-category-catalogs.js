/**
 * Category-Based Catalog Test Script
 *
 * Tests Phase 1 implementation:
 * - Create category catalogs
 * - Sync category products
 * - Verify price ranges
 *
 * Usage: node test-category-catalogs.js
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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

/**
 * Test 1: Create Category-Based Catalogs
 */
async function testCreateCategoryCatalogs() {
  log(colors.blue, '\n=== Test 1: Create Category-Based Catalogs ===');
  try {
    const response = await api.post(
      `/api/v1/products/create-category-catalogs/${SUB_DOMAIN}/${LOCAL_ID}`
    );

    log(colors.green, '✓ Success:', response.data.message);
    log(colors.yellow, '  Catalogs created:', response.data.data?.catalogsCreated || 0);

    if (response.data.data?.catalogMapping) {
      log(colors.cyan, '  Catalog Mapping:');
      Object.entries(response.data.data.catalogMapping).forEach(([catId, catalogId]) => {
        log(colors.cyan, `    ${catId} → ${catalogId}`);
      });
    }

    if (response.data.data?.errors && response.data.data.errors.length > 0) {
      log(colors.yellow, '  Errors:');
      response.data.data.errors.forEach(err => {
        log(colors.yellow, `    ${err.categoryId}: ${err.error}`);
      });
    }

    return response.data.data;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test 2: Get All Categories
 */
async function testGetCategories() {
  log(colors.blue, '\n=== Test 2: Get All Categories ===');
  try {
    const response = await api.get(`/api/v1/categories/get-all/${SUB_DOMAIN}/${LOCAL_ID}`);

    const categories = response.data.data;
    log(colors.green, '✓ Success: Found', categories?.length || 0, 'categories');

    if (categories && categories.length > 0) {
      log(colors.cyan, '  Categories:');
      categories.forEach(cat => {
        log(colors.cyan, `    ${cat.rId}: ${cat.name} (${cat.isActive ? 'active' : 'inactive'})`);
      });
    }

    return categories;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test 3: Sync Category Products
 */
async function testSyncCategoryProducts(categoryId) {
  log(colors.blue, `\n=== Test 3: Sync Products for Category (${categoryId}) ===`);
  try {
    const response = await api.post(
      `/api/v1/products/sync-category/${categoryId}/${SUB_DOMAIN}/${LOCAL_ID}`
    );

    log(colors.green, '✓ Success:', response.data.message);
    log(colors.yellow, '  Products synced:', response.data.data?.synced || 0);
    log(colors.yellow, '  Products failed:', response.data.data?.failed || 0);
    log(colors.yellow, '  Products skipped:', response.data.data?.skipped || 0);

    if (response.data.data?.errors && response.data.data.errors.length > 0) {
      log(colors.yellow, '  Errors:');
      response.data.data.errors.forEach(err => {
        log(colors.yellow, `    ${err.productId}: ${err.error}`);
      });
    }

    return response.data.data;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test 4: Get Products with Presentations (to verify price ranges)
 */
async function testGetProductsWithPresentations() {
  log(colors.blue, '\n=== Test 4: Get Products with Presentations ===');
  try {
    const response = await api.get(`/api/v1/products/get-all/${SUB_DOMAIN}/${LOCAL_ID}`);

    const products = response.data.data;
    log(colors.green, '✓ Success: Found', products?.length || 0, 'products');

    if (products && products.length > 0) {
      // Find products with presentations
      const productsWithPresentations = products.filter(p =>
        p.presentations && p.presentations.length > 0
      );

      log(colors.cyan, `  Products with presentations: ${productsWithPresentations.length}`);

      if (productsWithPresentations.length > 0) {
        log(colors.cyan, '\n  Sample products with multiple sizes:');
        productsWithPresentations.slice(0, 3).forEach(p => {
          log(colors.cyan, `    ${p.name}:`);
          log(colors.cyan, `      Base price: $${p.basePrice?.toFixed(2) || '0.00'}`);
          log(colors.cyan, `      Presentations: ${p.presentations?.length || 0}`);
          log(colors.cyan, `      Category: ${p.categoryId || 'N/A'}`);
        });
      }
    }

    return products;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test 5: Get Sync Status
 */
async function testGetSyncStatus() {
  log(colors.blue, '\n=== Test 5: Get Catalog Sync Status ===');
  try {
    const response = await api.get(`/api/v1/products/sync-status/${SUB_DOMAIN}/${LOCAL_ID}`);

    log(colors.green, '✓ Success:', response.data.message || 'Status retrieved');
    log(colors.cyan, '  Sync Status:');
    log(colors.cyan, `    Catalog ID: ${response.data.data?.catalogId || 'N/A'}`);
    log(colors.cyan, `    Sync Enabled: ${response.data.data?.syncEnabled ? 'Yes' : 'No'}`);
    log(colors.cyan, `    Last Sync: ${response.data.data?.lastSyncAt || 'Never'}`);
    log(colors.cyan, `    Total Products: ${response.data.data?.totalProducts || 0}`);

    return response.data.data;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test 6: Get Presentations for a Product
 */
async function testGetPresentations() {
  log(colors.blue, '\n=== Test 6: Get Presentations (Price Ranges) ===');
  try {
    // First get products
    const productsResponse = await api.get(`/api/v1/products/get-all/${SUB_DOMAIN}/${LOCAL_ID}`);
    const products = productsResponse.data.data;

    if (!products || products.length === 0) {
      log(colors.yellow, '  No products found to check presentations');
      return null;
    }

    // Find a product with presentations
    const productWithPresentations = products.find(p =>
      p.presentations && p.presentations.length > 1
    );

    if (!productWithPresentations) {
      log(colors.yellow, '  No products with multiple presentations found');
      return null;
    }

    log(colors.green, `✓ Found product with presentations: ${productWithPresentations.name}`);

    // Get presentations via API (assuming presentations endpoint exists)
    try {
      const presResponse = await api.get(
        `/api/v1/presentations/by-product/${productWithPresentations._id}`
      );

      const presentations = presResponse.data.data;
      if (presentations && presentations.length > 0) {
        log(colors.cyan, '\n  Presentation Details:');
        const prices = presentations.map(p => p.price || p.amountWithDiscount || 0);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        presentations.forEach(p => {
          log(colors.cyan, `    ${p.name}: $${(p.amountWithDiscount || p.price)?.toFixed(2)}`);
        });

        log(colors.cyan, `\n  Expected catalog display:`);
        log(colors.cyan, `    Name: "${productWithPresentations.name} ($${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)})"`);
        log(colors.cyan, `    Price: $${minPrice.toFixed(2)} (lowest)`);
      }
    } catch (presError) {
      log(colors.yellow, '  Note: Presentations endpoint not available, using product data');
      log(colors.cyan, `    Product: ${productWithPresentations.name}`);
      log(colors.cyan, `    Presentation count: ${productWithPresentations.presentations?.length || 0}`);
    }

    return productWithPresentations;
  } catch (error) {
    log(colors.red, '✗ Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Main Test Runner
 */
async function runTests() {
  log(colors.magenta, '\n╔════════════════════════════════════════════════════════╗');
  log(colors.magenta, '║   Category-Based Catalog Test Suite - Phase 1         ║');
  log(colors.magenta, '╚════════════════════════════════════════════════════════╝');
  log(colors.yellow, `\nBase URL: ${BASE_URL}`);
  log(colors.yellow, `Restaurant: ${SUB_DOMAIN}`);
  log(colors.yellow, `Location: ${LOCAL_ID}\n`);

  let catalogCreationResult = null;
  let categories = null;
  let products = null;

  // Test 5: Get initial sync status
  await testGetSyncStatus();

  // Test 2: Get all categories
  categories = await testGetCategories();

  // Test 4: Get products with presentations (before sync)
  products = await testGetProductsWithPresentations();

  // Test 6: Check presentation price ranges
  await testGetPresentations();

  // Test 1: Create category-based catalogs
  catalogCreationResult = await testCreateCategoryCatalogs();

  if (catalogCreationResult && categories && categories.length > 0) {
    // Test 3: Sync products for each category
    for (const category of categories.slice(0, 3)) { // Test first 3 categories
      if (category.isActive) {
        await testSyncCategoryProducts(category.rId);

        // Wait a bit between syncs to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } else {
    log(colors.yellow, '\nℹ Skipping category sync tests (no catalogs created or no categories)');
  }

  // Test 5 again: Get final sync status
  await testGetSyncStatus();

  log(colors.magenta, '\n╔════════════════════════════════════════════════════════╗');
  log(colors.magenta, '║   Test Suite Complete                                  ║');
  log(colors.magenta, '╚════════════════════════════════════════════════════════╝');

  log(colors.cyan, '\n📋 Summary:');
  log(colors.cyan, `   Categories found: ${categories?.length || 0}`);
  log(colors.cyan, `   Products found: ${products?.length || 0}`);
  log(colors.cyan, `   Catalogs created: ${catalogCreationResult?.catalogsCreated || 0}`);

  if (catalogCreationResult?.catalogMapping) {
    log(colors.cyan, `   Category catalogs: ${Object.keys(catalogCreationResult.catalogMapping).length}`);
  }

  log(colors.yellow, '\n💡 Next Steps:');
  log(colors.yellow, '   1. Check Meta Business Manager → Catalogs');
  log(colors.yellow, '   2. Verify products appear in category-specific catalogs');
  log(colors.yellow, '   3. Check product names include price ranges');
  log(colors.yellow, '   4. Proceed with Phase 2 implementation\n');
}

// Run the tests
runTests().catch(error => {
  log(colors.red, '\n✗ Fatal error running tests:', error.message);
  process.exit(1);
});
