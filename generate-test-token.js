const jwt = require('jsonwebtoken');
require('dotenv').config();

// Use the same JWT_SECRET as the resume service
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Generate test JWT token
const testToken = jwt.sign(
  { 
    userId: 'test-user-123', 
    email: 'recruiter@company.com',
    role: 'recruiter' 
  }, 
  JWT_SECRET, // Use the actual secret from .env
  { expiresIn: '24h' }
);

console.log('='.repeat(50));
console.log('🔑 JWT TOKEN FOR POSTMAN TESTING');
console.log('='.repeat(50));
console.log('Using JWT_SECRET:', JWT_SECRET.substring(0, 10) + '...');
console.log('Token:', testToken);
console.log('='.repeat(50));
console.log('Copy this token and use it in Postman Authorization header:');
console.log('Authorization: Bearer ' + testToken);
console.log('='.repeat(50));
