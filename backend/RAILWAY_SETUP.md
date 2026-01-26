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

### Option 1: Railway CLI (Recommended)

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

5. Run the seed script:
   ```bash
   railway run python seed_users.py
   ```

   The script will output which users were created or skipped. You can also check the "Deployments" tab in Railway dashboard to see the execution logs.

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
