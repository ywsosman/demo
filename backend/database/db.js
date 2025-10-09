const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database.sqlite');

class Database {
  constructor() {
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('📊 Connected to SQLite database');
          this.createTables()
            .then(() => {
              this.seedData()
                .then(() => resolve())
                .catch(reject);
            })
            .catch(reject);
        }
      });
    });
  }

  async createTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('patient', 'doctor')),
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Patient profiles table
      `CREATE TABLE IF NOT EXISTS patient_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        age INTEGER,
        gender TEXT CHECK(gender IN ('male', 'female', 'other')),
        medicalHistory TEXT,
        allergies TEXT,
        currentMedications TEXT,
        emergencyContact TEXT,
        FOREIGN KEY (userId) REFERENCES users (id)
      )`,
      
      // Doctor profiles table
      `CREATE TABLE IF NOT EXISTS doctor_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        specialization TEXT,
        licenseNumber TEXT,
        yearsOfExperience INTEGER,
        hospital TEXT,
        FOREIGN KEY (userId) REFERENCES users (id)
      )`,
      
      // Diagnosis sessions table
      `CREATE TABLE IF NOT EXISTS diagnosis_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientId INTEGER NOT NULL,
        symptoms TEXT NOT NULL,
        severity INTEGER CHECK(severity BETWEEN 1 AND 10),
        duration TEXT,
        additionalInfo TEXT,
        aiPrediction TEXT,
        confidence REAL,
        doctorNotes TEXT,
        doctorId INTEGER,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'closed')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patientId) REFERENCES users (id),
        FOREIGN KEY (doctorId) REFERENCES users (id)
      )`,
      
      // Medical images table
      `CREATE TABLE IF NOT EXISTS medical_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sessionId INTEGER NOT NULL,
        fileName TEXT NOT NULL,
        filePath TEXT NOT NULL,
        fileType TEXT NOT NULL,
        uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sessionId) REFERENCES diagnosis_sessions (id)
      )`,
      
      // Audit logs table
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        ipAddress TEXT,
        userAgent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id)
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }
    console.log('✅ Database tables created successfully');
  }

  async seedData() {
    // Check if we already have demo data
    const userCount = await this.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count > 0) {
      console.log('📋 Database already contains data, skipping seed');
      return;
    }

    // Create demo users
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('demo123', 10);

    // Demo doctor
    await this.run(`
      INSERT INTO users (email, password, role, firstName, lastName)
      VALUES ('doctor@demo.com', ?, 'doctor', 'Dr. Sarah', 'Johnson')
    `, [hashedPassword]);

    await this.run(`
      INSERT INTO doctor_profiles (userId, specialization, licenseNumber, yearsOfExperience, hospital)
      VALUES (1, 'Internal Medicine', 'MD12345', 15, 'City General Hospital')
    `);

    // Demo patient
    await this.run(`
      INSERT INTO users (email, password, role, firstName, lastName)
      VALUES ('patient@demo.com', ?, 'patient', 'John', 'Smith')
    `, [hashedPassword]);

    await this.run(`
      INSERT INTO patient_profiles (userId, age, gender, medicalHistory, allergies)
      VALUES (2, 35, 'male', 'No significant medical history', 'None known')
    `);

    console.log('🌱 Demo data seeded successfully');
    console.log('👨‍⚕️ Demo Doctor: doctor@demo.com / demo123');
    console.log('🧑‍🦱 Demo Patient: patient@demo.com / demo123');
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

const database = new Database();
module.exports = database;
