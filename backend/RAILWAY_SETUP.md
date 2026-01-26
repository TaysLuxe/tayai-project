# Railway Setup - Test Users

This guide explains how to seed test users on Railway.

## Test User Credentials

After running the seed script, these credentials will be available:

**Test User (Basic)**
- Username: `testuser`
- Password: `testpassword123`

**VIP User**
- Username: `vipuser`
- Password: `vippassword123`

**Admin User**
- Username: `admin`
- Password: `adminpassword123`

## Running the Seed Script on Railway

### Option 1: Admin API Endpoint (Easiest - Recommended)

If you already have an admin user, you can seed users via the API:

1. **Login as admin** (or create admin user first via Railway CLI if needed)

2. **Call the seed endpoint:**
   ```bash
   curl -X POST https://your-railway-url.railway.app/api/v1/admin/users/seed \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json"
   ```

   Or use the API docs at: `https://your-railway-url.railway.app/docs`

3. **The response will show:**
   - Which users were created
   - Which users already existed (skipped)
   - Any errors
   - The test credentials

**Note:** This requires admin authentication. If you don't have an admin user yet, use Option 2 first.

### Option 2: Railway CLI

The Railway dashboard doesn't have a shell/terminal interface. Use the Railway CLI instead:

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. Navigate to your backend directory:
   ```bash
   cd backend
   ```

4. Link to your Railway project:
   ```bash
   railway link
   ```
   (Select your project and service when prompted)

5. **First, diagnose the environment:**
   ```bash
   railway run --service backend python diagnose_railway.py
   ```
   This will show you what Railway sees and help identify the issue.

6. **Run the seed script using one of these methods:**

   **Method A: Specify service explicitly (RECOMMENDED):**
   ```bash
   railway run --service backend python seed_users.py
   ```

   **Method B: Using python3:**
   ```bash
   railway run --service backend python3 seed_users.py
   ```

   **Method C: Using the Python runner:**
   ```bash
   railway run --service backend python run_seed.py
   ```

   **Method D: Using the bash wrapper:**
   ```bash
   railway run --service backend bash seed_railway.sh
   ```

   **Method E: If you're already in the backend directory locally:**
   ```bash
   cd backend
   railway run python seed_users.py
   ```

   The script will output which users were created or skipped. You can also check the "Deployments" tab in Railway dashboard to see the execution logs.

**Important Notes:**
- Make sure you're in the `backend` directory when running Railway CLI commands
- If Railway can't find the file, use the diagnostic script first: `railway run --service backend python diagnose_railway.py`
- The service name might not be "backend" - check your Railway dashboard for the actual service name
- If CLI doesn't work, use Option 1 (API endpoint) instead

### Troubleshooting

If you get "No such file or directory" error:

1. **Always specify the service:**
   ```bash
   railway run --service backend python diagnose_railway.py
   ```
   This shows what Railway actually sees.

2. **Check if you need to be in the backend directory:**
   ```bash
   cd backend
   railway run python diagnose_railway.py
   ```

3. **Verify the file exists in Railway:**
   ```bash
   railway run --service backend ls -la seed_users.py
   railway run --service backend ls -la *.py
   ```

4. **Try with explicit service and python3:**
   ```bash
   railway run --service backend python3 seed_users.py
   ```

5. **Check Railway service name:**
   - Go to Railway dashboard
   - Check your backend service name (might not be "backend")
   - Use that name: `railway run --service <your-service-name> python seed_users.py`

6. **Alternative: Run via Railway's one-off command:**
   - In Railway dashboard, go to your backend service
   - Use the "Deployments" tab to see recent deployments
   - Or use Railway CLI to create a one-off deployment with the seed command

### Option 2: One-time Setup Script (Alternative)

You can also add this to your Railway startup command temporarily:

```json
{
  "startCommand": "sh -c \"python seed_users.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}\""
}
```

**Note:** Remove this after first deployment, as the seed script will skip existing users but it's better to run it manually.

## Verifying Users

After seeding, you can verify users exist by:

1. **Via API:**
   ```bash
   curl -X POST https://your-railway-url.railway.app/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"testpassword123"}'
   ```

2. **Via Frontend:**
   - Navigate to `/login`
   - Use any of the test credentials above

## Notes

- The seed script is idempotent - it won't create duplicate users
- If a user already exists, it will be skipped
- Passwords are securely hashed using bcrypt
- Basic tier users get a 7-day trial period automatically
