#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');

console.log('🚀 Starting Resume Service with Auto-JWT Generation...');
console.log('='.repeat(60));

// Change to resume-service directory and start the service
const resumeServicePath = path.join(__dirname, 'resume-service');
const child = spawn('node', ['app.js'], {
  cwd: resumeServicePath,
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('❌ Failed to start Resume Service:', error);
  process.exit(1);
});

child.on('close', (code) => {
  console.log(`\n📄 Resume Service process exited with code ${code}`);
  process.exit(code);
});

// Test service after startup
setTimeout(async () => {
  try {
    console.log('\n🧪 Testing Resume Service...');
    const response = await axios.get('http://localhost:4003/auth/token');
    console.log('✅ Resume Service is ready!');
    console.log('🔑 JWT Token:', response.data.token);
    console.log('📋 Authorization Header:', response.data.authorization_header);
  } catch (error) {
    console.log('⚠️ Service test failed:', error.message);
  }
}, 5000);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Resume Service...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Resume Service...');
  child.kill('SIGTERM');
});
