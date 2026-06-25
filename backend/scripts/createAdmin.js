
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb:

const email = (process.argv[2] || process.env.ADMIN_EMAIL || 'admin@medidiagnose.com').toLowerCase().trim();
const password = process.argv[3] || process.env.ADMIN_PASSWORD || 'Admin@12345';
const firstName = process.argv[4] || process.env.ADMIN_FIRST_NAME || 'Admin';
const lastName = process.argv[5] || process.env.ADMIN_LAST_NAME || 'User';

(async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 8000,
    });
    console.log('📊 Connected to MongoDB');

    const hashedPassword = await bcrypt.hash(password, 12);
    const existing = await User.findOne({ email });

    if (existing) {
      existing.password = hashedPassword;
      existing.role = 'admin';
      existing.firstName = firstName;
      existing.lastName = lastName;
      await existing.save();
      console.log(`✅ Existing user promoted to admin: ${email}`);
    } else {
      await User.create({ email, password: hashedPassword, role: 'admin', firstName, lastName });
      console.log(`✅ Admin user created: ${email}`);
    }

    console.log('------------------------------------------');
    console.log('  Admin login');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log('------------------------------------------');
  } catch (err) {
    console.error('❌ Failed to create admin:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
})();
