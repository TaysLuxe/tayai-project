"""add_subscription_access_end_date

Revision ID: c_add_subscription_access_end_date
Revises: 33b4f801267b
Create Date: 2026-01-27 19:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = 'c_subscription_access'
down_revision: Union[str, Sequence[str], None] = '33b4f801267b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add subscription_access_end_date column to users table."""
    # Be idempotent (fresh DBs created via SQLAlchemy models may already have this column).
    op.execute(text(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_access_end_date TIMESTAMP WITH TIME ZONE"
    ))


def downgrade() -> None:
    """Remove subscription_access_end_date column from users table."""
    op.execute(text("ALTER TABLE users DROP COLUMN IF EXISTS subscription_access_end_date"))
