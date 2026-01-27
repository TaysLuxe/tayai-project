# Running User Seeder in Railway

## Method 1: Using Railway CLI

### Prerequisites
Install Railway CLI if you haven't already:
```bash
npm i -g @railway/cli
```

### Steps

1. **Login to Railway:**
```bash
railway login
```

2. **Link to your project:**
```bash
railway link
```
Select your project when prompted.

3. **Run the seeder:**

**Option A: Using the shell script (Recommended - handles path detection):**
```bash
railway run --service backend bash seed_railway.sh
```

**Option B: Change to backend directory first:**
```bash
railway run --service backend sh -c "cd /app && python run_seed.py"
```

**Option C: Use full path (if Railway runs from project root):**
```bash
railway run --service backend sh -c "python /app/run_seed.py"
```

**Option D: Direct seed_users.py (if in /app directory):**
```bash
railway run --service backend sh -c "cd /app && python seed_users.py"
```

**Note:** Railway containers use `/app` as the working directory. If the command fails, try Option A (shell script) which automatically detects the correct path.

---

## Method 2: Using Railway Web Interface

1. Go to your Railway project dashboard
2. Select your **backend** service
3. Click on the **"Deployments"** tab
4. Click on the latest deployment
5. Click **"View Logs"** or open the **"Shell"** tab
6. Run:
```bash
python run_seed.py
```

Or navigate to the backend directory first:
```bash
cd backend
python run_seed.py
```

---

## Method 3: One-off Command via Railway CLI

You can also run it as a one-off command:
```bash
railway run --service backend --command "python run_seed.py"
```

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
