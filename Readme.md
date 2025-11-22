# 🏦 Lead Scoring Backend API

**Team A25-CS060** - Predictive Lead Scoring Portal for Banking
**Version:** 3.0 (Auto Predict & Caching)

---

## 📋 Project Overview

Backend Express.js untuk memprediksi dan memprioritaskan nasabah bank yang potensial berlangganan deposito berjangka menggunakan Machine Learning.

**Tech Stack:**
- Express.js 5.x
- PostgreSQL 14+ / Supabase
- JWT Authentication
- Axios (ML Service integration)
- Multer (File upload)
- CSV Parser
- Node-Cache (In-memory caching)
- Node-Cron (Scheduled jobs)

---

## ✨ Features

### Authentication & Authorization
- ✅ JWT-based authentication
- ✅ Role-Based Access Control (RBAC)
  - **Admin:** Can register new users + all features
  - **Sales:** Cannot register users, but all other features available
  - **Manager:** Same as admin (future use)

**IMPORTANT:** Sales dan Admin punya akses yang SAMA ke semua fitur (CRUD customers, predictions, upload CSV, dll). Perbedaannya HANYA admin bisa register user baru.

### Customer Management
- ✅ Full CRUD operations (Admin & Sales)
- ✅ **CSV Bulk Upload** - Import ratusan/ribuan customers (Admin & Sales)
- ✅ **Advanced Search & Filter:**
  - Age range (min/max)
  - Job, education, marital status
  - Loan status (housing, personal, default)
  - Text search
- ✅ Pagination (max 100 per page)
- ✅ Sorting (multiple columns)
- ✅ Statistics & analytics

### ML Predictions
- ✅ Single customer prediction
- ✅ Batch predictions
- ✅ Top leads ranking (highest probability score)
- ✅ Prediction history per customer
- ✅ Prediction statistics

### Auto Predict System (NEW in v3.0)
- ✅ **Cron Job** - Auto predict setiap 2 menit
- ✅ **In-memory Cache** - Reduce redundant ML calls
- ✅ **Trigger on Create** - Customer baru otomatis diprediksi
- ✅ **Trigger on Update** - Prediksi ulang saat data berubah
- ✅ **Trigger on CSV Upload** - Batch predict setelah import
- ✅ **Manual Trigger** - API endpoint untuk trigger manual
- ✅ **Job Status Monitoring** - Monitor status & cache statistics

### Integration
- ✅ Flask ML Service (LightGBM model)
- ✅ Automatic preprocessing (14 → 51 features)
- ✅ Real-time predictions
- ✅ Supabase PostgreSQL support

---

## 🚀 Quick Start

### Prerequisites
```bash
Node.js 18+
PostgreSQL 14+
npm or yarn
```

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your config

# 3. Create database
psql -U postgres
CREATE DATABASE lead_scoring_db;
\q

# 4. Run schema
psql -U postgres lead_scoring_db < database/schema.sql

# 5. Seed database (creates admin user)
npm run seed

# 6. Start server
npm run dev
```

**Server:** http://localhost:3001

---

## 📡 API Endpoints (21 Total)

### Authentication (5)
```
POST   /api/v1/auth/login              Login (returns JWT)
POST   /api/v1/auth/register           Register user (Admin only) ⭐
GET    /api/v1/auth/me                 Get profile
POST   /api/v1/auth/logout             Logout
GET    /api/v1/health                  Health check
```

⭐ = Admin only endpoint

### Customers (8) - All Authenticated Users
```
GET    /api/v1/customers               List all
GET    /api/v1/customers/:id           Get by ID
POST   /api/v1/customers               Create
PUT    /api/v1/customers/:id           Update
DELETE /api/v1/customers/:id           Delete
GET    /api/v1/customers/stats         Statistics
POST   /api/v1/customers/upload-csv    Upload CSV
GET    /api/v1/customers/csv-template  Download template
```

### Predictions (5) - All Authenticated Users
```
POST   /api/v1/predictions/customer/:id         Predict single
POST   /api/v1/predictions/batch                Batch predict
GET    /api/v1/predictions/top-leads            Top leads
GET    /api/v1/predictions/stats                Statistics
GET    /api/v1/predictions/customer/:id/history History
```

### Auto Predict Jobs (3) - All Authenticated Users (NEW)
```
GET    /api/v1/predictions/job/status           Get job status & cache stats
GET    /api/v1/predictions/cache/stats          Get cache statistics
POST   /api/v1/predictions/job/trigger          Manual trigger auto predict
```

---

## 🔐 RBAC (Role-Based Access Control)

### Simple Rules:

**Admin:**
- ✅ Can register new users (sales/admin/manager)
- ✅ All other features (same as sales)

**Sales:**
- ❌ Cannot register new users
- ✅ All other features (CRUD customers, predictions, upload CSV, etc)

**Manager:**
- Same as Admin (for future use)

### Implementation:
- **Only 1 endpoint** protected: `POST /auth/register` (admin only)
- **All other endpoints:** Require authentication only (no role check)

---

## 🔧 Environment Variables

```env
# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Database - Option 1: Supabase (Recommended)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Database - Option 2: Local PostgreSQL
# DB_USER=postgres
# DB_HOST=localhost
# DB_NAME=lead_scoring_db
# DB_PASSWORD=your_password
# DB_PORT=5432

# JWT
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# ML Service (Flask) - Port 5050
ML_SERVICE_URL=http://localhost:5050
ML_API_TIMEOUT=10000

# Auto Predict Configuration (NEW in v3.0)
ENABLE_AUTO_PREDICT_CRON=true
AUTO_PREDICT_CRON=*/2 * * * *
AUTO_PREDICT_BATCH_SIZE=50
```

---

## 👥 Default Users (after seed)

```javascript
// Admin - Can register users + all features
{
  email: "admin@leadscoring.com",
  password: "Admin123!",
  role: "admin"
}

// Sales - Cannot register users, but all other features available
{
  email: "sales1@leadscoring.com",
  password: "Admin123!",
  role: "sales"
}
```

**Note:** Password has been updated to `Admin123!` for better security.

---

## 📊 CSV Bulk Upload

### Download Template
```bash
GET /api/v1/customers/csv-template
```

### CSV Format (14 columns required)
```csv
age,job,marital,education,default,housing,loan,contact,month,day_of_week,campaign,pdays,previous,poutcome
30,technician,married,secondary,false,true,false,cellular,may,mon,2,999,0,unknown
45,management,single,tertiary,false,false,false,telephone,jun,fri,1,999,0,success
```

### Upload CSV (Admin & Sales)
```bash
POST /api/v1/customers/upload-csv
Content-Type: multipart/form-data
Authorization: Bearer <token>

Field name: csvfile
Max size: 10MB
```

### Response
```json
{
  "success": true,
  "summary": {
    "totalRecordsInFile": 100,
    "validRecords": 95,
    "invalidRecordsDuringValidation": 5,
    "successfullyCreated": 94,
    "failedToCreate": 1
  },
  "created": [...],
  "validationErrors": [...],
  "insertionErrors": [...]
}
```

---

## 🔍 Advanced Search & Filter

```bash
GET /api/v1/customers?minAge=30&maxAge=50&job=technician&housing=true&page=1&limit=20&sortBy=age&order=DESC
```

**Query Parameters:**
- `minAge`, `maxAge` - Age range
- `job` - Specific job
- `education` - Education level
- `marital` - Marital status
- `housing` - Housing loan (true/false)
- `loan` - Personal loan (true/false)
- `hasDefault` - Default status (true/false)
- `search` - Text search (job/education/marital)
- `page` - Page number (default: 1)
- `limit` - Items per page (max: 100)
- `sortBy` - Sort column (id, age, job, education)
- `order` - ASC or DESC

---

## 🗄️ Database Schema

### Tables (3)

**users**
```sql
id, email, password, role, created_at, updated_at
```

**customers**
```sql
id, age, job, marital, education,
has_default, has_housing_loan, has_personal_loan,
contact, month, day_of_week,
campaign, pdays, previous, poutcome,
created_at, updated_at
```

**predictions**
```sql
id, customer_id (FK), probability_score, will_subscribe,
model_version, predicted_at
```

---

## 🧪 Testing

```bash
# Run all tests
./tests/test-api-week2.sh

# Manual test - Login as admin
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@leadscoring.com","password":"Admin123!"}'

# Test CSV upload (should work!)
curl -X POST http://localhost:3001/api/v1/customers/upload-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "csvfile=@customers.csv"

# Test auto predict job status (NEW in v3.0)
curl -X GET http://localhost:3001/api/v1/predictions/job/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Manually trigger auto predict (NEW in v3.0)
curl -X POST http://localhost:3001/api/v1/predictions/job/trigger \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Database & ML service config
│   ├── controllers/         # Business logic
│   ├── jobs/                # Cron jobs (NEW in v3.0)
│   │   └── predictionJob.js # Auto predict scheduler
│   ├── middlewares/         # Auth, RBAC, upload, error handling
│   ├── routes/              # API routes
│   ├── services/            # Database operations
│   │   ├── autoPredictService.js  # Auto predict logic (NEW)
│   │   └── cacheService.js        # In-memory cache (NEW)
│   └── utils/               # Helpers, validators, CSV parser
│
├── database/
│   ├── schema.sql           # Database schema
│   └── seed.js              # Sample data & admin user
│
├── tests/
│   └── test-api-week2.sh    # API tests
│
├── .env.example             # Environment template
├── package.json             # Dependencies
└── README.md                # This file
```

---

## 🔐 Security Features

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **RBAC** - Admin-only registration
- ✅ **Password Hashing** - bcryptjs with salt
- ✅ **Helmet** - Security headers
- ✅ **CORS** - Configured for frontend
- ✅ **SQL Injection Protection** - Parameterized queries
- ✅ **Input Validation** - All inputs validated
- ✅ **File Upload Security** - Type & size validation

---

## 🤝 ML Service Integration

**Requirements:**
- Flask ML service running on port 5050
- LightGBM model (51 features)

**Flow:**
```
Express Backend → Flask ML Service → LightGBM Model
      ↓                    ↓
PostgreSQL ←───── Prediction Result
      ↓
Return to User
```

---

## 📊 Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error type",
  "message": "Description"
}
```

---

## 🐛 Troubleshooting

**Database connection failed:**
```bash
sudo systemctl start postgresql
```

**ML service unavailable:**
```bash
cd ml-service
python app.py  # Make sure it's running on port 5050
```

**Permission denied (RBAC):**
- Only happens on `/auth/register` if you're not admin
- All other endpoints work for both admin & sales

**CSV upload failed:**
- Check file format (14 columns required)
- Check file size (max 10MB)
- Download template first

---

## 📝 NPM Scripts

```bash
npm run dev        # Development with watch
npm start          # Production
npm run seed       # Seed database
npm run lint       # ESLint check
npm run lint:fix   # Fix ESLint issues
```

---

## ⚠️ Important Notes

### RBAC Clarification
**Admin vs Sales:**
- **Admin:** Can register new users
- **Sales:** Cannot register new users
- **All other features:** SAMA untuk admin dan sales

Tidak ada pembatasan read-only untuk sales. Sales bisa full CRUD customers, upload CSV, predictions, dll.

### Admin-Only Registration
Registration endpoint is **admin-only**. First admin must be created via seed:
```bash
npm run seed
```

### ML Service Port
Service now runs on **port 5050** (not 5000) to avoid conflicts.

---

## 🎯 What's New in v3.0

### Major Features
1. **Auto Predict System** - Otomatis prediksi customer tanpa manual trigger
2. **Cron Job Scheduler** - Background job setiap 2 menit
3. **In-memory Caching** - Reduce redundant ML calls dengan node-cache
4. **Event-driven Triggers** - Auto predict saat create/update/CSV upload
5. **Supabase Integration** - Cloud PostgreSQL database support

### Auto Predict Triggers
- **On Customer Create** - Customer baru langsung diprediksi
- **On Customer Update** - Cache dihapus, prediksi ulang
- **On CSV Upload** - Batch predict semua customer yang diimport
- **Cron Job** - Auto scan customers tanpa prediksi setiap 2 menit
- **Manual Trigger** - API endpoint untuk trigger manual

### New API Endpoints (3)
- `GET /api/v1/predictions/job/status` - Status cron job & cache
- `GET /api/v1/predictions/cache/stats` - Cache statistics
- `POST /api/v1/predictions/job/trigger` - Manual trigger

### Technical Changes
- Added: node-cache (in-memory caching)
- Added: node-cron (scheduled jobs)
- Added: autoPredictService.js (auto predict logic)
- Added: cacheService.js (cache management)
- Added: predictionJob.js (cron scheduler)
- Updated: DATABASE_URL support for Supabase
- Updated: Port changed to 3001
- Updated: Password to Admin123!

---

## 📜 Previous Versions

### v2.5 Features
1. **CSV Bulk Upload** - Import ribuan customers sekaligus
2. **Simple RBAC** - Admin-only registration, all else same
3. **Advanced Filters** - 8 query parameters untuk filtering
4. **Secure User Management** - Only admin can create users

---

## 📞 Support

**Issues:** Check troubleshooting section  
**Questions:** Review API documentation  
**ML Service:** See ml-service/README.md

---

**Team:** A25-CS060 (Accenture x Dicoding - Asah Program)
**Version:** 3.0 (Auto Predict & Caching)
**Status:** ✅ Production Ready
**Last Updated:** November 22, 2025
