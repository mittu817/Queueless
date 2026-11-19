// QLESS-9: Define the 4 available services with prefixes and baseline configurations
export const SERVICES = [
  {
    id: 'hospital-opd',
    prefix: 'HOPD',
    name: 'Hospital OPD',
    category: 'Healthcare',
    counters: 'Counters 1 – 3',
    avgServiceTimeMinutes: 10,
    description: 'Outpatient consultation, general health check-up, vitals screening and prescription renewal.',
    icon: 'Stethoscope',
    accentColor: 'blue',
    colorClasses: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      gradient: 'from-blue-600 to-indigo-700'
    },
    sampleReasons: ['General Physician Consultation', 'Prescription Refill', 'Blood Pressure & Vitals', 'Specialist Referral']
  },
  {
    id: 'bank-counter',
    prefix: 'BANK',
    name: 'Bank Counter',
    category: 'Financial Services',
    counters: 'Counters 4 – 6',
    avgServiceTimeMinutes: 5,
    description: 'Cash deposits, cash withdrawals, cheque clearance, KYC updates and foreign exchange services.',
    icon: 'Building2',
    accentColor: 'emerald',
    colorClasses: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      gradient: 'from-emerald-600 to-teal-700'
    },
    sampleReasons: ['Cash Deposit / Withdrawal', 'Cheque Clearing', 'Account Statements / KYC', 'Demand Draft / Pay Order']
  },
  {
    id: 'passport-office',
    prefix: 'PASS',
    name: 'Passport Office',
    category: 'Civic & Government',
    counters: 'Counters 7 – 8',
    avgServiceTimeMinutes: 15,
    description: 'Biometric registration, document verification, passport reissue, Police Verification reports and visa assistance.',
    icon: 'FileCheck',
    accentColor: 'amber',
    colorClasses: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-800',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
      gradient: 'from-amber-600 to-orange-700'
    },
    sampleReasons: ['Fresh Passport Verification', 'Passport Renewal', 'Biometric & Photo Capture', 'Name / Address Change Endorsement']
  },
  {
    id: 'library-desk',
    prefix: 'LIB',
    name: 'Library Desk',
    category: 'Education & Community',
    counters: 'Counter 9',
    avgServiceTimeMinutes: 4,
    description: 'Book borrowing, returns, catalog consultations, digital archive access and study carrel reservations.',
    icon: 'BookOpen',
    accentColor: 'purple',
    colorClasses: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-800',
      button: 'bg-purple-600 hover:bg-purple-700 text-white',
      gradient: 'from-purple-600 to-indigo-700'
    },
    sampleReasons: ['Book Check-Out & Returns', 'Research Archive Assistance', 'Membership Card Renewal', 'Study Room Allocation']
  }
];

export const QUEUE_STATUSES = {
  WAITING: 'Waiting',
  SERVING: 'Being Served',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NOSHOW: 'No-show'
};

