# Seeding Users in Railway - One-Time Deployment

## ✅ Setup Complete!

I've modified `railway.json` to include the seed command in the deployment. Here's what will happen:

### What Changed

The `startCommand` in `railway.json` has been temporarily modified to:
```json
"startCommand": "sh -c \"python run_migrations.py && python seed_users.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}\""
```

This will:
1. Run `run_migrations.py` to apply any pending database migrations (fixes the missing column error)
2. Run `seed_users.py` to create test users
3. Then start the FastAPI server normally

### Next Steps

1. **Commit and push the changes:**
   ```bash
   git add backend/railway.json
   git commit -m "Add seed users to deployment (one-time)"
   git push
   ```

2. **Railway will automatically deploy** with the new configuration

3. **Check the deployment logs** in Railway to see:
   - Seed script output
   - Confirmation that users were created
   - Server startup

4. **After successful seeding, update the config (keep migrations, remove seeding):**
   ```bash
   cd backend
   ./RESTORE_RAILWAY_CONFIG.sh
   git add railway.json
   git commit -m "Remove seed command from deployment (keep migrations)"
   git push
   ```
   
   **Note:** Migrations will continue to run on each deployment to ensure the database schema stays up to date. This is the correct behavior.

### Expected Output in Logs

When the deployment runs, you should see:

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
INFO:     Started server process
INFO:     Waiting for application startup.
...
```

### Important Notes

- ✅ The migration script ensures the database schema is up to date (fixes missing column errors)
- ✅ The seed script is **idempotent** - it safely skips users that already exist
- ✅ Safe to run multiple times (won't create duplicates)
- ⚠️ **Remember to restore the config** after seeding to remove the seed command (migrations should stay)
- 📝 Migrations will continue to run on every deployment (this is correct behavior)

### Alternative: Manual Seeding via Railway Web Interface

If you prefer not to modify the deployment config:

1. Go to Railway Dashboard → Your Project → Backend Service
2. Click on "Shell" or "Deployments" → Latest → "Shell"
3. Run: `python seed_users.py`
4. No need to restore config in this case

### Restore Config (Remove Seeding)

To update the configuration (keep migrations, remove seeding):

```bash
cd backend
./RESTORE_RAILWAY_CONFIG.sh
```

This will update `railway.json` to:
```json
"startCommand": "sh -c \"python run_migrations.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}\""
```

**Why keep migrations?** Migrations should run on every deployment to ensure the database schema is always up to date when new migrations are added.
