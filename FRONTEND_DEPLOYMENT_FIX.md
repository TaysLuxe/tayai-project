# Frontend Deployment Fix for Railway

## Issues Fixed

### 1. **Port Configuration**
- **Problem**: Dockerfile hardcoded `PORT=3000`, but Railway injects `$PORT` at runtime
- **Fix**: Removed hardcoded PORT, Railway will inject it automatically
- **Note**: EXPOSE still uses 3000 (required by Docker), but Railway overrides at runtime

### 2. **Missing lib Directory**
- **Problem**: `lib/` directory might not be included in standalone build
- **Fix**: Explicitly copy `lib/` directory to production image
- **Reason**: Standalone mode may not include all source directories

### 3. **Build-Time Environment Variables**
- **Problem**: `NEXT_PUBLIC_*` variables must be available at build time
- **Fix**: Added ARG and ENV declarations for build-time variables
- **Note**: Railway automatically makes these available during build

### 4. **Removed Unnecessary App Directory Copy**
- **Problem**: App directory is already compiled into `.next/server` in standalone mode
- **Fix**: Removed redundant `app/` directory copy
- **Reason**: Standalone mode includes compiled app routes

## Dockerfile Changes

### Key Improvements:
1. ✅ Added build-time ARG/ENV for `NEXT_PUBLIC_*` variables
2. ✅ Removed hardcoded PORT (Railway injects it)
3. ✅ Added explicit `lib/` directory copy
4. ✅ Removed redundant `app/` directory copy
5. ✅ Simplified CMD to use `node server.js` directly

## Railway Configuration

### Required Environment Variables (Frontend Service):
```bash
NEXT_PUBLIC_API_URL="https://api.taysluxeacademy.com"
NEXT_PUBLIC_WS_URL="wss://api.taysluxeacademy.com"
NODE_ENV="production"
```

**Important**: These variables must be set in Railway **before** building, as they're embedded at build time.

## Deployment Steps

1. **Set Environment Variables in Railway**:
   - Go to Railway Dashboard → Frontend Service → Variables
   - Add all `NEXT_PUBLIC_*` variables
   - Save

2. **Redeploy Frontend**:
   - Railway Dashboard → Frontend Service → Settings → Redeploy
   - Or push a new commit to trigger deployment

3. **Verify Deployment**:
   - Check deployment logs for build success
   - Look for: "Compiled successfully" in build logs
   - Check runtime logs for: "Ready on http://0.0.0.0:PORT"

## Troubleshooting

### If "Application failed to respond" persists:

1. **Check Build Logs**:
   - Railway Dashboard → Frontend Service → Deployments → Latest → Build Logs
   - Look for compilation errors or missing dependencies

2. **Check Runtime Logs**:
   - Railway Dashboard → Frontend Service → Logs
   - Look for:
     - "Error: Cannot find module" → Missing dependency
     - "EADDRINUSE" → Port conflict (unlikely on Railway)
     - "server.js not found" → Standalone build issue

3. **Verify Environment Variables**:
   - Ensure `NEXT_PUBLIC_API_URL` is set before build
   - Check that variables are in Frontend Service (not Backend Service)

4. **Test Standalone Build Locally**:
   ```bash
   cd frontend
   npm run build
   ls -la .next/standalone/
   # Should see server.js in the root
   ```

5. **Check Custom Domain**:
   - Railway Dashboard → Frontend Service → Settings → Custom Domains
   - Verify `ai.taysluxeacademy.com` is configured and active

## Expected Behavior After Fix

✅ Build completes successfully  
✅ `server.js` is found in standalone output  
✅ Application starts and listens on Railway's injected PORT  
✅ Frontend is accessible at `https://ai.taysluxeacademy.com`  
✅ API calls work correctly (check browser console)

## Next Steps

1. Commit and push the updated Dockerfile
2. Set environment variables in Railway (if not already set)
3. Redeploy frontend service
4. Monitor deployment logs
5. Test the application
