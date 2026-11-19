// Storage keys for persistent application state
export const STORAGE_KEYS = {
  USERS: 'queueless_users',
  SESSION: 'queueless_session',
  QUEUES: 'queueless_queues',
  NOTIFICATIONS: 'queueless_notifications',
  SERVICES_STATE: 'queueless_services_state'
};

// Default seed users
export const SEED_USERS = [
  {
    id: 'user-cust-1',
    name: 'Alex Turner',
    email: 'alex.turner@example.com',
    phone: '+1 555-0199',
    password: 'Password123!',
    role: 'customer',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: 'user-admin-1',
    name: 'Officer Sarah Jenkins',
    email: 'admin@queueless.com',
    phone: '+1 555-0100',
    password: 'AdminPass123!',
    role: 'admin',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  }
];

// Default seed queues to demonstrate real statistics and live management
export const SEED_QUEUES = [
  // Active in Hospital OPD
  {
    id: 'q-101',
    tokenNumber: 'HOPD-101',
    serviceId: 'hospital-opd',
    serviceName: 'Hospital OPD',
    userId: 'user-cust-2',
    customerName: 'Marcus Vance',
    customerPhone: '+1 555-0122',
    status: 'Being Served', // QLESS-11: Being served
    counter: 'Counter 1',
    notes: 'Vitals screening and prescription renewal',
    joinedAt: new Date(Date.now() - 35 * 60000).toISOString(),
    servedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    completedAt: null,
    position: 1
  },
  {
    id: 'q-102',
    tokenNumber: 'HOPD-102',
    serviceId: 'hospital-opd',
    serviceName: 'Hospital OPD',
    userId: 'user-cust-3',
    customerName: 'Elena Rostova',
    customerPhone: '+1 555-0144',
    status: 'Waiting',
    counter: 'Counter 2',
    notes: 'Consultation with Senior Cardiologist',
    joinedAt: new Date(Date.now() - 25 * 60000).toISOString(),
    servedAt: null,
    completedAt: null,
    position: 2
  },
  {
    id: 'q-103',
    tokenNumber: 'HOPD-103',
    serviceId: 'hospital-opd',
    serviceName: 'Hospital OPD',
    userId: 'user-cust-4',
    customerName: 'Devon Miles',
    customerPhone: '+1 555-0166',
    status: 'Waiting',
    counter: 'Counter 1',
    notes: 'Follow up routine blood work',
    joinedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    servedAt: null,
    completedAt: null,
    position: 3
  },

  // Active in Bank Counter
  {
    id: 'q-201',
    tokenNumber: 'BANK-101',
    serviceId: 'bank-counter',
    serviceName: 'Bank Counter',
    userId: 'user-cust-5',
    customerName: 'Claire Redfield',
    customerPhone: '+1 555-0188',
    status: 'Being Served',
    counter: 'Counter 4',
    notes: 'Foreign currency exchange & wire transfer',
    joinedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    servedAt: new Date(Date.now() - 3 * 60000).toISOString(),
    completedAt: null,
    position: 1
  },
  {
    id: 'q-202',
    tokenNumber: 'BANK-102',
    serviceId: 'bank-counter',
    serviceName: 'Bank Counter',
    userId: 'user-cust-6',
    customerName: 'Leon Kennedy',
    customerPhone: '+1 555-0192',
    status: 'Waiting',
    counter: 'Counter 5',
    notes: 'Cash deposit and cheque book reissue',
    joinedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    servedAt: null,
    completedAt: null,
    position: 2
  },

  // Active in Passport Office
  {
    id: 'q-301',
    tokenNumber: 'PASS-101',
    serviceId: 'passport-office',
    serviceName: 'Passport Office',
    userId: 'user-cust-7',
    customerName: 'Sophia Lin',
    customerPhone: '+1 555-0133',
    status: 'Being Served',
    counter: 'Counter 7',
    notes: 'Biometrics and document verification',
    joinedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    servedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    completedAt: null,
    position: 1
  },
  {
    id: 'q-302',
    tokenNumber: 'PASS-102',
    serviceId: 'passport-office',
    serviceName: 'Passport Office',
    userId: 'user-cust-8',
    customerName: 'Liam O\'Connor',
    customerPhone: '+1 555-0177',
    status: 'Waiting',
    counter: 'Counter 8',
    notes: 'Tatkaal expedited passport renewal',
    joinedAt: new Date(Date.now() - 18 * 60000).toISOString(),
    servedAt: null,
    completedAt: null,
    position: 2
  },

  // Active in Library Desk
  {
    id: 'q-401',
    tokenNumber: 'LIB-101',
    serviceId: 'library-desk',
    serviceName: 'Library Desk',
    userId: 'user-cust-9',
    customerName: 'Amara Chen',
    customerPhone: '+1 555-0155',
    status: 'Waiting',
    counter: 'Counter 9',
    notes: 'Rare manuscript viewing request',
    joinedAt: new Date(Date.now() - 6 * 60000).toISOString(),
    servedAt: null,
    completedAt: null,
    position: 1
  },

  // Historical completed / cancelled records for Alex Turner (demonstrating customer history & stats)
  {
    id: 'q-hist-1',
    tokenNumber: 'BANK-089',
    serviceId: 'bank-counter',
    serviceName: 'Bank Counter',
    userId: 'user-cust-1', // Alex Turner
    customerName: 'Alex Turner',
    customerPhone: '+1 555-0199',
    status: 'Completed',
    counter: 'Counter 4',
    notes: 'Cheque deposit and account opening',
    joinedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    servedAt: new Date(Date.now() - 2 * 86400000 + 15 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 86400000 + 22 * 60000).toISOString(),
    position: 0
  },
  {
    id: 'q-hist-2',
    tokenNumber: 'LIB-078',
    serviceId: 'library-desk',
    serviceName: 'Library Desk',
    userId: 'user-cust-1', // Alex Turner
    customerName: 'Alex Turner',
    customerPhone: '+1 555-0199',
    status: 'Completed',
    counter: 'Counter 9',
    notes: 'Return engineering textbooks',
    joinedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    servedAt: new Date(Date.now() - 4 * 86400000 + 8 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 4 * 86400000 + 12 * 60000).toISOString(),
    position: 0
  },
  {
    id: 'q-hist-3',
    tokenNumber: 'HOPD-092',
    serviceId: 'hospital-opd',
    serviceName: 'Hospital OPD',
    userId: 'user-cust-1', // Alex Turner
    customerName: 'Alex Turner',
    customerPhone: '+1 555-0199',
    status: 'Cancelled',
    counter: 'Counter 2',
    notes: 'General physician appointment reschedule',
    joinedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    servedAt: null,
    completedAt: new Date(Date.now() - 6 * 86400000 + 10 * 60000).toISOString(),
    position: 0
  },

  // Additional historical records across all services for robust report analytics (QLESS-17)
  {
    id: 'q-hist-4',
    tokenNumber: 'PASS-055',
    serviceId: 'passport-office',
    serviceName: 'Passport Office',
    userId: 'user-cust-10',
    customerName: 'Zara Patel',
    customerPhone: '+1 555-0201',
    status: 'Completed',
    counter: 'Counter 7',
    notes: 'Biometric capture',
    joinedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    servedAt: new Date(Date.now() - 1 * 86400000 + 20 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 86400000 + 38 * 60000).toISOString(),
    position: 0
  },
  {
    id: 'q-hist-5',
    tokenNumber: 'HOPD-085',
    serviceId: 'hospital-opd',
    serviceName: 'Hospital OPD',
    userId: 'user-cust-11',
    customerName: 'Daniel Craig',
    customerPhone: '+1 555-0202',
    status: 'Completed',
    counter: 'Counter 3',
    notes: 'Orthopedic consultation',
    joinedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    servedAt: new Date(Date.now() - 1 * 86400000 + 14 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 86400000 + 26 * 60000).toISOString(),
    position: 0
  },
  {
    id: 'q-hist-6',
    tokenNumber: 'BANK-077',
    serviceId: 'bank-counter',
    serviceName: 'Bank Counter',
    userId: 'user-cust-12',
    customerName: 'Robert Langdon',
    customerPhone: '+1 555-0203',
    status: 'No-show',
    counter: 'Counter 6',
    notes: 'Locker access query',
    joinedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    servedAt: null,
    completedAt: new Date(Date.now() - 1 * 86400000 + 30 * 60000).toISOString(),
    position: 0
  },
  {
    id: 'q-hist-7',
    tokenNumber: 'LIB-064',
    serviceId: 'library-desk',
    serviceName: 'Library Desk',
    userId: 'user-cust-13',
    customerName: 'Hermione Granger',
    customerPhone: '+1 555-0204',
    status: 'Completed',
    counter: 'Counter 9',
    notes: 'Annual membership registration',
    joinedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    servedAt: new Date(Date.now() - 3 * 86400000 + 5 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 86400000 + 10 * 60000).toISOString(),
    position: 0
  },
  {
    id: 'q-hist-8',
    tokenNumber: 'HOPD-079',
    serviceId: 'hospital-opd',
    serviceName: 'Hospital OPD',
    userId: 'user-cust-14',
    customerName: 'Gregory House',
    customerPhone: '+1 555-0205',
    status: 'No-show',
    counter: 'Counter 1',
    notes: 'Diagnostics review',
    joinedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    servedAt: null,
    completedAt: new Date(Date.now() - 2 * 86400000 + 25 * 60000).toISOString(),
    position: 0
  }
];

// Seed initial notifications for Alex Turner
export const SEED_NOTIFICATIONS = [
  {
    id: 'notif-1',
    userId: 'user-cust-1',
    title: 'Service Completed',
    message: 'Your Bank Counter service has been successfully completed at Counter 4. Thank you for using Queueless!',
    type: 'success',
    read: true,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'notif-2',
    userId: 'user-cust-1',
    title: 'Queue Cancelled',
    message: 'Your token HOPD-092 for Hospital OPD was cancelled successfully.',
    type: 'warning',
    read: true,
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
  },
  {
    id: 'notif-3',
    userId: 'user-cust-1',
    title: 'Welcome to Queueless',
    message: 'Explore services and join queues remotely without standing in line!',
    type: 'info',
    read: false,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

// Initial service active/paused status (all active by default)
export const DEFAULT_SERVICES_STATE = {
  'hospital-opd': { isPaused: false, notice: '' },
  'bank-counter': { isPaused: false, notice: '' },
  'passport-office': { isPaused: false, notice: '' },
  'library-desk': { isPaused: false, notice: '' }
};

// Safe JSON local storage helpers
export const getStorageItem = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return fallback;
  }
};

export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};

