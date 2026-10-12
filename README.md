# 🎓 College Event Management System (EMS)

A full-stack, enterprise-grade **College Event Management System (EMS)** designed for universities, colleges, and student organizations. This platform streamlines event discovery, team registrations, online payments, coordinator workflows, status tracking, and automated email notifications across three decoupled sub-applications.

---

## 📑 Table of Contents

- [System Architecture](#-system-architecture)
- [Sub-Applications Overview](#-sub-applications-overview)
  - [1. EMS Backend (API & Worker Engine)](#1-ems-backend-api--worker-engine)
  - [2. EMS Public (Student & Participant Portal)](#2-ems-public-student--participant-portal)
  - [3. EMS Management (Admin & Coordinator Portal)](#3-ems-management-admin--coordinator-portal)
- [Database Schema (PostgreSQL + Prisma)](#-database-schema-postgresql--prisma)
- [End-to-End Workflow & How It Works](#-end-to-end-workflow--how-it-works)
  - [1. Event Lifecycle Workflow](#1-event-lifecycle-workflow)
  - [2. Student Registration & Payment Workflow](#2-student-registration--payment-workflow)
  - [3. Coordinator Review & Verification Workflow](#3-coordinator-review--verification-workflow)
  - [4. Asynchronous Email Queue Architecture](#4-asynchronous-email-queue-architecture)
  - [5. Status Tracking & Pass Generation](#5-status-tracking--pass-generation)
- [API Reference](#-api-reference)
- [Directory Structure](#-directory-structure)
- [Prerequisites & Installation](#-prerequisites--installation)
- [Environment Configuration](#-environment-configuration)
- [Running the System Locally](#-running-the-system-locally)

---

## 🏛 System Architecture

The project follows a modern decoupled client-server architecture with a centralized REST API, asynchronous background queue processing, and two specialized React frontends:

```
                                      ┌──────────────────────────────────────────────┐
                                      │         PostgreSQL Database (Prisma)         │
                                      └──────────────────────┬───────────────────────┘
                                                             │
                                                             ▼
┌───────────────────────────┐      REST API        ┌───────────────────────────────────┐      REST API        ┌───────────────────────────┐
│        EMS Public         │ ◄──────────────────► │            EMS Backend            │ ◄──────────────────► │      EMS Management       │
│  (Student Portal / Vite)  │  (/api/public/*)     │  Express.js API Server (:5000)    │  (JWT Authenticated) │  (Admin & Coordinator)    │
└───────────────────────────┘                      └─────────┬───────────────────┬─────┘                      └───────────────────────────┘
                                                             │                   │
                                                    BullMQ   ▼                   ▼  Media Uploads
                                            ┌─────────────────────┐   ┌──────────────────────┐
                                            │ Redis Queue Engine  │   │ Cloudinary / Local   │
                                            │  (Memurai / Redis)  │   │     Storage          │
                                            └──────────┬──────────┘   └──────────────────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────────┐
                                            │ BullMQ Email Worker │
                                            │ (Nodemailer / SMTP) │
                                            └─────────────────────┘
```

---

## 📦 Sub-Applications Overview

### 1. EMS Backend (API & Worker Engine)
- **Tech Stack**: Node.js, Express.js (ES Modules), Prisma ORM, PostgreSQL, BullMQ, Redis (ioredis), Nodemailer, Firebase Admin SDK, JWT.
- **Port**: `http://localhost:5000`
- **Core Responsibilities**:
  - Exposes RESTful endpoints for public event browsing, registration submissions, and status checks.
  - Secures administrative routes using standard JWT (`Bearer`) authorization middleware.
  - Manages asynchronous background email delivery using **BullMQ** and **Redis**, featuring automatic fallback to direct SMTP if Redis is offline.
  - Serves an embedded **Bull-Board UI** dashboard at `/admin/queues` for inspecting queue jobs, metrics, and failures.
  - Manages media uploads with signed **Cloudinary** integration and local static filesystem fallback (`/uploads`).

### 2. EMS Public (Student & Participant Portal)
- **Tech Stack**: React 19, Vite, Tailwind CSS, Lucide Icons, jsPDF.
- **Port**: `http://localhost:5173` (or Vite default)
- **Core Responsibilities**:
  - **Live Event Catalog**: Real-time debounce search, filtering by Department, Event Scope (National, State, College), and Event Type (Competition, Workshop, Hackathon).
  - **Dynamic Viewport Pagination**: Loads events dynamically from the database in 10-item chunks.
  - **Event Details Modal**: Rich display of schedules, descriptions, rules, fees, coordinator contacts, and venue.
  - **Multi-Step Registration Wizard**:
    - Step 1: Team leader details (name, email, phone, department, register number).
    - Step 2: Dynamic team member list (up to `max_team_size`).
    - Step 3: Dynamic UPI QR code generator, payment screenshot upload, and transaction UTR.
    - Generates unique registration IDs (`REG-YYYY-XXXXXX`).
  - **Registration Status Tracker**: Students can query their status via Registration ID, email, or phone.
  - **Event Pass / Hall Ticket PDF**: Instant client-side branded PDF pass generation using `jspdf`.

### 3. EMS Management (Admin & Coordinator Portal)
- **Tech Stack**: React 19, Vite, Tailwind CSS, Recharts, jsPDF + AutoTable, SheetJS (xlsx), Lucide Icons, Firebase Auth.
- **Port**: `http://localhost:5174` (or configured management port)
- **Core Responsibilities**:
  - **Role-Based Access Control (RBAC)**:
    - **Admin**: Complete system control, coordinator management, event approvals, system-wide analytics, report exports.
    - **Coordinator**: Management limited to assigned departmental events and registrations.
  - **Visual Analytics Dashboard**: Key metric cards (Total Events, Active Registrations, Coordinators, Revenue) and visual graphs powered by Recharts.
  - **Event Management**: Create, edit, draft, publish, or delete events. Set venue, dates, fees, UPI IDs, QR codes, and multiple coordinators.
  - **Registration Review & Moderation**: Tabbed interface for Pending, Approved, and Rejected registrations. View submitted payment receipts, approve registrations, or reject with custom feedback.
  - **Coordinator Management** (Admin Only): Create, activate, deactivate, and manage coordinator credentials.
  - **Reports & Export Center**: Export filtered registration and event lists into Excel spreadsheets (`.xlsx`) or print-ready PDF reports (`jspdf-autotable`).

---

## 🗄 Database Schema (PostgreSQL + Prisma)

The relational schema is configured in `EMS Backend/prisma/schema.prisma`:

### Core Models:
1. **`users`**:
   - Fields: `id`, `firebase_uid`, `full_name`, `email` (PK), `phone`, `role` (`admin` | `coordinator` | `student`), `status` (`active` | `inactive`), `created_at`, `updated_at`.
2. **`events`**:
   - Fields: `id` (PK), `title`, `description`, `banner_url`, `event_date`, `start_time`, `end_time`, `registration_deadline`, `venue`, `registration_fee`, `max_team_size`, `whatsapp_group_link`, `upi_id`, `account_holder_name`, `upi_qr_url`, `status` (`draft` | `published` | `archived`), `event_scope`, `event_type`, `department`, `registration_required`, `created_by`, `created_at`, `updated_at`.
3. **`event_organizers`**:
   - Fields: `id` (PK), `event_id` (FK -> `events.id` with `onDelete: Cascade`), `name`, `department`, `email`, `phone`, `register_number`.
4. **`registrations`**:
   - Fields: `id` (PK), `event_id` (FK -> `events.id` with `onDelete: Cascade`), `team_leader_name`, `team_leader_email`, `team_leader_phone`, `department`, `payment_screenshot_url`, `status` (`pending` | `approved` | `rejected`), `rejection_reason`, `reviewed_by`, `created_at`, `updated_at`.
5. **`registration_members`**:
   - Fields: `id` (PK), `registration_id` (FK -> `registrations.id` with `onDelete: Cascade`), `name`, `email`, `phone`, `department`.

---

## 🔄 End-to-End Workflow & How It Works

### 1. Event Lifecycle Workflow
```
[Admin / Coordinator]
        │
        ▼ Create Event Form
 ├── Basic Info (Title, Description, Banner)
 ├── Schedule & Venue (Date, Timings, Deadline, Location)
 ├── Rules & Scope (Department, National/State, Max Team Size)
 ├── Pricing & Payment (Free/Paid, UPI ID, Custom QR Code)
 └── Organizers (Primary & Student Coordinators)
        │
        ▼ Save as 'Draft' or 'Published'
 [Stored in PostgreSQL via Prisma]
        │
        ▼ Published events become visible on
 [EMS Public Events Section]
```

### 2. Student Registration & Payment Workflow
```
[Student on EMS Public]
        │
        ▼ Browse & Click "Register Now"
 ├── Modal Step 1: Enters Team Leader information
 ├── Modal Step 2: Enters Team Members (if team event)
 ├── Modal Step 3: Scans dynamic UPI QR Code, pays fee, uploads screenshot
        │
        ▼ Submits Registration
 [POST /api/public/registrations]
        │
        ├── Record saved in PostgreSQL with status 'pending'
        ├── Team members saved in 'registration_members' table
        └── Automated Confirmation Job queued to BullMQ
```

### 3. Coordinator Review & Verification Workflow
```
[Coordinator Logs in to EMS Management]
        │
        ▼ Navigates to Registration Management
 ├── Views pending student applications
 ├── Inspects payment screenshot & transaction details
 ├── Action: Click [Approve] OR [Reject]
        │
        ▼
   ┌────┴────────────────────────────────────────┐
   ▼                                             ▼
[APPROVE]                                     [REJECT]
 • Status updated to 'approved'                • Status updated to 'rejected'
 • Email queued with Event Pass details        • Email queued with rejection reason
 • WhatsApp link unlocked for student          • Student can see reason on status page
```

### 4. Asynchronous Email Queue Architecture
```
[Trigger: Registration Submitted / Approved / Rejected]
        │
        ▼ addEmailJob(payload)
   ┌────┴───────────────────────────────────────┐
   │ Check Redis Connection                     │
   ├──────────────────────┬─────────────────────┤
   │ [Redis Online]       │ [Redis Offline]     │
   ▼                      ▼                     │
BullMQ Queue Engine       Direct Fallback Call  │
 ('email-queue')          via email.service.js  │
   │                      │                     │
   ▼                      ▼                     │
BullMQ Worker Process     Nodemailer SMTP       │
 (Concurrency: 5,         (smtp.gmail.com)      │
  Exponential Backoff)    │                     │
   │                      │                     │
   └──────────┬───────────┘                     │
              ▼                                 │
   Delivers HTML Email to Student ✉️             │
```

### 5. Status Tracking & Pass Generation
- Any student can open the **Check Status** tab on the public portal.
- Inputting the **Registration ID**, **Leader Email**, or **Phone Number** queries `GET /api/public/status/:query`.
- Displays real-time approval state, rejection remarks, assigned coordinators, and the official WhatsApp group link.
- If **Approved**, students can generate and download a stylized **Event Pass / Hall Ticket PDF** directly in their browser.

---

## 📡 API Reference

### Public Routes (`/api/public/*`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/public/events` | List published events with query search, department, scope, and pagination |
| `GET` | `/api/public/events/:id` | Get full details of a specific event |
| `POST` | `/api/public/registrations` | Submit student registration and trigger confirmation email |
| `GET` | `/api/public/status/:query` | Look up registration status by ID, email, or phone |
| `POST` | `/api/public/upload` | Upload image (Cloudinary signed upload with local disk fallback) |

### Authentication Routes (`/api/auth/*`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Exchange credentials / Firebase UID for JWT session token |
| `POST` | `/api/auth/check-user` | Check if an email exists in Firebase Auth or PostgreSQL database |

### Protected Management Routes (Requires `Bearer <JWT_TOKEN>`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/events` | Admin, Coordinator | List all events (including drafts & archived) |
| `POST` | `/api/events` | Admin, Coordinator | Create a new event |
| `PUT` | `/api/events/:id` | Admin, Coordinator | Update existing event |
| `DELETE`| `/api/events/:id` | Admin, Coordinator | Cascade delete event and related organizers/registrations |
| `GET` | `/api/registrations` | Admin, Coordinator | Paginated registrations list with search & filter |
| `PUT` | `/api/registrations/:id/status`| Admin, Coordinator | Update status (`approved`/`rejected`) and trigger email |
| `GET` | `/api/users` | Admin Only | List coordinators and users |
| `POST` | `/api/users` | Admin Only | Create new coordinator user account |
| `PUT` | `/api/users/:id` | Admin Only | Update coordinator profile or role |
| `DELETE`| `/api/users/:id` | Admin Only | Delete user account |
| `GET` | `/admin/queues` | Admin Only | Web visual dashboard for BullMQ email queue monitoring |

---

## 📂 Directory Structure

```
college EMS/
├── README.md                      # Complete system documentation (this file)
│
├── EMS Backend/                   # Central Express.js API & Queue Service
│   ├── config/
│   │   └── firebase.js            # Firebase Admin SDK initialization
│   ├── lib/
│   │   ├── prisma.js              # Prisma Client singleton
│   │   └── redis.js               # ioredis connection configuration
│   ├── middleware/
│   │   └── auth.middleware.js     # Global JWT verification middleware
│   ├── prisma/
│   │   └── schema.prisma          # PostgreSQL schema definition
│   ├── queues/
│   │   └── email.queue.js         # BullMQ email queue setup & direct fallback
│   ├── routes/
│   │   ├── auth.routes.js         # Authentication & login endpoints
│   │   ├── events.routes.js       # Protected event CRUD endpoints
│   │   ├── public.routes.js       # Public events, registration, & lookup
│   │   ├── registrations.routes.js# Moderation & review endpoints
│   │   └── users.routes.js        # Coordinator management endpoints (Admin)
│   ├── services/
│   │   └── email.service.js       # Nodemailer SMTP transporter
│   ├── workers/
│   │   └── email.worker.js        # BullMQ background email worker
│   ├── uploads/                   # Local media storage fallback directory
│   ├── server.js                  # Express application entrypoint
│   └── package.json
│
├── EMS Public/                    # Student Portal (Vite + React 19)
│   ├── src/
│   │   ├── components/
│   │   │   ├── EventDetailModal.jsx
│   │   │   ├── EventsSection.jsx  # Paginated card grid with live filters
│   │   │   ├── Header.jsx & Footer.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── RegistrationModal.jsx # Multi-step registration wizard
│   │   │   └── StatusCheckModal.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── EventsPage.jsx
│   │   │   ├── StatusCheckPage.jsx
│   │   │   ├── AboutPage.jsx
│   │   │   └── ContactPage.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── EMS Management/                # Admin & Coordinator Portal (Vite + React 19)
    ├── src/
    │   ├── context/
    │   │   ├── AuthContext.jsx    # Firebase auth state & JWT persistence
    │   │   └── DataContext.jsx    # Real-time state management
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── AdminDashboard.jsx # High-level KPI metrics & charts
    │   │   ├── CoordinatorDashboard.jsx
    │   │   ├── EventManagement.jsx # Comprehensive event builder
    │   │   ├── RegistrationManagement.jsx # Approvals & payment verification
    │   │   ├── CoordinatorManagement.jsx  # User management (Admin)
    │   │   └── ReportsPage.jsx    # PDF and Excel report exports
    │   ├── components/layout/     # Sidebar and mobile navigation
    │   ├── lib/                   # Export utilities (pdfExport, excelExport)
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## ⚡ Prerequisites & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: Running locally or via a cloud instance (e.g., Supabase / Neon)
- **Redis / Memurai**: Running on `127.0.0.1:6379` (Optional; system will fall back to direct email sending if offline)

### Step 1: Clone & Install Dependencies

```bash
# 1. Install Backend Dependencies
cd "EMS Backend"
npm install

# 2. Install Management Portal Dependencies
cd "../EMS Management"
npm install

# 3. Install Public Portal Dependencies
cd "../EMS Public"
npm install
```

### Step 2: Database Initialization (Prisma)

```bash
cd "EMS Backend"
# Generate Prisma Client
npm run db:generate

# Push schema directly to your PostgreSQL database
npm run db:push
```

---

## ⚙️ Environment Configuration

### Backend: `EMS Backend/.env`
```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/college_ems?schema=public"
JWT_SECRET="your_super_secret_jwt_key_2026"
CORS_ORIGIN="http://localhost:3000,http://localhost:5173,http://localhost:3001,http://localhost:5174"

# Redis Queue Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Nodemailer / SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Management Frontend: `EMS Management/.env`
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🚀 Running the System Locally

Run each service in a separate terminal:

### Terminal 1: Backend API Server
```bash
cd "EMS Backend"
npm run dev
# Server will start on http://localhost:5000
# BullMQ Dashboard available at http://localhost:5000/admin/queues
```

### Terminal 2: Management Portal
```bash
cd "EMS Management"
npm run dev
# Portal will start on http://localhost:5174 (or configured Vite port)
```

### Terminal 3: Public Student Portal
```bash
cd "EMS Public"
npm run dev
# Portal will start on http://localhost:5173 (or configured Vite port)
```

---

## 🔒 Security & Best Practices

- **Row & Cascading Integrity**: Deleting an event safely cleans up corresponding organizers, registrations, and member records using Prisma cascade constraints.
- **Fail-Safe Queue Processing**: If Redis server encounters downtime, the backend automatically transitions to direct synchronous SMTP delivery, preventing registration loss or delayed confirmations.
- **Sanitized Uploads**: Image uploads utilize verified Base64 encoding with Cloudinary CDN distribution and a local fallback folder.
- **Role Verification**: Middleware validates both signature and user role on every management endpoint, preventing unauthorized access.
