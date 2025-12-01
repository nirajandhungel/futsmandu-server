# API Documentation Summary

## 📚 Documentation Files

1. **API_DOCUMENTATION.md** - Complete API reference with all endpoints
2. **POSTMAN_COLLECTION.md** - Postman collection with ready-to-use requests
3. **API_TESTING_GUIDE.md** - Step-by-step testing guide with curl commands

---

## 🔑 Key Information

### Base URL
```
https://futsmandu-server.onrender.com/futsmandu/api/v2
```

### Response Format
- **Success:** `{ success: true, message, data, statusCode, pagination? }`
- **Error:** `{ success: false, error: { code, message, details }, meta: { timestamp, path, method } }`

---

## 📝 FormData vs JSON Endpoints

### ⚠️ FormData Endpoints (Image Uploads)

1. **POST `/api/v2/owner/activate`**
   - Owner documents upload
   - Fields: `panNumber`, `address`, `phoneNumber`, `additionalKyc`, `profilePhoto`, `citizenshipFront`, `citizenshipBack`

2. **POST `/api/v2/owner/venues`**
   - Venue and court creation with images
   - Complex nested structure with `courts[0][name]`, `amenities[]`, etc.
   - See full example in documentation

### ✅ JSON Endpoints

All other endpoints use `application/json`:
- Authentication (register, login, logout, refresh)
- User management
- Booking operations
- Court/Venue queries
- Admin operations

---

## 🎯 Quick Reference

### Authentication Flow
```
1. Register → Get tokens
2. Login → Get tokens
3. Use token in Authorization header
4. Refresh token when expired
```

### Owner Flow
```
1. Register as PLAYER
2. Activate Owner Mode (FormData with documents)
3. Wait for admin approval
4. Create Venue (FormData with courts)
5. Manage bookings
```

### Booking Flow
```
1. Search venues/courts (public)
2. Check availability (public)
3. Create booking (authenticated)
4. Join/leave bookings
5. Owner approves/rejects
```

---

## 📋 Endpoint Categories

### Public (No Auth)
- Health check
- Search venues/courts
- Get venue/court details
- Get court availability
- Get joinable bookings

### Player (Auth Required)
- User profile management
- Create bookings
- Join/leave bookings
- Invite players

### Owner (Auth + Owner Role)
- Owner profile
- Create venues (FormData)
- Manage courts
- Approve/reject bookings
- Dashboard analytics

### Admin (Auth + Admin Role)
- Dashboard stats
- Owner request management
- User management
- Venue verification

---

## 🧪 Testing Checklist

- [ ] Health check works
- [ ] User registration works
- [ ] Login returns tokens
- [ ] Token authentication works
- [ ] Owner activation (FormData) works
- [ ] Venue creation (FormData) works
- [ ] Courts are created in database
- [ ] Venue-court relationships exist
- [ ] Booking creation works
- [ ] Booking approval works
- [ ] Error responses are correct
- [ ] Rate limiting works

---

## 📖 Documentation Structure

### API_DOCUMENTATION.md Contains:
1. Response format explanation
2. Authentication guide
3. All endpoints with:
   - HTTP method and path
   - Content-Type (JSON/FormData)
   - Request body examples
   - Response examples
   - Query parameters
4. Application flow diagrams
5. Error response examples
6. Health check endpoint

### POSTMAN_COLLECTION.md Contains:
1. Environment setup
2. Ready-to-use request examples
3. Test scripts for token management
4. Complete test flow
5. Testing tips

### API_TESTING_GUIDE.md Contains:
1. Quick start guide
2. cURL command examples
3. Automated testing script
4. Common issues and solutions
5. Database verification
6. Performance testing
7. Security testing

---

## 🚀 Getting Started

1. **Read:** `API_DOCUMENTATION.md` for complete reference
2. **Setup:** Postman environment using `POSTMAN_COLLECTION.md`
3. **Test:** Use `API_TESTING_GUIDE.md` for step-by-step testing
4. **Verify:** Check database relationships after creating venues

---

## 💡 Pro Tips

1. **FormData Arrays:**
   - Use `amenities[]` for arrays
   - Use `courts[0][name]` for nested objects
   - Multiple files: Add same field name multiple times

2. **Token Management:**
   - Save tokens in Postman environment
   - Use refresh token before expiry
   - Check token in Authorization header

3. **Error Debugging:**
   - Check `error.details` for validation errors
   - Review `meta.path` for endpoint issues
   - Check server logs for detailed errors

4. **Database Verification:**
   - Verify venue created: `db.futsalvenues.find()`
   - Verify courts created: `db.courts.find()`
   - Check relationships: `db.courts.find({ venueId: ... })`

---

## 📞 Support

For issues:
1. Check error response details
2. Review server logs
3. Verify request format matches documentation
4. Check database connection
5. Verify environment variables

---

## ✅ Documentation Status

- ✅ All endpoints documented
- ✅ Request/Response examples provided
- ✅ FormData examples included
- ✅ Error responses documented
- ✅ Testing guides created
- ✅ Postman collection ready
- ✅ cURL examples provided

**Last Updated:** 2024-01-15

