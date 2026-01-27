# Testing Skool Subscription Integration

## Quick Test Guide

### Prerequisites
- Backend running: `http://localhost:8000`
- Database migrated and seeded

---

## Test 1: Create BASIC Tier Subscription ($37)

**Simulates:** New member joining "Hair Hu$tlers Co" (3 weeks access from Feb 6th)

**Access Rules:**
- Access starts: Feb 6th, 2026
- Access duration: 3 weeks (21 days)
- Access expires: Feb 27, 2026 (3 weeks from Feb 6th)

```bash
curl -X POST http://localhost:8000/api/v1/membership/webhook/skool \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.joined",
    "data": {
      "member": {
        "id": "skool_member_001",
        "email": "basic_user@example.com",
        "name": "Basic User",
        "username": "basicuser"
      },
      "group": {
        "id": "skool_group_1",
        "name": "Hair Hu$tlers Co."
      }
    }
  }'
```

**Expected Response:**
```json
{
  "status": "created",
  "email": "basic_user@example.com",
  "tier": "basic",
  "access_end_date": "2026-02-27T00:00:00Z"
}
```

**Verify in Database:**
```sql
SELECT email, tier, subscription_access_end_date 
FROM users 
WHERE email = 'basic_user@example.com';
```

**Expected:** `subscription_access_end_date` = Feb 27, 2026 (3 weeks from Feb 6th)

**Note:** Even if subscription starts before Feb 6th, access still starts from Feb 6th and expires 3 weeks later.

---

## Test 2: Create VIP Tier Subscription

**Simulates:** New member joining "Hair Hu$tlers Elite" (access starts Feb 6th, full access until subscription ends)

**Access Rules:**
- Access starts: Feb 6th, 2026 (even if subscription starts before)
- Access duration: While subscription is active
- Access expires: When subscription ends

```bash
curl -X POST http://localhost:8000/api/v1/membership/webhook/skool \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.joined",
    "data": {
      "member": {
        "id": "skool_member_002",
        "email": "vip_user@example.com",
        "name": "VIP User",
        "username": "vipuser"
      },
      "group": {
        "id": "skool_group_2",
        "name": "Hair Hu$tlers Elite"
      }
    },
    "metadata": {
      "subscription_start": "2026-01-15T00:00:00Z",
      "subscription_end": "2026-03-06T00:00:00Z"
    }
  }'
```

**Expected Response:**
```json
{
  "status": "created",
  "email": "vip_user@example.com",
  "tier": "vip",
  "access_end_date": "2026-03-06T00:00:00Z"
}
```

**Verify:** 
- `subscription_access_end_date` = March 6, 2026 (subscription end date)
- Access will start from Feb 6th (even though subscription started Jan 15th)
- User cannot access before Feb 6th, 2026

---

## Test 3: Subscription Payment/Update

**Simulates:** Member pays or subscription is renewed

```bash
curl -X POST http://localhost:8000/api/v1/membership/webhook/skool \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.paid",
    "data": {
      "member": {
        "id": "skool_member_002",
        "email": "vip_user@example.com",
        "name": "VIP User"
      },
      "group": {
        "id": "skool_group_2",
        "name": "Hair Hu$tlers Elite"
      }
    },
    "metadata": {
      "subscription_start": "2026-02-06T00:00:00Z",
      "subscription_end": "2026-04-06T00:00:00Z"
    }
  }'
```

**Expected Response:**
```json
{
  "status": "updated",
  "email": "vip_user@example.com",
  "tier": "vip",
  "access_end_date": "2026-04-06T00:00:00Z"
}
```

**Verify:** Access extended to April 6, 2026

---

## Test 4: Subscription Cancellation (Access Revoked)

**Simulates:** Member cancels subscription - access should be revoked immediately

```bash
curl -X POST http://localhost:8000/api/v1/membership/webhook/skool \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.cancelled",
    "data": {
      "member": {
        "id": "skool_member_002",
        "email": "vip_user@example.com",
        "name": "VIP User"
      },
      "group": {
        "id": "skool_group_2",
        "name": "Hair Hu$tlers Elite"
      }
    }
  }'
```

**Expected Response:**
```json
{
  "status": "access_revoked",
  "email": "vip_user@example.com",
  "access_end_date": "2026-01-27T19:30:00Z"
}
```

**Verify:** `subscription_access_end_date` = Current time (access revoked)

---

## Test 5: Verify Access Blocking

**Test that expired users cannot access TayAI:**

1. **Create a user with expired access:**
```bash
# First, create user
curl -X POST http://localhost:8000/api/v1/membership/webhook/skool \
  -H "Content-Type: application/json" \
  -d '{
    "event": "member.joined",
    "data": {
      "member": {
        "email": "expired_user@example.com",
        "name": "Expired User"
      },
      "group": {
        "name": "Hair Hu$tlers Co."
      }
    }
  }'
```

2. **Manually expire their access (via database or admin endpoint):**
```sql
UPDATE users 
SET subscription_access_end_date = NOW() - INTERVAL '1 day'
WHERE email = 'expired_user@example.com';
```

3. **Try to login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=expired_user&password=GENERATED_PASSWORD"
```

4. **Try to send a chat message (should fail):**
```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Hello",
    "conversation_history": []
  }'
```

**Expected:** `403 Forbidden` - "Your Skool subscription access has expired..."

---

## Test 6: Check Subscription Status

**Query database to see subscription status:**

```sql
SELECT 
  email,
  tier,
  subscription_access_end_date,
  CASE 
    WHEN subscription_access_end_date IS NULL THEN 'Active (no expiration)'
    WHEN subscription_access_end_date > NOW() THEN 'Active'
    ELSE 'Expired'
  END as access_status,
  CASE 
    WHEN subscription_access_end_date IS NULL THEN NULL
    WHEN subscription_access_end_date > NOW() THEN 
      EXTRACT(DAY FROM (subscription_access_end_date - NOW()))
    ELSE 0
  END as days_remaining
FROM users
WHERE email LIKE '%@example.com'
ORDER BY created_at DESC;
```

---

## Test 7: Automated Test Script

**Run the automated test script:**

```bash
./test_skool_integration.sh
```

This will test:
- Basic user creation
- VIP user creation
- Subscription upgrade
- Subscription cancellation
- Error handling

---

## Testing Access Expiration Logic

### BASIC Tier ($37) - 3 Weeks Access from Feb 6th

**Access Rule:** Always 3 weeks from Feb 6th, regardless of subscription start date

**Test Case 1: Subscription starts before Feb 6**
```bash
# Subscription starts Jan 1, but access starts Feb 6
# Access expires Feb 27 (3 weeks from Feb 6)
# User cannot access before Feb 6th
```

**Test Case 2: Subscription starts after Feb 6**
```bash
# Subscription starts Feb 10, but access still starts Feb 6
# Access expires Feb 27 (3 weeks from Feb 6, not from subscription start)
```

**Test Case 3: Current date is before Feb 6**
```bash
# If today is Jan 15, 2026
# User cannot access yet (403 error: "TayAI access starts on 2026-02-06")
```

### VIP Tier - Access Starts Feb 6th, Full Access Until Subscription Ends

**Access Rule:** Access starts from Feb 6th, then full access while subscription active

**Test Case 1: Subscription starts before Feb 6**
```bash
# Subscription starts Jan 15, ends March 6
# Access starts Feb 6, expires March 6
# User cannot access before Feb 6th
```

**Test Case 2: Subscription starts after Feb 6**
```bash
# Subscription starts Feb 10, ends March 6
# Access starts Feb 6, expires March 6
```

**Test Case 3: Subscription without end date**
```bash
# No end date provided
# Access starts Feb 6, remains active (NULL) until cancellation
```

**Test Case 4: Subscription ends before Feb 6**
```bash
# Subscription ends Jan 20 (before access start)
# Access revoked immediately (cannot start if subscription already ended)
```

---

## Using Swagger UI

1. Open: `http://localhost:8000/docs`
2. Navigate to: `POST /api/v1/membership/webhook/{platform}`
3. Click "Try it out"
4. Enter platform: `skool`
5. Paste webhook payload
6. Click "Execute"

---

## Monitoring Logs

**Watch backend logs for webhook processing:**
```bash
docker-compose logs -f backend | grep -i "webhook\|subscription\|access"
```

**Expected log messages:**
- `Received skool webhook: user.created`
- `BASIC tier access: 2026-02-06T00:00:00Z -> 2026-02-27T00:00:00Z (21 days)`
- `VIP tier access expires: 2026-03-06T00:00:00Z`
- `Revoked access for user: email@example.com`

---

## Common Test Scenarios

### Scenario 1: New BASIC Member
1. Send `member.joined` webhook for "Hair Hu$tlers Co"
2. Verify user created with `tier = basic`
3. Verify `subscription_access_end_date` = 3 weeks from Feb 6 or subscription start
4. User can login and use TayAI

### Scenario 2: BASIC Member Upgrades to VIP
1. Send `member.paid` webhook for "Hair Hu$tlers Elite"
2. Verify tier updated to `vip`
3. Verify `subscription_access_end_date` updated to subscription end date
4. Access extended

### Scenario 3: Member Cancels Subscription
1. Send `member.cancelled` webhook
2. Verify `subscription_access_end_date` = current time
3. User cannot login or use TayAI (403 error)

### Scenario 4: Access Expires Naturally
1. Wait for `subscription_access_end_date` to pass
2. User tries to login → 403 error
3. User tries to send message → UsageLimitExceededError

---

## Troubleshooting

**Issue: Access not expiring**
- Check `subscription_access_end_date` in database
- Verify it's in the past: `SELECT * FROM users WHERE subscription_access_end_date < NOW()`

**Issue: Webhook not creating user**
- Check logs: `docker-compose logs backend`
- Verify email is in payload
- Check if user already exists

**Issue: Wrong access end date**
- Check `SKOOL_ACCESS_START_DATE` in config
- Check `BASIC_TIER_ACCESS_DAYS` (should be 21)
- Verify subscription dates in webhook metadata

**Issue: Admin user blocked**
- Admin users should bypass access checks
- Verify `is_admin = true` in database

---

## Quick Reference

**Webhook Endpoint:**
```
POST http://localhost:8000/api/v1/membership/webhook/skool
```

**Supported Events:**
- `member.joined` → Create user, set access expiration
- `member.paid` → Update tier, extend access
- `member.cancelled` → Revoke access immediately

**Tier Mapping:**
- "Hair Hu$tlers Co" → BASIC (3 weeks access from Feb 6th)
- "Hair Hu$tlers Elite" → VIP (access starts Feb 6th, until subscription ends)

**Access Rules:**
- **Access Start Date:** Feb 6th, 2026 (all tiers)
- **BASIC:** 3 weeks access from Feb 6th (always expires Feb 27, 2026)
- **VIP:** Access starts Feb 6th, then full access while subscription active, expires when subscription ends
- **Cancelled:** Immediate revocation (access_end_date = current time)
- **Before Feb 6th:** No access for anyone (403 error)
