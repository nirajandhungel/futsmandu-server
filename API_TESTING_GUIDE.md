# API Testing Guide

## Quick Start

### 1. Start the Server
```bash
npm run dev
# or
npm run build && npm start
```

### 2. Verify Server is Running
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "...",
  "environment": "development",
  "version": "1.0.0",
  "uptime": 123,
  "memory": { ... },
  "database": { "status": "connected" }
}
```

---

## Testing Endpoints

### Test 1: Register User
```bash
curl -X POST http://localhost:5000/api/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "phoneNumber": "9841234567",
    "role": "PLAYER"
  }'
```

**Expected:** 201 Created with user data and tokens

---

### Test 2: Login
```bash
curl -X POST http://localhost:5000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "PLAYER"
  }'
```

**Expected:** 200 OK with tokens

**Save the accessToken for next requests:**
```bash
export ACCESS_TOKEN="your_access_token_here"
```

---

### Test 3: Get My Profile
```bash
curl -X GET http://localhost:5000/api/v2/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** 200 OK with user profile

---

### Test 4: Activate Owner Mode (FormData)
```bash
curl -X POST http://localhost:5000/api/v2/owner/activate \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "panNumber=123456789" \
  -F "address=123 Main Street, Kathmandu" \
  -F "phoneNumber=9876543210" \
  -F "additionalKyc={\"fullName\":\"Test Owner\",\"bankName\":\"Nepal Bank\"}" \
  -F "profilePhoto=@/path/to/profile.jpg" \
  -F "citizenshipFront=@/path/to/front.jpg" \
  -F "citizenshipBack=@/path/to/back.jpg"
```

**Expected:** 200 OK with updated user and new tokens

---

### Test 5: Create Venue (FormData)
```bash
curl -X POST http://localhost:5000/api/v2/owner/venues \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "name=Test Venue" \
  -F "description=Test venue description" \
  -F "location[address]=123 Test Street" \
  -F "location[city]=Kathmandu" \
  -F "contact[phone]=9841234567" \
  -F "openingHours[monday][open]=06:00" \
  -F "openingHours[monday][close]=22:00" \
  -F "openingHours[tuesday][open]=06:00" \
  -F "openingHours[tuesday][close]=22:00" \
  -F "openingHours[wednesday][open]=06:00" \
  -F "openingHours[wednesday][close]=22:00" \
  -F "openingHours[thursday][open]=06:00" \
  -F "openingHours[thursday][close]=22:00" \
  -F "openingHours[friday][open]=06:00" \
  -F "openingHours[friday][close]=22:00" \
  -F "openingHours[saturday][open]=06:00" \
  -F "openingHours[saturday][close]=22:00" \
  -F "openingHours[sunday][open]=06:00" \
  -F "openingHours[sunday][close]=22:00" \
  -F "courts[0][courtNumber]=1" \
  -F "courts[0][name]=Court 1" \
  -F "courts[0][size]=5v5" \
  -F "courts[0][hourlyRate]=2000"
```

**Expected:** 201 Created with venue and courts data

**Save venueId and courtId:**
```bash
export VENUE_ID="venue_id_from_response"
export COURT_ID="court_id_from_response"
```

---

### Test 6: Get My Venues
```bash
curl -X GET http://localhost:5000/api/v2/courts/owner/my-venues \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** 200 OK with venues and courts arrays

---

### Test 7: Search Venues (Public)
```bash
curl -X GET "http://localhost:5000/api/v2/courts/public/venues/search?city=Kathmandu"
```

**Expected:** 200 OK with venues array

---

### Test 8: Get Court Availability (Public)
```bash
curl -X GET "http://localhost:5000/api/v2/courts/public/courts/$COURT_ID/availability?date=2024-01-20"
```

**Expected:** 200 OK with available time slots

---

### Test 9: Create Booking
```bash
curl -X POST http://localhost:5000/api/v2/bookings \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"courtId\": \"$COURT_ID\",
    \"date\": \"2024-01-20\",
    \"startTime\": \"18:00\",
    \"endTime\": \"19:00\",
    \"bookingType\": \"FULL_TEAM\",
    \"groupType\": \"private\",
    \"maxPlayers\": 10
  }"
```

**Expected:** 201 Created with booking data

**Save bookingId:**
```bash
export BOOKING_ID="booking_id_from_response"
```

---

### Test 10: Get My Bookings
```bash
curl -X GET http://localhost:5000/api/v2/bookings/my \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** 200 OK with bookings array

---

### Test 11: Approve Booking (Owner)
```bash
curl -X PATCH http://localhost:5000/api/v2/owner/bookings/$BOOKING_ID/approve \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected:** 200 OK with updated booking

---

## Common Issues

### Issue: 401 Unauthorized
**Solution:** 
- Check if token is valid
- Token might be expired, use refresh token endpoint
- Ensure `Authorization: Bearer <token>` header is set

### Issue: 400 Validation Error
**Solution:**
- Check request body format
- Verify all required fields are present
- Check field types (string vs number)
- For FormData, ensure proper bracket notation

### Issue: 409 Conflict
**Solution:**
- Resource already exists (e.g., duplicate email)
- Use different values or update existing resource

### Issue: FormData Not Working
**Solution:**
- Use `-F` flag in curl (not `-d`)
- Ensure proper bracket notation: `courts[0][name]`
- For arrays: Use `amenities[]` or multiple fields
- Files must be actual file paths with `@` prefix

---

## Automated Testing Script

Create `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000/api/v2"

echo "1. Health Check..."
curl -s "$BASE_URL/../health" | jq .

echo -e "\n2. Register User..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "password123",
    "fullName": "Test User",
    "phoneNumber": "9841234567",
    "role": "PLAYER"
  }')

echo "$REGISTER_RESPONSE" | jq .
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.tokens.accessToken')

if [ "$ACCESS_TOKEN" = "null" ]; then
  echo "Registration failed!"
  exit 1
fi

echo -e "\n3. Get Profile..."
curl -s -X GET "$BASE_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

echo -e "\n✅ All tests passed!"
```

Make executable and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Postman Testing

See `POSTMAN_COLLECTION.md` for detailed Postman setup and collection.

---

## Database Verification

After creating a venue, verify in MongoDB:

```javascript
// Connect to MongoDB
use futsmandu

// Check venue was created
db.futsalvenues.find().pretty()

// Check courts were created
db.courts.find().pretty()

// Verify relationship
db.courts.find({ venueId: ObjectId("venue_id_here") })
```

---

## Performance Testing

### Load Test with Apache Bench
```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:5000/health

# Test authenticated endpoint (with token)
ab -n 100 -c 5 -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:5000/api/v2/users/me
```

---

## Security Testing

### Test Rate Limiting
```bash
# Make 100+ requests quickly
for i in {1..150}; do
  curl -X POST http://localhost:5000/api/v2/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong","role":"PLAYER"}' &
done
wait

# Should get 429 Too Many Requests after limit
```

### Test Authentication
```bash
# Test without token
curl -X GET http://localhost:5000/api/v2/users/me
# Expected: 401 Unauthorized

# Test with invalid token
curl -X GET http://localhost:5000/api/v2/users/me \
  -H "Authorization: Bearer invalid_token"
# Expected: 401 Unauthorized
```

---

## Monitoring

Check server logs:
```bash
# View logs
tail -f logs/combined.log

# View errors only
tail -f logs/error.log
```

---

## Next Steps

1. ✅ Test all endpoints
2. ✅ Verify FormData uploads work
3. ✅ Check database relationships
4. ✅ Test error handling
5. ✅ Verify rate limiting
6. ✅ Test authentication flow

