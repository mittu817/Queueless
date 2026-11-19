// Queueless Data Layer & Reactive Store
// Connected directly to SQLite database (queueless.db) via backend REST API
// Fully compatible with DB Browser for SQLite (https://sqlitebrowser.org)

(function() {
  const API_BASE = window.location.origin.includes('localhost') ? window.location.origin : 'http://localhost:3001';

  const STORAGE_KEYS = {
    SESSION: 'queueless_session',
    USERS: 'queueless_users',
    QUEUES: 'queueless_queues',
    NOTIFICATIONS: 'queueless_notifications',
    SERVICES_STATE: 'queueless_services_state',
    SIMULATION: 'queueless_simulation_active'
  };

  const SERVICES = [
    {
      id: 'hospital-opd',
      prefix: 'HOPD',
      name: 'Hospital OPD',
      category: 'Healthcare Services',
      counters: 'Counters 1 – 3',
      avgServiceTimeMinutes: 10,
      description: 'General outpatient clinic, physician diagnosis, vitals checkup and prescription refill.',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      iconName: 'stethoscope',
      gradient: 'from-blue-600 to-indigo-700',
      sampleReasons: ['General Physician Consultation', 'Prescription Refill', 'Blood Pressure & Vitals', 'Specialist Referral']
    },
    {
      id: 'bank-counter',
      prefix: 'BANK',
      name: 'Bank Counter',
      category: 'Financial Services',
      counters: 'Counters 4 – 6',
      avgServiceTimeMinutes: 5,
      description: 'Cash deposits, withdrawals, demand draft issuance, cheque clearing and KYC verification.',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconName: 'landmark',
      gradient: 'from-emerald-600 to-teal-700',
      sampleReasons: ['Cash Deposit / Withdrawal', 'Cheque Clearance', 'Account Statements / KYC', 'Demand Draft / Pay Order']
    },
    {
      id: 'passport-office',
      prefix: 'PASS',
      name: 'Passport Office',
      category: 'Government Services',
      counters: 'Counters 7 – 8',
      avgServiceTimeMinutes: 15,
      description: 'Biometric capture, document scrutiny, fresh passport applications and police verification check.',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      iconName: 'file-badge-2',
      gradient: 'from-amber-600 to-orange-700',
      sampleReasons: ['Fresh Passport Verification', 'Passport Renewal', 'Biometric & Photo Capture', 'Address Change Endorsement']
    },
    {
      id: 'library-desk',
      prefix: 'LIB',
      name: 'Library Desk',
      category: 'Academic & Community',
      counters: 'Counter 9',
      avgServiceTimeMinutes: 4,
      description: 'Book checkout, return processing, digital archive access and study carrel allocation.',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      iconName: 'book-open',
      gradient: 'from-purple-600 to-indigo-700',
      sampleReasons: ['Book Check-Out & Returns', 'Research Archive Assistance', 'Membership Card Renewal', 'Study Room Allocation']
    }
  ];

  const QUEUE_STATUSES = {
    WAITING: 'Waiting',
    SERVING: 'Being Served',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NOSHOW: 'No-show'
  };

  const SEED_USERS = [
    {
      id: 'user-cust-1',
      name: 'Alex Turner',
      email: 'alex.turner@example.com',
      phone: '+1 555-0199',
      password: 'Password123!',
      role: 'customer',
      createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
    },
    {
      id: 'user-admin-1',
      name: 'Officer Sarah Jenkins',
      email: 'admin@queueless.com',
      phone: '+1 555-0100',
      password: 'AdminPass123!',
      role: 'admin',
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString()
    }
  ];

  function loadLocal(key, fallback) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveLocal(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  class QueuelessStore {
    constructor() {
      this.listeners = [];
      this.users = loadLocal(STORAGE_KEYS.USERS, SEED_USERS);
      this.currentUser = loadLocal(STORAGE_KEYS.SESSION, null);
      this.queues = loadLocal(STORAGE_KEYS.QUEUES, []);
      this.notifications = loadLocal(STORAGE_KEYS.NOTIFICATIONS, []);
      this.servicesState = loadLocal(STORAGE_KEYS.SERVICES_STATE, {
        'hospital-opd': { isPaused: false, notice: '' },
        'bank-counter': { isPaused: false, notice: '' },
        'passport-office': { isPaused: false, notice: '' },
        'library-desk': { isPaused: false, notice: '' }
      });
      this.dbStats = null;
      this.isOnlineWithSqlite = false;
      this.isSimulationActive = loadLocal(STORAGE_KEYS.SIMULATION, false);
      this.simulationTimer = null;

      // Healthcare Emergency & Accessibility State
      this.emergencyIncidents = [];
      this.emergencyAnalytics = null;
      this.emergencyContacts = [];
      this.activeEmergencyAlert = null;
      this.isAccessibilityMode = loadLocal('queueless_accessibility_mode', false);
      this.isHighContrast = loadLocal('queueless_high_contrast', false);
      this.offlineEmergencyQueue = loadLocal('queueless_offline_emergency_queue', []);

      if (this.isAccessibilityMode || this.isHighContrast) {
        setTimeout(() => this.applyAccessibilityStyles(), 50);
      }

      window.addEventListener('online', () => {
        this.syncOfflineEmergencies();
      });

      setInterval(() => {
        if (this.offlineEmergencyQueue.length > 0 && navigator.onLine) {
          this.syncOfflineEmergencies();
        }
      }, 3500);

      // Initial synchronization with SQLite database
      this.syncWithSqlite();

      if (this.isSimulationActive) {
        this.startSimulation();
      }
    }

    subscribe(fn) {
      this.listeners.push(fn);
      return () => {
        this.listeners = this.listeners.filter(l => l !== fn);
      };
    }

    notify() {
      this.listeners.forEach(fn => {
        try { fn(); } catch (e) { console.error('Store listener error:', e); }
      });
    }

    async syncWithSqlite() {
      try {
        const [statusRes, queuesRes, srvRes, emgRes, emgAnalyticRes] = await Promise.all([
          fetch(`${API_BASE}/api/db-status`).catch(() => null),
          fetch(`${API_BASE}/api/queues`).catch(() => null),
          fetch(`${API_BASE}/api/services`).catch(() => null),
          fetch(`${API_BASE}/api/emergency/incidents`).catch(() => null),
          fetch(`${API_BASE}/api/emergency/analytics`).catch(() => null)
        ]);

        if (statusRes && statusRes.ok) {
          const statusData = await statusRes.json();
          this.dbStats = statusData.database;
          this.isOnlineWithSqlite = true;
        }

        if (emgRes && emgRes.ok) {
          const emgData = await emgRes.json();
          if (emgData.incidents) {
            this.emergencyIncidents = emgData.incidents;
          }
        }

        if (emgAnalyticRes && emgAnalyticRes.ok) {
          const emgAnalyticData = await emgAnalyticRes.json();
          if (emgAnalyticData.analytics) {
            this.emergencyAnalytics = emgAnalyticData.analytics;
          }
        }

        if (queuesRes && queuesRes.ok) {
          const queuesData = await queuesRes.json();
          if (queuesData.queues && queuesData.queues.length > 0) {
            this.queues = queuesData.queues.map(q => ({
              id: q.id,
              tokenNumber: q.token_number,
              serviceId: q.service_id,
              serviceName: q.service_name,
              userId: q.user_id,
              customerName: q.customer_name,
              customerPhone: q.customer_phone,
              customerEmail: q.customer_email,
              status: q.status,
              counter: q.counter,
              notes: q.notes,
              priority: q.priority || 'Normal',
              joinedAt: q.joined_at,
              servedAt: q.served_at,
              completedAt: q.completed_at,
              cancellationReason: q.cancellation_reason,
              position: q.position,
              isWalkIn: !!q.is_walkin,
              predictedWaitMins: q.predicted_wait_mins,
              actualWaitMins: q.actual_wait_mins,
              transferredFrom: q.transferred_from
            }));
            saveLocal(STORAGE_KEYS.QUEUES, this.queues);
          }
        }

        if (srvRes && srvRes.ok) {
          const srvData = await srvRes.json();
          if (srvData.services) {
            this.backendServices = srvData.services;
            srvData.services.forEach(s => {
              this.servicesState[s.id] = {
                isPaused: !!s.is_paused,
                notice: s.notice || '',
                activeCounters: s.active_counters || 3,
                avgServiceTimeMinutes: s.avg_service_time_minutes || 5
              };
            });
            saveLocal(STORAGE_KEYS.SERVICES_STATE, this.servicesState);
          }
        }

        if (this.currentUser) {
          this.fetchUserNotifications(this.currentUser.id);
        }

        this.notify();
      } catch (err) {
        console.warn('SQLite Sync fallback to local cache:', err);
      }
    }

    async fetchUserNotifications(userId) {
      try {
        const res = await fetch(`${API_BASE}/api/notifications?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          this.notifications = data.notifications.map(n => ({
            id: n.id,
            userId: n.user_id,
            title: n.title,
            message: n.message,
            type: n.type,
            read: !!n.read,
            createdAt: n.created_at
          }));
          saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
          this.notify();
        }
      } catch (e) {}
    }

    // ==========================================
    // SPRINT 1: USER REGISTRATION & LOGIN (SQLITE)
    // ==========================================

    async registerUser(userData) {
      const { name, email, phone, password, confirmPassword } = userData;

      // Client validation
      if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
        return { success: false, error: 'All fields are required.' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      const digits = phone.replace(/\D/g, '');
      if (digits.length < 7) {
        return { success: false, error: 'Phone number must have at least 7 digits.' };
      }

      if (password.length < 6 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return { success: false, error: 'Password must have at least 6 characters, an uppercase letter, and a number.' };
      }

      if (password !== confirmPassword) {
        return { success: false, error: 'Passwords do not match.' };
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password, confirmPassword })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Registration failed.' };
        }

        // Add to local state & sync
        this.users.push(data.user);
        saveLocal(STORAGE_KEYS.USERS, this.users);
        this.syncWithSqlite();

        return { success: true, user: data.user };
      } catch (netErr) {
        // Fallback local registration if server unreachable
        const duplicate = this.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (duplicate) {
          return { success: false, error: 'An account with this email address already exists.' };
        }

        const newUser = {
          id: `user-cust-${Date.now()}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          role: 'customer',
          createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        saveLocal(STORAGE_KEYS.USERS, this.users);
        return { success: true, user: newUser };
      }
    }

    async registerStaffUser(staffData) {
      const { name, email, phone, department, staffPasscode, password, confirmPassword } = staffData;

      if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
        return { success: false, error: 'All fields are required.' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return { success: false, error: 'Please enter a valid work email address.' };
      }

      const digits = phone.replace(/\D/g, '');
      if (digits.length < 7) {
        return { success: false, error: 'Work phone number must have at least 7 digits.' };
      }

      if (password.length < 6 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return { success: false, error: 'Staff password must have at least 6 characters, an uppercase letter, and a number.' };
      }

      if (password !== confirmPassword) {
        return { success: false, error: 'Passwords do not match.' };
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/register-staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, department, staffPasscode, password, confirmPassword })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Staff registration failed.' };
        }

        this.users.push(data.user);
        saveLocal(STORAGE_KEYS.USERS, this.users);
        this.syncWithSqlite();

        return { success: true, user: data.user };
      } catch (netErr) {
        const officerName = name.trim().startsWith('Officer') ? name.trim() : `Officer ${name.trim()}`;
        const newStaff = {
          id: `user-staff-${Date.now()}`,
          name: officerName,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          role: 'admin',
          createdAt: new Date().toISOString()
        };

        this.users.push(newStaff);
        saveLocal(STORAGE_KEYS.USERS, this.users);
        return { success: true, user: newStaff };
      }
    }

    async loginUser(email, password) {
      if (!email?.trim() || !password) {
        return { success: false, error: 'Please enter email and password.' };
      }

      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Invalid credentials.' };
        }

        this.currentUser = data.user;
        saveLocal(STORAGE_KEYS.SESSION, this.currentUser);
        this.fetchUserNotifications(this.currentUser.id);
        this.notify();

        return { success: true, user: this.currentUser };
      } catch (err) {
        // Fallback local check
        const found = this.users.find(
          u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
        );
        if (!found) {
          return { success: false, error: 'Invalid email address or password.' };
        }

        this.currentUser = {
          id: found.id,
          name: found.name,
          email: found.email,
          phone: found.phone,
          role: found.role,
          createdAt: found.createdAt
        };
        saveLocal(STORAGE_KEYS.SESSION, this.currentUser);
        this.notify();
        return { success: true, user: this.currentUser };
      }
    }

    logoutUser() {
      this.currentUser = null;
      saveLocal(STORAGE_KEYS.SESSION, null);
      this.notify();
    }

    async updateProfile(profileData) {
      if (!this.currentUser) return { success: false, error: 'No user active.' };

      try {
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.currentUser.id,
            email: this.currentUser.email,
            ...profileData
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Update failed.' };
        }

        this.currentUser = { ...this.currentUser, name: data.user.name, phone: data.user.phone };
        saveLocal(STORAGE_KEYS.SESSION, this.currentUser);
        this.syncWithSqlite();
        return { success: true, user: this.currentUser };
      } catch (err) {
        // Fallback
        this.currentUser.name = profileData.name;
        this.currentUser.phone = profileData.phone;
        saveLocal(STORAGE_KEYS.SESSION, this.currentUser);
        this.notify();
        return { success: true };
      }
    }

    // ==========================================
    // SPRINT 2: VIRTUAL QUEUE OPERATIONS (SQLITE)
    // ==========================================

    getActiveQueue() {
      if (this.currentUser) {
        const found = this.getActiveQueueForUser(this.currentUser.id);
        if (found) return found;
      }
      const savedTokenId = loadLocal('queueless_active_token_id', null);
      if (savedTokenId) {
        const found = this.queues.find(q => q.id === savedTokenId && (q.status === 'Waiting' || q.status === 'Being Served'));
        if (found) return found;
      }
      return null;
    }

    getActiveQueueForUser(userId) {
      if (!userId && !this.currentUser) return null;
      const targetId = userId || (this.currentUser ? this.currentUser.id : null);
      const targetEmail = this.currentUser && this.currentUser.email ? this.currentUser.email.toLowerCase() : null;

      return this.queues.find(q => {
        const matchesUser = targetId && q.userId === targetId;
        const matchesEmail = targetEmail && q.customerEmail && q.customerEmail.toLowerCase() === targetEmail;
        return (matchesUser || matchesEmail) && (q.status === 'Waiting' || q.status === 'Being Served');
      }) || null;
    }

    async joinQueue(param1, param2 = '', param3 = 'Normal') {
      let serviceId, name, email, phone, notes, priority;

      if (typeof param1 === 'object') {
        serviceId = param1.serviceId;
        name = param1.name;
        email = param1.email;
        phone = param1.phone;
        notes = param1.notes || 'Standard consultation';
        priority = param1.priority || 'Normal';
      } else {
        serviceId = param1;
        notes = param2 || 'Standard consultation';
        priority = param3 || 'Normal';
        name = this.currentUser ? this.currentUser.name : '';
        email = this.currentUser ? this.currentUser.email : '';
        phone = this.currentUser ? this.currentUser.phone : '';
      }

      try {
        const res = await fetch(`${API_BASE}/api/queues/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId,
            userId: this.currentUser ? this.currentUser.id : null,
            customerName: name || (this.currentUser ? this.currentUser.name : ''),
            customerEmail: email || (this.currentUser ? this.currentUser.email : ''),
            customerPhone: phone || (this.currentUser ? this.currentUser.phone : ''),
            notes,
            priority
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          if (data.activeToken) {
            await this.syncWithSqlite();
          }
          return {
            success: false,
            error: data.error || 'Could not join queue.',
            activeToken: data.activeToken
          };
        }

        // Auto authenticate customer profile returned from backend
        if (data.user) {
          this.currentUser = data.user;
          saveLocal(STORAGE_KEYS.SESSION, this.currentUser);
        }

        if (data.token) {
          saveLocal('queueless_active_token_id', data.token.id);
        }

        await this.syncWithSqlite();

        const formattedToken = {
          id: data.token.id,
          tokenNumber: data.token.token_number,
          serviceId: data.token.service_id,
          serviceName: data.token.service_name,
          userId: data.token.user_id,
          customerName: data.token.customer_name,
          customerEmail: data.token.customer_email,
          customerPhone: data.token.customer_phone,
          status: data.token.status,
          counter: data.token.counter,
          notes: data.token.notes,
          priority: data.token.priority || priority,
          joinedAt: data.token.joined_at,
          position: data.token.position,
          predictedWaitMins: data.token.predicted_wait_mins
        };

        if (window.soundManager) window.soundManager.playSuccess();

        return {
          success: true,
          token: formattedToken,
          aiPrediction: data.aiPrediction
        };
      } catch (err) {
        console.error('joinQueue API error:', err);
        return { success: false, error: err.message || 'Network error while joining queue.' };
      }
    }

    async leaveQueue(tokenId, reason = 'Customer cancelled remotely') {
      try {
        const res = await fetch(`${API_BASE}/api/queues/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId, reason })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Failed to leave queue.' };
        }

        if (window.soundManager) window.soundManager.playWarning();
        this.syncWithSqlite();
        return { success: true };
      } catch (err) {
        const entry = this.queues.find(q => q.id === tokenId);
        if (entry) {
          entry.status = 'Cancelled';
          entry.completedAt = new Date().toISOString();
          entry.cancellationReason = reason;
          saveLocal(STORAGE_KEYS.QUEUES, this.queues);
          this.notify();
        }
        return { success: true };
      }
    }

    // ==========================================
    // SPRINT 3: TRACKING & NOTIFICATIONS
    // ==========================================

    getTrackingDetails(tokenId) {
      const entry = this.queues.find(q => q.id === tokenId);
      if (!entry) return null;

      const service = SERVICES.find(s => s.id === entry.serviceId);
      const avgMinutes = service ? service.avgServiceTimeMinutes : 5;

      let position = 0;
      let peopleAhead = 0;
      let estimatedWaitMinutes = 0;
      let aiResult = null;

      if (entry.status === 'Being Served') {
        position = 1;
        peopleAhead = 0;
        estimatedWaitMinutes = 0;
      } else if (entry.status === 'Waiting') {
        const waitingList = this.queues
          .filter(q => q.serviceId === entry.serviceId && q.status === 'Waiting')
          .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));

        const index = waitingList.findIndex(q => q.id === entry.id);
        position = index !== -1 ? index + 1 : entry.position;

        const isSomeoneServing = this.queues.some(
          q => q.serviceId === entry.serviceId && q.status === 'Being Served'
        );

        peopleAhead = (isSomeoneServing ? 1 : 0) + Math.max(0, position - 1);

        // Deep Learning AI Wait Prediction with 7 Factors
        const activeCounters = service ? (service.active_counters || 3) : 3;
        if (window.QueuelessAI && window.QueuelessAI.aiEngine) {
          aiResult = window.QueuelessAI.aiEngine.calculateEstimatedWait({
            peopleAhead,
            avgServiceTime: avgMinutes,
            activeCounters,
            counterAvailability: 0.85,
            serviceId: service ? service.id : 'hospital-opd',
            priority: entry.priority || 'Normal'
          });
          estimatedWaitMinutes = aiResult.estimatedMinutes;
        } else {
          estimatedWaitMinutes = Math.max(1, Math.round((peopleAhead * avgMinutes) / activeCounters));
        }
      }

      const isTurnApproaching = entry.status === 'Waiting' && position <= 2;
      const isNowServing = entry.status === 'Being Served';

      return {
        entry,
        service,
        position,
        peopleAhead,
        estimatedWaitMinutes,
        aiResult,
        isTurnApproaching,
        isNowServing,
        status: entry.status
      };
    }

    async markNotificationAsRead(id) {
      try {
        await fetch(`${API_BASE}/api/notifications/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
      } catch (e) {}

      const notif = this.notifications.find(n => n.id === id);
      if (notif) notif.read = true;
      saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
      this.notify();
    }

    async markAllNotificationsAsRead(userId) {
      try {
        await fetch(`${API_BASE}/api/notifications/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
      } catch (e) {}

      this.notifications.forEach(n => {
        if (n.userId === userId) n.read = true;
      });
      saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
      this.notify();
    }

    async clearNotifications(userId) {
      try {
        await fetch(`${API_BASE}/api/notifications/clear`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
      } catch (e) {}

      this.notifications = this.notifications.filter(n => n.userId !== userId);
      saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
      this.notify();
    }

    // ==========================================
    // SPRINT 4: ADMIN OPERATIONS (SQLITE)
    // ==========================================

    getUserQueueHistory(userId) {
      if (!userId) return [];
      return this.queues
        .filter(q => q.userId === userId)
        .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
    }

    async callNextCustomer(serviceId) {
      try {
        const res = await fetch(`${API_BASE}/api/admin/call-next`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceId })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Failed to advance queue.' };
        }

        if (window.soundManager) window.soundManager.playCounterCall();
        this.syncWithSqlite();
        return { success: true, customer: data.customer };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    async completeCustomerService(tokenId) {
      try {
        const res = await fetch(`${API_BASE}/api/admin/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Failed to complete.' };
        }

        if (window.soundManager) window.soundManager.playSuccess();
        this.syncWithSqlite();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    async markCustomerNoShow(tokenId) {
      try {
        const res = await fetch(`${API_BASE}/api/admin/no-show`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Failed to mark no-show.' };
        }

        if (window.soundManager) window.soundManager.playWarning();
        this.syncWithSqlite();
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    async toggleServicePause(serviceId, reason = '') {
      try {
        const res = await fetch(`${API_BASE}/api/admin/toggle-pause`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceId, notice: reason })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Failed to toggle pause.' };
        }

        this.syncWithSqlite();
        return { success: true, isPaused: data.isPaused };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    async addWalkInCustomer(serviceId, name, phone, notes = 'Walk-in visitor') {
      try {
        const res = await fetch(`${API_BASE}/api/queues/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId,
            userId: null,
            customerName: name,
            customerPhone: phone || 'On-Premises Walk-in',
            notes: notes || 'Walk-in customer'
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Failed to create walk-in.' };
        }

        if (window.soundManager) window.soundManager.playSuccess();
        this.syncWithSqlite();
        return { success: true, token: data.token };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    getReportsData(serviceFilter = 'all', dateRange = 'all') {
      let filtered = [...this.queues];

      if (serviceFilter !== 'all') {
        filtered = filtered.filter(q => q.serviceId === serviceFilter);
      }

      const now = Date.now();
      if (dateRange === 'today') {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        filtered = filtered.filter(q => new Date(q.joinedAt) >= startOfDay);
      } else if (dateRange === '7days') {
        const sevenDaysAgo = new Date(now - 7 * 86400000);
        filtered = filtered.filter(q => new Date(q.joinedAt) >= sevenDaysAgo);
      }

      const totalTotal = filtered.length;
      const completedList = filtered.filter(q => q.status === 'Completed');
      const waitingList = filtered.filter(q => q.status === 'Waiting');
      const servingList = filtered.filter(q => q.status === 'Being Served');
      const cancelledList = filtered.filter(q => q.status === 'Cancelled');
      const noShowList = filtered.filter(q => q.status === 'No-show');

      let totalWaitMinutes = 0;
      let countWithWait = 0;

      filtered.forEach(q => {
        if (q.servedAt && q.joinedAt) {
          const diffMs = new Date(q.servedAt) - new Date(q.joinedAt);
          if (diffMs > 0) {
            totalWaitMinutes += Math.round(diffMs / 60000);
            countWithWait++;
          }
        } else if (q.completedAt && q.joinedAt && q.status === 'Completed') {
          const diffMs = new Date(q.completedAt) - new Date(q.joinedAt);
          if (diffMs > 0) {
            totalWaitMinutes += Math.round(diffMs / 60000);
            countWithWait++;
          }
        }
      });

      const avgWaitTimeMinutes = countWithWait > 0 ? Math.round(totalWaitMinutes / countWithWait) : 8;

      const serviceBreakdown = SERVICES.map(srv => {
        const srvQueues = filtered.filter(q => q.serviceId === srv.id);
        const srvCompleted = srvQueues.filter(q => q.status === 'Completed').length;
        const srvWaiting = srvQueues.filter(q => q.status === 'Waiting').length;
        const srvServing = srvQueues.filter(q => q.status === 'Being Served').length;
        const srvCancelled = srvQueues.filter(q => q.status === 'Cancelled').length;
        const srvNoShow = srvQueues.filter(q => q.status === 'No-show').length;

        let srvWaitTotal = 0;
        let srvCount = 0;
        srvQueues.forEach(q => {
          if (q.servedAt && q.joinedAt) {
            const diff = new Date(q.servedAt) - new Date(q.joinedAt);
            if (diff > 0) {
              srvWaitTotal += Math.round(diff / 60000);
              srvCount++;
            }
          }
        });
        const srvAvgWait = srvCount > 0 ? Math.round(srvWaitTotal / srvCount) : srv.avgServiceTimeMinutes;

        return {
          service: srv,
          total: srvQueues.length,
          completed: srvCompleted,
          waiting: srvWaiting,
          serving: srvServing,
          cancelled: srvCancelled,
          noshow: srvNoShow,
          avgWait: srvAvgWait
        };
      });

      return {
        totalTotal,
        totalServed: completedList.length,
        totalWaiting: waitingList.length,
        totalServing: servingList.length,
        totalCancelled: cancelledList.length,
        totalNoShow: noShowList.length,
        avgWaitTimeMinutes,
        serviceBreakdown
      };
    }

    toggleSimulation() {
      this.isSimulationActive = !this.isSimulationActive;
      if (this.isSimulationActive) {
        this.startSimulation();
      } else {
        this.stopSimulation();
      }
      saveLocal(STORAGE_KEYS.SIMULATION, this.isSimulationActive);
      this.notify();
      return this.isSimulationActive;
    }

    startSimulation() {
      if (this.simulationTimer) clearInterval(this.simulationTimer);
      this.simulationTimer = setInterval(() => {
        if (!this.isSimulationActive) return;
        const randomService = SERVICES[Math.floor(Math.random() * SERVICES.length)];
        const waiting = this.queues.filter(
          q => q.serviceId === randomService.id && q.status === 'Waiting'
        );

        if (waiting.length > 0 && Math.random() > 0.4) {
          this.callNextCustomer(randomService.id);
        }
      }, 14000);
    }

    // ==========================================
    // ENTERPRISE STAFF OPERATIONS (ONESTQ-STYLE)
    // ==========================================

    async staffCallNext({ serviceId, counterId }) {
      try {
        const staff = this.currentUser;
        const res = await fetch(`${API_BASE}/api/staff/call-next`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId,
            counterId,
            staffId: staff ? staff.id : null,
            staffName: staff ? staff.name : 'Officer'
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Failed to call next token.' };
        }
        if (window.soundManager) window.soundManager.playDingDong();
        await this.syncWithSqlite();
        return { success: true, customer: data.customer };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    async staffRecall({ tokenId, counterId }) {
      try {
        const staff = this.currentUser;
        const res = await fetch(`${API_BASE}/api/staff/recall`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenId,
            counterId,
            staffName: staff ? staff.name : 'Officer'
          })
        });
        const data = await res.json();
        if (res.ok && window.soundManager) window.soundManager.playChime();
        return data;
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    async staffComplete({ tokenId, counterId, notes = '' }) {
      try {
        const staff = this.currentUser;
        const res = await fetch(`${API_BASE}/api/staff/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenId,
            counterId,
            staffName: staff ? staff.name : 'Officer',
            notes
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (window.soundManager) window.soundManager.playSuccess();
          await this.syncWithSqlite();
        }
        return data;
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    async staffSkip({ tokenId, reason = '' }) {
      try {
        const res = await fetch(`${API_BASE}/api/staff/skip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId, reason })
        });
        const data = await res.json();
        if (res.ok && data.success) await this.syncWithSqlite();
        return data;
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    async staffNoShow({ tokenId, counterId }) {
      try {
        const res = await fetch(`${API_BASE}/api/staff/no-show`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId, counterId })
        });
        const data = await res.json();
        if (res.ok && data.success) await this.syncWithSqlite();
        return data;
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    async staffPauseCounter({ counterId, isPaused }) {
      try {
        const res = await fetch(`${API_BASE}/api/staff/pause-counter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ counterId, isPaused })
        });
        return await res.json();
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    async staffTransfer({ tokenId, targetServiceId, targetCounter, reason }) {
      try {
        const res = await fetch(`${API_BASE}/api/staff/transfer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenId, targetServiceId, targetCounter, reason })
        });
        const data = await res.json();
        if (res.ok && data.success) await this.syncWithSqlite();
        return data;
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // ==========================================
    // SUPER ADMIN APIS
    // ==========================================

    async fetchAdminDashboardStats() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/dashboard-stats`);
        const data = await res.json();
        return data.stats;
      } catch (err) {
        return null;
      }
    }

    async fetchCounters() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/counters`);
        const data = await res.json();
        return data.counters || [];
      } catch (err) {
        return [];
      }
    }

    async fetchBranches() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/branches`);
        const data = await res.json();
        return data.branches || [];
      } catch (err) {
        return [];
      }
    }

    async fetchStaffList() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/staff`);
        const data = await res.json();
        return data.staff || [];
      } catch (err) {
        return [];
      }
    }

    async fetchOperatingHours() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/operating-hours`);
        const data = await res.json();
        return data.hours || [];
      } catch (err) {
        return [];
      }
    }

    async fetchHolidays() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/holidays`);
        const data = await res.json();
        return data.holidays || [];
      } catch (err) {
        return [];
      }
    }

    async fetchComplaints() {
      try {
        const res = await fetch(`${API_BASE}/api/complaints`);
        const data = await res.json();
        return data.complaints || [];
      } catch (err) {
        return [];
      }
    }

    async fetchActivityLogs() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/activity-logs`);
        const data = await res.json();
        return data.logs || [];
      } catch (err) {
        return [];
      }
    }

    async fetchAiAccuracy() {
      try {
        const res = await fetch(`${API_BASE}/api/ai/accuracy`);
        return await res.json();
      } catch (err) {
        return null;
      }
    }

    async fetchAiRushHours(serviceId = 'hospital-opd') {
      try {
        const res = await fetch(`${API_BASE}/api/ai/rush-hours?serviceId=${encodeURIComponent(serviceId)}`);
        return await res.json();
      } catch (err) {
        return null;
      }
    }

    async adminCreateService(data) {
      const res = await fetch(`${API_BASE}/api/admin/services/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      await this.syncWithSqlite();
      return json;
    }

    async adminUpdateService(id, data) {
      const res = await fetch(`${API_BASE}/api/admin/services/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      });
      const json = await res.json();
      await this.syncWithSqlite();
      return json;
    }

    async adminDeleteService(id) {
      const res = await fetch(`${API_BASE}/api/admin/services/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      await this.syncWithSqlite();
      return json;
    }

    async adminCreateBranch(data) {
      const res = await fetch(`${API_BASE}/api/admin/branches/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    }

    async adminCreateCounter(data) {
      const res = await fetch(`${API_BASE}/api/admin/counters/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    }

    async adminUpdateCounter(id, data) {
      const res = await fetch(`${API_BASE}/api/admin/counters/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      });
      return await res.json();
    }

    async adminUpdateStaff(id, data) {
      const res = await fetch(`${API_BASE}/api/admin/staff/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      });
      return await res.json();
    }

    async adminDeleteStaff(id) {
      const res = await fetch(`${API_BASE}/api/admin/staff/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      return await res.json();
    }

    async adminUpdateQueuePriority(tokenId, priority) {
      const res = await fetch(`${API_BASE}/api/admin/queues/priority`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId, priority })
      });
      const json = await res.json();
      await this.syncWithSqlite();
      return json;
    }

    async adminCreateManualToken(data) {
      const res = await fetch(`${API_BASE}/api/admin/queues/manual-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      await this.syncWithSqlite();
      return json;
    }

    async adminUpdateOperatingHours(hours) {
      const res = await fetch(`${API_BASE}/api/admin/operating-hours`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours })
      });
      return await res.json();
    }

    async adminCreateHoliday(data) {
      const res = await fetch(`${API_BASE}/api/admin/holidays/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    }

    async adminDeleteHoliday(id) {
      const res = await fetch(`${API_BASE}/api/admin/holidays/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      return await res.json();
    }

    async adminResolveComplaint(id, resolution) {
      const res = await fetch(`${API_BASE}/api/admin/complaints/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, resolution })
      });
      return await res.json();
    }

    async customerSubmitComplaint(data) {
      const res = await fetch(`${API_BASE}/api/complaints/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    }

    async adminCreateBackup() {
      const res = await fetch(`${API_BASE}/api/admin/backup/create`, {
        method: 'POST'
      });
      return await res.json();
    }

    async adminListBackups() {
      const res = await fetch(`${API_BASE}/api/admin/backups`);
      const data = await res.json();
      return data.backups || [];
    }

    // ==========================================
    // HEALTHCARE EMERGENCY & ACCESSIBILITY MODULE
    // ==========================================

    async triggerEmergencySOS(data) {
      const payload = {
        id: `EMG-${Math.floor(1000 + Math.random() * 9000)}`,
        patientName: data.patientName || (this.currentUser ? this.currentUser.name : 'Emergency Patient'),
        patientPhone: data.patientPhone || (this.currentUser ? this.currentUser.phone : ''),
        patientEmail: data.patientEmail || (this.currentUser ? this.currentUser.email : ''),
        userId: this.currentUser ? this.currentUser.id : null,
        serviceId: data.serviceId || 'hospital-opd',
        location: data.location || 'Hospital OPD - Waiting Area A',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        severity: data.severity || 'Critical',
        description: data.description || 'Emergency assistance requested via Queueless SOS',
        voiceTranscript: data.voiceTranscript || null,
        guardianName: data.guardianName || null,
        guardianPhone: data.guardianPhone || null,
        triggered_at: new Date().toISOString()
      };

      // Sound siren & trigger haptic feedback
      if (window.soundManager) {
        window.soundManager.playEmergencySiren();
        if (this.isAccessibilityMode) {
          window.soundManager.speakVoice(`Emergency alert dispatched. Medical team alerted for ${payload.location}.`);
        }
      }
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }

      // Offline detection
      if (!navigator.onLine) {
        this.offlineEmergencyQueue.push(payload);
        saveLocal('queueless_offline_emergency_queue', this.offlineEmergencyQueue);
        this.activeEmergencyAlert = payload;
        this.notify();
        return {
          success: true,
          isOffline: true,
          incident: payload,
          message: 'Saved to Offline Emergency Buffer. Will auto-retry transmission every 3 seconds.'
        };
      }

      try {
        const res = await fetch(`${API_BASE}/api/emergency/sos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const resData = await res.json();
        if (res.ok && resData.success) {
          this.activeEmergencyAlert = resData.incident;
          this.emergencyIncidents.unshift(resData.incident);
          this.syncWithSqlite();
          return {
            success: true,
            isOffline: false,
            incident: resData.incident,
            guardianNotified: resData.guardianNotified,
            guardianDetails: resData.guardianDetails
          };
        } else {
          // Server returned error, store offline fallback
          this.offlineEmergencyQueue.push(payload);
          saveLocal('queueless_offline_emergency_queue', this.offlineEmergencyQueue);
          this.activeEmergencyAlert = payload;
          return {
            success: true,
            isOffline: true,
            incident: payload,
            error: resData.error
          };
        }
      } catch (err) {
        // Network failure, store offline fallback
        this.offlineEmergencyQueue.push(payload);
        saveLocal('queueless_offline_emergency_queue', this.offlineEmergencyQueue);
        this.activeEmergencyAlert = payload;
        this.notify();
        return {
          success: true,
          isOffline: true,
          incident: payload,
          message: 'Offline emergency request cached. Auto-retrying as soon as signal returns.'
        };
      }
    }

    async syncOfflineEmergencies() {
      if (!this.offlineEmergencyQueue || this.offlineEmergencyQueue.length === 0 || !navigator.onLine) return;

      const queueToSend = [...this.offlineEmergencyQueue];
      try {
        const res = await fetch(`${API_BASE}/api/emergency/sync-offline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incidents: queueToSend })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          this.offlineEmergencyQueue = [];
          saveLocal('queueless_offline_emergency_queue', []);
          if (window.soundManager) window.soundManager.playSuccess();
          if (window.QueuelessComponents && window.QueuelessComponents.showToast) {
            window.QueuelessComponents.showToast(
              'Emergency Synced!',
              `${data.syncedCount} offline emergency request(s) transmitted to hospital triage.`,
              'success'
            );
          }
          this.syncWithSqlite();
        }
      } catch (e) {
        console.warn('Offline sync retry in progress...', e.message);
      }
    }

    async resolveEmergencyIncident({ incidentId, status = 'Resolved', isFalseAlarm = false, falseAlarmReason = '', staffNotes = '', staffName = '' }) {
      try {
        const res = await fetch(`${API_BASE}/api/emergency/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incidentId,
            status,
            isFalseAlarm,
            falseAlarmReason,
            staffNotes,
            staffName: staffName || (this.currentUser ? this.currentUser.name : 'Triage Officer')
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          if (this.activeEmergencyAlert && this.activeEmergencyAlert.id === incidentId) {
            this.activeEmergencyAlert = null;
          }
          await this.syncWithSqlite();
          return { success: true, incident: data.incident };
        }
        return { success: false, error: data.error || 'Failed to update incident.' };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    async fetchEmergencyAnalytics() {
      try {
        const res = await fetch(`${API_BASE}/api/emergency/analytics`);
        if (res.ok) {
          const data = await res.json();
          this.emergencyAnalytics = data.analytics;
          return this.emergencyAnalytics;
        }
      } catch (e) {
        console.warn('Failed to fetch emergency analytics:', e.message);
      }
      return null;
    }

    async fetchEmergencyContacts(userId) {
      if (!userId) return [];
      try {
        const res = await fetch(`${API_BASE}/api/emergency/contacts?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          this.emergencyContacts = data.contacts || [];
          return this.emergencyContacts;
        }
      } catch (e) {
        console.warn('Failed to fetch emergency contacts:', e.message);
      }
      return [];
    }

    async saveEmergencyContact(contact) {
      try {
        const res = await fetch(`${API_BASE}/api/emergency/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contact)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (this.currentUser) this.fetchEmergencyContacts(this.currentUser.id);
          return { success: true, contact: data.contact };
        }
        return { success: false, error: data.error || 'Failed to save contact.' };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    async deleteEmergencyContact(id) {
      try {
        const res = await fetch(`${API_BASE}/api/emergency/contacts?id=${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (this.currentUser) this.fetchEmergencyContacts(this.currentUser.id);
          return { success: true };
        }
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    toggleAccessibilityMode(enabled) {
      this.isAccessibilityMode = enabled !== undefined ? enabled : !this.isAccessibilityMode;
      saveLocal('queueless_accessibility_mode', this.isAccessibilityMode);
      this.applyAccessibilityStyles();
      this.notify();
      return this.isAccessibilityMode;
    }

    toggleHighContrast(enabled) {
      this.isHighContrast = enabled !== undefined ? enabled : !this.isHighContrast;
      saveLocal('queueless_high_contrast', this.isHighContrast);
      this.applyAccessibilityStyles();
      this.notify();
      return this.isHighContrast;
    }

    applyAccessibilityStyles() {
      if (this.isAccessibilityMode) {
        document.documentElement.classList.add('accessibility-large-text');
      } else {
        document.documentElement.classList.remove('accessibility-large-text');
      }

      if (this.isHighContrast) {
        document.documentElement.classList.add('accessibility-high-contrast');
      } else {
        document.documentElement.classList.remove('accessibility-high-contrast');
      }
    }

    stopSimulation() {
      if (this.simulationTimer) {
        clearInterval(this.simulationTimer);
        this.simulationTimer = null;
      }
    }
  }

  window.QueuelessData = {
    SERVICES,
    QUEUE_STATUSES,
    SEED_USERS
  };

  window.store = new QueuelessStore();
})();
