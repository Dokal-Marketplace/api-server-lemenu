// Comprehensive test for webhook subscription field validation
const http = require('http');

const TOKEN = process.env.JWT_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGU3ZjEwNWVjM2I0YmNhZGRmOTcyZjciLCJpYXQiOjE3NjQ4Nzg1MjMsImV4cCI6MTc2NTQ4MzMyM30.AH3dO8IPGYd_T3wce9o0CVmWrVeDnuMiJzbFct8mOOM";
const SUBDOMAIN = process.argv[2] || "test-business";

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;

    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    if (bodyStr) {
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runTests() {
  console.log('\n========================================');
  console.log('Webhook Subscription Validation Tests');
  console.log('========================================');
  console.log(`Subdomain: ${SUBDOMAIN}\n`);

  const tests = [
    {
      name: 'Test 1: Empty fields array (should FAIL)',
      method: 'POST',
      path: '/api/v1/whatsapp/webhooks/subscribe',
      body: {
        subDomain: SUBDOMAIN,
        webhookUrl: 'https://api.example.com/webhook',
        verifyToken: 'test_token',
        fields: []  // EMPTY!
      },
      expectedStatus: 400,
      expectedMessage: /cannot be empty|non-empty array/i
    },
    {
      name: 'Test 2: Missing fields property (should FAIL)',
      method: 'POST',
      path: '/api/v1/whatsapp/webhooks/subscribe',
      body: {
        subDomain: SUBDOMAIN,
        webhookUrl: 'https://api.example.com/webhook',
        verifyToken: 'test_token'
        // fields is missing!
      },
      expectedStatus: 400,
      expectedMessage: /Missing required fields|fields/i
    },
    {
      name: 'Test 3: Fields is not an array (should FAIL)',
      method: 'POST',
      path: '/api/v1/whatsapp/webhooks/subscribe',
      body: {
        subDomain: SUBDOMAIN,
        webhookUrl: 'https://api.example.com/webhook',
        verifyToken: 'test_token',
        fields: 'messages'  // String instead of array!
      },
      expectedStatus: 400,
      expectedMessage: /must be an array/i
    },
    {
      name: 'Test 4: Fields contains empty strings (should FAIL)',
      method: 'POST',
      path: '/api/v1/whatsapp/webhooks/subscribe',
      body: {
        subDomain: SUBDOMAIN,
        webhookUrl: 'https://api.example.com/webhook',
        verifyToken: 'test_token',
        fields: ['messages', '', 'template_status']  // Empty string!
      },
      expectedStatus: 400,
      expectedMessage: /non-empty strings/i
    },
    {
      name: 'Test 5: Fields contains non-string values (should FAIL)',
      method: 'POST',
      path: '/api/v1/whatsapp/webhooks/subscribe',
      body: {
        subDomain: SUBDOMAIN,
        webhookUrl: 'https://api.example.com/webhook',
        verifyToken: 'test_token',
        fields: ['messages', 123, null]  // Number and null!
      },
      expectedStatus: 400,
      expectedMessage: /non-empty strings/i
    },
    {
      name: 'Test 6: Valid subscription (should SUCCEED)',
      method: 'POST',
      path: '/api/v1/whatsapp/webhooks/subscribe',
      body: {
        subDomain: SUBDOMAIN,
        webhookUrl: 'https://api.example.com/webhook',
        verifyToken: 'test_token',
        fields: ['messages', 'message_template_status_update']
      },
      expectedStatus: 200,
      expectedMessage: /success/i,
      note: 'This may fail if WABA credentials are not configured'
    },
    {
      name: 'Test 7: Update with empty fields (should FAIL)',
      method: 'PUT',
      path: '/api/v1/whatsapp/webhooks/subscriptions',
      body: {
        subDomain: SUBDOMAIN,
        fields: []  // EMPTY!
      },
      expectedStatus: 400,
      expectedMessage: /cannot be empty|non-empty array/i
    },
    {
      name: 'Test 8: Update with missing fields (should FAIL)',
      method: 'PUT',
      path: '/api/v1/whatsapp/webhooks/subscriptions',
      body: {
        subDomain: SUBDOMAIN
        // fields is missing!
      },
      expectedStatus: 400,
      expectedMessage: /Missing required field|fields/i
    },
    {
      name: 'Test 9: Update with valid fields (should SUCCEED)',
      method: 'PUT',
      path: '/api/v1/whatsapp/webhooks/subscriptions',
      body: {
        subDomain: SUBDOMAIN,
        fields: ['messages', 'message_template_status_update']
      },
      expectedStatus: 200,
      expectedMessage: /success/i,
      note: 'This may fail if WABA credentials are not configured'
    },
    {
      name: 'Test 10: Unknown field names (should WARN but SUCCEED)',
      method: 'PUT',
      path: '/api/v1/whatsapp/webhooks/subscriptions',
      body: {
        subDomain: SUBDOMAIN,
        fields: ['messages', 'some_new_future_field']
      },
      expectedStatus: [200, 400],  // May succeed or fail depending on Meta API
      note: 'Unknown fields should log warning but not fail validation'
    }
  ];

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n${test.name}`);
    console.log(`  ${test.method} ${test.path}`);
    console.log(`  Body: ${JSON.stringify(test.body, null, 2).split('\n').join('\n  ')}`);

    if (test.note) {
      console.log(`  Note: ${test.note}`);
    }

    try {
      const result = await makeRequest(test.method, test.path, test.body);

      console.log(`  Response Status: ${result.status}`);
      console.log(`  Response: ${JSON.stringify(result.data, null, 2).split('\n').slice(0, 5).join('\n  ')}`);

      const statusMatches = Array.isArray(test.expectedStatus)
        ? test.expectedStatus.includes(result.status)
        : result.status === test.expectedStatus;

      const messageStr = JSON.stringify(result.data);
      const messageMatches = test.expectedMessage
        ? test.expectedMessage.test(messageStr)
        : true;

      if (statusMatches && messageMatches) {
        console.log('  ✅ PASSED');
        passed++;
      } else {
        console.log('  ❌ FAILED');
        if (!statusMatches) {
          console.log(`     Expected status: ${test.expectedStatus}, got: ${result.status}`);
        }
        if (!messageMatches) {
          console.log(`     Expected message pattern: ${test.expectedMessage}`);
        }
        failed++;
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('  ⏭️  SKIPPED - Server not running');
        skipped++;
        break;
      } else {
        console.log(`  ❌ ERROR: ${error.message}`);
        failed++;
      }
    }
  }

  console.log('\n========================================');
  console.log('Test Results');
  console.log('========================================');
  console.log(`Total:   ${tests.length}`);
  console.log(`Passed:  ${passed} ✅`);
  console.log(`Failed:  ${failed} ❌`);
  console.log(`Skipped: ${skipped} ⏭️`);
  console.log('========================================\n');

  if (skipped > 0) {
    console.log('⚠️  Make sure the server is running: npm run dev\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});
