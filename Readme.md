# Backend API - Lead Scoring System

Node.js Backend API untuk Lead Scoring System menggunakan Express.js, PostgreSQL, dan integrasi ML Service.

**Team A25-CS060** - Capstone Project Bangkit 2024

---

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Teknologi](#-teknologi)
- [Setup & Instalasi](#-setup--instalasi)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Auto-Predict Cron Jobs](#-auto-predict-cron-jobs)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

## ✨ Fitur

- **RESTful API** - Endpoints untuk customer, prediction, dan authentication
- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control (RBAC)** - Admin & Sales roles
- **Database Connection Pooling** - Optimal PostgreSQL performance
- **In-Memory Caching** - Fast data access dengan node-cache
- **Auto-Predict Cron Jobs** - Scheduled automatic predictions
- **CSV Upload** - Bulk customer import
- **ML Service Integration** - Seamless prediction dengan Python ML service
- **Error Handling** - Comprehensive error responses

## 🛠️ Teknologi

- **Runtime**: Node.js v18+ (ES Modules)
- **Framework**: Express.js v5
- **Database**: PostgreSQL v14+
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, bcryptjs
- **Caching**: node-cache
- **Scheduling**: node-cron
- **File Upload**: Multer
- **CSV Parsing**: csv-parse
- **HTTP Client**: axios

## 🚀 Setup & Instalasi

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Database
```bash
# Login ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE leadscoring;

# Exit
\q
```

### 3. Configure Environment
```bash
# Copy template .env
cp .env.example .env

# Edit .env dengan text editor
nano .env
```

### 4. Seed Database (First Time Only)
```bash
npm run seed
```

Output expected:
```
✅ Database seeded successfully
✅ Created 2 users (admin & sales)
✅ Imported 48 customers
```

### 5. Start Server
```bash
# Development mode
npm start

# Production mode
NODE_ENV=production npm start
```

Server akan berjalan di `http://localhost:3001`

## ⚙️ Konfigurasi Environment

File `.env` di root folder backend:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=leadscoring
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
JWT_EXPIRES_IN=24h

# ML Service Configuration
ML_SERVICE_URL=http://localhost:5000

# Auto-Predict Cron Configuration
ENABLE_AUTO_PREDICT_CRON=true
AUTO_PREDICT_CRON=*/2 * * * *  # Every 2 minutes
CACHE_CLEANUP_CRON=0 * * * *   # Every hour

# Cache Configuration
CACHE_TTL=300  # 5 minutes (in seconds)
```

### Environment Variables Explained

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment mode | development |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | leadscoring |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | Secret key untuk JWT | - |
| `JWT_EXPIRES_IN` | Token expiry time | 24h |
| `ML_SERVICE_URL` | ML service endpoint | http://localhost:5000 |
| `ENABLE_AUTO_PREDICT_CRON` | Enable/disable cron | true |
| `AUTO_PREDICT_CRON` | Cron schedule | */2 * * * * |
| `CACHE_TTL` | Cache TTL (seconds) | 300 |

## 🗄️ Database Schema

### Table: `users`
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'sales',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Default Users:**
- Admin: `admin@leadscoring.com` / `password123`
- Sales: `sales1@leadscoring.com` / `password123`

### Table: `customers`
```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  job VARCHAR(100),
  marital VARCHAR(50),
  education VARCHAR(100),
  has_default BOOLEAN DEFAULT false,
  has_housing_loan BOOLEAN DEFAULT false,
  has_personal_loan BOOLEAN DEFAULT false,
  contact VARCHAR(50),
  month VARCHAR(20),
  day_of_week VARCHAR(20),
  campaign INTEGER,
  pdays INTEGER,
  previous INTEGER,
  poutcome VARCHAR(50),
  balance DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `predictions`
```sql
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  probability_score DECIMAL(5, 4) NOT NULL,
  will_subscribe BOOLEAN NOT NULL,
  model_version VARCHAR(50) DEFAULT 'v1.0',
  predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📡 API Documentation

Base URL: `http://localhost:3001/api/v1`

### Authentication

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@leadscoring.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@leadscoring.com",
      "role": "admin"
    }
  }
}
```

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "sales"
}
```

### Customer Management

#### Get All Customers (with Advanced Filters)
```http
GET /customers?page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search in name, job, education, marital | `?search=John` |
| `minAge` | number | Minimum age filter | `?minAge=30` |
| `maxAge` | number | Maximum age filter | `?maxAge=50` |
| `job` | string | Filter by job | `?job=technician` |
| `education` | string | Filter by education | `?education=secondary` |
| `marital` | string | Filter by marital status | `?marital=married` |
| `housing` | boolean | Filter by housing loan | `?housing=true` |
| `loan` | boolean | Filter by personal loan | `?loan=false` |
| `hasDefault` | boolean | Filter by default status | `?hasDefault=false` |
| `page` | number | Page number | `?page=1` |
| `limit` | number | Items per page (max 100) | `?limit=20` |
| `sortBy` | string | Sort column | `?sortBy=probability_score` |
| `order` | string | Sort order (ASC/DESC) | `?order=DESC` |

**Examples:**
```bash
# Search by name
GET /customers?search=John

# Age range filter
GET /customers?minAge=30&maxAge=50

# Combined filters
GET /customers?marital=married&education=secondary&housing=true

# High priority leads (sorted by score)
GET /customers?sortBy=probability_score&order=DESC&limit=10
```

#### Get Customer Stats
```http
GET /customers/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCustomers": 48,
    "avgAge": "37.1",
    "withHousingLoan": 23,
    "withPersonalLoan": 15,
    "uniqueJobs": 11,
    "pendingCalls": 0,
    "monthlyConversions": 7,
    "monthlyTrend": [...]
  }
}
```

#### Create Customer
```http
POST /customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "age": 30,
  "job": "technician",
  "marital": "married",
  "education": "secondary",
  "has_default": false,
  "has_housing_loan": true,
  "has_personal_loan": false,
  "contact": "cellular",
  "campaign": 2,
  "pdays": 999,
  "previous": 0,
  "poutcome": "unknown"
}
```

#### Upload CSV
```http
POST /customers/upload-csv
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- csvfile: <file>
```

**CSV Format:**
```csv
name,age,job,marital,education,has_default,has_housing_loan,has_personal_loan,contact,month,day_of_week,campaign,pdays,previous,poutcome
John Doe,30,technician,married,secondary,no,yes,no,cellular,may,mon,2,999,0,unknown
```

### Predictions

#### Get Prediction Statistics
```http
GET /predictions/stats
Authorization: Bearer <token>
```

**Response (camelCase format):**
```json
{
  "success": true,
  "data": {
    "totalPredictions": 48,
    "averageScore": "0.34",
    "positivePredictions": 7,
    "negativePredictions": 41,
    "highestScore": "0.59",
    "lowestScore": "0.11",
    "highPriorityCount": 0,
    "mediumPriorityCount": 7,
    "lowPriorityCount": 41,
    "customersWithPredictions": 48,
    "customersWithoutPredictions": 0,
    "conversionRate": "14.58"
  }
}
```

#### Get Top Leads
```http
GET /predictions/top-leads?limit=6&threshold=0.5
Authorization: Bearer <token>
```

**Parameters:**
- `limit`: Number of leads (default: 50, max: 200)
- `threshold`: Minimum probability score (default: 0.5)

#### Predict Single Customer
```http
POST /predictions/customer/:id
Authorization: Bearer <token>
```

#### Batch Predict
```http
POST /predictions/batch
Authorization: Bearer <token>
Content-Type: application/json

{
  "limit": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 100,
      "success": 98,
      "failed": 2
    },
    "results": [...]
  }
}
```

### Auto-Predict Jobs

#### Get Job Status
```http
GET /predictions/job/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isRunning": false,
    "cronEnabled": true,
    "lastRunTime": "2025-11-30T07:40:00.124Z",
    "nextRunTime": "2025-11-30T07:42:00.124Z",
    "cronSchedule": "*/2 * * * *",
    "totalRuns": 17,
    "lastResult": {
      "total": 0,
      "success": 0,
      "failed": 0
    },
    "cacheStats": {
      "hits": 17,
      "misses": 0,
      "hitRate": "100.00%"
    }
  }
}
```

#### Manual Trigger
```http
POST /predictions/job/trigger
Authorization: Bearer <token>
```

## 🤖 Auto-Predict Cron Jobs

### Auto-Predict Job
**Schedule**: Every 2 minutes (`*/2 * * * *`)

**Workflow:**
1. Check if job is already running (prevent overlap)
2. Query customers without predictions
3. Check ML service health
4. Send batch prediction request to ML service
5. Save results to database
6. Update cache
7. Log results

**Configuration:**
```env
ENABLE_AUTO_PREDICT_CRON=true
AUTO_PREDICT_CRON=*/2 * * * *
```

**Disable cron job:**
```env
ENABLE_AUTO_PREDICT_CRON=false
```

### Cache Stats Job
**Schedule**: Every hour (`0 * * * *`)

Logs cache statistics:
- Total hits/misses
- Hit rate percentage
- Cached predictions count

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3001/api/v1/health
```

### Login & Get Token
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@leadscoring.com","password":"password123"}'
```

### Test Customer Endpoints
```bash
# Set your token
TOKEN="your-jwt-token-here"

# Get all customers
curl -X GET "http://localhost:3001/api/v1/customers?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Test search by name
curl -X GET "http://localhost:3001/api/v1/customers?search=John" \
  -H "Authorization: Bearer $TOKEN"

# Test age range filter
curl -X GET "http://localhost:3001/api/v1/customers?minAge=30&maxAge=50" \
  -H "Authorization: Bearer $TOKEN"

# Test job filter
curl -X GET "http://localhost:3001/api/v1/customers?job=technician&limit=5" \
  -H "Authorization: Bearer $TOKEN"

# Test combined filters
curl -X GET "http://localhost:3001/api/v1/customers?marital=married&education=secondary&housing=true" \
  -H "Authorization: Bearer $TOKEN"
```

### Test Prediction Endpoints
```bash
# Get prediction stats
curl -X GET "http://localhost:3001/api/v1/predictions/stats" \
  -H "Authorization: Bearer $TOKEN"

# Get top leads
curl -X GET "http://localhost:3001/api/v1/predictions/top-leads?limit=10&threshold=0.5" \
  -H "Authorization: Bearer $TOKEN"

# Get job status
curl -X GET "http://localhost:3001/api/v1/predictions/job/status" \
  -H "Authorization: Bearer $TOKEN"
```

## 🐛 Troubleshooting

### Database Connection Error
```
Error: Error in pool connection
```

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   # Windows
   pg_ctl status

   # Linux/Mac
   sudo systemctl status postgresql
   ```

2. Check database credentials in `.env`
3. Ensure database `leadscoring` exists:
   ```bash
   psql -U postgres -l | grep leadscoring
   ```

### ML Service Connection Error
```
Error: ML Service unavailable
```

**Solutions:**
1. Check if ML service is running on port 5000
2. Verify `ML_SERVICE_URL` in `.env`
3. Check ML service logs
4. Auto-predict will skip if ML service is down (graceful failure)

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /F /PID <PID>

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### JWT Token Invalid/Expired
```
Error: Token expired or invalid
```

**Solutions:**
1. Login again to get new token
2. Check `JWT_SECRET` in `.env`
3. Verify token is included in Authorization header:
   ```
   Authorization: Bearer <token>
   ```

### Cron Job Not Running
```
[CronJob] Auto predict cron is disabled
```

**Solutions:**
1. Check `ENABLE_AUTO_PREDICT_CRON=true` in `.env`
2. Restart server after changing `.env`
3. Check logs for cron job messages

### CSV Upload Failed
```
Error: Invalid CSV format
```

**Solutions:**
1. Ensure CSV has correct headers
2. Check boolean values: `yes`/`no` or `true`/`false`
3. Verify file encoding is UTF-8
4. Check file size (max 10MB)

## 📁 Project Structure

```
backend/
├── database/
│   └── seed.js              # Database seeder
├── src/
│   ├── config/
│   │   ├── database.js      # PostgreSQL config
│   │   └── mlService.js     # ML service config
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   └── predictionController.js
│   ├── jobs/
│   │   └── predictionJob.js # Cron jobs
│   ├── middlewares/
│   │   ├── authMiddleware.js
│   │   ├── rbacMiddleware.js
│   │   ├── uploadMiddleware.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── customerRoutes.js
│   │   └── predictionRoutes.js
│   ├── services/
│   │   ├── customerService.js
│   │   ├── predictionService.js
│   │   ├── autoPredictService.js
│   │   ├── cacheService.js
│   │   └── mlService.js
│   ├── utils/
│   │   ├── response.js
│   │   └── validators.js
│   └── index.js             # Entry point
├── uploads/                 # CSV upload folder
├── .env                     # Environment variables
├── .env.example            # Template
├── package.json
└── README.md               # This file
```

## ✅ Recent Updates (30 Nov 2025)

1. ✅ **Search by Name** - Added name field to search query
2. ✅ **Advanced Filters** - Full support for multi-parameter filtering
3. ✅ **Cron Job Tracking** - Added totalRuns and lastRunTime
4. ✅ **Response Format** - Standardized camelCase for consistency
5. ✅ **Error Handling** - Improved error messages

---

**Status**: ✅ Backend Running | Database Connected | Auto-Predict Active

*Last Updated: 30 November 2025*
