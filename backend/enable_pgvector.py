#!/usr/bin/env python3
"""
Enable pgvector extension in PostgreSQL database.

This script properly handles async SQLAlchemy 2.x syntax.
Usage:
    python enable_pgvector.py
    docker-compose exec backend python enable_pgvector.py
    railway run --service backend python enable_pgvector.py
"""
import asyncio
import sys
from pathlib import Path

# Ensure we can import from app directory
script_dir = Path(__file__).parent.absolute()
if str(script_dir) not in sys.path:
    sys.path.insert(0, str(script_dir))

from app.db.database import engine
from sqlalchemy import text


async def enable_pgvector():
    """Enable pgvector extension in the database."""
    try:
        print("Connecting to database...")
        async with engine.begin() as conn:
            print("Enabling pgvector extension...")
            await conn.execute(text('CREATE EXTENSION IF NOT EXISTS vector'))
            print("✅ pgvector extension enabled successfully!")
            
            # Verify extension is enabled
            result = await conn.execute(
                text("SELECT * FROM pg_extension WHERE extname = 'vector'")
            )
            row = result.fetchone()
            if row:
                print(f"✅ Verified: pgvector extension is active (version: {row.extversion if hasattr(row, 'extversion') else 'unknown'})")
            else:
                print("⚠️  Warning: Extension created but not found in pg_extension table")
            
        return 0
    except Exception as e:
        print(f"❌ Error enabling pgvector extension: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(enable_pgvector())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n✗ Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
