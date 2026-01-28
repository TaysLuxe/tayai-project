"""Migrate from Pinecone to PostgreSQL pgvector

Revision ID: b_migrate_pinecone_to_pgvector
Revises: a7455c17a382
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = 'b_migrate_pinecone_to_pgvector'
down_revision: Union[str, None] = 'a7455c17a382'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - non-breaking on databases without pgvector.

    IMPORTANT:
    - We DO NOT create the pgvector extension here.
    - We DO NOT create the `vector_embeddings` table here.
    - We ONLY add a plain `vector_id` column to `knowledge_base`.

    This guarantees Alembic migrations never fail on hosts where the
    `vector` extension is not installed (like your Railway Postgres).
    A separate migration / manual step can be added later for true
    pgvector support when running against a pgvector-enabled database.
    """
    op.execute(text("ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS vector_id VARCHAR"))


def downgrade() -> None:
    """Downgrade schema - remove knowledge_base.vector_id."""
    op.execute(text("ALTER TABLE knowledge_base DROP COLUMN IF EXISTS vector_id"))

    # NOTE: We intentionally do NOT touch any pgvector objects here
    # (extension, tables, indexes) to keep this migration safe on
    # databases that don't have pgvector installed.

