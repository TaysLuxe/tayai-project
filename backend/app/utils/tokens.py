"""
Token Utilities

Provides functions for:
- Creating JWT tokens for users
- Token management helpers
"""
from datetime import timedelta
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token
from app.schemas.auth import Token
from app.db.models import User


def create_user_tokens(user: User) -> Token:
    """
    Create both access and refresh tokens for a user.
    
    This is a centralized helper to ensure consistent token creation
    across all authentication endpoints.
    
    Args:
        user: User model instance
        
    Returns:
        Token object with access_token, refresh_token, and metadata
    """
    access_token_expires = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.id,
            "tier": user.tier.value,
            "is_admin": user.is_admin,
        },
        expires_delta=access_token_expires
    )
    
    refresh_token = create_refresh_token(
        data={"user_id": user.id}
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

