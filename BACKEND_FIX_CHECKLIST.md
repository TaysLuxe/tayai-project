# Backend Fix Checklist for https://api.taysluxeacademy.com

## Current Status
The backend code has been updated with proper CORS parsing. Now verify Railway configuration.

## Railway Backend Service Configuration

### Step 1: Verify Backend is Running
1. Go to Railway Dashboard → **Backend Service**
2. Check service status is **"Active"** and **"Deployed"**
3. Check logs for any errors
4. Look for startup messages showing CORS origins

### Step 2: Verify Custom Domain
1. Railway Dashboard → Backend Service → **Networking** tab
2. Verify `api.taysluxeacademy.com` is listed under **Custom Domains**
3. Check SSL certificate status (should be green/active)
4. If not configured:
   - Click **"Custom Domain"**
   - Enter: `api.taysluxeacademy.com`
   - Add DNS records as instructed
   - Wait for DNS propagation (5-15 minutes)

### Step 3: Test Backend Directly
Open in browser or use curl:
```
https://api.taysluxeacademy.com/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-01-26T..."
}
```

**If this fails:**
- Backend domain is not accessible
- Check DNS propagation: https://dnschecker.org
- Verify custom domain is configured in Railway
- Check backend service logs for errors

### Step 4: Verify Environment Variables

In Railway Backend Service → **Variables**, ensure these are set:

#### Required Variables:
```bash
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# CORS (CRITICAL - must include frontend domain)
BACKEND_CORS_ORIGINS=["https://ai.taysluxeacademy.com","https://taysluxeacademy.com"]

# Application
ENVIRONMENT=production
DEBUG=false
API_V1_PREFIX=/api/v1

# JWT
JWT_SECRET_KEY=<your-secret-key>

# OpenAI
OPENAI_API_KEY=<your-openai-key>
```

#### Important Notes:
- `BACKEND_CORS_ORIGINS` must be valid JSON array format
- Must include `https://ai.taysluxeacademy.com` (frontend domain)
- Do NOT include `https://api.taysluxeacademy.com` (backend's own domain)

### Step 5: Check Backend Logs

After setting variables, check logs for:
```
Starting TayAI API...
Environment: production
CORS origins: ['https://ai.taysluxeacademy.com', 'https://taysluxeacademy.com']
Database initialized
```

If CORS origins show only localhost, the environment variable wasn't parsed correctly.

### Step 6: Test API Endpoint

Test registration endpoint directly:
```bash
curl -X POST https://api.taysluxeacademy.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpassword123"
  }'
```

**Expected:**
- If user exists: `400 Bad Request` with "Username already registered"
- If new user: `201 Created` with user data
- If CORS issue: `403 Forbidden` or CORS error

## Common Issues

### Issue: 502 Bad Gateway
**Causes:**
- Backend service not running
- Custom domain not configured
- DNS not propagated
- Backend crashed on startup

**Fix:**
- Check backend service status in Railway
- Verify custom domain is configured
- Check backend logs for startup errors
- Ensure DATABASE_URL is correct

### Issue: CORS Errors
**Causes:**
- `BACKEND_CORS_ORIGINS` not set correctly
- Frontend domain not in CORS list
- JSON format incorrect

**Fix:**
- Set `BACKEND_CORS_ORIGINS=["https://ai.taysluxeacademy.com"]`
- Verify JSON format (must be valid JSON array)
- Redeploy backend after setting variable
- Check logs to confirm CORS origins are parsed

### Issue: 404 Not Found
**Causes:**
- API route not registered
- Wrong API prefix

**Fix:**
- Verify `API_V1_PREFIX=/api/v1` is set
- Check backend logs for route registration
- Test `/health` endpoint first

## Verification Checklist

- [ ] Backend service is running in Railway
- [ ] `api.taysluxeacademy.com` custom domain is configured
- [ ] `https://api.taysluxeacademy.com/health` returns 200 OK
- [ ] `BACKEND_CORS_ORIGINS` includes `https://ai.taysluxeacademy.com`
- [ ] Backend logs show correct CORS origins on startup
- [ ] `DATABASE_URL` is set correctly
- [ ] `ENVIRONMENT=production` is set
- [ ] Backend can handle POST requests to `/api/v1/auth/register`

## After All Checks Pass

The backend should be accessible at:
- Health: `https://api.taysluxeacademy.com/health`
- API: `https://api.taysluxeacademy.com/api/v1/*`
- Docs (if DEBUG=true): `https://api.taysluxeacademy.com/docs`

Then set in Frontend Service:
- `NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com`
- Redeploy frontend
