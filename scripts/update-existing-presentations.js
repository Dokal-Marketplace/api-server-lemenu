const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lemenu', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateExistingPresentations() {
  try {
    console.log('Updating existing presentations to add isAvailable field...');
    
    // Get the presentations collection directly
    const db = mongoose.connection.db;
    const presentationsCollection = db.collection('presentations');
    
    // Find presentations without isAvailable field
    const presentationsWithoutIsAvailable = await presentationsCollection.find({
      isAvailable: { $exists: false }
    }).toArray();
    
    console.log(`Found ${presentationsWithoutIsAvailable.length} presentations without isAvailable field`);
    
    if (presentationsWithoutIsAvailable.length > 0) {
      // Update all presentations to add isAvailable: true
      const result = await presentationsCollection.updateMany(
        { isAvailable: { $exists: false } },
        { $set: { isAvailable: true } }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} presentations with isAvailable: true`);
      
      // Verify the update
      const remainingWithoutIsAvailable = await presentationsCollection.find({
        isAvailable: { $exists: false }
      }).toArray();
      
      console.log(`Remaining presentations without isAvailable: ${remainingWithoutIsAvailable.length}`);
    } else {
      console.log('All presentations already have isAvailable field');
    }
    
    // Test loading a presentation
    const testPresentation = await presentationsCollection.findOne({
      _id: new mongoose.Types.ObjectId('68ee73dc4934a215d3e5e07d')
    });
    
    if (testPresentation) {
      console.log('\n✅ Test presentation loaded successfully:');
      console.log('Name:', testPresentation.name);
      console.log('isAvailable:', testPresentation.isAvailable);
    } else {
      console.log('\n❌ Test presentation not found');
    }
    
  } catch (error) {
    console.error('❌ Error updating presentations:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateExistingPresentations();
