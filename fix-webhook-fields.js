// Quick script to update webhook subscription fields
const http = require('http');

const TOKEN = process.env.JWT_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGU3ZjEwNWVjM2I0YmNhZGRmOTcyZjciLCJpYXQiOjE3NjQ4Nzg1MjMsImV4cCI6MTc2NTQ4MzMyM30.AH3dO8IPGYd_T3wce9o0CVmWrVeDnuMiJzbFct8mOOM";
const SUBDOMAIN = process.argv[2];

if (!SUBDOMAIN) {
  console.error('Usage: node fix-webhook-fields.js <subdomain>');
  console.error('Example: node fix-webhook-fields.js my-business');
  process.exit(1);
}

// Recommended fields for WhatsApp webhooks
const RECOMMENDED_FIELDS = [
  'messages',
  'message_template_status_update'
];

async function getCurrentSubscription() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/whatsapp/webhooks/subscriptions?subDomain=${SUBDOMAIN}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function updateSubscriptionFields(fields) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      subDomain: SUBDOMAIN,
      fields: fields
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/whatsapp/webhooks/subscriptions',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length,
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  try {
    console.log('\n========================================');
    console.log('Webhook Subscription Field Fixer');
    console.log('========================================');
    console.log(`Subdomain: ${SUBDOMAIN}\n`);

    // Step 1: Get current subscription
    console.log('Step 1: Checking current subscription...');
    const current = await getCurrentSubscription();

    if (!current.data || !current.data.data || current.data.data.length === 0) {
      console.error('❌ ERROR: No webhook subscription found for this business');
      console.error('You need to subscribe first using POST /api/v1/whatsapp/webhooks/subscribe');
      process.exit(1);
    }

    const subscription = current.data.data[0];
    console.log(`✅ Found subscription: ${subscription.name} (ID: ${subscription.id})`);
    console.log(`   Current subscribed_fields: ${JSON.stringify(subscription.subscribed_fields || [])}`);

    // Step 2: Check if fields are empty
    if (!subscription.subscribed_fields || subscription.subscribed_fields.length === 0) {
      console.log('\n⚠️  WARNING: subscribed_fields is empty!');
      console.log(`   Recommended fields: ${JSON.stringify(RECOMMENDED_FIELDS)}`);
      console.log('\nStep 2: Updating subscription with recommended fields...');

      const updateResult = await updateSubscriptionFields(RECOMMENDED_FIELDS);

      if (updateResult.type === '1') {
        console.log('✅ SUCCESS: Subscription updated!');
      } else {
        console.log('❌ ERROR: Failed to update subscription');
        console.log(JSON.stringify(updateResult, null, 2));
        process.exit(1);
      }

      // Step 3: Verify the update
      console.log('\nStep 3: Verifying update...');
      const verified = await getCurrentSubscription();
      const updatedSub = verified.data.data[0];
      console.log(`   New subscribed_fields: ${JSON.stringify(updatedSub.subscribed_fields || [])}`);

      if (updatedSub.subscribed_fields && updatedSub.subscribed_fields.length > 0) {
        console.log('\n✅ ALL DONE! Webhook subscription fields are now configured.');
      } else {
        console.log('\n❌ WARNING: Fields still appear empty. Check Meta Developer Portal.');
      }
    } else {
      console.log('\n✅ Subscription already has fields configured. No action needed.');
      console.log(`   Current fields: ${JSON.stringify(subscription.subscribed_fields)}`);
    }

    console.log('\n========================================\n');
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Make sure the server is running on http://localhost:3000');
    }
    process.exit(1);
  }
}

main();
