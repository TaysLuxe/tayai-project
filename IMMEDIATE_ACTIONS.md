# 🚨 Immediate Actions Required for Production

## ⚠️ Current Status
Your Railway deployment is running but **NOT production-ready** yet.

**Issues:**
1. ❌ Frontend has 16 warnings (missing env vars)
2. ❌ Backend missing production environment variables
3. ❌ JWT secret needs to be set
4. ❌ CORS not configured for production domains

---

## ✅ 3-Minute Fix

### Step 1: Fix Frontend (1 min)

Go to **Railway Dashboard → frontend service → Variables**

Click **"Add Variable"** and paste these **3 variables**:

```
NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com
```

```
NEXT_PUBLIC_WS_URL=wss://api.taysluxeacademy.com
```

```
NODE_ENV=production
```

Then click **"Redeploy"** (this will fix the 16 warnings)

---

### Step 2: Fix Backend Security (2 min)

Go to **Railway Dashboard → backend service → Variables**

Add these **CRITICAL** variables:

#### 1. JWT Secret (REQUIRED):
```
JWT_SECRET_KEY=9a5309be5e2438a845457d37dfebcc6e1bd0a65dbd1be4482f2f456bc1ba7be2
```
**⚠️ Save this key! You'll need it to verify tokens.**

#### 2. Production Mode (REQUIRED):
```
ENVIRONMENT=production
```

```
DEBUG=false
```

#### 3. CORS (REQUIRED):
```
BACKEND_CORS_ORIGINS=https://ai.taysluxeacademy.com,https://www.taysluxeacademy.com
```

Backend will **automatically restart** after adding these.

---

## ✅ Verify It Worked

### Test Frontend:
Open: https://ai.taysluxeacademy.com
- Should load without errors
- Check Railway logs - no more warnings

### Test Backend:
Open: https://api.taysluxeacademy.com/docs
- Should show API documentation
- Try the login endpoint

### Test Zapier Webhook:
In terminal:
```bash
curl -X POST https://api.taysluxeacademy.com/api/v1/membership/webhook/skool \
  -H "Content-Type: application/json" \
  -d '{"event":"member.joined","data":{"member":{"email":"test@example.com","name":"Test User"},"group":{"name":"Hair Hu$tlers Elite"}}}'
```

Should return:
```json
{"status":"created","email":"test@example.com","tier":"vip"}
```

---

## 📝 Optional (But Recommended)

### Add Your OpenAI Key (for AI features to work):

Go to **Railway → backend → Variables**:

```
OPENAI_API_KEY=your_actual_openai_key_here
```

### Add Skool Webhook Secret (for webhook security):

```
SKOOL_WEBHOOK_SECRET=your_secret_here
```

---

## 🎯 You're Done!

After completing Step 1 and Step 2:
- ✅ Frontend warnings fixed
- ✅ Backend secured
- ✅ CORS configured
- ✅ Production-ready

**Services:**
- Frontend: https://ai.taysluxeacademy.com
- Backend: https://api.taysluxeacademy.com
- Webhook: https://api.taysluxeacademy.com/api/v1/membership/webhook/skool

---

## 📚 Additional Resources

For complete setup guide: See `PRODUCTION_RAILWAY_SETUP.md`
For quick reference: See `RAILWAY_QUICK_SETUP.md`
To run automated setup: Run `./setup_railway_production.sh`

---

## 🆘 Need Help?

If anything doesn't work:
1. Check Railway logs: Dashboard → Service → Deployments → Logs
2. Run: `railway logs --service backend --tail`
3. Run: `railway logs --service frontend --tail`
