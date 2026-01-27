"""Add missing_kb_items and question_logs tables

Revision ID: a7455c17a382
Revises: 
Create Date: 2025-12-28 21:25:06.858587

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect, text


# revision identifiers, used by Alembic.
revision: str = 'a7455c17a382'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(table_name: str) -> bool:
    """Check if a table exists in the database."""
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def _column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def _index_exists(table_name: str, index_name: str) -> bool:
    """Check if an index exists on a table."""
    bind = op.get_bind()
    inspector = inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    indexes = [idx['name'] for idx in inspector.get_indexes(table_name)]
    return index_name in indexes


def upgrade() -> None:
    """Upgrade schema - idempotent migration that handles existing tables."""
    bind = op.get_bind()
    inspector = inspect(bind)
    
    # Create missing_kb_items table (idempotent - handles existing tables)
    try:
        if not _table_exists('missing_kb_items'):
            op.create_table(
                'missing_kb_items',
                sa.Column('id', sa.Integer(), nullable=False),
                sa.Column('user_id', sa.Integer(), nullable=False),
                sa.Column('question', sa.Text(), nullable=False),
                sa.Column('missing_detail', sa.Text(), nullable=False),
                sa.Column('ai_response_preview', sa.Text(), nullable=True),
                sa.Column('suggested_namespace', sa.String(), nullable=True),
                sa.Column('is_resolved', sa.Boolean(), nullable=True, server_default='false'),
                sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
                sa.Column('resolved_by_kb_id', sa.Integer(), nullable=True),
                sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
                sa.Column('extra_metadata', sa.JSON(), nullable=True),
                sa.PrimaryKeyConstraint('id')
            )
    except Exception as e:
        # Table might have been created between check and creation, or already exists
        error_str = str(e).lower()
        if "already exists" not in error_str and "duplicate" not in error_str:
            raise
    
    # Ensure table structure is correct and create indexes
    if _table_exists('missing_kb_items'):
        try:
            columns = [col['name'] for col in inspector.get_columns('missing_kb_items')]
            # Rename metadata to extra_metadata if needed
            if 'metadata' in columns and 'extra_metadata' not in columns:
                op.execute(text("ALTER TABLE missing_kb_items RENAME COLUMN metadata TO extra_metadata"))
            # Add extra_metadata column if it doesn't exist
            if 'extra_metadata' not in columns:
                op.add_column('missing_kb_items', sa.Column('extra_metadata', sa.JSON(), nullable=True))
        except Exception:
            pass  # Column operations might fail if already correct
    
    # Create indexes using raw SQL with IF NOT EXISTS (only if table exists)
    if _table_exists('missing_kb_items'):
        try:
            op.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_missing_kb_items_id ON missing_kb_items (id);
                CREATE INDEX IF NOT EXISTS ix_missing_kb_items_user_id ON missing_kb_items (user_id);
                CREATE INDEX IF NOT EXISTS ix_missing_kb_items_is_resolved ON missing_kb_items (is_resolved);
                CREATE INDEX IF NOT EXISTS ix_missing_kb_items_created_at ON missing_kb_items (created_at);
            """))
        except Exception:
            pass  # Indexes might already exist

    # Create question_logs table (idempotent - handles existing tables)
    try:
        if not _table_exists('question_logs'):
            op.create_table(
                'question_logs',
                sa.Column('id', sa.Integer(), nullable=False),
                sa.Column('user_id', sa.Integer(), nullable=False),
                sa.Column('question', sa.Text(), nullable=False),
                sa.Column('normalized_question', sa.String(), nullable=True),
                sa.Column('context_type', sa.String(), nullable=True),
                sa.Column('category', sa.String(), nullable=True),
                sa.Column('user_tier', sa.String(), nullable=True),
                sa.Column('tokens_used', sa.Integer(), nullable=True, server_default='0'),
                sa.Column('has_sources', sa.Boolean(), nullable=True, server_default='false'),
                sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
                sa.Column('extra_metadata', sa.JSON(), nullable=True),
                sa.PrimaryKeyConstraint('id')
            )
    except Exception as e:
        # Table might have been created between check and creation, or already exists
        error_str = str(e).lower()
        if "already exists" not in error_str and "duplicate" not in error_str:
            raise
    
    # Ensure table structure is correct and create indexes
    if _table_exists('question_logs'):
        try:
            columns = [col['name'] for col in inspector.get_columns('question_logs')]
            # Rename metadata to extra_metadata if needed
            if 'metadata' in columns and 'extra_metadata' not in columns:
                op.execute(text("ALTER TABLE question_logs RENAME COLUMN metadata TO extra_metadata"))
            # Add extra_metadata column if it doesn't exist
            if 'extra_metadata' not in columns:
                op.add_column('question_logs', sa.Column('extra_metadata', sa.JSON(), nullable=True))
        except Exception:
            pass  # Column operations might fail if already correct
    
    # Create indexes using raw SQL with IF NOT EXISTS (only if table exists)
    if _table_exists('question_logs'):
        try:
            op.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_question_logs_id ON question_logs (id);
                CREATE INDEX IF NOT EXISTS ix_question_logs_user_id ON question_logs (user_id);
                CREATE INDEX IF NOT EXISTS ix_question_logs_question ON question_logs (question);
                CREATE INDEX IF NOT EXISTS ix_question_logs_normalized_question ON question_logs (normalized_question);
                CREATE INDEX IF NOT EXISTS ix_question_logs_context_type ON question_logs (context_type);
                CREATE INDEX IF NOT EXISTS ix_question_logs_category ON question_logs (category);
                CREATE INDEX IF NOT EXISTS ix_question_logs_user_tier ON question_logs (user_tier);
                CREATE INDEX IF NOT EXISTS ix_question_logs_created_at ON question_logs (created_at);
            """))
        except Exception:
            pass  # Indexes might already exist


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
