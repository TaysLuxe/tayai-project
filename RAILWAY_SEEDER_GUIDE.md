# Running User Seeder in Railway

## Method 1: Using Railway Web Interface (Recommended)

**Note:** Railway CLI `run` command executes locally on your machine, not inside the container. To run commands inside the deployed container, use the web interface.

### Steps

1. **Go to Railway Dashboard:**
   - Visit https://railway.app
   - Select your project: `stellar-playfulness`
   - Select your **backend** service

2. **Open the Shell/Console:**
   - Click on the **"Deployments"** tab
   - Click on the latest deployment
   - Click **"View Logs"** or look for **"Shell"** / **"Console"** tab
   - Or use the **"Shell"** button in the service view

3. **Run the seeder in the container:**
```bash
cd /app
python run_seed.py
```

Or directly:
```bash
python /app/seed_users.py
```

**Note:** Inside the Railway container, the working directory is `/app` and all backend files are there.

---

## Method 2: Using Railway CLI (Local Execution with Remote Env Vars)

**Important:** Railway CLI `run` executes locally but with remote environment variables. This only works if you have the same Python environment and dependencies installed locally.

### Prerequisites
```bash
npm i -g @railway/cli
railway login
railway link
```

### Run Locally (with Railway env vars):
```bash
# Make sure you're in the project root
cd /Users/jumar.juaton/Downloads/Developer/tayai-project

# Install dependencies locally first
cd backend
pip install -r requirements.txt

# Run with Railway environment variables
railway run --service backend sh -c "cd backend && python3 run_seed.py"
```

**Note:** This requires local Python environment with all dependencies installed. For production, use Method 1 (Web Interface) instead.

---

## Method 3: Add to Railway Start Command (One-time Setup)

You can configure Railway to run the seeder automatically on first deployment:

1. Go to Railway Dashboard → Backend Service → Settings
2. Add to **Start Command** (temporary):
```bash
sh -c "python /app/run_seed.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"
```

3. After first deployment, remove the seeder part and keep only:
```bash
uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
```

**Note:** This runs the seeder on every deployment. Only use for initial setup, then switch back to normal start command.

---

## Verify Seeding

After running the seeder, verify users were created by checking the database:

### Using Railway CLI:
```bash
railway run --service backend python -c "
import asyncio
from app.db.database import AsyncSessionLocal, init_db
from app.services.user_service import UserService

async def check():
    await init_db()
    async with AsyncSessionLocal() as session:
        service = UserService(session)
        users = await service.list_users(limit=10)
        for user in users:
            print(f'{user.username} ({user.tier.value}) - {user.email}')

asyncio.run(check())
"
```

### Or connect to PostgreSQL directly:
```bash
railway connect postgres
```

Then in the PostgreSQL shell:
```sql
SELECT email, username, tier, is_admin, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Expected Output

When the seeder runs successfully, you should see:

```
Running from directory: /app
Script location: /app
Initializing database...

Creating test users...
------------------------------------------------------------
✓ Created: testuser (basic) - test@example.com
✓ Created: vipuser (vip) - vip@example.com
✓ Created: admin (vip) - admin@example.com
------------------------------------------------------------

Summary:
  Created: 3 users
  Skipped: 0 users
  Total: 3 users

============================================================
Test User Credentials:
============================================================

Username: testuser
Password: testpassword123
Tier: BASIC
Email: test@example.com

Username: vipuser
Password: vippassword123
Tier: VIP
Email: vip@example.com

Username: admin
Password: adminpassword123
Tier: VIP (Admin)
Email: admin@example.com
============================================================

✓ Seeding completed successfully!
```

---

## Troubleshooting

### Issue: "Module not found" errors
**Solution:** Make sure you're running from the backend directory or using `run_seed.py` which handles path setup automatically.

### Issue: Database connection errors
**Solution:** Verify your `DATABASE_URL` environment variable is set correctly in Railway:
1. Go to your backend service
2. Click on "Variables"
3. Check that `DATABASE_URL` is set (Railway usually sets this automatically for PostgreSQL services)

### Issue: "Alembic version not found"
**Solution:** Run migrations first:
```bash
railway run --service backend alembic upgrade head
```

### Issue: Users already exist
**Solution:** The seeder will skip existing users. If you want to recreate them, delete them first or modify the seeder script.

---

## Test User Credentials

After seeding, you can use these credentials to test:

**Basic User:**
- Username: `testuser`
- Password: `testpassword123`
- Email: `test@example.com`
- Tier: BASIC

**VIP User:**
- Username: `vipuser`
- Password: `vippassword123`
- Email: `vip@example.com`
- Tier: VIP

**Admin User:**
- Username: `admin`
- Password: `adminpassword123`
- Email: `admin@example.com`
- Tier: VIP (Admin)

---

## Notes

- The seeder is idempotent - running it multiple times won't create duplicates
- Existing users with the same email/username will be skipped
- Make sure migrations are up to date before seeding
- The seeder uses the same database connection as your application (from `DATABASE_URL`)
