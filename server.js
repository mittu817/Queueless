// Queueless Web Server & Enterprise SQLite REST API
// Native Node.js with built-in node:sqlite database engine & Deep Learning AI Engine
// Database file 'queueless.db' connects directly with DB Browser for SQLite

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const { aiEngine } = require('./ai_engine');

let PORT = parseInt(process.env.PORT, 10) || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

// ==========================================
// SECURITY & PRODUCTION UTILITIES
// ==========================================

// Rate Limiting Store (In-Memory Sliding Window)
const rateLimitMap = new Map();
function isRateLimited(ip, limit = 40, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + windowMs;
  } else {
    entry.count++;
  }
  rateLimitMap.set(ip, entry);
  return entry.count > limit;
}

// In-Memory Simulated OTP Store
const otpStore = new Map(); // phone/email -> { code, expiresAt }

// Password Hashing with Salt
function hashPassword(password, existingSalt = null) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return { hash, salt };
}

function verifyPassword(inputPassword, storedPassword, salt = null) {
  if (!salt) {
    // Legacy plain text check fallback
    return inputPassword === storedPassword;
  }
  const checkHash = crypto.pbkdf2Sync(inputPassword, salt, 1000, 64, 'sha256').toString('hex');
  return checkHash === storedPassword;
}

// Session Token Generation & Verification
const JWT_SECRET = 'queueless-enterprise-secret-key-2026';
function createSessionToken(user) {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    exp: Date.now() + 24 * 3600 * 1000 // 24 hours
  };
  const str = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(str).digest('base64url');
  return `${str}.${sig}`;
}

function verifySessionToken(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [str, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(str).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(str, 'base64url').toString('utf8'));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// Customer Data Privacy Masking
function maskCustomerPhone(phone) {
  if (!phone || phone.length < 5) return '***';
  const clean = phone.trim();
  const visibleLast = clean.slice(-2);
  const prefix = clean.slice(0, Math.min(6, clean.length - 4));
  return `${prefix}***${visibleLast}`;
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Request payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end();
    return;
  }

  const clientIp = req.socket.remoteAddress || '127.0.0.1';
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Rate Limiting for API routes
  if (pathname.startsWith('/api/') && isRateLimited(clientIp)) {
    return sendJson(res, 429, { success: false, error: 'Rate limit exceeded. Please wait a moment before trying again.' });
  }

  // ==========================================
  // REST API ENDPOINTS
  // ==========================================
  if (pathname.startsWith('/api/')) {
    try {
      // 1. Health & Database Connectivity Status
      if (pathname === '/api/db-status' && req.method === 'GET') {
        const stats = db.getDatabaseStats();
        return sendJson(res, 200, {
          success: true,
          status: 'online',
          database: {
            connected: true,
            status: 'operational',
            tables: stats.tables,
            filePath: stats.filePath,
            sizeKb: stats.sizeKb
          }
        });
      }

      // 2. QLESS-6: Customer Registration
      if (pathname === '/api/auth/register' && req.method === 'POST') {
        const body = await parseBody(req);
        const { name, email, phone, password, confirmPassword } = body;

        if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
          return sendJson(res, 400, { success: false, error: 'All fields are required.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          return sendJson(res, 400, { success: false, error: 'Please enter a valid email address.' });
        }

        const digits = phone.replace(/\D/g, '');
        if (digits.length < 7) {
          return sendJson(res, 400, { success: false, error: 'Phone number must have at least 7 digits.' });
        }

        if (password.length < 6 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
          return sendJson(res, 400, { success: false, error: 'Password must be at least 6 characters with an uppercase letter and a number.' });
        }

        if (password !== confirmPassword) {
          return sendJson(res, 400, { success: false, error: 'Passwords do not match.' });
        }

        const existing = db.getUserByEmail(email);
        if (existing) {
          return sendJson(res, 409, { success: false, error: 'An account with this email address already exists. Please log in.' });
        }

        const { hash, salt } = hashPassword(password);
        const newUser = db.createUser({
          id: `user-cust-${Date.now()}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password: hash,
          salt,
          role: 'customer'
        });

        const token = createSessionToken(newUser);

        db.createNotification({
          id: `notif-${Date.now()}`,
          user_id: newUser.id,
          title: 'Welcome to Queueless!',
          message: `Hello ${newUser.name}! Your account is ready. Select any service desk below to take your virtual token and wait in comfort.`,
          type: 'success'
        });

        db.logActivity({
          userId: newUser.id,
          userName: newUser.name,
          role: 'customer',
          action: 'customer_registered',
          details: `Registered email: ${newUser.email}`,
          ipAddress: clientIp
        });

        return sendJson(res, 201, { success: true, user: newUser, token });
      }

      // 2b. Staff / Administrator Registration
      if (pathname === '/api/auth/register-staff' && req.method === 'POST') {
        const body = await parseBody(req);
        const { name, email, phone, department, staffPasscode, password, confirmPassword } = body;

        if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
          return sendJson(res, 400, { success: false, error: 'All fields are required.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          return sendJson(res, 400, { success: false, error: 'Please enter a valid work email address.' });
        }

        if (password.length < 6 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
          return sendJson(res, 400, { success: false, error: 'Staff password must be at least 6 characters with an uppercase letter and a number.' });
        }

        if (password !== confirmPassword) {
          return sendJson(res, 400, { success: false, error: 'Passwords do not match.' });
        }

        const role = (staffPasscode && staffPasscode.trim().toUpperCase() === 'ADMIN2026') ? 'admin' : 'staff';
        if (staffPasscode && staffPasscode.trim().toUpperCase() !== 'ADMIN2026' && staffPasscode.trim().toUpperCase() !== 'STAFF123') {
          return sendJson(res, 403, { success: false, error: 'Invalid Staff Security Passcode. Use ADMIN2026 or STAFF123.' });
        }

        const existing = db.getUserByEmail(email);
        if (existing) {
          return sendJson(res, 409, { success: false, error: 'A staff account with this email address already exists. Please sign in.' });
        }

        const { hash, salt } = hashPassword(password);
        const newStaff = db.createUser({
          id: `user-${role}-${Date.now()}`,
          name: name.trim().startsWith('Officer') ? name.trim() : `Officer ${name.trim()}`,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password: hash,
          salt,
          role,
          assigned_service: department || null
        });

        const token = createSessionToken(newStaff);

        db.createNotification({
          id: `notif-${Date.now()}`,
          user_id: newStaff.id,
          title: `${role === 'admin' ? 'Admin' : 'Staff'} Access Activated`,
          message: `${newStaff.name}, your credentials are ready. You have access to active service queues.`,
          type: 'success'
        });

        db.logActivity({
          userId: newStaff.id,
          userName: newStaff.name,
          role,
          action: 'staff_registered',
          details: `Role: ${role}, Department: ${department || 'General'}`,
          ipAddress: clientIp
        });

        return sendJson(res, 201, { success: true, user: newStaff, token });
      }

      // 3. QLESS-7: User / Staff / Admin Login
      if (pathname === '/api/auth/login' && req.method === 'POST') {
        const body = await parseBody(req);
        const { email, password } = body;

        if (!email || !password) {
          return sendJson(res, 400, { success: false, error: 'Please enter email and password.' });
        }

        const user = db.getUserByEmail(email);
        if (!user || !verifyPassword(password, user.password, user.salt)) {
          return sendJson(res, 401, { success: false, error: 'Invalid email address or password.' });
        }

        if (user.status === 'suspended') {
          return sendJson(res, 403, { success: false, error: 'Your account has been suspended by system administrator.' });
        }

        const token = createSessionToken(user);
        const safeUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          assigned_counter: user.assigned_counter,
          assigned_service: user.assigned_service,
          status: user.status,
          created_at: user.created_at
        };

        db.logActivity({
          userId: user.id,
          userName: user.name,
          role: user.role,
          action: 'user_login',
          details: `Logged in as ${user.role}`,
          ipAddress: clientIp
        });

        return sendJson(res, 200, { success: true, user: safeUser, token });
      }

      // 4. OTP Verification Simulation (QLESS Production Architecture)
      if (pathname === '/api/auth/otp/send' && req.method === 'POST') {
        const body = await parseBody(req);
        const target = body.phone || body.email;
        if (!target) return sendJson(res, 400, { success: false, error: 'Phone or email required for OTP.' });

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(target, { code, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 mins

        return sendJson(res, 200, {
          success: true,
          message: `Verification OTP sent to ${target}. (For demo: use ${code})`,
          demoCode: code
        });
      }

      if (pathname === '/api/auth/otp/verify' && req.method === 'POST') {
        const body = await parseBody(req);
        const target = body.phone || body.email;
        const code = body.code;

        const record = otpStore.get(target);
        if (!record || record.code !== code || Date.now() > record.expiresAt) {
          return sendJson(res, 400, { success: false, error: 'Invalid or expired OTP code.' });
        }

        otpStore.delete(target);
        return sendJson(res, 200, { success: true, verified: true });
      }

      // 5. Services List
      if (pathname === '/api/services' && req.method === 'GET') {
        const services = db.getServices();
        return sendJson(res, 200, { success: true, services });
      }

      // 6. Queues List (Customer Privacy Protection)
      if (pathname === '/api/queues' && req.method === 'GET') {
        const authHeader = req.headers['authorization'];
        const session = verifySessionToken(authHeader?.replace('Bearer ', ''));
        const isStaff = session && (session.role === 'staff' || session.role === 'admin');

        const rawQueues = db.getAllQueues();
        const queues = rawQueues.map(q => ({
          ...q,
          customer_phone: isStaff ? q.customer_phone : maskCustomerPhone(q.customer_phone)
        }));

        return sendJson(res, 200, { success: true, queues });
      }

      // 7. QLESS-9 & QLESS-10: Join Virtual Queue (With Deep Learning Wait Prediction, Basic Form & Unique Token)
      if (pathname === '/api/queues/join' && req.method === 'POST') {
        const body = await parseBody(req);
        const { serviceId, userId, customerName, customerEmail, customerPhone, notes, priority = 'Normal' } = body;

        const services = db.getServices();
        const service = services.find(s => s.id === serviceId);
        if (!service) {
          return sendJson(res, 404, { success: false, error: 'Service not found.' });
        }

        if (service.is_paused) {
          return sendJson(res, 400, { success: false, error: `The ${service.name} queue is temporarily paused. Notice: ${service.notice || 'Please check back shortly.'}` });
        }

        // Validate basic customer details (Name, Email, Phone)
        const trimmedName = (customerName || '').trim();
        const trimmedEmail = (customerEmail || '').trim().toLowerCase();
        const trimmedPhone = (customerPhone || '').trim();

        if (!trimmedName || !trimmedEmail || !trimmedPhone) {
          return sendJson(res, 400, { success: false, error: 'Name, Email, and Phone Number are required to join the virtual queue.' });
        }

        // Find or auto-register customer profile
        let user = userId ? db.getUserById(userId) : null;
        if (!user && trimmedEmail) {
          user = db.getUserByEmail(trimmedEmail);
        }

        if (!user && trimmedEmail) {
          // Auto-register customer so they have a persistent profile in SQLite
          const newUserId = `user-cust-${Date.now()}`;
          const { hash, salt } = hashPassword('Queueless@' + Math.random().toString(36).substring(2, 8));
          user = db.createUser({
            id: newUserId,
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            password: hash,
            salt,
            role: 'customer'
          });
        }

        // Prevent duplicate active queue entries for the customer
        if (user) {
          const active = db.getActiveQueueByUserId(user.id);
          if (active) {
            return sendJson(res, 409, {
              success: false,
              error: `You already hold active token ${active.token_number} for ${active.service_name}.`,
              activeToken: active
            });
          }
        }

        // Also check by customer email to prevent duplicates
        const allQueues = db.getAllQueues();
        const activeByEmail = allQueues.find(q =>
          q.customer_email && q.customer_email.toLowerCase() === trimmedEmail &&
          (q.status === 'Waiting' || q.status === 'Being Served')
        );
        if (activeByEmail) {
          return sendJson(res, 409, {
            success: false,
            error: `You already hold active token ${activeByEmail.token_number} for ${activeByEmail.service_name}.`,
            activeToken: activeByEmail
          });
        }

        // Generate guaranteed collision-free unique token number
        const prefixTokens = allQueues
          .filter(q => q.token_number && q.token_number.startsWith(service.prefix + '-'))
          .map(q => parseInt(q.token_number.split('-')[1], 10))
          .filter(n => !isNaN(n));

        let nextNum = prefixTokens.length > 0 ? Math.max(...prefixTokens) + 1 : 101;
        let tokenNumber = `${service.prefix}-${nextNum}`;
        while (allQueues.some(q => q.token_number === tokenNumber) || db.getQueueEntryByTokenNumber(tokenNumber)) {
          nextNum += 1;
          tokenNumber = `${service.prefix}-${nextNum}`;
        }

        const waitingCount = allQueues.filter(q => q.service_id === service.id && q.status === 'Waiting').length;

        // Calculate Deep Learning AI Waiting Time Prediction based on 7 features
        const aiPrediction = aiEngine.calculateEstimatedWait({
          peopleAhead: waitingCount,
          avgServiceTime: service.avg_service_time_minutes || 5,
          activeCounters: service.active_counters || 3,
          counterAvailability: 0.85,
          serviceId: service.id,
          priority
        });

        const newQueue = db.createQueueEntry({
          id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          token_number: tokenNumber,
          service_id: service.id,
          service_name: service.name,
          user_id: user ? user.id : null,
          customer_name: trimmedName,
          customer_email: trimmedEmail,
          customer_phone: trimmedPhone,
          status: 'Waiting',
          counter: service.counters,
          notes: notes || 'Standard consultation',
          priority,
          joined_at: new Date().toISOString(),
          position: waitingCount + 1,
          is_walkin: 0,
          predicted_wait_mins: aiPrediction.estimatedMinutes
        });

        db.recomputeServicePositions(service.id);

        if (user) {
          db.createNotification({
            id: `notif-${Date.now()}`,
            user_id: user.id,
            title: 'Digital Token Issued',
            message: `Your token ${tokenNumber} for ${service.name} is ready. Estimated wait time: ~${aiPrediction.estimatedMinutes} mins.`,
            type: 'success'
          });
        }

        db.logActivity({
          userId: user ? user.id : null,
          userName: trimmedName,
          role: 'customer',
          action: 'token_generated',
          details: `Token: ${tokenNumber}, Service: ${service.name}, Priority: ${priority}`,
          ipAddress: clientIp
        });

        const sessionToken = user ? createSessionToken(user) : null;

        return sendJson(res, 201, {
          success: true,
          token: newQueue,
          user: user ? { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } : null,
          sessionToken,
          aiPrediction: {
            estimatedMinutes: aiPrediction.estimatedMinutes,
            confidencePct: aiPrediction.confidencePct
          }
        });
      }

      // 8. QLESS-13: Leave Virtual Queue
      if (pathname === '/api/queues/leave' && req.method === 'POST') {
        const body = await parseBody(req);
        const { tokenId, reason } = body;

        const all = db.getAllQueues();
        const entry = all.find(q => q.id === tokenId);
        if (!entry) {
          return sendJson(res, 404, { success: false, error: 'Queue record not found.' });
        }

        if (entry.status === 'Completed' || entry.status === 'No-show') {
          return sendJson(res, 400, { success: false, error: 'Finalized entries cannot be cancelled.' });
        }

        db.updateQueueStatus(tokenId, {
          status: 'Cancelled',
          completed_at: new Date().toISOString(),
          cancellation_reason: reason || 'Customer cancelled remotely',
          position: 0
        });

        db.recomputeServicePositions(entry.service_id);

        if (entry.user_id) {
          db.createNotification({
            id: `notif-${Date.now()}`,
            user_id: entry.user_id,
            title: 'Queue Left / Cancelled',
            message: `Your token ${entry.token_number} for ${entry.service_name} has been cancelled.`,
            type: 'warning'
          });
        }

        db.logActivity({
          userId: entry.user_id || null,
          userName: entry.customer_name,
          role: 'customer',
          action: 'queue_cancelled',
          details: `Token: ${entry.token_number}, Reason: ${reason || 'Customer left'}`,
          ipAddress: clientIp
        });

        return sendJson(res, 200, { success: true });
      }

      // ==========================================
      // STAFF MEMBER DASHBOARD (ONESTQ-STYLE)
      // ==========================================

      // Staff Call Next Token
      if (pathname === '/api/staff/call-next' && req.method === 'POST') {
        const body = await parseBody(req);
        const { serviceId, counterId, staffId, staffName } = body;

        const all = db.getAllQueues();
        const waitingList = all.filter(q => q.service_id === serviceId && q.status === 'Waiting');

        if (waitingList.length === 0) {
          return sendJson(res, 400, { success: false, error: 'No customers are currently waiting for this service.' });
        }

        // Priority sorting: Urgent -> Elderly/Disabled -> Normal (then joined_at)
        const nextCustomer = waitingList[0];
        const now = new Date().toISOString();

        // Update token to Being Served
        db.updateQueueStatus(nextCustomer.id, {
          status: 'Being Served',
          called_at: now,
          served_at: now,
          counter: counterId || nextCustomer.counter
        });

        // Update counter status
        if (counterId) {
          db.updateCounterStatus(counterId, 'Serving', nextCustomer.token_number);
        }

        db.recomputeServicePositions(serviceId);

        if (nextCustomer.user_id) {
          db.createNotification({
            id: `notif-${Date.now()}`,
            user_id: nextCustomer.user_id,
            title: '🔔 Now Calling Your Token!',
            message: `Token ${nextCustomer.token_number}! Please proceed to ${counterId || nextCustomer.counter}.`,
            type: 'success'
          });
        }

        db.logActivity({
          userId: staffId,
          userName: staffName || 'Staff Officer',
          role: 'staff',
          action: 'staff_call_next',
          details: `Called Token: ${nextCustomer.token_number} at ${counterId || 'Counter'}`,
          ipAddress: clientIp
        });

        return sendJson(res, 200, { success: true, customer: nextCustomer });
      }

      // Staff Recall Current Token
      if (pathname === '/api/staff/recall' && req.method === 'POST') {
        const body = await parseBody(req);
        const { tokenId, counterId, staffName } = body;

        const entry = db.getQueueEntryById(tokenId);
        if (!entry) return sendJson(res, 404, { success: false, error: 'Token not found.' });

        if (entry.user_id) {
          db.createNotification({
            id: `notif-${Date.now()}`,
            user_id: entry.user_id,
            title: '📢 RECALL: Proceed to Counter!',
            message: `Reminder for Token ${entry.token_number}! You are being recalled at ${counterId || entry.counter}.`,
            type: 'warning'
          });
        }

        db.logActivity({
          userName: staffName || 'Staff Officer',
          role: 'staff',
          action: 'staff_recall_token',
          details: `Recalled Token: ${entry.token_number}`,
          ipAddress: clientIp
        });

        return sendJson(res, 200, { success: true, message: `Token ${entry.token_number} recalled.` });
      }

      // Staff Complete Service (With AI Accuracy Training Loop)
      if (pathname === '/api/staff/complete' && req.method === 'POST') {
        const body = await parseBody(req);
        const { tokenId, counterId, staffName, notes } = body;

        const entry = db.getQueueEntryById(tokenId);
        if (!entry) return sendJson(res, 404, { success: false, error: 'Token not found.' });

        const now = new Date().toISOString();
        const actualWaitMins = Math.max(1, Math.round(((new Date(now) - new Date(entry.joined_at)) / 60000) * 10) / 10);

        db.updateQueueStatus(tokenId, {
          status: 'Completed',
          completed_at: now,
          position: 0,
          actual_wait_mins: actualWaitMins,
          notes: notes ? `${entry.notes || ''} | Staff note: ${notes}` : entry.notes
        });

        if (counterId) {
          db.updateCounterStatus(counterId, 'Available', null);
        }

        // Trigger AI Online Adaptive Learning & Accuracy Logging
        const predictedWait = entry.predicted_wait_mins || 10;
        const trainResult = aiEngine.recordActualWaitAndTrain(
          entry.token_number,
          entry.service_id,
          predictedWait,
          actualWaitMins
        );

        if (trainResult) {
          db.logAiAccuracy({
            queueId: entry.id,
            tokenNumber: entry.token_number,
            serviceId: entry.service_id,
            predictedWaitMins: trainResult.predicted,
            actualWaitMins: trainResult.actual,
            errorMins: trainResult.error,
            accuracyPct: trainResult.accuracyPct
          });
        }

        if (entry.user_id) {
          db.createNotification({
            id: `notif-${Date.now()}`,
            user_id: entry.user_id,
            title: 'Service Completed',
            message: `Your session for ${entry.token_number} (${entry.service_name}) has been marked completed. Thank you!`,
            type: 'success'
          });
        }

        db.logActivity({
          userName: staffName || 'Staff Officer',
          role: 'staff',
          action: 'staff_completed_service',
          details: `Completed Token: ${entry.token_number}. Actual wait: ${actualWaitMins}m`,
          ipAddress: clientIp
        });

        return sendJson(res, 200, {
          success: true,
          actualWaitMins,
          aiFeedback: trainResult
        });
      }

      // Staff Skip Token
      if (pathname === '/api/staff/skip' && req.method === 'POST') {
        const body = await parseBody(req);
        const { tokenId, reason } = body;

        const entry = db.getQueueEntryById(tokenId);
        if (!entry) return sendJson(res, 404, { success: false, error: 'Token not found.' });

        // Move to end of waiting queue
        const now = new Date().toISOString();
        db.updateQueueStatus(tokenId, {
          status: 'Waiting',
          joined_at: now,
          cancellation_reason: reason || 'Deferred / Skipped by staff'
        });

        db.recomputeServicePositions(entry.service_id);

        return sendJson(res, 200, { success: true, message: `Token ${entry.token_number} skipped and deferred.` });
      }

      // Staff Mark No-Show
      if (pathname === '/api/staff/no-show' && req.method === 'POST') {
        const body = await parseBody(req);
        const { tokenId, counterId } = body;

        const entry = db.getQueueEntryById(tokenId);
        if (!entry) return sendJson(res, 404, { success: false, error: 'Token not found.' });

        db.updateQueueStatus(tokenId, {
          status: 'No-show',
          completed_at: new Date().toISOString(),
          position: 0
        });

        if (counterId) {
          db.updateCounterStatus(counterId, 'Available', null);
        }

        db.recomputeServicePositions(entry.service_id);

        return sendJson(res, 200, { success: true, message: `Token ${entry.token_number} marked as No-show.` });
      }

      // Staff Pause/Resume Counter
      if (pathname === '/api/staff/pause-counter' && req.method === 'POST') {
        const body = await parseBody(req);
        const { counterId, isPaused } = body;

        const status = isPaused ? 'Paused' : 'Available';
        db.updateCounterStatus(counterId, status, null);

        return sendJson(res, 200, { success: true, status });
      }

      // Staff Transfer Customer
      if (pathname === '/api/staff/transfer' && req.method === 'POST') {
        const body = await parseBody(req);
        const { tokenId, targetServiceId, targetCounter, reason } = body;

        const entry = db.getQueueEntryById(tokenId);
        if (!entry) return sendJson(res, 404, { success: false, error: 'Token not found.' });

        const targetService = db.getServiceById(targetServiceId);
        if (!targetService) return sendJson(res, 404, { success: false, error: 'Target service not found.' });

        db.updateQueueStatus(tokenId, {
          service_id: targetService.id,
          service_name: targetService.name,
          counter: targetCounter || targetService.counters,
          status: 'Waiting',
          transferred_from: entry.service_name,
          notes: `${entry.notes || ''} | Transferred from ${entry.service_name}: ${reason || 'Escalation'}`
        });

        db.recomputeServicePositions(entry.service_id);
        db.recomputeServicePositions(targetService.id);

        if (entry.user_id) {
          db.createNotification({
            id: `notif-${Date.now()}`,
            user_id: entry.user_id,
            title: 'Queue Transferred',
            message: `Your token ${entry.token_number} was transferred to ${targetService.name}.`,
            type: 'info'
          });
        }

        return sendJson(res, 200, { success: true, message: `Transferred to ${targetService.name}.` });
      }

      // ==========================================
      // AI & DEEP LEARNING PREDICTION APIS
      // ==========================================

      if (pathname === '/api/ai/predict-wait' && req.method === 'GET') {
        const peopleAhead = parseInt(parsedUrl.searchParams.get('peopleAhead') || '0', 10);
        const avgServiceTime = parseInt(parsedUrl.searchParams.get('avgServiceTime') || '5', 10);
        const activeCounters = parseInt(parsedUrl.searchParams.get('activeCounters') || '3', 10);
        const serviceId = parsedUrl.searchParams.get('serviceId') || 'hospital-opd';
        const priority = parsedUrl.searchParams.get('priority') || 'Normal';

        const prediction = aiEngine.calculateEstimatedWait({
          peopleAhead,
          avgServiceTime,
          activeCounters,
          serviceId,
          priority
        });

        return sendJson(res, 200, { success: true, prediction });
      }

      if (pathname === '/api/ai/accuracy' && req.method === 'GET') {
        const metrics = aiEngine.getAccuracyMetrics();
        const dbSummary = db.getAiAccuracySummary();
        const logs = db.getAiAccuracyLogs(15);

        return sendJson(res, 200, {
          success: true,
          metrics,
          dbSummary,
          recentLogs: logs
        });
      }

      if (pathname === '/api/ai/rush-hours' && req.method === 'GET') {
        const serviceId = parsedUrl.searchParams.get('serviceId') || 'hospital-opd';
        const curve = aiEngine.predictRushHourCurve(serviceId);
        const suggestedSlots = aiEngine.getSuggestedVisitSlots(serviceId);

        return sendJson(res, 200, {
          success: true,
          serviceId,
          curve,
          suggestedSlots
        });
      }

      // ==========================================
      // SUPER ADMIN DASHBOARD & MANAGEMENT APIS
      // ==========================================

      // Comprehensive Dashboard Statistics
      if (pathname === '/api/admin/dashboard-stats' && req.method === 'GET') {
        const allQueues = db.getAllQueues();
        const allCounters = db.getCounters();
        const allServices = db.getServices();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const totalToday = allQueues.filter(q => new Date(q.joined_at) >= todayStart).length || allQueues.length;
        const waiting = allQueues.filter(q => q.status === 'Waiting').length;
        const beingServed = allQueues.filter(q => q.status === 'Being Served').length;
        const completed = allQueues.filter(q => q.status === 'Completed').length;
        const cancelled = allQueues.filter(q => q.status === 'Cancelled' || q.status === 'No-show').length;

        const completedTokens = allQueues.filter(q => q.status === 'Completed' && q.actual_wait_mins);
        const avgWait = completedTokens.length > 0
          ? Math.round((completedTokens.reduce((acc, c) => acc + c.actual_wait_mins, 0) / completedTokens.length) * 10) / 10
          : 8.5;

        const avgService = allServices.length > 0
          ? Math.round(allServices.reduce((acc, s) => acc + s.avg_service_time_minutes, 0) / allServices.length)
          : 8;

        const activeCountersCount = allCounters.filter(c => c.status !== 'Paused' && c.status !== 'Closed').length;
        const aiSummary = db.getAiAccuracySummary();

        return sendJson(res, 200, {
          success: true,
          stats: {
            totalToday,
            waiting,
            beingServed,
            completed,
            cancelled,
            avgWait,
            avgService,
            activeCounters: activeCountersCount,
            totalCounters: allCounters.length,
            aiAccuracyPct: aiSummary.avgAccuracy,
            aiMae: aiSummary.mae
          }
        });
      }

      // Services CRUD
      if (pathname === '/api/admin/services/create' && req.method === 'POST') {
        const body = await parseBody(req);
        const { prefix, name, category, counters, avg_service_time_minutes, branch_id, active_counters } = body;

        if (!prefix || !name || !category) {
          return sendJson(res, 400, { success: false, error: 'Prefix, name, and category are required.' });
        }

        const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const created = db.createService({
          id,
          prefix,
          name,
          category,
          counters: counters || 'Counter 1',
          avg_service_time_minutes: parseInt(avg_service_time_minutes, 10) || 10,
          branch_id: branch_id || 'branch-main',
          active_counters: parseInt(active_counters, 10) || 2
        });

        return sendJson(res, 201, { success: true, service: created });
      }

      if (pathname === '/api/admin/services/update' && req.method === 'POST') {
        const body = await parseBody(req);
        const { id, ...updates } = body;
        const updated = db.updateService(id, updates);
        return sendJson(res, 200, { success: true, service: updated });
      }

      if (pathname === '/api/admin/services/delete' && req.method === 'POST') {
        const body = await parseBody(req);
        db.deleteService(body.id);
        return sendJson(res, 200, { success: true });
      }

      // Branches CRUD
      if (pathname === '/api/admin/branches' && req.method === 'GET') {
        const branches = db.getBranches();
        return sendJson(res, 200, { success: true, branches });
      }

      if (pathname === '/api/admin/branches/create' && req.method === 'POST') {
        const body = await parseBody(req);
        const id = `branch-${Date.now()}`;
        const created = db.createBranch({ id, ...body });
        return sendJson(res, 201, { success: true, branch: created });
      }

      // Counters CRUD
      if (pathname === '/api/admin/counters' && req.method === 'GET') {
        const counters = db.getCounters();
        return sendJson(res, 200, { success: true, counters });
      }

      if (pathname === '/api/admin/counters/create' && req.method === 'POST') {
        const body = await parseBody(req);
        const id = `ctr-${Date.now()}`;
        const created = db.createCounter({ id, ...body });
        return sendJson(res, 201, { success: true, counter: created });
      }

      if (pathname === '/api/admin/counters/update' && req.method === 'POST') {
        const body = await parseBody(req);
        const { id, ...updates } = body;
        const updated = db.updateCounter(id, updates);
        return sendJson(res, 200, { success: true, counter: updated });
      }

      // Staff Management
      if (pathname === '/api/admin/staff' && req.method === 'GET') {
        const staff = db.getAllStaff();
        return sendJson(res, 200, { success: true, staff });
      }

      if (pathname === '/api/admin/staff/update' && req.method === 'POST') {
        const body = await parseBody(req);
        const { id, ...updates } = body;
        const updated = db.updateUser(id, updates);
        return sendJson(res, 200, { success: true, staff: updated });
      }

      if (pathname === '/api/admin/staff/delete' && req.method === 'POST') {
        const body = await parseBody(req);
        db.deleteStaff(body.id);
        return sendJson(res, 200, { success: true });
      }

      // Queue Priority Modification
      if (pathname === '/api/admin/queues/priority' && req.method === 'POST') {
        const body = await parseBody(req);
        const { tokenId, priority } = body;
        const updated = db.updateQueuePriority(tokenId, priority);
        return sendJson(res, 200, { success: true, entry: updated });
      }

      // Manual / Kiosk Walk-in Token Generator
      if (pathname === '/api/admin/queues/manual-token' && req.method === 'POST') {
        const body = await parseBody(req);
        const { serviceId, customerName, customerPhone, priority = 'Normal', notes } = body;

        const services = db.getServices();
        const service = services.find(s => s.id === serviceId);
        if (!service) return sendJson(res, 404, { success: false, error: 'Service not found.' });

        const allQueues = db.getAllQueues();
        const prefixTokens = allQueues
          .filter(q => q.token_number && q.token_number.startsWith(service.prefix))
          .map(q => parseInt(q.token_number.split('-')[1], 10))
          .filter(n => !isNaN(n));

        const nextNum = prefixTokens.length > 0 ? Math.max(...prefixTokens) + 1 : 101;
        const tokenNumber = `${service.prefix}-${nextNum}`;

        const waitingCount = allQueues.filter(q => q.service_id === service.id && q.status === 'Waiting').length;
        const aiEst = aiEngine.calculateEstimatedWait({
          peopleAhead: waitingCount,
          avgServiceTime: service.avg_service_time_minutes,
          activeCounters: service.active_counters,
          serviceId: service.id,
          priority
        });

        const newEntry = db.createQueueEntry({
          id: `q-manual-${Date.now()}`,
          token_number: tokenNumber,
          service_id: service.id,
          service_name: service.name,
          user_id: null,
          customer_name: customerName || `Walk-in Guest (${tokenNumber})`,
          customer_phone: customerPhone || '+1 555-0000',
          status: 'Waiting',
          counter: service.counters,
          notes: notes || 'Admin Manual / Kiosk Issue',
          priority,
          joined_at: new Date().toISOString(),
          position: waitingCount + 1,
          is_walkin: 1,
          predicted_wait_mins: aiEst.estimatedMinutes
        });

        db.recomputeServicePositions(service.id);

        return sendJson(res, 201, { success: true, token: newEntry });
      }

      // Operating Hours & Holidays
      if (pathname === '/api/admin/operating-hours' && req.method === 'GET') {
        const hours = db.getOperatingHours();
        return sendJson(res, 200, { success: true, hours });
      }

      if (pathname === '/api/admin/operating-hours' && req.method === 'POST') {
        const body = await parseBody(req);
        const updated = db.updateOperatingHours(body.hours || []);
        return sendJson(res, 200, { success: true, hours: updated });
      }

      if (pathname === '/api/admin/holidays' && req.method === 'GET') {
        const holidays = db.getHolidays();
        return sendJson(res, 200, { success: true, holidays });
      }

      if (pathname === '/api/admin/holidays/create' && req.method === 'POST') {
        const body = await parseBody(req);
        const id = `hol-${Date.now()}`;
        const created = db.addHoliday({ id, ...body });
        return sendJson(res, 201, { success: true, holiday: created });
      }

      if (pathname === '/api/admin/holidays/delete' && req.method === 'POST') {
        const body = await parseBody(req);
        db.deleteHoliday(body.id);
        return sendJson(res, 200, { success: true });
      }

      // Complaints & Feedback
      if (pathname === '/api/complaints' && req.method === 'GET') {
        const list = db.getComplaints();
        return sendJson(res, 200, { success: true, complaints: list });
      }

      if (pathname === '/api/complaints/create' && req.method === 'POST') {
        const body = await parseBody(req);
        const id = `comp-${Date.now()}`;
        const created = db.createComplaint({ id, ...body });
        return sendJson(res, 201, { success: true, complaint: created });
      }

      if (pathname === '/api/admin/complaints/resolve' && req.method === 'POST') {
        const body = await parseBody(req);
        const updated = db.updateComplaintStatus(body.id, body.status || 'Resolved', body.resolution || 'Investigated and resolved.');
        return sendJson(res, 200, { success: true, complaint: updated });
      }

      // Activity Logs (Audit Trail)
      if (pathname === '/api/admin/activity-logs' && req.method === 'GET') {
        const logs = db.getActivityLogs(100);
        return sendJson(res, 200, { success: true, logs });
      }

      // Database Backups
      if (pathname === '/api/admin/backup/create' && req.method === 'POST') {
        const backup = db.createDatabaseBackup();
        return sendJson(res, 201, { success: true, backup });
      }

      if (pathname === '/api/admin/backups' && req.method === 'GET') {
        const backups = db.listBackups();
        return sendJson(res, 200, { success: true, backups });
      }

      // Export Reports (CSV)
      if (pathname === '/api/admin/export-report' && req.method === 'GET') {
        const queues = db.getAllQueues();
        const csvRows = [
          ['Token', 'Service', 'Customer Name', 'Priority', 'Status', 'Counter', 'Joined At', 'Wait Time (Mins)', 'Notes'].join(',')
        ];

        queues.forEach(q => {
          csvRows.push([
            q.token_number,
            `"${q.service_name}"`,
            `"${q.customer_name}"`,
            q.priority,
            q.status,
            `"${q.counter || ''}"`,
            q.joined_at,
            q.actual_wait_mins || q.predicted_wait_mins || 0,
            `"${(q.notes || '').replace(/"/g, '""')}"`
          ].join(','));
        });

        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=UTF-8',
          'Content-Disposition': 'attachment; filename="queueless_report.csv"'
        });
        res.end(csvRows.join('\n'));
        return;
      }

      // Notifications API
      if (pathname === '/api/notifications' && req.method === 'GET') {
        const userId = parsedUrl.searchParams.get('userId');
        if (!userId) return sendJson(res, 400, { success: false, error: 'Missing userId parameter.' });
        const list = db.getNotificationsByUserId(userId);
        return sendJson(res, 200, { success: true, notifications: list });
      }

      if (pathname === '/api/notifications/mark-read' && req.method === 'POST') {
        const body = await parseBody(req);
        if (body.id) {
          db.markNotificationAsRead(body.id);
        } else if (body.userId) {
          db.markAllNotificationsAsRead(body.userId);
        }
        return sendJson(res, 200, { success: true });
      }

      if (pathname === '/api/notifications/clear' && req.method === 'POST') {
        const body = await parseBody(req);
        if (body.userId) {
          db.clearNotificationsByUserId(body.userId);
        }
        return sendJson(res, 200, { success: true });
      }

      // ==========================================
      // HEALTHCARE EMERGENCY & SOS API
      // ==========================================

      if (pathname === '/api/emergency/sos' && req.method === 'POST') {
        const body = await parseBody(req);
        const {
          patientName, patientPhone, patientEmail, userId, serviceId,
          location, latitude, longitude, severity, description, voiceTranscript,
          guardianName, guardianPhone, isOfflineSync
        } = body;

        // Look up saved guardian if not directly provided
        let gName = guardianName;
        let gPhone = guardianPhone;
        if (!gPhone && userId) {
          const contacts = db.getEmergencyContacts(userId);
          if (contacts.length > 0) {
            gName = contacts[0].name;
            gPhone = contacts[0].phone;
          }
        }

        const incident = db.createEmergencyIncident({
          patient_name: patientName || 'Emergency Patient',
          patient_phone: patientPhone || '',
          patient_email: patientEmail || '',
          user_id: userId || null,
          service_id: serviceId || 'hospital-opd',
          location: location || 'Hospital OPD - Waiting Area A',
          latitude: latitude || null,
          longitude: longitude || null,
          severity: severity || 'Critical',
          description: description || 'Emergency assistance requested via Queueless SOS',
          voice_transcript: voiceTranscript || null,
          guardian_name: gName || null,
          guardian_phone: gPhone || null,
          guardian_notified: gPhone ? 1 : 0
        });

        // Broadcast alert notification to staff & admin users
        const staffUsers = db.getAllStaff();
        staffUsers.forEach(s => {
          db.createNotification({
            id: `notif-emg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            user_id: s.id,
            title: `🚨 EMERGENCY SOS: ${incident.severity} Alert`,
            message: `${incident.patient_name} at ${incident.location}: ${incident.description}`,
            type: 'error'
          });
        });

        db.logActivity({
          userId: userId || null,
          userName: incident.patient_name,
          role: 'emergency',
          action: 'sos_triggered',
          details: `ID: ${incident.id}, Loc: ${incident.location}, Severity: ${incident.severity}, Guardian: ${gPhone || 'None'}`,
          ipAddress: clientIp
        });

        return sendJson(res, 201, {
          success: true,
          incident,
          guardianNotified: !!gPhone,
          guardianDetails: gPhone ? { name: gName, phone: gPhone } : null
        });
      }

      if (pathname === '/api/emergency/incidents' && req.method === 'GET') {
        const status = parsedUrl.searchParams.get('status');
        const list = db.getEmergencyIncidents({ status });
        return sendJson(res, 200, { success: true, incidents: list });
      }

      if (pathname === '/api/emergency/resolve' && req.method === 'POST') {
        const body = await parseBody(req);
        const { incidentId, status, isFalseAlarm, falseAlarmReason, staffNotes, staffName } = body;
        if (!incidentId) return sendJson(res, 400, { success: false, error: 'incidentId is required.' });

        const updated = db.updateEmergencyIncidentStatus(incidentId, {
          status: status || 'Resolved',
          is_false_alarm: !!isFalseAlarm,
          false_alarm_reason: falseAlarmReason || null,
          staff_notes: staffNotes || null,
          resolved_by: staffName || 'Triage Officer'
        });

        db.logActivity({
          userName: staffName || 'Triage Officer',
          role: 'staff',
          action: isFalseAlarm ? 'emergency_false_alarm' : 'emergency_resolved',
          details: `Incident: ${incidentId}, Status: ${status}, Response time: ${updated ? updated.response_time_seconds : 0}s`,
          ipAddress: clientIp
        });

        return sendJson(res, 200, { success: true, incident: updated });
      }

      if (pathname === '/api/emergency/analytics' && req.method === 'GET') {
        const analytics = db.getEmergencyAnalytics();
        return sendJson(res, 200, { success: true, analytics });
      }

      if (pathname === '/api/emergency/contacts' && req.method === 'GET') {
        const userId = parsedUrl.searchParams.get('userId');
        if (!userId) return sendJson(res, 400, { success: false, error: 'userId parameter is required.' });
        const contacts = db.getEmergencyContacts(userId);
        return sendJson(res, 200, { success: true, contacts });
      }

      if (pathname === '/api/emergency/contacts' && req.method === 'POST') {
        const body = await parseBody(req);
        const { userId, name, relationship, phone, email } = body;
        if (!userId || !name || !phone) {
          return sendJson(res, 400, { success: false, error: 'User ID, Name, and Phone are required.' });
        }
        const saved = db.saveEmergencyContact({ user_id: userId, name, relationship, phone, email });
        return sendJson(res, 201, { success: true, contact: saved });
      }

      if (pathname === '/api/emergency/contacts' && req.method === 'DELETE') {
        const contactId = parsedUrl.searchParams.get('id');
        if (!contactId) return sendJson(res, 400, { success: false, error: 'Contact id is required.' });
        db.deleteEmergencyContact(contactId);
        return sendJson(res, 200, { success: true });
      }

      if (pathname === '/api/emergency/sync-offline' && req.method === 'POST') {
        const body = await parseBody(req);
        const incidents = Array.isArray(body.incidents) ? body.incidents : [];
        const synced = [];

        for (const inc of incidents) {
          const existing = db.getEmergencyIncidentById(inc.id);
          if (!existing) {
            const saved = db.createEmergencyIncident(inc);
            synced.push(saved);
          }
        }

        return sendJson(res, 200, { success: true, syncedCount: synced.length, synced });
      }

      if (pathname === '/api/emergency/export' && req.method === 'GET') {
        const incidents = db.getEmergencyIncidents();
        const headers = ['Incident ID', 'Patient Name', 'Phone', 'Location', 'Severity', 'Status', 'Is False Alarm', 'False Alarm Reason', 'Triggered At', 'Resolved At', 'Response Time (Seconds)', 'Staff Notes', 'Resolved By'];
        const rows = incidents.map(i => [
          i.id,
          `"${(i.patient_name || '').replace(/"/g, '""')}"`,
          `"${i.patient_phone || ''}"`,
          `"${(i.location || '').replace(/"/g, '""')}"`,
          i.severity,
          i.status,
          i.is_false_alarm ? 'Yes' : 'No',
          `"${(i.false_alarm_reason || '').replace(/"/g, '""')}"`,
          i.triggered_at,
          i.resolved_at || '',
          i.response_time_seconds || '',
          `"${(i.staff_notes || '').replace(/"/g, '""')}"`,
          `"${(i.resolved_by || '').replace(/"/g, '""')}"`
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=UTF-8',
          'Content-Disposition': 'attachment; filename="queueless_emergency_incidents.csv"'
        });
        res.end(csv);
        return;
      }

      // Endpoint Not Found
      return sendJson(res, 404, { success: false, error: `API route ${req.method} ${pathname} not found.` });
    } catch (err) {
      console.error('API Error:', err);
      return sendJson(res, 500, { success: false, error: err.message || 'Internal database server error.' });
    }
  }

  // ==========================================
  // STATIC ASSET SERVING
  // ==========================================
  const cleanPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(__dirname, cleanPath);

  // Security: Protect sensitive backend files & backend AI engine
  const lower = cleanPath.toLowerCase();
  if (
    lower.endsWith('.db') || 
    lower.endsWith('.sqlite') || 
    lower.endsWith('.sqlite3') || 
    lower.endsWith('.log') ||
    lower.includes('..') || 
    cleanPath === '/db.js' || 
    cleanPath === '/ai_engine.js' ||
    cleanPath === '/server.js' ||
    cleanPath.startsWith('/backups') ||
    cleanPath.startsWith('/.git')
  ) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Access to backend database, AI engine, and configuration files is strictly forbidden.');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const fallbackIndex = path.join(__dirname, 'index.html');
      fs.readFile(fallbackIndex, (errIndex, content) => {
        if (errIndex) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading file');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
      });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🚀 Queueless Server with SQLite & AI Engine is LIVE`);
  console.log(`👉 Web Application: http://localhost:${PORT}`);
  console.log(`💾 SQLite Database: ${db.DB_PATH}`);
  console.log(`🧠 AI Deep Learning Engine: Initialized with MLP Neural Network`);
  console.log(`🔍 Inspect with: DB Browser for SQLite (https://sqlitebrowser.org)`);
  console.log(`================================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Port ${PORT} in use, retrying on port ${PORT + 1}...`);
    PORT += 1;
    server.listen(PORT);
  } else {
    console.error('Server error:', err);
  }
});
