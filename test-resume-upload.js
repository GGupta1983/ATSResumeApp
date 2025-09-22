// Test resume upload functionality
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testResumeUpload() {
  // First get a valid JWT token by logging in
  console.log('🔄 Step 1: Getting JWT token...');
  
  const loginResponse = await fetch('http://localhost:4000/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'logintest@example.com',
      password: 'testpass123'
    })
  });

  if (!loginResponse.ok) {
    console.log('❌ Login failed');
    return;
  }

  const loginData = await loginResponse.json();
  const token = loginData.token;
  console.log('✅ Got JWT token');

  // Create a test file to upload
  console.log('\n🔄 Step 2: Creating test resume file...');
  const testContent = `John Doe
Email: john.doe@example.com
Phone: +1-555-0123

EXPERIENCE:
Software Engineer at Tech Corp (2020-2023)
- Developed web applications using React and Node.js
- Worked with databases and APIs
- Led team of 3 developers

EDUCATION:
Bachelor of Computer Science
University of Technology (2016-2020)

SKILLS:
JavaScript, React, Node.js, MongoDB, SQL, Git`;

  const testFilePath = path.join(__dirname, 'test-resume.txt');
  fs.writeFileSync(testFilePath, testContent);
  console.log('✅ Test resume file created');

  // Test the upload
  console.log('\n🔄 Step 3: Testing resume upload...');
  
  const formData = new FormData();
  formData.append('file', fs.createReadStream(testFilePath), {
    filename: 'test-resume.txt',
    contentType: 'text/plain'
  });

  try {
    const uploadResponse = await fetch('http://localhost:4000/resumes/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const uploadData = await uploadResponse.json();
    console.log(`Upload Status: ${uploadResponse.status}`);
    console.log('Upload Response:', uploadData);

    if (uploadResponse.ok) {
      console.log('✅ Resume upload successful!');
    } else {
      console.log('❌ Resume upload failed');
    }

  } catch (error) {
    console.log('❌ Upload error:', error.message);
  } finally {
    // Cleanup test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('🧹 Test file cleaned up');
    }
  }
}

testResumeUpload().catch(console.error);
