const axios = require('axios');

// Test the health endpoint
async function testHealth() {
  try {
    const response = await axios.get('http://localhost:4003/health');
    console.log('✅ Health check successful:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Health check failed:');
    console.log(error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testHealth();
