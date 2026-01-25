#!/usr/bin/env python3
"""
Seed Test Users Script

Creates test users in the database for development and testing purposes.
This script creates the same test users that are used in test fixtures.

Usage:
    python seed_users.py

Or with virtual environment:
    source venv/bin/activate
    python seed_users.py
"""
import asyncio
import sys
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import AsyncSessionLocal, init_db
from app.services.user_service import UserService
from app.core.constants import UserTier
from app.core.exceptions import AlreadyExistsError


# Test users to create
TEST_USERS = [
    {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpassword123",
        "tier": UserTier.BASIC,
        "is_admin": False,
    },
    {
        "email": "vip@example.com",
        "username": "vipuser",
        "password": "testpassword123",
        "tier": UserTier.VIP,
        "is_admin": False,
    },
    {
        "email": "admin@example.com",
        "username": "admin",
        "password": "adminpassword123",
        "tier": UserTier.VIP,
        "is_admin": True,
    },
]


async def seed_users():
    """Seed test users into the database."""
    print("Initializing database...")
    await init_db()
    
    print("\nCreating test users...")
    print("-" * 60)
    
    async with AsyncSessionLocal() as session:
        user_service = UserService(session)
        
        created_count = 0
        skipped_count = 0
        
        for user_data in TEST_USERS:
            try:
                user = await user_service.create_user(
                    email=user_data["email"],
                    username=user_data["username"],
                    password=user_data["password"],
                    tier=user_data["tier"],
                    is_admin=user_data["is_admin"],
                    start_trial=(user_data["tier"] == UserTier.BASIC)
                )
                print(f"✓ Created: {user.username} ({user.tier.value}) - {user.email}")
                created_count += 1
            except AlreadyExistsError as e:
                print(f"⊘ Skipped: {user_data['username']} (already exists)")
                skipped_count += 1
            except Exception as e:
                print(f"✗ Error creating {user_data['username']}: {str(e)}")
                continue
        
        print("-" * 60)
        print(f"\nSummary:")
        print(f"  Created: {created_count} users")
        print(f"  Skipped: {skipped_count} users")
        print(f"  Total: {len(TEST_USERS)} users")
        
        print("\n" + "=" * 60)
        print("Test User Credentials:")
        print("=" * 60)
        for user_data in TEST_USERS:
            tier_label = f"{user_data['tier'].value.upper()}" + (" (Admin)" if user_data["is_admin"] else "")
            print(f"\nUsername: {user_data['username']}")
            print(f"Password: {user_data['password']}")
            print(f"Tier: {tier_label}")
            print(f"Email: {user_data['email']}")
        print("=" * 60)


if __name__ == "__main__":
    try:
        asyncio.run(seed_users())
        print("\n✓ Seeding completed successfully!")
        sys.exit(0)
    except KeyboardInterrupt:
        print("\n\n✗ Seeding interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error during seeding: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
