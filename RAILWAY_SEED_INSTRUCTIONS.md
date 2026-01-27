# How to Seed Users in Railway

## Option 1: Railway Web Interface (Recommended)

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project: **stellar-playfulness**
3. Click on the **backend** service
4. Go to the **Deployments** tab
5. Click on the latest deployment
6. Click on **View Logs** or **Shell** tab
7. Run the seed command:
   ```bash
   python seed_users.py
   ```
   OR
   ```bash
   python run_seed.py
   ```

## Option 2: Railway CLI (If Option 1 doesn't work)

If the CLI is running locally instead of in Railway, try:

```bash
# Navigate to backend directory
cd backend

# Use Railway shell to get interactive access
railway shell

# Once in the Railway shell, run:
python seed_users.py
```

## Option 3: Railway CLI One-liner (Alternative)

Try running with explicit Python path:

```bash
cd backend
railway run --service backend "python3 -m seed_users" || railway run "cd /app && python3 seed_users.py"
```

## Option 4: Add as Deploy Command (Temporary)

You can temporarily modify `railway.json` to run the seed script on deploy:

```json
{
  "deploy": {
    "startCommand": "sh -c \"python seed_users.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}\""
  }
}
```

**Note:** Remove the seed command after first successful deployment to avoid re-seeding on every deploy.

## Expected Output

When successful, you should see:

```
Running from directory: /app
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

Username: vipuser
Password: vippassword123
Tier: VIP

Username: admin
Password: adminpassword123
Tier: VIP (Admin)
Email: admin@example.com
============================================================

✓ Seeding completed successfully!
```
