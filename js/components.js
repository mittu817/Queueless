// Reusable UI Components for Queueless Application
// Clean, welcoming, professional customer-facing navigation and UI components

(function() {
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderJiraBadge(issueId, title = '') {
    return `<span class="jira-badge" title="${escapeHtml(title)}"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>${escapeHtml(issueId)}</span>`;
  }

  function showToast(title, message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col space-y-3 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `pointer-events-auto transform transition-all duration-300 ease-out translate-y-4 opacity-0 max-w-md w-full bg-white rounded-2xl shadow-2xl border p-4 flex items-start space-x-3.5 ${
      type === 'success' ? 'border-emerald-200 bg-emerald-50/70' :
      type === 'error' ? 'border-rose-200 bg-rose-50/70' :
      type === 'warning' ? 'border-amber-200 bg-amber-50/70' : 'border-blue-200 bg-blue-50/70'
    }`;

    const iconSvg = type === 'success' 
      ? `<svg class="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`
      : type === 'error'
      ? `<svg class="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`
      : type === 'warning'
      ? `<svg class="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`
      : `<svg class="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;

    toast.innerHTML = `
      ${iconSvg}
      <div class="flex-1 min-w-0">
        <h4 class="text-xs font-bold text-slate-900">${escapeHtml(title)}</h4>
        <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">${escapeHtml(message)}</p>
      </div>
      <button class="text-slate-400 hover:text-slate-600 flex-shrink-0 ml-2" onclick="this.parentElement.remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // Subtle demo toolbar for testing (only shows quick test buttons, no database exposure)
  function renderDemoBar() {
    const user = window.store.currentUser;
    const isSim = window.store.isSimulationActive;

    return `
      <div class="bg-slate-900 text-slate-300 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 no-print">
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Queueless Virtual Waiting System</span>
          </span>
          <span class="text-slate-400 hidden sm:inline text-[11px]">
            ${user ? `Logged in as: <strong class="text-white">${escapeHtml(user.name)}</strong> (${user.role === 'admin' ? 'Staff Administrator' : 'Customer'})` : 'Browse virtual services or sign in to enter a queue.'}
          </span>
        </div>

        <div class="flex items-center space-x-2">
          <!-- 1-Click Quick Demo Personas -->
          <span class="text-[10px] text-slate-400 hidden md:inline">Quick Test:</span>
          <button 
            onclick="window.router.quickLoginCustomer()" 
            class="px-2.5 py-1 text-[11px] rounded-lg transition-colors ${user && user.role === 'customer' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}"
            title="Log in as customer (Alex Turner)">
            👤 Customer
          </button>
          <button 
            onclick="window.router.quickLoginStaff()" 
            class="px-2.5 py-1 text-[11px] rounded-lg transition-colors ${user && user.role === 'staff' ? 'bg-emerald-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}"
            title="Log in as staff officer (Officer Miller - Counter 1)">
            💼 Staff Desk
          </button>
          <button 
            onclick="window.router.quickLoginAdmin()" 
            class="px-2.5 py-1 text-[11px] rounded-lg transition-colors ${user && user.role === 'admin' ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}"
            title="Log in as administrator (Officer Jenkins)">
            🛡️ Super Admin
          </button>

          <!-- Queue simulation toggle -->
          <button 
            onclick="window.router.toggleSimulation()" 
            class="px-2.5 py-1 text-[11px] rounded-lg transition-all flex items-center space-x-1 border ${
              isSim ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }"
            title="Simulate queue movement every 14s">
            <span class="w-1.5 h-1.5 rounded-full ${isSim ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}"></span>
            <span>${isSim ? 'Sim: Active' : 'Live Sim'}</span>
          </button>
        </div>
      </div>
    `;
  }

  function renderNavbar(currentPage) {
    const user = window.store.currentUser;
    const activeTicket = (window.store && window.store.getActiveQueue) ? window.store.getActiveQueue() : (user ? window.store.getActiveQueueForUser(user.id) : null);
    const userNotifs = user ? window.store.notifications.filter(n => n.userId === user.id) : [];
    const unreadCount = userNotifs.filter(n => !n.read).length;
    const isAdmin = user && user.role === 'admin';

    return `
      <header class="sticky top-0 z-40 w-full glass-nav border-b border-slate-200/80 shadow-sm no-print">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <!-- Brand Logo -->
            <div class="flex items-center space-x-3">
              <a href="#home" class="flex items-center space-x-2.5 group">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <div>
                  <span class="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">Queueless</span>
                  <span class="text-[10px] block font-semibold text-slate-500 uppercase tracking-wider -mt-1">Smart Waiting System</span>
                </div>
              </a>

              ${activeTicket ? `
                <a href="#token" class="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
                  <span class="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                  <span>Active Pass: <strong>${escapeHtml(activeTicket.tokenNumber)}</strong> (${escapeHtml(activeTicket.serviceName)})</span>
                </a>
              ` : ''}
            </div>

            <!-- Navigation Links -->
            <nav class="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium">
              <a href="#home" class="px-3.5 py-2 rounded-xl transition-colors ${currentPage === 'home' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'}">Services</a>

              ${activeTicket ? `
                <a href="#token" class="px-3.5 py-2 rounded-xl transition-colors ${currentPage === 'token' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'} flex items-center space-x-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>My Token (${escapeHtml(activeTicket.tokenNumber)})</span>
                </a>
                <a href="#tracking" class="px-3.5 py-2 rounded-xl transition-colors ${currentPage === 'tracking' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'}">Live Tracker</a>
              ` : ''}

              ${user && user.role === 'customer' ? `
                <a href="#dashboard" class="px-3.5 py-2 rounded-xl transition-colors ${currentPage === 'dashboard' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'}">Dashboard</a>
                <a href="#history" class="px-3.5 py-2 rounded-xl transition-colors ${currentPage === 'history' ? 'text-blue-600 bg-blue-50 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'}">History</a>
              ` : ''}

              ${user && user.role === 'staff' ? `
                <div class="h-4 w-px bg-slate-200 mx-1"></div>
                <a href="#staff-dashboard" class="px-3.5 py-2 rounded-xl transition-colors ${currentPage === 'staff-dashboard' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'text-emerald-800 hover:bg-emerald-50/70'} flex items-center space-x-1">
                  <span>💼 Staff Counter Desk</span>
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                </a>
              ` : ''}

              ${isAdmin ? `
                <div class="h-4 w-px bg-slate-200 mx-1"></div>
                <a href="#admin" class="px-3.5 py-2 rounded-xl transition-colors ${currentPage === 'admin' ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-indigo-700 hover:bg-indigo-50/70'}">Super Admin</a>
                <a href="#admin-emergency" class="px-3.5 py-2 rounded-xl transition-colors ${currentPage === 'admin-emergency' ? 'text-rose-700 bg-rose-50 font-bold' : 'text-rose-800 hover:bg-rose-50/70'} flex items-center space-x-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  <span>Emergency Triage</span>
                </a>
                <a href="#staff-dashboard" class="px-3.5 py-2 rounded-xl transition-colors ${currentPage === 'staff-dashboard' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'text-emerald-800 hover:bg-emerald-50/70'}">Staff Desk</a>
                <a href="#admin-queues" class="px-3.5 py-2 rounded-xl transition-colors ${currentPage === 'admin-queues' ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-indigo-700 hover:bg-indigo-50/70'}">Manage Desks</a>
                <a href="#admin-reports" class="px-3.5 py-2 rounded-xl transition-colors ${currentPage === 'admin-reports' ? 'text-indigo-600 bg-indigo-50 font-bold' : 'text-indigo-700 hover:bg-indigo-50/70'}">Reports</a>
              ` : ''}

              <a href="#emergency" class="px-3 py-1.5 rounded-xl transition-colors ${currentPage === 'emergency' ? 'text-rose-700 bg-rose-50 font-bold' : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50/50'} flex items-center space-x-1.5 text-xs">
                <span>🚨</span>
                <span>Emergency SOS</span>
              </a>
            </nav>

            <!-- Right Area: Notifications, Accessibility & Auth -->
            <div class="flex items-center space-x-2">
              
              <!-- Quick SOS Emergency Button -->
              <button 
                onclick="window.QueuelessModals.openEmergencyModal()" 
                class="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-500/25 emergency-btn-pulse cursor-pointer">
                <span>🚨</span>
                <span class="hidden sm:inline">SOS Help</span>
              </button>

              <!-- Accessibility Mode Toggle -->
              <button 
                onclick="window.router.toggleAccessibilityControls()" 
                id="btn-accessibility-mode"
                class="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Toggle Accessibility Mode (Large Font & High Contrast)">
                <span class="text-sm">♿</span>
              </button>
              ${user ? `
                <!-- Notification Bell -->
                <div class="relative">
                  <button 
                    onclick="window.router.toggleNotificationDropdown()" 
                    id="notif-bell-btn"
                    class="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
                    title="View notifications">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                    </svg>
                    ${unreadCount > 0 ? `
                      <span class="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                        ${unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    ` : ''}
                  </button>

                  <div id="notif-dropdown" class="hidden absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div class="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <span class="font-bold text-sm text-slate-900">Notifications</span>
                        ${renderJiraBadge('QLESS-14')}
                      </div>
                      ${unreadCount > 0 ? `
                        <button onclick="window.router.markAllNotificationsRead()" class="text-xs text-blue-600 hover:text-blue-800 font-semibold">Mark all read</button>
                      ` : ''}
                    </div>

                    <div class="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      ${userNotifs.length === 0 ? `
                        <div class="p-6 text-center text-slate-400 text-xs">No notifications yet.</div>
                      ` : userNotifs.slice(0, 5).map(n => `
                        <div class="p-3 text-xs hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/50 font-medium' : ''}">
                          <div class="flex items-start justify-between">
                            <span class="font-bold text-slate-900">${escapeHtml(n.title)}</span>
                            <span class="text-[10px] text-slate-400">${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p class="text-slate-600 mt-0.5">${escapeHtml(n.message)}</p>
                        </div>
                      `).join('')}
                    </div>

                    <div class="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                      <a href="#notifications" onclick="document.getElementById('notif-dropdown').classList.add('hidden')" class="text-xs font-bold text-blue-600 hover:text-blue-700">
                        View All Notifications (${userNotifs.length}) →
                      </a>
                    </div>
                  </div>
                </div>

                <!-- Profile Link -->
                <a href="#profile" class="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                  <div class="w-8 h-8 rounded-lg ${isAdmin ? 'bg-indigo-600' : 'bg-blue-600'} text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    ${escapeHtml(user.name.charAt(0).toUpperCase())}
                  </div>
                  <div class="hidden lg:block text-left">
                    <div class="text-xs font-bold text-slate-900">${escapeHtml(user.name)}</div>
                    <div class="text-[10px] text-slate-500 capitalize">${escapeHtml(user.role)}</div>
                  </div>
                </a>

                <!-- Logout -->
                <button 
                  onclick="window.router.logout()" 
                  class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Logout">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                </button>
              ` : `
                <!-- Guest Actions -->
                <a href="#login" class="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100/70 rounded-xl transition-colors">
                  Sign In
                </a>
                <a href="#register" class="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 hover:shadow transition-all">
                  Sign Up
                </a>
              `}

              <!-- Mobile Hamburger -->
              <button 
                onclick="window.router.toggleMobileMenu()" 
                class="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Drawer -->
        <div id="mobile-menu" class="hidden md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          <a href="#home" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Home</a>
          <a href="#services" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Browse Services</a>

          ${user && !isAdmin ? `
            <a href="#dashboard" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">My Dashboard</a>
            ${activeTicket ? `
              <a href="#tracking" class="block px-3 py-2 rounded-lg text-sm font-bold text-blue-600 bg-blue-50">Live Tracker (${escapeHtml(activeTicket.tokenNumber)})</a>
              <a href="#token" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Digital Pass</a>
            ` : ''}
            <a href="#history" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Queue History</a>
            <a href="#notifications" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Notifications (${unreadCount} unread)</a>
            <a href="#profile" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">My Profile</a>
          ` : ''}

          ${isAdmin ? `
            <div class="pt-2 border-t border-slate-100">
              <span class="text-xs font-bold text-indigo-700 uppercase px-3">Admin Suite</span>
              <a href="#admin" class="block px-3 py-2 rounded-lg text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Staff Overview</a>
              <a href="#admin-queues" class="block px-3 py-2 rounded-lg text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Manage Desks</a>
              <a href="#admin-reports" class="block px-3 py-2 rounded-lg text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Reports</a>
            </div>
          ` : ''}

          ${!user ? `
            <div class="pt-2 border-t border-slate-100 flex space-x-2">
              <a href="#login" class="flex-1 text-center py-2 text-xs font-bold text-slate-700 border border-slate-300 rounded-lg">Sign In</a>
              <a href="#register" class="flex-1 text-center py-2 text-xs font-bold text-white bg-blue-600 rounded-lg">Sign Up</a>
            </div>
          ` : ''}
        </div>
      </header>
    `;
  }

  function renderFooter() {
    return `
      <footer class="bg-white border-t border-slate-200 mt-16 py-6 text-slate-500 text-xs no-print">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center space-x-2">
            <div class="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">Q</div>
            <span class="font-bold text-slate-800">Queueless</span>
            <span class="text-slate-400">|</span>
            <span class="text-slate-500">Smart Virtual Queue & Waiting-Time Management System</span>
          </div>
          <div class="flex items-center space-x-4 text-[11px] text-slate-400">
            <a href="#services" class="hover:text-slate-700">Services</a>
            <span>•</span>
            <a href="#login" class="hover:text-slate-700">Customer Sign In</a>
            <span>•</span>
            <a href="#admin-login" class="hover:text-indigo-600">Staff Portal</a>
            <span>•</span>
            <span>© 2026 Queueless</span>
          </div>
        </div>
      </footer>
    `;
  }

  window.QueuelessComponents = {
    escapeHtml,
    renderJiraBadge,
    showToast,
    renderNavbar,
    renderFooter
  };
})();
