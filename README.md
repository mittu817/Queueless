# Queueless – Smart Virtual Queue & Waiting-Time Management System
## Built with Native Node.js, SQLite Database & Deep Learning AI Engine

Queueless is a full-stack, zero-external-dependency web application designed to eliminate physical waiting lines across healthcare, banking, civic offices, and academic institutions. Customers can join virtual queues remotely, receive digital boarding-pass tokens with QR codes, track live queue positions, view real-time AI-predicted waiting times, and receive notifications.

The system features:
- **Zero-Dependency Architecture**: Built using native Node.js (`node:http`, `node:sqlite`, `node:crypto`). No heavy external packages or complex setup needed.
- **Deep Learning AI Waiting-Time Prediction**: Multi-Layer Perceptron (MLP) neural network factoring in queue depth, active counters, service complexity, counter availability, and historical service data.
- **Healthcare Emergency & Safety Suite**: 1-tap SOS audio siren, live GPS location sharing, family SMS alerts, voice recognition, false alarm verification, and offline sync.
- **Staff & Admin Management Consoles**: Real-time counter operations (call next, recall, skip, transfer, no-show), service desk control, operating hours, holiday schedules, and audit logs.
- **Floating AI Assistant Chatbot**: Interactive customer guide for live token status lookup and assistance.

---

## 🚀 Quick Start (Running in 10 Seconds)

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **Git**

### Installation & Launch:
```bash
# 1. Clone the repository
git clone https://github.com/mittu817/Queueless.git

# 2. Navigate to project directory
cd Queueless

# 3. Start the server (no npm install required!)
node server.js
```

Open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 💾 SQLite Database & DB Browser Connectivity

Queueless is backed by an ACID-compliant native **SQLite3 database** stored at **`queueless.db`**.

### How to Inspect with DB Browser for SQLite:
1. Download **[DB Browser for SQLite](https://sqlitebrowser.org)**.
2. Open `queueless.db` from the project root.
3. Browse core tables:
   - **`queues`**: Digital tokens, live positions, service IDs, timestamps, and actual vs. predicted wait times.
   - **`services`**: Service desks (`hospital-opd`, `bank-counter`, `passport-office`, `library-desk`), active counters, and pause states.
   - **`counters`**: Counter allocations and active assigned staff officers.
   - **`emergency_incidents`**: SOS triage alerts, GPS coordinates, response times, and resolution notes.
   - **`users`**: Registered customer, staff, and admin accounts with salted password hashing.
   - **`activity_logs`**: Security and operational audit trail.

---

## 👥 Demo Personas & Pre-Seeded Accounts

The application includes one-click switcher buttons and pre-seeded accounts:

| Persona | Role | Email | Password | Access |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Turner** | `Customer` | `alex.turner@example.com` | `Password123!` | Take tokens, live tracking pass, emergency SOS |
| **Officer Miller** | `Staff` | `staff1@queueless.com` | `StaffPass123!` | Counter 1 Desk, Call Next, Recall, Complete, Transfer |
| **Officer Jenkins** | `Super Admin` | `admin@queueless.com` | `AdminPass123!` | Full Admin Console, Emergency Triage, Reports |

---

## 🏥 Healthcare Emergency & Safety Suite

| Feature | Description |
| :--- | :--- |
| **🚨 SOS Button** | 1-tap emergency dispatch with medical triage audio siren |
| **📍 Live Location Sharing** | Automatic GPS geolocation + hospital ward and bed selector |
| **👨‍👩‍👧 Emergency Contact Alerts** | Automatic SMS/dispatch alert triggered to registered guardian |
| **🎙️ Voice Emergency Input** | Web Speech Recognition for hands-free distress calls |
| **📷 QR Emergency Access** | Printable QR codes for waiting areas and bedside tables |
| **⏳ False Alarm Management** | Accidental alert cancellation window with dispute logs |
| **📊 Emergency Analytics** | Incident response times, resolution rates, and triage metrics |
| **♿ Accessibility Mode** | High-contrast visual mode, extra-large touch targets, and TTS readouts |
| **📡 Offline Emergency Sync** | Local buffer storage that retries and synchronizes when internet reconnects |

---

## 🎨 Enhanced Landing, Login & Sign-up Pages

1. **Modern Landing Page (`#home`):**
   - High-impact Hero with live KPI counters, service desk snapshots, and direct call-to-actions.
   - **Interactive SQLite & DB Browser Integration Card** detailing `queueless.db` file location, live table counts, and query instructions.
   - Live Service Desks Grid (Hospital OPD, Bank Counter, Passport Office, Library Desk) with real-time waiting counters and instant "Join Queue" actions.
   - "How It Works" 4-step visual journey.
   - Feature highlight cards (Digital passes with QR, intelligent waiting engine, multi-channel alerts).
2. **Dedicated Login Page (`#login`) [QLESS-7]:**
   - Split layout with branding/security highlights on the left and login form on the right.
   - Email & password authentication with show/hide password toggle.
   - 1-Click Demo Login Personas for immediate testing without typing.
   - Real-time client and SQLite database verification.
3. **Dedicated Sign-up Page (`#register`) [QLESS-6]:**
   - Full Name, Email, Phone Number, Password, and Confirmation.
   - **Dynamic Live Password Strength Meter** with color feedback (Weak, Fair, Strong) and rules checklist (min 6 chars, uppercase, digit, symbol).
   - Duplicate email validation directly checked against SQLite `users` table.
   - Instant redirect to Sign In upon completion.

---

## 📋 All 12 Jira Stories Across 4 Sprints

- **Sprint 1 (User Management):** `QLESS-6` (Registration), `QLESS-7` (Login), `QLESS-8` (Profile Management)
- **Sprint 2 (Queue Management):** `QLESS-9` (Join Virtual Queue), `QLESS-10` (Digital Token Pass), `QLESS-13` (Leave Queue)
- **Sprint 3 (Tracking & Alerts):** `QLESS-11` (Queue Position Tracking), `QLESS-12` (Estimated Waiting Time), `QLESS-14` (Notifications)
- **Sprint 4 (Admin & Reports):** `QLESS-15` (Queue History), `QLESS-16` (Manage Active Queues), `QLESS-17` (Analytics & Chart.js Reports)
