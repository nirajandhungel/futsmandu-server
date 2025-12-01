# Postman Collection Guide

## Quick Setup

1. **Create Environment:**
   - Name: `FUTSMANDU Local`
   - Variables:
     - `baseUrl`: `https://futsmandu-server.onrender.com/futsmandu/api/v2`
     - `accessToken`: (leave empty, will be set automatically)
     - `refreshToken`: (leave empty, will be set automatically)

2. **Import Collection:**
   - Use the examples below to create requests in Postman

---

## Request Examples

### 1. Health Check
```
GET {{baseUrl}}/../health
```

---

### 2. Register User
```
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "password123",
  "fullName": "John Player",
  "phoneNumber": "9841234567",
  "role": "PLAYER"
}
```

**Tests Script (to save token):**
```javascript
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    pm.environment.set("accessToken", jsonData.data.tokens.accessToken);
    pm.environment.set("refreshToken", jsonData.data.tokens.refreshToken);
}
```

---

### 3. Login
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "password123",
  "role": "PLAYER"
}
```

**Tests Script:**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("accessToken", jsonData.data.tokens.accessToken);
    pm.environment.set("refreshToken", jsonData.data.tokens.refreshToken);
}
```

---

### 4. Activate Owner Mode (FormData)
```
POST {{baseUrl}}/owner/activate
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data

Body (form-data):
- panNumber: 123456789
- address: 123 Main Street, Kathmandu
- phoneNumber: 9876543210
- additionalKyc: {"fullName": "John Owner", "bankName": "Nepal Bank", "bankAccountNumber": "1234567890", "citizenshipNumber": "12345-67890"}
- profilePhoto: [Select File]
- citizenshipFront: [Select File]
- citizenshipBack: [Select File]
```

**Tests Script:**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("accessToken", jsonData.data.tokens.accessToken);
    pm.environment.set("refreshToken", jsonData.data.tokens.refreshToken);
}
```

---

### 5. Create Venue with Courts (FormData) ⭐
```
POST {{baseUrl}}/owner/venues
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data

Body (form-data):

Venue Info:
- name: Premium Futsal Arena
- description: A state-of-the-art futsal facility with modern amenities
- location[address]: 123 Sports Street
- location[city]: Kathmandu
- location[state]: Bagmati
- location[coordinates][latitude]: 27.7172
- location[coordinates][longitude]: 85.3240
- contact[phone]: 9841234567
- contact[email]: info@premiumfutsal.com
- contact[website]: https://premiumfutsal.com
- amenities[]: Parking
- amenities[]: Changing Room
- amenities[]: Snack Bar
- amenities[]: Flood Lights

Opening Hours (All 7 days):
- openingHours[monday][open]: 06:00
- openingHours[monday][close]: 22:00
- openingHours[tuesday][open]: 06:00
- openingHours[tuesday][close]: 22:00
- openingHours[wednesday][open]: 06:00
- openingHours[wednesday][close]: 22:00
- openingHours[thursday][open]: 06:00
- openingHours[thursday][close]: 22:00
- openingHours[friday][open]: 06:00
- openingHours[friday][close]: 22:00
- openingHours[saturday][open]: 06:00
- openingHours[saturday][close]: 22:00
- openingHours[sunday][open]: 06:00
- openingHours[sunday][close]: 22:00

Court 1 (Required - Only 4 fields):
- courts[0][courtNumber]: 1
- courts[0][name]: Main Court
- courts[0][size]: 5v5
- courts[0][hourlyRate]: 2000
- courts[0][amenities][]: Air Conditioning
- courts[0][amenities][]: LED Lights

Court 2 (Optional):
- courts[1][courtNumber]: 2
- courts[1][name]: Court 2
- courts[1][size]: 6v6
- courts[1][hourlyRate]: 2500

Images (Optional):
- venueImages: [Select File] (multiple)
- courtImages[0]: [Select File] (for first court)
- courtImages[1]: [Select File] (for second court)
```

---

### 6. Get My Venues
```
GET {{baseUrl}}/courts/owner/my-venues
Authorization: Bearer {{accessToken}}
```

---

### 7. Get Owner Dashboard
```
GET {{baseUrl}}/owner/dashboard
Authorization: Bearer {{accessToken}}
```

---

### 8. Search Venues (Public)
```
GET {{baseUrl}}/courts/public/venues/search?city=Kathmandu&minRating=4
```

---

### 9. Get Venue by ID (Public)
```
GET {{baseUrl}}/courts/public/venues/{{venueId}}
```

---

### 10. Get Venue with Courts (Public)
```
GET {{baseUrl}}/courts/public/venues/{{venueId}}/courts
```

---

### 11. Get Court Availability (Public)
```
GET {{baseUrl}}/courts/public/courts/{{courtId}}/availability?date=2024-01-20
```

---

### 12. Create Booking
```
POST {{baseUrl}}/bookings
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "courtId": "{{courtId}}",
  "date": "2024-01-20",
  "startTime": "18:00",
  "endTime": "19:00",
  "bookingType": "FULL_TEAM",
  "groupType": "private",
  "maxPlayers": 10
}
```

---

### 13. Get My Bookings
```
GET {{baseUrl}}/bookings/my
Authorization: Bearer {{accessToken}}
```

---

### 14. Join Booking
```
POST {{baseUrl}}/bookings/{{bookingId}}/join
Authorization: Bearer {{accessToken}}
```

---

### 15. Leave Booking
```
POST {{baseUrl}}/bookings/{{bookingId}}/leave
Authorization: Bearer {{accessToken}}
```

---

### 16. Invite Players
```
POST {{baseUrl}}/bookings/{{bookingId}}/invite
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "userIds": ["userId1", "userId2", "userId3"]
}
```

---

### 17. Approve Booking (Owner)
```
PATCH {{baseUrl}}/owner/bookings/{{bookingId}}/approve
Authorization: Bearer {{accessToken}}
```

---

### 18. Reject Booking (Owner)
```
PATCH {{baseUrl}}/owner/bookings/{{bookingId}}/reject
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "reason": "Court unavailable at requested time"
}
```

---

### 19. Get Joinable Bookings (Public)
```
GET {{baseUrl}}/bookings/joinable
```

---

### 20. Get My Profile
```
GET {{baseUrl}}/users/me
Authorization: Bearer {{accessToken}}
```

---

### 21. Update Profile
```
PATCH {{baseUrl}}/users/update
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "fullName": "John Updated",
  "phoneNumber": "9841234568"
}
```

---

### 22. Change Password
```
POST {{baseUrl}}/users/change-password
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

---

### 23. Refresh Token
```
POST {{baseUrl}}/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "{{refreshToken}}"
}
```

**Tests Script:**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("accessToken", jsonData.data.accessToken);
    pm.environment.set("refreshToken", jsonData.data.refreshToken);
}
```

---

### 24. Logout
```
POST {{baseUrl}}/auth/logout
Authorization: Bearer {{accessToken}}
```

---

## Admin Endpoints (Require Admin Token)

### 25. Get Dashboard Stats
```
GET {{baseUrl}}/admin/dashboard/stats
Authorization: Bearer {{adminAccessToken}}
```

### 26. Get Pending Owner Requests
```
GET {{baseUrl}}/admin/owners/pending
Authorization: Bearer {{adminAccessToken}}
```

### 27. Approve Owner Request
```
PATCH {{baseUrl}}/admin/owners/{{ownerId}}/approve
Authorization: Bearer {{adminAccessToken}}
Content-Type: application/json

{
  "status": "APPROVED",
  "remarks": "All documents verified"
}
```

### 28. Verify Venue
```
PATCH {{baseUrl}}/admin/venues/{{venueId}}/verify
Authorization: Bearer {{adminAccessToken}}
```

---

## Testing Tips

1. **Save Variables Automatically:**
   - Use Tests scripts to save tokens after login/register
   - Use `pm.environment.set("variableName", value)`

2. **FormData in Postman:**
   - Select "Body" → "form-data"
   - For arrays: Add multiple fields with same name or use `amenities[]`
   - For nested: Use bracket notation `location[address]`
   - For files: Select "File" type

3. **Error Handling:**
   - Check response status codes
   - Review error.details for validation errors
   - Check error.meta.path for endpoint issues

4. **Rate Limiting:**
   - Auth endpoints have stricter limits
   - Wait 15 minutes if you hit rate limit
   - Use different IPs for testing

---

## Complete Test Flow

1. ✅ Health Check
2. ✅ Register User → Save tokens
3. ✅ Get My Profile
4. ✅ Activate Owner Mode (FormData) → Update tokens
5. ✅ Get Owner Profile
6. ✅ Create Venue (FormData)
7. ✅ Get My Venues → Save venueId and courtId
8. ✅ Search Venues (Public)
9. ✅ Get Venue with Courts (Public)
10. ✅ Get Court Availability (Public)
11. ✅ Create Booking → Save bookingId
12. ✅ Get My Bookings
13. ✅ Approve Booking (as Owner)
14. ✅ Get Joinable Bookings (Public)

