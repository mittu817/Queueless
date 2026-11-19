// Queueless Modals System: Leave Queue, Join Queue, Walk-in Customer, Transfer & Admin CRUD Modals

(function() {
  const { escapeHtml, showToast } = window.QueuelessComponents;

  function getModalContainer() {
    let modalContainer = document.getElementById('app-modal-container');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'app-modal-container';
      document.body.appendChild(modalContainer);
    }
    return modalContainer;
  }

  function closeModal() {
    const container = document.getElementById('app-modal-container');
    if (container) container.innerHTML = '';
  }

  // 1. Open Join Queue Modal (With Basic Customer Form: Name, Email, Phone, & Priority)
  function openJoinModal(serviceId) {
    const service = window.QueuelessData.SERVICES.find(s => s.id === serviceId);
    if (!service) return;

    // Check if customer already holds an active ticket
    const active = window.store.getActiveQueue();
    if (active) {
      showToast(
        `You already hold active token ${active.tokenNumber} for ${active.serviceName}. View your queue below.`,
        'info'
      );
      window.location.hash = '#token';
      return;
    }

    const user = window.store.currentUser;
    const container = getModalContainer();
    const waitingCount = window.store.queues.filter(q => q.serviceId === service.id && q.status === 'Waiting').length;

    // Estimated waiting time preview
    const aiEstimate = Math.max(1, Math.round((waitingCount * service.avgServiceTimeMinutes) / (service.active_counters || 3)));

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-2.5">
              <span class="font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${service.badgeColor}">${escapeHtml(service.prefix)}</span>
              <div>
                <h3 class="text-lg font-bold text-slate-900 leading-snug">Join ${escapeHtml(service.name)} Queue</h3>
                <p class="text-[11px] text-slate-500">Provide your basic info to get your unique digital token</p>
              </div>
            </div>
            <button onclick="window.QueuelessModals.closeModal()" class="text-slate-400 hover:text-slate-600 p-1">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs space-y-1.5">
            <div class="flex justify-between items-center">
              <span class="text-slate-600">Assigned Counter:</span>
              <strong class="text-slate-800">${escapeHtml(service.counters)}</strong>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-600">People Ahead in Line:</span>
              <strong class="text-blue-700 font-mono">${waitingCount} waiting</strong>
            </div>
            <div class="flex justify-between items-center pt-1 border-t border-blue-200/60">
              <span class="text-slate-600 font-semibold">Estimated Wait Time:</span>
              <span class="inline-flex items-center space-x-1 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                <span>⏱️ ~${aiEstimate} mins</span>
              </span>
            </div>
          </div>

          <form onsubmit="window.router.submitJoinModal(event, '${service.id}')" class="space-y-3.5">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Full Name <span class="text-rose-500">*</span></label>
              <input 
                type="text" 
                id="modal-join-name" 
                required 
                placeholder="e.g. Alex Turner" 
                value="${escapeHtml(user?.name || '')}"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50/40 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Email Address <span class="text-rose-500">*</span></label>
                <input 
                  type="email" 
                  id="modal-join-email" 
                  required 
                  placeholder="e.g. alex@example.com" 
                  value="${escapeHtml(user?.email || '')}"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50/40 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Phone Number <span class="text-rose-500">*</span></label>
                <input 
                  type="tel" 
                  id="modal-join-phone" 
                  required 
                  placeholder="e.g. +1 555-0199" 
                  value="${escapeHtml(user?.phone || '')}"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50/40 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Customer Category</label>
                <select id="modal-join-priority" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50/40 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none">
                  <option value="Normal">Normal Queue (Standard)</option>
                  <option value="Elderly/Disabled">Elderly / Differently Abled</option>
                  <option value="Urgent">Urgent / Emergency</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Reason for Consultation</label>
                <select id="modal-join-notes-select" class="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50/40 focus:bg-white outline-none" onchange="if(this.value) document.getElementById('modal-join-notes').value = this.value">
                  <option value="">Select common reason...</option>
                  ${service.sampleReasons.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div>
              <input 
                type="text" 
                id="modal-join-notes" 
                placeholder="Specific notes or medical / banking inquiry..."
                value="${escapeHtml(service.sampleReasons[0] || 'General consultation')}"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50/40 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
              />
            </div>

            <div class="pt-2">
              <button 
                type="submit" 
                id="modal-join-submit-btn" 
                class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer">
                <span>Get Unique Token & View Queue</span>
                <span>→</span>
              </button>
              <p class="text-[10px] text-center text-slate-400 mt-2">
                🔒 Your details are protected securely in our backend and used strictly for queue notifications.
              </p>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // 2. Open Leave Queue Modal
  function openLeaveModal(tokenId) {
    const ticket = window.store.queues.find(q => q.id === tokenId);
    if (!ticket) return;

    const container = getModalContainer();
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
          <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </div>

          <div>
            <h3 class="text-lg font-bold text-slate-900">Leave Virtual Queue?</h3>
            <p class="text-xs text-slate-500 mt-1">
              Are you sure you want to release token <strong class="text-slate-800 font-mono">${escapeHtml(ticket.tokenNumber)}</strong> for ${escapeHtml(ticket.serviceName)}? Your current place will be given to the next waiting customer.
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Reason for Cancellation</label>
            <select id="leave-reason-select" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none">
              <option value="Schedule conflict / No longer available">Schedule conflict / No longer available</option>
              <option value="Waiting time was longer than expected">Waiting time was longer than expected</option>
              <option value="Issue resolved elsewhere">Issue resolved elsewhere</option>
              <option value="Joined the wrong queue by mistake">Joined the wrong queue by mistake</option>
            </select>
          </div>

          <div class="flex space-x-2.5 pt-2">
            <button 
              type="button" 
              onclick="window.QueuelessModals.closeModal()" 
              class="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs">
              Stay in Queue
            </button>
            <button 
              type="button" 
              onclick="window.router.confirmLeaveQueue('${ticket.id}')" 
              class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20">
              Confirm & Leave Queue
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 3. Open Walk-in / Kiosk Manual Token Modal
  function openWalkInModal() {
    const services = window.QueuelessData.SERVICES;
    const container = getModalContainer();

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-2">
              <span class="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              </span>
              <div>
                <h3 class="text-lg font-bold text-slate-900">Issue Walk-In Kiosk Token</h3>
                <p class="text-xs text-slate-500">For customers arriving at physical counter without a smart device</p>
              </div>
            </div>
            <button onclick="window.QueuelessModals.closeModal()" class="text-slate-400 hover:text-slate-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form onsubmit="window.router.submitWalkInModal(event)" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Select Service Desk *</label>
              <select id="walkin-service-select" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                ${services.map(s => `<option value="${s.id}">[${escapeHtml(s.prefix)}] ${escapeHtml(s.name)} (${escapeHtml(s.counters)})</option>`).join('')}
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                <input 
                  type="text" 
                  id="walkin-name" 
                  required 
                  placeholder="e.g. John Smith"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input 
                  type="tel" 
                  id="walkin-phone" 
                  placeholder="+1 555-0188"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Queue Priority Tier</label>
              <select id="walkin-priority" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="Normal">Normal Queue</option>
                <option value="Elderly/Disabled">Elderly / Disabled Access</option>
                <option value="Urgent">Urgent / Critical Triage</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Visit Purpose / Consultation Note</label>
              <input 
                type="text" 
                id="walkin-notes" 
                placeholder="Walk-in on-site visit notes"
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div class="flex space-x-2.5 pt-2">
              <button 
                type="button" 
                onclick="window.QueuelessModals.closeModal()" 
                class="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs">
                Cancel
              </button>
              <button 
                type="submit" 
                class="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20">
                Generate & Print Token
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // 4. Staff Customer Transfer Modal
  function openTransferModal(tokenId) {
    const entry = window.store.queues.find(q => q.id === tokenId);
    if (!entry) return;

    const services = window.QueuelessData.SERVICES.filter(s => s.id !== entry.serviceId);
    const container = getModalContainer();

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-bold text-slate-900">Transfer Customer</h3>
              <p class="text-xs text-slate-500">Transfer token <strong class="font-mono text-indigo-700">${escapeHtml(entry.tokenNumber)}</strong> to another department or desk</p>
            </div>
            <button onclick="window.QueuelessModals.closeModal()" class="text-slate-400 hover:text-slate-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form onsubmit="window.router.submitTransferCustomer(event, '${entry.id}')" class="space-y-3.5">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Target Service Department *</label>
              <select id="transfer-service-select" required class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                ${services.map(s => `<option value="${s.id}">${escapeHtml(s.name)} (${escapeHtml(s.counters)})</option>`).join('')}
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Reason for Transfer</label>
              <select id="transfer-reason" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none">
                <option value="Escalation to senior specialist">Escalation to senior specialist</option>
                <option value="Cross-department documentation required">Cross-department documentation required</option>
                <option value="Customer requested alternate counter">Customer requested alternate counter</option>
                <option value="Internal triage reroute">Internal triage reroute</option>
              </select>
            </div>

            <div class="flex space-x-2 pt-2">
              <button type="button" onclick="window.QueuelessModals.closeModal()" class="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs">
                Cancel
              </button>
              <button type="submit" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md">
                Confirm Transfer
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // 5. Admin Change Priority Modal
  function openPriorityModal(tokenId) {
    const entry = window.store.queues.find(q => q.id === tokenId);
    if (!entry) return;

    const container = getModalContainer();
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
          <div>
            <h3 class="text-base font-bold text-slate-900">Change Token Priority</h3>
            <p class="text-xs text-slate-500">Token <strong class="font-mono text-indigo-700">${escapeHtml(entry.tokenNumber)}</strong> (${escapeHtml(entry.customerName)})</p>
          </div>

          <form onsubmit="window.router.submitChangePriority(event, '${entry.id}')" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Select Priority Level</label>
              <select id="change-priority-select" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white outline-none">
                <option value="Normal" ${entry.priority === 'Normal' ? 'selected' : ''}>Normal Queue</option>
                <option value="Elderly/Disabled" ${entry.priority === 'Elderly/Disabled' ? 'selected' : ''}>Elderly / Disabled Access</option>
                <option value="Urgent" ${entry.priority === 'Urgent' ? 'selected' : ''}>Urgent / Critical Triage</option>
              </select>
            </div>

            <div class="flex space-x-2">
              <button type="button" onclick="window.QueuelessModals.closeModal()" class="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs">Cancel</button>
              <button type="submit" class="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md">Update Priority</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // 6. Admin Add / Edit Service Modal
  function openServiceModal(service = null) {
    const isEdit = !!service;
    const container = getModalContainer();

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
          <div class="flex items-start justify-between">
            <h3 class="text-lg font-bold text-slate-900">${isEdit ? 'Edit Service' : 'Add New Service Desk'}</h3>
            <button onclick="window.QueuelessModals.closeModal()" class="text-slate-400 hover:text-slate-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form onsubmit="window.router.submitServiceModal(event, ${isEdit ? `'${service.id}'` : 'null'})" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Prefix * (e.g. DENT)</label>
                <input type="text" id="svc-prefix" required value="${isEdit ? escapeHtml(service.prefix) : ''}" placeholder="DENT" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Service Name *</label>
                <input type="text" id="svc-name" required value="${isEdit ? escapeHtml(service.name) : ''}" placeholder="Dental Clinic" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <input type="text" id="svc-category" required value="${isEdit ? escapeHtml(service.category) : ''}" placeholder="Healthcare" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Counters (e.g. Counter 10)</label>
                <input type="text" id="svc-counters" required value="${isEdit ? escapeHtml(service.counters) : 'Counter 1'}" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Avg Service Time (Mins) *</label>
                <input type="number" id="svc-avg-time" min="1" max="120" required value="${isEdit ? (service.avg_service_time_minutes || service.avgServiceTimeMinutes || 10) : 10}" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Active Counters Count</label>
                <input type="number" id="svc-active-ctrs" min="1" max="20" required value="${isEdit ? (service.active_counters || 2) : 2}" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none" />
              </div>
            </div>

            <div class="flex space-x-2 pt-2">
              <button type="button" onclick="window.QueuelessModals.closeModal()" class="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs">Cancel</button>
              <button type="submit" class="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md">Save Service</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // 7. Customer Submit Complaint / Feedback Modal
  function openComplaintModal() {
    const user = window.store.currentUser;
    const services = window.QueuelessData.SERVICES;
    const container = getModalContainer();

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-bold text-slate-900">Submit Service Feedback</h3>
              <p class="text-xs text-slate-500">Report an issue or suggest an improvement to the administration</p>
            </div>
            <button onclick="window.QueuelessModals.closeModal()" class="text-slate-400 hover:text-slate-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <form onsubmit="window.router.submitCustomerComplaint(event)" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
              <input type="text" id="comp-name" required value="${user ? escapeHtml(user.name) : ''}" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Contact Phone *</label>
              <input type="tel" id="comp-phone" required value="${user ? escapeHtml(user.phone) : ''}" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Subject / Issue Summary *</label>
              <input type="text" id="comp-subject" required placeholder="e.g. Counter 4 delay / Staff assistance" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Detailed Explanation *</label>
              <textarea id="comp-details" rows="3" required placeholder="Describe what happened and how we can resolve it..." class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none"></textarea>
            </div>

            <div class="flex space-x-2 pt-2">
              <button type="button" onclick="window.QueuelessModals.closeModal()" class="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs">Cancel</button>
              <button type="submit" class="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md">Submit Ticket</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // 8. Admin Add Holiday Modal
  function openHolidayModal() {
    const container = getModalContainer();
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
          <h3 class="text-base font-bold text-slate-900">Add Holiday / Facility Closure</h3>

          <form onsubmit="window.router.submitAddHoliday(event)" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Holiday Date *</label>
              <input type="date" id="hol-date" required class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Holiday Name *</label>
              <input type="text" id="hol-name" required placeholder="e.g. Public Memorial Day" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Notice / Public Notes</label>
              <input type="text" id="hol-notes" placeholder="Counters closed for all services" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none" />
            </div>

            <div class="flex space-x-2 pt-2">
              <button type="button" onclick="window.QueuelessModals.closeModal()" class="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs">Cancel</button>
              <button type="submit" class="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md">Add Holiday</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // ==========================================
  // HEALTHCARE EMERGENCY MODALS
  // ==========================================

  // 10. Open Healthcare SOS Emergency Modal
  function openEmergencyModal(prefillLocation = '') {
    const user = window.store.currentUser;
    const container = getModalContainer();
    const contacts = window.store.emergencyContacts || [];
    const defaultContact = contacts.length > 0 ? contacts[0] : null;
    const isOnline = navigator.onLine;

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
        <div class="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border-2 border-rose-500 space-y-4 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
          
          <!-- Emergency Header Banner -->
          <div class="flex items-start justify-between pb-3 border-b border-rose-100">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-rose-500/40 emergency-btn-pulse">
                🚨
              </div>
              <div>
                <span class="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Hospital OPD Medical Triage
                </span>
                <h3 class="text-xl font-black text-slate-900 mt-0.5">Emergency Assistance (SOS)</h3>
              </div>
            </div>
            <button onclick="window.QueuelessModals.closeModal()" class="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          ${!isOnline ? `
            <div class="p-3 rounded-2xl bg-amber-500 text-white text-xs flex items-center space-x-2.5 shadow-md">
              <span class="text-lg">📡</span>
              <div class="flex-1">
                <strong>Offline Emergency Mode Active</strong>
                <p class="text-[11px] text-amber-100">No internet detected. Your SOS will be buffered locally with GPS timestamps and auto-transmitted every 3s.</p>
              </div>
            </div>
          ` : ''}

          <!-- Live GPS & Room Location Sharing -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <span>📍 Emergency Location</span>
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </label>
              <button 
                type="button" 
                onclick="window.router.fetchCurrentGpsLocation()" 
                id="btn-detect-gps"
                class="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer">
                <span>Detect Live GPS</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              </button>
            </div>

            <select id="emergency-location-select" class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium outline-none">
              <option value="Hospital OPD - Main Waiting Hall A" ${prefillLocation.includes('Hall-A') || !prefillLocation ? 'selected' : ''}>Hospital OPD - Main Waiting Hall A (Bench Area)</option>
              <option value="Hospital OPD - Counters 1 – 3 Corridor" ${prefillLocation.includes('Counters') ? 'selected' : ''}>Hospital OPD - Counters 1 – 3 Corridor</option>
              <option value="Room 102 - Vitals & Triage Station">Room 102 - Vitals & Triage Station</option>
              <option value="Room 104 - Physician Consultation Bay">Room 104 - Physician Consultation Bay</option>
              <option value="Ground Floor - Patient Restrooms Corridor">Ground Floor - Patient Restrooms Corridor</option>
              <option value="Hospital OPD - Pharmacy & Lab Waiting Area">Hospital OPD - Pharmacy & Lab Waiting Area</option>
            </select>

            <div id="gps-coords-badge" class="text-[10px] text-slate-500 font-mono bg-white p-2 rounded-lg border border-slate-200/80 flex items-center justify-between">
              <span>📍 Coordinates: <strong id="gps-coords-text">Lat: 37.7749, Lng: -122.4194</strong></span>
              <span class="text-emerald-600 font-bold">Accuracy ±4m</span>
            </div>
          </div>

          <!-- Voice-Based Emergency Request -->
          <div class="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-rose-900 flex items-center space-x-1.5">
                <span>🎤 Voice Emergency Request (No Typing Needed)</span>
              </span>
              <button 
                type="button" 
                id="voice-mic-btn"
                onclick="window.router.startVoiceEmergencyRecognition()"
                class="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-sm flex items-center space-x-1 cursor-pointer">
                <span>Record Voice</span>
                <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
              </button>
            </div>

            <input 
              type="text" 
              id="emergency-description" 
              placeholder="e.g. Acute chest heaviness, sudden collapse, difficulty breathing..." 
              class="w-full px-3 py-2 text-xs rounded-xl border border-rose-300 bg-white focus:ring-2 focus:ring-rose-500 outline-none"
            />

            <!-- 1-Tap Symptom Chips -->
            <div class="flex flex-wrap gap-1.5 pt-1">
              <button type="button" onclick="document.getElementById('emergency-description').value = 'Severe Chest Pain & Breathing Difficulty'" class="px-2 py-0.5 rounded-md bg-white text-rose-700 border border-rose-200 text-[10px] font-semibold hover:bg-rose-100 cursor-pointer">🫀 Chest Pain</button>
              <button type="button" onclick="document.getElementById('emergency-description').value = 'Sudden Collapse / Unconscious Patient'" class="px-2 py-0.5 rounded-md bg-white text-rose-700 border border-rose-200 text-[10px] font-semibold hover:bg-rose-100 cursor-pointer">💫 Collapse</button>
              <button type="button" onclick="document.getElementById('emergency-description').value = 'Severe Bleeding / Acute Physical Trauma'" class="px-2 py-0.5 rounded-md bg-white text-rose-700 border border-rose-200 text-[10px] font-semibold hover:bg-rose-100 cursor-pointer">🩸 Severe Bleeding</button>
              <button type="button" onclick="document.getElementById('emergency-description').value = 'Severe Asthma / Choking / Cyanosis'" class="px-2 py-0.5 rounded-md bg-white text-rose-700 border border-rose-200 text-[10px] font-semibold hover:bg-rose-100 cursor-pointer">🫁 Breathing Loss</button>
            </div>
          </div>

          <!-- Emergency Guardian Notification -->
          <div class="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold text-blue-900">📲 Emergency Contact Notification</span>
              <span class="text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-semibold">Auto-SMS Alert</span>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                id="emergency-guardian-name" 
                placeholder="Guardian Name" 
                value="${escapeHtml(defaultContact ? defaultContact.name : 'Sarah Turner')}"
                class="px-2.5 py-1.5 text-xs rounded-lg border border-blue-200 bg-white"
              />
              <input 
                type="tel" 
                id="emergency-guardian-phone" 
                placeholder="Guardian Phone" 
                value="${escapeHtml(defaultContact ? defaultContact.phone : '+1 555-0199')}"
                class="px-2.5 py-1.5 text-xs rounded-lg border border-blue-200 bg-white"
              />
            </div>
            <label class="flex items-center space-x-2 text-[11px] text-blue-800 cursor-pointer">
              <input type="checkbox" id="emergency-notify-check" checked class="rounded text-blue-600" />
              <span>Instantly notify guardian via SMS with live hospital wing location</span>
            </label>
          </div>

          <!-- Main SOS Action Button & 5s False Alarm Prevention -->
          <div class="pt-2 space-y-2">
            <button 
              type="button" 
              id="sos-confirm-trigger-btn"
              onclick="window.router.executeEmergencySosTrigger()"
              class="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-700 hover:to-red-800 text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-xl shadow-rose-600/30 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer border border-rose-400">
              <span class="text-xl">🚨</span>
              <span>TRIGGER HOSPITAL SOS (DISPATCH NOW)</span>
              <span class="text-xl">🚨</span>
            </button>

            <div class="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Accidental press? Close anytime</span>
              <button type="button" onclick="window.QueuelessModals.closeModal()" class="text-slate-600 hover:text-slate-900 font-bold underline cursor-pointer">
                Cancel Request
              </button>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  // 11. Open False Alert Verification Modal (For Patient or Staff)
  function openFalseAlertModal(incidentId) {
    const container = getModalContainer();
    const incident = (window.store.emergencyIncidents || []).find(i => i.id === incidentId);

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
          <div class="flex items-center space-x-2.5 text-amber-600">
            <span class="text-2xl">⚠️</span>
            <h3 class="text-lg font-bold text-slate-900">False Alert Management</h3>
          </div>
          <p class="text-xs text-slate-500">
            Verify and log accidental alerts to ensure accurate hospital response time records.
          </p>

          <form onsubmit="window.router.submitFalseAlarmResolution(event, '${incidentId}')" class="space-y-3.5">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Reason for Accidental / False Alert *</label>
              <select id="false-alarm-reason" required class="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none">
                <option value="Accidental screen press in pocket/purse">Accidental screen touch in pocket / handbag</option>
                <option value="Child / family member pressed button by mistake">Child or family member pressed button</option>
                <option value="Routine test alert / hospital triage drill">Routine test alert / hospital triage drill</option>
                <option value="Patient symptom self-resolved before response">Patient symptom self-resolved before response team arrival</option>
                <option value="Other verified non-emergency reason">Other verified non-emergency</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Staff / Verifier Notes</label>
              <textarea id="false-alarm-notes" rows="2" placeholder="Spoke with patient at bench 4, confirmed safe." class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 outline-none"></textarea>
            </div>

            <div class="flex space-x-2 pt-2">
              <button type="button" onclick="window.QueuelessModals.closeModal()" class="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs">Keep Active</button>
              <button type="submit" class="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md">Mark as False Alert</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // 12. Open QR-Based Emergency Access Modal
  function openEmergencyQrModal(location = 'Hospital-OPD-Waiting-A') {
    const container = getModalContainer();
    const emergencyUrl = `${window.location.origin}/#emergency?loc=${encodeURIComponent(location)}`;
    const qrSvg = window.generateTokenQR ? window.generateTokenQR(emergencyUrl, 180) : '';

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
        <div class="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              🚨 Emergency Quick-Scan
            </span>
            <button onclick="window.QueuelessModals.closeModal()" class="text-slate-400 hover:text-slate-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div>
            <h3 class="text-base font-bold text-slate-900">Scan for 1-Tap SOS</h3>
            <p class="text-xs text-slate-500 mt-0.5">Place on physical hospital waiting area benches & triage kiosks.</p>
          </div>

          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center">
            ${qrSvg || `
              <div class="w-44 h-44 bg-white p-2 rounded-xl flex items-center justify-center text-xs text-slate-400 font-mono">
                [QR: ${emergencyUrl}]
              </div>
            `}
          </div>

          <div class="text-[11px] text-slate-500">
            <strong>Location Code:</strong> <span class="font-mono text-slate-700 font-bold">${escapeHtml(location)}</span>
          </div>

          <div class="flex space-x-2 pt-1">
            <button onclick="window.print()" class="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs">
              🖨️ Print Poster
            </button>
            <button onclick="window.location.hash='#emergency'; window.QueuelessModals.closeModal();" class="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md">
              Test Emergency URL
            </button>
          </div>
        </div>
      </div>
    `;
  }

  window.QueuelessModals = {
    closeModal,
    openJoinModal,
    openLeaveModal,
    openWalkInModal,
    openTransferModal,
    openPriorityModal,
    openServiceModal,
    openComplaintModal,
    openHolidayModal,
    openEmergencyModal,
    openFalseAlertModal,
    openEmergencyQrModal
  };
})();
