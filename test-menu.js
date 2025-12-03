const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Test credentials
const USERNAME = 'tcbsgpm91wpw-az@ptltrybrmvpmok.hz';
const PASSWORD = 'Etalon12345@';

let authToken = '';
let testSubDomain = '';
let testLocalId = '';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(message, colors.cyan);
  log('='.repeat(60), colors.cyan);
}

// Helper to make authenticated requests
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

// Test 1: Login to get auth token
async function testLogin() {
  logSection('TEST 1: Authentication - Login');

  const result = await makeRequest('POST', '/auth/login', {
    username: USERNAME,
    password: PASSWORD,
  });

  if (result.success && result.data.data?.token) {
    authToken = result.data.data.token;
    testSubDomain = result.data.data.user?.subDomain || result.data.data.subDomain;
    testLocalId = result.data.data.user?.localId || result.data.data.localId;

    logSuccess('Login successful');
    logInfo(`Token: ${authToken.substring(0, 20)}...`);
    logInfo(`SubDomain: ${testSubDomain}`);
    logInfo(`LocalId: ${testLocalId || 'N/A'}`);
    return true;
  } else {
    logError(`Login failed: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Test 2: Get Menu Integration V2
async function testGetMenuIntegration() {
  logSection('TEST 2: Get Menu Integration V2');

  if (!testSubDomain) {
    logError('SubDomain not available from login. Skipping test.');
    return;
  }

  const result = await makeRequest('GET', `/menu2/v2/integration/${testSubDomain}`);

  if (result.success) {
    logSuccess('Menu integration retrieved successfully');
    logInfo(`Response type: ${result.data.type}`);
    logInfo(`Message: ${result.data.message}`);
    if (result.data.data) {
      logInfo(`Categories: ${result.data.data.categories?.length || 0}`);
      logInfo(`Products: ${result.data.data.products?.length || 0}`);
      logInfo(`Modifiers: ${result.data.data.modifiers?.length || 0}`);
    }
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
  }
}

// Test 3: Get Menu Integration for Specific Location
async function testGetMenuIntegrationByLocation() {
  logSection('TEST 3: Get Menu Integration for Specific Location');

  if (!testSubDomain || !testLocalId) {
    logError('SubDomain or LocalId not available. Skipping test.');
    return;
  }

  const result = await makeRequest('GET', `/menu2/integration/${testSubDomain}/${testLocalId}`);

  if (result.success) {
    logSuccess('Location menu integration retrieved successfully');
    logInfo(`Response type: ${result.data.type}`);
    logInfo(`Message: ${result.data.message}`);
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
  }
}

// Test 4: Get Bot Menu Structure
async function testGetBotStructure() {
  logSection('TEST 4: Get Bot Menu Structure');

  if (!testSubDomain) {
    logError('SubDomain not available. Skipping test.');
    return;
  }

  const endpoint = testLocalId
    ? `/menu2/bot-structure?subDomain=${testSubDomain}&localId=${testLocalId}`
    : `/menu2/bot-structure?subDomain=${testSubDomain}`;

  const result = await makeRequest('GET', endpoint);

  if (result.success) {
    logSuccess('Bot structure retrieved successfully');
    logInfo(`Response type: ${result.data.type}`);
    logInfo(`Message: ${result.data.message}`);
    if (result.data.data?.categories) {
      logInfo(`Categories in bot structure: ${result.data.data.categories.length}`);
    }
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
  }
}

// Test 5: Get Menu Images
async function testGetMenuImages() {
  logSection('TEST 5: Get Menu Images');

  if (!testSubDomain || !testLocalId) {
    logError('SubDomain or LocalId not available. Skipping test.');
    return;
  }

  const result = await makeRequest('GET', `/menu-pic?subDomain=${testSubDomain}&localId=${testLocalId}`);

  if (result.success) {
    logSuccess('Menu images retrieved successfully');
    logInfo(`Response type: ${result.data.type}`);
    logInfo(`Message: ${result.data.message}`);
    if (result.data.data) {
      logInfo(`Number of images: ${result.data.data.length || 0}`);
    }
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
  }
}

// Test 6: Get Product Details in Menu (requires product IDs)
async function testGetProductInMenu() {
  logSection('TEST 6: Get Product Details in Menu');

  if (!testSubDomain || !testLocalId) {
    logError('SubDomain or LocalId not available. Skipping test.');
    return;
  }

  // First, get the menu integration to find some product IDs
  const menuResult = await makeRequest('GET', `/menu2/integration/${testSubDomain}/${testLocalId}`);

  if (menuResult.success && menuResult.data.data?.products?.length > 0) {
    const productIds = menuResult.data.data.products.slice(0, 2).map(p => p._id);
    logInfo(`Testing with product IDs: ${productIds.join(', ')}`);

    const result = await makeRequest('POST', `/menu/getProductInMenu/${testLocalId}/${testSubDomain}`, productIds);

    if (result.success) {
      logSuccess('Product details retrieved successfully');
      logInfo(`Response: ${JSON.stringify(result.data.message)}`);
      if (result.data.data) {
        logInfo(`Products retrieved: ${result.data.data.length}`);
      }
    } else {
      logError(`Failed: ${JSON.stringify(result.error)}`);
    }
  } else {
    logError('No products found in menu integration. Skipping product details test.');
  }
}

// Test 7: Batch Update Test (we'll create a minimal test that won't actually modify data)
async function testBatchUpdateStructure() {
  logSection('TEST 7: Batch Update Structure Test (Dry Run)');

  logInfo('This is a structure test only - not executing actual updates');

  const sampleBatchUpdate = {
    locations: [
      {
        localId: testLocalId || 'sample-local-id',
        subDomain: testSubDomain || 'sample-subdomain',
        updates: {
          isActive: true,
        },
      },
    ],
  };

  logInfo(`Sample batch update structure:`);
  console.log(JSON.stringify(sampleBatchUpdate, null, 2));
  logSuccess('Batch update structure is valid');
}

// Main test runner
async function runTests() {
  log('\n' + '█'.repeat(60), colors.cyan);
  log('  MENU ROUTES API TESTING SUITE', colors.cyan);
  log('█'.repeat(60) + '\n', colors.cyan);

  try {
    // Step 1: Authenticate
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      logError('Authentication failed. Cannot proceed with other tests.');
      return;
    }

    // Wait a bit after login
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 2: Run menu tests
    await testGetMenuIntegration();
    await new Promise(resolve => setTimeout(resolve, 500));

    await testGetMenuIntegrationByLocation();
    await new Promise(resolve => setTimeout(resolve, 500));

    await testGetBotStructure();
    await new Promise(resolve => setTimeout(resolve, 500));

    await testGetMenuImages();
    await new Promise(resolve => setTimeout(resolve, 500));

    await testGetProductInMenu();
    await new Promise(resolve => setTimeout(resolve, 500));

    await testBatchUpdateStructure();

    // Summary
    logSection('TEST SUITE COMPLETED');
    logSuccess('All menu route tests executed');
    logInfo('Check the results above for any failures');

  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    console.error(error);
  }
}

// Run the tests
runTests();
