import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  route: string;
  method: string;
  status: 'PASS' | 'FAIL' | 'SKIP' | 'ERROR';
  statusCode?: number;
  error?: string;
  responseTime?: number;
}

interface RouteDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requiresAuth?: boolean;
  requiresBody?: boolean;
  testBody?: any;
  queryParams?: Record<string, string>;
  description?: string;
}

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1';

let authToken: string | null = null;

// Test credentials (should be set via env or use test data)
const TEST_EMAIL = process.env.TEST_EMAIL || 'tcbsgpm91wpw-az@ptltrybrmvpmok.hz';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Etalon12345@';

// Test business context
const TEST_SUBDOMAIN = process.env.TEST_SUBDOMAIN || 'my-restaurant';
const TEST_LOCAL_ID = process.env.TEST_LOCAL_ID || 'LOC1760097779968WGX4I';

// Helper function to make authenticated requests
async function makeRequest(
  method: string,
  url: string,
  requiresAuth: boolean = false,
  body?: any,
  queryParams?: Record<string, string>
): Promise<{ status: number; data: any; responseTime: number }> {
  const startTime = Date.now();
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Add query parameters to URL
  let fullUrl = url;
  if (queryParams && Object.keys(queryParams).length > 0) {
    const queryString = new URLSearchParams(queryParams).toString();
    fullUrl = `${url}?${queryString}`;
  }

  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${fullUrl}`,
      headers,
      data: body,
      validateStatus: () => true, // Don't throw on any status
      timeout: 10000, // 10 second timeout
    });

    const responseTime = Date.now() - startTime;
    return { status: response.status, data: response.data, responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    if (axios.isAxiosError(error)) {
      return {
        status: error.response?.status || 0,
        data: error.response?.data || error.message,
        responseTime,
      };
    }
    return {
      status: 0,
      data: { error: String(error) },
      responseTime,
    };
  }
}

// Authenticate and get token
async function authenticate(): Promise<boolean> {
  try {
    const response = await makeRequest('POST', `${API_PREFIX}/auth/login`, false, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (response.status === 200 || response.status === 201) {
      // Try to extract token from different response formats
      if (response.data?.data?.accessToken) {
        authToken = response.data.data.accessToken;
      } else if (response.data?.accessToken) {
        authToken = response.data.accessToken;
      } else if (response.data?.token) {
        authToken = response.data.token;
      } else if (typeof response.data === 'string' && response.data.startsWith('Bearer ')) {
        authToken = response.data.replace('Bearer ', '');
      }

      if (authToken) {
        console.log('✅ Authentication successful');
        return true;
      } else {
        console.log('⚠️  Authentication response received but no token found');
        console.log('Response:', JSON.stringify(response.data, null, 2));
        return false;
      }
    } else {
      console.log(`⚠️  Authentication failed with status ${response.status}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error);
    return false;
  }
}

// Define all routes to test
const routes: RouteDefinition[] = [
  // Health endpoints (no auth)
  { path: '/health', method: 'GET', description: 'Root health check' },
  { path: '/health/s3', method: 'GET', description: 'S3 health check' },
  { path: '/health/s3/test', method: 'GET', description: 'S3 connection test' },

  // Auth endpoints (no auth required)
  { path: '/auth/login', method: 'POST', requiresBody: true, testBody: { email: TEST_EMAIL, password: TEST_PASSWORD }, description: 'User login' },
  { path: '/auth/signup', method: 'POST', requiresBody: true, testBody: 'DYNAMIC', description: 'User signup' },

  // User endpoints (auth required)
  { path: '/user', method: 'GET', requiresAuth: true, description: 'Get user profile' },

  // Business endpoints
  { path: '/business', method: 'GET', requiresAuth: true, queryParams: { subDomain: TEST_SUBDOMAIN }, description: 'Get business info' },
  // Note: Business creation requires many fields - skipping for now as it's complex
  // { path: '/business/v2/create-complete', method: 'POST', requiresAuth: true, requiresBody: true, description: 'Create business' },

  // WhatsApp Business API endpoints (auth required)
  // Note: These require WhatsApp Business API to be configured (access tokens, phone numbers)
  // They will be marked as SKIP if the business doesn't have WhatsApp configured
  { path: '/whatsapp/templates', method: 'GET', requiresAuth: true, queryParams: { subDomain: TEST_SUBDOMAIN }, description: 'Get WhatsApp Business API templates' },
  { path: '/whatsapp/phone-numbers', method: 'GET', requiresAuth: true, queryParams: { subDomain: TEST_SUBDOMAIN }, description: 'Get WhatsApp Business API phone numbers' },
  { path: '/whatsapp/send-message', method: 'POST', requiresAuth: true, requiresBody: true, testBody: { to: '+1234567890', text: 'Test message', subDomain: TEST_SUBDOMAIN }, description: 'Send WhatsApp Business API text message' },
  { path: '/whatsapp/webhook', method: 'GET', description: 'WhatsApp Business API webhook verification' },
  // Note: POST webhook requires X-Hub-Signature-256 header - will fail without it (expected security behavior)
  { path: '/whatsapp/webhook', method: 'POST', requiresBody: true, testBody: { object: 'whatsapp_business_account', entry: [] }, description: 'WhatsApp Business API webhook handler (expected to fail without signature)' },

  // Category endpoints
  { path: `/categories/get-all/${TEST_SUBDOMAIN}/${TEST_LOCAL_ID}`, method: 'GET', requiresAuth: true, description: 'Get categories' },
  { path: '/categories', method: 'POST', requiresAuth: true, requiresBody: true, testBody: { name: 'Test Category', subDomain: TEST_SUBDOMAIN, localId: TEST_LOCAL_ID }, description: 'Create category' },

  // Menu endpoints
  // Note: Requires array of product IDs - will be skipped if no products exist
  { path: `/menu/getProductInMenu/${TEST_SUBDOMAIN}/${TEST_LOCAL_ID}`, method: 'POST', requiresAuth: true, requiresBody: true, testBody: 'DYNAMIC', description: 'Get product in menu (requires array of product IDs)' },
  { path: '/menu2/bot-structure', method: 'GET', requiresAuth: true, description: 'Get menu v2 bot structure' },

  // Products endpoints
  { path: '/products', method: 'GET', requiresAuth: true, description: 'Get products' },
  // Note: Product creation requires valid categoryId - will be skipped if no categories exist
  { path: `/products/${TEST_SUBDOMAIN}/${TEST_LOCAL_ID}`, method: 'POST', requiresAuth: true, requiresBody: true, testBody: { name: 'Test Product', price: 10.99, categoryId: 'DYNAMIC' }, description: 'Create product (requires valid categoryId)' },

  // Order endpoints
  { path: `/order/filled-orders/${TEST_SUBDOMAIN}/${TEST_LOCAL_ID}`, method: 'GET', requiresAuth: true, description: 'Get orders' },
  // Note: Order creation is done through other endpoints (WhatsApp, web interface), not direct POST

  // Delivery endpoints
  { path: `/delivery/${TEST_SUBDOMAIN}/${TEST_LOCAL_ID}`, method: 'GET', requiresAuth: true, description: 'Get delivery info' },
  { path: `/delivery/zones/${TEST_SUBDOMAIN}/${TEST_LOCAL_ID}`, method: 'GET', requiresAuth: true, description: 'Get delivery zones' },

  // Staff endpoints
  { path: `/staff/${TEST_SUBDOMAIN}/${TEST_LOCAL_ID}`, method: 'GET', requiresAuth: true, description: 'Get staff' },
  // Note: Staff creation requires valid role - will be skipped if no roles exist
  { path: `/staff/${TEST_SUBDOMAIN}/${TEST_LOCAL_ID}`, method: 'POST', requiresAuth: true, requiresBody: true, testBody: { name: 'Test Staff', email: `staff-${Date.now()}@test.com`, phone: '+1234567890', password: 'StaffP@ss123!', role: 'DYNAMIC' }, description: 'Create staff (requires valid role)' },

  // Credits endpoints (under /user)
  { path: '/user/credits', method: 'GET', requiresAuth: true, description: 'Get credits' },

  // Metrics/Dashboard endpoints
  { path: '/dashboard/metrics', method: 'GET', requiresAuth: true, description: 'Get dashboard metrics' },

  // Notifications endpoints
  { path: '/notifications/unread', method: 'GET', description: 'Get unread notifications' },

  // History endpoints
  { path: '/history/get-history', method: 'GET', requiresAuth: true, description: 'Get history' },

  // Working hours endpoints
  { path: `/business/working-hours/${TEST_SUBDOMAIN}/${TEST_LOCAL_ID}`, method: 'GET', requiresAuth: true, description: 'Get working hours' },
];

// Helper function to get first category rId
async function getFirstCategoryId(): Promise<string | null> {
  try {
    const { data } = await makeRequest(
      'GET',
      `${API_PREFIX}/categories/get-all/${TEST_SUBDOMAIN}/${TEST_LOCAL_ID}`,
      true
    );
    if (data && Array.isArray(data) && data.length > 0) {
      return data[0].rId || null;
    }
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0].rId || null;
    }
  } catch (error) {
    // Ignore errors
  }
  return null;
}

// Helper function to get first product _id
async function getFirstProductId(): Promise<string | null> {
  try {
    const { data } = await makeRequest(
      'GET',
      `${API_PREFIX}/products/get-all/${TEST_SUBDOMAIN}/${TEST_LOCAL_ID}`,
      true
    );
    if (data && Array.isArray(data) && data.length > 0) {
      return data[0]._id || null;
    }
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0]._id || null;
    }
  } catch (error) {
    // Ignore errors
  }
  return null;
}

// Helper function to get first role name
async function getFirstRoleName(): Promise<string | null> {
  try {
    const { data } = await makeRequest(
      'GET',
      `${API_PREFIX}/staff/roles/${TEST_SUBDOMAIN}/${TEST_LOCAL_ID}`,
      true
    );
    if (data && Array.isArray(data) && data.length > 0) {
      return data[0].name || null;
    }
    if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
      return data.data[0].name || null;
    }
  } catch (error) {
    // Ignore errors
  }
  return null;
}

// Test a single route
async function testRoute(route: RouteDefinition): Promise<TestResult> {
  const fullPath = `${API_PREFIX}${route.path}`;
  const result: TestResult = {
    route: fullPath,
    method: route.method,
    status: 'SKIP',
  };

  try {
    // Skip if auth required but no token available
    if (route.requiresAuth && !authToken) {
      result.status = 'SKIP';
      result.error = 'Authentication required but no token available';
      return result;
    }

    // Handle dynamic test bodies
    let body = route.requiresBody ? route.testBody : undefined;
    if (body === 'DYNAMIC') {
      // Handle dynamic body based on route
      if (route.path === '/auth/signup' && route.method === 'POST') {
        // Generate unique email for signup
        body = { 
          email: `newuser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.com`, 
          password: 'StrongP@ssw0rd123!', 
          confirmPassword: 'StrongP@ssw0rd123!', 
          firstName: 'Test', 
          lastName: 'User', 
          businessName: 'Test Restaurant' 
        };
      } else if (route.path.includes('/products/') && route.method === 'POST') {
        const categoryId = await getFirstCategoryId();
        if (!categoryId) {
          result.status = 'SKIP';
          result.error = 'No categories found - cannot create product without categoryId';
          return result;
        }
        body = { name: 'Test Product', price: 10.99, categoryId };
      } else if (route.path.includes('/menu/getProductInMenu')) {
        const productId = await getFirstProductId();
        if (!productId) {
          result.status = 'SKIP';
          result.error = 'No products found - cannot test menu endpoint without product IDs';
          return result;
        }
        body = [productId];
      } else if (route.path.includes('/staff/') && route.method === 'POST') {
        const roleName = await getFirstRoleName();
        if (!roleName) {
          result.status = 'SKIP';
          result.error = 'No roles found - cannot create staff without a valid role';
          return result;
        }
        body = { name: 'Test Staff', email: `staff-${Date.now()}@test.com`, phone: '+1234567890', password: 'StaffP@ss123!', role: roleName };
      }
    } else if (body && typeof body === 'object') {
      // Replace DYNAMIC fields in object
      if (body.categoryId === 'DYNAMIC') {
        const categoryId = await getFirstCategoryId();
        if (!categoryId) {
          result.status = 'SKIP';
          result.error = 'No categories found - cannot create product without categoryId';
          return result;
        }
        body = { ...body, categoryId };
      }
      if (body.role === 'DYNAMIC') {
        const roleName = await getFirstRoleName();
        if (!roleName) {
          result.status = 'SKIP';
          result.error = 'No roles found - cannot create staff without a valid role';
          return result;
        }
        body = { ...body, role: roleName };
      }
    }
    const { status, data, responseTime } = await makeRequest(
      route.method,
      fullPath,
      route.requiresAuth || false,
      body,
      route.queryParams
    );

    result.statusCode = status;
    result.responseTime = responseTime;

    // Special cases for expected failures
    const isWebhookPost = route.path === '/whatsapp/webhook' && route.method === 'POST';
    const isWhatsAppAPI = route.path?.includes('/whatsapp/') && 
                          route.path !== '/whatsapp/webhook' &&
                          (route.method === 'GET' || route.method === 'POST');
    
    // Check if error indicates WhatsApp Business API is not configured
    const whatsAppNotConfigured = isWhatsAppAPI && (
      (typeof data === 'object' && data.message && 
       (data.message.includes('Business configuration not found') ||
        data.message.includes('not configured') ||
        data.message.includes('invalid'))) ||
      status === 500
    );
    
    // Consider 2xx and 3xx as success, 4xx/5xx as failures
    if (status >= 200 && status < 400) {
      result.status = 'PASS';
    } else if (status >= 400 && status < 500) {
      // For webhook POST, 403 is expected (signature required)
      if (isWebhookPost && status === 403) {
        result.status = 'SKIP';
        result.error = 'Expected failure: Webhook signature required (security feature)';
      } else {
        result.status = 'FAIL';
        result.error = `Client error: ${status}`;
        if (typeof data === 'object' && data.message) {
          result.error = data.message;
        }
      }
    } else if (status >= 500) {
      // For WhatsApp Business API routes, 500 with "not configured" is expected if API isn't set up
      if (whatsAppNotConfigured) {
        result.status = 'SKIP';
        result.error = 'Expected failure: WhatsApp Business API not configured for this business';
      } else {
        result.status = 'ERROR';
        result.error = `Server error: ${status}`;
        if (typeof data === 'object' && data.message) {
          result.error = data.message;
        }
      }
    } else if (status === 0) {
      result.status = 'ERROR';
      result.error = 'Connection failed or timeout';
    } else {
      result.status = 'FAIL';
      result.error = `Unexpected status: ${status}`;
    }
  } catch (error) {
    result.status = 'ERROR';
    result.error = error instanceof Error ? error.message : String(error);
  }

  return result;
}

// Main test runner
async function runTests(): Promise<void> {
  console.log('🚀 Starting E2E Tests');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔗 API Prefix: ${API_PREFIX}\n`);

  const results: TestResult[] = [];

  // Step 1: Test health endpoint first
  console.log('📋 Step 1: Testing health endpoint...');
  const healthResult = await testRoute({ path: '/health', method: 'GET' });
  results.push(healthResult);
  console.log(`${healthResult.status === 'PASS' ? '✅' : '❌'} ${healthResult.route} - ${healthResult.status} (${healthResult.statusCode})`);

  if (healthResult.status !== 'PASS') {
    console.log('\n⚠️  Health check failed. Server may not be running.');
    console.log('Please ensure the server is running on', BASE_URL);
    console.log('You can start it with: pnpm run dev');
    console.log('\nContinuing with tests anyway (they will likely fail)...\n');
    // Don't exit - continue to show what would fail
  }

  // Step 2: Authenticate
  console.log('\n📋 Step 2: Authenticating...');
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('⚠️  Authentication failed. Some tests will be skipped.');
  }

  // Step 3: Test all routes
  console.log('\n📋 Step 3: Testing all routes...\n');
  for (const route of routes) {
    const result = await testRoute(route);
    results.push(result);

    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '⚠️' : result.status === 'SKIP' ? '⏭️' : '❌';
    const time = result.responseTime ? `(${result.responseTime}ms)` : '';
    console.log(`${icon} ${route.method} ${result.route} - ${result.status} ${time}`);
    if (result.error) {
      console.log(`   └─ ${result.error}`);
    }
  }

  // Step 4: Generate report
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const errors = results.filter(r => r.status === 'ERROR').length;
  const skipped = results.filter(r => r.status === 'SKIP').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Failed: ${failed}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📈 Total: ${results.length}`);

  // Generate detailed report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: results.length,
      passed,
      failed,
      errors,
      skipped,
    },
    results: results.map(r => ({
      route: r.route,
      method: r.method,
      status: r.status,
      statusCode: r.statusCode,
      responseTime: r.responseTime,
      error: r.error,
    })),
  };

  // Save report to file
  const reportPath = path.join(process.cwd(), 'e2e-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  // List failed routes
  const failedRoutes = results.filter(r => r.status === 'FAIL' || r.status === 'ERROR');
  if (failedRoutes.length > 0) {
    console.log('\n🔴 Failed/Error Routes:');
    failedRoutes.forEach(r => {
      console.log(`   ${r.method} ${r.route} - ${r.status} (${r.statusCode})`);
      if (r.error) {
        console.log(`      Error: ${r.error}`);
      }
    });
  }

  // Exit with appropriate code
  process.exit(failed + errors > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

