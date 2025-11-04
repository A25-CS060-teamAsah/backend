# Lead Scoring Backend API

Backend service untuk **Predictive Lead Scoring Portal for Banking** - Capstone Project Team A25-CS060

## 📋 Project Information

- **Team ID**: A25-CS060
- **Use Case**: AC-03
- **Program**: Asah by Dicoding x Accenture

## 🚀 Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js 5
- **Database**: PostgreSQL 15+
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS
- **Password Hashing**: bcryptjs

## 📦 Installation

### Prerequisites

- Node.js >= 20.x
- PostgreSQL >= 15.x
- npm or yarn

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file dengan konfigurasi Anda:

```env
# Server Configuration
PORT=3000
HOST=localhost
NODE_ENV=development

# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lead_scoring_db
DB_PASSWORD=your_password_here
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# ML Service Configuration (untuk minggu 2)
ML_SERVICE_URL=http://localhost:5000
ML_API_TIMEOUT=10000
```

### Step 4: Setup Database

#### Buat Database

```bash
createdb -U postgres lead_scoring_db
```

#### Run Database Schema

```bash
psql -U postgres -d lead_scoring_db -f .\database\schema.sql
```

Atau dengan command:

```bash
psql lead_scoring_db < database/schema.sql
```

### Step 5: Seed Database (Optional)

Untuk membuat user dan data sample:

```bash
npm run seed
```

Default credentials setelah seeding:

- Email: `admin@leadscoring.com` | Password: `password123` (role: admin)
- Email: `sales1@leadscoring.com` | Password: `password123` (role: sales)

### Step 6: Run Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection config
│   ├── controllers/
│   │   └── authController.js    # Auth business logic
│   ├── middlewares/
│   │   ├── authMiddleware.js    # JWT authentication
│   │   ├── errorMiddleware.js   # Error handling
│   │   └── loggerMiddleware.js  # Request logging
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints
│   │   └── index.js             # Main router
│   ├── services/
│   │   └── userService.js       # Database operations for users
│   ├── utils/
│   │   ├── response.js          # Response formatters
│   │   └── validator.js         # Input validation
│   └── index.js                 # Application entry point
├── database/
│   ├── schema.sql               # Database schema
│   └── seed.js                  # Seed script
├── docs/
│   ├── SETUP_GUIDE.md           # Detailed setup guide
│   └── MIGRATION_USERNAME_TO_EMAIL.md  # Migration guide
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🔌 API Endpoints

### Base URL

```
http://localhost:3000/api/v1
```

### Health Check

#### GET `/health`

Check API status

**Response:**

```json
{
  "success": true,
  "message": "API is running",
  "data": {
    "status": "OK",
    "timestamp": "2025-11-04T10:00:00.000Z",
    "service": "Lead Scoring Backend API",
    "version": "1.0.0",
    "environment": "development"
  }
}
```

### Authentication

#### POST `/auth/register`

Register new user

**Request Body:**

```json
{
  "email": "sales1@leadscoring.com",
  "password": "password123",
  "role": "sales"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "sales1@leadscoring.com",
      "role": "sales",
      "createdAt": "2025-11-04T10:00:00.000Z"
    }
  }
}
```

#### POST `/auth/login`

Login user

**Request Body:**

```json
{
  "email": "sales1@leadscoring.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "sales1@leadscoring.com",
      "role": "sales"
    }
  }
}
```

#### GET `/auth/me` 🔒

Get current user profile (Requires Authentication)

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": 1,
    "email": "sales1@leadscoring.com",
    "role": "sales",
    "created_at": "2025-11-04T10:00:00.000Z"
  }
}
```

#### POST `/auth/logout` 🔒

Logout user (Requires Authentication)

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

## 🔐 Authentication

API menggunakan JWT (JSON Web Tokens) untuk autentikasi.

### Cara Menggunakan:

1. Login untuk mendapatkan token
2. Gunakan token di header untuk protected endpoints:

```
Authorization: Bearer <your-token-here>
```

### Token Expiration

Default: 24 jam (dapat diubah di `.env` dengan `JWT_EXPIRES_IN`)

## 🧪 Testing dengan cURL

### Register

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "sales"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Profile (dengan token)

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <your-token>"
```

## 🗄️ Database Schema

### Table: users

| Column     | Type         | Description           |
| ---------- | ------------ | --------------------- |
| id         | SERIAL       | Primary key           |
| email      | VARCHAR(255) | Unique email address  |
| password   | VARCHAR(255) | Hashed password       |
| role       | VARCHAR(20)  | admin or sales        |
| created_at | TIMESTAMP    | Creation timestamp    |
| updated_at | TIMESTAMP    | Last update timestamp |

### Table: customers (untuk minggu 2)

Tabel untuk menyimpan data nasabah dari Bank Marketing Dataset

### Table: predictions (untuk minggu 2)

Tabel untuk menyimpan hasil prediksi ML

## 📝 Development Guidelines

### Naming Conventions

- **Files**: camelCase (contoh: `authController.js`, `userService.js`)
- **Functions**: camelCase (contoh: `findUserByEmail`, `createUser`)
- **Constants**: UPPER_SNAKE_CASE (contoh: `JWT_SECRET`, `DB_PORT`)
- **Classes**: PascalCase (jika diperlukan)

### Email Validation

Email harus memenuhi format standar:

- ✅ Valid: `user@example.com`
- ✅ Valid: `user.name@domain.co.id`
- ❌ Invalid: `user@` (incomplete)
- ❌ Invalid: `user@domain` (missing TLD)

### Code Style

Project menggunakan ESLint dan Prettier untuk code formatting.

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Error Handling

Semua error harus di-handle dengan proper error responses:

```javascript
// ✅ Good
try {
  // your code
} catch (error) {
  console.error('Error description:', error);
  return sendError(res, 'User-friendly message', 500);
}

// ❌ Bad
try {
  // your code
} catch (error) {
  throw error; // Don't throw in controllers
}
```

## 🚧 Roadmap

### ✅ Week 1 (Current)

- [x] Database setup & schema
- [x] Authentication system (JWT)
- [x] User service & controller
- [x] Error handling & logging
- [x] Project structure setup
- [x] Email-based authentication

### 🔜 Week 2

- [ ] ML Service integration
- [ ] Customer CRUD operations
- [ ] Prediction API
- [ ] Database seeding with full dataset

### 🔜 Week 3

- [ ] Testing & documentation
- [ ] Performance optimization
- [ ] Caching implementation

### 🔜 Week 4

- [ ] Deployment preparation
- [ ] Docker setup
- [ ] CI/CD pipeline
- [ ] Final documentation

## 🐛 Troubleshooting

### Database Connection Error

```
❌ Database connection failed
```

**Solution:**

1. Check if PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env`
3. Check database exists: `psql -l`
4. Check firewall settings

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**

1. Change port in `.env`
2. Or kill process using port: `lsof -ti:3000 | xargs kill`

### JWT Token Issues

```
❌ Invalid token
```

**Solution:**

1. Check token format: `Bearer <token>`
2. Verify token hasn't expired
3. Check `JWT_SECRET` in `.env` matches

### Invalid Email Format

```
❌ Invalid email format
```

**Solution:**

1. Ensure email follows format: `user@domain.com`
2. Check for spaces or invalid characters
3. Verify email length (max 255 characters)

## 👥 Team Members

- **M004D5Y1135** - Mohamad Azra Muntaha (Machine Learning)
- **M004D5Y1974** - Yendra Wijayanto (Machine Learning)
- **R001D5Y0088** - Ahmad Faris Al Aziz (React & Backend)
- **R229D5Y1036** - M. Rivqi Al Varras (React & Backend)
- **R297D5Y1611** - Rafi Pradipa Adriano (React & Backend)

## 📄 License

ISC

## 🙏 Acknowledgments

- Dicoding Indonesia
- Accenture
- Bank Marketing Dataset - UCI Machine Learning Repository

---

**Happy Coding! 🚀**
