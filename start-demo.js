#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🏥 Starting MediDiagnose Demo System...\n');

// Check if node_modules exist
const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
const frontendNodeModules = path.join(__dirname, 'frontend', 'node_modules');

if (!fs.existsSync(backendNodeModules) || !fs.existsSync(frontendNodeModules)) {
  console.log('📦 Installing dependencies...');
  console.log('This may take a few minutes on first run.\n');
  
  const install = spawn('npm', ['run', 'install-all'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  install.on('close', (code) => {
    if (code === 0) {
      startServers();
    } else {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
  });
} else {
  startServers();
}

function startServers() {
  console.log('🚀 Starting development servers...\n');
  
  // Start backend server
  console.log('📊 Starting backend API server on http://localhost:5000');
  const backend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'backend'),
    shell: true
  });

  backend.stdout.on('data', (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);
  });

  backend.stderr.on('data', (data) => {
    console.error(`[Backend Error] ${data.toString().trim()}`);
  });

  // Wait a moment then start frontend
  setTimeout(() => {
    console.log('🎨 Starting frontend React app on http://localhost:3000');
    const frontend = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'frontend'),
      shell: true
    });

    frontend.stdout.on('data', (data) => {
      console.log(`[Frontend] ${data.toString().trim()}`);
    });

    frontend.stderr.on('data', (data) => {
      console.error(`[Frontend Error] ${data.toString().trim()}`);
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down servers...');
      backend.kill();
      frontend.kill();
      process.exit(0);
    });

    // Show success message after a delay
    setTimeout(() => {
      console.log('\n✅ MediDiagnose Demo System is running!');
      console.log('\n📱 Open your browser and navigate to:');
      console.log('   Frontend: http://localhost:3000');
      console.log('   Backend API: http://localhost:5000/api/health');
      console.log('\n👥 Demo Accounts:');
      console.log('   Doctor: doctor@demo.com / demo123');
      console.log('   Patient: patient@demo.com / demo123');
      console.log('\n🛑 Press Ctrl+C to stop the servers');
    }, 3000);

  }, 2000);
}
