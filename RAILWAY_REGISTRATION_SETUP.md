# Railway Registration Feature Setup

Complete guide for setting up and testing the registration feature on Railway.

## Overview

The registration feature allows users to create accounts through:
1. **Frontend UI**: `/register` page with form
2. **API Endpoint**: `POST /api/v1/auth/register`

## Prerequisites

Before testing registration, ensure:
- ✅ Backend is deployed and running
- ✅ Frontend is deployed and running
- ✅ Database migrations are complete
- ✅ CORS is properly configured
- ✅ Environment variables are set

## Registration Endpoint

### API Endpoint

**URL:** `POST /api/v1/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "newuser",
  "password": "securepassword123"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "newuser",
  "tier": "basic",
  "is_active": true,
  "is_admin": false,
  "created_at": "2026-01-25T12:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Username or email already exists
- `422 Unprocessable Entity`: Validation errors

## Railway Configuration

### Backend Environment Variables

Ensure these are set in Railway backend service:

```bash
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT (required for token generation)
JWT_SECRET_KEY=your-secure-secret-key
JWT_ALGORITHM=HS256

# CORS (must include frontend domain)
BACKEND_CORS_ORIGINS=["https://ai.taysluxeacademy.com","https://taysluxeacademy.com"]

# Application
ENVIRONMENT=production
DEBUG=false
API_V1_PREFIX=/api/v1
```

### Frontend Environment Variables

Ensure these are set in Railway frontend service:

```bash
# API URL (must point to backend)
NEXT_PUBLIC_API_URL=https://ai.taysluxeacademy.com/api/v1

# Node Environment
NODE_ENV=production
```

## Testing Registration

### Method 1: Frontend UI

1. Navigate to your frontend URL:
   ```
   https://ai.taysluxeacademy.com/register
   ```

2. Fill in the registration form:
   - **Email**: Valid email address
   - **Username**: Unique username
   - **Password**: Minimum 8 characters
   - **Confirm Password**: Must match password

3. Click "Create account"

4. On success, you'll be redirected to `/login?registered=true`

5. Login with your new credentials

### Method 2: API (curl)

```bash
curl -X POST https://ai.taysluxeacademy.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpassword123"
  }'
```

### Method 3: API (Postman/Insomnia)

1. Create new POST request
2. URL: `https://ai.taysluxeacademy.com/api/v1/auth/register`
3. Headers: `Content-Type: application/json`
4. Body (JSON):
   ```json
   {
     "email": "user@example.com",
     "username": "newuser",
     "password": "securepassword123"
   }
   ```

## Registration Flow

1. **User submits registration form**
   - Frontend validates password match and length
   - Frontend sends POST request to `/api/v1/auth/register`

2. **Backend validates request**
   - Checks if username already exists
   - Checks if email already exists
   - Validates email format
   - Validates password length (min 8 characters)

3. **User creation**
   - Password is hashed with bcrypt
   - User is created with Basic tier
   - 7-day trial period is set for Basic tier users
   - User is set as active

4. **Response**
   - Returns user data (without password)
   - Frontend redirects to login page
   - Success message is displayed

## Troubleshooting

### Issue: CORS Error

**Symptoms:**
- Browser console shows CORS error
- Registration request fails

**Solution:**
1. Check `BACKEND_CORS_ORIGINS` includes your frontend domain
2. Ensure it's an array format: `["https://ai.taysluxeacademy.com"]`
3. Redeploy backend after changing CORS settings

### Issue: 400 Bad Request - Username/Email Already Exists

**Symptoms:**
- Registration fails with "Username already registered" or "Email already registered"

**Solution:**
- This is expected behavior - choose a different username/email
- Or delete existing user from database

### Issue: Frontend Can't Connect to Backend

**Symptoms:**
- Registration form submits but nothing happens
- Network error in browser console

**Solution:**
1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check backend is running and accessible
3. Verify API endpoint is correct: `/api/v1/auth/register`
4. Check Railway service logs for errors

### Issue: Database Connection Error

**Symptoms:**
- Registration fails with database error
- 500 Internal Server Error

**Solution:**
1. Verify `DATABASE_URL` is set correctly in Railway
2. Check database service is running
3. Verify migrations are complete: `railway run alembic upgrade head`
4. Check Railway logs for database connection errors

### Issue: JWT Token Errors

**Symptoms:**
- Registration succeeds but login fails
- Token generation errors

**Solution:**
1. Verify `JWT_SECRET_KEY` is set in Railway
2. Ensure it's a secure random string (use `openssl rand -hex 32`)
3. Check `JWT_ALGORITHM` is set to `HS256`

## Registration Validation Rules

- **Email**: Must be valid email format, unique
- **Username**: Must be unique, no special characters required
- **Password**: Minimum 8 characters, no maximum (but bcrypt has 72 byte limit)

## Default User Settings

New users are created with:
- **Tier**: Basic (can be upgraded later)
- **Status**: Active
- **Admin**: False
- **Trial Period**: 7 days (for Basic tier only)
- **Trial Start**: Current date/time
- **Trial End**: 7 days from creation

## Security Considerations

1. **Password Hashing**: All passwords are hashed with bcrypt before storage
2. **Input Validation**: Email and username are validated on both frontend and backend
3. **CORS Protection**: Only allowed origins can make registration requests
4. **Rate Limiting**: Registration endpoint is subject to rate limiting (if configured)
5. **No Email Verification**: Currently, email verification is not required (can be added later)

## Next Steps After Registration

After a user registers:

1. **Login**: User can immediately login with new credentials
2. **Trial Period**: Basic tier users get 7-day trial
3. **Usage Limits**: Basic tier has 50 messages/month limit
4. **Upgrade**: Users can be upgraded to VIP tier by admin

## Monitoring Registration

To monitor registrations in Railway:

1. **Backend Logs**: Check Railway backend service logs
2. **Database**: Query users table to see new registrations
3. **Metrics**: Track registration endpoint calls in Railway metrics

## Production Checklist

Before enabling registration in production:

- [ ] CORS is properly configured
- [ ] JWT_SECRET_KEY is set and secure
- [ ] Database migrations are complete
- [ ] Rate limiting is configured (optional but recommended)
- [ ] Frontend API URL is correct
- [ ] SSL/HTTPS is enabled
- [ ] Error handling is tested
- [ ] Registration flow is tested end-to-end

## Additional Resources

- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Security Audit](./SECURITY_AUDIT.md)
