# Fix 502 Bad Gateway Error - Step by Step Guide

## Problem
Getting 502 Bad Gateway when accessing `/api/v1/auth/register` on `https://ai.taysluxeacademy.com`

## Root Cause
The Next.js rewrite is trying to proxy to `api.taysluxeacademy.com` but either:
1. Backend is not accessible at that domain
2. `NEXT_PUBLIC_API_URL` is not set, causing fallback to rewrites
3. Backend service is not running

## Solution: Use Direct API Calls

### Step 1: Verify Backend is Running

1. Go to Railway Dashboard
2. Select **Backend Service**
3. Check:
   - Service is **Deployed** and **Running** (green status)
   - No errors in logs
   - Service is healthy

### Step 2: Verify Backend Custom Domain

1. In Railway Backend Service → **Networking** tab
2. Check if `api.taysluxeacademy.com` is listed under **Custom Domains**
3. If not, click **"Custom Domain"** and add: `api.taysluxeacademy.com`
4. Wait for DNS propagation (can take a few minutes)
5. Verify SSL certificate is active (green checkmark)

### Step 3: Test Backend Directly

Open in browser or use curl:
```
https://api.taysluxeacademy.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "..."
}
```

**If this fails:** The backend domain is not accessible. Fix backend/custom domain first.

**If this works:** Continue to Step 4.

### Step 4: Set Frontend Environment Variable

1. Go to Railway Dashboard
2. Select **Frontend Service**
3. Click **Variables** tab
4. Click **"+ New Variable"**
5. Add:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://api.taysluxeacademy.com`
   - **Important:** No trailing slash, no `/api/v1`
6. Click **"Add"**

### Step 5: Verify Backend CORS Configuration

1. Go to Railway Dashboard
2. Select **Backend Service**
3. Click **Variables** tab
4. Find or add:
   - **Name:** `BACKEND_CORS_ORIGINS`
   - **Value:** `["https://ai.taysluxeacademy.com","https://taysluxeacademy.com"]`
   - **Important:** Must be valid JSON array format
5. Save if changed

### Step 6: Redeploy Frontend

**Critical:** Next.js embeds `NEXT_PUBLIC_*` variables at build time, so you MUST redeploy after setting it.

1. In Railway Frontend Service
2. Go to **Settings** or **Deployments** tab
3. Click **"Redeploy"** or trigger a new deployment
4. Wait for build to complete (usually 2-5 minutes)

### Step 7: Verify Configuration

After redeploy, check browser console (F12 → Console):
- Should see: `[API Client] NEXT_PUBLIC_API_URL: https://api.taysluxeacademy.com`
- Should see: `[API Client] Using API URL from environment: https://api.taysluxeacademy.com`

If you see `NOT SET`, the environment variable wasn't set or frontend wasn't rebuilt.

### Step 8: Test Registration

1. Go to: `https://ai.taysluxeacademy.com/register`
2. Fill in registration form
3. Submit
4. Should work without 502 error

## Troubleshooting

### Still Getting 502?

1. **Check backend logs:**
   - Railway Backend Service → Logs
   - Look for errors or crashes

2. **Verify backend is accessible:**
   ```bash
   curl https://api.taysluxeacademy.com/health
   ```

3. **Check DNS propagation:**
   - Use: https://dnschecker.org
   - Search for: `api.taysluxeacademy.com`
   - Should show Railway's IP addresses

4. **Verify SSL certificate:**
   - Railway should auto-provision SSL
   - Check in Railway Backend Service → Networking
   - Should show green checkmark

5. **Check CORS errors in browser console:**
   - If you see CORS errors, verify `BACKEND_CORS_ORIGINS` includes frontend domain

### Still Getting 404?

- Make sure `NEXT_PUBLIC_API_URL` is set correctly
- Make sure frontend was redeployed after setting variable
- Check browser console for debug logs

## Quick Checklist

- [ ] Backend service is running in Railway
- [ ] `api.taysluxeacademy.com` custom domain is configured in Railway backend
- [ ] `https://api.taysluxeacademy.com/health` returns 200 OK
- [ ] `NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com` is set in Railway frontend
- [ ] `BACKEND_CORS_ORIGINS=["https://ai.taysluxeacademy.com"]` is set in Railway backend
- [ ] Frontend service has been redeployed after setting environment variable
- [ ] Browser console shows correct API URL being used

## Expected Behavior After Fix

- Frontend makes direct API calls to `https://api.taysluxeacademy.com/api/v1/*`
- No more 502 errors
- Registration and login work correctly
- All API endpoints accessible
