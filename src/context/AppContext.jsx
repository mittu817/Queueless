import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SERVICES, QUEUE_STATUSES } from '../constants/services';
import {
  STORAGE_KEYS,
  SEED_USERS,
  SEED_QUEUES,
  SEED_NOTIFICATIONS,
  DEFAULT_SERVICES_STATE,
  getStorageItem,
  setStorageItem
} from '../utils/storage';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Persistent State
  const [users, setUsers] = useState(() => getStorageItem(STORAGE_KEYS.USERS, SEED_USERS));
  const [currentUser, setCurrentUser] = useState(() => getStorageItem(STORAGE_KEYS.SESSION, null));
  const [queues, setQueues] = useState(() => getStorageItem(STORAGE_KEYS.QUEUES, SEED_QUEUES));
  const [notifications, setNotifications] = useState(() => getStorageItem(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS));
  const [servicesState, setServicesState] = useState(() => getStorageItem(STORAGE_KEYS.SERVICES_STATE, DEFAULT_SERVICES_STATE));

  // Ephemeral Toast State
  const [activeToast, setActiveToast] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    setStorageItem(STORAGE_KEYS.USERS, users);
  }, [users]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.SESSION, currentUser);
  }, [currentUser]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.QUEUES, queues);
  }, [queues]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);

  useEffect(() => {
    setStorageItem(STORAGE_KEYS.SERVICES_STATE, servicesState);
  }, [servicesState]);

  // Show Toast helper
  const showToast = (message, type = 'info', title = '') => {
    setActiveToast({
      id: Date.now(),
      title: title || (type === 'success' ? 'Success' : type === 'error' ? 'Notice' : 'Information'),
      message,
      type
    });
  };

  const clearToast = () => setActiveToast(null);

  // ==========================================
  // SPRINT 1: USER MANAGEMENT
  // ==========================================

  /**
   * QLESS-6: User Registration
   * Collect full name, email, phone number, password.
   * Validate required fields, email format, password strength.
   * Prevent duplicate email registrations.
   */
  const registerUser = (userData) => {
    const { name, email, phone, password, confirmPassword } = userData;

    // Field presence validation
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password?.trim()) {
      return { success: false, error: 'All fields are mandatory. Please complete the form.' };
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { success: false, error: 'Please provide a valid email address.' };
    }

    // Phone format validation (at least 7 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 7) {
      return { success: false, error: 'Please enter a valid telephone number with at least 7 digits.' };
    }

    // Password strength validation (min 6 chars, uppercase, lowercase, number)
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { success: false, error: 'Password must contain at least one uppercase letter (A-Z).' };
    }
    if (!/[0-9]/.test(password)) {
      return { success: false, error: 'Password must contain at least one number (0-9).' };
    }

    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match. Please verify both entries.' };
    }

    // Prevent duplicate email registrations
    const existing = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return { success: false, error: 'An account with this email address already exists. Please log in.' };
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

    setUsers(prev => [...prev, newUser]);

    // Initial welcome notification
    addNotification({
      userId: newUser.id,
      title: 'Welcome to Queueless',
      message: `Hello ${newUser.name}! Your account is now active. You can browse services and join virtual queues anytime.`,
      type: 'info'
    });

    showToast('Registration successful! Please log in with your credentials.', 'success', 'Account Created');
    return { success: true, user: newUser };
  };

  /**
   * QLESS-7: User Login
   * Authenticate users using email and password.
   * Display errors for incorrect credentials.
   * Maintain login sessions appropriately.
   */
  const loginUser = (email, password) => {
    if (!email?.trim() || !password?.trim()) {
      return { success: false, error: 'Please enter both your email address and password.' };
    }

    const foundUser = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (!foundUser) {
      return { success: false, error: 'Invalid email address or password. Please try again.' };
    }

    // Sanitize user (omit password in active session state)
    const sessionUser = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      phone: foundUser.phone,
      role: foundUser.role,
      createdAt: foundUser.createdAt
    };

    setCurrentUser(sessionUser);
    showToast(`Welcome back, ${sessionUser.name}!`, 'success', 'Login Successful');
    return { success: true, user: sessionUser };
  };

  /**
   * QLESS-7: Logout Functionality
   */
  const logoutUser = () => {
    setCurrentUser(null);
    showToast('You have been logged out successfully.', 'info', 'Logged Out');
  };

  /**
   * QLESS-8: Manage User Profile
   * View and update profile details.
   * Allow password change.
   * Save changes persistently.
   */
  const updateProfile = ({ name, phone, currentPassword, newPassword, confirmNewPassword }) => {
    if (!currentUser) return { success: false, error: 'No authenticated user session found.' };

    const fullUser = users.find(u => u.id === currentUser.id);
    if (!fullUser) return { success: false, error: 'User record not found in system.' };

    // Validation
    if (!name?.trim() || !phone?.trim()) {
      return { success: false, error: 'Name and phone number cannot be empty.' };
    }

    let updatedPassword = fullUser.password;

    // If changing password
    if (newPassword || currentPassword) {
      if (currentPassword !== fullUser.password) {
        return { success: false, error: 'Current password does not match records.' };
      }
      if (newPassword.length < 6) {
        return { success: false, error: 'New password must be at least 6 characters long.' };
      }
      if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        return { success: false, error: 'New password must include at least one uppercase letter and one number.' };
      }
      if (newPassword !== confirmNewPassword) {
        return { success: false, error: 'New passwords do not match.' };
      }
      updatedPassword = newPassword;
    }

    const updatedUser = {
      ...fullUser,
      name: name.trim(),
      phone: phone.trim(),
      password: updatedPassword
    };

    setUsers(prev => prev.map(u => (u.id === currentUser.id ? updatedUser : u)));

    // Update active session
    const updatedSession = {
      ...currentUser,
      name: name.trim(),
      phone: phone.trim()
    };
    setCurrentUser(updatedSession);

    // Update customer name in active queues for real-time consistency
    setQueues(prev => prev.map(q => q.userId === currentUser.id ? { ...q, customerName: name.trim(), customerPhone: phone.trim() } : q));

    showToast('Profile updated successfully!', 'success', 'Profile Saved');
    return { success: true };
  };

  // ==========================================
  // SPRINT 2: VIRTUAL QUEUE MANAGEMENT
  // ==========================================

  /**
   * Helper: Get current active queue token for a user
   * (Active means 'Waiting' or 'Being Served')
   */
  const getActiveQueueForUser = (userId) => {
    if (!userId) return null;
    return queues.find(
      q => q.userId === userId && (q.status === QUEUE_STATUSES.WAITING || q.status === QUEUE_STATUSES.SERVING)
    ) || null;
  };

  /**
   * QLESS-9: Join Virtual Queue
   * QLESS-10: Generate Queue Token
   * - Display available services
   * - Check pause state
   * - Prevent duplicate active queue entries
   * - Generate unique token with service-specific prefix (HOPD, BANK, PASS, LIB)
   * - Display confirmation
   */
  const joinQueue = (serviceId, notes = '') => {
    if (!currentUser) {
      return { success: false, error: 'You must be logged in to join a virtual queue.' };
    }

    const service = SERVICES.find(s => s.id === serviceId);
    if (!service) {
      return { success: false, error: 'Invalid service selected.' };
    }

    // Check if service is paused by admin
    if (servicesState[serviceId]?.isPaused) {
      return {
        success: false,
        error: `The ${service.name} queue is temporarily paused by administration. Please check back shortly.`
      };
    }

    // Prevent duplicate active queue entries (QLESS-9 acceptance criteria)
    const existingActive = getActiveQueueForUser(currentUser.id);
    if (existingActive) {
      return {
        success: false,
        error: `You already have an active queue ticket (${existingActive.tokenNumber} for ${existingActive.serviceName}). Please wait for service completion or leave your current queue before joining another.`,
        activeToken: existingActive
      };
    }

    // Generate unique token number with service prefix (QLESS-10)
    // Find highest token number for this service prefix
    const serviceTokens = queues
      .filter(q => q.tokenNumber && q.tokenNumber.startsWith(service.prefix))
      .map(q => {
        const numPart = parseInt(q.tokenNumber.split('-')[1], 10);
        return isNaN(numPart) ? 100 : numPart;
      });

    const nextNumber = serviceTokens.length > 0 ? Math.max(...serviceTokens) + 1 : 101;
    const tokenNumber = `${service.prefix}-${nextNumber}`;

    // Calculate initial position among waiting customers for this service
    const activeWaitingForService = queues.filter(
      q => q.serviceId === serviceId && q.status === QUEUE_STATUSES.WAITING
    );
    const position = activeWaitingForService.length + 1;

    const newQueueEntry = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      tokenNumber,
      serviceId: service.id,
      serviceName: service.name,
      userId: currentUser.id,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      status: QUEUE_STATUSES.WAITING,
      counter: service.counters,
      notes: notes.trim() || 'General Service Visit',
      joinedAt: new Date().toISOString(),
      servedAt: null,
      completedAt: null,
      position
    };

    setQueues(prev => [...prev, newQueueEntry]);

    // QLESS-14: Notification when token is created
    addNotification({
      userId: currentUser.id,
      title: 'Token Generated',
      message: `You have successfully joined the ${service.name} queue! Your token is ${tokenNumber}. Current position: #${position}.`,
      type: 'success'
    });

    showToast(`Token ${tokenNumber} issued! You are #${position} in line.`, 'success', 'Queue Joined');
    return { success: true, token: newQueueEntry };
  };

  /**
   * QLESS-13: Leave Virtual Queue
   * - Provide Leave Queue confirmation
   * - Remove customer from active queue
   * - Update queue counts and positions
   * - Change token status to Cancelled
   * - Generate cancellation notification
   * - Completed / No-show entries cannot be cancelled
   */
  const leaveQueue = (tokenId, reason = 'Customer decided to leave') => {
    const queueEntry = queues.find(q => q.id === tokenId);
    if (!queueEntry) {
      return { success: false, error: 'Queue entry not found.' };
    }

    if (queueEntry.status === QUEUE_STATUSES.COMPLETED || queueEntry.status === QUEUE_STATUSES.NOSHOW) {
      return { success: false, error: 'Completed or marked entries cannot be cancelled.' };
    }

    if (queueEntry.status === QUEUE_STATUSES.CANCELLED) {
      return { success: false, error: 'This queue ticket is already cancelled.' };
    }

    const cancelledAt = new Date().toISOString();
    const serviceId = queueEntry.serviceId;

    // Update status to Cancelled
    setQueues(prev => {
      const updated = prev.map(q => {
        if (q.id === tokenId) {
          return {
            ...q,
            status: QUEUE_STATUSES.CANCELLED,
            completedAt: cancelledAt,
            cancellationReason: reason,
            position: 0
          };
        }
        return q;
      });

      // Recalculate positions for remaining waiting customers in the same service
      let pos = 1;
      return updated.map(q => {
        if (q.serviceId === serviceId && q.status === QUEUE_STATUSES.WAITING) {
          return { ...q, position: pos++ };
        }
        return q;
      });
    });

    // QLESS-14: Generate cancellation notification
    if (queueEntry.userId) {
      addNotification({
        userId: queueEntry.userId,
        title: 'Queue Entry Cancelled',
        message: `Your token ${queueEntry.tokenNumber} for ${queueEntry.serviceName} has been cancelled. Your spot has been released.`,
        type: 'warning'
      });
    }

    showToast(`Queue ticket ${queueEntry.tokenNumber} has been cancelled.`, 'info', 'Queue Released');
    return { success: true };
  };

  // ==========================================
  // SPRINT 3: TRACKING AND NOTIFICATIONS
  // ==========================================

  /**
   * QLESS-11: Track Queue Position
   * QLESS-12: View Estimated Waiting Time
   * Computes live dynamic position and wait time for a given queue entry.
   */
  const getQueueTrackingDetails = (tokenId) => {
    const entry = queues.find(q => q.id === tokenId);
    if (!entry) return null;

    const service = SERVICES.find(s => s.id === entry.serviceId);
    const avgServiceTime = service?.avgServiceTimeMinutes || 5;

    // Find all active entries for this service
    const activeInService = queues.filter(
      q => q.serviceId === entry.serviceId && (q.status === QUEUE_STATUSES.WAITING || q.status === QUEUE_STATUSES.SERVING)
    );

    // Current position
    let position = 0;
    let peopleAhead = 0;
    let estimatedWaitMinutes = 0;

    if (entry.status === QUEUE_STATUSES.SERVING) {
      position = 1;
      peopleAhead = 0;
      estimatedWaitMinutes = 0;
    } else if (entry.status === QUEUE_STATUSES.WAITING) {
      // Waiting customers sorted by joinedAt
      const waitingList = queues
        .filter(q => q.serviceId === entry.serviceId && q.status === QUEUE_STATUSES.WAITING)
        .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));

      const idx = waitingList.findIndex(q => q.id === entry.id);
      position = idx !== -1 ? idx + 1 : entry.position;

      // Count if someone is currently being served
      const isSomeoneServing = queues.some(
        q => q.serviceId === entry.serviceId && q.status === QUEUE_STATUSES.SERVING
      );

      // People ahead includes the currently serving person plus anyone ahead in the waiting line
      peopleAhead = (isSomeoneServing ? 1 : 0) + (position - 1);
      estimatedWaitMinutes = Math.max(1, peopleAhead * avgServiceTime);
    }

    const isTurnApproaching = entry.status === QUEUE_STATUSES.WAITING && position <= 2;
    const isNowServing = entry.status === QUEUE_STATUSES.SERVING;

    return {
      entry,
      service,
      position,
      peopleAhead,
      estimatedWaitMinutes,
      isTurnApproaching,
      isNowServing,
      totalActiveInService: activeInService.length
    };
  };

  /**
   * QLESS-14: Send Queue Notifications
   * Add notification, mark as read, clear notifications.
   */
  const addNotification = ({ userId, title, message, type = 'info' }) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = (userId) => {
    setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, read: true } : n));
    showToast('All notifications marked as read.', 'info');
  };

  const clearAllNotifications = (userId) => {
    setNotifications(prev => prev.filter(n => n.userId !== userId));
    showToast('Notifications cleared.', 'info');
  };

  // ==========================================
  // SPRINT 4: ADMIN MANAGEMENT AND REPORTS
  // ==========================================

  /**
   * QLESS-16: Admin - Call Next Customer
   * - Marks next waiting customer as 'Being Served'
   * - If someone was already being served, completes them or alerts
   * - Recomputes positions
   * - Triggers notifications
   */
  const callNextCustomer = (serviceId) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator access required.' };
    }

    const service = SERVICES.find(s => s.id === serviceId);
    if (!service) return { success: false, error: 'Service not found.' };

    // Check if there is already a customer being served
    const currentServing = queues.find(
      q => q.serviceId === serviceId && q.status === QUEUE_STATUSES.SERVING
    );

    // Find next in waiting line
    const waitingList = queues
      .filter(q => q.serviceId === serviceId && q.status === QUEUE_STATUSES.WAITING)
      .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));

    if (waitingList.length === 0) {
      return { success: false, error: `No waiting customers in the ${service.name} queue.` };
    }

    const nextCustomer = waitingList[0];
    const nowIso = new Date().toISOString();

    setQueues(prev => {
      let updated = [...prev];

      // If someone was currently serving, auto-complete them to make room
      if (currentServing) {
        updated = updated.map(q => {
          if (q.id === currentServing.id) {
            return {
              ...q,
              status: QUEUE_STATUSES.COMPLETED,
              completedAt: nowIso,
              position: 0
            };
          }
          return q;
        });

        // Notify previous customer
        if (currentServing.userId) {
          addNotification({
            userId: currentServing.userId,
            title: 'Service Completed',
            message: `Your appointment for ${currentServing.serviceName} (${currentServing.tokenNumber}) has concluded. Thank you!`,
            type: 'success'
          });
        }
      }

      // Promote nextCustomer to Being Served
      updated = updated.map(q => {
        if (q.id === nextCustomer.id) {
          return {
            ...q,
            status: QUEUE_STATUSES.SERVING,
            servedAt: nowIso,
            counter: service.counters.split('–')[0].trim() || 'Counter 1',
            position: 1
          };
        }
        return q;
      });

      // Recalculate positions for remaining waiting customers
      let pos = 1;
      return updated.map(q => {
        if (q.serviceId === serviceId && q.status === QUEUE_STATUSES.WAITING) {
          return { ...q, position: pos++ };
        }
        return q;
      });
    });

    // Notify next customer that they are being served
    if (nextCustomer.userId) {
      addNotification({
        userId: nextCustomer.userId,
        title: '🔔 Now Serving!',
        message: `Token ${nextCustomer.tokenNumber}! Please proceed to ${service.counters}. Our representative is ready for you.`,
        type: 'success'
      });
    }

    // Check customer in position 2 to notify them that their turn is approaching
    const nextInLine = waitingList[1];
    if (nextInLine && nextInLine.userId) {
      addNotification({
        userId: nextInLine.userId,
        title: 'Your Turn is Approaching',
        message: `You are now next in line for ${service.name} (Token ${nextInLine.tokenNumber}). Please stay near the service desk.`,
        type: 'info'
      });
    }

    showToast(`Called Token ${nextCustomer.tokenNumber} (${nextCustomer.customerName}) to counter.`, 'success', 'Next Customer Called');
    return { success: true, customer: nextCustomer };
  };

  /**
   * QLESS-16: Admin - Complete Customer Service
   */
  const completeCustomerService = (tokenId) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator access required.' };
    }

    const queueEntry = queues.find(q => q.id === tokenId);
    if (!queueEntry) return { success: false, error: 'Queue entry not found.' };

    const nowIso = new Date().toISOString();

    setQueues(prev => prev.map(q => {
      if (q.id === tokenId) {
        return {
          ...q,
          status: QUEUE_STATUSES.COMPLETED,
          completedAt: nowIso,
          position: 0
        };
      }
      return q;
    }));

    if (queueEntry.userId) {
      addNotification({
        userId: queueEntry.userId,
        title: 'Service Completed',
        message: `Your service session for token ${queueEntry.tokenNumber} is marked as completed. Thank you for using Queueless!`,
        type: 'success'
      });
    }

    showToast(`Token ${queueEntry.tokenNumber} completed successfully.`, 'success', 'Service Completed');
    return { success: true };
  };

  /**
   * QLESS-16: Admin - Mark Customer as No-show
   */
  const markCustomerNoShow = (tokenId) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator access required.' };
    }

    const queueEntry = queues.find(q => q.id === tokenId);
    if (!queueEntry) return { success: false, error: 'Queue entry not found.' };

    const nowIso = new Date().toISOString();
    const serviceId = queueEntry.serviceId;

    setQueues(prev => {
      const updated = prev.map(q => {
        if (q.id === tokenId) {
          return {
            ...q,
            status: QUEUE_STATUSES.NOSHOW,
            completedAt: nowIso,
            position: 0
          };
        }
        return q;
      });

      // Recalculate remaining waiting positions
      let pos = 1;
      return updated.map(q => {
        if (q.serviceId === serviceId && q.status === QUEUE_STATUSES.WAITING) {
          return { ...q, position: pos++ };
        }
        return q;
      });
    });

    if (queueEntry.userId) {
      addNotification({
        userId: queueEntry.userId,
        title: 'Marked as No-Show',
        message: `Token ${queueEntry.tokenNumber} was marked as No-Show due to no response at counter call. You can join the queue again if needed.`,
        type: 'error'
      });
    }

    showToast(`Token ${queueEntry.tokenNumber} marked as No-Show.`, 'warning', 'No-Show Recorded');
    return { success: true };
  };

  /**
   * QLESS-16: Admin - Pause or Resume Queue
   */
  const toggleServicePause = (serviceId, notice = '') => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator access required.' };
    }

    setServicesState(prev => {
      const current = prev[serviceId] || { isPaused: false, notice: '' };
      const nextPaused = !current.isPaused;
      return {
        ...prev,
        [serviceId]: {
          isPaused: nextPaused,
          notice: nextPaused ? (notice || 'Queue is temporarily paused by service administration.') : ''
        }
      };
    });

    const isNowPaused = !servicesState[serviceId]?.isPaused;
    showToast(
      `Queue for this service is now ${isNowPaused ? 'PAUSED' : 'RESUMED'}.`,
      isNowPaused ? 'warning' : 'success'
    );
    return { success: true };
  };

  /**
   * QLESS-16: Admin - Add Walk-in Customer
   */
  const addWalkInCustomer = (serviceId, customerName, customerPhone, notes = 'Walk-in Visitor') => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrator access required.' };
    }

    const service = SERVICES.find(s => s.id === serviceId);
    if (!service) return { success: false, error: 'Service not found.' };

    if (!customerName?.trim()) {
      return { success: false, error: 'Please enter customer name.' };
    }

    // Generate unique token number with service prefix
    const serviceTokens = queues
      .filter(q => q.tokenNumber && q.tokenNumber.startsWith(service.prefix))
      .map(q => {
        const numPart = parseInt(q.tokenNumber.split('-')[1], 10);
        return isNaN(numPart) ? 100 : numPart;
      });

    const nextNumber = serviceTokens.length > 0 ? Math.max(...serviceTokens) + 1 : 101;
    const tokenNumber = `${service.prefix}-${nextNumber}`;

    const activeWaitingForService = queues.filter(
      q => q.serviceId === serviceId && q.status === QUEUE_STATUSES.WAITING
    );
    const position = activeWaitingForService.length + 1;

    const walkInEntry = {
      id: `queue-walkin-${Date.now()}`,
      tokenNumber,
      serviceId: service.id,
      serviceName: service.name,
      userId: null, // Walk-in doesn't have an online user account
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || 'N/A (Walk-in)',
      status: QUEUE_STATUSES.WAITING,
      counter: service.counters,
      notes: notes.trim() || 'Walk-in on-premise customer',
      joinedAt: new Date().toISOString(),
      servedAt: null,
      completedAt: null,
      position,
      isWalkIn: true
    };

    setQueues(prev => [...prev, walkInEntry]);
    showToast(`Walk-in customer ${customerName} added with token ${tokenNumber}.`, 'success', 'Walk-In Added');
    return { success: true, token: walkInEntry };
  };

  /**
   * Utility to reset demo data back to default seed
   */
  const resetToDefaultSeed = () => {
    setUsers(SEED_USERS);
    setQueues(SEED_QUEUES);
    setNotifications(SEED_NOTIFICATIONS);
    setServicesState(DEFAULT_SERVICES_STATE);
    showToast('Application state reset to pristine demo seed.', 'info', 'System Reset');
  };

  // Provide state & actions
  const value = {
    // State
    users,
    currentUser,
    queues,
    notifications,
    servicesState,
    activeToast,

    // Sprint 1
    registerUser,
    loginUser,
    logoutUser,
    updateProfile,

    // Sprint 2
    joinQueue,
    leaveQueue,
    getActiveQueueForUser,

    // Sprint 3
    getQueueTrackingDetails,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    addNotification,

    // Sprint 4
    callNextCustomer,
    completeCustomerService,
    markCustomerNoShow,
    toggleServicePause,
    addWalkInCustomer,

    // UI Helpers
    showToast,
    clearToast,
    resetToDefaultSeed
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

