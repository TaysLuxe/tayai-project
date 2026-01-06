"""
Database Module

Database configuration, models, and connection management.
"""
from app.db.database import (
    Base,
    AsyncSessionLocal,
    get_db,
    init_db,
)
from app.db.models import (
    User,
    UserTier,
    ChatMessage,
    UsageTracking,
    KnowledgeBase,
    VectorEmbedding,
    MissingKBItem,
    QuestionLog,
)

__all__ = [
    # Database connection
    "Base",
    "AsyncSessionLocal",
    "get_db",
    "init_db",
    # Models
    "User",
    "UserTier",
    "ChatMessage",
    "UsageTracking",
    "KnowledgeBase",
    "VectorEmbedding",
    "MissingKBItem",
    "QuestionLog",
]
