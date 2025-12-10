const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/v1';
const TEST_SUBDOMAIN = 'test-restaurant';
const TEST_LOCAL_ID = 'LOC123';

// Test data
const restaurantLocation = { lat: -12.0464, lng: -77.0428 }; // Lima, Peru
const deliveryLocation1 = { lat: -12.0564, lng: -77.0528 }; // ~1.2 km away
const deliveryLocation2 = { lat: -12.0764, lng: -77.0728 }; // ~3.5 km away
const deliveryLocation3 = { lat: -12.0964, lng: -77.0928 }; // ~5.8 km away

// Test mileage zone data
const mileageZone = {
  zoneName: "Mileage-Based Delivery Zone",
  type: "mileage",
  deliveryCost: 0, // Not used for mileage zones
  minimumOrder: 15,
  estimatedTime: 30,
  baseCost: 5,           // $5 base cost
  baseDistance: 2,       // for first 2km
  incrementalCost: 2,    // $2 per additional increment
  distanceIncrement: 1,  // every 1km
  allowsFreeDelivery: false,
  status: "1"
};

async function runTests() {
  console.log('========================================');
  console.log('MILEAGE-BASED DELIVERY PRICING TESTS');
  console.log('========================================\n');

  try {
    // Test 1: Create a mileage-based delivery zone
    console.log('Test 1: Creating mileage-based delivery zone...');
    const createResponse = await axios.post(
      `${BASE_URL}/delivery/zones/${TEST_SUBDOMAIN}/${TEST_LOCAL_ID}`,
      mileageZone
    );

    if (createResponse.data.type === "1") {
      console.log('✓ Mileage zone created successfully');
      console.log(`  Zone ID: ${createResponse.data.data._id}`);
      console.log(`  Base Cost: $${createResponse.data.data.baseCost}`);
      console.log(`  Base Distance: ${createResponse.data.data.baseDistance}km`);
      console.log(`  Incremental Cost: $${createResponse.data.data.incrementalCost} per ${createResponse.data.data.distanceIncrement}km`);
      console.log('');
    } else {
      console.log('✗ Failed to create mileage zone');
      console.log(createResponse.data);
      return;
    }

    // Test 2: Calculate cost for short distance (within base distance)
    console.log('Test 2: Calculate cost for 1.2km delivery (within base distance)...');
    const costResponse1 = await axios.post(
      `${BASE_URL}/delivery/calculate-cost`,
      {
        restaurantLocation,
        deliveryLocation: deliveryLocation1,
        subDomain: TEST_SUBDOMAIN,
        localId: TEST_LOCAL_ID
      }
    );

    if (costResponse1.data.type === "1") {
      console.log('✓ Cost calculated successfully');
      console.log(`  Distance: ${costResponse1.data.data.distance}km`);
      console.log(`  Delivery Cost: $${costResponse1.data.data.deliveryCost}`);
      console.log(`  Expected: $5 (base cost, within ${mileageZone.baseDistance}km)`);
      console.log(`  Match: ${costResponse1.data.data.deliveryCost === 5 ? '✓' : '✗'}`);
      console.log('');
    }

    // Test 3: Calculate cost for medium distance
    console.log('Test 3: Calculate cost for 3.5km delivery...');
    const costResponse2 = await axios.post(
      `${BASE_URL}/delivery/calculate-cost`,
      {
        restaurantLocation,
        deliveryLocation: deliveryLocation2,
        subDomain: TEST_SUBDOMAIN,
        localId: TEST_LOCAL_ID
      }
    );

    if (costResponse2.data.type === "1") {
      console.log('✓ Cost calculated successfully');
      console.log(`  Distance: ${costResponse2.data.data.distance}km`);
      console.log(`  Delivery Cost: $${costResponse2.data.data.deliveryCost}`);
      console.log(`  Calculation: Base $5 + (ceil(1.5km / 1km) × $2) = $5 + $4 = $9`);
      console.log(`  Expected: $9`);
      console.log(`  Match: ${costResponse2.data.data.deliveryCost === 9 ? '✓' : '✗'}`);
      console.log('');
    }

    // Test 4: Calculate cost for long distance
    console.log('Test 4: Calculate cost for 5.8km delivery...');
    const costResponse3 = await axios.post(
      `${BASE_URL}/delivery/calculate-cost`,
      {
        restaurantLocation,
        deliveryLocation: deliveryLocation3,
        subDomain: TEST_SUBDOMAIN,
        localId: TEST_LOCAL_ID
      }
    );

    if (costResponse3.data.type === "1") {
      console.log('✓ Cost calculated successfully');
      console.log(`  Distance: ${costResponse3.data.data.distance}km`);
      console.log(`  Delivery Cost: $${costResponse3.data.data.deliveryCost}`);
      console.log(`  Calculation: Base $5 + (ceil(3.8km / 1km) × $2) = $5 + $8 = $13`);
      console.log(`  Expected: $13`);
      console.log(`  Match: ${costResponse3.data.data.deliveryCost === 13 ? '✓' : '✗'}`);
      console.log('');
    }

    // Test 5: Get the mileage zone details
    console.log('Test 5: Retrieving mileage zone details...');
    const zonesResponse = await axios.get(
      `${BASE_URL}/delivery/zones/${TEST_SUBDOMAIN}/${TEST_LOCAL_ID}`
    );

    if (zonesResponse.data.type === "1") {
      const mileageZones = zonesResponse.data.data.filter(z => z.type === 'mileage');
      console.log(`✓ Found ${mileageZones.length} mileage zone(s)`);
      if (mileageZones.length > 0) {
        const zone = mileageZones[0];
        console.log(`  Zone Name: ${zone.zoneName}`);
        console.log(`  Type: ${zone.type}`);
        console.log(`  Base Cost: $${zone.baseCost}`);
        console.log(`  Base Distance: ${zone.baseDistance}km`);
        console.log(`  Incremental Cost: $${zone.incrementalCost}`);
        console.log(`  Distance Increment: ${zone.distanceIncrement}km`);
      }
      console.log('');
    }

    console.log('========================================');
    console.log('ALL TESTS COMPLETED');
    console.log('========================================');

  } catch (error) {
    console.error('\n✗ Error during testing:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

// Run the tests
console.log('Starting mileage delivery tests...');
console.log('Make sure the server is running on http://localhost:3000\n');

runTests();
