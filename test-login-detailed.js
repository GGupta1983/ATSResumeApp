// Test login with existing users from database
async function testLogin() {
  const users = [
    { email: 'test@example.com', password: 'password123' }, // Known user
    { email: 'test@example.com', password: 'wrongpass' },   // Wrong password
    { email: 'Ruhi1983@gmail.com', password: 'password123' }, // Try with existing user
  ];

  for (const user of users) {
    try {
      console.log(`\n🔍 Testing login: ${user.email}`);
      
      const response = await fetch('http://localhost:4000/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });

      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Response:`, data);
      
      if (response.ok && data.token) {
        console.log('✅ Login successful!');
      } else {
        console.log('❌ Login failed');
      }
      
    } catch (error) {
      console.log('❌ Network error:', error.message);
    }
  }
}

testLogin();
