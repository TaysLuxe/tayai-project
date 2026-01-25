# Frontend Environment Variables for Railway

## Complete List - Copy and Paste Ready

Use these exact values in Railway Frontend Service → Variables tab.

### Required Variables

```bash
# API Configuration - Backend URL (REQUIRED)
NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com

# WebSocket URL (if using WebSockets)
NEXT_PUBLIC_WS_URL=wss://api.taysluxeacademy.com

# Node Environment
NODE_ENV=production

# Port (Railway sets this automatically - don't change)
PORT=$PORT
```

### Important Notes

1. **NEXT_PUBLIC_API_URL**: 
   - Must be the backend service URL
   - Do NOT include `/api/v1` at the end
   - Use `https://` (not `http://`)
   - Example: `https://api.taysluxeacademy.com`

2. **NEXT_PUBLIC_WS_URL**:
   - Only needed if using WebSocket connections
   - Use `wss://` for secure WebSocket (not `ws://`)
   - Should match the backend domain

3. **NODE_ENV**:
   - Set to `production` for Railway deployment
   - Railway may set this automatically

4. **PORT**:
   - Railway automatically provides this
   - Don't set manually

## Quick Copy - Minimal Required Setup

For quick setup, copy these essential variables:

```bash
NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com
NODE_ENV=production
```

## Format Guidelines

- **No Quotes**: For simple strings, don't use quotes
- **Case Sensitive**: All variable names are case-sensitive
- **NEXT_PUBLIC_***: These variables are embedded at build time
- **Must Redeploy**: After setting `NEXT_PUBLIC_*` variables, you MUST redeploy

## Example: Complete Production Setup

```bash
# Backend API URL (REQUIRED)
NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com

# WebSocket URL (optional)
NEXT_PUBLIC_WS_URL=wss://api.taysluxeacademy.com

# Node Environment
NODE_ENV=production
```

## Alternative: If Backend is on Railway URL

If your backend doesn't have a custom domain yet, use the Railway URL:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-service.up.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend-service.up.railway.app
NODE_ENV=production
```

## How to Add in Railway

1. Go to Railway Dashboard → **Frontend Service**
2. Click **"Variables"** tab
3. For each variable:
   - Click **"+ New Variable"**
   - Enter **Name** (exactly as shown above)
   - Enter **Value** (replace with actual backend URL)
   - Click **"Add"**
4. **CRITICAL**: After adding variables, click **"Redeploy"** or trigger a new deployment
5. Wait for build to complete (2-5 minutes)

## Important: Redeploy After Setting Variables

**CRITICAL**: Next.js embeds `NEXT_PUBLIC_*` variables at BUILD TIME.

After setting `NEXT_PUBLIC_API_URL`:
1. You MUST redeploy the frontend service
2. Railway may auto-redeploy, but verify it did
3. Check browser console after redeploy to verify:
   ```
   [API Client] NEXT_PUBLIC_API_URL: https://api.taysluxeacademy.com
   ```

## Verification

After setting variables and redeploying:

1. Open browser console (F12 → Console)
2. Refresh the page
3. Look for:
   ```
   [API Client] NEXT_PUBLIC_API_URL: https://api.taysluxeacademy.com
   [API Client] Using API URL from environment: https://api.taysluxeacademy.com
   ```

If you see `NOT SET`, the variable wasn't set or frontend wasn't rebuilt.

## Common Mistakes

❌ **Wrong:** `NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com/api/v1`
✅ **Correct:** `NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com`

❌ **Wrong:** `NEXT_PUBLIC_API_URL="https://api.taysluxeacademy.com"`
✅ **Correct:** `NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com`

❌ **Wrong:** Setting variable but not redeploying
✅ **Correct:** Set variable AND redeploy

❌ **Wrong:** Setting in Backend Service
✅ **Correct:** Set in Frontend Service

## Troubleshooting

### Variable Not Working?

1. **Check variable name**: Must be exactly `NEXT_PUBLIC_API_URL` (case-sensitive)
2. **Check value**: No quotes, no trailing slash, no `/api/v1`
3. **Redeploy**: Frontend MUST be rebuilt after setting variable
4. **Check logs**: Railway build logs should show the variable is available
5. **Browser console**: Check for debug logs showing the API URL

### Still Getting 404/502?

- Verify backend is accessible: `https://api.taysluxeacademy.com/health`
- Check backend CORS includes frontend domain
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Ensure frontend was redeployed after setting variable
