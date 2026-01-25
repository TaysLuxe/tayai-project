"""rename_metadata_to_meta_data_in_vector_embeddings

Revision ID: 33b4f801267b
Revises: a8aed5317553
Create Date: 2026-01-25 03:00:06.708212

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '33b4f801267b'
down_revision: Union[str, Sequence[str], None] = 'a8aed5317553'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - rename metadata column to meta_data."""
    # Rename metadata to meta_data to match SQLAlchemy model
    # (metadata is a reserved word in SQLAlchemy)
    op.execute("ALTER TABLE vector_embeddings RENAME COLUMN metadata TO meta_data")


def downgrade() -> None:
    """Downgrade schema - rename meta_data column back to metadata."""
    op.execute("ALTER TABLE vector_embeddings RENAME COLUMN meta_data TO metadata")
