const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lemenu', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Presentation schema (simplified for migration)
const presentationSchema = new mongoose.Schema({
  rId: String,
  productId: String,
  name: String,
  price: Number,
  description: String,
  isAvailableForDelivery: Boolean,
  isAvailable: { type: Boolean, default: true }, // Add the new field
  stock: Number,
  imageUrl: String,
  isPromotion: Boolean,
  servingSize: Number,
  amountWithDiscount: Number,
  discountValue: Number,
  discountType: Number,
  subDomain: String,
  localId: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

const Presentation = mongoose.model('Presentation', presentationSchema);

async function migratePresentations() {
  try {
    console.log('Starting migration to add isAvailable field to existing presentations...');
    
    // Find all presentations that don't have the isAvailable field
    const presentationsWithoutIsAvailable = await Presentation.find({
      isAvailable: { $exists: false }
    });
    
    console.log(`Found ${presentationsWithoutIsAvailable.length} presentations without isAvailable field`);
    
    if (presentationsWithoutIsAvailable.length === 0) {
      console.log('No presentations need migration. All presentations already have isAvailable field.');
      return;
    }
    
    // Update all presentations to add isAvailable: true
    const result = await Presentation.updateMany(
      { isAvailable: { $exists: false } },
      { $set: { isAvailable: true } }
    );
    
    console.log(`Successfully updated ${result.modifiedCount} presentations with isAvailable: true`);
    
    // Verify the migration
    const remainingWithoutIsAvailable = await Presentation.find({
      isAvailable: { $exists: false }
    });
    
    console.log(`Remaining presentations without isAvailable: ${remainingWithoutIsAvailable.length}`);
    
    if (remainingWithoutIsAvailable.length === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('❌ Migration incomplete. Some presentations still missing isAvailable field.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

migratePresentations();
