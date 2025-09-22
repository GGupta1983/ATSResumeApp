const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/resumeservice', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User schema (same as in user service)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'candidate' }
});

const User = mongoose.model('User', userSchema);

async function checkDatabase() {
  try {
    console.log('🔍 Checking MongoDB Database: resumeservice');
    console.log('📍 Connection URI: mongodb://localhost:27017/resumeservice');
    console.log('📋 Collection: users');
    console.log('=' * 60);
    
    // Get all users
    const users = await User.find({});
    console.log(`\n📊 Total users found: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 User Details:');
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user._id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Password (hashed): ${user.password.substring(0, 20)}...`);
        console.log(`   Created: ${user._id.getTimestamp()}`);
      });
    } else {
      console.log('\n❌ No users found in database');
    }
    
    // Check database info
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\n📂 Available Collections:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Get database stats
    const stats = await db.stats();
    console.log(`\n📈 Database Stats:`);
    console.log(`   Database: ${stats.db}`);
    console.log(`   Collections: ${stats.collections}`);
    console.log(`   Data Size: ${(stats.dataSize / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

checkDatabase();
