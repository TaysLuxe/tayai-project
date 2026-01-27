#!/usr/bin/env python3
"""
Run Alembic database migrations.

This script runs all pending migrations to ensure the database schema is up to date.
The alembic/env.py file handles database URL configuration from environment variables.
"""
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.absolute()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Change to backend directory (required for alembic.ini to be found)
os.chdir(backend_dir)

print(f"Running migrations from: {os.getcwd()}")
print(f"Backend directory: {backend_dir}")

# Import after path setup
from alembic.config import Config
from alembic import command

def run_migrations():
    """Run Alembic migrations."""
    # Create Alembic config
    # The alembic/env.py file will automatically read DATABASE_URL from environment
    alembic_cfg = Config("alembic.ini")
    
    # Check if DATABASE_URL is set
    database_url = os.getenv("DATABASE_URL", "")
    if not database_url:
        print("✗ Error: DATABASE_URL environment variable not set!")
        return 1
    
    # Mask password in log output
    if "@" in database_url:
        db_info = database_url.split("@")[1]
        print(f"Database: {db_info}")
    else:
        print("Database URL configured")
    
    print("Running migrations to head (latest)...")
    
    try:
        # Run upgrade to head (latest migration)
        # This will apply all pending migrations
        command.upgrade(alembic_cfg, "head")
        print("✓ Migrations completed successfully!")
        return 0
    except Exception as e:
        error_str = str(e)
        # Check if it's a duplicate table/index error - these are often safe to ignore
        # if the migration is idempotent
        if "already exists" in error_str.lower() or "duplicate" in error_str.lower():
            print(f"⚠ Warning: {error_str}")
            print("This may be safe to ignore if tables/indexes already exist.")
            print("Checking if we can continue...")
            # Try to continue - if it's just a duplicate, the migration might still be partially applied
            # In this case, we'll let it fail and the migration itself should handle idempotency
            import traceback
            traceback.print_exc()
            return 1
        else:
            print(f"✗ Migration failed: {e}")
            import traceback
            traceback.print_exc()
            return 1

if __name__ == "__main__":
    exit_code = run_migrations()
    sys.exit(exit_code)
