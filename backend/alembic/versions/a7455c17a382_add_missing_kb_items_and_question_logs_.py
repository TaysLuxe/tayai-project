"""Add missing_kb_items and question_logs tables

Revision ID: a7455c17a382
Revises: 
Create Date: 2025-12-28 21:25:06.858587

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = 'a7455c17a382'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - idempotent migration using raw SQL with IF NOT EXISTS."""
    
    # Use raw SQL with IF NOT EXISTS to handle existing tables gracefully
    # This approach works even if tables already exist and doesn't require transaction rollback
    
    # Create missing_kb_items table if it doesn't exist
    op.execute(text("""
        CREATE TABLE IF NOT EXISTS missing_kb_items (
            id SERIAL NOT NULL,
            user_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            missing_detail TEXT NOT NULL,
            ai_response_preview TEXT,
            suggested_namespace VARCHAR,
            is_resolved BOOLEAN DEFAULT 'false',
            resolved_at TIMESTAMP WITH TIME ZONE,
            resolved_by_kb_id INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            extra_metadata JSON,
            PRIMARY KEY (id)
        )
    """))
    
    # Handle column rename/add if needed (legacy support)
    op.execute(text("""
        DO $$
        BEGIN
            -- Rename metadata to extra_metadata if it exists
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'missing_kb_items' 
                AND column_name = 'metadata'
                AND NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'missing_kb_items' 
                    AND column_name = 'extra_metadata'
                )
            ) THEN
                ALTER TABLE missing_kb_items RENAME COLUMN metadata TO extra_metadata;
            END IF;
            
            -- Add extra_metadata column if table exists but column doesn't
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'missing_kb_items'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'missing_kb_items' 
                AND column_name = 'extra_metadata'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'missing_kb_items' 
                AND column_name = 'metadata'
            ) THEN
                ALTER TABLE missing_kb_items ADD COLUMN extra_metadata JSON;
            END IF;
        END $$;
    """))
    
    # Create indexes if they don't exist
    # NOTE: asyncpg commonly rejects multi-statement SQL in a single execute call,
    # which can abort the transaction and cause confusing follow-on errors.
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_missing_kb_items_id ON missing_kb_items (id)"))
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_missing_kb_items_user_id ON missing_kb_items (user_id)"))
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_missing_kb_items_is_resolved ON missing_kb_items (is_resolved)"))
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_missing_kb_items_created_at ON missing_kb_items (created_at)"))
    
    # Create question_logs table if it doesn't exist
    op.execute(text("""
        CREATE TABLE IF NOT EXISTS question_logs (
            id SERIAL NOT NULL,
            user_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            normalized_question VARCHAR,
            context_type VARCHAR,
            category VARCHAR,
            user_tier VARCHAR,
            tokens_used INTEGER DEFAULT 0,
            has_sources BOOLEAN DEFAULT 'false',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            extra_metadata JSON,
            PRIMARY KEY (id)
        )
    """))
    
    # Handle column rename/add if needed (legacy support)
    op.execute(text("""
        DO $$
        BEGIN
            -- Rename metadata to extra_metadata if it exists
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'question_logs' 
                AND column_name = 'metadata'
                AND NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'question_logs' 
                    AND column_name = 'extra_metadata'
                )
            ) THEN
                ALTER TABLE question_logs RENAME COLUMN metadata TO extra_metadata;
            END IF;
            
            -- Add extra_metadata column if table exists but column doesn't
            IF EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'question_logs'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'question_logs' 
                AND column_name = 'extra_metadata'
            ) AND NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'question_logs' 
                AND column_name = 'metadata'
            ) THEN
                ALTER TABLE question_logs ADD COLUMN extra_metadata JSON;
            END IF;
        END $$;
    """))
    
    # Create indexes if they don't exist
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_question_logs_id ON question_logs (id)"))
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_question_logs_user_id ON question_logs (user_id)"))
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_question_logs_question ON question_logs (question)"))
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_question_logs_normalized_question ON question_logs (normalized_question)"))
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_question_logs_context_type ON question_logs (context_type)"))
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_question_logs_category ON question_logs (category)"))
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_question_logs_user_tier ON question_logs (user_tier)"))
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_question_logs_created_at ON question_logs (created_at)"))


def downgrade() -> None:
    """Downgrade schema."""
    # Drop question_logs table
    op.drop_index(op.f('ix_question_logs_created_at'), table_name='question_logs')
    op.drop_index(op.f('ix_question_logs_user_tier'), table_name='question_logs')
    op.drop_index(op.f('ix_question_logs_category'), table_name='question_logs')
    op.drop_index(op.f('ix_question_logs_context_type'), table_name='question_logs')
    op.drop_index(op.f('ix_question_logs_normalized_question'), table_name='question_logs')
    op.drop_index(op.f('ix_question_logs_question'), table_name='question_logs')
    op.drop_index(op.f('ix_question_logs_user_id'), table_name='question_logs')
    op.drop_index(op.f('ix_question_logs_id'), table_name='question_logs')
    op.drop_table('question_logs')

    # Drop missing_kb_items table
    op.drop_index(op.f('ix_missing_kb_items_created_at'), table_name='missing_kb_items')
    op.drop_index(op.f('ix_missing_kb_items_is_resolved'), table_name='missing_kb_items')
    op.drop_index(op.f('ix_missing_kb_items_user_id'), table_name='missing_kb_items')
    op.drop_index(op.f('ix_missing_kb_items_id'), table_name='missing_kb_items')
    op.drop_table('missing_kb_items')
