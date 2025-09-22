// Register a test user via API, then test login
async function testRegistrationAndLogin() {
  const testUser = {
    username: 'logintest',
    email: 'logintest@example.com',
    password: 'testpass123',
    role: 'candidate'
  };

  try {
    console.log('🔄 Step 1: Registering test user...');
    const regResponse = await fetch('http://localhost:4000/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const regData = await regResponse.json();
    console.log(`Registration Status: ${regResponse.status}`);
    console.log('Registration Response:', regData);

    if (regResponse.ok) {
      console.log('✅ Registration successful!');
    } else {
      console.log('⚠️ Registration failed or user exists');
    }

    console.log('\n🔄 Step 2: Testing login with registered user...');
    const loginResponse = await fetch('http://localhost:4000/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const loginData = await loginResponse.json();
    console.log(`Login Status: ${loginResponse.status}`);
    console.log('Login Response:', loginData);

    if (loginResponse.ok && loginData.token) {
      console.log('✅ Login successful!');
      console.log('🎯 Token received:', loginData.token.substring(0, 20) + '...');
    } else {
      console.log('❌ Login failed');
    }

  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testRegistrationAndLogin();
