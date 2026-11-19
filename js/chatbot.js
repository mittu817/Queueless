// Queueless Smart Queue Chatbot Assistant
// Interactive floating assistant to guide customers through joining queues, tracking tokens, and checking AI wait times

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

  class QueuelessChatbot {
    constructor() {
      this.isOpen = false;
      this.messages = [];
      this.hasUnread = true;
      this.init();
    }

    init() {
      // Add initial greeting
      this.messages.push({
        sender: 'bot',
        text: '👋 Hello! I am your <strong>Queueless Virtual Guide</strong>.<br/>I can help you join a queue, track your token, check your waiting time, or answer any questions about our service desks.',
        time: this.formatTime(new Date()),
        chips: [
          { label: '🚨 Emergency SOS', query: 'I have a medical emergency, request help!' },
          { label: '🎫 Check My Token', query: 'What is my current token status?' },
          { label: '📝 How to Join?', query: 'How do I join a virtual queue?' },
          { label: '⏱️ How is wait time calculated?', query: 'How does AI calculate waiting time?' },
          { label: '🏢 What services are open?', query: 'Which services are currently open?' }
        ]
      });

      this.renderWidget();
      this.bindEvents();
    }

    formatTime(date) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    renderWidget() {
      let container = document.getElementById('queueless-chatbot-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'queueless-chatbot-container';
        container.className = 'fixed bottom-5 right-5 z-40 select-none';
        document.body.appendChild(container);
      }

      container.innerHTML = `
        <!-- Floating Chatbot Launcher Button -->
        <div id="chatbot-launcher" class="${this.isOpen ? 'hidden' : 'flex'} items-center">
          <button 
            id="chatbot-toggle-btn"
            type="button"
            class="relative flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold text-xs shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20">
            <span class="relative flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
            </span>
            <span class="text-base">🤖</span>
            <span class="font-extrabold tracking-wide hidden sm:inline">Queue Assistant</span>
            <span class="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">Help</span>
          </button>
        </div>

        <!-- Expanded Chatbot Window -->
        <div id="chatbot-window" class="${this.isOpen ? 'flex' : 'hidden'} flex-col w-[360px] sm:w-[400px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-6rem)] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-200">
          
          <!-- Chatbot Header -->
          <div class="px-5 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between shadow-sm">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-lg shadow-inner">
                🤖
              </div>
              <div>
                <div class="flex items-center space-x-1.5">
                  <h3 class="font-bold text-sm leading-tight text-white">Queueless Guide</h3>
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <p class="text-[11px] text-blue-100">Smart Customer Support • Live 24/7</p>
              </div>
            </div>

            <div class="flex items-center space-x-1">
              <button 
                id="chatbot-reset-btn"
                title="Restart conversation"
                class="p-1.5 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer text-xs">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              </button>
              <button 
                id="chatbot-close-btn"
                title="Close assistant"
                class="p-1.5 rounded-xl hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <!-- Message History -->
          <div id="chatbot-messages" class="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60 text-xs">
            ${this.renderMessagesHtml()}
          </div>

          <!-- Quick Suggestion Chips Carousel -->
          <div id="chatbot-chips-bar" class="px-3 py-2 bg-white border-t border-slate-100 flex items-center space-x-1.5 overflow-x-auto no-scrollbar text-[11px]">
            <button onclick="window.QueuelessChatbot.askQuestion('What is my current token status?')" class="whitespace-nowrap px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium border border-blue-200 transition-colors cursor-pointer">
              🎫 Check Token
            </button>
            <button onclick="window.QueuelessChatbot.askQuestion('How do I join a virtual queue?')" class="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer">
              📝 How to Join
            </button>
            <button onclick="window.QueuelessChatbot.askQuestion('Which services are currently open?')" class="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer">
              🏢 Open Services
            </button>
            <button onclick="window.QueuelessChatbot.askQuestion('How does AI calculate waiting time?')" class="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer">
              ⏱️ AI Wait Time
            </button>
          </div>

          <!-- Chat Input -->
          <form id="chatbot-form" onsubmit="window.QueuelessChatbot.handleFormSubmit(event)" class="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input 
              id="chatbot-input"
              type="text"
              placeholder="Ask a question (e.g. 'What is my token?')..."
              autocomplete="off"
              class="flex-1 px-3.5 py-2.5 text-xs bg-slate-100 focus:bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
            <button 
              type="submit"
              class="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer flex-shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          </form>

        </div>
      `;
    }

    renderMessagesHtml() {
      return this.messages.map(msg => {
        if (msg.sender === 'user') {
          return `
            <div class="flex justify-end">
              <div class="max-w-[80%] bg-blue-600 text-white p-3 rounded-2xl rounded-tr-sm shadow-sm space-y-1">
                <p class="leading-relaxed">${escapeHtml(msg.text)}</p>
                <div class="text-[10px] text-blue-200 text-right">${escapeHtml(msg.time)}</div>
              </div>
            </div>
          `;
        }

        return `
          <div class="flex items-start space-x-2">
            <div class="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs flex-shrink-0 shadow-xs">
              🤖
            </div>
            <div class="max-w-[85%] bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-sm shadow-sm space-y-2 text-slate-800">
              <div class="leading-relaxed text-xs space-y-1">
                ${msg.text}
              </div>
              ${msg.chips && msg.chips.length > 0 ? `
                <div class="pt-2 flex flex-wrap gap-1.5 border-t border-slate-100">
                  ${msg.chips.map(chip => `
                    <button 
                      type="button" 
                      onclick="window.QueuelessChatbot.askQuestion('${escapeHtml(chip.query)}')"
                      class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold border border-blue-200 transition-colors cursor-pointer text-left">
                      ${escapeHtml(chip.label)}
                    </button>
                  `).join('')}
                </div>
              ` : ''}
              <div class="text-[10px] text-slate-400 text-right pt-0.5">${escapeHtml(msg.time)}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    bindEvents() {
      const toggleBtn = document.getElementById('chatbot-toggle-btn');
      const closeBtn = document.getElementById('chatbot-close-btn');
      const resetBtn = document.getElementById('chatbot-reset-btn');

      if (toggleBtn) {
        toggleBtn.onclick = () => this.toggleChat(true);
      }
      if (closeBtn) {
        closeBtn.onclick = () => this.toggleChat(false);
      }
      if (resetBtn) {
        resetBtn.onclick = () => this.resetChat();
      }
    }

    toggleChat(open) {
      this.isOpen = open !== undefined ? open : !this.isOpen;
      const launcher = document.getElementById('chatbot-launcher');
      const win = document.getElementById('chatbot-window');
      
      if (launcher && win) {
        if (this.isOpen) {
          launcher.classList.add('hidden');
          launcher.classList.remove('flex');
          win.classList.remove('hidden');
          win.classList.add('flex');
          setTimeout(() => {
            const input = document.getElementById('chatbot-input');
            if (input) input.focus();
            this.scrollToBottom();
          }, 100);
        } else {
          launcher.classList.remove('hidden');
          launcher.classList.add('flex');
          win.classList.add('hidden');
          win.classList.remove('flex');
        }
      }
    }

    resetChat() {
      this.messages = [];
      this.messages.push({
        sender: 'bot',
        text: '🔄 Chat restarted! How can I assist you with your virtual queue today?',
        time: this.formatTime(new Date()),
        chips: [
          { label: '🎫 Check My Token', query: 'What is my current token status?' },
          { label: '📝 How to Join?', query: 'How do I join a virtual queue?' },
          { label: '🏢 Available Services', query: 'Which services are currently open?' }
        ]
      });
      this.updateMessagesContainer();
    }

    scrollToBottom() {
      const msgs = document.getElementById('chatbot-messages');
      if (msgs) {
        msgs.scrollTop = msgs.scrollHeight;
      }
    }

    updateMessagesContainer() {
      const msgs = document.getElementById('chatbot-messages');
      if (msgs) {
        msgs.innerHTML = this.renderMessagesHtml();
        this.scrollToBottom();
      }
    }

    handleFormSubmit(e) {
      e.preventDefault();
      const input = document.getElementById('chatbot-input');
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;

      this.askQuestion(text);
      input.value = '';
    }

    askQuestion(query) {
      if (!this.isOpen) {
        this.toggleChat(true);
      }

      // Add user message
      this.messages.push({
        sender: 'user',
        text: query,
        time: this.formatTime(new Date())
      });
      this.updateMessagesContainer();

      // Show typing indicator then bot answer
      setTimeout(() => {
        const reply = this.generateResponse(query);
        this.messages.push({
          sender: 'bot',
          text: reply.text,
          time: this.formatTime(new Date()),
          chips: reply.chips || []
        });
        this.updateMessagesContainer();

        if (window.soundManager && window.soundManager.playNotification) {
          window.soundManager.playNotification();
        }
      }, 400);
    }

    generateResponse(rawQuery) {
      const q = rawQuery.toLowerCase();
      const store = window.store;
      const activeTicket = store ? store.getActiveQueue() : null;
      const services = window.QueuelessData ? window.QueuelessData.SERVICES : [];

      // 0. Healthcare Emergency SOS
      if (q.includes('emergency') || q.includes('sos') || q.includes('medical') || q.includes('doctor') || q.includes('ambulance') || q.includes('heart') || q.includes('pain') || q.includes('collapse') || q.includes('bleeding')) {
        return {
          text: `
            <div class="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-400 space-y-2 text-rose-900">
              <div class="flex items-center space-x-2">
                <span class="text-xl">🚨</span>
                <strong class="text-sm font-black text-rose-700">Immediate Healthcare Emergency Assistance</strong>
              </div>
              <p class="text-xs leading-relaxed text-slate-700">
                If you or a patient near you needs emergency medical care, tap below to transmit your <strong>live GPS location</strong>, trigger medical team response, and notify family guardians.
              </p>
              <div class="pt-1">
                <button 
                  onclick="window.QueuelessModals.openEmergencyModal()" 
                  class="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs shadow-md uppercase tracking-wider cursor-pointer emergency-btn-pulse">
                  🚨 Trigger Emergency SOS Now
                </button>
              </div>
            </div>
          `,
          chips: [
            { label: '📍 View Emergency Hub', query: 'Take me to the emergency page' },
            { label: '🎫 Check My Token', query: 'What is my current token status?' }
          ]
        };
      }

      // 1. Token / Queue Status check
      if (q.includes('my token') || q.includes('status') || q.includes('where am i') || q.includes('my position') || q.includes('turn') || q.includes('ticket')) {
        if (activeTicket) {
          const tracking = store.getTrackingDetails(activeTicket.id);
          const peopleAhead = tracking ? tracking.peopleAhead : Math.max(0, activeTicket.position - 1);
          const waitMins = activeTicket.predictedWaitMins || (tracking ? tracking.estimatedWaitMinutes : 5);

          return {
            text: `
              <div class="space-y-2">
                <div class="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                  <div class="text-[11px] text-blue-600 font-bold uppercase tracking-wider">Your Active Pass</div>
                  <div class="text-2xl font-black text-blue-700 font-mono my-0.5">${escapeHtml(activeTicket.tokenNumber)}</div>
                  <div class="text-xs text-slate-700 font-semibold">${escapeHtml(activeTicket.serviceName)}</div>
                </div>
                <div class="space-y-1 text-xs">
                  <div>• <strong>Current Status:</strong> <span class="text-emerald-700 font-bold">${escapeHtml(activeTicket.status)}</span></div>
                  <div>• <strong>Queue Position:</strong> #${activeTicket.position} in line (${peopleAhead} person ahead)</div>
                  <div>• <strong>Estimated AI Wait:</strong> ~${waitMins} mins</div>
                  <div>• <strong>Assigned Counter:</strong> ${escapeHtml(activeTicket.counter)}</div>
                  ${tracking && tracking.nowServingToken ? `<div>• <strong>Now Serving at Counter:</strong> <span class="font-mono font-bold text-indigo-700">${escapeHtml(tracking.nowServingToken)}</span></div>` : ''}
                </div>
                <div class="pt-1">
                  <a href="#token" class="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs">
                    <span>View Digital Pass</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            `,
            chips: [
              { label: '📊 Live Queue Tracker', query: 'Show me the live queue tracker' },
              { label: '🚪 How do I cancel/leave?', query: 'How can I leave or cancel my token?' }
            ]
          };
        } else {
          return {
            text: `
              <div class="space-y-1.5">
                <p>You currently <strong>do not have an active queue token</strong>.</p>
                <p class="text-slate-600">To join, simply choose any open service on our homepage, enter your <strong>Name, Email, and Phone Number</strong>, and you will receive your unique token pass immediately!</p>
                <div class="pt-1.5">
                  <a href="#services" class="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs">
                    <span>Browse Open Services</span>
                    <span>→</span>
                  </a>
                </div>
              </div>
            `,
            chips: [
              { label: '📝 How do I join a queue?', query: 'How do I join a virtual queue?' },
              { label: '🏢 What services are open?', query: 'Which services are currently open?' }
            ]
          };
        }
      }

      // 2. How to Join Virtual Queue
      if (q.includes('how to join') || q.includes('how do i join') || q.includes('join queue') || q.includes('get token') || q.includes('register') || q.includes('start')) {
        return {
          text: `
            <div class="space-y-2">
              <strong class="text-blue-700 font-bold block">How to Join a Virtual Queue:</strong>
              <ol class="list-decimal list-inside space-y-1 text-slate-700">
                <li><strong>View Available Services</strong> on the homepage.</li>
                <li>Click the blue <strong>"Join Virtual Queue"</strong> button on your desired desk.</li>
                <li>Fill in the 3 basic fields: <strong>Full Name, Email Address, and Phone Number</strong>.</li>
                <li>Receive your guaranteed <strong>Unique Token Number</strong> (e.g. HOPD-105) instantly!</li>
              </ol>
              <p class="text-[11px] text-slate-500">You don't need to stand in physical lines. Track your spot from your phone or laptop until called!</p>
            </div>
          `,
          chips: [
            { label: '🏥 Join Hospital OPD', query: 'Tell me about Hospital OPD queue' },
            { label: '🏦 Join Bank Counter', query: 'Tell me about Bank Counter queue' },
            { label: '🛂 Join Passport Office', query: 'Tell me about Passport Office queue' }
          ]
        };
      }

      // 3. Available Services check
      if (q.includes('service') || q.includes('open') || q.includes('available') || q.includes('desk') || q.includes('departments')) {
        const queues = store ? store.queues : [];
        const itemsHtml = services.map(srv => {
          const waiting = queues.filter(q => q.serviceId === srv.id && q.status === 'Waiting').length;
          return `
            <div class="flex items-center justify-between p-2 rounded-xl bg-slate-100/70 border border-slate-200">
              <div>
                <span class="font-bold text-slate-900">${escapeHtml(srv.name)}</span>
                <span class="font-mono text-[10px] text-blue-600 ml-1">(${escapeHtml(srv.prefix)})</span>
                <div class="text-[10px] text-slate-500">${escapeHtml(srv.counters)} • ~${srv.avgServiceTimeMinutes}m avg</div>
              </div>
              <button 
                onclick="window.router.openJoinModal('${srv.id}')"
                class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xs cursor-pointer">
                Join (${waiting})
              </button>
            </div>
          `;
        }).join('');

        return {
          text: `
            <div class="space-y-2">
              <strong class="text-slate-900">Current Available Service Desks:</strong>
              <div class="space-y-1.5">${itemsHtml}</div>
              <p class="text-[10px] text-slate-500 mt-1">Tap "Join" on any desk above to enter immediately.</p>
            </div>
          `,
          chips: [
            { label: '⏱️ How is wait time calculated?', query: 'How does AI calculate waiting time?' },
            { label: '🎫 Check My Token', query: 'What is my current token status?' }
          ]
        };
      }

      // 4. Waiting Time & AI Prediction
      if (q.includes('wait') || q.includes('time') || q.includes('ai') || q.includes('prediction') || q.includes('calculate') || q.includes('long')) {
        return {
          text: `
            <div class="space-y-2">
              <strong class="text-indigo-700 font-bold block">🧠 How Your Wait Time is Predicted:</strong>
              <p class="text-slate-700">Our backend Deep Learning model computes your wait time based on <strong>7 real-time factors</strong>:</p>
              <ul class="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                <li>Exact number of people ahead of you in line</li>
                <li>Number of active serving counters (e.g. 3 counters)</li>
                <li>Average historical consultation speed for that desk</li>
                <li>Counter availability & staff throughput</li>
                <li>Customer priority tiers (Elderly / Disabled, Urgent, Normal)</li>
                <li>Rush-hour congestion patterns</li>
              </ul>
              <p class="text-[11px] text-emerald-700 font-semibold">Predictions continuously calibrate in real-time as counters conclude consultations!</p>
            </div>
          `,
          chips: [
            { label: '🎫 Check My Estimated Time', query: 'What is my current token status?' },
            { label: '🏢 View All Services', query: 'Which services are currently open?' }
          ]
        };
      }

      // 5. When called / turn arrival
      if (q.includes('called') || q.includes('my turn') || q.includes('alert') || q.includes('sound') || q.includes('bell') || q.includes('where to go')) {
        return {
          text: `
            <div class="space-y-1.5">
              <strong class="text-amber-800 font-bold block">🔔 What to Do When Your Turn is Called:</strong>
              <p class="text-slate-700">1. Your screen will display a highlighted banner with an <strong>audible alert chime</strong>.</p>
              <p class="text-slate-700">2. It will tell you the exact counter number (e.g., <strong>Counter 1</strong>).</p>
              <p class="text-slate-700">3. Walk to that counter and show your digital token number on your screen.</p>
            </div>
          `,
          chips: [
            { label: '🎫 Check My Token Status', query: 'What is my current token status?' }
          ]
        };
      }

      // 6. Cancel or Leave Virtual Queue
      if (q.includes('leave') || q.includes('cancel') || q.includes('exit') || q.includes('release') || q.includes('remove')) {
        return {
          text: `
            <div class="space-y-1.5">
              <strong class="text-rose-700 font-bold block">Leaving or Cancelling a Queue:</strong>
              <p class="text-slate-700">If you can no longer attend or your issue was resolved:</p>
              <p class="text-slate-700">• Go to your <a href="#token" class="text-blue-600 font-bold underline">Digital Pass</a> or <a href="#tracking" class="text-blue-600 font-bold underline">Live Tracker</a>.</p>
              <p class="text-slate-700">• Click the red <strong>"Leave Virtual Queue"</strong> button.</p>
              <p class="text-slate-700">• Confirm your reason. Your spot will be released so the next person in line is served sooner.</p>
            </div>
          `,
          chips: [
            { label: '🎫 View My Digital Pass', query: 'What is my current token status?' }
          ]
        };
      }

      // 7. General greetings
      if (q.includes('hi') || q.includes('hello') || q.includes('hey') || q.includes('good morning') || q.includes('good afternoon')) {
        const user = store ? store.currentUser : null;
        return {
          text: `
            <p>Hello${user && user.name ? ` <strong>${escapeHtml(user.name)}</strong>` : ''}! 😊 How can I help you today? Ask me about your token, open services, or waiting times!</p>
          `,
          chips: [
            { label: '🎫 Check My Token', query: 'What is my current token status?' },
            { label: '📝 How to Join Queue', query: 'How do I join a virtual queue?' },
            { label: '🏢 View Available Services', query: 'Which services are currently open?' }
          ]
        };
      }

      // Default fallback
      return {
        text: `
          <div class="space-y-1.5">
            <p>I'm here to guide you with the Queueless Virtual Waiting System! You can ask me:</p>
            <ul class="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
              <li>"What is my current token status?"</li>
              <li>"How do I join a queue?"</li>
              <li>"Which services are open right now?"</li>
              <li>"How is AI wait time calculated?"</li>
              <li>"How do I cancel my token?"</li>
            </ul>
          </div>
        `,
        chips: [
          { label: '🎫 Check My Token', query: 'What is my current token status?' },
          { label: '📝 How to Join?', query: 'How do I join a virtual queue?' },
          { label: '🏢 Available Services', query: 'Which services are currently open?' }
        ]
      };
    }
  }

  // Initialize and attach to window
  window.addEventListener('DOMContentLoaded', () => {
    window.QueuelessChatbot = new QueuelessChatbot();
  });

  // Also initialize if DOM is already ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    window.QueuelessChatbot = new QueuelessChatbot();
  }
})();
