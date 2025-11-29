# FUTSMANDU API Documentation

## Base URL
```
http://localhost:5000/api/v1
```
*Note: API prefix is configurable via `API_PREFIX` environment variable (default: `/api/v1`)*

## Authentication

Most endpoints require authentication using JWT Bearer tokens.

**Header Format:**
```
Authorization: Bearer <access_token>
```

---

## 📋 Table of Contents

1. [Authentication Endpoints](#authentication-endpoints)
2. [User Endpoints](#user-endpoints)
3. [Owner Endpoints](#owner-endpoints)
4. [Court & Venue Endpoints](#court--venue-endpoints)
5. [Booking Endpoints](#booking-endpoints)
6. [Admin Endpoints](#admin-endpoints)
7. [Match Endpoints](#match-endpoints)
8. [Application Flow](#application-flow)

---

## 🔐 Authentication Endpoints

### 1. Register User
**POST** `/api/v1/auth/register`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phoneNumber": "9841234567",
  "role": "PLAYER"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "PLAYER"
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

---

### 2. Login
**POST** `/api/v1/auth/login`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "PLAYER"
    },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

---

### 3. Logout
**POST** `/api/v1/auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 4. Refresh Token
**POST** `/api/v1/auth/refresh-token`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "refreshToken": "..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

## 👤 User Endpoints

All user endpoints require authentication.

### 1. Get My Profile
**GET** `/api/v1/users/me`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "fullName": "John Doe",
      "phoneNumber": "9841234567",
      "role": "PLAYER"
    }
  }
}
```

---

### 2. Update Profile
**PATCH** `/api/v1/users/update`

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "fullName": "John Updated",
  "phoneNumber": "9841234568"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { ... }
  }
}
```

---

### 3. Change Password
**POST** `/api/v1/users/change-password`

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 🏢 Owner Endpoints

### 1. Activate Owner Mode
**POST** `/api/v1/owner/activate`

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `multipart/form-data` ⚠️ **FormData Required**

**Request Body (FormData):**
```
panNumber: "123456789"
address: "123 Main Street, Kathmandu"
additionalKyc: {"field1": "value1"} (optional, can be JSON string)
profilePhoto: [File] (required)
citizenshipFront: [File] (required)
citizenshipBack: [File] (required)
```

**Response (200):**
```json
{
  "success": true,
  "message": "Owner mode enabled successfully",
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

---

### 2. Get Owner Profile
**GET** `/api/v1/owner/profile`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "mode": "OWNER",
    "ownerProfile": {
      "status": "PENDING",
      "panNumber": "...",
      "profilePhotoUrl": "...",
      "citizenshipFrontUrl": "...",
      "citizenshipBackUrl": "..."
    }
  }
}
```

---

### 3. Create Venue with Courts ⭐
**POST** `/api/v1/owner/venues`

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `multipart/form-data` ⚠️ **FormData Required**

**Request Body (FormData):**

#### Venue Information:
```
name: Premium Futsal Arena
description: A state-of-the-art futsal facility
location[address]: 123 Sports Street
location[city]: Kathmandu
location[state]: Bagmati (optional)
location[coordinates][latitude]: 27.7172 (optional)
location[coordinates][longitude]: 85.3240 (optional)
contact[phone]: 9841234567
contact[email]: info@venue.com (optional)
contact[website]: https://venue.com (optional)
amenities[]: Parking
amenities[]: Changing Room
amenities[]: Snack Bar
```

#### Opening Hours (All 7 days required):
```
openingHours[monday][open]: 06:00
openingHours[monday][close]: 22:00
openingHours[tuesday][open]: 06:00
openingHours[tuesday][close]: 22:00
openingHours[wednesday][open]: 06:00
openingHours[wednesday][close]: 22:00
openingHours[thursday][open]: 06:00
openingHours[thursday][close]: 22:00
openingHours[friday][open]: 06:00
openingHours[friday][close]: 22:00
openingHours[saturday][open]: 06:00
openingHours[saturday][close]: 22:00
openingHours[sunday][open]: 06:00
openingHours[sunday][close]: 22:00
```

#### Court Information (At least one required):
```
courts[0][courtNumber]: 1
courts[0][name]: Main Court
courts[0][size]: 5v5
courts[0][hourlyRate]: 2000
courts[0][amenities][]: Air Conditioning (optional)
courts[0][amenities][]: LED Lights (optional)
```

#### Images (Optional):
```
venueImages: [File] (multiple files allowed)
courtImages[0]: [File] (images for first court)
courtImages[1]: [File] (images for second court)
```

**Response (201):**
```json
{
  "success": true,
  "message": "Venue created successfully with courts",
  "data": {
    "venue": {
      "id": "...",
      "name": "Premium Futsal Arena",
      "courts": [
        {
          "id": "...",
          "courtNumber": "1",
          "name": "Main Court",
          "size": "5v5",
          "hourlyRate": 2000,
          "peakHourRate": 2500,
          "maxPlayers": 10,
          "openingTime": "06:00",
          "closingTime": "22:00"
        }
      ],
      "totalCourts": 1,
      "activeCourts": 1
    }
  }
}
```

---

### 4. Get Owner Dashboard
**GET** `/api/v1/owner/dashboard`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalVenues": 2,
      "totalCourts": 5,
      "activeCourts": 5,
      "totalBookings": 150,
      "confirmedBookings": 120,
      "pendingBookings": 10
    },
    "revenue": {
      "total": 500000,
      "completed": 450000,
      "last7Days": 50000,
      "last30Days": 200000
    },
    "bookings": {
      "last7Days": 20,
      "last30Days": 80
    },
    "insights": {
      "peakHours": ["18:00", "19:00", "20:00"],
      "averageBookingValue": 4166.67
    }
  }
}
```

---

### 5. Deactivate Owner Mode
**POST** `/api/v1/owner/deactivate`

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "reason": "Temporary deactivation" (optional)
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Owner mode disabled. You are back in player mode.",
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

---

### 6. Approve Booking
**PATCH** `/api/v1/owner/bookings/:id/approve`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Booking approved successfully",
  "data": {
    "booking": { ... }
  }
}
```

---

### 7. Reject Booking
**PATCH** `/api/v1/owner/bookings/:id/reject`

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "reason": "Court unavailable at requested time"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking rejected successfully",
  "data": {
    "booking": { ... }
  }
}
```

---

## 🏟️ Court & Venue Endpoints

### Public Endpoints (No Authentication)

### 1. Search Venues
**GET** `/api/v1/courts/public/venues/search?city=Kathmandu&minRating=4`

**Query Parameters:**
- `name` (string, optional)
- `city` (string, optional)
- `amenities` (string[], optional)
- `minRating` (number, optional)
- `isVerified` (boolean, optional)
- `latitude` (number, optional)
- `longitude` (number, optional)
- `radius` (number, optional) - in kilometers

**Response (200):**
```json
{
  "success": true,
  "data": {
    "venues": [
      {
        "id": "...",
        "name": "Premium Futsal Arena",
        "location": { ... },
        "rating": 4.5,
        "totalReviews": 50
      }
    ],
    "count": 1
  }
}
```

---

### 2. Get All Venues
**GET** `/api/v1/courts/public/venues`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "venues": [ ... ],
    "count": 10
  }
}
```

---

### 3. Get Venue by ID
**GET** `/api/v1/courts/public/venues/:venueId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "venue": {
      "id": "...",
      "name": "Premium Futsal Arena",
      "description": "...",
      "location": { ... },
      "contact": { ... },
      "openingHours": { ... },
      "images": [ ... ],
      "rating": 4.5,
      "totalReviews": 50
    }
  }
}
```

---

### 4. Get Venue with Courts
**GET** `/api/v1/courts/public/venues/:venueId/courts`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Premium Futsal Arena",
    "courts": [
      {
        "id": "...",
        "courtNumber": "1",
        "name": "Main Court",
        "size": "5v5",
        "hourlyRate": 2000,
        "isAvailable": true
      }
    ],
    "totalCourts": 1,
    "activeCourts": 1
  }
}
```

---

### 5. Get Court by ID
**GET** `/api/v1/courts/public/courts/:courtId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "court": {
      "id": "...",
      "courtNumber": "1",
      "name": "Main Court",
      "size": "5v5",
      "hourlyRate": 2000,
      "peakHourRate": 2500,
      "maxPlayers": 10,
      "openingTime": "06:00",
      "closingTime": "22:00",
      "amenities": ["Air Conditioning", "LED Lights"],
      "images": [ ... ]
    }
  }
}
```

---

### 6. Get Court Availability
**GET** `/api/v1/courts/public/courts/:courtId/availability?date=2024-01-15`

**Query Parameters:**
- `date` (required) - Format: YYYY-MM-DD

**Response (200):**
```json
{
  "success": true,
  "data": {
    "courtId": "...",
    "courtName": "Main Court",
    "date": "2024-01-15",
    "availableSlots": ["06:00", "07:00", "08:00", ...],
    "hourlyRate": 2000,
    "peakHourRate": 2500
  }
}
```

---

### 7. Search Courts
**GET** `/api/v1/courts/public/courts/search?size=5v5&minRate=1500&maxRate=3000`

**Query Parameters:**
- `venueId` (string, optional)
- `size` (string, optional) - 5v5, 6v6, 7v7
- `minRate` (number, optional)
- `maxRate` (number, optional)
- `isActive` (boolean, optional)
- `isAvailable` (boolean, optional)
- `minPlayers` (number, optional)
- `maxPlayers` (number, optional)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "courts": [ ... ],
    "count": 5
  }
}
```

---

### Owner-Only Endpoints

### 8. Add Court to Venue
**POST** `/api/v1/courts/venues/:venueId/courts`

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "courtNumber": "2",
  "name": "Court 2",
  "size": "6v6",
  "hourlyRate": 2500,
  "maxPlayers": 12,
  "openingTime": "06:00",
  "closingTime": "22:00",
  "peakHourRate": 3125,
  "amenities": ["Air Conditioning"],
  "isActive": true,
  "isAvailable": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "court": { ... }
  }
}
```

---

### 9. Get My Venues
**GET** `/api/v1/courts/owner/my-venues`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "venues": [ ... ],
    "courts": [ ... ],
    "totalVenues": 2,
    "totalCourts": 5
  }
}
```

---

### 10. Update Court
**PUT** `/api/v1/courts/courts/:courtId`

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "name": "Updated Court Name",
  "hourlyRate": 2200,
  "isAvailable": false
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Data saved successfully",
  "data": {
    "court": { ... }
  }
}
```

---

### 11. Delete Court
**DELETE** `/api/v1/courts/courts/:courtId`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Data deleted successfully"
}
```

---

### Admin-Only Endpoints

### 12. Get All Venues (Admin)
**GET** `/api/v1/courts/admin/venues`

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "venues": [ ... ],
    "count": 10
  }
}
```

---

### 13. Verify Venue
**PATCH** `/api/v1/courts/admin/venues/:venueId/verify`

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Venue verified successfully",
  "data": {
    "venue": { ... }
  }
}
```

---

### 14. Suspend Venue
**PATCH** `/api/v1/courts/admin/venues/:venueId/suspend`

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Venue suspended successfully",
  "data": {
    "venue": { ... }
  }
}
```

---

### 15. Activate Venue
**PATCH** `/api/v1/courts/admin/venues/:venueId/activate`

**Headers:** `Authorization: Bearer <admin_token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Venue activated successfully",
  "data": {
    "venue": { ... }
  }
}
```

---

## 📅 Booking Endpoints

### 1. Create Booking
**POST** `/api/v1/bookings`

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "courtId": "...",
  "date": "2024-01-15",
  "startTime": "18:00",
  "endTime": "19:00",
  "playerCount": 10
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "...",
      "courtId": "...",
      "date": "2024-01-15",
      "startTime": "18:00",
      "endTime": "19:00",
      "totalAmount": 2000,
      "status": "PENDING"
    }
  }
}
```

---

### 2. Get My Bookings
**GET** `/api/v1/bookings/my`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bookings": [ ... ],
    "count": 5
  }
}
```

---

### 3. Get Booking by ID
**GET** `/api/v1/bookings/:id`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "booking": { ... }
  }
}
```

---

### 4. Join Booking
**POST** `/api/v1/bookings/:id/join`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Joined booking successfully",
  "data": {
    "booking": { ... }
  }
}
```

---

### 5. Leave Booking
**POST** `/api/v1/bookings/:id/leave`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Left booking successfully"
}
```

---

### 6. Invite Players
**POST** `/api/v1/bookings/:id/invite`

**Headers:** `Authorization: Bearer <token>`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "playerIds": ["id1", "id2", "id3"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Invitations sent successfully"
}
```

---

### 7. Get Joinable Bookings (Public)
**GET** `/api/v1/bookings/joinable`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bookings": [ ... ],
    "count": 3
  }
}
```

---

## 👨‍💼 Admin Endpoints

All admin endpoints require `Authorization: Bearer <admin_token>`

### 1. Get Dashboard Stats
**GET** `/api/v1/admin/dashboard/stats`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "totalOwners": 50,
    "totalVenues": 30,
    "totalBookings": 5000,
    "pendingOwnerRequests": 5
  }
}
```

---

### 2. Get Pending Owner Requests
**GET** `/api/v1/admin/owners/pending`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "owners": [ ... ],
    "count": 5
  }
}
```

---

### 3. Approve Owner Request
**PATCH** `/api/v1/admin/owners/:ownerId/approve`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "status": "APPROVED",
  "remarks": "All documents verified" (optional)
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Owner request approved successfully"
}
```

---

### 4. Update Owner Status
**PATCH** `/api/v1/admin/owners/:ownerId/status`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "status": "APPROVED",
  "remarks": "Status updated" (optional)
}
```

---

### 5. Get All Users
**GET** `/api/v1/admin/users`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [ ... ],
    "count": 1000
  }
}
```

---

### 6. Get User by ID
**GET** `/api/v1/admin/users/:userId`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
```

---

### 7. Update User Status
**PATCH** `/api/v1/admin/users/:userId/status`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "isActive": false,
  "reason": "Violation of terms" (optional)
}
```

---

### 8. Delete User
**DELETE** `/api/v1/admin/users/:userId`

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 9. Get All Venues (Admin)
**GET** `/api/v1/admin/venues`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "venues": [ ... ],
    "count": 30
  }
}
```

---

### 10. Verify Venue
**PATCH** `/api/v1/admin/venues/:venueId/verify`

**Response (200):**
```json
{
  "success": true,
  "message": "Venue verified successfully"
}
```

---

### 11. Suspend Venue
**PATCH** `/api/v1/admin/venues/:venueId/suspend`

**Response (200):**
```json
{
  "success": true,
  "message": "Venue suspended successfully"
}
```

---

### 12. Reactivate Venue
**PATCH** `/api/v1/admin/venues/:venueId/reactivate`

**Response (200):**
```json
{
  "success": true,
  "message": "Venue reactivated successfully"
}
```

---

## 🎮 Match Endpoints

### 1. Get Public Group Matches
**GET** `/api/v1/matches/groups`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "matches": [ ... ],
    "count": 10
  }
}
```

---

### 2. Join Group Match
**POST** `/api/v1/matches/groups/:id/join`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Joined group match successfully"
}
```

---

## 📊 Application Flow

### User Journey

1. **Registration/Login**
   - User registers or logs in
   - Receives access token and refresh token

2. **Browse Venues & Courts**
   - Public endpoints to search and view venues/courts
   - Check court availability

3. **Create Booking**
   - Authenticated user creates booking
   - Booking status: PENDING → CONFIRMED → COMPLETED

4. **Join/Leave Bookings**
   - Users can join existing bookings
   - Users can leave bookings

### Owner Journey

1. **Activate Owner Mode**
   - Submit documents (FormData with images)
   - Status: PENDING → APPROVED (by admin)

2. **Create Venue**
   - Create venue with courts (FormData)
   - Upload venue and court images

3. **Manage Bookings**
   - Approve/reject bookings
   - View dashboard analytics

### Admin Journey

1. **Review Owner Requests**
   - View pending owner requests
   - Approve/reject with remarks

2. **Manage Venues**
   - Verify venues
   - Suspend/reactivate venues

3. **User Management**
   - View all users
   - Update user status
   - Delete users

---

## 🔑 Key Points

### FormData Endpoints (Image Uploads)
- ✅ `POST /api/v1/owner/activate` - Owner documents
- ✅ `POST /api/v1/owner/venues` - Venue and court images

### JSON Endpoints
- ✅ All other endpoints use `application/json`

### Authentication
- Most endpoints require `Authorization: Bearer <token>`
- Public endpoints: Search, view venues/courts, joinable bookings

### Rate Limiting
- Auth endpoints: Stricter rate limiting
- General endpoints: 100 requests per 15 minutes per IP

---

## 🧪 Testing

See `API_TESTING.md` for Postman collection and test examples.

