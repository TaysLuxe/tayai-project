# Railway Deployment Guide - TayAI

## When to Use Railway

**Use Railway for:** Easy deployment, auto SSL, managed PostgreSQL, subdomain setup (`ai.taysluxeacademy.com`)

**Use VPS for:** Subpath routing (`taysluxeacademy.com/ai`), lower costs, full server control

**Cost:** ~$10-30/month (Hobby/Pro plans)

---

## Quick Setup

### 1. Create Project
- Go to https://railway.app → Sign up with GitHub
- Create new project

### 2. Add PostgreSQL
- Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
- Enable pgvector: `railway run python -c "from app.db.database import engine; engine.execute('CREATE EXTENSION IF NOT EXISTS vector')"`

### 3. Deploy Backend
- **"+ New"** → **"GitHub Repo"** → Select repository
- **Root Directory:** `backend`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 4. Deploy Frontend
- **"+ New"** → **"GitHub Repo"** (same repo)
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

### 5. Run Migrations
```bash
railway run alembic upgrade head
```

### 6. Configure Custom Domain
- **Settings** → **Domains** → Add `ai.taysluxeacademy.com`
- Add CNAME record: `ai` → `your-project.railway.app`

---

## Environment Variables

### Backend
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=sk-proj-your-key
JWT_SECRET_KEY=<generate-secure-key>
JWT_ALGORITHM=HS256
ENVIRONMENT=production
DEBUG=false
API_V1_PREFIX=/api/v1
BACKEND_CORS_ORIGINS=["https://ai.taysluxeacademy.com","https://taysluxeacademy.com"]
BASIC_MEMBER_MESSAGES_PER_MONTH=50
VIP_MEMBER_MESSAGES_PER_MONTH=1000
TRIAL_PERIOD_DAYS=7
```

### Frontend
```bash
NEXT_PUBLIC_API_URL=https://ai.taysluxeacademy.com/api/v1
NODE_ENV=production
```

---

## Registration

### API Endpoint
**POST** `/api/v1/auth/register`

```json
{
  "email": "user@example.com",
  "username": "newuser",
  "password": "securepassword123"
}
```

### Test via curl
```bash
curl -X POST https://ai.taysluxeacademy.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "username": "testuser", "password": "testpassword123"}'
```

### New User Defaults
- **Tier:** Basic (50 messages/month)
- **Trial:** 7 days
- **Status:** Active

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS Error | Verify `BACKEND_CORS_ORIGINS` includes frontend domain, redeploy |
| Username/Email exists | Expected - use different credentials |
| Frontend can't connect | Check `NEXT_PUBLIC_API_URL`, verify backend is running |
| Database error | Check `DATABASE_URL`, run migrations |
| JWT errors | Set `JWT_SECRET_KEY` (use `openssl rand -hex 32`) |

---

## Seed Test Users (Optional)
```bash
railway run python seed_users.py
```
Creates: `testuser`, `vipuser`, `admin` (password: `testpassword123` / `adminpassword123`)
