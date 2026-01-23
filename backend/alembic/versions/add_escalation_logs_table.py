"""Add escalation_logs table

Revision ID: add_escalation_logs
Revises: a7455c17a382
Create Date: 2025-01-22 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_escalation_logs'
down_revision: Union[str, Sequence[str], None] = 'a7455c17a382'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create escalation_logs table
    op.create_table(
        'escalation_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('offer', sa.String(), nullable=False),
        sa.Column('escalation_reason', sa.String(), nullable=True),
        sa.Column('context_type', sa.String(), nullable=True),
        sa.Column('user_tier', sa.String(), nullable=True),
        sa.Column('chat_message_id', sa.Integer(), nullable=True),
        sa.Column('conversion_tracked', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('converted', sa.Boolean(), nullable=True),
        sa.Column('converted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('extra_metadata', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_escalation_logs_id'), 'escalation_logs', ['id'], unique=False)
    op.create_index(op.f('ix_escalation_logs_user_id'), 'escalation_logs', ['user_id'], unique=False)
    op.create_index(op.f('ix_escalation_logs_offer'), 'escalation_logs', ['offer'], unique=False)
    op.create_index(op.f('ix_escalation_logs_user_tier'), 'escalation_logs', ['user_tier'], unique=False)
    op.create_index(op.f('ix_escalation_logs_chat_message_id'), 'escalation_logs', ['chat_message_id'], unique=False)
    op.create_index(op.f('ix_escalation_logs_conversion_tracked'), 'escalation_logs', ['conversion_tracked'], unique=False)
    op.create_index(op.f('ix_escalation_logs_converted'), 'escalation_logs', ['converted'], unique=False)
    op.create_index(op.f('ix_escalation_logs_created_at'), 'escalation_logs', ['created_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_escalation_logs_created_at'), table_name='escalation_logs')
    op.drop_index(op.f('ix_escalation_logs_converted'), table_name='escalation_logs')
    op.drop_index(op.f('ix_escalation_logs_conversion_tracked'), table_name='escalation_logs')
    op.drop_index(op.f('ix_escalation_logs_chat_message_id'), table_name='escalation_logs')
    op.drop_index(op.f('ix_escalation_logs_user_tier'), table_name='escalation_logs')
    op.drop_index(op.f('ix_escalation_logs_offer'), table_name='escalation_logs')
    op.drop_index(op.f('ix_escalation_logs_user_id'), table_name='escalation_logs')
    op.drop_index(op.f('ix_escalation_logs_id'), table_name='escalation_logs')
    op.drop_table('escalation_logs')
