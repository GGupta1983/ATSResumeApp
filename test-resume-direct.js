// Test resume service directly (bypassing gateway)
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testResumeServiceDirect() {
  console.log('🔄 Testing resume service directly on port 4003...');

  // Create a test file
  const testContent = `John Doe - Resume
Skills: JavaScript, React, Node.js`;
  
  const testFilePath = path.join(__dirname, 'test-resume-direct.txt');
  fs.writeFileSync(testFilePath, testContent);

  const formData = new FormData();
  formData.append('file', fs.createReadStream(testFilePath), {
    filename: 'test-resume-direct.txt',
    contentType: 'text/plain'
  });

  try {
    // The resume service generates its own test token
    const response = await fetch('http://localhost:4003/resumes/upload', {
      method: 'POST',
      headers: {
        // Using the auto-generated token from resume service
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhdXRvLXRlc3QtdXNlci0xNzU3OTEzMzczOTQ3IiwiZW1haWwiOiJhdXRvLXJlY3J1aXRlckBjb21wYW55LmNvbSIsInJvbGUiOiJyZWNydWl0ZXIiLCJhdXRvR2VuZXJhdGVkIjp0cnVlLCJnZW5lcmF0ZWRBdCI6IjIwMjUtMDktMTVUMDU6MTY6MTMuOTQ3WiIsImlhdCI6MTc1NzkxMzM3MywiZXhwIjoxNzU3OTk5NzczfQ.3zSNDgzY7MC4rhBvkMaPPtdZtYRaPdGJGe3pnRl-MNY',
        ...formData.getHeaders()
      },
      body: formData
    });

    console.log(`Status: ${response.status}`);
    const responseText = await response.text();
    console.log('Response:', responseText);

    try {
      const data = JSON.parse(responseText);
      if (response.ok) {
        console.log('✅ Direct resume service test successful!');
      } else {
        console.log('❌ Direct test failed:', data);
      }
    } catch (parseError) {
      console.log('❌ Response is not valid JSON:', responseText.substring(0, 200));
    }

  } catch (error) {
    console.log('❌ Direct test error:', error.message);
  } finally {
    // Cleanup
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

testResumeServiceDirect().catch(console.error);
