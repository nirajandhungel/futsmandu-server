# ⚽ Futsmandu Server - Futsal Court Booking Platform

A robust Node.js/TypeScript backend system powering the Futsmandu Flutter mobile application - connecting futsal players with courts across Kathmandu Valley.

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green.svg)](https://www.mongodb.com/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey.svg)](https://expressjs.com/)

---

## 🎯 Core Purpose

Futsmandu Server provides a seamless digital platform for futsal enthusiasts to discover, book, and manage futsal court reservations while enabling venue owners to efficiently manage their facilities and grow their business.

---

## 🚀 Features

### For Players 🏃‍♂️
- **Smart Court Discovery** - Browse and search futsal courts with location-based filters
- **Real-Time Availability** - Check live slot availability before booking
- **Flexible Booking** - Reserve courts for specific time slots or join existing bookings
- **Booking Management** - View, modify, and manage personal reservation history
- **Community Ratings** - Rate and review venues to help others

### For Venue Owners 🏢
- **Multi-Venue Support** - Register and manage multiple futsal centers
- **Court Configuration** - Add courts with different specifications (5v5, 6v6, 7v7)
- **Dynamic Pricing** - Set hourly rates and peak-time pricing
- **Business Analytics** - Track bookings, revenue, and customer insights
- **Availability Control** - Manage opening hours and maintenance schedules

### For Administrators 👨‍💼
- **Platform Management** - Monitor and control all system operations
- **Verification System** - Approve and verify venues and courts
- **User Management** - Handle user accounts and support requests
- **Analytics Dashboard** - System-wide insights and reporting
- **Content Moderation** - Maintain platform quality and safety

---

## 🏗️ System Architecture

### Tech Stack
```
Runtime      : Node.js with TypeScript
Framework    : Express.js
Database     : MongoDB with Mongoose ODM
Authentication : JWT-based security
Validation   : Mongoose schemas + custom validators
Logging      : Structured logging system
Error Handling : Custom middleware with industry standards
```

### Project Structure
```
futsmandu-server/
├── src/
│   ├── config/           # Configuration files
│   │   ├── constants.ts  # Error codes, messages, app constants
│   │   └── environment.ts # Environment variables
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware (auth, error, validation)
│   ├── models/          # Mongoose schemas
│   ├── repositories/    # Data access layer
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Helper functions
├── .env                 # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.x or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6.x or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager
- **Git** for version control

---

## 📦 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/futsmandu-server.git
cd futsmandu-server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/futsmandu
MONGODB_URI_TEST=mongodb://localhost:27017/futsmandu_test

# JWT Secrets
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_too
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=futsmandu-api
JWT_AUDIENCE=futsmandu-app

# Logging
LOG_LEVEL=debug

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Build the Project
```bash
npm run build
```

---

## 🛠️ Usage

### Development Mode
Run the server with hot-reload:
```bash
npm run dev
```

### Production Mode
Build and start the production server:
```bash
npm run build
npm start
```

### Run Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

---

## 🔐 Authentication Flow

Futsmandu uses JWT-based authentication with refresh tokens:

### 1. User Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "role": "player"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully!",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "player@example.com",
      "role": "player"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. User Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "SecurePass123!"
}
```

### 3. Protected Routes
Include the JWT token in the Authorization header:
```http
GET /api/bookings/my-bookings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Token Refresh
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🗄️ Database Schema

### Main Collections

#### Users
```typescript
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  fullName: string,
  phone?: string,
  role: 'player' | 'owner' | 'admin',
  isActive: boolean,
  refreshToken?: string,
  createdAt: Date,
  updatedAt: Date
}
```

#### FutsalCourts (Venues)
```typescript
{
  _id: ObjectId,
  name: string,
  ownerId: ObjectId (ref: User),
  location: {
    address: string,
    city: string,
    coordinates: { lat: number, lng: number }
  },
  amenities: string[],
  images: string[],
  isVerified: boolean,
  openingHours: { open: string, close: string },
  createdAt: Date
}
```

#### Courts
```typescript
{
  _id: ObjectId,
  futsalCourtId: ObjectId (ref: FutsalCourt),
  courtNumber: number,
  type: '5v5' | '6v6' | '7v7',
  pricing: {
    hourlyRate: number,
    peakHourRate?: number
  },
  isAvailable: boolean,
  createdAt: Date
}
```

#### Bookings
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  courtId: ObjectId (ref: Court),
  date: Date,
  startTime: string,
  endTime: string,
  totalAmount: number,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
  paymentStatus: 'unpaid' | 'paid' | 'refunded',
  createdAt: Date
}
```

---

## 📡 API Endpoints

### Authentication Routes
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
POST   /api/auth/logout            - Logout user
POST   /api/auth/refresh           - Refresh access token
GET    /api/auth/me                - Get current user profile
```

### Court Routes
```
GET    /api/courts                 - List all futsal courts
GET    /api/courts/:id             - Get court details
POST   /api/courts                 - Create new court (Owner only)
PUT    /api/courts/:id             - Update court (Owner only)
DELETE /api/courts/:id             - Delete court (Owner only)
GET    /api/courts/search          - Search courts with filters
```

### Booking Routes
```
GET    /api/bookings               - List all bookings (Admin)
GET    /api/bookings/my-bookings   - Get user's bookings
GET    /api/bookings/:id           - Get booking details
POST   /api/bookings               - Create new booking
PUT    /api/bookings/:id           - Update booking
DELETE /api/bookings/:id           - Cancel booking
GET    /api/bookings/availability  - Check court availability
```

### User Routes
```
GET    /api/users/profile          - Get user profile
PUT    /api/users/profile          - Update user profile
PUT    /api/users/password         - Change password
DELETE /api/users/account          - Delete account
```

---

## ⚠️ Error Handling

Futsmandu Server uses standardized error codes and messages:

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "AUTH_1001",
    "message": "The email or password you entered is incorrect.",
    "details": {
      "suggestion": "Please check your credentials or reset your password"
    }
  },
  "meta": {
    "timestamp": "2024-11-16T10:30:00.000Z",
    "path": "/api/auth/login",
    "method": "POST"
  }
}
```

### Common Error Codes
```
AUTH_1001  - Invalid credentials
AUTH_1002  - Token expired
USER_2001  - User not found
USER_2002  - User already exists
VAL_3001   - Validation failed
BOOKING_4001 - Booking not found
BOOKING_4005 - Slot unavailable
SYS_9001   - Internal server error
```

---

## 🔒 Security Features

- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Input Validation** - Comprehensive data validation
- ✅ **XSS Protection** - Input sanitization
- ✅ **CORS Configuration** - Controlled cross-origin requests
- ✅ **Rate Limiting** - API abuse prevention (Ready)
- ✅ **SQL Injection Prevention** - Mongoose parameterized queries
- ✅ **Role-Based Access** - Permission-based route protection

---

## 📱 Mobile App Integration

### Flutter App Compatibility
This backend is designed to work seamlessly with the Futsmandu Flutter mobile app:

- **Optimized Payloads** - Efficient JSON responses for mobile networks
- **Image Support** - Court image upload and retrieval
- **Real-Time Sync** - Live availability updates
- **Offline Ready** - Cache-friendly API design
- **Push Notifications** - Infrastructure ready for notifications

---

## 🚦 Development Status

### ✅ Completed Features
- Core authentication system with JWT
- User management (Players, Owners, Admins)
- Court and venue management
- Booking system with conflict prevention
- Real-time availability checks
- Error handling with industry standards
- Repository pattern for data access
- Type-safe codebase with TypeScript

### 🔄 In Progress
- Payment gateway integration (Khalti/eSewa)
- Advanced search with filters and sorting
- Email notifications system
- Owner analytics dashboard

### 📋 Planned Features
- Admin dashboard with system analytics
- Push notification service
- Booking reminders and alerts
- Review and rating system
- Tournament management module
- Revenue analytics for owners
- Mobile app deep linking

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Suite
```bash
npm test -- --grep "AuthService"
```

---

## 📊 Performance & Scalability

### Current Optimizations
- Database indexing on frequently queried fields
- Repository pattern for better data access
- Modular architecture for easy scaling
- Environment-based configuration
- Comprehensive error logging

### Future Scalability Plans
- Redis caching for frequently accessed data
- Database connection pooling
- Microservices architecture separation
- Load balancing setup
- CDN integration for static assets

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### 1. Fork the Repository
```bash
git clone https://github.com/yourusername/futsmandu-server.git
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

### 4. Commit Your Changes
```bash
git commit -m "feat: add new feature description"
```

### 5. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```

### Commit Message Convention
```
feat: New feature
fix: Bug fix
docs: Documentation changes
style: Code style changes (formatting)
refactor: Code refactoring
test: Adding tests
chore: Maintenance tasks
```

---

## 📝 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | development |
| `PORT` | Server port | Yes | 5000 |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes | - |
| `JWT_EXPIRES_IN` | Access token expiry | No | 15m |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | No | 7d |
| `LOG_LEVEL` | Logging level | No | info |
| `CORS_ORIGIN` | Allowed CORS origins | No | * |

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running:
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or using brew (macOS)
brew services start mongodb-community
```

### JWT Secret Warning
```bash
Warning: JWT_SECRET not set in environment
```
**Solution:** Create a `.env` file and add your JWT secrets:
```env
JWT_SECRET=your_super_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
```

### Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Kill the process or change the port:
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env
PORT=5001
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Express.js** - Fast, unopinionated web framework
- **Mongoose** - Elegant MongoDB object modeling
- **TypeScript** - Type safety and better developer experience
- **JWT** - Secure authentication standard
- **bcrypt** - Password hashing library

---

## 📞 Support & Contact

- **Email:** support@futsmandu.com
- **Website:** [www.futsmandu.com](https://www.futsmandu.com)
- **Issues:** [GitHub Issues](https://github.com/yourusername/futsmandu-server/issues)
- **Documentation:** [API Docs](https://docs.futsmandu.com)

---

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!

---

<div align="center">
  <p>Built with ❤️ by the Futsmandu Team</p>
  <p>© 2024 Futsmandu. All rights reserved.</p>
</div>