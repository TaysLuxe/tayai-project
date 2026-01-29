# Production Railway Setup Guide

## 🎯 Current Status
- ✅ Redis: Online
- ✅ Postgres: Online
- ⚠️ Frontend (ai.taysluxeacademy.com): Online with 16 warnings
- ✅ Backend (api.taysluxeacademy.com): Online

## 🚀 Production Readiness Checklist

### 1. Backend Environment Variables

Set these in **Railway Dashboard → backend service → Variables**:

#### Required (Must Change for Production):
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_actual_openai_api_key

# JWT Security - Generate new secure key!
JWT_SECRET_KEY=<run: openssl rand -hex 32>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Database (Railway auto-injects these, but verify)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Railway auto-injects these, but verify)
REDIS_URL=${{Redis.REDIS_URL}}

# Environment
ENVIRONMENT=production
DEBUG=false
```

#### CORS Configuration:
```bash
BACKEND_CORS_ORIGINS=https://ai.taysluxeacademy.com,https://www.taysluxeacademy.com
```

#### Skool Webhook Integration:
```bash
SKOOL_WEBHOOK_SECRET=your_skool_webhook_secret_here
SKOOL_COMMUNITY_URL=https://www.skool.com/tla-hair-hutlers-co
SKOOL_ACCESS_START_DATE=2026-02-06T00:00:00Z
```

#### Usage Limits:
```bash
BASIC_MEMBER_MESSAGES_PER_MONTH=50
VIP_MEMBER_MESSAGES_PER_MONTH=1000
BASIC_TIER_ACCESS_DAYS=21
```

#### Upgrade URLs:
```bash
UPGRADE_URL_BASIC=https://www.skool.com/tla-hair-hutlers-co/about
UPGRADE_URL_VIP=https://www.skool.com/tla-hair-hutlers-co/about
UPGRADE_URL_GENERIC=https://www.skool.com/tla-hair-hutlers-co/about
```

---

### 2. Frontend Environment Variables

Set these in **Railway Dashboard → frontend service → Variables**:

```bash
# API URLs - CRITICAL for frontend to connect to backend
NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com
NEXT_PUBLIC_WS_URL=wss://api.taysluxeacademy.com

# Node Environment
NODE_ENV=production
```

⚠️ **Important**: `NEXT_PUBLIC_*` variables MUST be set in Railway as they're needed at build time!

---

### 3. Database (Postgres) Configuration

Railway auto-manages Postgres. Verify these are auto-injected:
- `DATABASE_URL` (auto-injected by Railway)
- `POSTGRES_USER` (auto)
- `POSTGRES_PASSWORD` (auto)
- `POSTGRES_DB` (auto)

**Volume**: ✅ postgres-volume (already configured)

---

### 4. Redis Configuration

Railway auto-manages Redis. Verify:
- `REDIS_URL` (auto-injected by Railway)

**Volume**: ✅ redis-volume (already configured)

---

## 🔧 Fix Frontend Warnings (16 warnings)

The warnings are likely from:
1. Missing environment variables at build time
2. Deprecated dependencies
3. Next.js build warnings

### Fix Steps:

#### Step 1: Set Frontend Environment Variables
Go to Railway → frontend service → Variables → Add these:

```bash
NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com
NEXT_PUBLIC_WS_URL=wss://api.taysluxeacademy.com
NODE_ENV=production
```

#### Step 2: Redeploy Frontend
After adding variables:
```bash
railway up --service frontend
```

Or in Railway Dashboard: frontend → Deployments → Redeploy

---

## 🔒 Security Checklist

### Critical Security Items:

- [ ] **Change JWT_SECRET_KEY** - Generate new: `openssl rand -hex 32`
- [ ] **Set DEBUG=false** in production
- [ ] **Set ENVIRONMENT=production**
- [ ] **Update CORS origins** to only include production domains
- [ ] **Set strong SKOOL_WEBHOOK_SECRET** if using webhooks
- [ ] **Verify API keys** (OpenAI, etc.) are production keys
- [ ] **Enable HTTPS only** (Railway does this by default)

---

## 🌐 Domain Configuration

### Current Domains:
- Frontend: `https://ai.taysluxeacademy.com`
- Backend: `https://api.taysluxeacademy.com`

### Verify DNS:
```bash
# Should point to Railway
dig ai.taysluxeacademy.com
dig api.taysluxeacademy.com
```

### SSL Certificates:
✅ Railway auto-provisions Let's Encrypt SSL certificates

---

## 📊 Monitoring & Logging

### View Logs:
```bash
# Backend logs
railway logs --service backend

# Frontend logs
railway logs --service frontend

# All services
railway logs
```

### Health Checks:

#### Backend Health:
```bash
curl https://api.taysluxeacademy.com/docs
# Should return API documentation
```

#### Frontend Health:
```bash
curl https://ai.taysluxeacademy.com
# Should return Next.js frontend
```

#### Webhook Test:
```bash
curl -X POST https://api.taysluxeacademy.com/api/v1/membership/webhook/skool \
  -H "Content-Type: application/json" \
  -d '{"event":"member.joined","data":{"member":{"email":"test@example.com"},"group":{"name":"Hair Hu$tlers Elite"}}}'
```

---

## 🚀 Deployment Commands

### Deploy All Services:
```bash
railway up
```

### Deploy Specific Service:
```bash
railway up --service backend
railway up --service frontend
```

### Run Migrations:
```bash
railway run --service backend "python run_migrations.py"
```

### Seed Users:
```bash
railway run --service backend "python seed_users.py"
```

---

## 🔄 Startup Order

Railway services start in this order:
1. **Postgres** (with health check)
2. **Redis** (with health check)
3. **Backend** (depends on Postgres + Redis)
4. **Frontend** (depends on Backend)

Backend startup command:
```bash
python run_migrations.py && python seed_users.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
```

---

## 📋 Pre-Deployment Checklist

Before going live:

### Backend:
- [ ] Set all production environment variables
- [ ] Generate new JWT_SECRET_KEY
- [ ] Set DEBUG=false
- [ ] Update CORS origins
- [ ] Test API endpoints
- [ ] Verify database connection
- [ ] Test Skool webhook

### Frontend:
- [ ] Set NEXT_PUBLIC_API_URL
- [ ] Set NEXT_PUBLIC_WS_URL
- [ ] Rebuild to clear warnings
- [ ] Test user registration
- [ ] Test user login
- [ ] Verify API calls work

### Database:
- [ ] Migrations applied
- [ ] Test users seeded (optional)
- [ ] Backup strategy in place

### Monitoring:
- [ ] Set up error tracking (Sentry)
- [ ] Configure log retention
- [ ] Set up uptime monitoring

---

## 🐛 Troubleshooting

### Frontend 16 Warnings:

**Common causes:**
1. Missing `NEXT_PUBLIC_*` variables at build time
2. Deprecated npm packages
3. TypeScript/ESLint warnings

**Fix:**
```bash
# 1. Add environment variables in Railway
# 2. Trigger rebuild
railway up --service frontend
```

### Backend Startup Failures:

**Check logs:**
```bash
railway logs --service backend --tail
```

**Common issues:**
- Database connection failed → Check DATABASE_URL
- Redis connection failed → Check REDIS_URL
- Port binding issues → Railway auto-injects PORT

### CORS Errors:

If frontend can't connect to backend:
```bash
# Update BACKEND_CORS_ORIGINS to include frontend domain
BACKEND_CORS_ORIGINS=https://ai.taysluxeacademy.com
```

---

## 📞 Next Steps

1. **Update Environment Variables** (see sections above)
2. **Redeploy Services** to apply changes
3. **Test All Endpoints** (API, frontend, webhooks)
4. **Monitor Logs** for 24 hours
5. **Set Up Monitoring** (Sentry, uptime checks)

---

## 🔗 Useful Links

- Railway Dashboard: https://railway.app/project/stellar-playfulness
- Frontend: https://ai.taysluxeacademy.com
- Backend API: https://api.taysluxeacademy.com
- API Docs: https://api.taysluxeacademy.com/docs
- Skool Community: https://www.skool.com/tla-hair-hutlers-co

---

## 📝 Notes

- Railway automatically handles SSL certificates
- Railway injects `PORT` environment variable at runtime
- Volumes are persistent across deployments
- Environment variables are encrypted at rest
