// Simple test script to verify mongoose integration
import { connectToDB } from './config/mongoose';
import { Combo } from './models/Combo';

async function testComboOperations() {
  try {
    // Connect to database
    await connectToDB();
    console.log('Connected to database');

    // Test creating a combo
    const testCombo = new Combo({
      name: 'Test Combo',
      description: 'A test combo for verification',
      price: 15.99,
      category: 'Test Category',
      isActive: true,
      items: [
        {
          productId: 'prod1',
          quantity: 2,
          name: 'Test Product 1'
        },
        {
          productId: 'prod2',
          quantity: 1,
          name: 'Test Product 2'
        }
      ],
      tags: ['test', 'combo', 'verification']
    });

    const savedCombo = await testCombo.save();
    console.log('Combo created:', savedCombo._id);

    // Test finding combos with filters
    const combos = await Combo.find({ isActive: true }).limit(5);
    console.log('Found combos:', combos.length);

    // Test aggregation
    const stats = await Combo.aggregate([
      {
        $group: {
          _id: null,
          totalCombos: { $sum: 1 },
          averagePrice: { $avg: '$price' }
        }
      }
    ]);
    console.log('Stats:', stats);

    // Clean up test data
    await Combo.deleteOne({ _id: savedCombo._id });
    console.log('Test combo deleted');

    console.log('All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testComboOperations();
}
