# Backend Environment Variables for Railway

## Complete List - Copy and Paste Ready

Use these exact values in Railway Backend Service → Variables tab.

### Required Variables

```bash
# Database (use Railway's PostgreSQL service reference)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# CORS - Must include frontend domain
BACKEND_CORS_ORIGINS=["https://ai.taysluxeacademy.com","https://taysluxeacademy.com"]

# Application Settings
ENVIRONMENT=production
DEBUG=false
API_V1_PREFIX=/api/v1
PROJECT_NAME=TayAI

# JWT Authentication
JWT_SECRET_KEY=your-super-secret-jwt-key-generate-with-openssl-rand-hex-32
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# OpenAI API
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
OPENAI_MODEL=gpt-4
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Port (Railway sets this automatically - don't change)
PORT=$PORT
```

### Optional Variables (with defaults)

```bash
# Redis (if using Railway Redis service)
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_HOST=localhost
REDIS_PORT=6379

# Usage Limits
BASIC_MEMBER_MESSAGES_PER_MONTH=50
VIP_MEMBER_MESSAGES_PER_MONTH=1000
TRIAL_PERIOD_DAYS=7

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# Membership Platform Integration (optional)
MEMBERSHIP_PLATFORM_API_URL=
MEMBERSHIP_PLATFORM_API_KEY=

# Skool Integration (optional)
SKOOL_WEBHOOK_SECRET=
SKOOL_COMMUNITY_URL=https://www.skool.com/tla-hair-hutlers-co

# Upgrade URLs (optional)
UPGRADE_URL_BASIC=https://www.skool.com/tla-hair-hutlers-co/about
UPGRADE_URL_VIP=https://www.skool.com/tla-hair-hutlers-co/about
UPGRADE_URL_GENERIC=https://www.skool.com/tla-hair-hutlers-co/about

# Membership Pricing (optional)
BASIC_MEMBERSHIP_PRICE=$37
VIP_MEMBERSHIP_PRICE=
```

### Host Configuration

```bash
# Allowed Hosts (for TrustedHostMiddleware)
ALLOWED_HOSTS=["*"]
```

## Quick Copy - Minimal Required Setup

For quick setup, copy these essential variables:

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
BACKEND_CORS_ORIGINS=["https://ai.taysluxeacademy.com","https://taysluxeacademy.com"]
ENVIRONMENT=production
DEBUG=false
API_V1_PREFIX=/api/v1
JWT_SECRET_KEY=<generate-with-openssl-rand-hex-32>
OPENAI_API_KEY=<your-openai-api-key>
```

## Important Notes

1. **DATABASE_URL**: Use Railway's service reference `${{Postgres.DATABASE_URL}}`
2. **BACKEND_CORS_ORIGINS**: Must be valid JSON array format with quotes
3. **JWT_SECRET_KEY**: Generate with: `openssl rand -hex 32`
4. **PORT**: Railway automatically provides this - don't set manually
5. **REDIS_URL**: Only needed if using Redis, use `${{Redis.REDIS_URL}}` if available

## Format Guidelines

- **JSON Arrays**: Must use double quotes: `["value1","value2"]`
- **Service References**: Use `${{ServiceName.VARIABLE}}` syntax
- **No Quotes**: For simple strings, don't use quotes (except in JSON arrays)
- **Case Sensitive**: All variable names are case-sensitive

## Example: Complete Production Setup

```bash
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# CORS
BACKEND_CORS_ORIGINS=["https://ai.taysluxeacademy.com","https://taysluxeacademy.com"]

# App Config
ENVIRONMENT=production
DEBUG=false
API_V1_PREFIX=/api/v1
PROJECT_NAME=TayAI

# JWT
JWT_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Usage Limits
BASIC_MEMBER_MESSAGES_PER_MONTH=50
VIP_MEMBER_MESSAGES_PER_MONTH=1000
TRIAL_PERIOD_DAYS=7

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
```

## How to Add in Railway

1. Go to Railway Dashboard → **Backend Service**
2. Click **"Variables"** tab
3. For each variable:
   - Click **"+ New Variable"**
   - Enter **Name** (exactly as shown above)
   - Enter **Value** (replace placeholders with actual values)
   - Click **"Add"**
4. Repeat for all required variables
5. Railway will auto-redeploy when variables are added

## Generate JWT Secret Key

Run this command to generate a secure JWT secret:

```bash
openssl rand -hex 32
```

Copy the output and use it as `JWT_SECRET_KEY` value.
