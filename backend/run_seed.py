#!/usr/bin/env python3
"""
Railway-compatible seed script runner.
This ensures the script can be found and run regardless of working directory.
"""
import os
import sys
from pathlib import Path

# Get the directory where this script is located
script_dir = Path(__file__).parent.absolute()

# Change to script directory to ensure imports work
os.chdir(script_dir)

# Add to Python path
if str(script_dir) not in sys.path:
    sys.path.insert(0, str(script_dir))

print(f"Current directory: {os.getcwd()}")
print(f"Script directory: {script_dir}")
print(f"Python path includes: {script_dir}\n")

# Import and run the seed function directly
from seed_users import seed_users
import asyncio

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
