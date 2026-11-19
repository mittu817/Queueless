# Queueless – Smart Virtual Queue & Waiting-Time Management System
## With Native SQLite Database & DB Browser for SQLite Connectivity

Queueless is a full-stack, responsive web application designed to eliminate physical waiting lines across healthcare, banking, civic offices, and academic institutions. Customers can join virtual queues remotely, receive digital boarding-pass tokens with QR codes, track live queue positions, view estimated waiting times, and receive notifications. Administrators have an operations console to manage queues, call next customers, log walk-ins, pause/resume queues, and view performance reports with interactive charts.

---

## 💾 SQLite Database & DB Browser for SQLite Connectivity

Queueless is backed by a native **SQLite3 database** stored at:
📂 **`queueless.db`** (inside the project root: `C:\Users\natte\OneDrive\Desktop\agile project\queueless.db`)

### How to Inspect with DB Browser for SQLite:
1. Download or open **[DB Browser for SQLite](https://sqlitebrowser.org)**.
2. Click **"Open Database"** (or press `Ctrl+O`).
3. Select `queueless.db` in this folder.
4. Click on the **"Browse Data"** tab to view live records in each table:
   - **`users`**: All registered customer and admin credentials (`id`, `name`, `email`, `phone`, `password`, `role`, `created_at`).
   - **`queues`**: Active and historical queue tickets (`id`, `token_number`, `service_id`, `customer_name`, `status`, `position`, `notes`, `joined_at`, `served_at`, `completed_at`).
   - **`services`**: Service desk configurations (`hospital-opd`, `bank-counter`, `passport-office`, `library-desk`) and pause statuses.
   - **`notifications`**: User event notifications with timestamps and read states.

### Sample SQL Queries to try in DB Browser:
```sql
-- View all registered accounts
SELECT id, name, email, phone, role, created_at FROM users;

-- View all active tickets currently waiting or being served
SELECT token_number, service_name, customer_name, status, counter, position 
FROM queues 
WHERE status IN ('Waiting', 'Being Served')
ORDER BY joined_at ASC;

-- View completed customer visit history
SELECT token_number, service_name, customer_name, status, joined_at, completed_at 
FROM queues 
WHERE status = 'Completed';
```

---

## 🚀 Quick Launch

### Run Server with SQLite API:
```bash
node server.js
```
Open in your browser:
👉 **`http://localhost:3001`** *(or `http://localhost:3000`)*

---

## 👥 Demo Personas & Pre-Seeded Accounts

The application includes pre-seeded demo accounts with one-click switcher buttons in the top banner:

| Persona | Role | Email | Password | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Turner** | `Customer` | `alex.turner@example.com` | `Password123!` | Has past history in banking, hospital, and library, plus active queue testing. |
| **Officer Sarah Jenkins** | `Administrator` | `admin@queueless.com` | `AdminPass123!` | Access to Admin Console, Manage Active Queues, Call Next, Walk-ins, and Analytics. |

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
