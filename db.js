// Queueless SQLite Database Manager (Upgraded Enterprise Edition)
// Backed by SQLite3 via node:sqlite native module
// File 'queueless.db' can be opened directly with DB Browser for SQLite (https://sqlitebrowser.org)

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'queueless.db');
const BACKUPS_DIR = path.join(__dirname, 'backups');

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

let db = null;

function getDb() {
  if (!db) {
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
    initSchema();
  }
  return db;
}

function initSchema() {
  // 1. Users Table (Customer, Staff, Admin)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      salt TEXT,
      assigned_counter TEXT,
      assigned_service TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );
  `);

  // 2. Services Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      prefix TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      counters TEXT NOT NULL,
      avg_service_time_minutes INTEGER NOT NULL,
      is_paused INTEGER NOT NULL DEFAULT 0,
      notice TEXT,
      branch_id TEXT DEFAULT 'branch-main',
      active_counters INTEGER DEFAULT 3
    );
  `);

  // 3. Branches Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  // 4. Counters Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS counters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      service_id TEXT,
      staff_id TEXT,
      branch_id TEXT DEFAULT 'branch-main',
      status TEXT NOT NULL DEFAULT 'Available',
      current_token TEXT,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
    );
  `);

  // 5. Queues Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS queues (
      id TEXT PRIMARY KEY,
      token_number TEXT UNIQUE NOT NULL,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      user_id TEXT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      status TEXT NOT NULL,
      counter TEXT,
      notes TEXT,
      priority TEXT NOT NULL DEFAULT 'Normal',
      joined_at TEXT NOT NULL,
      called_at TEXT,
      served_at TEXT,
      completed_at TEXT,
      cancellation_reason TEXT,
      position INTEGER NOT NULL DEFAULT 1,
      is_walkin INTEGER NOT NULL DEFAULT 0,
      predicted_wait_mins REAL,
      actual_wait_mins REAL,
      transferred_from TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );
  `);

  // 6. Notifications Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 7. Operating Hours Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS operating_hours (
      id TEXT PRIMARY KEY,
      day_of_week INTEGER NOT NULL,
      day_name TEXT NOT NULL,
      open_time TEXT NOT NULL,
      close_time TEXT NOT NULL,
      lunch_start TEXT,
      lunch_end TEXT,
      is_closed INTEGER NOT NULL DEFAULT 0
    );
  `);

  // 8. Holidays Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS holidays (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      notes TEXT
    );
  `);

  // 9. Customer Complaints / Feedback Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      service_id TEXT,
      token_number TEXT,
      subject TEXT NOT NULL,
      details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      resolution TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );
  `);

  // 10. Audit Activity Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      role TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  // 11. AI Accuracy Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_accuracy_logs (
      id TEXT PRIMARY KEY,
      queue_id TEXT,
      token_number TEXT,
      service_id TEXT,
      predicted_wait_mins REAL NOT NULL,
      actual_wait_mins REAL NOT NULL,
      error_mins REAL NOT NULL,
      accuracy_pct REAL NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  // 12. Healthcare Emergency Incidents Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS emergency_incidents (
      id TEXT PRIMARY KEY,
      patient_name TEXT NOT NULL,
      patient_phone TEXT,
      patient_email TEXT,
      user_id TEXT,
      service_id TEXT DEFAULT 'hospital-opd',
      location TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      severity TEXT NOT NULL DEFAULT 'Critical',
      description TEXT,
      voice_transcript TEXT,
      guardian_name TEXT,
      guardian_phone TEXT,
      guardian_notified INTEGER DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'Active',
      is_false_alarm INTEGER NOT NULL DEFAULT 0,
      false_alarm_reason TEXT,
      triggered_at TEXT NOT NULL,
      resolved_at TEXT,
      response_time_seconds INTEGER,
      staff_notes TEXT,
      resolved_by TEXT
    );
  `);

  // 13. Emergency Contacts Table (Guardians / Family)
  db.exec(`
    CREATE TABLE IF NOT EXISTS emergency_contacts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      relationship TEXT,
      phone TEXT NOT NULL,
      email TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Apply non-destructive column migrations on existing tables
  runMigrations();

  // Seed default data if empty
  seedBranches();
  seedServices();
  seedCounters();
  seedUsers();
  seedOperatingHours();
  seedHolidays();
  seedComplaints();
  seedQueuesAndNotifications();
  seedAiAccuracyLogs();
  seedEmergencyData();
}

function runMigrations() {
  const safeAddColumn = (table, colDef) => {
    try {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef};`);
    } catch (e) {
      // Column already exists - expected in SQLite
    }
  };

  safeAddColumn('users', 'salt TEXT');
  safeAddColumn('users', 'assigned_counter TEXT');
  safeAddColumn('users', 'assigned_service TEXT');
  safeAddColumn('users', 'status TEXT DEFAULT "active"');

  safeAddColumn('services', 'branch_id TEXT DEFAULT "branch-main"');
  safeAddColumn('services', 'active_counters INTEGER DEFAULT 3');

  safeAddColumn('counters', 'name TEXT');
  safeAddColumn('counters', 'staff_id TEXT');
  safeAddColumn('counters', 'branch_id TEXT DEFAULT "branch-main"');
  safeAddColumn('counters', 'status TEXT DEFAULT "Available"');
  safeAddColumn('counters', 'current_token TEXT');

  safeAddColumn('queues', 'priority TEXT DEFAULT "Normal"');
  safeAddColumn('queues', 'customer_email TEXT');
  safeAddColumn('queues', 'called_at TEXT');
  safeAddColumn('queues', 'predicted_wait_mins REAL');
  safeAddColumn('queues', 'actual_wait_mins REAL');
  safeAddColumn('queues', 'transferred_from TEXT');
  db.exec("UPDATE queues SET priority = 'Normal' WHERE priority = 'VIP';");
}

function seedBranches() {
  const check = db.prepare('SELECT COUNT(*) as count FROM branches').get();
  if (check.count === 0) {
    const insert = db.prepare(`
      INSERT INTO branches (id, name, address, phone, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    insert.run('branch-main', 'Central City Branch', '100 Metro Civic Center, Suite 101', '+1 555-0100', 1, now);
    insert.run('branch-downtown', 'Downtown Express Center', '455 Financial Square, 2nd Floor', '+1 555-0102', 1, now);
    insert.run('branch-west', 'West Wing Healthcare Hub', '88 Medical Park Blvd, Pavilion B', '+1 555-0103', 1, now);
  }
}

function seedServices() {
  const check = db.prepare('SELECT COUNT(*) as count FROM services').get();
  if (check.count === 0) {
    const insert = db.prepare(`
      INSERT INTO services (id, prefix, name, category, counters, avg_service_time_minutes, is_paused, notice, branch_id, active_counters)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const services = [
      ['hospital-opd', 'HOPD', 'Hospital OPD', 'Healthcare Services', 'Counters 1 – 3', 10, 0, '', 'branch-west', 3],
      ['bank-counter', 'BANK', 'Bank Counter', 'Financial Services', 'Counters 4 – 6', 5, 0, '', 'branch-downtown', 3],
      ['passport-office', 'PASS', 'Passport Office', 'Government Services', 'Counters 7 – 8', 15, 0, '', 'branch-main', 2],
      ['library-desk', 'LIB', 'Library Desk', 'Academic & Community', 'Counter 9', 4, 0, '', 'branch-main', 1]
    ];

    for (const s of services) {
      insert.run(...s);
    }
  }
}

function seedCounters() {
  const check = db.prepare('SELECT COUNT(*) as count FROM counters').get();
  if (check.count === 0) {
    const insert = db.prepare(`
      INSERT INTO counters (id, name, service_id, staff_id, branch_id, status, current_token)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const counters = [
      ['ctr-1', 'Counter 1 (OPD Triage)', 'hospital-opd', 'user-staff-1', 'branch-west', 'Available', 'HOPD-101'],
      ['ctr-2', 'Counter 2 (Physician Clinic)', 'hospital-opd', 'user-admin-1', 'branch-west', 'Available', null],
      ['ctr-3', 'Counter 3 (OPD Specialist)', 'hospital-opd', null, 'branch-west', 'Available', null],
      ['ctr-4', 'Counter 4 (Cash & Deposits)', 'bank-counter', 'user-staff-2', 'branch-downtown', 'Available', 'BANK-101'],
      ['ctr-5', 'Counter 5 (Forex & KYC)', 'bank-counter', null, 'branch-downtown', 'Available', null],
      ['ctr-6', 'Counter 6 (Accounts & Loans)', 'bank-counter', null, 'branch-downtown', 'Paused', null],
      ['ctr-7', 'Counter 7 (Biometrics Capture)', 'passport-office', null, 'branch-main', 'Available', 'PASS-101'],
      ['ctr-8', 'Counter 8 (Document Verification)', 'passport-office', null, 'branch-main', 'Available', null],
      ['ctr-9', 'Counter 9 (Circulation Desk)', 'library-desk', null, 'branch-main', 'Available', null]
    ];

    for (const c of counters) {
      insert.run(...c);
    }
  }
}

function seedUsers() {
  const check = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (check.count === 0) {
    const insert = db.prepare(`
      INSERT INTO users (id, name, email, phone, password, role, salt, assigned_counter, assigned_service, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Customer Persona (Alex Turner)
    insert.run(
      'user-cust-1',
      'Alex Turner',
      'alex.turner@example.com',
      '+1 555-0199',
      'Password123!',
      'customer',
      null,
      null,
      null,
      'active',
      new Date(Date.now() - 14 * 86400000).toISOString()
    );

    // Administrator Persona (Officer Sarah Jenkins)
    insert.run(
      'user-admin-1',
      'Officer Sarah Jenkins',
      'admin@queueless.com',
      '+1 555-0100',
      'AdminPass123!',
      'admin',
      null,
      'ctr-2',
      'hospital-opd',
      'active',
      new Date(Date.now() - 60 * 86400000).toISOString()
    );

    // Staff Persona (Officer David Miller - Hospital Counter 1)
    insert.run(
      'user-staff-1',
      'Officer David Miller',
      'staff@queueless.com',
      '+1 555-0111',
      'StaffPass123!',
      'staff',
      null,
      'ctr-1',
      'hospital-opd',
      'active',
      new Date(Date.now() - 30 * 86400000).toISOString()
    );

    // Staff Persona (Officer Elena Vance - Bank Counter 4)
    insert.run(
      'user-staff-2',
      'Officer Elena Vance',
      'elena@queueless.com',
      '+1 555-0112',
      'StaffPass123!',
      'staff',
      null,
      'ctr-4',
      'bank-counter',
      'active',
      new Date(Date.now() - 25 * 86400000).toISOString()
    );
  }
}

function seedOperatingHours() {
  const check = db.prepare('SELECT COUNT(*) as count FROM operating_hours').get();
  if (check.count === 0) {
    const insert = db.prepare(`
      INSERT INTO operating_hours (id, day_of_week, day_name, open_time, close_time, lunch_start, lunch_end, is_closed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const schedule = [
      ['oh-1', 1, 'Monday', '08:30', '17:30', '12:30', '13:30', 0],
      ['oh-2', 2, 'Tuesday', '08:30', '17:30', '12:30', '13:30', 0],
      ['oh-3', 3, 'Wednesday', '08:30', '17:30', '12:30', '13:30', 0],
      ['oh-4', 4, 'Thursday', '08:30', '17:30', '12:30', '13:30', 0],
      ['oh-5', 5, 'Friday', '08:30', '17:30', '12:30', '13:30', 0],
      ['oh-6', 6, 'Saturday', '09:00', '14:00', null, null, 0],
      ['oh-7', 0, 'Sunday', '00:00', '00:00', null, null, 1]
    ];

    for (const s of schedule) {
      insert.run(...s);
    }
  }
}

function seedHolidays() {
  const check = db.prepare('SELECT COUNT(*) as count FROM holidays').get();
  if (check.count === 0) {
    const insert = db.prepare(`
      INSERT INTO holidays (id, date, name, notes)
      VALUES (?, ?, ?, ?)
    `);

    insert.run('hol-1', '2026-11-26', 'Thanksgiving Holiday', 'All physical counters and intake closed.');
    insert.run('hol-2', '2026-12-25', 'Christmas Day', 'Public holiday.');
    insert.run('hol-3', '2027-01-01', 'New Year Holiday', 'Annual public closure.');
  }
}

function seedComplaints() {
  const check = db.prepare('SELECT COUNT(*) as count FROM complaints').get();
  if (check.count === 0) {
    const insert = db.prepare(`
      INSERT INTO complaints (id, user_id, customer_name, customer_phone, service_id, token_number, subject, details, status, resolution, created_at, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date();
    insert.run(
      'comp-1',
      'user-cust-1',
      'Alex Turner',
      '+1 555-0199',
      'hospital-opd',
      'HOPD-090',
      'Unexpected Wait Time Delay',
      'Physician desk had an emergency triage which increased wait time by 15 mins.',
      'Resolved',
      'Queue priority updated and notified via SMS.',
      new Date(now - 3 * 86400000).toISOString(),
      new Date(now - 2 * 86400000).toISOString()
    );

    insert.run(
      'comp-2',
      null,
      'Maria Rodriguez',
      '+1 555-0211',
      'bank-counter',
      'BANK-085',
      'Counter 6 closed without notice',
      'Counter 6 was showing in queue list but had no active staff.',
      'Pending',
      null,
      new Date(now - 1 * 86400000).toISOString(),
      null
    );
  }
}

function seedQueuesAndNotifications() {
  const check = db.prepare('SELECT COUNT(*) as count FROM queues').get();
  if (check.count === 0) {
    const insertQueue = db.prepare(`
      INSERT INTO queues (
        id, token_number, service_id, service_name, user_id, customer_name,
        customer_phone, status, counter, notes, priority, joined_at,
        called_at, served_at, completed_at, cancellation_reason, position, is_walkin,
        predicted_wait_mins, actual_wait_mins
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();

    // Past completed / cancelled tokens for Alex
    insertQueue.run(
      'q-hist-alex-1', 'BANK-088', 'bank-counter', 'Bank Counter', 'user-cust-1', 'Alex Turner', '+1 555-0199',
      'Completed', 'Counter 4', 'Deposit cash & print statement', 'Normal',
      new Date(now - 2 * 86400000).toISOString(),
      new Date(now - 2 * 86400000 + 4 * 60000).toISOString(),
      new Date(now - 2 * 86400000 + 5 * 60000).toISOString(),
      new Date(now - 2 * 86400000 + 10 * 60000).toISOString(),
      null, 0, 0, 5.0, 5.2
    );

    insertQueue.run(
      'q-hist-alex-2', 'LIB-076', 'library-desk', 'Library Desk', 'user-cust-1', 'Alex Turner', '+1 555-0199',
      'Completed', 'Counter 9', 'Study carrel renewal', 'Normal',
      new Date(now - 4 * 86400000).toISOString(),
      new Date(now - 4 * 86400000 + 3 * 60000).toISOString(),
      new Date(now - 4 * 86400000 + 4 * 60000).toISOString(),
      new Date(now - 4 * 86400000 + 8 * 60000).toISOString(),
      null, 0, 0, 4.0, 3.9
    );

    // Active queues
    insertQueue.run('q-hopd-1', 'HOPD-101', 'hospital-opd', 'Hospital OPD', null, 'Eleanor Vance', '+1 555-0104', 'Being Served', 'Counter 1', 'Blood Pressure Check', 'Normal', new Date(now - 12 * 60000).toISOString(), new Date(now - 2 * 60000).toISOString(), new Date(now - 2 * 60000).toISOString(), null, null, 1, 1, 10.0, null);
    insertQueue.run('q-hopd-2', 'HOPD-102', 'hospital-opd', 'Hospital OPD', null, 'Marcus Brody', '+1 555-0105', 'Waiting', 'Counters 1 – 3', 'Prescription Renewal', 'Elderly/Disabled', new Date(now - 9 * 60000).toISOString(), null, null, null, null, 1, 1, 8.0, null);
    insertQueue.run('q-hopd-3', 'HOPD-103', 'hospital-opd', 'Hospital OPD', null, 'Sophia Chen', '+1 555-0106', 'Waiting', 'Counters 1 – 3', 'Physician Referral', 'Normal', new Date(now - 5 * 60000).toISOString(), null, null, null, null, 2, 1, 18.0, null);

    insertQueue.run('q-bank-1', 'BANK-101', 'bank-counter', 'Bank Counter', null, 'Liam O Connor', '+1 555-0107', 'Being Served', 'Counter 4', 'Cash Deposit', 'Normal', new Date(now - 6 * 60000).toISOString(), new Date(now - 1 * 60000).toISOString(), new Date(now - 1 * 60000).toISOString(), null, null, 1, 1, 5.0, null);
    insertQueue.run('q-bank-2', 'BANK-102', 'bank-counter', 'Bank Counter', null, 'Olivia Martinez', '+1 555-0108', 'Waiting', 'Counters 4 – 6', 'Forex Exchange', 'Normal', new Date(now - 3 * 60000).toISOString(), null, null, null, null, 1, 1, 4.0, null);

    insertQueue.run('q-pass-1', 'PASS-101', 'passport-office', 'Passport Office', null, 'Noah Williams', '+1 555-0109', 'Being Served', 'Counter 7', 'Biometrics Verification', 'Normal', new Date(now - 14 * 60000).toISOString(), new Date(now - 3 * 60000).toISOString(), new Date(now - 3 * 60000).toISOString(), null, null, 1, 1, 15.0, null);
    insertQueue.run('q-pass-2', 'PASS-102', 'passport-office', 'Passport Office', null, 'Emma Davis', '+1 555-0110', 'Waiting', 'Counters 7 – 8', 'Renewal Document Scrutiny', 'Normal', new Date(now - 7 * 60000).toISOString(), null, null, null, null, 1, 1, 14.0, null);

    insertQueue.run('q-lib-1', 'LIB-101', 'library-desk', 'Library Desk', null, 'James Wilson', '+1 555-0113', 'Waiting', 'Counter 9', 'Archive Research Access', 'Normal', new Date(now - 2 * 60000).toISOString(), null, null, null, null, 1, 1, 4.0, null);

    // Seed sample notifications for Alex Turner
    const insertNotif = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertNotif.run('notif-1', 'user-cust-1', 'Service Completed', 'Your service for Bank Counter (token BANK-088) was completed successfully at Counter 4.', 'success', 1, new Date(now - 2 * 86400000).toISOString());
    insertNotif.run('notif-2', 'user-cust-1', 'Queue Cancelled', 'Your token HOPD-090 for Hospital OPD has been cancelled. Your spot was released.', 'warning', 1, new Date(now - 7 * 86400000).toISOString());
    insertNotif.run('notif-3', 'user-cust-1', 'Welcome to Queueless', 'Join virtual queues from your phone or laptop and avoid physical waiting lines!', 'info', 0, new Date(now - 14 * 86400000).toISOString());
  }
}

function seedAiAccuracyLogs() {
  const check = db.prepare('SELECT COUNT(*) as count FROM ai_accuracy_logs').get();
  if (check.count === 0) {
    const insert = db.prepare(`
      INSERT INTO ai_accuracy_logs (id, queue_id, token_number, service_id, predicted_wait_mins, actual_wait_mins, error_mins, accuracy_pct, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    const records = [
      ['acc-1', 'q-hist-alex-1', 'BANK-088', 'bank-counter', 5.0, 5.2, 0.2, 96.0, new Date(now - 2 * 86400000).toISOString()],
      ['acc-2', 'q-hist-alex-2', 'LIB-076', 'library-desk', 4.0, 3.9, 0.1, 97.5, new Date(now - 4 * 86400000).toISOString()],
      ['acc-3', 'q-hist-4', 'PASS-060', 'passport-office', 15.0, 16.1, 1.1, 92.7, new Date(now - 5 * 86400000).toISOString()],
      ['acc-4', 'q-hist-5', 'HOPD-082', 'hospital-opd', 10.0, 9.6, 0.4, 96.0, new Date(now - 6 * 86400000).toISOString()],
      ['acc-5', 'q-hist-6', 'BANK-074', 'bank-counter', 6.0, 5.8, 0.2, 96.7, new Date(now - 7 * 86400000).toISOString()]
    ];

    for (const r of records) {
      insert.run(...r);
    }
  }
}

function seedEmergencyData() {
  const check = db.prepare('SELECT COUNT(*) as count FROM emergency_incidents').get();
  if (check.count === 0) {
    const insertInc = db.prepare(`
      INSERT INTO emergency_incidents (
        id, patient_name, patient_phone, patient_email, user_id, service_id,
        location, latitude, longitude, severity, description, voice_transcript,
        guardian_name, guardian_phone, guardian_notified, status, is_false_alarm,
        false_alarm_reason, triggered_at, resolved_at, response_time_seconds, staff_notes, resolved_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    insertInc.run(
      'EMG-101', 'Eleanor Vance', '+1 555-0104', 'eleanor@example.com', null, 'hospital-opd',
      'Hospital OPD - Waiting Area A', 37.7749, -122.4194, 'Critical', 'Acute chest heaviness and shortness of breath',
      'Patient said: Difficulty breathing, need doctor at waiting area',
      'Robert Vance', '+1 555-0922', 1, 'Resolved', 0, null,
      new Date(now - 120 * 60000).toISOString(), new Date(now - 118 * 60000).toISOString(), 124,
      'Triage team arrived with ECG cart. Patient vitals stabilized.', 'Nurse Sarah Miller'
    );

    insertInc.run(
      'EMG-102', 'Marcus Brody', '+1 555-0105', 'marcus@example.com', null, 'hospital-opd',
      'Room 102 - Vitals Triage Entrance', 37.7751, -122.4196, 'High', 'Sudden dizziness and partial loss of balance',
      null, 'Helen Brody', '+1 555-0831', 1, 'Resolved', 0, null,
      new Date(now - 300 * 60000).toISOString(), new Date(now - 298 * 60000).toISOString(), 98,
      'Assisted patient to triage wheelchair. Administered glucose and vitals check.', 'Dr. Alan Grant'
    );

    insertInc.run(
      'EMG-103', 'Liam O Connor', '+1 555-0107', 'liam@example.com', null, 'hospital-opd',
      'Hospital OPD - Restroom Corridor', 37.7748, -122.4192, 'Moderate', 'SOS button triggered',
      null, null, null, 0, 'False Alarm', 1, 'Accidental screen press while placing mobile into bag',
      new Date(now - 450 * 60000).toISOString(), new Date(now - 449 * 60000).toISOString(), 42,
      'Verified with patient on scene. No medical distress.', 'Officer David Miller'
    );
  }

  const checkCont = db.prepare('SELECT COUNT(*) as count FROM emergency_contacts').get();
  if (checkCont.count === 0) {
    const insertCont = db.prepare(`
      INSERT INTO emergency_contacts (id, user_id, name, relationship, phone, email, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    insertCont.run('em-cont-alex', 'user-cust-1', 'Sarah Turner', 'Spouse', '+1 555-0199', 'sarah.turner@example.com', now);
  }
}

// ==========================================
// USER & STAFF REPOSITORIES
// ==========================================

function getUserByEmail(email) {
  const d = getDb();
  return d.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
}

function getUserById(id) {
  const d = getDb();
  return d.prepare('SELECT id, name, email, phone, role, salt, assigned_counter, assigned_service, status, created_at FROM users WHERE id = ?').get(id);
}

function createUser({ id, name, email, phone, password, role = 'customer', salt = null, assigned_counter = null, assigned_service = null, status = 'active' }) {
  const d = getDb();
  const insert = d.prepare(`
    INSERT INTO users (id, name, email, phone, password, role, salt, assigned_counter, assigned_service, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date().toISOString();
  insert.run(id, name.trim(), email.trim().toLowerCase(), phone.trim(), password, role, salt, assigned_counter, assigned_service, status, now);
  return getUserById(id);
}

function updateUser(id, updates = {}) {
  if (!id) return null;
  const d = getDb();
  const allowed = ['name', 'phone', 'password', 'salt', 'role', 'assigned_counter', 'assigned_service', 'status'];
  const fields = [];
  const params = [];

  for (const field of allowed) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = ?`);
      params.push(updates[field] === null ? null : (typeof updates[field] === 'string' ? updates[field].trim() : updates[field]));
    }
  }

  if (fields.length > 0) {
    params.push(id);
    d.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }

  return getUserById(id);
}

function getAllStaff() {
  const d = getDb();
  return d.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.role, u.assigned_counter, u.assigned_service, u.status, u.created_at,
           c.name as counter_name, s.name as service_name
    FROM users u
    LEFT JOIN counters c ON u.assigned_counter = c.id
    LEFT JOIN services s ON u.assigned_service = s.id
    WHERE u.role IN ('staff', 'admin')
    ORDER BY u.created_at ASC
  `).all();
}

function deleteStaff(id) {
  const d = getDb();
  return d.prepare("DELETE FROM users WHERE id = ? AND role IN ('staff', 'admin')").run(id);
}

// ==========================================
// SERVICES REPOSITORY (FULL CRUD)
// ==========================================

function getServices() {
  const d = getDb();
  return d.prepare('SELECT * FROM services ORDER BY name ASC').all();
}

function getServiceById(id) {
  const d = getDb();
  return d.prepare('SELECT * FROM services WHERE id = ?').get(id);
}

function createService({ id, prefix, name, category, counters, avg_service_time_minutes, branch_id = 'branch-main', active_counters = 3, notice = '' }) {
  const d = getDb();
  const insert = d.prepare(`
    INSERT INTO services (id, prefix, name, category, counters, avg_service_time_minutes, is_paused, notice, branch_id, active_counters)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
  `);
  insert.run(id, prefix.toUpperCase().trim(), name.trim(), category.trim(), counters.trim(), avg_service_time_minutes, notice || '', branch_id, active_counters);
  return getServiceById(id);
}

function updateService(id, updates = {}) {
  if (!id) return null;
  const d = getDb();
  const allowed = ['prefix', 'name', 'category', 'counters', 'avg_service_time_minutes', 'is_paused', 'notice', 'branch_id', 'active_counters'];
  const fields = [];
  const params = [];

  for (const field of allowed) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = ?`);
      params.push(updates[field] === null ? null : updates[field]);
    }
  }

  if (fields.length > 0) {
    params.push(id);
    d.prepare(`UPDATE services SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }

  return getServiceById(id);
}

function deleteService(id) {
  const d = getDb();
  return d.prepare('DELETE FROM services WHERE id = ?').run(id);
}

function updateServiceState(id, isPaused, notice = '') {
  const d = getDb();
  d.prepare('UPDATE services SET is_paused = ?, notice = ? WHERE id = ?').run(isPaused ? 1 : 0, notice || '', id);
  return getServiceById(id);
}

// ==========================================
// BRANCHES REPOSITORY
// ==========================================

function getBranches() {
  const d = getDb();
  return d.prepare('SELECT * FROM branches ORDER BY name ASC').all();
}

function createBranch({ id, name, address, phone = '', is_active = 1 }) {
  const d = getDb();
  const now = new Date().toISOString();
  d.prepare(`
    INSERT INTO branches (id, name, address, phone, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name.trim(), address.trim(), phone.trim(), is_active ? 1 : 0, now);
  return d.prepare('SELECT * FROM branches WHERE id = ?').get(id);
}

function updateBranch(id, updates = {}) {
  if (!id) return null;
  const d = getDb();
  const allowed = ['name', 'address', 'phone', 'is_active'];
  const fields = [];
  const params = [];

  for (const field of allowed) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = ?`);
      params.push(updates[field] === null ? null : updates[field]);
    }
  }

  if (fields.length > 0) {
    params.push(id);
    d.prepare(`UPDATE branches SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }

  return d.prepare('SELECT * FROM branches WHERE id = ?').get(id);
}

function deleteBranch(id) {
  if (!id) return null;
  const d = getDb();
  return d.prepare('DELETE FROM branches WHERE id = ?').run(id);
}

// ==========================================
// COUNTERS REPOSITORY
// ==========================================

function getCounters() {
  const d = getDb();
  return d.prepare(`
    SELECT c.id,
           COALESCE(c.counter_name, c.counter_number, c.id) as name,
           COALESCE(c.counter_number, c.id) as counter_number,
           c.service_id,
           COALESCE(c.staff_id, c.current_staff_id) as staff_id,
           c.branch_id,
           c.status,
           COALESCE(c.current_token, c.current_token_id) as current_token,
           s.name as service_name,
           u.name as staff_name,
           b.name as branch_name
    FROM counters c
    LEFT JOIN services s ON c.service_id = s.id
    LEFT JOIN users u ON COALESCE(c.staff_id, c.current_staff_id) = u.id
    LEFT JOIN branches b ON c.branch_id = b.id
    ORDER BY c.id ASC
  `).all();
}

function getCounterById(id) {
  const d = getDb();
  return d.prepare(`
    SELECT c.id,
           COALESCE(c.counter_name, c.counter_number, c.id) as name,
           COALESCE(c.counter_number, c.id) as counter_number,
           c.service_id,
           COALESCE(c.staff_id, c.current_staff_id) as staff_id,
           c.branch_id,
           c.status,
           COALESCE(c.current_token, c.current_token_id) as current_token,
           s.name as service_name,
           u.name as staff_name,
           b.name as branch_name
    FROM counters c
    LEFT JOIN services s ON c.service_id = s.id
    LEFT JOIN users u ON COALESCE(c.staff_id, c.current_staff_id) = u.id
    LEFT JOIN branches b ON c.branch_id = b.id
    WHERE c.id = ?
  `).get(id);
}

function createCounter({ id, name, service_id = null, staff_id = null, branch_id = 'branch-main', status = 'Available' }) {
  const d = getDb();
  d.prepare(`
    INSERT INTO counters (id, counter_number, counter_name, service_id, staff_id, current_staff_id, branch_id, status, current_token, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
  `).run(id, name.trim(), name.trim(), service_id ?? null, staff_id ?? null, staff_id ?? null, branch_id ?? 'branch-main', status, new Date().toISOString());
  return getCounterById(id);
}

function updateCounter(id, updates = {}) {
  if (!id) return null;
  const d = getDb();
  const allowed = ['name', 'counter_name', 'counter_number', 'service_id', 'staff_id', 'current_staff_id', 'branch_id', 'status', 'current_token', 'current_token_id'];
  const fields = [];
  const params = [];

  for (const field of allowed) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = ?`);
      params.push(updates[field] === null ? null : updates[field]);
    }
  }

  if (fields.length > 0) {
    params.push(id);
    d.prepare(`UPDATE counters SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }

  return getCounterById(id);
}

function updateCounterStatus(id, status, currentToken = null) {
  if (!id) return null;
  const d = getDb();
  d.prepare(`
    UPDATE counters 
    SET status = ?, 
        current_token = ?,
        current_token_id = ?
    WHERE id = ?
  `).run(status || 'Available', currentToken ?? null, currentToken ?? null, id);
  return getCounterById(id);
}

// ==========================================
// QUEUES REPOSITORY
// ==========================================

function getAllQueues() {
  const d = getDb();
  return d.prepare('SELECT * FROM queues ORDER BY joined_at ASC').all();
}

function getQueueEntryById(id) {
  const d = getDb();
  return d.prepare('SELECT * FROM queues WHERE id = ?').get(id);
}

function getActiveQueueByUserId(userId) {
  const d = getDb();
  return d.prepare(`
    SELECT * FROM queues 
    WHERE user_id = ? AND status IN ('Waiting', 'Being Served')
    LIMIT 1
  `).get(userId);
}

function getQueueEntryByTokenNumber(tokenNumber) {
  const d = getDb();
  return d.prepare('SELECT * FROM queues WHERE token_number = ?').get(tokenNumber);
}

function createQueueEntry(data) {
  const d = getDb();
  const insert = d.prepare(`
    INSERT INTO queues (
      id, token_number, service_id, service_name, user_id, customer_name,
      customer_phone, customer_email, status, counter, notes, priority, joined_at, called_at, served_at,
      completed_at, cancellation_reason, position, is_walkin, predicted_wait_mins,
      actual_wait_mins, transferred_from
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    data.id,
    data.token_number,
    data.service_id,
    data.service_name,
    data.user_id ?? null,
    data.customer_name ?? null,
    data.customer_phone ?? null,
    data.customer_email ?? null,
    data.status ?? 'Waiting',
    data.counter ?? null,
    data.notes ?? null,
    data.priority ?? 'Normal',
    data.joined_at,
    data.called_at ?? null,
    data.served_at ?? null,
    data.completed_at ?? null,
    data.cancellation_reason ?? null,
    data.position ?? 1,
    data.is_walkin ? 1 : 0,
    data.predicted_wait_mins ?? null,
    data.actual_wait_mins ?? null,
    data.transferred_from ?? null
  );

  return getQueueEntryById(data.id);
}

function updateQueueStatus(id, updates = {}) {
  if (!id) return null;
  const d = getDb();
  const allowed = [
    'status', 'served_at', 'called_at', 'completed_at', 'cancellation_reason',
    'position', 'counter', 'notes', 'priority', 'predicted_wait_mins',
    'actual_wait_mins', 'transferred_from', 'service_id', 'service_name', 'joined_at'
  ];
  const fields = [];
  const params = [];

  for (const field of allowed) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = ?`);
      params.push(updates[field] === null ? null : updates[field]);
    }
  }

  if (fields.length > 0) {
    params.push(id);
    d.prepare(`UPDATE queues SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }

  return getQueueEntryById(id);
}

function updateQueuePriority(id, priority) {
  if (!id) return null;
  const d = getDb();
  d.prepare('UPDATE queues SET priority = ? WHERE id = ?').run(priority || 'Normal', id);
  const entry = getQueueEntryById(id);
  if (entry) {
    recomputeServicePositions(entry.service_id);
  }
  return entry;
}

function recomputeServicePositions(serviceId) {
  if (!serviceId) return;
  const d = getDb();
  // Urgent & Elderly/Disabled priorities are ordered first, followed by joined_at
  const waiting = d.prepare(`
    SELECT id, priority FROM queues 
    WHERE service_id = ? AND status = 'Waiting' 
    ORDER BY 
      CASE priority
        WHEN 'Urgent' THEN 1
        WHEN 'Elderly/Disabled' THEN 2
        ELSE 3
      END ASC,
      joined_at ASC
  `).all(serviceId);

  const update = d.prepare('UPDATE queues SET position = ? WHERE id = ?');
  waiting.forEach((row, idx) => {
    if (row && row.id) {
      update.run(idx + 1, row.id);
    }
  });
}

// ==========================================
// OPERATING HOURS & HOLIDAYS REPOSITORY
// ==========================================

function getOperatingHours() {
  const d = getDb();
  return d.prepare('SELECT * FROM operating_hours ORDER BY day_of_week ASC').all();
}

function updateOperatingHours(hoursArray) {
  const d = getDb();
  const stmt = d.prepare(`
    UPDATE operating_hours
    SET open_time = ?, close_time = ?, lunch_start = ?, lunch_end = ?, is_closed = ?
    WHERE day_of_week = ?
  `);
  hoursArray.forEach(h => {
    stmt.run(h.open_time, h.close_time, h.lunch_start ?? null, h.lunch_end ?? null, h.is_closed ? 1 : 0, h.day_of_week);
  });
  return getOperatingHours();
}

function getHolidays() {
  const d = getDb();
  return d.prepare('SELECT * FROM holidays ORDER BY date ASC').all();
}

function addHoliday({ id, date, name, notes = '' }) {
  const d = getDb();
  d.prepare('INSERT INTO holidays (id, date, name, notes) VALUES (?, ?, ?, ?)').run(id, date, name, notes ?? '');
  return d.prepare('SELECT * FROM holidays WHERE id = ?').get(id);
}

function deleteHoliday(id) {
  const d = getDb();
  return d.prepare('DELETE FROM holidays WHERE id = ?').run(id);
}

// ==========================================
// COMPLAINTS & FEEDBACK REPOSITORY
// ==========================================

function getComplaints() {
  const d = getDb();
  return d.prepare('SELECT * FROM complaints ORDER BY created_at DESC').all();
}

function createComplaint({ id, user_id, customer_name, customer_phone, service_id, token_number, subject, details }) {
  const d = getDb();
  const now = new Date().toISOString();
  d.prepare(`
    INSERT INTO complaints (id, user_id, customer_name, customer_phone, service_id, token_number, subject, details, status, resolution, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NULL, ?, NULL)
  `).run(id, user_id ?? null, customer_name, customer_phone, service_id ?? null, token_number ?? null, subject, details, now);
  return d.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
}

function updateComplaintStatus(id, status, resolution = '') {
  const d = getDb();
  const now = status === 'Resolved' ? new Date().toISOString() : null;
  d.prepare('UPDATE complaints SET status = ?, resolution = ?, resolved_at = ? WHERE id = ?').run(status, resolution, now, id);
  return d.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
}

// ==========================================
// ACTIVITY LOGS REPOSITORY (AUDIT TRAIL)
// ==========================================

function logActivity({ userId, userName, role, action, details, ipAddress = '127.0.0.1' }) {
  try {
    const d = getDb();
    const id = `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();
    d.prepare(`
      INSERT INTO activity_logs (id, user_id, user_name, role, action, details, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId ?? null, userName ?? 'System', role ?? 'system', action, details ?? '', ipAddress, now);
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
}

function getActivityLogs(limit = 100) {
  const d = getDb();
  return d.prepare('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ?').all(limit);
}

// ==========================================
// AI ACCURACY LOGS REPOSITORY
// ==========================================

function logAiAccuracy({ queueId, tokenNumber, serviceId, predictedWaitMins, actualWaitMins, errorMins, accuracyPct }) {
  try {
    const d = getDb();
    const id = `acc-${Date.now()}`;
    const now = new Date().toISOString();
    d.prepare(`
      INSERT INTO ai_accuracy_logs (id, queue_id, token_number, service_id, predicted_wait_mins, actual_wait_mins, error_mins, accuracy_pct, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, queueId ?? null, tokenNumber ?? null, serviceId ?? null, predictedWaitMins, actualWaitMins, errorMins, accuracyPct, now);
  } catch (err) {
    console.error('Failed to log AI accuracy:', err.message);
  }
}

function getAiAccuracyLogs(limit = 50) {
  const d = getDb();
  return d.prepare('SELECT * FROM ai_accuracy_logs ORDER BY timestamp DESC LIMIT ?').all(limit);
}

function getAiAccuracySummary() {
  const d = getDb();
  const row = d.prepare(`
    SELECT COUNT(*) as count,
           AVG(error_mins) as mae,
           AVG(accuracy_pct) as avg_accuracy
    FROM ai_accuracy_logs
  `).get();

  return {
    count: row.count || 0,
    mae: row.mae ? Math.round(row.mae * 10) / 10 : 0.8,
    avgAccuracy: row.avg_accuracy ? Math.round(row.avg_accuracy * 10) / 10 : 96.2
  };
}

// ==========================================
// NOTIFICATIONS REPOSITORY
// ==========================================

function getNotificationsByUserId(userId) {
  const d = getDb();
  return d.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

function createNotification({ id, user_id, title, message, type = 'info' }) {
  const d = getDb();
  const now = new Date().toISOString();
  d.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `).run(id, user_id ?? null, title, message, type, now);
  return d.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
}

function markNotificationAsRead(id) {
  const d = getDb();
  d.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
}

function markAllNotificationsAsRead(userId) {
  const d = getDb();
  d.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId);
}

function clearNotificationsByUserId(userId) {
  const d = getDb();
  d.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
}

// ==========================================
// HEALTHCARE EMERGENCY & SOS REPOSITORY
// ==========================================

function createEmergencyIncident(data) {
  const d = getDb();
  const id = data.id || `EMG-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();
  
  const insert = d.prepare(`
    INSERT INTO emergency_incidents (
      id, patient_name, patient_phone, patient_email, user_id, service_id,
      location, latitude, longitude, severity, description, voice_transcript,
      guardian_name, guardian_phone, guardian_notified, status, is_false_alarm,
      false_alarm_reason, triggered_at, resolved_at, response_time_seconds, staff_notes, resolved_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    id,
    data.patient_name || 'Emergency Patient',
    data.patient_phone || '',
    data.patient_email || '',
    data.user_id ?? null,
    data.service_id || 'hospital-opd',
    data.location || 'Hospital OPD - Waiting Area A',
    data.latitude ?? null,
    data.longitude ?? null,
    data.severity || 'Critical',
    data.description || 'Emergency assistance requested via Queueless SOS',
    data.voice_transcript ?? null,
    data.guardian_name ?? null,
    data.guardian_phone ?? null,
    data.guardian_notified ? 1 : (data.guardian_phone ? 1 : 0),
    data.status || 'Active',
    data.is_false_alarm ? 1 : 0,
    data.false_alarm_reason ?? null,
    data.triggered_at || now,
    data.resolved_at ?? null,
    data.response_time_seconds ?? null,
    data.staff_notes ?? null,
    data.resolved_by ?? null
  );

  return getEmergencyIncidentById(id);
}

function getEmergencyIncidents(filters = {}) {
  const d = getDb();
  let sql = 'SELECT * FROM emergency_incidents';
  const params = [];

  if (filters.status) {
    sql += ' WHERE status = ?';
    params.push(filters.status);
  } else if (filters.activeOnly) {
    sql += " WHERE status IN ('Active', 'Responding')";
  }

  sql += ' ORDER BY triggered_at DESC';

  if (filters.limit) {
    sql += ' LIMIT ?';
    params.push(filters.limit);
  }

  return d.prepare(sql).all(...params);
}

function getEmergencyIncidentById(id) {
  const d = getDb();
  return d.prepare('SELECT * FROM emergency_incidents WHERE id = ?').get(id);
}

function updateEmergencyIncidentStatus(id, updates = {}) {
  const d = getDb();
  const entry = getEmergencyIncidentById(id);
  if (!entry) return null;

  const now = new Date().toISOString();
  let responseTime = entry.response_time_seconds;
  if ((updates.status === 'Resolved' || updates.status === 'False Alarm') && !responseTime) {
    const diff = Math.max(1, Math.round((new Date(now).getTime() - new Date(entry.triggered_at).getTime()) / 1000));
    responseTime = diff;
  }

  const dUpdates = {
    status: updates.status || entry.status,
    is_false_alarm: updates.is_false_alarm !== undefined ? (updates.is_false_alarm ? 1 : 0) : entry.is_false_alarm,
    false_alarm_reason: updates.false_alarm_reason !== undefined ? updates.false_alarm_reason : entry.false_alarm_reason,
    staff_notes: updates.staff_notes !== undefined ? updates.staff_notes : entry.staff_notes,
    resolved_by: updates.resolved_by !== undefined ? updates.resolved_by : entry.resolved_by,
    resolved_at: (updates.status === 'Resolved' || updates.status === 'False Alarm') ? (entry.resolved_at || now) : entry.resolved_at,
    response_time_seconds: responseTime
  };

  d.prepare(`
    UPDATE emergency_incidents SET
      status = ?, is_false_alarm = ?, false_alarm_reason = ?, staff_notes = ?,
      resolved_by = ?, resolved_at = ?, response_time_seconds = ?
    WHERE id = ?
  `).run(
    dUpdates.status, dUpdates.is_false_alarm, dUpdates.false_alarm_reason,
    dUpdates.staff_notes, dUpdates.resolved_by, dUpdates.resolved_at,
    dUpdates.response_time_seconds, id
  );

  return getEmergencyIncidentById(id);
}

function getEmergencyAnalytics() {
  const d = getDb();
  const incidents = d.prepare('SELECT * FROM emergency_incidents ORDER BY triggered_at DESC').all();

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const totalAll = incidents.length;
  const totalToday = incidents.filter(i => i.triggered_at.startsWith(todayStr)).length;
  const activeCount = incidents.filter(i => i.status === 'Active' || i.status === 'Responding').length;
  const resolvedValid = incidents.filter(i => i.status === 'Resolved' && !i.is_false_alarm);
  const falseAlarmCount = incidents.filter(i => i.is_false_alarm === 1 || i.status === 'False Alarm').length;
  const falseAlarmRate = totalAll > 0 ? Math.round((falseAlarmCount / totalAll) * 1000) / 10 : 0;

  let totalResponseSecs = 0;
  resolvedValid.forEach(i => {
    if (i.response_time_seconds) totalResponseSecs += i.response_time_seconds;
  });
  const avgResponseTimeSeconds = resolvedValid.length > 0 ? Math.round(totalResponseSecs / resolvedValid.length) : 110;

  // By Severity
  const bySeverity = {
    Critical: incidents.filter(i => i.severity === 'Critical').length,
    High: incidents.filter(i => i.severity === 'High').length,
    Moderate: incidents.filter(i => i.severity === 'Moderate').length
  };

  // By Location
  const byLocation = {};
  incidents.forEach(i => {
    const loc = i.location.split(' - ')[0] || i.location;
    byLocation[loc] = (byLocation[loc] || 0) + 1;
  });

  return {
    totalAll,
    totalToday,
    activeCount,
    resolvedCount: resolvedValid.length,
    falseAlarmCount,
    falseAlarmRate,
    avgResponseTimeSeconds,
    avgResponseTimeFormatted: `${Math.floor(avgResponseTimeSeconds / 60)}m ${avgResponseTimeSeconds % 60}s`,
    bySeverity,
    byLocation,
    recentIncidents: incidents.slice(0, 15)
  };
}

function getEmergencyContacts(userId) {
  const d = getDb();
  return d.prepare('SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

function saveEmergencyContact({ id, user_id, name, relationship, phone, email }) {
  const d = getDb();
  const contactId = id || `emc-${Date.now()}`;
  const now = new Date().toISOString();
  
  d.prepare(`
    INSERT INTO emergency_contacts (id, user_id, name, relationship, phone, email, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(contactId, user_id, name, relationship || 'Guardian', phone, email || '', now);

  return d.prepare('SELECT * FROM emergency_contacts WHERE id = ?').get(contactId);
}

function deleteEmergencyContact(id) {
  const d = getDb();
  return d.prepare('DELETE FROM emergency_contacts WHERE id = ?').run(id);
}

// ==========================================
// BACKUPS & STATS
// ==========================================

function createDatabaseBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `queueless_backup_${timestamp}.sqlite`;
  const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

  fs.copyFileSync(DB_PATH, backupFilePath);
  const stats = fs.statSync(backupFilePath);

  return {
    fileName: backupFileName,
    filePath: backupFilePath,
    sizeBytes: stats.size,
    sizeKb: (stats.size / 1024).toFixed(2),
    timestamp: new Date().toISOString()
  };
}

function listBackups() {
  if (!fs.existsSync(BACKUPS_DIR)) return [];
  const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.sqlite') || f.endsWith('.db'));
  return files.map(file => {
    const fullPath = path.join(BACKUPS_DIR, file);
    const stats = fs.statSync(fullPath);
    return {
      fileName: file,
      sizeKb: (stats.size / 1024).toFixed(2),
      createdAt: stats.birthtime.toISOString()
    };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getDatabaseStats() {
  const d = getDb();
  const stats = fs.statSync(DB_PATH);

  const userCount = d.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const queueCount = d.prepare('SELECT COUNT(*) as c FROM queues').get().c;
  const serviceCount = d.prepare('SELECT COUNT(*) as c FROM services').get().c;
  const counterCount = d.prepare('SELECT COUNT(*) as c FROM counters').get().c;
  const branchCount = d.prepare('SELECT COUNT(*) as c FROM branches').get().c;
  const complaintCount = d.prepare('SELECT COUNT(*) as c FROM complaints').get().c;
  const logCount = d.prepare('SELECT COUNT(*) as c FROM activity_logs').get().c;

  return {
    filePath: DB_PATH,
    fileName: path.basename(DB_PATH),
    fileSizeBytes: stats.size,
    fileSizeKb: (stats.size / 1024).toFixed(2),
    tables: {
      users: userCount,
      queues: queueCount,
      services: serviceCount,
      counters: counterCount,
      branches: branchCount,
      complaints: complaintCount,
      activity_logs: logCount
    },
    engine: 'SQLite 3 via node:sqlite',
    compatibility: 'DB Browser for SQLite (https://sqlitebrowser.org)'
  };
}

module.exports = {
  getDb,
  DB_PATH,
  BACKUPS_DIR,
  // User & Staff
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  getAllStaff,
  deleteStaff,
  // Services
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  updateServiceState,
  // Branches
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  // Counters
  getCounters,
  getCounterById,
  createCounter,
  updateCounter,
  updateCounterStatus,
  // Queues
  getAllQueues,
  getQueueEntryById,
  getQueueEntryByTokenNumber,
  getActiveQueueByUserId,
  createQueueEntry,
  updateQueueStatus,
  updateQueuePriority,
  recomputeServicePositions,
  // Operating Hours & Holidays
  getOperatingHours,
  updateOperatingHours,
  getHolidays,
  addHoliday,
  deleteHoliday,
  // Complaints
  getComplaints,
  createComplaint,
  updateComplaintStatus,
  // Activity Logs
  logActivity,
  getActivityLogs,
  // AI Accuracy
  logAiAccuracy,
  getAiAccuracyLogs,
  getAiAccuracySummary,
  // Notifications
  getNotificationsByUserId,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotificationsByUserId,
  // Healthcare Emergency & SOS
  createEmergencyIncident,
  getEmergencyIncidents,
  getEmergencyIncidentById,
  updateEmergencyIncidentStatus,
  getEmergencyAnalytics,
  getEmergencyContacts,
  saveEmergencyContact,
  deleteEmergencyContact,
  // Backups & Stats
  createDatabaseBackup,
  listBackups,
  getDatabaseStats
};
