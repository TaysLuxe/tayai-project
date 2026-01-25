# QUICK FIX: Set Environment Variable in Railway

## The Problem
Console shows: `NEXT_PUBLIC_API_URL: NOT SET`

This means the environment variable is not configured in Railway, or the frontend wasn't rebuilt after setting it.

## Solution (5 minutes)

### Step 1: Go to Railway Dashboard
1. Open https://railway.app
2. Select your project
3. Click on **Frontend Service** (not backend)

### Step 2: Add Environment Variable
1. Click **"Variables"** tab (top menu)
2. Click **"+ New Variable"** button
3. Enter:
   - **Variable Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://api.taysluxeacademy.com`
   - **Important:** 
     - No quotes around the value
     - No trailing slash
     - No `/api/v1` at the end
4. Click **"Add"** or **"Save"**

### Step 3: Redeploy Frontend (CRITICAL!)
**This is the most important step!**

Next.js embeds `NEXT_PUBLIC_*` variables at BUILD TIME, so you MUST redeploy:

1. In the Frontend Service page
2. Click **"Settings"** tab OR find **"Redeploy"** button
3. Click **"Redeploy"** or **"Deploy"**
4. Wait for build to complete (2-5 minutes)

### Step 4: Verify
After redeploy completes:

1. Open browser console (F12 → Console)
2. Refresh the page
3. You should see:
   ```
   [API Client] NEXT_PUBLIC_API_URL: https://api.taysluxeacademy.com
   [API Client] Using API URL from environment: https://api.taysluxeacademy.com
   ```

If you still see "NOT SET", the variable wasn't saved or frontend wasn't rebuilt.

## Visual Guide

```
Railway Dashboard
  └── Your Project
      └── Frontend Service
          └── Variables Tab
              └── + New Variable
                  Name:  NEXT_PUBLIC_API_URL
                  Value: https://api.taysluxeacademy.com
                  └── Add
          
          └── Settings Tab
              └── Redeploy Button
                  └── Click to rebuild
```

## Common Mistakes

❌ **Wrong:** `NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com/api/v1`
✅ **Correct:** `NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com`

❌ **Wrong:** Setting variable but not redeploying
✅ **Correct:** Set variable AND redeploy

❌ **Wrong:** Setting in Backend Service
✅ **Correct:** Set in Frontend Service

## After Fix

- Console will show the correct API URL
- Registration will work
- No more 502 errors
- All API calls go directly to `api.taysluxeacademy.com`
