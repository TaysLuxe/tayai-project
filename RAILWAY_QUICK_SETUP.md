# Railway Quick Setup - Copy & Paste

## 🎯 For Frontend Service

Go to Railway Dashboard → frontend → Variables → Add these:

```env
NEXT_PUBLIC_API_URL=https://api.taysluxeacademy.com
NEXT_PUBLIC_WS_URL=wss://api.taysluxeacademy.com
NODE_ENV=production
```

**Then click "Redeploy"** to fix the 16 warnings.

---

## 🎯 For Backend Service

Go to Railway Dashboard → backend → Variables → Add these:

### Security (REQUIRED):
```env
JWT_SECRET_KEY=<GENERATE: run "openssl rand -hex 32" in terminal>
ENVIRONMENT=production
DEBUG=false
```

### OpenAI (REQUIRED for AI features):
```env
OPENAI_API_KEY=your_actual_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

### CORS (REQUIRED):
```env
BACKEND_CORS_ORIGINS=https://ai.taysluxeacademy.com,https://www.taysluxeacademy.com
```

### Skool Integration (REQUIRED for webhooks):
```env
SKOOL_COMMUNITY_URL=https://www.skool.com/tla-hair-hutlers-co
SKOOL_ACCESS_START_DATE=2026-02-06T00:00:00Z
UPGRADE_URL_BASIC=https://www.skool.com/tla-hair-hutlers-co/about
UPGRADE_URL_VIP=https://www.skool.com/tla-hair-hutlers-co/about
```

### Usage Limits (Optional - has defaults):
```env
BASIC_MEMBER_MESSAGES_PER_MONTH=50
VIP_MEMBER_MESSAGES_PER_MONTH=1000
BASIC_TIER_ACCESS_DAYS=21
```

---

## 🔧 How to Generate JWT Secret Key

In your terminal:
```bash
openssl rand -hex 32
```

Copy the output and paste it as the value for `JWT_SECRET_KEY`.

---

## ✅ After Adding Variables

1. **Frontend**: Click "Redeploy" to rebuild with new env vars
2. **Backend**: Will automatically restart

---

## 🧪 Test Your Setup

### Test Backend:
```bash
curl https://api.taysluxeacademy.com/docs
```

### Test Frontend:
Open browser: https://ai.taysluxeacademy.com

### Test Webhook:
```bash
curl -X POST https://api.taysluxeacademy.com/api/v1/membership/webhook/skool \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.joined",
    "data": {
      "member": {
        "email": "test@example.com",
        "name": "Test User"
      },
      "group": {
        "name": "Hair Hu$tlers Elite"
      }
    }
  }'
```

Expected response:
```json
{
  "status": "created",
  "email": "test@example.com",
  "tier": "vip"
}
```

---

## 📊 Monitor Logs

### Via Railway Dashboard:
- Go to service → Deployments → Click on latest → View Logs

### Via Terminal:
```bash
railway logs --service backend --tail
railway logs --service frontend --tail
```

---

## 🐛 Troubleshooting

### Frontend Still Has Warnings?
1. Make sure you added **all 3** frontend variables
2. Click "Redeploy" (not just restart)
3. Wait for build to complete
4. Check logs for specific warnings

### Backend Not Starting?
1. Check if `JWT_SECRET_KEY` is set
2. Verify `DATABASE_URL` is auto-injected (should be automatic)
3. Check logs: `railway logs --service backend --tail`

### CORS Errors?
Make sure `BACKEND_CORS_ORIGINS` includes your frontend domain **exactly** as shown above.

---

## 🚀 Done!

Once all variables are set and services redeployed:
- Frontend: https://ai.taysluxeacademy.com
- Backend API: https://api.taysluxeacademy.com
- API Docs: https://api.taysluxeacademy.com/docs
- Zapier Webhook: https://api.taysluxeacademy.com/api/v1/membership/webhook/skool
