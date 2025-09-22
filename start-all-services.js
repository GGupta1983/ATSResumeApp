#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const axios = require('axios');

console.log('🚀 Starting ATS Services with Auto-JWT Management...');
console.log('='.repeat(80));

let resumeServiceProcess = null;
let matchServiceProcess = null;

// Function to start Resume Service
function startResumeService() {
  return new Promise((resolve, reject) => {
    console.log('📄 Starting Resume Service...');
    
    const resumeServicePath = path.join(__dirname, 'resume-service');
    resumeServiceProcess = spawn('node', ['app.js'], {
      cwd: resumeServicePath,
      stdio: 'pipe',
      shell: true
    });

    resumeServiceProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[RESUME] ${output}`);
      
      // Check if service is ready
      if (output.includes('listening on port')) {
        console.log('✅ Resume Service started successfully');
        resolve();
      }
    });

    resumeServiceProcess.stderr.on('data', (data) => {
      console.error(`[RESUME ERROR] ${data}`);
    });

    resumeServiceProcess.on('error', (error) => {
      console.error('❌ Failed to start Resume Service:', error);
      reject(error);
    });

    resumeServiceProcess.on('close', (code) => {
      console.log(`📄 Resume Service process exited with code ${code}`);
    });
  });
}

// Function to start Match Service
function startMatchService() {
  return new Promise((resolve, reject) => {
    console.log('🎯 Starting Match Service...');
    
    const matchServicePath = path.join(__dirname, 'match-service');
    matchServiceProcess = spawn('node', ['app.js'], {
      cwd: matchServicePath,
      stdio: 'pipe',
      shell: true
    });

    matchServiceProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[MATCH] ${output}`);
      
      // Check if service is ready
      if (output.includes('listening on port')) {
        console.log('✅ Match Service started successfully');
        resolve();
      }
    });

    matchServiceProcess.stderr.on('data', (data) => {
      console.error(`[MATCH ERROR] ${data}`);
    });

    matchServiceProcess.on('error', (error) => {
      console.error('❌ Failed to start Match Service:', error);
      reject(error);
    });

    matchServiceProcess.on('close', (code) => {
      console.log(`🎯 Match Service process exited with code ${code}`);
    });
  });
}

// Function to test services and show tokens
async function testServicesAndShowTokens() {
  console.log('\n🧪 Testing Services and Fetching Tokens...');
  console.log('='.repeat(60));
  
  try {
    // Wait a bit for services to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test Resume Service and get token
    try {
      const resumeTokenResponse = await axios.get('http://localhost:4003/auth/token');
      console.log('🔑 RESUME SERVICE TOKEN:');
      console.log('   Token:', resumeTokenResponse.data.token);
      console.log('   Header:', resumeTokenResponse.data.authorization_header);
      console.log('');
    } catch (error) {
      console.log('⚠️ Could not fetch Resume Service token:', error.message);
    }

    // Test Match Service and get token
    try {
      const matchTokenResponse = await axios.get('http://localhost:4004/auth/token');
      console.log('🎯 MATCH SERVICE TOKEN:');
      console.log('   Token:', matchTokenResponse.data.token);
      console.log('   Header:', matchTokenResponse.data.authorization_header);
      console.log('   Cached:', matchTokenResponse.data.cached);
      console.log('');
    } catch (error) {
      console.log('⚠️ Could not fetch Match Service token:', error.message);
    }

    // Test health endpoints
    try {
      const resumeHealth = await axios.get('http://localhost:4003/health');
      const matchHealth = await axios.get('http://localhost:4004/health');
      
      console.log('🏥 HEALTH STATUS:');
      console.log('   Resume Service:', resumeHealth.data.status);
      console.log('   Match Service:', matchHealth.data.status);
      console.log('');
    } catch (error) {
      console.log('⚠️ Health check failed:', error.message);
    }

    console.log('🎉 All services are ready!');
    console.log('📋 Available endpoints:');
    console.log('   Resume Service: http://localhost:4003');
    console.log('   Match Service: http://localhost:4004');
    console.log('   Tokens: GET /auth/token on both services');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Service testing failed:', error.message);
  }
}

// Start services
async function startServices() {
  try {
    // Start Resume Service first (Match Service depends on it for tokens)
    await startResumeService();
    
    // Wait a bit for Resume Service to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Start Match Service
    await startMatchService();
    
    // Wait a bit for Match Service to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test services and show tokens
    await testServicesAndShowTokens();
    
  } catch (error) {
    console.error('❌ Failed to start services:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down services...');
  if (resumeServiceProcess) resumeServiceProcess.kill('SIGINT');
  if (matchServiceProcess) matchServiceProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down services...');
  if (resumeServiceProcess) resumeServiceProcess.kill('SIGTERM');
  if (matchServiceProcess) matchServiceProcess.kill('SIGTERM');
  process.exit(0);
});

// Start everything
startServices();
