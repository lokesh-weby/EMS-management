# 🛠️ EMS Complete Setup & Configuration Guide

This step-by-step guide will walk you through configuring all external services required for the **College Event Management System (EMS)**:
- **PostgreSQL & Prisma** (Database)
- **Firebase Authentication & Admin SDK** (User Identity & Roles)
- **Memurai / Redis** (Background Task Queue with BullMQ)
- **SMTP / Nodemailer** (Transactional Emails)
- **Cloudinary** (Image & Payment Screenshot CDN Storage)

---

## 📋 Dependency & Service Matrix

| Service | Used In | Purpose | Mandatory? | Fallback Behavior |
| :--- | :--- | :--- | :---: | :--- |
| **PostgreSQL** | `EMS Backend` | Primary Database for events, users & registrations | **Yes** | Required for server startup |
| **Firebase Auth** | `EMS Management` | Admin / Coordinator login & password resets | **Yes** | Required for management portal access |
| **Firebase Admin** | `EMS Backend` | User verification & synchronization | **Recommended** | Falls back to database users if absent |
| **Memurai / Redis** | `EMS Backend` | BullMQ queue for async email processing | **Optional** | Automatically falls back to direct SMTP if offline |
| **Nodemailer / SMTP** | `EMS Backend` | Dispatches confirmation, approval & rejection emails | **Recommended** | Logs warning if unconfigured |
| **Cloudinary** | `EMS Backend` | Hosting event banners & student payment proofs | **Optional** | Automatically falls back to local disk storage (`uploads/`) |

---

## 1. 🗄️ PostgreSQL Database & Prisma Setup

The backend uses **Prisma ORM** connected to a PostgreSQL database. You can use a local PostgreSQL instance or a hosted cloud database (Supabase, Neon, Render, or Aiven).

### Step 1.1: Obtain your Database Connection URL
A typical PostgreSQL connection string looks like:
```env
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE_NAME>?schema=public"
```

Examples:
- **Local PostgreSQL**:
  ```env
  DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/college_ems?schema=public"
  ```
- **Supabase / Neon Cloud**:
  ```env
  DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres?schema=public"
  ```

### Step 1.2: Apply Schema to the Database
Run these commands from `EMS Backend`:
```powershell
cd "EMS Backend"

# Generate the Prisma client
npm run db:generate

# Push schema directly to PostgreSQL (creates tables & enums)
npm run db:push
```

### Step 1.3: Seed the Initial Admin Account
Run the seed script to create your primary administrator record in PostgreSQL:
```powershell
node seed_admin.js
```
*Output:* `✅ Admin user seeded successfully: lokesh0212004@gmail.com (Role: admin)`

---

## 2. 🔥 Firebase Authentication & Admin SDK Setup

Firebase handles password management, session verification, and identity security for coordinators and administrators.

### Step 2.1: Create a Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and enter a name (e.g., `college-ems`).
3. Disable Google Analytics (optional) and click **Create Project**.

### Step 2.2: Enable Email/Password Authentication
1. In the Firebase console left sidebar, navigate to **Build** > **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, select **Email/Password**.
4. Toggle **Enable** for Email/Password and click **Save**.
5. Go to the **Users** tab and click **Add User**:
   - Email: `lokesh0212004@gmail.com` (or your admin email)
   - Password: `<your-secure-password>`
   - Click **Add User**.
   - Copy the generated **User UID** for future reference.

### Step 2.3: Get Web Client Credentials (for `EMS Management`)
1. In Firebase Console, click the **Settings Cog (⚙️)** > **Project Settings**.
2. Scroll down to **Your apps** and click the **Web icon (</>)**.
3. Register the app (e.g., `EMS-Management-Web`).
4. Copy the `firebaseConfig` keys into `EMS Management/.env`:

```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"
```

### Step 2.4: Generate Firebase Admin Service Account (for `EMS Backend`)
1. In Firebase Console, go to **Project Settings** > **Service accounts** tab.
2. Ensure **Node.js** is selected and click **Generate new private key**.
3. A JSON file will download (e.g., `college-ems-firebase-adminsdk-xxxxx.json`).
4. **Choose ONE of these methods to install it in `EMS Backend`:**
   - **Method A (File)**: Rename the file to `serviceAccountKey.json` and place it directly into the `EMS Backend/` directory. *(Note: This file is already excluded in `.gitignore`)*.
   - **Method B (Environment Variable)**: Open the downloaded JSON file, copy its entire contents as a single line, and add it to `EMS Backend/.env`:
     ```env
     FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"..."}'
     ```

---

## 3. ⚡ Memurai / Redis Setup (BullMQ Queue)

**BullMQ** uses Redis for managing background email delivery, retries with exponential backoff, and concurrency. On Windows, **Memurai** is the recommended native Redis-compatible engine.

### Step 3.1: Install Memurai (Windows)
1. Download **Memurai Developer Edition** from [https://www.memurai.com](https://www.memurai.com) (free for development).
   - Alternatively, install via Chocolatey:
     ```powershell
     choco install memurai-developer
     ```
2. Run the installer with default settings (port `6379`).

> [!NOTE]
> If you are on **Linux**, **macOS**, or prefer **Docker**, run:
> ```bash
> docker run -d --name ems-redis -p 6379:6379 redis:alpine
> ```

### Step 3.2: Verify Memurai is Running
Open a PowerShell terminal and test the connection using the Memurai CLI:
```powershell
memurai-cli ping
```
*Expected response:*
```
PONG
```

If it is stopped, start the service with:
```powershell
net start memurai
```

### Step 3.3: Backend Redis Configuration
Add the connection parameters to `EMS Backend/.env`:
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Step 3.4: Visual Queue Dashboard (Bull-Board)
Once the backend server is running, you can monitor live queues, view active workers, and inspect job status directly in your browser:
🔗 **URL:** `http://localhost:5000/admin/queues`

> [!TIP]
> **Built-in Fail-Safe**: If Memurai/Redis is offline or not installed, the EMS Backend will log a notice and **automatically dispatch emails directly via Nodemailer** without failing or dropping requests!

---

## 4. 📧 SMTP & Nodemailer Setup (Email Notifications)

The system automatically delivers transactional emails:
- **Registration Received**: Sent to participants immediately upon submission with their unique ID.
- **Registration Approved**: Sent upon coordinator approval with event schedule and WhatsApp group links.
- **Registration Rejected**: Sent upon rejection with coordinator remarks.

### Step 4.1: Configure Gmail SMTP with an App Password
1. Log into your Google Account and go to [Google Security](https://myaccount.google.com/security).
2. Enable **2-Step Verification** if not already enabled.
3. Search for **App passwords** or visit: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. Enter an app name (e.g. `College EMS`) and click **Create**.
5. Google will provide a **16-character password** (e.g., `abcd efgh ijkl mnop`). Copy this password.

### Step 4.2: Add SMTP Config to `EMS Backend/.env`
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_college_email@gmail.com
SMTP_PASS=abcdefghijklmnop
```
*(Remove spaces from the 16-character app password).*

---

## 5. ☁️ Cloudinary Setup (Image CDN Storage)

Cloudinary hosts uploaded event banners and student payment transaction screenshots.

### Step 5.1: Create a Cloudinary Account
1. Sign up for a free account at [Cloudinary](https://cloudinary.com/).
2. On your **Cloudinary Dashboard**, locate your **Product Environment Credentials**:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### Step 5.2: Configure Signed Backend Uploads (`EMS Backend/.env`)
The backend securely signs upload requests so client browsers never handle your API Secret:
```env
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

### Step 5.3: Configure Frontend Portals
Add Cloudinary credentials to both frontend `.env` files:

- **`EMS Management/.env`**:
  ```env
  VITE_CLOUDINARY_CLOUD_NAME="your_cloud_name"
  VITE_CLOUDINARY_UPLOAD_PRESET="college_ems_preset"
  ```
- **`EMS Public/.env`**:
  ```env
  VITE_CLOUDINARY_CLOUD_NAME="your_cloud_name"
  VITE_CLOUDINARY_API_KEY="your_api_key"
  VITE_CLOUDINARY_UPLOAD_PRESET="college_ems_preset"
  ```

> [!NOTE]
> **Built-in Local Fallback**: If Cloudinary credentials are omitted or fail, the backend automatically writes uploaded images to `EMS Backend/uploads/` on the local drive and serves them over `http://localhost:5000/uploads/...`.

---

## 🔑 Complete `.env` Quick Reference

### 1. `EMS Backend/.env`
```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/college_ems?schema=public"
JWT_SECRET="ems_jwt_secret_key_2026_super_secure"
CORS_ORIGIN="http://localhost:3000,http://localhost:5173,http://localhost:3001,http://localhost:5174"

# Redis / Memurai Queue
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# SMTP / Nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Firebase Admin (If using JSON string instead of serviceAccountKey.json)
# FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

### 2. `EMS Management/.env`
```env
VITE_API_URL="http://localhost:5000"

# Firebase Client SDK
VITE_FIREBASE_API_KEY="your_firebase_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"

# Cloudinary (Optional fallback)
VITE_CLOUDINARY_CLOUD_NAME="your_cloud_name"
VITE_CLOUDINARY_UPLOAD_PRESET="college_ems_preset"
```

### 3. `EMS Public/.env`
```env
VITE_API_URL="http://localhost:5000"

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME="your_cloud_name"
VITE_CLOUDINARY_API_KEY="your_api_key"
VITE_CLOUDINARY_UPLOAD_PRESET="college_ems_preset"
```

---

## 🧪 Verification & Smoke Testing Checklist

1. **Database Check**:
   - Run `npx prisma studio` in `EMS Backend` to view database tables in your browser.
2. **Memurai / Redis Check**:
   - Run `memurai-cli ping` (should output `PONG`).
3. **Backend Server Check**:
   - Run `npm run dev` in `EMS Backend`. Confirm console shows:
     - `⚡ Connected to Memurai/Redis Server`
     - `Firebase Admin initialized`
     - `🚀 EMS Express Backend Server Live at http://localhost:5000`
4. **Bull-Board Queue Check**:
   - Visit `http://localhost:5000/admin/queues` to inspect queue health.
5. **Admin Login Check**:
   - Open `http://localhost:5174/login` and log in with your seeded administrator credentials.
