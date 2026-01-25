"""
Utility Functions for TayAI

This module provides reusable utility functions for:
- Text processing and validation
- Data conversion and formatting
- Common operations

Usage:
    from app.utils import sanitize_user_input, validate_message_content, truncate_text
    from app.utils import convert_conversation_history
    from app.utils import create_user_tokens
    from app.utils import check_usage_limit_dependency
"""
from .text import (
    sanitize_user_input,
    validate_message_content,
    truncate_text,
)
from .conversation import convert_conversation_history
from .tokens import create_user_tokens
# Import usage dependency lazily to avoid circular import
# from .usage import check_usage_limit_dependency
from .cost_calculator import (
    estimate_cost_from_total_tokens,
    estimate_cost_from_tokens,
)

__all__ = [
    # Text utilities
    "sanitize_user_input",
    "validate_message_content",
    "truncate_text",
    # Conversation utilities
    "convert_conversation_history",
    # Token utilities
    "create_user_tokens",
    # Usage utilities - import directly from app.utils.usage to avoid circular import
    # "check_usage_limit_dependency",
    # Cost calculation
    "estimate_cost_from_total_tokens",
    "estimate_cost_from_tokens",
]

