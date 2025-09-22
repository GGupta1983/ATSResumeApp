const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:4004';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGVzdF91c2VyIiwibmFtZSI6IlRlc3QgVXNlciIsInJvbGUiOiJjYW5kaWRhdGUiLCJpYXQiOjE3MjYxOTA0MDB9.test-signature'; // Replace with valid token

// Test data
const TEST_RESUME_ID = 'test-resume-001';
const TEST_JOB_ID = 'test-job-001';

async function testMatchService() {
  console.log('🧪 Testing Match Service v2.0');
  console.log('================================');

  try {
    // Test 1: Health Check
    console.log('\n1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('   Database:', healthResponse.data.database);
    console.log('   GenAI:', healthResponse.data.genAI);
    console.log('   Version:', healthResponse.data.version);

    // Test 2: API Documentation
    console.log('\n2. Testing API Documentation...');
    try {
      const docsResponse = await axios.get(`${BASE_URL}/api-docs/`);
      console.log('✅ API documentation is accessible');
    } catch (err) {
      console.log('⚠️  API documentation check failed:', err.message);
    }

    // Test 3: Get Matches (should work even without data)
    console.log('\n3. Testing Get Matches...');
    try {
      const matchesResponse = await axios.get(`${BASE_URL}/matches?page=1&limit=5`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      console.log('✅ Get matches successful');
      console.log('   Total matches found:', matchesResponse.data.pagination?.total_matches || 0);
      console.log('   Current page:', matchesResponse.data.pagination?.current_page);
    } catch (err) {
      console.log('❌ Get matches failed:', err.response?.data?.error || err.message);
    }

    // Test 4: Analytics Dashboard
    console.log('\n4. Testing Analytics Dashboard...');
    try {
      const analyticsResponse = await axios.get(`${BASE_URL}/analytics/dashboard?days=7`, {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` }
      });
      console.log('✅ Analytics dashboard successful');
      console.log('   Total matches:', analyticsResponse.data.overview?.total_matches || 0);
      console.log('   Average score:', analyticsResponse.data.overview?.average_score || 0);
      console.log('   Success rate:', analyticsResponse.data.overview?.success_rate || 0);
    } catch (err) {
      console.log('❌ Analytics dashboard failed:', err.response?.data?.error || err.message);
    }

    console.log('\n🎉 Match Service testing completed!');
    console.log('\n📚 API Documentation: http://localhost:4004/api-docs');
    console.log('💡 Note: Some advanced tests require valid resume and job data');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error('💡 Make sure the Match Service is running on port 4004');
  }
}

// Helper function to check if service is running
async function checkServiceRunning() {
  try {
    await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    return true;
  } catch (err) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 Checking if Match Service is running...');
  
  const isRunning = await checkServiceRunning();
  
  if (!isRunning) {
    console.log('❌ Match Service is not running on port 4004');
    console.log('💡 Start it with: npm start');
    console.log('💡 Or: node app.js');
    return;
  }

  console.log('✅ Match Service is running');
  await testMatchService();
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testMatchService, checkServiceRunning };
