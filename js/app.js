// Queueless Core Router & Application Controller
// Welcoming customer routing with automatic service access upon registration and login

(function() {
  const { showToast, renderNavbar, renderFooter } = window.QueuelessComponents;

  class AppRouter {
    constructor() {
      this.currentRoute = 'home';
      this.pendingServiceId = null;
      this.charts = {
        volume: null,
        status: null
      };
      this.init();
    }

    init() {
      window.addEventListener('hashchange', () => this.handleRouteChange());
      window.addEventListener('DOMContentLoaded', () => this.handleRouteChange());

      window.store.subscribe(() => {
        this.renderCurrentView();
      });

      document.addEventListener('click', (e) => {
        const notifDropdown = document.getElementById('notif-dropdown');
        const notifBtn = document.getElementById('notif-bell-btn');
        if (notifDropdown && !notifDropdown.contains(e.target) && notifBtn && !notifBtn.contains(e.target)) {
          notifDropdown.classList.add('hidden');
        }
      });

      this.startLiveMonitoring();
      this.startLiveTickers();
    }

    startLiveMonitoring() {
      if (this.liveSyncInterval) clearInterval(this.liveSyncInterval);
      this.liveSyncInterval = setInterval(async () => {
        const route = this.currentRoute;
        if (['admin', 'admin-queues', 'staff-dashboard', 'tracking', 'emergency', 'admin-emergency'].includes(route)) {
          await window.store.syncWithSqlite();
          const modalCont = document.getElementById('app-modal-container');
          const isModalOpen = modalCont && modalCont.children.length > 0;
          const isTyping = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT');
          if (!isModalOpen && !isTyping) {
            this.renderCurrentView();
          }
        }
      }, 2500);
    }

    startLiveTickers() {
      if (this.liveTickerInterval) clearInterval(this.liveTickerInterval);
      this.liveTickerInterval = setInterval(() => {
        const timers = document.querySelectorAll('.live-timer[data-live-timestamp]');
        const now = Date.now();
        timers.forEach(el => {
          const ts = el.getAttribute('data-live-timestamp');
          if (ts) {
            const diff = Math.max(0, Math.floor((now - new Date(ts).getTime()) / 1000));
            const m = Math.floor(diff / 60);
            const s = diff % 60;
            el.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
          }
        });
      }, 1000);
    }

    handleRouteChange() {
      let hash = window.location.hash.replace('#', '').trim();
      if (!hash) hash = 'home';
      this.currentRoute = hash;
      this.renderCurrentView();
      window.scrollTo(0, 0);
    }

    renderCurrentView() {
      const appRoot = document.getElementById('app-root');
      if (!appRoot) return;

      const user = window.store.currentUser;
      const route = this.currentRoute;

      let pageHtml = '';
      switch (route) {
        case 'home':
          pageHtml = window.QueuelessPages.renderHomePage();
          break;
        case 'register':
          pageHtml = window.QueuelessPages.renderRegisterPage();
          break;
        case 'login':
          pageHtml = window.QueuelessPages.renderLoginPage();
          break;
        case 'admin-login':
          pageHtml = window.QueuelessPages.renderAdminLoginPage();
          break;
        case 'admin-register':
          pageHtml = window.QueuelessPages.renderAdminRegisterPage();
          break;
        case 'dashboard':
          pageHtml = window.QueuelessPages.renderCustomerDashboard();
          break;
        case 'services':
          pageHtml = window.QueuelessPages.renderServicesPage();
          break;
        case 'join-queue':
          pageHtml = window.QueuelessPages.renderJoinQueuePage();
          break;
        case 'token':
          pageHtml = window.QueuelessPages.renderDigitalTokenPage();
          break;
        case 'tracking':
          pageHtml = window.QueuelessPages.renderTrackingPage();
          break;
        case 'waiting-time':
          pageHtml = window.QueuelessPages.renderWaitingTimePage();
          break;
        case 'notifications':
          pageHtml = window.QueuelessPages.renderNotificationsPage();
          break;
        case 'history':
          pageHtml = window.QueuelessPages.renderHistoryPage();
          break;
        case 'staff-dashboard':
          pageHtml = window.QueuelessPages.renderStaffDashboard();
          break;
        case 'admin':
          pageHtml = window.QueuelessPages.renderAdminDashboard();
          break;
        case 'admin-queues':
          pageHtml = window.QueuelessPages.renderManageQueuesPage();
          break;
        case 'admin-reports':
          pageHtml = window.QueuelessPages.renderReportsPage();
          break;
        case 'profile':
          pageHtml = window.QueuelessPages.renderProfilePage();
          break;
        case 'emergency':
          pageHtml = window.QueuelessPages.renderEmergencyPage();
          break;
        case 'admin-emergency':
          pageHtml = window.QueuelessPages.renderAdminEmergencyDashboard();
          break;
        default:
          pageHtml = window.QueuelessPages.renderHomePage();
          break;
      }

      appRoot.innerHTML = `
        ${renderNavbar(route)}
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[75vh]">
          ${pageHtml}
        </main>
        ${renderFooter()}
      `;

      if (route === 'admin-reports' && user && user.role === 'admin') {
        setTimeout(() => this.initReportsCharts(), 50);
      }
    }

    // ==========================================
    // SPRINT 1: USER REGISTRATION & LOGIN
    // Seamless automatic login & direct service access
    // ==========================================

    togglePasswordVisibility(inputId) {
      const el = document.getElementById(inputId);
      if (el) {
        el.type = el.type === 'password' ? 'text' : 'password';
      }
    }

    checkPasswordStrength(pwd) {
      const bar = document.getElementById('pwd-strength-bar');
      const text = document.getElementById('pwd-strength-text');
      if (!bar || !text) return;

      let score = 0;
      if (pwd.length >= 6) score++;
      if (/[A-Z]/.test(pwd)) score++;
      if (/[0-9]/.test(pwd)) score++;
      if (/[^A-Za-z0-9]/.test(pwd)) score++;

      if (score === 0) {
        bar.style.width = '0%';
        bar.className = 'h-full bg-slate-300 transition-all duration-300';
        text.innerText = 'Strength: enter password';
      } else if (score <= 1) {
        bar.style.width = '25%';
        bar.className = 'h-full bg-rose-500 transition-all duration-300';
        text.innerText = 'Strength: Weak (add uppercase & number)';
      } else if (score === 2) {
        bar.style.width = '60%';
        bar.className = 'h-full bg-amber-500 transition-all duration-300';
        text.innerText = 'Strength: Fair';
      } else {
        bar.style.width = '100%';
        bar.className = 'h-full bg-emerald-500 transition-all duration-300';
        text.innerText = 'Strength: Strong ✓';
      }
    }

    async handleRegister(e) {
      e.preventDefault();
      const errBox = document.getElementById('register-error');
      const submitBtn = document.getElementById('reg-submit-btn');
      if (errBox) errBox.classList.add('hidden');
      if (submitBtn) submitBtn.disabled = true;

      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const phone = document.getElementById('reg-phone').value;
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('reg-confirm-password').value;

      const res = await window.store.registerUser({
        name,
        email,
        phone,
        password,
        confirmPassword
      });

      if (submitBtn) submitBtn.disabled = false;

      if (!res.success) {
        if (errBox) {
          errBox.innerText = res.error;
          errBox.classList.remove('hidden');
        }
        showToast('Registration Error', res.error, 'error');
        return;
      }

      // Automatically log the user in immediately so they can access services without extra steps!
      await window.store.loginUser(email, password);

      showToast('Welcome to Queueless!', `Account created! Choose a service desk below to enter a virtual queue.`, 'success');

      // If user had clicked on a specific service prior to signing up, open it directly
      if (this.pendingServiceId) {
        const srvId = this.pendingServiceId;
        this.pendingServiceId = null;
        window.location.hash = '#services';
        setTimeout(() => this.openJoinModal(srvId), 200);
      } else {
        // Direct to available services page
        window.location.hash = '#services';
      }
    }

    async handleStaffRegister(e) {
      e.preventDefault();
      const errBox = document.getElementById('admin-register-error');
      const submitBtn = document.getElementById('admin-reg-submit-btn');
      if (errBox) errBox.classList.add('hidden');
      if (submitBtn) submitBtn.disabled = true;

      const name = document.getElementById('admin-reg-name').value;
      const department = document.getElementById('admin-reg-department').value;
      const email = document.getElementById('admin-reg-email').value;
      const phone = document.getElementById('admin-reg-phone').value;
      const staffPasscode = document.getElementById('admin-reg-passcode').value;
      const password = document.getElementById('admin-reg-password').value;
      const confirmPassword = document.getElementById('admin-reg-confirm-password').value;

      const res = await window.store.registerStaffUser({
        name,
        department,
        email,
        phone,
        staffPasscode,
        password,
        confirmPassword
      });

      if (submitBtn) submitBtn.disabled = false;

      if (!res.success) {
        if (errBox) {
          errBox.innerText = res.error;
          errBox.classList.remove('hidden');
        }
        showToast('Staff Registration Error', res.error, 'error');
        return;
      }

      await window.store.loginUser(email, password);
      showToast('Staff Credentials Activated', `Welcome, Officer ${res.user.name}. Staff Operations Console loaded.`, 'success');
      if (res.user.role === 'staff') { window.location.hash = '#staff-dashboard'; } else { window.location.hash = '#admin'; }
    }

    async handleLogin(e) {
      e.preventDefault();
      const errBox = document.getElementById('login-error');
      const submitBtn = document.getElementById('login-submit-btn');
      if (errBox) errBox.classList.add('hidden');
      if (submitBtn) submitBtn.disabled = true;

      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      const res = await window.store.loginUser(email, password);
      if (submitBtn) submitBtn.disabled = false;

      if (!res.success) {
        if (errBox) {
          errBox.innerText = res.error;
          errBox.classList.remove('hidden');
        }
        showToast('Authentication Failed', res.error, 'error');
        return;
      }

      showToast('Welcome Back!', `Signed in as ${res.user.name}. You now have full access to services.`, 'success');

      if (res.user.role === 'admin') {
        window.location.hash = '#admin';
      } else {
        // If user already had a pending service, open it
        if (this.pendingServiceId) {
          const srvId = this.pendingServiceId;
          this.pendingServiceId = null;
          window.location.hash = '#services';
          setTimeout(() => this.openJoinModal(srvId), 200);
        } else {
          // Check if user already has an active ticket: if so, go to tracking; if not, go to services to pick one!
          const active = window.store.getActiveQueueForUser(res.user.id);
          if (active) {
            window.location.hash = '#tracking';
          } else {
            window.location.hash = '#services';
          }
        }
      }
    }

    async handleAdminLogin(e) {
      e.preventDefault();
      const errBox = document.getElementById('admin-login-error');
      const submitBtn = document.getElementById('admin-login-submit-btn');
      if (errBox) errBox.classList.add('hidden');
      if (submitBtn) submitBtn.disabled = true;

      const email = document.getElementById('admin-login-email').value;
      const password = document.getElementById('admin-login-password').value;

      const res = await window.store.loginUser(email, password);
      if (submitBtn) submitBtn.disabled = false;

      if (!res.success) {
        if (errBox) {
          errBox.innerText = res.error;
          errBox.classList.remove('hidden');
        }
        showToast('Authentication Failed', res.error, 'error');
        return;
      }

      if (res.user.role !== 'admin' && res.user.role !== 'staff') {
        window.store.logoutUser();
        const msg = 'Access Denied: This account is a Customer account. The Staff Portal is strictly for authorized counter officers and administrators.';
        if (errBox) {
          errBox.innerText = msg;
          errBox.classList.remove('hidden');
        }
        showToast('Staff Access Denied', msg, 'error');
        return;
      }

      showToast('Staff Authenticated', `Welcome, Officer ${res.user.name}. Staff Operations Console loaded.`, 'success');
      window.location.hash = '#admin';
    }

    logout() {
      window.store.logoutUser();
      showToast('Signed Out', 'You have been signed out. Have a great day!', 'info');
      window.location.hash = '#home';
    }

    async quickLoginCustomer() {
      const res = await window.store.loginUser('alex.turner@example.com', 'Password123!');
      if (res.success) {
        showToast('Welcome, Alex!', 'Signed in as Customer persona. Select a service to enter line.', 'success');
        const active = window.store.getActiveQueueForUser(res.user.id);
        if (active) {
          window.location.hash = '#tracking';
        } else {
          window.location.hash = '#services';
        }
      }
    }

    async quickLoginStaff() {
      const res = await window.store.loginUser('staff@queueless.com', 'StaffPass123!');
      if (res.success) {
        showToast('Staff Officer Active', 'Signed in as Officer David Miller (Counter 1 - Hospital OPD).', 'success');
        window.location.hash = '#staff-dashboard';
      }
    }

    async quickLoginAdmin() {
      const res = await window.store.loginUser('admin@queueless.com', 'AdminPass123!');
      if (res.success) {
        showToast('Staff Operations Active', 'Signed in as Officer Sarah Jenkins (Desk Supervisor).', 'success');
        window.location.hash = '#admin';
      }
    }

    async handleProfileUpdate(e) {
      e.preventDefault();
      const msgBox = document.getElementById('profile-msg');
      if (msgBox) msgBox.classList.add('hidden');

      const name = document.getElementById('prof-name').value;
      const phone = document.getElementById('prof-phone').value;
      const currentPassword = document.getElementById('prof-current-pwd').value;
      const newPassword = document.getElementById('prof-new-pwd').value;
      const confirmNewPassword = document.getElementById('prof-confirm-pwd').value;

      const res = await window.store.updateProfile({
        name,
        phone,
        currentPassword,
        newPassword,
        confirmNewPassword
      });

      if (!res.success) {
        if (msgBox) {
          msgBox.className = 'p-3 rounded-xl text-xs bg-rose-50 border border-rose-200 text-rose-700 block';
          msgBox.innerText = res.error;
        }
        showToast('Update Failed', res.error, 'error');
        return;
      }

      if (msgBox) {
        msgBox.className = 'p-3 rounded-xl text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 block';
        msgBox.innerText = 'Profile details updated successfully!';
      }
      showToast('Profile Saved', 'Your profile updates have been saved.', 'success');
    }

    // ==========================================
    // SPRINT 2: VIRTUAL QUEUE ACTIONS
    // ==========================================

    openJoinModal(serviceId) {
      window.QueuelessModals.openJoinModal(serviceId);
    }

    async submitJoinModal(e, serviceId) {
      e.preventDefault();
      const name = document.getElementById('modal-join-name')?.value.trim();
      const email = document.getElementById('modal-join-email')?.value.trim();
      const phone = document.getElementById('modal-join-phone')?.value.trim();
      const notes = document.getElementById('modal-join-notes')?.value.trim() || 'General Consultation';
      const priority = document.getElementById('modal-join-priority')?.value || 'Normal';

      if (!name || !email || !phone) {
        showToast('Missing Details', 'Please fill in your Name, Email, and Phone Number to receive your unique token.', 'warning');
        return;
      }

      const submitBtn = document.getElementById('modal-join-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Generating Unique Token...
        `;
      }

      const res = await window.store.joinQueue({
        serviceId,
        name,
        email,
        phone,
        notes,
        priority
      });

      const modalCont = document.getElementById('app-modal-container');
      if (modalCont) modalCont.innerHTML = '';

      if (!res.success) {
        if (res.activeToken) {
          showToast('Active Token Notice', res.error, 'info');
          window.location.hash = '#token';
        } else {
          showToast('Queue Notice', res.error, 'warning');
        }
        return;
      }

      showToast('Token Issued!', `Unique Token ${res.token.tokenNumber} issued! You are #${res.token.position} in line.`, 'success');
      window.location.hash = '#token';
    }

    async handleDirectJoin(e) {
      e.preventDefault();
      const selected = document.querySelector('input[name="serviceId"]:checked');
      if (!selected) {
        showToast('Selection Required', 'Please select a service desk.', 'warning');
        return;
      }

      const notes = document.getElementById('join-notes').value;
      const res = await window.store.joinQueue(selected.value, notes);

      if (!res.success) {
        const errBox = document.getElementById('join-error');
        if (errBox) {
          errBox.innerText = res.error;
          errBox.classList.remove('hidden');
        }
        showToast('Queue Notice', res.error, 'warning');
        return;
      }

      showToast('Token Created', `Token ${res.token.tokenNumber} issued. You can track your position live.`, 'success');
      window.location.hash = '#token';
    }

    openLeaveModal(tokenId) {
      window.QueuelessModals.openLeaveModal(tokenId);
    }

    async confirmLeaveQueue(tokenId) {
      const reasonSelect = document.getElementById('leave-reason-select');
      const reason = reasonSelect ? reasonSelect.value : 'Customer cancelled remotely';

      const res = await window.store.leaveQueue(tokenId, reason);
      document.getElementById('app-modal-container').innerHTML = '';

      if (res.success) {
        showToast('Queue Left', 'Your virtual pass was cancelled and your spot released.', 'info');
        window.location.hash = '#history';
      } else {
        showToast('Error', res.error, 'error');
      }
    }

    // ==========================================
    // SPRINT 3: NOTIFICATIONS
    // ==========================================

    toggleNotificationDropdown() {
      const dropdown = document.getElementById('notif-dropdown');
      if (dropdown) {
        dropdown.classList.toggle('hidden');
      }
    }

    async markNotificationRead(id) {
      await window.store.markNotificationAsRead(id);
    }

    async markAllNotificationsRead() {
      if (window.store.currentUser) {
        await window.store.markAllNotificationsAsRead(window.store.currentUser.id);
        showToast('Notifications', 'All notifications marked as read', 'info');
      }
    }

    async clearAllNotifications() {
      if (window.store.currentUser) {
        await window.store.clearNotifications(window.store.currentUser.id);
        showToast('Notifications Cleared', 'All notification records cleared.', 'info');
      }
    }

    toggleMobileMenu() {
      const menu = document.getElementById('mobile-menu');
      if (menu) menu.classList.toggle('hidden');
    }

    filterHistory(status) {
      const rows = document.querySelectorAll('#history-table tbody tr');
      rows.forEach(r => {
        if (status === 'all' || r.getAttribute('data-status') === status) {
          r.style.display = '';
        } else {
          r.style.display = 'none';
        }
      });
    }

    // ==========================================
    // SPRINT 4: ADMIN OPERATIONS & CHARTS
    // ==========================================

    async callNext(serviceId) {
      const res = await window.store.callNextCustomer(serviceId);
      if (!res.success) {
        showToast('Counter Notice', res.error, 'warning');
      } else {
        showToast('Now Serving', `Token ${res.customer.token_number} called to desk.`, 'success');
      }
    }

    async completeService(tokenId) {
      const res = await window.store.completeCustomerService(tokenId);
      if (!res.success) {
        showToast('Notice', res.error, 'warning');
      } else {
        showToast('Completed', 'Customer service marked as complete.', 'success');
      }
    }

    async markNoShow(tokenId) {
      const res = await window.store.markCustomerNoShow(tokenId);
      if (!res.success) {
        showToast('Notice', res.error, 'warning');
      } else {
        showToast('No-Show Recorded', 'Customer recorded as No-Show.', 'warning');
      }
    }

    async toggleServicePause(serviceId) {
      const res = await window.store.toggleServicePause(serviceId);
      if (res.success) {
        showToast(
          res.isPaused ? 'Service Paused' : 'Service Resumed',
          `Queue intake is now ${res.isPaused ? 'paused' : 'open'}.`,
          res.isPaused ? 'warning' : 'success'
        );
      }
    }

    openWalkInModal(serviceId) {
      window.QueuelessModals.openWalkInModal(serviceId);
    }

    async submitWalkIn(e) {
      e.preventDefault();
      const srvId = document.getElementById('walkin-service').value;
      const name = document.getElementById('walkin-name').value;
      const phone = document.getElementById('walkin-phone').value;
      const notes = document.getElementById('walkin-notes').value;

      const res = await window.store.addWalkInCustomer(srvId, name, phone, notes);
      document.getElementById('app-modal-container').innerHTML = '';

      if (res.success) {
        showToast('Walk-in Added', `Issued token ${res.token.token_number} for ${res.token.customer_name}.`, 'success');
      } else {
        showToast('Error', res.error, 'error');
      }
    }

    toggleSimulation() {
      const isActive = window.store.toggleSimulation();
      showToast(
        isActive ? 'Live Simulation Started' : 'Simulation Stopped',
        isActive ? 'Background queues will auto-advance every 14 seconds.' : 'Manual mode active.',
        isActive ? 'success' : 'info'
      );
    }

    updateReportsView() {
      const srvFilter = document.getElementById('report-service-filter')?.value || 'all';
      const dateFilter = document.getElementById('report-date-filter')?.value || 'all';

      const data = window.store.getReportsData(srvFilter, dateFilter);

      const elServed = document.getElementById('rep-served');
      const elWaiting = document.getElementById('rep-waiting');
      const elAvgWait = document.getElementById('rep-avgwait');
      const elTotal = document.getElementById('rep-total');

      if (elServed) elServed.innerText = data.totalServed;
      if (elWaiting) elWaiting.innerText = data.totalWaiting;
      if (elAvgWait) elAvgWait.innerText = `~${data.avgWaitTimeMinutes}m`;
      if (elTotal) elTotal.innerText = data.totalTotal;

      this.initReportsCharts(data);
    }

    initReportsCharts(customData = null) {
      if (typeof Chart === 'undefined') return;

      const srvFilter = document.getElementById('report-service-filter')?.value || 'all';
      const dateFilter = document.getElementById('report-date-filter')?.value || 'all';
      const data = customData || window.store.getReportsData(srvFilter, dateFilter);

      const barCanvas = document.getElementById('serviceVolumeChart');
      if (barCanvas) {
        if (this.charts.volume) {
          this.charts.volume.destroy();
        }

        const labels = data.serviceBreakdown.map(b => b.service.name);
        const servedCounts = data.serviceBreakdown.map(b => b.completed);
        const waitingCounts = data.serviceBreakdown.map(b => b.waiting);
        const cancelledCounts = data.serviceBreakdown.map(b => b.cancelled + b.noshow);

        this.charts.volume = new Chart(barCanvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Served',
                data: servedCounts,
                backgroundColor: 'rgba(16, 185, 129, 0.85)',
                borderRadius: 6
              },
              {
                label: 'Waiting',
                data: waitingCounts,
                backgroundColor: 'rgba(59, 130, 246, 0.85)',
                borderRadius: 6
              },
              {
                label: 'Cancelled / No-Show',
                data: cancelledCounts,
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                borderRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { boxWidth: 12, font: { size: 11 } }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
              }
            }
          }
        });
      }

      const doughnutCanvas = document.getElementById('statusDoughnutChart');
      if (doughnutCanvas) {
        if (this.charts.status) {
          this.charts.status.destroy();
        }

        this.charts.status = new Chart(doughnutCanvas, {
          type: 'doughnut',
          data: {
            labels: ['Completed', 'Waiting', 'Serving', 'Cancelled', 'No-show'],
            datasets: [{
              data: [
                data.totalServed,
                data.totalWaiting,
                data.totalServing,
                data.totalCancelled,
                data.totalNoShow
              ],
              backgroundColor: [
                '#10b981',
                '#3b82f6',
                '#8b5cf6',
                '#f59e0b',
                '#ef4444'
              ],
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { boxWidth: 12, font: { size: 11 } }
              }
            },
            cutout: '65%'
          }
        });
      }
    }

    // ==========================================
    // AI SIMULATOR HANDLER
    // ==========================================
    updateAiSim(key, val) {
      if (!window.aiSimState) {
        window.aiSimState = {
          peopleAhead: 12,
          avgServiceTime: 5,
          activeCounters: 3,
          counterAvailability: 1.0,
          serviceId: 'hospital-opd',
          priority: 'Normal'
        };
      }
      window.aiSimState[key] = val;
      this.renderCurrentView();
    }

    // ==========================================
    // ENTERPRISE STAFF OPERATIONS HANDLERS
    // ==========================================
    async staffCallNext(serviceId, counterName) {
      const counterId = window.staffActiveCounter || 'ctr-1';
      const res = await window.store.staffCallNext({ serviceId, counterId });
      if (res.success) {
        showToast('Customer Called', `Token ${res.customer.tokenNumber} please proceed to ${counterName || 'Counter'}.`, 'success');
      } else {
        showToast('Call Next Token', res.error || 'Failed to call customer.', 'warning');
      }
    }

    async staffRecall(tokenId, counterName) {
      const counterId = window.staffActiveCounter || 'ctr-1';
      const res = await window.store.staffRecall({ tokenId, counterId });
      if (res.success) {
        showToast('Token Recalled', res.message || 'Customer notified.', 'info');
      }
    }

    async staffCompleteService(tokenId, counterName) {
      const counterId = window.staffActiveCounter || 'ctr-1';
      const notes = prompt('Enter service completion summary notes (optional):', 'Service completed successfully.');
      const res = await window.store.staffComplete({ tokenId, counterId, notes: notes || '' });
      if (res.success) {
        showToast('Service Finalized', `Token completed. Actual duration: ${res.actualWaitMins}m. AI model adapted online.`, 'success');
      }
    }

    async staffSkip(tokenId) {
      const reason = prompt('Reason for skipping this customer:', 'Customer stepped away temporarily');
      if (reason === null) return;
      const res = await window.store.staffSkip({ tokenId, reason });
      if (res.success) {
        showToast('Token Deferred', res.message, 'warning');
      }
    }

    async staffNoShow(tokenId, counterId) {
      if (!confirm('Mark this customer as Absent / No-Show? This releases your counter.')) return;
      const res = await window.store.staffNoShow({ tokenId, counterId: window.staffActiveCounter || 'ctr-1' });
      if (res.success) {
        showToast('Customer Marked Absent', res.message, 'info');
      }
    }

    async toggleCounterPause(counterId, isPaused) {
      const res = await window.store.staffPauseCounter({ counterId, isPaused });
      if (res.success) {
        showToast('Counter Status Updated', `Counter is now ${res.status}.`, 'info');
        this.renderCurrentView();
      }
    }

    async staffCallSpecificCustomer(tokenId, counterName) {
      const entry = window.store.queues.find(q => q.id === tokenId);
      if (!entry) return;
      await this.staffCallNext(entry.serviceId, counterName);
    }

    async submitTransferCustomer(e, tokenId) {
      e.preventDefault();
      const targetServiceId = document.getElementById('transfer-service-select').value;
      const reason = document.getElementById('transfer-reason').value;
      const res = await window.store.staffTransfer({ tokenId, targetServiceId, targetCounter: 'Counter Triage', reason });
      window.QueuelessModals.closeModal();
      if (res.success) {
        showToast('Customer Transferred', res.message, 'success');
      } else {
        showToast('Transfer Failed', res.error, 'error');
      }
    }

    // ==========================================
    // SUPER ADMIN TAB & MANAGEMENT HANDLERS
    // ==========================================
    switchAdminTab(tabId) {
      window.adminActiveTab = tabId;
      this.renderCurrentView();
    }

    async submitServiceModal(e, serviceId) {
      e.preventDefault();
      const prefix = document.getElementById('svc-prefix').value;
      const name = document.getElementById('svc-name').value;
      const category = document.getElementById('svc-category').value;
      const counters = document.getElementById('svc-counters').value;
      const avg_service_time_minutes = document.getElementById('svc-avg-time').value;
      const active_counters = document.getElementById('svc-active-ctrs').value;

      let res;
      if (serviceId) {
        res = await window.store.adminUpdateService(serviceId, { prefix, name, category, counters, avg_service_time_minutes, active_counters });
      } else {
        res = await window.store.adminCreateService({ prefix, name, category, counters, avg_service_time_minutes, active_counters });
      }

      window.QueuelessModals.closeModal();
      if (res.success) {
        showToast('Service Desk Saved', `${name} updated in SQLite database.`, 'success');
      } else {
        showToast('Error', res.error, 'error');
      }
    }

    async deleteService(serviceId) {
      if (!confirm('Are you sure you want to delete this service desk?')) return;
      const res = await window.store.adminDeleteService(serviceId);
      if (res.success) {
        showToast('Service Removed', 'Service desk deleted from SQLite database.', 'info');
      }
    }

    async submitChangePriority(e, tokenId) {
      e.preventDefault();
      const priority = document.getElementById('change-priority-select').value;
      const res = await window.store.adminUpdateQueuePriority(tokenId, priority);
      window.QueuelessModals.closeModal();
      if (res.success) {
        showToast('Queue Priority Updated', `Token priority set to ${priority}. Queue sequence recomputed.`, 'success');
      }
    }

    async submitCustomerComplaint(e) {
      e.preventDefault();
      const customer_name = document.getElementById('comp-name').value;
      const customer_phone = document.getElementById('comp-phone').value;
      const subject = document.getElementById('comp-subject').value;
      const details = document.getElementById('comp-details').value;

      const res = await window.store.customerSubmitComplaint({ customer_name, customer_phone, subject, details });
      window.QueuelessModals.closeModal();
      if (res.success) {
        showToast('Feedback Received', 'Your ticket has been submitted to the administration.', 'success');
      }
    }

    async resolveComplaint(id) {
      const resolution = prompt('Enter investigation resolution remarks:', 'Investigated and resolved.');
      if (resolution === null) return;
      const res = await window.store.adminResolveComplaint(id, resolution);
      if (res.success) {
        showToast('Ticket Resolved', 'Customer feedback marked as resolved.', 'success');
        this.renderCurrentView();
      }
    }

    async submitAddHoliday(e) {
      e.preventDefault();
      const date = document.getElementById('hol-date').value;
      const name = document.getElementById('hol-name').value;
      const notes = document.getElementById('hol-notes').value;

      const res = await window.store.adminCreateHoliday({ date, name, notes });
      window.QueuelessModals.closeModal();
      if (res.success) {
        showToast('Holiday Added', `${name} scheduled for ${date}.`, 'success');
        this.renderCurrentView();
      }
    }

    async createDatabaseBackup() {
      const res = await window.store.adminCreateBackup();
      if (res.success) {
        showToast('Backup Created', `Snapshot saved: ${res.backup.fileName} (${res.backup.sizeKb} KB)`, 'success');
      } else {
        showToast('Backup Failed', res.error, 'error');
      }
    }

    // ==========================================
    // HEALTHCARE EMERGENCY & ACCESSIBILITY ACTIONS
    // ==========================================

    async executeEmergencySosTrigger() {
      const locSelect = document.getElementById('emergency-location-select');
      const location = locSelect ? locSelect.value : 'Hospital OPD - Waiting Area A';
      const descInput = document.getElementById('emergency-description');
      const description = descInput ? descInput.value.trim() : 'Emergency assistance requested via Queueless SOS';
      const gNameInput = document.getElementById('emergency-guardian-name');
      const guardianName = gNameInput ? gNameInput.value.trim() : null;
      const gPhoneInput = document.getElementById('emergency-guardian-phone');
      const guardianPhone = gPhoneInput ? gPhoneInput.value.trim() : null;

      const triggerBtn = document.getElementById('sos-confirm-trigger-btn');
      if (triggerBtn) {
        triggerBtn.disabled = true;
        triggerBtn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          DISPATCHING EMERGENCY TRIAGE...
        `;
      }

      const res = await window.store.triggerEmergencySOS({
        location,
        description,
        guardianName,
        guardianPhone,
        latitude: this.currentLatitude || 37.7749,
        longitude: this.currentLongitude || -122.4194,
        severity: 'Critical'
      });

      const modalCont = document.getElementById('app-modal-container');
      if (modalCont) modalCont.innerHTML = '';

      if (res.success) {
        if (res.isOffline) {
          showToast('Offline Emergency Cached', res.message || 'Stored in local buffer. Retrying transmission...', 'warning');
        } else {
          showToast('🚨 Emergency Dispatched!', `Hospital medical team dispatched to ${location}. Guardian SMS alert notified.`, 'error');
        }
        window.location.hash = '#emergency';
      } else {
        showToast('Emergency Error', res.error || 'Failed to dispatch.', 'error');
      }
    }

    fetchCurrentGpsLocation() {
      const coordsText = document.getElementById('gps-coords-text');
      const btn = document.getElementById('btn-detect-gps');
      if (btn) btn.textContent = 'Detecting GPS...';

      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.currentLatitude = pos.coords.latitude;
            this.currentLongitude = pos.coords.longitude;
            if (coordsText) {
              coordsText.textContent = `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`;
            }
            if (btn) btn.textContent = 'GPS Locked ✓';
            showToast('GPS Location Locked', `Coordinates: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, 'info');
          },
          (err) => {
            // Simulated hospital coordinates fallback
            this.currentLatitude = 37.7749;
            this.currentLongitude = -122.4194;
            if (coordsText) coordsText.textContent = 'Hospital OPD Pavilion B (37.7749, -122.4194)';
            if (btn) btn.textContent = 'Hospital GPS Set';
            showToast('Location Set', 'Using Hospital OPD Main Center Coordinates.', 'info');
          },
          { timeout: 5000, enableHighAccuracy: true }
        );
      } else {
        showToast('Geolocation Unavailable', 'Using Hospital OPD Default Wing Location.', 'info');
      }
    }

    startVoiceEmergencyRecognition() {
      const descInput = document.getElementById('emergency-description');
      const micBtn = document.getElementById('voice-mic-btn');

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'en-US';
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

          if (micBtn) {
            micBtn.innerHTML = '<span>Listening...</span><span class="w-2 h-2 rounded-full bg-white animate-ping"></span>';
            micBtn.classList.add('bg-red-700');
          }

          recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (descInput) {
              descInput.value = transcript;
            }
            showToast('Voice Captured', `"${transcript}"`, 'info');
            if (micBtn) {
              micBtn.innerHTML = '<span>Voice Captured ✓</span>';
              micBtn.classList.remove('bg-red-700');
            }
          };

          recognition.onerror = (event) => {
            console.warn('Speech error:', event.error);
            if (micBtn) {
              micBtn.innerHTML = '<span>Voice Ready</span>';
              micBtn.classList.remove('bg-red-700');
            }
          };

          recognition.start();
        } catch (e) {
          console.warn('Speech recognition start error:', e);
        }
      } else {
        // Fallback for browsers without speech recognition
        if (descInput) {
          descInput.value = 'Severe chest tightness & acute distress reported via voice assistant';
        }
        showToast('Voice Recorded', 'Symptoms noted from voice prompt.', 'info');
      }
    }

    async submitFalseAlarmResolution(e, incidentId) {
      e.preventDefault();
      const reasonSelect = document.getElementById('false-alarm-reason');
      const notesInput = document.getElementById('false-alarm-notes');
      const reason = reasonSelect ? reasonSelect.value : 'Accidental press';
      const staffNotes = notesInput ? notesInput.value : '';

      const res = await window.store.resolveEmergencyIncident({
        incidentId,
        status: 'False Alarm',
        isFalseAlarm: true,
        falseAlarmReason: reason,
        staffNotes
      });

      const modalCont = document.getElementById('app-modal-container');
      if (modalCont) modalCont.innerHTML = '';

      if (res.success) {
        showToast('Alert Cleared', 'Incident verified and logged as False Alarm.', 'info');
      } else {
        showToast('Error', res.error || 'Failed to update alert.', 'error');
      }
    }

    async resolveEmergencyAlert(incidentId, status = 'Resolved') {
      const res = await window.store.resolveEmergencyIncident({
        incidentId,
        status,
        isFalseAlarm: false,
        staffNotes: 'Triage response team arrived on scene. Vitals stabilized.'
      });

      if (res.success) {
        showToast('Incident Resolved', `Emergency alert ${incidentId} marked as resolved.`, 'success');
      } else {
        showToast('Error', res.error || 'Could not update incident.', 'error');
      }
    }

    async submitSaveEmergencyContact(e) {
      e.preventDefault();
      const user = window.store.currentUser;
      const name = document.getElementById('em-contact-name')?.value.trim();
      const rel = document.getElementById('em-contact-rel')?.value.trim();
      const phone = document.getElementById('em-contact-phone')?.value.trim();
      const email = document.getElementById('em-contact-email')?.value.trim();

      const res = await window.store.saveEmergencyContact({
        userId: user ? user.id : 'user-cust-1',
        name,
        relationship: rel,
        phone,
        email
      });

      if (res.success) {
        showToast('Guardian Saved', `Emergency notifications will be dispatched to ${name} (${phone}).`, 'success');
        this.renderCurrentView();
      } else {
        showToast('Error', res.error || 'Failed to save contact.', 'error');
      }
    }

    async deleteEmergencyContact(id) {
      const res = await window.store.deleteEmergencyContact(id);
      if (res.success) {
        showToast('Contact Removed', 'Emergency guardian contact removed.', 'info');
        this.renderCurrentView();
      }
    }

    toggleAccessibilityControls() {
      const isAccess = window.store.toggleAccessibilityMode();
      showToast(
        'Accessibility Mode',
        isAccess ? 'Large Font & Accessible Touch Targets Enabled' : 'Standard View Restored',
        'info'
      );
    }

  }

  window.router = new AppRouter();
})();
