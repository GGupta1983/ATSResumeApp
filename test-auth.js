const axios = require('axios');

// Test script to validate authentication flow
async function testAuthFlow() {
    console.log('🧪 Testing Authentication Flow...\n');
    
    // Test 1: Health Check
    console.log('1. Testing Service Health...');
    try {
        const userHealth = await axios.get('http://localhost:4001/health');
        console.log('✅ User Service:', userHealth.data.status);
        
        const gatewayHealth = await axios.get('http://localhost:4000/');
        console.log('✅ Gateway Service:', gatewayHealth.data.status);
    } catch (error) {
        console.log('❌ Service Health Check Failed:', error.message);
        return;
    }
    
    // Test 2: Registration
    console.log('\n2. Testing Registration...');
    const testUser = {
        username: 'testuser123',
        email: 'testuser123@example.com',
        password: 'password123',
        role: 'candidate'
    };
    
    try {
        const regResponse = await axios.post('http://localhost:4000/users/register', testUser);
        console.log('✅ Registration Success:', regResponse.data);
    } catch (error) {
        console.log('❌ Registration Failed:');
        console.log('Status:', error.response?.status);
        console.log('Data:', error.response?.data);
        console.log('Message:', error.message);
    }
    
    // Test 3: Login
    console.log('\n3. Testing Login...');
    const loginData = {
        email: 'testuser123@example.com',
        password: 'password123'
    };
    
    try {
        const loginResponse = await axios.post('http://localhost:4000/users/login', loginData);
        console.log('✅ Login Success:', loginResponse.data);
        
        // Test 4: Token Validation
        console.log('\n4. Testing Token Validation...');
        if (loginResponse.data.token) {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(loginResponse.data.token, process.env.JWT_SECRET);
            console.log('✅ Token Valid:', decoded);
        }
        
    } catch (error) {
        console.log('❌ Login Failed:');
        console.log('Status:', error.response?.status);
        console.log('Data:', error.response?.data);
        console.log('Message:', error.message);
    }
}

// Run the test
testAuthFlow().catch(console.error);
