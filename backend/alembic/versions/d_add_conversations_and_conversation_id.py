"""add_conversations_and_conversation_id

Revision ID: d_conversations
Revises: c_subscription_access
Create Date: 2026-01-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


revision: str = 'd_conversations'
down_revision: Union[str, Sequence[str], None] = 'c_subscription_access'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(text("""
        CREATE TABLE IF NOT EXISTS conversations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            title VARCHAR(500),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """))
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_conversations_user_id ON conversations (user_id)"))

    op.execute(text("""
        ALTER TABLE chat_messages
        ADD COLUMN IF NOT EXISTS conversation_id INTEGER REFERENCES conversations(id)
    """))
    op.execute(text("CREATE INDEX IF NOT EXISTS ix_chat_messages_conversation_id ON chat_messages (conversation_id)"))


def downgrade() -> None:
    op.execute(text("ALTER TABLE chat_messages DROP COLUMN IF EXISTS conversation_id"))
    op.execute(text("DROP TABLE IF EXISTS conversations"))

