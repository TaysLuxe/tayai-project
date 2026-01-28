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
    """Upgrade schema - add pgvector support if available.

    On databases where the `vector` extension is not installed (e.g. managed
    Postgres instances without pgvector), this migration will:
    - still add the `knowledge_base.vector_id` column, but
    - skip creating the `vector_embeddings` table and related indexes.
    """
    bind = op.get_bind()

    # Always add vector_id column; it does not depend on pgvector.
    op.execute(text("ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS vector_id VARCHAR"))

    # Detect whether pgvector is actually available on this server.
    has_vector_extension = False
    try:
        result = bind.execute(
            text("SELECT 1 FROM pg_available_extensions WHERE name = 'vector'")
        )
        has_vector_extension = result.scalar() is not None
    except Exception:
        # If we can't even query available extensions, assume it's not available.
        has_vector_extension = False

    if not has_vector_extension:
        # Log a notice in the DB logs and skip vector-specific schema.
        op.execute(
            text(
                "DO $$ BEGIN "
                "RAISE NOTICE 'pgvector extension not available on this PostgreSQL instance; "
                "skipping vector_embeddings table and indexes.'; "
                "END $$;"
            )
        )
        return

    # Try to enable pgvector; if this fails (permissions, etc.), skip the vector schema.
    try:
        bind.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    except Exception:
        op.execute(
            text(
                "DO $$ BEGIN "
                "RAISE NOTICE 'CREATE EXTENSION vector failed; skipping vector_embeddings "
                "table and indexes. Ensure pgvector is installed and extension can be created.'; "
                "END $$;"
            )
        )
        return

    # At this point, pgvector should be installed; it's safe to reference type `vector`.
    # Create vector_embeddings table to store chunked embeddings
    op.execute(text("""
        CREATE TABLE IF NOT EXISTS vector_embeddings (
            id VARCHAR PRIMARY KEY,
            knowledge_base_id INTEGER,
            embedding vector(1536) NOT NULL,
            content TEXT NOT NULL,
            metadata JSONB,
            namespace VARCHAR,
            chunk_index INTEGER,
            parent_id VARCHAR,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """))
    
    # Create indexes for vector search
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_vector_embeddings_knowledge_base_id ON vector_embeddings (knowledge_base_id)"))
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_vector_embeddings_namespace ON vector_embeddings (namespace)"))
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_vector_embeddings_parent_id ON vector_embeddings (parent_id)"))
    
    # Create vector index for similarity search (using HNSW for performance)
    op.execute(text("""
        CREATE INDEX IF NOT EXISTS vector_embeddings_embedding_idx 
        ON vector_embeddings 
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    """))


def downgrade() -> None:
    """Downgrade schema - remove pgvector support."""
    # Drop vector index
    op.execute(text("DROP INDEX IF EXISTS vector_embeddings_embedding_idx"))
    
    # Drop indexes
    op.execute(text("DROP INDEX IF EXISTS ix_vector_embeddings_parent_id"))
    op.execute(text("DROP INDEX IF EXISTS ix_vector_embeddings_namespace"))
    op.execute(text("DROP INDEX IF EXISTS ix_vector_embeddings_knowledge_base_id"))
    
    # Drop vector_embeddings table
    op.execute(text("DROP TABLE IF EXISTS vector_embeddings"))
    
    # Remove vector_id column from knowledge_base
    op.execute(text("ALTER TABLE knowledge_base DROP COLUMN IF EXISTS vector_id"))
    
    # Note: We don't drop the vector extension as it might be used by other databases

