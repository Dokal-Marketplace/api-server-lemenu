/**
 * Test script to navigate through restaurant pages
 * Tests all subpages and reports any issues
 */

const baseURL = 'http://localhost:3000';
const apiURL = 'http://localhost:3001';

// Token from the specs - you mentioned you're logged in
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGU3ZjEwNWVjM2I0YmNhZGRmOTcyZjciLCJpYXQiOjE3NjQ4Nzg1MjMsImV4cCI6MTc2NTQ4MzMyM30.AH3dO8IPGYd_T3wce9o0CVmWrVeDnuMiJzbFct8mOOM";

async function testEndpoint(url, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    let responseData;

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    return {
      status: response.status,
      ok: response.ok,
      data: responseData,
      url: url
    };
  } catch (error) {
    return {
      status: 'ERROR',
      ok: false,
      error: error.message,
      url: url
    };
  }
}

async function testBusinessRoutes() {
  console.log('\n========================================');
  console.log('TESTING BUSINESS ROUTES');
  console.log('========================================\n');

  const tests = [
    {
      name: 'Get business by subDomain',
      url: `${apiURL}/api/v1/business?subDomain=lemenu`,
      method: 'GET'
    },
    {
      name: 'Get business locals',
      url: `${apiURL}/api/v1/business/locals?isActive=true`,
      method: 'GET'
    },
    {
      name: 'Get businesses by owner',
      url: `${apiURL}/api/v1/business/owner/businesses`,
      method: 'GET'
    },
    {
      name: 'Search businesses',
      url: `${apiURL}/api/v1/business/search?q=restaurant`,
      method: 'GET'
    },
    {
      name: 'Get businesses by location',
      url: `${apiURL}/api/v1/business/location?distrito=Lima`,
      method: 'GET'
    },
    {
      name: 'Get all businesses (admin)',
      url: `${apiURL}/api/v1/business/admin/businesses?page=1&limit=5`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    console.log(`\n📍 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);

    const result = await testEndpoint(test.url, test.method);

    if (result.status === 'ERROR') {
      console.log(`   ❌ ERROR: ${result.error}`);
    } else if (result.ok) {
      console.log(`   ✅ SUCCESS (${result.status})`);
      if (result.data && typeof result.data === 'object') {
        if (result.data.success !== undefined) {
          console.log(`   📊 Response: success=${result.data.success}`);
          if (result.data.data) {
            const dataLength = Array.isArray(result.data.data) ? result.data.data.length : 1;
            console.log(`   📊 Data items: ${dataLength}`);
          }
        }
      }
    } else {
      console.log(`   ⚠️  FAILED (${result.status})`);
      console.log(`   Response:`, JSON.stringify(result.data, null, 2).substring(0, 200));
    }
  }
}

async function testStaffRoutes() {
  console.log('\n========================================');
  console.log('TESTING STAFF ROUTES');
  console.log('========================================\n');

  const subDomain = 'lemenu';
  const localId = 'test-local-123'; // This might need to be adjusted

  const tests = [
    {
      name: 'Get roles for local',
      url: `${apiURL}/api/v1/staff/roles/${subDomain}/${localId}`,
      method: 'GET'
    },
    {
      name: 'Get staff by local',
      url: `${apiURL}/api/v1/staff/${subDomain}/${localId}`,
      method: 'GET'
    },
    {
      name: 'Get staff statistics',
      url: `${apiURL}/api/v1/staff/${subDomain}/${localId}/stats`,
      method: 'GET'
    },
    {
      name: 'Search staff',
      url: `${apiURL}/api/v1/staff/${subDomain}/${localId}/search?q=john`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    console.log(`\n📍 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);

    const result = await testEndpoint(test.url, test.method);

    if (result.status === 'ERROR') {
      console.log(`   ❌ ERROR: ${result.error}`);
    } else if (result.ok) {
      console.log(`   ✅ SUCCESS (${result.status})`);
      if (result.data && typeof result.data === 'object') {
        if (result.data.type !== undefined) {
          console.log(`   📊 Response type: ${result.data.type}`);
          console.log(`   📊 Message: ${result.data.message}`);
          if (result.data.data) {
            const dataLength = Array.isArray(result.data.data) ? result.data.data.length : 1;
            console.log(`   📊 Data items: ${dataLength}`);
          }
        }
      }
    } else {
      console.log(`   ⚠️  FAILED (${result.status})`);
      console.log(`   Response:`, JSON.stringify(result.data, null, 2).substring(0, 200));
    }
  }
}

async function testFrontendPages() {
  console.log('\n========================================');
  console.log('TESTING FRONTEND PAGES (checking accessibility)');
  console.log('========================================\n');

  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Restaurant Dashboard', path: '/restaurant' },
    { name: 'Menu Page', path: '/restaurant/menu' },
    { name: 'Orders Page', path: '/restaurant/orders' },
    { name: 'Staff Page', path: '/restaurant/staff' },
    { name: 'Settings Page', path: '/restaurant/settings' },
    { name: 'Analytics Page', path: '/restaurant/analytics' },
    { name: 'Delivery Page', path: '/restaurant/delivery' }
  ];

  for (const page of pages) {
    console.log(`\n📄 Testing page: ${page.name}`);
    console.log(`   Path: ${page.path}`);

    const url = `${baseURL}${page.path}`;

    try {
      const response = await fetch(url);
      const contentType = response.headers.get('content-type');

      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${contentType}`);

      if (response.ok) {
        console.log(`   ✅ Page accessible`);
      } else if (response.status === 404) {
        console.log(`   ❌ Page not found (404)`);
      } else if (response.status === 401 || response.status === 403) {
        console.log(`   🔒 Authentication/Authorization required (${response.status})`);
      } else {
        console.log(`   ⚠️  Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting Restaurant Navigation Tests');
  console.log(`Base URL: ${baseURL}`);
  console.log(`API URL: ${apiURL}`);
  console.log(`Token: ${TOKEN ? 'Present' : 'Missing'}`);

  await testBusinessRoutes();
  await testStaffRoutes();
  await testFrontendPages();

  console.log('\n========================================');
  console.log('✅ All tests completed!');
  console.log('========================================\n');
}

main().catch(console.error);
