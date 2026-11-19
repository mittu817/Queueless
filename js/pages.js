// Queueless Application Pages Module
// Welcoming Customer Experience with backend-secured SQLite data layer
// Implements all 15 required pages and all 12 Jira user stories across Sprints 1, 2, 3, 4

(function() {
  const { escapeHtml, renderJiraBadge } = window.QueuelessComponents;

  // ==========================================
  // PAGE 1: PROFESSIONAL LANDING PAGE
  // Clean, modern enterprise layout without cluttered widgets
  // ==========================================
  function renderHomePage() {
    const user = window.store.currentUser;
    const services = window.QueuelessData.SERVICES;
    const queues = window.store.queues;
    const activeTicket = (window.store && window.store.getActiveQueue) ? window.store.getActiveQueue() : (user ? window.store.getActiveQueueForUser(user.id) : null);

    return `
      <div class="py-8 sm:py-10 space-y-10 max-w-7xl mx-auto">
        
        <!-- Professional Page Header -->
        <header class="text-center max-w-3xl mx-auto space-y-3 px-4">
          <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-semibold text-blue-700 shadow-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Virtual Queue & Waiting-Time Management System</span>
          </div>

          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Smart Virtual Queue Management
          </h1>

          <p class="text-sm sm:text-base text-slate-500 leading-relaxed max-w-2xl mx-auto">
            Select an available service desk below to join the virtual line, receive your digital token, and wait remotely without standing in physical queues.
          </p>

          ${activeTicket ? `
            <div class="pt-3">
              <div class="inline-flex flex-wrap items-center justify-center gap-3 p-3 px-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 shadow-sm animate-in fade-in">
                <span class="flex items-center space-x-2 font-bold text-emerald-800">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Active Token: <strong class="font-mono text-sm">${escapeHtml(activeTicket.tokenNumber)}</strong> (${escapeHtml(activeTicket.serviceName)})</span>
                </span>
                <span class="text-emerald-300 hidden sm:inline">•</span>
                <a href="#token" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs">
                  View My Digital Pass →
                </a>
                <a href="#tracking" class="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100/50 text-emerald-800 font-bold text-xs transition-colors shadow-xs">
                  Live Tracker →
                </a>
              </div>
            </div>
          ` : (user ? `
            <div class="pt-3">
              <div class="inline-flex flex-wrap items-center justify-center gap-3 p-2.5 px-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 shadow-sm">
                <span>Welcome back, <strong class="text-blue-700">${escapeHtml(user.name)}</strong></span>
                <span class="text-blue-300 hidden sm:inline">•</span>
                <a href="#dashboard" class="px-3 py-1 rounded-lg bg-white border border-blue-200 hover:bg-blue-100/50 text-blue-700 font-bold text-xs transition-colors shadow-xs">
                  My Dashboard →
                </a>
              </div>
            </div>
          ` : '')}
        </header>

        <!-- Services Available (QLESS-9) -->
        <section class="space-y-5 px-4 sm:px-0">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <div class="flex items-center space-x-2">
                <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Available Services</h2>
                ${renderJiraBadge('QLESS-9', 'Virtual Queue Story')}
              </div>
              <p class="text-xs text-slate-500 mt-1">
                Real-time queue intake, waiting counters, and estimated service times across all service desks.
              </p>
            </div>
            <div class="flex items-center space-x-2 text-xs text-slate-500 font-medium">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>4 Service Counters Currently Active</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            ${services.map(srv => {
              const waitingList = queues.filter(q => q.serviceId === srv.id && q.status === 'Waiting');
              const currentlyServing = queues.find(q => q.serviceId === srv.id && q.status === 'Being Served');
              const isPaused = window.store.servicesState[srv.id]?.isPaused;

              return `
                <div class="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <span class="font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${srv.badgeColor}">
                        ${escapeHtml(srv.prefix)}
                      </span>
                      ${isPaused ? `
                        <span class="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                          Paused
                        </span>
                      ` : `
                        <span class="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span> Open
                        </span>
                      `}
                    </div>

                    <div>
                      <h3 class="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        ${escapeHtml(srv.name)}
                      </h3>
                      <p class="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        ${escapeHtml(srv.description)}
                      </p>
                    </div>

                    <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                      <div class="flex justify-between items-center">
                        <span class="text-slate-500 text-[11px]">Waiting Ahead:</span>
                        <strong class="text-blue-700 font-mono font-bold">${waitingList.length} ${waitingList.length === 1 ? 'person' : 'people'}</strong>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-slate-500 text-[11px]">Now Serving:</span>
                        <strong class="text-emerald-700 font-mono text-[11px]">${currentlyServing ? escapeHtml(currentlyServing.tokenNumber) : 'Counter Open'}</strong>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-slate-500 text-[11px]">Avg Service Time:</span>
                        <strong class="text-slate-700 font-mono text-[11px]">~${srv.avgServiceTimeMinutes} mins</strong>
                      </div>
                    </div>
                  </div>

                  <div class="mt-6 pt-4 border-t border-slate-100">
                    ${isPaused ? `
                      <button disabled class="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-medium text-xs cursor-not-allowed">
                        Queue Paused
                      </button>
                    ` : `
                      <div class="space-y-2">
                        <button 
                          onclick="window.router.openJoinModal('${srv.id}')"
                          class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center space-x-1.5 cursor-pointer">
                          <span>Join Virtual Queue</span>
                          <span>→</span>
                        </button>
                        ${srv.id === 'hospital-opd' ? `
                          <button 
                            type="button"
                            onclick="window.QueuelessModals.openEmergencyModal()"
                            class="w-full py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition-all flex items-center justify-center space-x-1 cursor-pointer">
                            <span>🚨 Hospital OPD Emergency SOS</span>
                          </button>
                        ` : ''}
                      </div>
                    `}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>

      </div>
    `;
  }

  // ==========================================
  // PAGE 2: USER REGISTRATION / SIGN UP (QLESS-6)
  // ==========================================
  function renderRegisterPage() {
    const pendingSrv = (window.router && window.router.pendingServiceId)
      ? window.QueuelessData.SERVICES.find(s => s.id === window.router.pendingServiceId)
      : null;

    return `
      <div class="max-w-4xl mx-auto py-10 px-4">
        <div class="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          <!-- Left Welcoming Column -->
          <div class="lg:col-span-5 bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-900 text-white p-8 sm:p-10 flex flex-col justify-between space-y-8">
            <div class="space-y-4">
              <div class="flex items-center space-x-2">
                <div class="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-white text-base">Q</div>
                <span class="text-lg font-bold text-white">Queueless</span>
              </div>

              <div>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-blue-200 mb-2">
                  JOIN IN 30 SECONDS
                </span>
                <h2 class="text-2xl font-black leading-snug">
                  Welcome! Say Goodbye to Long Lines
                </h2>
                <p class="text-xs text-blue-100/90 mt-2 leading-relaxed">
                  Register once and immediately access virtual queues across healthcare, banking, passport offices, and libraries.
                </p>
              </div>
            </div>

            <!-- Customer Benefits Checklist -->
            <div class="space-y-3 text-xs text-blue-100">
              <div class="flex items-start space-x-2.5">
                <span class="text-emerald-400 font-bold">✓</span>
                <span>Immediate access to virtual service desks upon sign-up</span>
              </div>
              <div class="flex items-start space-x-2.5">
                <span class="text-emerald-400 font-bold">✓</span>
                <span>Digital boarding passes with scannable QR tokens</span>
              </div>
              <div class="flex items-start space-x-2.5">
                <span class="text-emerald-400 font-bold">✓</span>
                <span>Live turn alerts, audio chimes, and accurate wait times</span>
              </div>
              <div class="flex items-start space-x-2.5">
                <span class="text-emerald-400 font-bold">✓</span>
                <span>100% free and secure customer service account</span>
              </div>
            </div>

            <div class="pt-4 border-t border-white/10 text-[11px] text-blue-200/80">
              Already have an account? <a href="#login" class="text-white font-bold underline">Sign in here</a>.
            </div>
          </div>

          <!-- Right Sign-Up Form -->
          <div class="lg:col-span-7 p-8 sm:p-10 space-y-6">
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <h1 class="text-2xl font-black text-slate-900">Create Your Account</h1>
                ${renderJiraBadge('QLESS-6', 'User Registration')}
              </div>
              <p class="text-xs text-slate-500">Sign up and you'll be automatically logged in to access services immediately</p>
            </div>

            ${pendingSrv ? `
              <div class="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center space-x-2.5">
                <span class="text-lg">🎯</span>
                <div class="flex-1">
                  <strong>Selected Desk: ${escapeHtml(pendingSrv.name)}</strong>
                  <p class="text-[11px] text-blue-700 mt-0.5">We will place you directly into this queue right after your account is created!</p>
                </div>
              </div>
            ` : ''}

            <form id="register-form" onsubmit="window.router.handleRegister(event)" class="space-y-4">
              <div id="register-error" class="hidden p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700"></div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  id="reg-name" 
                  required 
                  placeholder="e.g. Alex Turner"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input 
                  type="email" 
                  id="reg-email" 
                  required 
                  placeholder="alex.turner@example.com"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <span class="text-[10px] text-slate-400 mt-1 block">Used to receive queue tokens and notifications.</span>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input 
                  type="tel" 
                  id="reg-phone" 
                  required 
                  placeholder="+1 555-0199"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <span class="text-[10px] text-slate-400 mt-1 block">At least 7 digits. Used by desk staff if needed.</span>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                <div class="relative">
                  <input 
                    type="password" 
                    id="reg-password" 
                    required 
                    oninput="window.router.checkPasswordStrength(this.value)"
                    placeholder="Min 6 chars with uppercase & number"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                  />
                  <button 
                    type="button" 
                    onclick="window.router.togglePasswordVisibility('reg-password')"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                </div>

                <div class="mt-2 space-y-1">
                  <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div id="pwd-strength-bar" class="h-full w-0 bg-slate-300 transition-all duration-300"></div>
                  </div>
                  <div class="flex items-center justify-between text-[10px] text-slate-400">
                    <span id="pwd-strength-text">Strength: enter password</span>
                    <span class="font-mono">Min 6 chars, A-Z, 0-9</span>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Confirm Password *</label>
                <input 
                  type="password" 
                  id="reg-confirm-password" 
                  required 
                  placeholder="Re-enter identical password"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div class="pt-2">
                <button 
                  type="submit" 
                  id="reg-submit-btn"
                  class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:shadow-lg flex items-center justify-center space-x-2">
                  <span>Sign Up & Access Services Immediately</span>
                  <span>→</span>
                </button>
              </div>
            </form>

            <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <div>
                Already have an account? 
                <a href="#login" class="text-blue-600 font-bold hover:underline">Customer Sign In</a>
              </div>
              <div>
                <a href="#admin-register" class="text-slate-400 hover:text-indigo-600 font-medium transition-colors">
                  Staff Officer Registration →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // PAGE 3: CUSTOMER LOGIN / SIGN IN (QLESS-7)
  // Strictly for customers; separate from admin portal
  // ==========================================
  function renderLoginPage() {
    const pendingSrv = (window.router && window.router.pendingServiceId)
      ? window.QueuelessData.SERVICES.find(s => s.id === window.router.pendingServiceId)
      : null;

    return `
      <div class="max-w-4xl mx-auto py-10 px-4">
        <div class="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          <!-- Left Welcoming Column -->
          <div class="lg:col-span-5 bg-gradient-to-br from-indigo-700 via-blue-800 to-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between space-y-8">
            <div class="space-y-4">
              <div class="flex items-center space-x-2">
                <div class="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-white text-base">Q</div>
                <span class="text-lg font-bold text-white">Queueless</span>
              </div>

              <div>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-indigo-200 mb-2">
                  CUSTOMER ACCESS
                </span>
                <h2 class="text-2xl font-black leading-snug">
                  Customer Sign In
                </h2>
                <p class="text-xs text-blue-100/90 mt-2 leading-relaxed">
                  Log in to join virtual queues, check your live queue standing, or access your digital boarding passes.
                </p>
              </div>
            </div>

            <!-- Customer feature assurances -->
            <div class="space-y-2.5 text-xs text-blue-100">
              <div class="flex items-center space-x-2">
                <span class="text-emerald-400 font-bold">✓</span>
                <span>Direct access to all 4 service desks</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-emerald-400 font-bold">✓</span>
                <span>Live turn tracking and position updates</span>
              </div>
              <div class="flex items-center space-x-2">
                <span class="text-emerald-400 font-bold">✓</span>
                <span>Instant counter call announcements</span>
              </div>
            </div>

            <div class="pt-2 text-[11px] text-blue-200/80">
              Need instant access? Use the one-click customer demo button on the right.
            </div>
          </div>

          <!-- Right Login Form Column -->
          <div class="lg:col-span-7 p-8 sm:p-10 space-y-6">
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <h1 class="text-2xl font-black text-slate-900">Customer Sign In</h1>
                ${renderJiraBadge('QLESS-7', 'User Login')}
              </div>
              <p class="text-xs text-slate-500">Enter your credentials to access virtual queue services</p>
            </div>

            ${pendingSrv ? `
              <div class="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center space-x-2.5">
                <span class="text-lg">🎯</span>
                <div class="flex-1">
                  <strong>Target Desk: ${escapeHtml(pendingSrv.name)}</strong>
                  <p class="text-[11px] text-blue-700 mt-0.5">Log in and you will immediately be taken to join this queue!</p>
                </div>
              </div>
            ` : ''}

            <!-- 1-Click Customer Demo Button -->
            <div class="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-blue-900">⚡ Instant Customer Demo:</span>
                <span class="text-[10px] text-blue-600 font-semibold">1-Click Sign In</span>
              </div>
              <button 
                type="button"
                onclick="window.router.quickLoginCustomer()" 
                class="w-full p-2.5 rounded-xl bg-white text-blue-900 font-bold border border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 text-xs text-left shadow-sm transition-all flex items-center justify-between group">
                <div class="flex items-center space-x-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <div>
                    <span class="text-xs font-bold text-slate-900 block">Alex Turner</span>
                    <span class="text-[10px] text-slate-500 font-normal block">Customer Account</span>
                  </div>
                </div>
                <span class="text-[11px] text-blue-600 font-bold">Sign In as Alex →</span>
              </button>
            </div>

            <!-- Login Form -->
            <form id="login-form" onsubmit="window.router.handleLogin(event)" class="space-y-4">
              <div id="login-error" class="hidden p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700"></div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  id="login-email" 
                  required 
                  placeholder="alex.turner@example.com"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-semibold text-slate-700">Password</label>
                  <button type="button" onclick="alert('Demo customer password: Password123!')" class="text-[11px] text-blue-600 hover:underline">
                    Password hint?
                  </button>
                </div>
                <div class="relative">
                  <input 
                    type="password" 
                    id="login-password" 
                    required 
                    placeholder="••••••••"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-10"
                  />
                  <button 
                    type="button" 
                    onclick="window.router.togglePasswordVisibility('login-password')"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between text-xs">
                <label class="flex items-center space-x-2 text-slate-600 cursor-pointer">
                  <input type="checkbox" checked class="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span>Remember session</span>
                </label>
              </div>

              <div class="pt-2">
                <button 
                  type="submit" 
                  id="login-submit-btn"
                  class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:shadow-lg flex items-center justify-center space-x-2">
                  <span>Sign In & Access Services</span>
                  <span>→</span>
                </button>
              </div>
            </form>

            <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <div>
                Don't have an account? 
                <a href="#register" class="text-blue-600 font-bold hover:underline">Sign up free</a>
              </div>
              <div>
                <a href="#admin-login" class="text-slate-400 hover:text-indigo-600 font-medium transition-colors">
                  Staff & Counter Portal →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // PAGE: DEDICATED STAFF & ADMIN LOGIN PORTAL
  // Strictly separated from customer login
  // ==========================================
  function renderAdminLoginPage() {
    return `
      <div class="max-w-md mx-auto py-12 px-4">
        <div class="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
          
          <!-- Staff Security Top Banner -->
          <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 text-center space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 mx-auto flex items-center justify-center shadow-inner">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <div>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                Restricted Staff Portal
              </span>
              <h1 class="text-xl font-black text-white mt-2">Counter & Queue Administration</h1>
              <p class="text-xs text-slate-400 mt-1">Authorized service desk officers and supervisors only</p>
            </div>
          </div>

          <div class="p-6 sm:p-8 space-y-6">
            <!-- 1-Click Staff Demo Persona -->
            <div class="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-indigo-950">⚡ Staff Test Credentials:</span>
                <span class="text-[10px] text-indigo-600 font-semibold">1-Click Sign In</span>
              </div>
              <button 
                type="button"
                onclick="window.router.quickLoginAdmin()" 
                class="w-full p-2.5 rounded-xl bg-white text-indigo-900 font-bold border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-xs text-left shadow-sm transition-all flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <div>
                    <span class="block text-xs font-bold text-slate-900">Officer Sarah Jenkins</span>
                    <span class="block text-[10px] text-slate-500 font-normal">Desk Operations Supervisor</span>
                  </div>
                </div>
                <span class="text-[11px] text-indigo-600 font-bold">Authenticate →</span>
              </button>
            </div>

            <form id="admin-login-form" onsubmit="window.router.handleAdminLogin(event)" class="space-y-4">
              <div id="admin-login-error" class="hidden p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700"></div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Staff Work Email</label>
                <input 
                  type="email" 
                  id="admin-login-email" 
                  required 
                  placeholder="admin@queueless.com"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-semibold text-slate-700">Staff Password</label>
                  <button type="button" onclick="alert('Staff demo password is: AdminPass123!')" class="text-[11px] text-indigo-600 hover:underline">
                    Password hint?
                  </button>
                </div>
                <div class="relative">
                  <input 
                    type="password" 
                    id="admin-login-password" 
                    required 
                    placeholder="••••••••"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all pr-10"
                  />
                  <button 
                    type="button" 
                    onclick="window.router.togglePasswordVisibility('admin-login-password')"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                </div>
              </div>

              <div class="pt-2">
                <button 
                  type="submit" 
                  id="admin-login-submit-btn"
                  class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg flex items-center justify-center space-x-2">
                  <span>Sign In to Staff Console</span>
                  <span>→</span>
                </button>
              </div>
            </form>

            <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <div>
                New staff officer? 
                <a href="#admin-register" class="text-indigo-600 font-bold hover:underline">Register Staff Profile</a>
              </div>
              <div>
                <a href="#login" class="text-slate-400 hover:text-blue-600 font-medium transition-colors">
                  ← Customer Sign In
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // PAGE: DEDICATED STAFF & ADMIN REGISTRATION PORTAL
  // Strictly separated from customer registration
  // ==========================================
  function renderAdminRegisterPage() {
    return `
      <div class="max-w-2xl mx-auto py-10 px-4">
        <div class="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
          
          <!-- Staff Security Top Banner -->
          <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 text-center space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 mx-auto flex items-center justify-center shadow-inner">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <div>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                Restricted Staff Onboarding
              </span>
              <h1 class="text-2xl font-black text-white mt-2">Staff & Officer Registration</h1>
              <p class="text-xs text-slate-400 mt-1">Register administrative credentials for counter clerks and supervisors</p>
            </div>
          </div>

          <div class="p-6 sm:p-8 space-y-6">
            <form id="admin-register-form" onsubmit="window.router.handleStaffRegister(event)" class="space-y-4">
              <div id="admin-register-error" class="hidden p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700"></div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Officer Full Name *</label>
                  <input 
                    type="text" 
                    id="admin-reg-name" 
                    required 
                    placeholder="e.g. Officer Daniel Craig"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Assigned Department / Counter *</label>
                  <select 
                    id="admin-reg-department" 
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white">
                    <option value="All Desks Supervisor">All Desks Supervisor</option>
                    <option value="Hospital OPD">Hospital OPD Counter</option>
                    <option value="Bank Counter">Bank Teller Counter</option>
                    <option value="Passport Office">Passport Verification Desk</option>
                    <option value="Library Desk">Library Help Desk</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Official Work Email *</label>
                  <input 
                    type="email" 
                    id="admin-reg-email" 
                    required 
                    placeholder="officer.craig@queueless.com"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Staff Contact Phone *</label>
                  <input 
                    type="tel" 
                    id="admin-reg-phone" 
                    required 
                    placeholder="+1 555-0188"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-xs font-semibold text-slate-700">Staff Security Passcode *</label>
                  <span class="text-[10px] text-indigo-600 font-mono font-bold">Default code: ADMIN2026</span>
                </div>
                <input 
                  type="text" 
                  id="admin-reg-passcode" 
                  required 
                  value="ADMIN2026"
                  placeholder="Enter authorized onboarding passcode"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Staff Password *</label>
                  <input 
                    type="password" 
                    id="admin-reg-password" 
                    required 
                    placeholder="Min 6 chars, uppercase & number"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Confirm Staff Password *</label>
                  <input 
                    type="password" 
                    id="admin-reg-confirm-password" 
                    required 
                    placeholder="Re-enter identical password"
                    class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div class="pt-2">
                <button 
                  type="submit" 
                  id="admin-reg-submit-btn"
                  class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all hover:shadow-lg flex items-center justify-center space-x-2">
                  <span>Register & Open Staff Console</span>
                  <span>→</span>
                </button>
              </div>
            </form>

            <div class="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <div>
                Already have staff credentials? 
                <a href="#admin-login" class="text-indigo-600 font-bold hover:underline">Staff Sign In</a>
              </div>
              <div>
                <a href="#register" class="text-blue-600 font-bold hover:underline">
                  ← Customer Registration
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // PAGE 4: CUSTOMER DASHBOARD
  // ==========================================
  function renderCustomerDashboard() {
    const user = window.store.currentUser;
    if (!user) return renderRedirectToLoginNotice();

    const activeTicket = window.store.getActiveQueueForUser(user.id);
    const tracking = activeTicket ? window.store.getTrackingDetails(activeTicket.id) : null;
    const history = window.store.getUserQueueHistory(user.id);
    const completedCount = history.filter(q => q.status === 'Completed').length;

    return `
      <div class="space-y-8 py-4">
        <!-- Welcoming Header -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <span class="text-xs font-semibold text-blue-600 uppercase tracking-wider">Customer Portal</span>
              <span class="text-slate-300">•</span>
              <span class="text-xs text-slate-500">Services Ready</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Welcome back, ${escapeHtml(user.name)}! 👋
            </h1>
            <p class="text-xs text-slate-500">Monitor your active virtual queue, token passes, and waiting times.</p>
          </div>

          <div class="flex items-center space-x-3">
            <a href="#services" class="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all">
              + Join a Virtual Queue
            </a>
            <a href="#profile" class="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors">
              Edit Profile
            </a>
          </div>
        </div>

        <!-- Active Queue Card -->
        ${activeTicket && tracking ? `
          <div class="rounded-3xl p-6 sm:p-8 border ${
            tracking.isNowServing 
              ? 'bg-emerald-50/80 border-emerald-300 shadow-xl animate-serving-pulse' 
              : tracking.isTurnApproaching 
              ? 'bg-amber-50/80 border-amber-300 shadow-lg' 
              : 'bg-gradient-to-r from-blue-50 to-indigo-50/60 border-blue-200 shadow-md'
          } relative overflow-hidden">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div class="space-y-3">
                <div class="flex items-center space-x-2">
                  <span class="px-3 py-1 rounded-full text-xs font-bold ${
                    tracking.isNowServing 
                      ? 'bg-emerald-600 text-white' 
                      : tracking.isTurnApproaching 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-blue-600 text-white'
                  }">
                    ${tracking.isNowServing ? '🎉 NOW SERVING AT COUNTER' : tracking.isTurnApproaching ? '🔔 TURN APPROACHING' : '⏳ ACTIVE IN QUEUE'}
                  </span>
                  ${renderJiraBadge('QLESS-11')}
                  ${renderJiraBadge('QLESS-12')}
                </div>

                <div class="flex items-baseline space-x-3">
                  <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
                    ${escapeHtml(activeTicket.tokenNumber)}
                  </h2>
                  <span class="text-base font-semibold text-slate-600">
                    for ${escapeHtml(activeTicket.serviceName)}
                  </span>
                </div>

                <p class="text-xs text-slate-600">
                  Assigned Counter: <strong class="text-slate-900">${escapeHtml(activeTicket.counter)}</strong> • Joined at ${new Date(activeTicket.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <!-- Quick stats inside active ticket -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                <div class="bg-white/80 backdrop-blur rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                  <span class="text-[11px] text-slate-500 block uppercase font-bold">Your Position</span>
                  <span class="text-2xl font-black text-blue-700 font-mono">#${tracking.position}</span>
                </div>
                <div class="bg-white/80 backdrop-blur rounded-2xl p-4 border border-slate-200/80 shadow-sm">
                  <span class="text-[11px] text-slate-500 block uppercase font-bold">People Ahead</span>
                  <span class="text-2xl font-black text-slate-800 font-mono">${tracking.peopleAhead}</span>
                </div>
                <div class="bg-white/80 backdrop-blur rounded-2xl p-4 border border-slate-200/80 shadow-sm col-span-2 sm:col-span-1">
                  <span class="text-[11px] text-slate-500 block uppercase font-bold">Est. Wait</span>
                  <span class="text-2xl font-black ${tracking.isNowServing ? 'text-emerald-600' : 'text-blue-700'} font-mono">
                    ${tracking.isNowServing ? '0 m' : `~${tracking.estimatedWaitMinutes}m`}
                  </span>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="flex flex-wrap lg:flex-col gap-2 justify-end">
                <a href="#tracking" class="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center shadow-md transition-all">
                  Open Live Tracker →
                </a>
                <a href="#token" class="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs text-center border border-slate-300 transition-colors">
                  Digital Pass
                </a>
                <button 
                  onclick="window.router.openLeaveModal('${activeTicket.id}')" 
                  class="px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs text-center border border-rose-200 transition-colors">
                  Leave Queue
                </button>
              </div>
            </div>
          </div>
        ` : `
          <div class="bg-white rounded-3xl p-8 border border-dashed border-slate-300 text-center space-y-4">
            <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900">You currently have no active queue ticket</h3>
              <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Choose a service below to take a digital pass and wait remotely.</p>
            </div>
            <a href="#services" class="inline-flex items-center px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md">
              Browse Available Services
            </a>
          </div>
        `}

        <!-- Customer Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-500 font-medium">Total Queues Joined</span>
            <div class="text-2xl font-bold text-slate-900 mt-1">${history.length}</div>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-500 font-medium">Completed Visits</span>
            <div class="text-2xl font-bold text-emerald-600 mt-1">${completedCount}</div>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-500 font-medium">Active Tickets</span>
            <div class="text-2xl font-bold text-blue-600 mt-1">${activeTicket ? '1' : '0'}</div>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <span class="text-xs text-slate-500 font-medium">Cancelled Tickets</span>
            <div class="text-2xl font-bold text-slate-600 mt-1">${history.filter(q => q.status === 'Cancelled').length}</div>
          </div>
        </div>

        <!-- Recent Queue Activity -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <h3 class="text-base font-bold text-slate-900">Recent Queue Activity</h3>
              ${renderJiraBadge('QLESS-15')}
            </div>
            <a href="#history" class="text-xs font-semibold text-blue-600 hover:text-blue-700">View Full History →</a>
          </div>

          ${history.length === 0 ? `
            <p class="text-xs text-slate-400 py-4 text-center">No queue records found.</p>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b border-slate-100 text-slate-500 font-semibold">
                    <th class="py-2.5">Token</th>
                    <th class="py-2.5">Service</th>
                    <th class="py-2.5">Date & Time</th>
                    <th class="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${history.slice(0, 4).map(item => `
                    <tr>
                      <td class="py-3 font-mono font-bold text-slate-900">${escapeHtml(item.tokenNumber)}</td>
                      <td class="py-3 text-slate-700">${escapeHtml(item.serviceName)}</td>
                      <td class="py-3 text-slate-500">${new Date(item.joinedAt).toLocaleDateString()} ${new Date(item.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td class="py-3">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'Cancelled' ? 'bg-amber-100 text-amber-800' :
                          item.status === 'Being Served' ? 'bg-blue-100 text-blue-800' :
                          item.status === 'Waiting' ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800'
                        }">
                          ${escapeHtml(item.status)}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
  }

  // ==========================================
  // PAGE 5: AVAILABLE SERVICES (QLESS-9)
  // ==========================================
  function renderServicesPage() {
    const services = window.QueuelessData.SERVICES;

    return `
      <div class="space-y-8 py-6">
        <div class="max-w-2xl">
          <div class="flex items-center space-x-2">
            <h1 class="text-3xl font-extrabold text-slate-900">Available Services</h1>
            ${renderJiraBadge('QLESS-9', 'Join Virtual Queue Story')}
          </div>
          <p class="text-sm text-slate-500 mt-2">
            Select a service to enter its virtual queue. Receive a digital token, view your position, and wait remotely without standing in physical lines.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${services.map(srv => {
            const waitingCount = window.store.queues.filter(
              q => q.serviceId === srv.id && q.status === 'Waiting'
            ).length;
            const currentServing = window.store.queues.find(
              q => q.serviceId === srv.id && q.status === 'Being Served'
            );
            const isPaused = window.store.servicesState[srv.id]?.isPaused;

            return `
              <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group">
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <span class="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold font-mono tracking-wider ${srv.badgeColor}">
                      ${escapeHtml(srv.prefix)}
                    </span>
                    <span class="text-xs font-medium text-slate-500">${escapeHtml(srv.category)}</span>
                  </div>

                  <div>
                    <h2 class="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      ${escapeHtml(srv.name)}
                    </h2>
                    <p class="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      ${escapeHtml(srv.description)}
                    </p>
                  </div>

                  <div class="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <span class="text-[10px] uppercase font-bold text-slate-400 block">Waiting</span>
                      <span class="text-lg font-bold text-slate-900 font-mono">${waitingCount}</span>
                    </div>
                    <div>
                      <span class="text-[10px] uppercase font-bold text-slate-400 block">Now Serving</span>
                      <span class="text-base font-bold text-blue-600 font-mono">${currentServing ? escapeHtml(currentServing.tokenNumber) : 'Standby'}</span>
                    </div>
                    <div>
                      <span class="text-[10px] uppercase font-bold text-slate-400 block">Avg Time</span>
                      <span class="text-base font-bold text-slate-700 font-mono">${srv.avgServiceTimeMinutes}m</span>
                    </div>
                  </div>

                  <div class="text-xs text-slate-500 flex items-center justify-between">
                    <span>Counter: <strong class="text-slate-800">${escapeHtml(srv.counters)}</strong></span>
                    ${isPaused ? `
                      <span class="text-rose-600 font-semibold">⚠️ Queue Paused</span>
                    ` : `
                      <span class="text-emerald-600 font-semibold">✓ Open for Virtual Intake</span>
                    `}
                  </div>
                </div>

                <div class="mt-6 pt-4 border-t border-slate-100">
                  ${isPaused ? `
                    <button disabled class="w-full py-3 rounded-xl bg-slate-100 text-slate-400 font-medium text-xs cursor-not-allowed">
                      Service Temporarily Paused by Admin
                    </button>
                  ` : `
                    <button 
                      onclick="window.router.openJoinModal('${srv.id}')"
                      class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:shadow-lg flex items-center justify-center space-x-2">
                      <span>Join Virtual Queue</span>
                      <span>→</span>
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================
  // PAGE 6: JOIN QUEUE PAGE (QLESS-9)
  // ==========================================
  function renderJoinQueuePage() {
    const user = window.store.currentUser;
    if (!user) return renderRedirectToLoginNotice();

    const services = window.QueuelessData.SERVICES;
    const activeTicket = window.store.getActiveQueueForUser(user.id);

    return `
      <div class="max-w-xl mx-auto py-8 px-4">
        <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
          <div class="space-y-2">
            <div class="flex items-center space-x-2">
              <h1 class="text-2xl font-extrabold text-slate-900">Join Virtual Queue</h1>
              ${renderJiraBadge('QLESS-9')}
            </div>
            <p class="text-xs text-slate-500">Pick a service desk to receive your digital queue pass</p>
          </div>

          ${activeTicket ? `
            <div class="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-2">
              <div class="font-bold flex items-center space-x-1.5">
                <span>⚠️ You already have an active queue ticket</span>
              </div>
              <p>You hold token <strong>${escapeHtml(activeTicket.tokenNumber)}</strong> for <strong>${escapeHtml(activeTicket.serviceName)}</strong>.</p>
              <div class="pt-1 flex space-x-2">
                <a href="#tracking" class="px-3 py-1.5 bg-amber-600 text-white rounded-lg font-bold text-[11px]">Track Active Ticket</a>
                <button onclick="window.router.openLeaveModal('${activeTicket.id}')" class="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-lg font-semibold text-[11px]">Leave Current Queue</button>
              </div>
            </div>
          ` : `
            <form onsubmit="window.router.handleDirectJoin(event)" class="space-y-5">
              <div id="join-error" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700"></div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-2">Select Service Desk *</label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  ${services.map(s => {
                    const isPaused = window.store.servicesState[s.id]?.isPaused;
                    return `
                      <label class="relative flex flex-col p-3.5 rounded-2xl border ${isPaused ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : 'cursor-pointer border-slate-200 hover:border-blue-400 bg-white'} transition-all has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50/50">
                        <input 
                          type="radio" 
                          name="serviceId" 
                          value="${s.id}" 
                          ${isPaused ? 'disabled' : ''} 
                          required 
                          class="absolute top-3 right-3 text-blue-600 focus:ring-blue-500"
                        />
                        <span class="text-xs font-bold text-slate-900 font-mono">${escapeHtml(s.prefix)}</span>
                        <span class="text-sm font-bold text-slate-800 mt-1">${escapeHtml(s.name)}</span>
                        <span class="text-[11px] text-slate-500 mt-0.5">${escapeHtml(s.counters)} • ~${s.avgServiceTimeMinutes}m avg</span>
                      </label>
                    `;
                  }).join('')}
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Reason for Visit / Special Notes</label>
                <input 
                  type="text" 
                  id="join-notes" 
                  placeholder="e.g. General consultation, cash deposit, passport renewal..."
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div class="pt-2">
                <button 
                  type="submit" 
                  class="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:shadow-lg">
                  Confirm & Take Queue Pass →
                </button>
              </div>
            </form>
          `}
        </div>
      </div>
    `;
  }

  // ==========================================
  // PAGE 7: DIGITAL QUEUE TOKEN (QLESS-10)
  // ==========================================
  function renderDigitalTokenPage() {
    const activeTicket = window.store.getActiveQueue();
    if (!activeTicket) {
      return `
        <div class="max-w-md mx-auto py-12 text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
          </div>
          <h2 class="text-xl font-bold text-slate-900">No Active Digital Pass</h2>
          <p class="text-xs text-slate-500 max-w-sm mx-auto">You currently don't hold an active queue ticket. Select an available service on the homepage to enter.</p>
          <a href="#services" class="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md">Browse Services</a>
        </div>
      `;
    }

    const tracking = window.store.getTrackingDetails(activeTicket.id);
    const qrSvg = window.generateTokenQR ? window.generateTokenQR(activeTicket.tokenNumber, 150) : '';

    return `
      <div class="max-w-lg mx-auto py-6 px-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-2">
            <h1 class="text-2xl font-extrabold text-slate-900">Digital Queue Pass</h1>
            ${renderJiraBadge('QLESS-10')}
          </div>
          <button onclick="window.print()" class="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 no-print">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            <span>Print Pass</span>
          </button>
        </div>

        <div id="printable-ticket" class="ticket-container bg-white p-6 sm:p-8 space-y-6">
          <div class="ticket-notch-left"></div>
          <div class="ticket-notch-right"></div>
          <div class="ticket-perforation"></div>

          <div class="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <span class="text-[10px] font-bold tracking-wider uppercase text-blue-600">Queueless Digital Boarding Pass</span>
              <h2 class="text-xl font-bold text-slate-900 mt-0.5">${escapeHtml(activeTicket.serviceName)}</h2>
              <p class="text-xs text-slate-500">${escapeHtml(activeTicket.notes)}</p>
            </div>
            <div class="text-right">
              <span class="px-2.5 py-1 rounded-full text-xs font-bold ${
                activeTicket.status === 'Being Served' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }">
                ${escapeHtml(activeTicket.status)}
              </span>
            </div>
          </div>

          <div class="text-center py-4 bg-gradient-to-b from-blue-50/50 to-indigo-50/30 rounded-2xl border border-blue-100/80">
            <span class="text-xs uppercase font-bold text-slate-400 tracking-wider">Your Queue Token</span>
            <div class="text-5xl sm:text-6xl font-black text-blue-700 font-mono tracking-tight my-1">
              ${escapeHtml(activeTicket.tokenNumber)}
            </div>
            <div class="inline-flex items-center space-x-1.5 text-xs text-slate-600 mt-1">
              <span>Assigned Counter:</span>
              <strong class="text-slate-900">${escapeHtml(activeTicket.counter)}</strong>
            </div>
          </div>

          <div class="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div class="text-center sm:text-left space-y-2 text-xs">
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-semibold">Customer</span>
                <span class="font-bold text-slate-800">${escapeHtml(activeTicket.customerName)}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-semibold">Contact</span>
                <span class="font-medium text-slate-700">${escapeHtml(activeTicket.customerPhone)}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-semibold">Joined At</span>
                <span class="font-medium text-slate-700">${new Date(activeTicket.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase font-semibold">Estimated Wait</span>
                <span class="font-bold text-blue-600">${tracking ? `~${tracking.estimatedWaitMinutes} minutes` : 'Calculating...'}</span>
              </div>
            </div>

            <div class="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              ${qrSvg}
              <span class="text-[9px] text-slate-400 mt-2 font-mono">SCAN AT SERVICE DESK</span>
            </div>
          </div>
        </div>

        <div class="mt-6 flex flex-col sm:flex-row gap-3 no-print">
          <a href="#tracking" class="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center shadow-md transition-all">
            Live Queue Tracker →
          </a>
          <button 
            onclick="window.router.openLeaveModal('${activeTicket.id}')"
            class="px-5 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition-colors">
            Leave Virtual Queue
          </button>
        </div>
      </div>
    `;
  }

  // ==========================================
  // PAGE 8 & 9: LIVE TRACKING & WAITING TIME (QLESS-11, QLESS-12)
  // ==========================================
  function renderTrackingPage() {
    const activeTicket = window.store.getActiveQueue();
    if (!activeTicket) {
      return `
        <div class="max-w-md mx-auto py-12 text-center space-y-4">
          <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h2 class="text-xl font-bold text-slate-900">No Active Queue to Track</h2>
          <p class="text-xs text-slate-500">You don't have an active token. Select an available service on the homepage to enter a queue.</p>
          <a href="#services" class="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md">Join a Queue</a>
        </div>
      `;
    }

    const tracking = window.store.getTrackingDetails(activeTicket.id);

    return `
      <div class="max-w-2xl mx-auto py-6 px-4 space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-2xl font-extrabold text-slate-900">Live Queue Tracking</h1>
              ${renderJiraBadge('QLESS-11')}
              ${renderJiraBadge('QLESS-12')}
            </div>
            <p class="text-xs text-slate-500 mt-1">Live position tracking and dynamic wait time updates</p>
          </div>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span class="w-2 h-2 rounded-full bg-blue-600 animate-ping mr-1.5"></span> Live Sync
          </span>
        </div>

        ${tracking.isTurnApproaching && !tracking.isNowServing ? `
          <div class="p-4 rounded-2xl bg-amber-500 text-white shadow-lg flex items-center space-x-3.5 animate-bounce">
            <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            <div>
              <h4 class="font-bold text-sm">🔔 Your Turn is Approaching!</h4>
              <p class="text-xs text-amber-100 mt-0.5">You are #${tracking.position} in line (${tracking.peopleAhead} person ahead). Please stand near ${escapeHtml(activeTicket.counter)}.</p>
            </div>
          </div>
        ` : ''}

        ${tracking.isNowServing ? `
          <div class="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-2xl animate-serving-pulse space-y-2 text-center">
            <div class="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-xs font-bold tracking-wider uppercase mb-1">
              ✨ PROCEED TO COUNTER NOW
            </div>
            <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight">You are being served!</h2>
            <p class="text-sm text-emerald-100 max-w-md mx-auto">
              Please proceed immediately to <strong class="text-white underline">${escapeHtml(activeTicket.counter)}</strong>. Counter representative is waiting for you.
            </p>
          </div>
        ` : ''}

        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-8">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span class="text-xs uppercase font-bold text-blue-600">Active Service Token</span>
              <div class="text-3xl font-extrabold text-slate-900 font-mono mt-0.5">${escapeHtml(activeTicket.tokenNumber)}</div>
              <span class="text-xs text-slate-500">${escapeHtml(activeTicket.serviceName)} • Joined ${new Date(activeTicket.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="text-left sm:text-right">
              <span class="text-xs text-slate-400 block font-medium">Service Counter</span>
              <span class="text-sm font-bold text-slate-800">${escapeHtml(activeTicket.counter)}</span>
            </div>
          </div>

          <!-- Progress steps -->
          <div>
            <span class="text-xs font-bold text-slate-700 block mb-3">Service Journey</span>
            <div class="grid grid-cols-4 gap-2 text-center text-xs">
              <div class="space-y-1.5">
                <div class="w-7 h-7 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">✓</div>
                <span class="text-[11px] font-semibold text-slate-800 block">Joined</span>
              </div>
              <div class="space-y-1.5">
                <div class="w-7 h-7 mx-auto rounded-full ${tracking.position > 2 ? 'bg-blue-600 text-white animate-pulse' : 'bg-emerald-500 text-white'} flex items-center justify-center font-bold text-xs shadow-sm">
                  ${tracking.position > 2 ? '2' : '✓'}
                </div>
                <span class="text-[11px] font-semibold ${tracking.position > 2 ? 'text-blue-600' : 'text-slate-800'} block">In Queue</span>
              </div>
              <div class="space-y-1.5">
                <div class="w-7 h-7 mx-auto rounded-full ${tracking.isTurnApproaching && !tracking.isNowServing ? 'bg-amber-500 text-white animate-bounce' : tracking.isNowServing ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'} flex items-center justify-center font-bold text-xs shadow-sm">
                  ${tracking.isNowServing ? '✓' : '3'}
                </div>
                <span class="text-[11px] font-semibold ${tracking.isTurnApproaching ? 'text-amber-600' : 'text-slate-400'} block">Approaching</span>
              </div>
              <div class="space-y-1.5">
                <div class="w-7 h-7 mx-auto rounded-full ${tracking.isNowServing ? 'bg-emerald-600 text-white animate-ping-slow' : 'bg-slate-200 text-slate-400'} flex items-center justify-center font-bold text-xs shadow-sm">
                  4
                </div>
                <span class="text-[11px] font-semibold ${tracking.isNowServing ? 'text-emerald-600 font-bold' : 'text-slate-400'} block">Serving</span>
              </div>
            </div>
          </div>

          <!-- Position & Waiting Time Metrics -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 text-center space-y-1">
              <span class="text-[11px] font-bold uppercase tracking-wider text-blue-600">Queue Position</span>
              <div class="text-3xl sm:text-4xl font-extrabold text-blue-800 font-mono">
                #${tracking.position}
              </div>
              <span class="text-[11px] text-blue-600/80 block">Standing in line</span>
            </div>

            <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">People Ahead</span>
              <div class="text-3xl sm:text-4xl font-extrabold text-slate-800 font-mono">
                ${tracking.peopleAhead}
              </div>
              <span class="text-[11px] text-slate-500 block">Waiting ahead</span>
            </div>

            <div class="p-5 rounded-2xl ${tracking.isNowServing ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50/60 border-indigo-100'} text-center space-y-1">
              <span class="text-[11px] font-bold uppercase tracking-wider ${tracking.isNowServing ? 'text-emerald-700' : 'text-indigo-600'}">Estimated Wait</span>
              <div class="text-3xl sm:text-4xl font-extrabold ${tracking.isNowServing ? 'text-emerald-700' : 'text-indigo-900'} font-mono">
                ${tracking.isNowServing ? '0m' : `~${tracking.estimatedWaitMinutes}m`}
              </div>
              <span class="text-[11px] ${tracking.isNowServing ? 'text-emerald-600' : 'text-indigo-600/80'} block">
                ${tracking.isNowServing ? 'At Counter' : 'Calculated time'}
              </span>
            </div>
          </div>

          <div class="pt-2 flex flex-col sm:flex-row gap-3">
            <a href="#token" class="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition-colors">
              View Digital Boarding Pass
            </a>
            <button 
              onclick="window.router.openLeaveModal('${activeTicket.id}')"
              class="px-6 py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors flex items-center justify-center space-x-1.5">
              <span>Leave Queue</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

    function renderWaitingTimePage() {
    return renderTrackingPage();
  }

  // ==========================================
  // PAGE 10: NOTIFICATIONS (QLESS-14)
  // ==========================================
  function renderNotificationsPage() {
    const user = window.store.currentUser;
    if (!user) return renderRedirectToLoginNotice();

    const notifs = window.store.notifications.filter(n => n.userId === user.id);
    const unread = notifs.filter(n => !n.read);

    return `
      <div class="max-w-2xl mx-auto py-6 px-4 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-2xl font-extrabold text-slate-900">Notifications</h1>
              ${renderJiraBadge('QLESS-14')}
            </div>
            <p class="text-xs text-slate-500 mt-1">Updates on token creation, queue movements, and counter calls</p>
          </div>

          ${notifs.length > 0 ? `
            <div class="flex items-center space-x-2">
              ${unread.length > 0 ? `
                <button 
                  onclick="window.router.markAllNotificationsRead()" 
                  class="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors">
                  Mark All as Read
                </button>
              ` : ''}
              <button 
                onclick="window.router.clearAllNotifications()" 
                class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold transition-colors">
                Clear All
              </button>
            </div>
          ` : ''}
        </div>

        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          ${notifs.length === 0 ? `
            <div class="p-12 text-center space-y-3">
              <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              </div>
              <h3 class="text-base font-bold text-slate-800">No Notifications</h3>
              <p class="text-xs text-slate-500 max-w-xs mx-auto">You're all caught up! Real-time alerts will appear here when you join a queue.</p>
            </div>
          ` : `
            <div class="divide-y divide-slate-100">
              ${notifs.map(n => `
                <div class="p-4 sm:p-5 flex items-start space-x-4 transition-colors ${!n.read ? 'bg-blue-50/40' : 'hover:bg-slate-50'}">
                  <div class="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-sm ${
                    n.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
                    n.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                    n.type === 'error' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                  }">
                    ${n.type === 'success' ? '✓' : n.type === 'warning' ? '⚠️' : n.type === 'error' ? '✕' : 'ℹ'}
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline justify-between gap-2">
                      <h4 class="text-sm font-bold text-slate-900">${escapeHtml(n.title)}</h4>
                      <span class="text-[10px] text-slate-400 whitespace-nowrap">
                        ${new Date(n.createdAt).toLocaleDateString()} ${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p class="text-xs text-slate-600 mt-1 leading-relaxed">${escapeHtml(n.message)}</p>
                  </div>

                  ${!n.read ? `
                    <button 
                      onclick="window.router.markNotificationRead('${n.id}')"
                      class="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Mark as read">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    </button>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;
  }

  // ==========================================
  // PAGE 11: QUEUE HISTORY (QLESS-15)
  // ==========================================
  function renderHistoryPage() {
    const user = window.store.currentUser;
    if (!user) return renderRedirectToLoginNotice();

    const history = window.store.getUserQueueHistory(user.id);

    return `
      <div class="max-w-4xl mx-auto py-6 px-4 space-y-6">
        <div>
          <div class="flex items-center space-x-2">
            <h1 class="text-2xl font-extrabold text-slate-900">Queue History</h1>
            ${renderJiraBadge('QLESS-15')}
          </div>
          <p class="text-xs text-slate-500 mt-1">Review all your previous virtual queue visits</p>
        </div>

        <div class="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center space-x-2">
              <span class="text-xs font-semibold text-slate-600">Filter by Status:</span>
              <select id="history-filter" onchange="window.router.filterHistory(this.value)" class="text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-slate-50 font-medium">
                <option value="all">All Records (${history.length})</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="No-show">No-show</option>
                <option value="Waiting">Waiting / Active</option>
              </select>
            </div>
            <span class="text-xs text-slate-400">Total Visits: ${history.length}</span>
          </div>

          ${history.length === 0 ? `
            <div class="py-12 text-center text-slate-400 text-xs">
              No historical queue entries found for your account.
            </div>
          ` : `
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs" id="history-table">
                <thead>
                  <tr class="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th class="py-3 px-2">Token</th>
                    <th class="py-3 px-2">Service</th>
                    <th class="py-3 px-2">Reason / Notes</th>
                    <th class="py-3 px-2">Joined At</th>
                    <th class="py-3 px-2">Finalized</th>
                    <th class="py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${history.map(item => `
                    <tr class="hover:bg-slate-50/60 transition-colors" data-status="${escapeHtml(item.status)}">
                      <td class="py-3 px-2 font-mono font-bold text-slate-900">${escapeHtml(item.tokenNumber)}</td>
                      <td class="py-3 px-2 font-semibold text-slate-800">${escapeHtml(item.serviceName)}</td>
                      <td class="py-3 px-2 text-slate-500 max-w-xs truncate">${escapeHtml(item.notes || 'General Service')}</td>
                      <td class="py-3 px-2 text-slate-600 whitespace-nowrap">
                        ${new Date(item.joinedAt).toLocaleDateString()}<br/>
                        <span class="text-[10px] text-slate-400">${new Date(item.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td class="py-3 px-2 text-slate-600 whitespace-nowrap">
                        ${item.completedAt ? `
                          ${new Date(item.completedAt).toLocaleDateString()}<br/>
                          <span class="text-[10px] text-slate-400">${new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        ` : '—'}
                      </td>
                      <td class="py-3 px-2 whitespace-nowrap">
                        <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'Cancelled' ? 'bg-amber-100 text-amber-800' :
                          item.status === 'Being Served' ? 'bg-blue-100 text-blue-800' :
                          item.status === 'Waiting' ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800'
                        }">
                          ${escapeHtml(item.status)}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
  }

  // ==========================================
  // PAGE 12: ADMIN OVERVIEW (QLESS-16, QLESS-17)
  // ==========================================
      function renderStaffDashboard() {
    const user = window.store.currentUser;
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      return renderUnauthorizedAdminNotice();
    }

    const services = window.QueuelessData.SERVICES;
    const counters = window.store.backendCounters || [
      { id: 'ctr-1', name: 'Counter 1 (OPD Triage)', service_id: 'hospital-opd', status: 'Available' },
      { id: 'ctr-2', name: 'Counter 2 (Physician Clinic)', service_id: 'hospital-opd', status: 'Available' },
      { id: 'ctr-4', name: 'Counter 4 (Cash & Deposits)', service_id: 'bank-counter', status: 'Available' },
      { id: 'ctr-7', name: 'Counter 7 (Biometrics Capture)', service_id: 'passport-office', status: 'Available' },
      { id: 'ctr-9', name: 'Counter 9 (Circulation Desk)', service_id: 'library-desk', status: 'Available' }
    ];

    if (!window.staffActiveCounter) {
      window.staffActiveCounter = user.assigned_counter || 'ctr-1';
    }

    const currentCounter = counters.find(c => c.id === window.staffActiveCounter) || counters[0];
    const serviceId = currentCounter.service_id || user.assigned_service || 'hospital-opd';
    const activeService = services.find(s => s.id === serviceId) || services[0];

    const allQueues = window.store.queues;
    const servingCustomer = allQueues.find(q => q.serviceId === serviceId && q.status === 'Being Served');
    const waitingList = allQueues
      .filter(q => q.serviceId === serviceId && q.status === 'Waiting')
      .sort((a, b) => {
        const pOrder = { 'Urgent': 1, 'Elderly/Disabled': 2, 'Normal': 3 };
        const pA = pOrder[a.priority] || 3;
        const pB = pOrder[b.priority] || 3;
        if (pA !== pB) return pA - pB;
        return new Date(a.joinedAt) - new Date(b.joinedAt);
      });

    const isCounterPaused = currentCounter.status === 'Paused';

    return `
      <div class="space-y-6 py-6">
        <!-- Live Staff Bar -->
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-lg">
              💼
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>LIVE COUNTER DESK</span>
                </span>
                <span class="text-xs text-slate-400">•</span>
                <span class="text-xs font-semibold text-indigo-300">${escapeHtml(activeService.name)}</span>
              </div>
              <h1 class="text-xl sm:text-2xl font-black text-white mt-0.5">
                ${escapeHtml(user.name)} – ${escapeHtml(currentCounter.name)}
              </h1>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <!-- Counter Switcher -->
            <select 
              onchange="window.staffActiveCounter = this.value; window.router.renderCurrentView();"
              class="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs border border-slate-700 outline-none">
              ${counters.map(c => `
                <option value="${c.id}" ${window.staffActiveCounter === c.id ? 'selected' : ''}>
                  ${escapeHtml(c.name)}
                </option>
              `).join('')}
            </select>

            <!-- Counter Break Toggle -->
            <button 
              onclick="window.router.toggleCounterPause('${currentCounter.id}', ${!isCounterPaused})"
              class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                isCounterPaused 
                  ? 'bg-amber-600/30 border-amber-500 text-amber-300 hover:bg-amber-600/40' 
                  : 'bg-emerald-600/30 border-emerald-500 text-emerald-300 hover:bg-emerald-600/40'
              }">
              ${isCounterPaused ? '⏸️ Counter Paused (Break)' : '🟢 Counter Available'}
            </button>
          </div>
        </div>

        <!-- Live Operations Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left: Big Calling & Serving Stage (7 Cols) -->
          <div class="lg:col-span-7 space-y-6">
            <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <span class="w-2 h-2 rounded-full ${servingCustomer ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}"></span>
                  <span>Active Token Console</span>
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  servingCustomer ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }">
                  ${servingCustomer ? '● Currently Serving' : 'Ready For Next'}
                </span>
              </div>

              ${servingCustomer ? `
                <!-- Current Customer In Service -->
                <div class="text-center py-6 bg-gradient-to-b from-blue-50/60 to-white rounded-3xl border border-blue-100 space-y-3">
                  <div class="inline-flex items-center space-x-2">
                    <span class="font-mono text-4xl sm:text-6xl font-black text-blue-700 tracking-tight">
                      ${escapeHtml(servingCustomer.tokenNumber)}
                    </span>
                    ${servingCustomer.priority && servingCustomer.priority !== 'Normal' ? `
                      <span class="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                        ⭐ ${escapeHtml(servingCustomer.priority)}
                      </span>
                    ` : ''}
                  </div>

                  <div class="space-y-0.5">
                    <h3 class="text-lg font-bold text-slate-900">${escapeHtml(servingCustomer.customerName)}</h3>
                    <p class="text-xs text-slate-500">${escapeHtml(servingCustomer.customerPhone || 'Walk-in Guest')}</p>
                  </div>

                  <!-- Live Consultation Timer -->
                  <div class="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Consultation Elapsed: <span class="live-timer" data-live-timestamp="${servingCustomer.servedAt || servingCustomer.calledAt || new Date().toISOString()}">00:00</span></span>
                  </div>

                  <div class="block text-slate-600 text-xs font-medium pt-1">
                    Notes: ${escapeHtml(servingCustomer.notes || 'General Consultation')}
                  </div>
                </div>

                <!-- OnestQ Action Controls -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <button 
                    onclick="window.router.staffRecall('${servingCustomer.id}', '${currentCounter.name}')"
                    class="py-3 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all border border-indigo-200">
                    <span class="text-base">📢</span>
                    <span>Recall Token</span>
                  </button>

                  <button 
                    onclick="window.router.staffCompleteService('${servingCustomer.id}', '${currentCounter.name}')"
                    class="py-3 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all shadow-md">
                    <span class="text-base">✅</span>
                    <span>Complete</span>
                  </button>

                  <button 
                    onclick="window.router.staffSkip('${servingCustomer.id}')"
                    class="py-3 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all border border-amber-200">
                    <span class="text-base">⏭️</span>
                    <span>Skip / Defer</span>
                  </button>

                  <button 
                    onclick="window.router.staffNoShow('${servingCustomer.id}', '${currentCounter.id}')"
                    class="py-3 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all border border-rose-200">
                    <span class="text-base">❌</span>
                    <span>Mark No-Show</span>
                  </button>
                </div>

                <div class="pt-2 flex justify-end">
                  <button 
                    onclick="window.QueuelessModals.openTransferModal('${servingCustomer.id}')"
                    class="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                    <span>🔄 Transfer to another counter / department →</span>
                  </button>
                </div>
              ` : `
                <!-- No Active Token - Call Next Ready -->
                <div class="text-center py-10 space-y-4">
                  <div class="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-2xl">
                    ⏱️
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-slate-900">Desk Ready For Customer</h3>
                    <p class="text-xs text-slate-500 mt-0.5">
                      ${waitingList.length > 0 
                        ? `${waitingList.length} customer(s) waiting in ${escapeHtml(activeService.name)} line.` 
                        : 'No customers currently waiting in this queue.'}
                    </p>
                  </div>

                  <button 
                    onclick="window.router.staffCallNext('${activeService.id}', '${currentCounter.name}')"
                    ${waitingList.length === 0 || isCounterPaused ? 'disabled' : ''}
                    class="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 transition-all inline-flex items-center space-x-2">
                    <span>📢 Call Next Customer</span>
                    ${waitingList.length > 0 ? `<span class="px-2 py-0.5 rounded-full bg-blue-800 text-[10px]">#${waitingList[0].tokenNumber}</span>` : ''}
                  </button>
                </div>
              `}
            </div>

            <!-- Counter Shift Performance -->
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span class="text-[11px] font-semibold text-slate-400 uppercase">Served Today</span>
                <div class="text-2xl font-black text-slate-900 font-mono mt-0.5">
                  ${allQueues.filter(q => q.serviceId === serviceId && q.status === 'Completed').length}
                </div>
              </div>
              <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span class="text-[11px] font-semibold text-slate-400 uppercase">Waiting Ahead</span>
                <div class="text-2xl font-black text-blue-600 font-mono mt-0.5">${waitingList.length}</div>
              </div>
              <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
                <span class="text-[11px] font-semibold text-slate-400 uppercase">Avg Service</span>
                <div class="text-2xl font-black text-emerald-600 font-mono mt-0.5">~${activeService.avgServiceTimeMinutes}m</div>
              </div>
            </div>
          </div>

          <!-- Right: Live Upcoming Queue Table (5 Cols) -->
          <div class="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div class="flex items-center space-x-1.5">
                  <h3 class="text-sm font-bold text-slate-900">Live Customer Queue</h3>
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                </div>
                <p class="text-[11px] text-slate-500">${escapeHtml(activeService.name)} Line</p>
              </div>
              <span class="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                ${waitingList.length} waiting
              </span>
            </div>

            <div class="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              ${waitingList.length === 0 ? `
                <div class="py-12 text-center text-slate-400 text-xs">Queue is clear! No customers waiting.</div>
              ` : waitingList.map((item, idx) => `
                <div class="py-3 flex items-center justify-between hover:bg-slate-50/60 rounded-xl px-2 transition-colors">
                  <div class="space-y-0.5">
                    <div class="flex items-center space-x-2">
                      <span class="font-mono text-sm font-black text-slate-900">${escapeHtml(item.tokenNumber)}</span>
                      ${item.priority && item.priority !== 'Normal' ? `
                        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                          ${escapeHtml(item.priority)}
                        </span>
                      ` : ''}
                      <span class="text-[10px] text-slate-400 font-mono">#${idx + 1}</span>
                    </div>
                    <div class="text-xs font-medium text-slate-700">${escapeHtml(item.customerName)}</div>
                    <div class="text-[10px] text-slate-400 flex items-center space-x-1">
                      <span>Waiting:</span>
                      <span class="font-mono font-bold text-blue-600 live-timer" data-live-timestamp="${item.joinedAt}">00:00</span>
                    </div>
                  </div>

                  <button 
                    onclick="window.router.staffCallSpecificCustomer('${item.id}', '${currentCounter.name}')"
                    class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-xs font-bold transition-all border border-slate-200">
                    Call →
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

    function renderAdminDashboard() {
    const user = window.store.currentUser;
    if (!user || user.role !== 'admin') return renderUnauthorizedAdminNotice();

    if (!window.adminActiveTab) {
      window.adminActiveTab = 'live';
    }

    const currentTab = window.adminActiveTab;
    const services = window.QueuelessData.SERVICES;
    const allQueues = window.store.queues;
    
    // Top Statistics
    const totalToday = allQueues.length;
    const waiting = allQueues.filter(q => q.status === 'Waiting').length;
    const beingServed = allQueues.filter(q => q.status === 'Being Served').length;
    const completed = allQueues.filter(q => q.status === 'Completed').length;
    const cancelled = allQueues.filter(q => q.status === 'Cancelled' || q.status === 'No-show').length;

    const tabs = [
      { id: 'live', label: '🔴 Live Monitor', icon: '📡' },
      { id: 'queues', label: 'Queue Operations', icon: '📋' },
      { id: 'services', label: 'Services CRUD', icon: '⚙️' },
      { id: 'counters', label: 'Branches & Counters', icon: '🏢' },
      { id: 'staff', label: 'Staff Management', icon: '👥' },
      { id: 'kiosk', label: 'Walk-In Kiosk', icon: '🎟️' },
      { id: 'hours', label: 'Hours & Holidays', icon: '🕒' },
      { id: 'complaints', label: 'Complaints', icon: '💬' },
      { id: 'backups', label: 'Backups & Audit', icon: '🔒' },
      { id: 'reports', label: 'Export Reports', icon: '📊' }
    ];

    return `
      <div class="space-y-6 py-6">
        <!-- Top Command Header with Live Status -->
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="space-y-1.5">
            <div class="flex items-center space-x-2">
              <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 flex items-center space-x-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>LIVE SYSTEM MONITOR (Auto-Sync 2.5s)</span>
              </span>
              <span class="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono border border-blue-500/30">
                SQLite 3 Native
              </span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Queueless System Control Center
            </h1>
            <p class="text-xs text-indigo-200/80">
              Real-time monitoring of active counters, queues, staff, and service intake.
            </p>
          </div>

          <div class="flex items-center space-x-2.5">
            <button 
              onclick="window.router.createDatabaseBackup()" 
              class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5">
              <span>💾 Backup SQLite DB</span>
            </button>
            <a href="#staff-dashboard" class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all">
              Staff Desk →
            </a>
          </div>
        </div>

        <!-- 8 Dashboard KPI Metric Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span class="text-[10px] font-bold text-slate-400 uppercase block">Total Today</span>
            <div class="text-2xl font-black text-slate-900 font-mono mt-0.5">${totalToday}</div>
          </div>
          <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span class="text-[10px] font-bold text-blue-500 uppercase block">Waiting</span>
            <div class="text-2xl font-black text-blue-600 font-mono mt-0.5">${waiting}</div>
          </div>
          <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span class="text-[10px] font-bold text-indigo-500 uppercase block">Serving</span>
            <div class="text-2xl font-black text-indigo-600 font-mono mt-0.5">${beingServed}</div>
          </div>
          <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span class="text-[10px] font-bold text-emerald-500 uppercase block">Completed</span>
            <div class="text-2xl font-black text-emerald-600 font-mono mt-0.5">${completed}</div>
          </div>
          <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span class="text-[10px] font-bold text-rose-500 uppercase block">Cancelled</span>
            <div class="text-2xl font-black text-rose-600 font-mono mt-0.5">${cancelled}</div>
          </div>
          <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span class="text-[10px] font-bold text-slate-400 uppercase block">Avg Wait</span>
            <div class="text-2xl font-black text-slate-800 font-mono mt-0.5">~8.5m</div>
          </div>
          <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span class="text-[10px] font-bold text-slate-400 uppercase block">Avg Service</span>
            <div class="text-2xl font-black text-slate-800 font-mono mt-0.5">~9m</div>
          </div>
          <div class="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span class="text-[10px] font-bold text-emerald-600 uppercase block">Counters</span>
            <div class="text-2xl font-black text-emerald-600 font-mono mt-0.5">9 Active</div>
          </div>
        </div>

        <!-- Admin Navigation Tabs -->
        <div class="flex items-center space-x-1 overflow-x-auto pb-2 border-b border-slate-200">
          ${tabs.map(t => `
            <button 
              onclick="window.router.switchAdminTab('${t.id}')"
              class="px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                currentTab === t.id 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }">
              <span>${t.icon}</span>
              <span>${t.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- Tab Content Containers -->
        <div id="admin-tab-content">
          ${renderAdminTabContent(currentTab, { services, allQueues, user })}
        </div>
      </div>
    `;
  }

  function renderAdminTabContent(tab, { services, allQueues, user }) {
    switch (tab) {
      case 'live':
        return renderAdminLiveMonitorTab(services, allQueues);
      case 'queues':
        return renderAdminQueuesTab(services, allQueues);
      case 'services':
        return renderAdminServicesTab(services);
      case 'counters':
        return renderAdminCountersTab();
      case 'staff':
        return renderAdminStaffTab();
      case 'kiosk':
        return renderAdminKioskTab(services);
      case 'hours':
        return renderAdminHoursTab();
      case 'complaints':
        return renderAdminComplaintsTab();
      case 'backups':
        return renderAdminBackupsTab();
      case 'reports':
        return renderAdminReportsTab(allQueues);
      default:
        return renderAdminLiveMonitorTab(services, allQueues);
    }
  }

  // Sub-Tab: Dedicated Live Operations Wall
  function renderAdminLiveMonitorTab(services, allQueues) {
    const servingQueues = allQueues.filter(q => q.status === 'Being Served');
    const waitingQueues = allQueues.filter(q => q.status === 'Waiting');

    return `
      <div class="space-y-6">
        <!-- Live Counters Matrix -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 class="text-base font-bold text-slate-900">Physical Counters Live Status</h3>
            </div>
            <span class="text-xs font-semibold text-slate-500">Live feed auto-synced</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => {
              const srvName = n <= 3 ? 'Hospital OPD' : (n <= 6 ? 'Bank Counter' : (n <= 8 ? 'Passport Office' : 'Library Desk'));
              const srvId = n <= 3 ? 'hospital-opd' : (n <= 6 ? 'bank-counter' : (n <= 8 ? 'passport-office' : 'library-desk'));
              const serving = servingQueues.find(q => q.serviceId === srvId);
              const isPaused = n === 6;

              return `
                <div class="p-4 rounded-2xl border ${
                  serving ? 'border-emerald-200 bg-emerald-50/40' : (isPaused ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200 bg-slate-50/50')
                } space-y-2">
                  <div class="flex items-center justify-between">
                    <div>
                      <strong class="text-xs text-slate-900 block">Counter ${n}</strong>
                      <span class="text-[10px] text-slate-500">${srvName}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                      serving ? 'bg-emerald-100 text-emerald-800' : (isPaused ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800')
                    }">
                      ${serving ? '● Serving' : (isPaused ? 'Paused' : 'Available')}
                    </span>
                  </div>

                  ${serving ? `
                    <div class="p-2.5 rounded-xl bg-white border border-emerald-100 text-xs space-y-1">
                      <div class="flex justify-between items-center">
                        <span class="font-mono font-black text-slate-900">${escapeHtml(serving.tokenNumber)}</span>
                        <span class="font-mono text-[11px] font-bold text-emerald-700 live-timer" data-live-timestamp="${serving.servedAt || serving.calledAt || new Date().toISOString()}">00:00</span>
                      </div>
                      <span class="text-[11px] text-slate-600 block truncate">${escapeHtml(serving.customerName)}</span>
                    </div>
                  ` : `
                    <div class="text-[11px] text-slate-400 py-2">
                      ${isPaused ? 'Officer on scheduled break' : 'Desk available for calling'}
                    </div>
                  `}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Live Queue Activity Stream -->
        <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-bold text-slate-900">Live Customer Queue Stream</h3>
            <span class="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              ${waitingQueues.length} customers waiting
            </span>
          </div>

          <div class="divide-y divide-slate-100">
            ${waitingQueues.length === 0 ? `
              <div class="py-8 text-center text-slate-400 text-xs">All queues are currently clear.</div>
            ` : waitingQueues.map(q => `
              <div class="py-3 flex items-center justify-between hover:bg-slate-50/50 rounded-xl px-2">
                <div class="flex items-center space-x-3">
                  <span class="font-mono text-sm font-black text-slate-900">${escapeHtml(q.tokenNumber)}</span>
                  <div>
                    <strong class="text-xs text-slate-800 block">${escapeHtml(q.customerName)}</strong>
                    <span class="text-[10px] text-slate-500">${escapeHtml(q.serviceName)} • ${escapeHtml(q.notes || 'General')}</span>
                  </div>
                </div>

                <div class="flex items-center space-x-3 text-xs">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    q.priority === 'Urgent' ? 'bg-rose-100 text-rose-800' :
                    q.priority === 'Elderly/Disabled' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                  }">
                    ${escapeHtml(q.priority || 'Normal')}
                  </span>

                  <span class="text-[11px] text-slate-500 font-mono">
                    Elapsed: <strong class="text-blue-600 live-timer" data-live-timestamp="${q.joinedAt}">00:00</strong>
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderManageQueuesPage() {
    const user = window.store.currentUser;
    if (!user || user.role !== 'admin') return renderUnauthorizedAdminNotice();

    const services = window.QueuelessData.SERVICES;

    return `
      <div class="space-y-6 py-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-2xl font-extrabold text-slate-900">Manage Active Queues</h1>
              ${renderJiraBadge('QLESS-16')}
            </div>
            <p class="text-xs text-slate-500 mt-1">Real-time customer dispatch, desk control, pause/resume, and walk-in entry</p>
          </div>

          <div class="flex items-center space-x-2">
            <button 
              onclick="window.router.openWalkInModal()"
              class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-1.5">
              <span>+ Add Walk-In Customer</span>
            </button>
          </div>
        </div>

        <div class="space-y-6">
          ${services.map(s => {
            const waitingList = window.store.queues
              .filter(q => q.serviceId === s.id && q.status === 'Waiting')
              .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));

            const servingCustomer = window.store.queues.find(
              q => q.serviceId === s.id && q.status === 'Being Served'
            );

            const isPaused = window.store.servicesState[s.id]?.isPaused;

            return `
              <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div class="flex items-center space-x-3">
                    <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${s.badgeColor}">${escapeHtml(s.prefix)}</span>
                    <div>
                      <h2 class="text-lg font-bold text-slate-900">${escapeHtml(s.name)}</h2>
                      <span class="text-xs text-slate-500">${escapeHtml(s.counters)} • ~${s.avgServiceTimeMinutes} mins avg</span>
                    </div>
                  </div>

                  <div class="flex items-center space-x-2.5">
                    <button 
                      onclick="window.router.toggleServicePause('${s.id}')"
                      class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isPaused ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }">
                      ${isPaused ? '▶ Resume Queue' : '⏸ Pause Queue'}
                    </button>
                    <button 
                      onclick="window.router.callNext('${s.id}')"
                      ${waitingList.length === 0 ? 'disabled' : ''}
                      class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1">
                      <span>🔔 Call Next Customer</span>
                    </button>
                  </div>
                </div>

                <div class="p-4 rounded-2xl ${servingCustomer ? 'bg-emerald-50/80 border border-emerald-300 shadow-sm' : 'bg-slate-50 border border-slate-200'}">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span class="text-[10px] uppercase font-bold tracking-wider ${servingCustomer ? 'text-emerald-700' : 'text-slate-400'}">
                        Current Desk Station
                      </span>
                      ${servingCustomer ? `
                        <div class="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                          ${escapeHtml(servingCustomer.tokenNumber)} — <span class="font-sans font-bold text-base">${escapeHtml(servingCustomer.customerName)}</span>
                        </div>
                        <span class="text-xs text-slate-600">
                          Phone: ${escapeHtml(servingCustomer.customerPhone)} • Notes: ${escapeHtml(servingCustomer.notes)}
                        </span>
                      ` : `
                        <span class="text-sm font-semibold text-slate-500 mt-0.5 block">No customer currently being served.</span>
                      `}
                    </div>

                    ${servingCustomer ? `
                      <div class="flex items-center space-x-2">
                        <button 
                          onclick="window.router.completeService('${servingCustomer.id}')"
                          class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all">
                          ✓ Complete Service
                        </button>
                        <button 
                          onclick="window.router.markNoShow('${servingCustomer.id}')"
                          class="px-3.5 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 font-semibold text-xs hover:bg-rose-50 transition-colors">
                          Mark No-Show
                        </button>
                      </div>
                    ` : ''}
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Waiting List (${waitingList.length} in queue)
                    </span>
                    <button 
                      onclick="window.router.openWalkInModal('${s.id}')"
                      class="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                      + Add Walk-In to this Queue
                    </button>
                  </div>

                  ${waitingList.length === 0 ? `
                    <div class="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                      No waiting customers in ${escapeHtml(s.name)} queue right now.
                    </div>
                  ` : `
                    <div class="overflow-x-auto border border-slate-100 rounded-2xl">
                      <table class="w-full text-left text-xs">
                        <thead>
                          <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-[10px] uppercase">
                            <th class="py-2.5 px-3">Pos</th>
                            <th class="py-2.5 px-3">Token</th>
                            <th class="py-2.5 px-3">Customer Name</th>
                            <th class="py-2.5 px-3">Phone</th>
                            <th class="py-2.5 px-3">Wait Duration</th>
                            <th class="py-2.5 px-3">Reason / Notes</th>
                            <th class="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                          ${waitingList.map((w, idx) => {
                            const waitMins = Math.round((Date.now() - new Date(w.joinedAt)) / 60000);
                            return `
                              <tr class="hover:bg-slate-50 transition-colors">
                                <td class="py-3 px-3 font-mono font-bold text-blue-600">#${idx + 1}</td>
                                <td class="py-3 px-3 font-mono font-bold text-slate-900">${escapeHtml(w.tokenNumber)}</td>
                                <td class="py-3 px-3 font-semibold text-slate-800">
                                  ${escapeHtml(w.customerName)}
                                  ${w.isWalkIn ? '<span class="ml-1 text-[9px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-bold">Walk-in</span>' : ''}
                                </td>
                                <td class="py-3 px-3 text-slate-500">${escapeHtml(w.customerPhone)}</td>
                                <td class="py-3 px-3 text-slate-600 font-medium">${waitMins} min ago</td>
                                <td class="py-3 px-3 text-slate-500 max-w-xs truncate">${escapeHtml(w.notes)}</td>
                                <td class="py-3 px-3 text-right">
                                  <button 
                                    onclick="window.router.markNoShow('${w.id}')"
                                    class="text-rose-600 hover:text-rose-800 font-medium text-[11px] hover:underline"
                                    title="Customer left or did not respond">
                                    No-show
                                  </button>
                                </td>
                              </tr>
                            `;
                          }).join('')}
                        </tbody>
                      </table>
                    </div>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ==========================================
  // PAGE 14: REPORTS & ANALYTICS (QLESS-17)
  // ==========================================
  function renderReportsPage() {
    const user = window.store.currentUser;
    if (!user || user.role !== 'admin') return renderUnauthorizedAdminNotice();

    const report = window.store.getReportsData('all', 'all');

    return `
      <div class="space-y-8 py-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="text-2xl font-extrabold text-slate-900">Queue Analytics & Service Reports</h1>
              ${renderJiraBadge('QLESS-17')}
            </div>
            <p class="text-xs text-slate-500 mt-1">Accurate metrics computed directly from persistent queue records</p>
          </div>

          <div class="flex items-center space-x-2.5">
            <select id="report-service-filter" onchange="window.router.updateReportsView()" class="text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white font-medium">
              <option value="all">All Services</option>
              <option value="hospital-opd">Hospital OPD</option>
              <option value="bank-counter">Bank Counter</option>
              <option value="passport-office">Passport Office</option>
              <option value="library-desk">Library Desk</option>
            </select>

            <select id="report-date-filter" onchange="window.router.updateReportsView()" class="text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white font-medium">
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="today">Today Only</option>
            </select>

            <button onclick="window.print()" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold no-print">
              Export / Print
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="report-metrics-cards">
          <div class="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-1">
            <span class="text-[11px] font-bold uppercase text-slate-400">Total Customers Served</span>
            <div class="text-3xl font-black text-emerald-600 font-mono" id="rep-served">${report.totalServed}</div>
            <span class="text-xs text-slate-500">Completed visits</span>
          </div>

          <div class="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-1">
            <span class="text-[11px] font-bold uppercase text-slate-400">Waiting Customers</span>
            <div class="text-3xl font-black text-blue-600 font-mono" id="rep-waiting">${report.totalWaiting}</div>
            <span class="text-xs text-slate-500">Currently in active queues</span>
          </div>

          <div class="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-1">
            <span class="text-[11px] font-bold uppercase text-slate-400">Average Waiting Time</span>
            <div class="text-3xl font-black text-indigo-600 font-mono" id="rep-avgwait">~${report.avgWaitTimeMinutes}m</div>
            <span class="text-xs text-slate-500">Actual calculated duration</span>
          </div>

          <div class="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-1">
            <span class="text-[11px] font-bold uppercase text-slate-400">Total Handled Tokens</span>
            <div class="text-3xl font-black text-slate-800 font-mono" id="rep-total">${report.totalTotal}</div>
            <span class="text-xs text-slate-500">${report.totalCancelled} cancelled • ${report.totalNoShow} no-show</span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Service-Wise Customer Volume</h3>
                <span class="text-xs text-slate-400">Completed vs Waiting vs Cancelled</span>
              </div>
              <span class="text-[11px] font-mono text-slate-400">BAR CHART</span>
            </div>
            <div class="h-64 relative">
              <canvas id="serviceVolumeChart"></canvas>
            </div>
          </div>

          <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-bold text-slate-900 text-sm">Overall Status Distribution</h3>
                <span class="text-xs text-slate-400">Proportions of served, waiting, and cancelled</span>
              </div>
              <span class="text-[11px] font-mono text-slate-400">DOUGHNUT</span>
            </div>
            <div class="h-64 relative">
              <canvas id="statusDoughnutChart"></canvas>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <h3 class="font-bold text-slate-900 text-base">Service Performance Breakdown</h3>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs" id="reports-table">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[10px]">
                  <th class="py-3 px-3">Service</th>
                  <th class="py-3 px-3">Prefix</th>
                  <th class="py-3 px-3 text-center">Waiting</th>
                  <th class="py-3 px-3 text-center">Serving</th>
                  <th class="py-3 px-3 text-center">Completed</th>
                  <th class="py-3 px-3 text-center">Cancelled</th>
                  <th class="py-3 px-3 text-center">No-Show</th>
                  <th class="py-3 px-3 text-right">Avg Wait Time</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100" id="reports-table-body">
                ${report.serviceBreakdown.map(b => `
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="py-3 px-3 font-bold text-slate-900">${escapeHtml(b.service.name)}</td>
                    <td class="py-3 px-3 font-mono font-bold text-blue-600">${escapeHtml(b.service.prefix)}</td>
                    <td class="py-3 px-3 text-center font-bold text-blue-600">${b.waiting}</td>
                    <td class="py-3 px-3 text-center font-bold text-emerald-600">${b.serving}</td>
                    <td class="py-3 px-3 text-center font-bold text-slate-800">${b.completed}</td>
                    <td class="py-3 px-3 text-center text-amber-700">${b.cancelled}</td>
                    <td class="py-3 px-3 text-center text-rose-700">${b.noshow}</td>
                    <td class="py-3 px-3 text-right font-mono font-bold text-slate-700">~${b.avgWait} mins</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // PAGE 15: USER PROFILE (QLESS-8)
  // ==========================================
  function renderProfilePage() {
    const user = window.store.currentUser;
    if (!user) return renderRedirectToLoginNotice();

    return `
      <div class="max-w-xl mx-auto py-8 px-4">
        <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <h1 class="text-2xl font-extrabold text-slate-900">Manage Profile</h1>
              ${renderJiraBadge('QLESS-8')}
            </div>
            <p class="text-xs text-slate-500">Update your personal contact details and password</p>
          </div>

          <form id="profile-form" onsubmit="window.router.handleProfileUpdate(event)" class="space-y-5">
            <div id="profile-msg" class="hidden p-3 rounded-xl text-xs"></div>

            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center space-x-3.5">
              <div class="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                ${escapeHtml(user.name.charAt(0).toUpperCase())}
              </div>
              <div>
                <span class="text-xs font-bold text-slate-900 block">${escapeHtml(user.name)}</span>
                <span class="text-[11px] text-slate-500 block">${escapeHtml(user.email)}</span>
                <span class="text-[10px] text-blue-600 font-semibold capitalize">${escapeHtml(user.role)} Account</span>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                id="prof-name" 
                required 
                value="${escapeHtml(user.name)}"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Email Address (Read-only)</label>
              <input 
                type="email" 
                disabled 
                value="${escapeHtml(user.email)}"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                id="prof-phone" 
                required 
                value="${escapeHtml(user.phone)}"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div class="pt-4 border-t border-slate-100 space-y-3">
              <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Change Password</h3>
              <div>
                <label class="block text-[11px] text-slate-600 mb-1">Current Password</label>
                <input 
                  type="password" 
                  id="prof-current-pwd" 
                  placeholder="Enter current password to authorize changes"
                  class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] text-slate-600 mb-1">New Password</label>
                  <input 
                    type="password" 
                    id="prof-new-pwd" 
                    placeholder="Min 6 chars, uppercase & num"
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label class="block text-[11px] text-slate-600 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    id="prof-confirm-pwd" 
                    placeholder="Re-enter new password"
                    class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div class="pt-2">
              <button 
                type="submit" 
                class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:shadow-lg">
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function renderRedirectToLoginNotice() {
    return `
      <div class="max-w-md mx-auto py-16 text-center space-y-4">
        <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
        </div>
        <h2 class="text-xl font-bold text-slate-900">Sign in to Access Services</h2>
        <p class="text-xs text-slate-500 max-w-xs mx-auto">Please sign in to take a queue pass, view your live standing, or access your tickets.</p>
        <div class="pt-2 flex justify-center space-x-3">
          <a href="#login" class="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md">Sign In</a>
          <button onclick="window.router.quickLoginCustomer()" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs">Customer Demo</button>
        </div>
      </div>
    `;
  }

  function renderUnauthorizedAdminNotice() {
    return `
      <div class="max-w-md mx-auto py-16 text-center space-y-4">
        <div class="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h2 class="text-xl font-bold text-slate-900">Restricted Staff Area</h2>
        <p class="text-xs text-slate-500 max-w-xs mx-auto">
          This administrative workspace is reserved for authorized counter clerks and queue supervisors. Customer accounts cannot access staff operations.
        </p>
        <div class="pt-3 flex justify-center items-center space-x-3">
          <a href="#services" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors">
            Return to Services
          </a>
          <a href="#admin-login" class="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors">
            Staff Sign In →
          </a>
        </div>
      </div>
    `;
  }

  // ==========================================
  // PAGE 16: HEALTHCARE EMERGENCY & SOS PORTAL
  // Incorporates all 10 emergency healthcare features
  // ==========================================
  function renderEmergencyPage() {
    const user = window.store.currentUser;
    const incidents = window.store.emergencyIncidents || [];
    const analytics = window.store.emergencyAnalytics || { avgResponseTimeFormatted: '1m 45s', totalToday: incidents.length, falseAlarmRate: 5.2 };
    const contacts = window.store.emergencyContacts || [];
    const defaultContact = contacts.length > 0 ? contacts[0] : null;
    const isOnline = navigator.onLine;
    const offlineQueue = window.store.offlineEmergencyQueue || [];
    const isAccess = window.store.isAccessibilityMode;
    const isHighContrast = window.store.isHighContrast;

    return `
      <div class="py-8 sm:py-10 space-y-8 max-w-5xl mx-auto">
        
        <!-- Emergency Page Header -->
        <header class="text-center max-w-3xl mx-auto space-y-3 px-4">
          <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-extrabold text-rose-700 shadow-xs">
            <span class="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
            <span>Healthcare Emergency Triage & SOS System</span>
          </div>

          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Emergency Medical Assistance
          </h1>

          <p class="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Quickly request on-site medical assistance, transmit your live location, notify family guardians, or report emergencies using voice or QR access.
          </p>
        </header>

        <!-- Feature 1 & 10: Giant 1-Tap SOS Button & Offline Status Banner -->
        <section class="bg-gradient-to-b from-rose-50/80 via-white to-rose-50/40 p-6 sm:p-10 rounded-3xl border-2 border-rose-300 shadow-xl space-y-6 text-center">
          
          ${!isOnline ? `
            <div class="p-3.5 rounded-2xl bg-amber-500 text-white text-xs font-semibold flex items-center justify-between shadow-md">
              <div class="flex items-center space-x-2">
                <span class="text-lg">📡</span>
                <span><strong>Offline Mode Active:</strong> No internet connection detected. Offline requests (${offlineQueue.length} queued) will be auto-transmitted every 3s.</span>
              </div>
              <button onclick="window.store.syncOfflineEmergencies()" class="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold">
                Retry Sync Now
              </button>
            </div>
          ` : (offlineQueue.length > 0 ? `
            <div class="p-3 rounded-2xl bg-blue-600 text-white text-xs flex items-center justify-between shadow-md">
              <span>📶 Internet restored! Synchronizing ${offlineQueue.length} buffered emergency alert(s)...</span>
              <button onclick="window.store.syncOfflineEmergencies()" class="px-3 py-1 rounded-lg bg-white/20 text-white text-[11px] font-bold">
                Sync Now
              </button>
            </div>
          ` : '')}

          <div class="max-w-md mx-auto space-y-4">
            <button 
              type="button"
              onclick="window.QueuelessModals.openEmergencyModal()"
              class="w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-full bg-gradient-to-br from-rose-500 via-red-600 to-rose-700 hover:from-rose-600 hover:to-red-800 text-white flex flex-col items-center justify-center shadow-2xl shadow-rose-600/50 emergency-btn-pulse cursor-pointer transform active:scale-95 transition-all border-4 border-white">
              <span class="text-5xl sm:text-6xl mb-1">🚨</span>
              <span class="text-2xl sm:text-3xl font-black tracking-widest uppercase">SOS</span>
              <span class="text-[11px] font-extrabold tracking-wider uppercase text-rose-100 mt-1">Tap for Help</span>
            </button>
            <p class="text-xs text-slate-500">
              One tap dispatches hospital emergency response staff directly to your location with audio triage siren.
            </p>
          </div>

          <!-- Quick Action Bar (Features: Voice, Location, QR, Accessibility) -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-rose-200/60 max-w-3xl mx-auto">
            <button 
              onclick="window.router.startVoiceEmergencyRecognition()"
              class="p-3 rounded-2xl bg-white hover:bg-rose-50 border border-slate-200 text-slate-800 text-xs font-bold flex flex-col items-center space-y-1 shadow-xs hover:border-rose-300 transition-all cursor-pointer">
              <span class="text-xl">🎤</span>
              <span>Voice Request</span>
              <span class="text-[10px] text-slate-400 font-normal">Speak distress</span>
            </button>

            <button 
              onclick="window.router.fetchCurrentGpsLocation()"
              class="p-3 rounded-2xl bg-white hover:bg-blue-50 border border-slate-200 text-slate-800 text-xs font-bold flex flex-col items-center space-y-1 shadow-xs hover:border-blue-300 transition-all cursor-pointer">
              <span class="text-xl">📍</span>
              <span>Share Location</span>
              <span class="text-[10px] text-slate-400 font-normal">Live GPS coordinates</span>
            </button>

            <button 
              onclick="window.QueuelessModals.openEmergencyQrModal()"
              class="p-3 rounded-2xl bg-white hover:bg-purple-50 border border-slate-200 text-slate-800 text-xs font-bold flex flex-col items-center space-y-1 shadow-xs hover:border-purple-300 transition-all cursor-pointer">
              <span class="text-xl">📱</span>
              <span>Emergency QR</span>
              <span class="text-[10px] text-slate-400 font-normal">Scan or print poster</span>
            </button>

            <button 
              onclick="window.router.toggleAccessibilityControls()"
              class="p-3 rounded-2xl bg-white hover:bg-emerald-50 border border-slate-200 text-slate-800 text-xs font-bold flex flex-col items-center space-y-1 shadow-xs hover:border-emerald-300 transition-all cursor-pointer">
              <span class="text-xl">♿</span>
              <span>Accessibility Mode</span>
              <span class="text-[10px] text-slate-400 font-normal">${isAccess ? 'Large Font Active' : 'Normal Text'}</span>
            </button>
          </div>
        </section>

        <!-- Feature 3 & 9: Guardian Contacts & Accessibility Controls -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Emergency Contact (Guardian Notification) -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2.5">
                <span class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">📲</span>
                <div>
                  <h3 class="text-base font-bold text-slate-900">Emergency Contact (Guardian)</h3>
                  <p class="text-[11px] text-slate-500">Auto-notified via SMS with hospital location when SOS is triggered</p>
                </div>
              </div>
              <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            ${defaultContact ? `
              <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <strong class="text-slate-800 block">${escapeHtml(defaultContact.name)} (${escapeHtml(defaultContact.relationship || 'Guardian')})</strong>
                  <span class="text-slate-500 font-mono text-[11px]">${escapeHtml(defaultContact.phone)}</span>
                </div>
                <button 
                  onclick="window.router.deleteEmergencyContact('${defaultContact.id}')"
                  class="text-rose-600 hover:text-rose-800 text-[11px] font-semibold cursor-pointer">
                  Remove
                </button>
              </div>
            ` : `
              <p class="text-xs text-slate-500 italic">No guardian contact registered yet. Add one below for automated emergency notifications.</p>
            `}

            <form onsubmit="window.router.submitSaveEmergencyContact(event)" class="space-y-2.5 pt-1">
              <div class="grid grid-cols-2 gap-2">
                <input type="text" id="em-contact-name" required placeholder="Guardian Name" class="px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none" />
                <input type="text" id="em-contact-rel" placeholder="Relationship (e.g. Spouse)" class="px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none" />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input type="tel" id="em-contact-phone" required placeholder="Phone (+1 555-0199)" class="px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none" />
                <input type="email" id="em-contact-email" placeholder="Email (optional)" class="px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none" />
              </div>
              <button type="submit" class="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer">
                Save Emergency Guardian Contact
              </button>
            </form>
          </div>

          <!-- Feature 9: Accessibility & Voice Guidance Controls -->
          <div class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center space-x-2.5">
              <span class="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">♿</span>
              <div>
                <h3 class="text-base font-bold text-slate-900">Accessibility & Assisted Mode</h3>
                <p class="text-[11px] text-slate-500">Optimized for elderly, visually impaired, and trembling hands</p>
              </div>
            </div>

            <div class="space-y-3 text-xs">
              <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <strong class="text-slate-800 block">Extra Large Font & Big Touch Targets</strong>
                  <p class="text-[11px] text-slate-500">Increases button sizes to 48px+ for effortless tapping.</p>
                </div>
                <button 
                  onclick="window.store.toggleAccessibilityMode()"
                  class="px-3 py-1.5 rounded-xl font-bold text-xs ${isAccess ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'} cursor-pointer">
                  ${isAccess ? 'Enabled ✓' : 'Enable'}
                </button>
              </div>

              <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <strong class="text-slate-800 block">High Contrast Visual Theme</strong>
                  <p class="text-[11px] text-slate-500">High legibility dark background for low-vision users.</p>
                </div>
                <button 
                  onclick="window.store.toggleHighContrast()"
                  class="px-3 py-1.5 rounded-xl font-bold text-xs ${isHighContrast ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'} cursor-pointer">
                  ${isHighContrast ? 'Enabled ✓' : 'Enable'}
                </button>
              </div>

              <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <strong class="text-slate-800 block">Audio Voice Guidance (Text-to-Speech)</strong>
                  <p class="text-[11px] text-slate-500">Speaks out emergency status and directions automatically.</p>
                </div>
                <button 
                  onclick="window.soundManager.speakVoice('Audio voice guidance is active. Your emergency triage system is standing by.')"
                  class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer">
                  Test Voice 🔊
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Feature 6, 7 & 8: Emergency History & Hospital Response Analytics -->
        <section class="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-lg font-bold text-slate-900">Emergency Incident History & Response Metrics</h3>
                ${renderJiraBadge('HEALTH-SOS', 'Healthcare Safety')}
              </div>
              <p class="text-xs text-slate-500 mt-0.5">Auditable log of emergency alerts, hospital triage response times, and false alarm records</p>
            </div>
            <div class="flex items-center space-x-2">
              <a href="/api/emergency/export" download class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-colors">
                <span>📥</span>
                <span>Export CSV</span>
              </a>
              <button onclick="window.QueuelessModals.openEmergencyQrModal()" class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center space-x-1.5 transition-colors">
                <span>📱</span>
                <span>Print QR Poster</span>
              </button>
            </div>
          </div>

          <!-- Analytics KPI Highlights -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100">
              <span class="text-[11px] font-semibold text-rose-700">Average Response Time</span>
              <div class="text-xl sm:text-2xl font-black text-rose-900 font-mono mt-0.5">
                ${escapeHtml(analytics.avgResponseTimeFormatted || '1m 51s')}
              </div>
              <span class="text-[10px] text-emerald-600 font-semibold">Target &lt; 3 mins ✓</span>
            </div>

            <div class="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100">
              <span class="text-[11px] font-semibold text-blue-700">Total Alerts Today</span>
              <div class="text-xl sm:text-2xl font-black text-blue-900 font-mono mt-0.5">
                ${analytics.totalToday || incidents.length}
              </div>
              <span class="text-[10px] text-slate-500">Hospital OPD</span>
            </div>

            <div class="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span class="text-[11px] font-semibold text-emerald-700">Resolved Incidents</span>
              <div class="text-xl sm:text-2xl font-black text-emerald-900 font-mono mt-0.5">
                ${analytics.resolvedCount || 2}
              </div>
              <span class="text-[10px] text-emerald-600 font-semibold">Triage Stabilized</span>
            </div>

            <div class="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
              <span class="text-[11px] font-semibold text-amber-700">False Alert Rate</span>
              <div class="text-xl sm:text-2xl font-black text-amber-900 font-mono mt-0.5">
                ${analytics.falseAlarmRate || 0}%
              </div>
              <span class="text-[10px] text-slate-500">Accidental touch audit</span>
            </div>
          </div>

          <!-- Incidents History Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200">
                <tr>
                  <th class="py-2.5 px-3">Alert ID</th>
                  <th class="py-2.5 px-3">Patient</th>
                  <th class="py-2.5 px-3">Hospital Location</th>
                  <th class="py-2.5 px-3">Severity</th>
                  <th class="py-2.5 px-3">Status</th>
                  <th class="py-2.5 px-3">Response Time</th>
                  <th class="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${incidents.map(inc => `
                  <tr class="hover:bg-slate-50/60 transition-colors">
                    <td class="py-3 px-3 font-mono font-bold text-slate-900">${escapeHtml(inc.id)}</td>
                    <td class="py-3 px-3">
                      <strong class="text-slate-800 block">${escapeHtml(inc.patient_name)}</strong>
                      <span class="text-[10px] text-slate-400 font-mono">${escapeHtml(inc.patient_phone || '')}</span>
                    </td>
                    <td class="py-3 px-3">
                      <span class="font-medium text-slate-700">${escapeHtml(inc.location)}</span>
                      ${inc.latitude ? `<div class="text-[10px] text-blue-600 font-mono">GPS: ${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}</div>` : ''}
                    </td>
                    <td class="py-3 px-3">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inc.severity === 'Critical' ? 'bg-rose-100 text-rose-800' :
                        inc.severity === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800'
                      }">
                        ${escapeHtml(inc.severity)}
                      </span>
                    </td>
                    <td class="py-3 px-3">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inc.status === 'Active' ? 'bg-rose-600 text-white animate-pulse' :
                        inc.status === 'Responding' ? 'bg-amber-500 text-white' :
                        inc.status === 'False Alarm' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                      }">
                        ${escapeHtml(inc.status)}
                      </span>
                    </td>
                    <td class="py-3 px-3 font-mono text-slate-600">
                      ${inc.response_time_seconds ? `${Math.floor(inc.response_time_seconds / 60)}m ${inc.response_time_seconds % 60}s` : (inc.status === 'Active' ? '<span class="text-rose-600 font-bold live-timer" data-live-timestamp="' + inc.triggered_at + '">00:00</span>' : '—')}
                    </td>
                    <td class="py-3 px-3 text-right space-x-1.5">
                      ${inc.status === 'Active' ? `
                        <button 
                          onclick="window.QueuelessModals.openFalseAlertModal('${inc.id}')"
                          class="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-[11px] border border-amber-200 cursor-pointer">
                          False Alarm?
                        </button>
                      ` : ''}
                      <button 
                        onclick="window.QueuelessModals.openEmergencyQrModal('${escapeHtml(inc.location)}')"
                        class="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] cursor-pointer"
                        title="View Location QR">
                        QR
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    `;
  }

  // ==========================================
  // PAGE 17: HOSPITAL STAFF EMERGENCY TRIAGE COMMAND CENTER
  // Real-time dispatch and live triage monitoring
  // ==========================================
  function renderAdminEmergencyDashboard() {
    const user = window.store.currentUser;
    const incidents = window.store.emergencyIncidents || [];
    const activeIncidents = incidents.filter(i => i.status === 'Active' || i.status === 'Responding');
    const analytics = window.store.emergencyAnalytics || { avgResponseTimeFormatted: '1m 51s', totalToday: incidents.length, falseAlarmRate: 7.4 };

    return `
      <div class="py-8 space-y-8 max-w-7xl mx-auto">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div class="flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
              <h1 class="text-2xl sm:text-3xl font-black text-slate-900">Hospital Emergency Triage Console</h1>
              ${renderJiraBadge('TRIAGE-COMMAND')}
            </div>
            <p class="text-xs text-slate-500 mt-1">
              Live hospital emergency monitoring, immediate triage dispatch, and response time analytics.
            </p>
          </div>

          <div class="flex items-center space-x-2">
            <button 
              onclick="window.QueuelessModals.openEmergencyModal()" 
              class="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 flex items-center space-x-1.5 cursor-pointer emergency-btn-pulse">
              <span>🚨</span>
              <span>Test Emergency SOS</span>
            </button>
            <a href="/api/emergency/export" download class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-colors">
              <span>📥</span>
              <span>Incident Logs (CSV)</span>
            </a>
          </div>
        </div>

        <!-- Real-Time Active Emergencies Feed (Flashing Triage Matrix) -->
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <span>🚨 Active Medical Alerts</span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-black ${activeIncidents.length > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600'}">
                ${activeIncidents.length} Active
              </span>
            </h2>
            <span class="text-xs text-slate-500 font-mono">Live Sync (2.5s)</span>
          </div>

          ${activeIncidents.length > 0 ? `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${activeIncidents.map(inc => `
                <div class="p-5 rounded-3xl bg-rose-50 border-2 border-rose-500 shadow-xl space-y-4 animate-in zoom-in-95">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                        ${escapeHtml(inc.severity)} Medical Alert
                      </span>
                      <h3 class="text-lg font-black text-slate-900 mt-1">${escapeHtml(inc.patient_name)}</h3>
                      <p class="text-xs text-rose-800 font-medium">📍 ${escapeHtml(inc.location)}</p>
                    </div>
                    <div class="text-right">
                      <span class="text-[11px] text-slate-500">Elapsed Response:</span>
                      <div class="text-xl font-mono font-black text-rose-700 live-timer" data-live-timestamp="${inc.triggered_at}">
                        00:00
                      </div>
                    </div>
                  </div>

                  ${inc.description ? `
                    <div class="p-3 rounded-xl bg-white/90 border border-rose-200 text-xs text-slate-800">
                      <strong>Symptoms / Request:</strong> ${escapeHtml(inc.description)}
                    </div>
                  ` : ''}

                  ${inc.voice_transcript ? `
                    <div class="p-2.5 rounded-xl bg-rose-100/80 border border-rose-300 text-xs text-rose-900 font-semibold flex items-center space-x-2">
                      <span>🎤</span>
                      <span>Voice Transcript: "${escapeHtml(inc.voice_transcript)}"</span>
                    </div>
                  ` : ''}

                  ${inc.guardian_phone ? `
                    <div class="text-[11px] text-blue-800 bg-blue-50 p-2 rounded-lg border border-blue-200 flex items-center justify-between">
                      <span>Guardian: <strong>${escapeHtml(inc.guardian_name || 'Guardian')}</strong> (${escapeHtml(inc.guardian_phone)})</span>
                      <span class="text-emerald-700 font-bold">SMS Sent ✓</span>
                    </div>
                  ` : ''}

                  <div class="flex items-center space-x-2 pt-2 border-t border-rose-200">
                    <button 
                      onclick="window.router.resolveEmergencyAlert('${inc.id}', 'Resolved')"
                      class="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer">
                      ✅ Mark Team Arrived / Resolved
                    </button>
                    <button 
                      onclick="window.QueuelessModals.openFalseAlertModal('${inc.id}')"
                      class="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs border border-amber-300 cursor-pointer">
                      ⚠️ False Alarm
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <span class="text-3xl">🛡️</span>
              <h3 class="text-sm font-bold text-slate-800">All Hospital Wards Normal</h3>
              <p class="text-xs text-slate-500 max-w-sm mx-auto">No active emergency alerts at this moment. System is standing by with live triage monitoring.</p>
            </div>
          `}
        </section>

        <!-- Emergency Analytics KPI Section -->
        <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span class="text-xs text-slate-500 font-semibold">Average Response Time</span>
            <div class="text-3xl font-black text-rose-600 font-mono">${escapeHtml(analytics.avgResponseTimeFormatted || '1m 51s')}</div>
            <p class="text-[11px] text-emerald-600 font-medium">Standard Target &lt; 3m</p>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span class="text-xs text-slate-500 font-semibold">Total Incidents Today</span>
            <div class="text-3xl font-black text-slate-900 font-mono">${analytics.totalToday || incidents.length}</div>
            <p class="text-[11px] text-slate-500">Across all hospital wings</p>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span class="text-xs text-slate-500 font-semibold">Triage Stabilized</span>
            <div class="text-3xl font-black text-emerald-600 font-mono">${analytics.resolvedCount || 2}</div>
            <p class="text-[11px] text-slate-500">Successfully handled</p>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span class="text-xs text-slate-500 font-semibold">False Alert Rate</span>
            <div class="text-3xl font-black text-amber-600 font-mono">${analytics.falseAlarmRate || 0}%</div>
            <p class="text-[11px] text-slate-500">Verified accidental taps</p>
          </div>
        </section>

        <!-- Full Audit History Table -->
        <section class="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-slate-900">Hospital Incident Log & Staff Audit Trail</h3>
            <span class="text-xs text-slate-500">${incidents.length} Records</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200">
                <tr>
                  <th class="py-2.5 px-3">Alert ID</th>
                  <th class="py-2.5 px-3">Patient Name</th>
                  <th class="py-2.5 px-3">Location</th>
                  <th class="py-2.5 px-3">Severity</th>
                  <th class="py-2.5 px-3">Status</th>
                  <th class="py-2.5 px-3">Response Time</th>
                  <th class="py-2.5 px-3">Staff Verifier</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${incidents.map(inc => `
                  <tr class="hover:bg-slate-50/50">
                    <td class="py-3 px-3 font-mono font-bold text-slate-900">${escapeHtml(inc.id)}</td>
                    <td class="py-3 px-3 font-semibold text-slate-800">${escapeHtml(inc.patient_name)}</td>
                    <td class="py-3 px-3 text-slate-600">${escapeHtml(inc.location)}</td>
                    <td class="py-3 px-3">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${inc.severity === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">
                        ${escapeHtml(inc.severity)}
                      </span>
                    </td>
                    <td class="py-3 px-3">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inc.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                        inc.status === 'False Alarm' ? 'bg-slate-200 text-slate-700' : 'bg-rose-600 text-white'
                      }">
                        ${escapeHtml(inc.status)}
                      </span>
                    </td>
                    <td class="py-3 px-3 font-mono text-slate-600">
                      ${inc.response_time_seconds ? `${Math.floor(inc.response_time_seconds / 60)}m ${inc.response_time_seconds % 60}s` : '—'}
                    </td>
                    <td class="py-3 px-3 text-slate-600">
                      ${escapeHtml(inc.resolved_by || 'Hospital Triage Team')}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    `;
  }

  window.QueuelessPages = {
    renderHomePage,
    renderRegisterPage,
    renderLoginPage,
    renderAdminLoginPage,
    renderAdminRegisterPage,
    renderCustomerDashboard,
    renderServicesPage,
    renderJoinQueuePage,
    renderDigitalTokenPage,
    renderTrackingPage,
    renderWaitingTimePage,
    renderNotificationsPage,
    renderHistoryPage,
    renderAdminDashboard,
    renderStaffDashboard,
    renderManageQueuesPage,
    renderReportsPage,
    renderProfilePage,
    renderEmergencyPage,
    renderAdminEmergencyDashboard
  };
})();
