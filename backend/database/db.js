const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-diagnosis';

class Database {
  constructor() {
    this.connected = false;
  }

  async initialize() {
    try {
      if (mongoose.connection.readyState === 1) {
        this.connected = true;
        console.log('📊 Already connected to MongoDB database');
        return;
      }

      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.connected = true;
      console.log('📊 Connected to MongoDB database');

      if (process.env.NODE_ENV !== 'production') {
        await this.seedData();
      } else {
        const userCount = await User.countDocuments();
        if (userCount === 0) {
          await this.seedData();
        }
      }
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      this.connected = false;
      if (process.env.NODE_ENV !== 'production') {
        throw error;
      }
    }
  }

  async seedData() {
    try {
      const userCount = await User.countDocuments();
      if (userCount > 0) {
        console.log('📋 Database already contains data, skipping seed');
        return;
      }

      const hashedPassword = await bcrypt.hash('demo123', 12);

      await User.create({
        email: 'admin@demo.com',
        password: hashedPassword,
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User'
      });

      const doctor = await User.create({
        email: 'doctor@demo.com',
        password: hashedPassword,
        role: 'doctor',
        firstName: 'Dr. Sarah',
        lastName: 'Johnson'
      });

      await DoctorProfile.create({
        userId: doctor._id,
        specialization: 'Internal Medicine',
        licenseNumber: 'MD12345',
        yearsOfExperience: 15,
        hospital: 'City General Hospital'
      });

      const patient = await User.create({
        email: 'patient@demo.com',
        password: hashedPassword,
        role: 'patient',
        firstName: 'John',
        lastName: 'Smith'
      });

      await PatientProfile.create({
        userId: patient._id,
        age: 35,
        gender: 'male',
        medicalHistory: 'No significant medical history',
        allergies: 'None known'
      });

      console.log('🌱 Demo data seeded successfully');
      console.log('👑 Demo Admin: admin@demo.com / demo123');
      console.log('👨‍⚕️ Demo Doctor: doctor@demo.com / demo123');
      console.log('🧑‍🦱 Demo Patient: patient@demo.com / demo123');
    } catch (error) {
      console.error('Error seeding data:', error);
    }
  }

  close() {
    if (this.connected && mongoose.connection.readyState === 1) {
      mongoose.connection.close();
      this.connected = false;
    }
  }
}

const database = new Database();
module.exports = database;
