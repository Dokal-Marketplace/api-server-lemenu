// Simple test script to verify Options model and service integration
import { connectToDB } from './config/mongoose';
import { Options } from './models/Options';
import { createOption, listOptions, getOptionById, updateOptionById, deleteOptionById } from './services/optionsService';

async function testOptionsOperations() {
  try {
    // Connect to database
    await connectToDB();
    console.log('Connected to database');

    const testSubDomain = 'test-restaurant';
    const testLocalId = 'test-local-1';

    // Test creating an option using service
    console.log('\n=== Testing Option Creation ===');
    const createResult = await createOption({
      subDomain: testSubDomain,
      localId: testLocalId,
      payload: {
        name: 'Extra Cheese',
        description: 'Add extra cheese to your order',
        price: 2.50,
        category: 'Add-ons',
        isActive: true,
        stock: 100,
        tags: ['cheese', 'addon', 'popular']
      }
    });

    if (createResult.error) {
      throw new Error(`Failed to create option: ${createResult.error}`);
    }

    const createdOption = createResult.option!;
    console.log('Option created:', createdOption._id, createdOption.name);

    // Test listing options
    console.log('\n=== Testing Option Listing ===');
    const listResult = await listOptions({
      subDomain: testSubDomain,
      localId: testLocalId,
      isActive: true
    });
    console.log('Found options:', listResult.items.length);

    // Test getting option by ID
    console.log('\n=== Testing Get Option by ID ===');
    const getResult = await getOptionById(createdOption._id.toString());
    if (getResult.error) {
      throw new Error(`Failed to get option: ${getResult.error}`);
    }
    console.log('Retrieved option:', getResult.option!.name);

    // Test updating option
    console.log('\n=== Testing Option Update ===');
    const updateResult = await updateOptionById(createdOption._id.toString(), {
      price: 3.00,
      description: 'Add extra cheese to your order (Updated)'
    });
    if (updateResult.error) {
      throw new Error(`Failed to update option: ${updateResult.error}`);
    }
    console.log('Updated option price:', updateResult.option!.price);

    // Test creating another option for batch operations
    console.log('\n=== Testing Multiple Options ===');
    const createResult2 = await createOption({
      subDomain: testSubDomain,
      localId: testLocalId,
      payload: {
        name: 'Extra Bacon',
        description: 'Add extra bacon to your order',
        price: 3.50,
        category: 'Add-ons',
        isActive: true,
        stock: 50,
        tags: ['bacon', 'addon']
      }
    });

    if (createResult2.error) {
      throw new Error(`Failed to create second option: ${createResult2.error}`);
    }

    const createdOption2 = createResult2.option!;
    console.log('Second option created:', createdOption2._id, createdOption2.name);

    // Test listing with category filter
    console.log('\n=== Testing Category Filter ===');
    const categoryResult = await listOptions({
      subDomain: testSubDomain,
      localId: testLocalId,
      category: 'Add-ons'
    });
    console.log('Found add-on options:', categoryResult.items.length);

    // Test text search
    console.log('\n=== Testing Text Search ===');
    const searchResult = await listOptions({
      subDomain: testSubDomain,
      localId: testLocalId,
      q: 'cheese'
    });
    console.log('Found options with "cheese":', searchResult.items.length);

    // Test price range filter
    console.log('\n=== Testing Price Range Filter ===');
    const priceResult = await listOptions({
      subDomain: testSubDomain,
      localId: testLocalId,
      minPrice: 2.0,
      maxPrice: 3.0
    });
    console.log('Found options in price range 2.0-3.0:', priceResult.items.length);

    // Test pagination
    console.log('\n=== Testing Pagination ===');
    const paginationResult = await listOptions({
      subDomain: testSubDomain,
      localId: testLocalId,
      page: 1,
      limit: 1
    });
    console.log('Pagination test - items:', paginationResult.items.length, 'total:', paginationResult.pagination.total);

    // Clean up test data
    console.log('\n=== Cleaning Up Test Data ===');
    await deleteOptionById(createdOption._id.toString());
    await deleteOptionById(createdOption2._id.toString());
    console.log('Test options deleted');

    console.log('\n✅ All Options tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testOptionsOperations();
}
