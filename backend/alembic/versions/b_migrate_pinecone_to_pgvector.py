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
    """Upgrade schema - add pgvector support."""
    # Enable pgvector extension
    # Note: CREATE EXTENSION requires superuser privileges in some PostgreSQL setups.
    # This checks if the extension exists first, and handles permission errors gracefully.
    op.execute(text("""
        DO $$
        BEGIN
            -- Check if extension exists
            IF NOT EXISTS (
                SELECT 1 FROM pg_extension WHERE extname = 'vector'
            ) THEN
                -- Try to create extension (may fail if user lacks superuser privileges)
                BEGIN
                    CREATE EXTENSION IF NOT EXISTS vector;
                EXCEPTION 
                    WHEN insufficient_privilege THEN
                        -- Extension creation requires superuser - assume admin will create it
                        -- or that it's available via another mechanism
                        RAISE NOTICE 'pgvector extension creation skipped: insufficient privileges. Extension may need to be created by database administrator.';
                    WHEN OTHERS THEN
                        -- Other errors (e.g., extension already exists from another session)
                        -- are non-fatal - continue migration
                        RAISE NOTICE 'pgvector extension creation encountered an error: %', SQLERRM;
                END;
            END IF;
        END $$;
    """))
    
    # Create vector_embeddings table to store chunked embeddings
    # Note: We use text() for the vector type since SQLAlchemy doesn't have native support
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
    # Use IF NOT EXISTS to be safe if indexes already exist (e.g., created via create_all()).
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
    
    # Update knowledge_base table - rename pinecone_id to vector_id for clarity
    # Note: We'll keep pinecone_id for now to avoid breaking existing code, but mark it as deprecated
    # The migration will add a new vector_id column
    op.execute(text("ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS vector_id VARCHAR"))


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

