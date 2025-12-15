// Simple test for reset-meta-credentials endpoint
const http = require('http');

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGU3ZjEwNWVjM2I0YmNhZGRmOTcyZjciLCJpYXQiOjE3NjQ4Nzg1MjMsImV4cCI6MTc2NTQ4MzMyM30.AH3dO8IPGYd_T3wce9o0CVmWrVeDnuMiJzbFct8mOOM";
const SUBDOMAIN = process.argv[2] || "test-business";

function testResetMetaCredentials() {
  const data = JSON.stringify({
    resetTokens: true,
    resetPhoneNumbers: true,
    resetCatalogs: true,
    resetTemplates: false
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/business/${SUBDOMAIN}/reset-meta-credentials`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': `Bearer ${TOKEN}`
    }
  };

  console.log('\n========================================');
  console.log('Testing Reset Meta Credentials Endpoint');
  console.log('========================================');
  console.log(`Subdomain: ${SUBDOMAIN}`);
  console.log(`Endpoint: POST ${options.path}`);
  console.log('Request Body:', JSON.parse(data));
  console.log('========================================\n');

  const req = http.request(options, (res) => {
    let responseBody = '';

    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    console.log('');

    res.on('data', (chunk) => {
      responseBody += chunk;
    });

    res.on('end', () => {
      try {
        const jsonResponse = JSON.parse(responseBody);
        console.log('Response:');
        console.log(JSON.stringify(jsonResponse, null, 2));

        if (res.statusCode === 200) {
          console.log('\n✅ SUCCESS: Meta credentials reset successfully');
        } else if (res.statusCode === 404) {
          console.log('\n❌ ERROR: Business not found');
        } else if (res.statusCode === 401) {
          console.log('\n❌ ERROR: Unauthorized - check your token');
        } else {
          console.log(`\n⚠️  WARNING: Unexpected status code ${res.statusCode}`);
        }
      } catch (e) {
        console.log('Response Body:', responseBody);
        console.log('\n❌ ERROR: Could not parse JSON response');
      }
    });
  });

  req.on('error', (error) => {
    console.error('\n❌ ERROR: Request failed');
    console.error(error.message);
    console.error('\nMake sure the server is running on http://localhost:3000');
  });

  req.write(data);
  req.end();
}

testResetMetaCredentials();
