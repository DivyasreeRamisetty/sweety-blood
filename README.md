# Sweety – Blood Glucose Tracker

A modern, professional healthcare web application designed to track blood glucose readings across four daily meal windows, generate clinical daily, month-to-date (MTD), and monthly reports, and deliver AI-powered glycemic insights.

Developed as the hiring assessment for the **Junior Full Stack Developer – JavaScript & AI** position at **Kenpath**.

---

## 🌟 Application Highlights & Technology Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | Clean white canvas, soft purple & teal accents, rounded cards, responsive mobile/desktop, accessible tabular figures |
| **Styling** | Tailwind CSS v4 | Zero-pill metadata design, clean typography (Outfit + Plus Jakarta Sans), WCAG AA contrast |
| **Backend** | Node.js + Express | RESTful APIs, modular router architecture, centralized error handling |
| **Database** | PostgreSQL | Foreign keys, unique constraints, performance indexes, parameterized SQL queries |
| **Storage Engine** | Embedded PGlite + pg.Pool | Runs embedded PostgreSQL (C-WASM) out-of-the-box with disk persistence in `./data/pgdata`, or connects to external Postgres |
| **Authentication**| JWT + bcryptjs | Salted password hashing (10 rounds), signed Bearer tokens, strict user-level data isolation |
| **AI Integration** | Google GenAI (Gemini) | Clinical pattern detection (dawn phenomenon, postprandial excursions, stability rating) with rule-based fallback |
| **Testing** | Node.js Test Runner + Supertest | 23 automated backend tests covering auth, validation, daily limits, reports, and data isolation |

---

## 📋 Feature Breakdown

### 1. Authentication & Security
- **Registration**: Name, email, and password (minimum 6 characters).
- **Password Security**: Passwords are hashed with `bcryptjs` using 10 salt rounds before storage; password hashes are never returned in API responses.
- **JWT Authorization**: Authenticated routes require an `Authorization: Bearer <token>` header. Tokens expire after 7 days (configurable).
- **User Data Isolation**: Every database read, update, delete, and aggregation query strictly filters by `WHERE user_id = $1`. Users can never access or modify another patient's glucose readings.

### 2. Blood Glucose Readings & CRUD
Each reading stores:
- `id`: Unique identifier
- `user_id`: Foreign key referencing `users(id)` ON DELETE CASCADE
- `reading_date`: Date string (`YYYY-MM-DD`)
- `time_slot`: One of four permitted slots
- `glucose_value`: Integer measurement in mg/dL (40 – 600)
- `notes`: Optional clinical or meal annotations
- `created_at` & `updated_at`: Timestamps

#### Four Permitted Daily Slots:
1. `Morning (fasting)`
2. `After breakfast`
3. `After lunch`
4. `After dinner`

Users can add, view, edit, and delete their readings through intuitive modal interfaces.

### 3. Clinical Validation Rules
- **Required Value**: Glucose value cannot be empty.
- **Range & Integer Check**: Must be a whole number between 40 and 600 mg/dL (`Number.isInteger(val) && val >= 40 && val <= 600`).
- **Single Reading Per Slot Per Day**: Enforced both in the API and at the database level via a composite PostgreSQL unique constraint:
  ```sql
  CONSTRAINT unique_user_date_slot UNIQUE (user_id, reading_date, time_slot)
  ```
- **Maximum 4 Readings Per Day**: Validated before creation.
- **No Future Dates**: Entries with `reading_date > today` are rejected with the clear error message `"Future dates are not allowed"`.
- **Clear Error Feedback**: All validation errors display specific, actionable error messages in the UI.

### 4. Comprehensive Reports
- **Daily Report**:
  - Displays selected date (with easy Previous/Next Day navigation)
  - Highest reading, lowest reading, average reading rounded to one decimal place (`avg.toFixed(1)`), and total count
  - Individual readings chronologically ordered by slot: Morning &rarr; After breakfast &rarr; After lunch &rarr; After dinner
- **Month-to-Date (MTD) Report**:
  - Automatically scopes from the 1st day of the selected month through the selected date
  - Highest, lowest, average, and count
  - Visual daily average trajectory chart and breakdown by time slot
- **Monthly Report**:
  - **Defaults to the entire previous calendar month** (e.g. October 2026 when in November 2026), with option to inspect any calendar month
  - Highest, lowest, average, and count
  - ADA (American Diabetes Association) Glycemic Range Distribution:
    - Normal / In Target: 70 – 140 mg/dL
    - Low / Hypoglycemia: < 70 mg/dL
    - Elevated: 141 – 180 mg/dL
    - High / Hyperglycemia: > 180 mg/dL
- **Friendly Empty States**: Each report and view renders a friendly empty state when no readings exist for the selected timeframe.

---

## 🗄️ Database Design

The PostgreSQL database architecture is defined in `src/backend/db/migrations/001_initial_schema.sql`:

```sql
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Glucose Readings Table
CREATE TABLE IF NOT EXISTS glucose_readings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  time_slot VARCHAR(50) NOT NULL,
  glucose_value INTEGER NOT NULL CHECK (glucose_value >= 40 AND glucose_value <= 600),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_date_slot UNIQUE (user_id, reading_date, time_slot)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_readings_user_date ON glucose_readings(user_id, reading_date);
CREATE INDEX IF NOT EXISTS idx_readings_user_slot ON glucose_readings(user_id, time_slot);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

---

## 🧪 Testing Suite

Sweety includes 23 automated backend integration tests covering all core workflows:
- **Authentication**: Registration, password hashing, JWT creation, duplicate email rejection (409), short password rejection (400), login validation, route protection.
- **Reading Validation**: Missing values, out-of-range (<40, >600), decimal/non-integer rejection, unpermitted slot rejection, future date rejection.
- **Slot Uniqueness & Daily Limits**: 409 Conflict on duplicate slot on same date, multi-slot recording up to 4 per day, reading editing without conflicts.
- **User Data Isolation**: User B cannot view, edit, or delete readings belonging to User A.
- **Reporting Engine**: Accurate highest, lowest, average (rounded to 1 decimal), and count calculations for Daily, MTD, and Monthly reports, plus empty states.

### Run Tests:
```bash
npm test
```

---

## 🚀 Setup & Execution Instructions

### 1. Installation
```bash
npm install
```

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```

### 3. Seed Database (Optional)
Pre-populate the database with 35 days of realistic sample readings for demo review:
```bash
npm run seed
```
*Note: You can also click the **"Quick Sign-In: Sarah Jenkins"** button on the login screen to automatically seed and log in with 1 click.*

### 4. Start the Application
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 👤 Demo Credentials

For quick evaluation:
- **Primary Patient (Pre-loaded with 35 days of clinical data)**:
  - **Email**: `demo@sweety.com`
  - **Password**: `password123`
- **Secondary Patient (For User Isolation Testing)**:
  - **Email**: `dr.alex@sweety.com`
  - **Password**: `password123`
- Or use the **"Create Account"** tab to register any new user.

---

## 📂 Project Directory Structure

```
├── .env.example                  # Environment configuration template
├── README.md                     # Documentation & assessment guide
├── index.html                    # Application entry HTML
├── metadata.json                 # AI Studio applet metadata
├── package.json                  # Scripts & dependencies
├── server.ts                     # Full-stack Express & Vite server
├── scripts/
│   └── seed.ts                   # Realistic 35-day clinical seed script
├── src/
│   ├── App.tsx                   # Main React component
│   ├── main.tsx                  # React DOM mount point
│   ├── index.css                 # Global CSS & Tailwind styling
│   ├── backend/
│   │   ├── types.ts              # Server TypeScript interfaces
│   │   ├── db/
│   │   │   ├── database.ts       # Unified PostgreSQL client (PGlite / pg.Pool)
│   │   │   └── migrations/
│   │   │       └── 001_initial_schema.sql # Raw PostgreSQL migration DDL
│   │   ├── middleware/
│   │   │   └── auth.ts           # JWT authentication middleware
│   │   └── routes/
│   │       ├── auth.ts           # Register, login, me endpoints
│   │       ├── readings.ts       # Glucose reading CRUD & validation
│   │       ├── reports.ts        # Daily, MTD, and Monthly report APIs
│   │       └── ai.ts             # Gemini AI clinical patterns endpoint
│   ├── components/
│   │   ├── Navbar.tsx            # Top navigation bar
│   │   ├── DashboardOverview.tsx # 4-slot daily tracker & recent logs
│   │   ├── DailyReportView.tsx   # Daily report with date navigator
│   │   ├── MonthToDateReportView.tsx # MTD report with daily trend trajectory
│   │   ├── MonthlyReportView.tsx # Previous calendar month report & ADA ranges
│   │   ├── AiInsightsView.tsx    # Clinical AI pattern analysis
│   │   ├── AddEditReadingModal.tsx # Add/Edit modal with input validation
│   │   ├── DeleteConfirmModal.tsx # Deletion confirmation dialog
│   │   └── AuthScreen.tsx        # Login & registration portal
│   ├── context/
│   │   └── AuthContext.tsx       # Authentication React context
│   ├── services/
│   │   └── api.ts                # Typed frontend REST client
│   └── types/
│       └── client.ts             # Client TypeScript interfaces
└── tests/
    └── sweety.test.ts            # Automated backend test suite (23 tests)
```
