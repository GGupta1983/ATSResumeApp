const axios = require('axios');

async function testRegistration() {
    console.log('🧪 Testing Registration Flow...\n');
    
    // Test with the exact data the frontend would send
    const testUser = {
        username: 'debuguser',
        email: 'debug@test.com',
        password: 'password123',
        role: 'candidate'
    };
    
    console.log('Sending registration request with data:', testUser);
    
    try {
        const response = await axios.post('http://localhost:4000/users/register', testUser, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        
        console.log('✅ Registration Success!');
        console.log('Status:', response.status);
        console.log('Response:', response.data);
        
    } catch (error) {
        console.log('❌ Registration Failed!');
        
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Response Data:', error.response.data);
            console.log('Response Headers:', error.response.headers);
        } else if (error.request) {
            console.log('No response received:', error.request);
        } else {
            console.log('Error setting up request:', error.message);
        }
        
        console.log('Full error:', error.toJSON ? error.toJSON() : error);
    }
}

testRegistration();
