#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Testing MediDiagnose Backend Setup...\n');

// Check if backend files exist
const requiredFiles = [
  'backend/package.json',
  'backend/server.js',
  'backend/database/db.js',
  'backend/routes/auth.js',
  'backend/routes/diagnosis.js',
  'backend/models/aiModel.js'
];

let allFilesExist = true;

console.log('📋 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please check the project structure.');
  process.exit(1);
}

console.log('\n📦 Checking package.json dependencies...');

try {
  const backendPackage = JSON.parse(fs.readFileSync(path.join(__dirname, 'backend/package.json'), 'utf8'));
  const requiredDeps = [
    'express', 'cors', 'bcryptjs', 'jsonwebtoken', 
    'sqlite3', 'helmet', 'dotenv', 'joi'
  ];
  
  requiredDeps.forEach(dep => {
    if (backendPackage.dependencies[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allFilesExist = false;
    }
  });

  if (allFilesExist) {
    console.log('\n✅ Backend setup appears to be complete!');
    console.log('\n🚀 You can now run:');
    console.log('   node start-demo.js');
    console.log('   or');
    console.log('   npm run dev');
  } else {
    console.log('\n❌ Some dependencies are missing. Run: npm install');
  }

} catch (error) {
  console.log('\n❌ Error reading package.json:', error.message);
}

console.log('\n📝 Demo Accounts Ready:');
console.log('   👨‍⚕️ Doctor: doctor@demo.com / demo123');
console.log('   🧑‍🦱 Patient: patient@demo.com / demo123');
