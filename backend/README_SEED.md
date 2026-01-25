# Seed Test Users

This script creates test users in your database for development and testing.

## Quick Start

```bash
# Activate virtual environment (if using one)
source venv/bin/activate

# Run the seed script
python seed_users.py
```

## Test Users Created

The script creates three test users:

### 1. Basic Tier User
- **Username:** `testuser`
- **Password:** `testpassword123`
- **Email:** `test@example.com`
- **Tier:** Basic (7-day trial)

### 2. VIP Tier User
- **Username:** `vipuser`
- **Password:** `testpassword123`
- **Email:** `vip@example.com`
- **Tier:** VIP

### 3. Admin User
- **Username:** `admin`
- **Password:** `adminpassword123`
- **Email:** `admin@example.com`
- **Tier:** VIP (Admin privileges)

## Usage

After running the script, you can:

1. **Login via the web interface:**
   - Navigate to `/login`
   - Use any of the test user credentials above

2. **Login via API:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=testuser&password=testpassword123"
   ```

## Notes

- The script will skip users that already exist (won't create duplicates)
- Basic tier users get a 7-day trial period automatically
- All users are created as active
- Passwords are securely hashed using bcrypt

## Troubleshooting

**Database connection error:**
- Ensure your database is running
- Check your `.env` file has the correct `DATABASE_URL`
- Verify database credentials

**User already exists:**
- This is normal if you've run the script before
- The script will skip existing users and continue

**Import errors:**
- Make sure you're in the `backend/` directory
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Activate your virtual environment if using one
