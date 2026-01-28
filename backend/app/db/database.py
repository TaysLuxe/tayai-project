"""
Database configuration and session management
"""
import logging
from pathlib import Path

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

logger = logging.getLogger(__name__)

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.DEBUG,
    future=True,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()

def _get_backend_dir() -> Path:
    # .../backend/app/db/database.py -> .../backend
    return Path(__file__).resolve().parents[3]


def _get_alembic_head_revision() -> str:
    """
    Compute the current Alembic HEAD revision from migration scripts,
    without touching the database.
    """
    from alembic.config import Config as AlembicConfig
    from alembic.script import ScriptDirectory

    backend_dir = _get_backend_dir()
    alembic_ini = backend_dir / "alembic.ini"

    cfg = AlembicConfig(str(alembic_ini))
    # Ensure script_location resolves correctly regardless of CWD.
    cfg.set_main_option("script_location", str(backend_dir / "alembic"))

    script = ScriptDirectory.from_config(cfg)
    head = script.get_current_head()
    if not head:
        raise RuntimeError("Could not determine Alembic head revision")
    return head


def _ensure_alembic_version_table(sync_conn: sa.Connection) -> None:
    """
    Ensure `alembic_version` exists and is stamped to HEAD.

    This project initializes schema via SQLAlchemy models (`create_all()`),
    so Alembic won't create its bookkeeping table unless migrations are run.
    Stamping HEAD lets future `alembic upgrade head` runs work correctly.
    """
    inspector = sa.inspect(sync_conn)
    table_names = set(inspector.get_table_names())
    head = _get_alembic_head_revision()

    if "alembic_version" not in table_names:
        sync_conn.execute(
            sa.text(
                """
                CREATE TABLE IF NOT EXISTS alembic_version (
                    version_num VARCHAR(32) NOT NULL,
                    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
                )
                """
            )
        )

    # Stamp to HEAD (single-row table).
    sync_conn.execute(sa.text("DELETE FROM alembic_version"))
    sync_conn.execute(
        sa.text("INSERT INTO alembic_version (version_num) VALUES (:v)"),
        {"v": head},
    )


async def get_db() -> AsyncSession:
    """Dependency for getting database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database (create tables and stamp Alembic)."""
    # Ensure models are imported so they are registered with Base.metadata.
    # (Avoids a no-op create_all on cold start.)
    from app.db import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # If DB is initialized via create_all, ensure Alembic bookkeeping exists.
        await conn.run_sync(_ensure_alembic_version_table)
