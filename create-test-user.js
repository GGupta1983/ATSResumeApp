const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/resumeservice');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'candidate' }
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    // Create a test user with known password
    const plainPassword = 'testpass123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    const testUser = new User({
      username: 'testknown',
      email: 'testknown@example.com',
      password: hashedPassword,
      role: 'candidate'
    });
    
    await testUser.save();
    
    console.log('✅ Test user created:');
    console.log('Email: testknown@example.com');
    console.log('Password: testpass123');
    console.log('Role: candidate');
    
    // Test password verification
    const user = await User.findOne({ email: 'testknown@example.com' });
    const isValid = await bcrypt.compare('testpass123', user.password);
    console.log(`\n🔍 Password verification test: ${isValid ? 'PASSED' : 'FAILED'}`);
    
  } catch (error) {
    if (error.code === 11000) {
      console.log('ℹ️  Test user already exists');
      console.log('Email: testknown@example.com');
      console.log('Password: testpass123');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    mongoose.connection.close();
  }
}

createTestUser();
