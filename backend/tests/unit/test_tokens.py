"""
Unit tests for token utilities
"""
import pytest
from app.utils.tokens import create_user_tokens
from app.db.models import User
from app.core.constants import UserTier
from app.core.security import decode_access_token, decode_refresh_token


class TestCreateUserTokens:
    """Tests for create_user_tokens utility"""
    
    def test_create_user_tokens_basic_user(self):
        """Test creating tokens for basic user"""
        user = User(
            id=1,
            username="testuser",
            email="test@example.com",
            tier=UserTier.BASIC,
            is_admin=False,
        )
        
        tokens = create_user_tokens(user)
        
        assert tokens.access_token is not None
        assert tokens.refresh_token is not None
        assert tokens.token_type == "bearer"
        assert tokens.expires_in > 0
        
        # Verify access token payload
        access_payload = decode_access_token(tokens.access_token)
        assert access_payload is not None
        assert access_payload["user_id"] == 1
        assert access_payload["sub"] == "testuser"
        assert access_payload["tier"] == "basic"
        assert access_payload["is_admin"] is False
        
        # Verify refresh token payload
        refresh_payload = decode_refresh_token(tokens.refresh_token)
        assert refresh_payload is not None
        assert refresh_payload["user_id"] == 1
    
    def test_create_user_tokens_vip_user(self):
        """Test creating tokens for VIP user"""
        user = User(
            id=2,
            username="vipuser",
            email="vip@example.com",
            tier=UserTier.VIP,
            is_admin=False,
        )
        
        tokens = create_user_tokens(user)
        
        access_payload = decode_access_token(tokens.access_token)
        assert access_payload["tier"] == "vip"
    
    def test_create_user_tokens_admin_user(self):
        """Test creating tokens for admin user"""
        user = User(
            id=3,
            username="admin",
            email="admin@example.com",
            tier=UserTier.VIP,
            is_admin=True,
        )
        
        tokens = create_user_tokens(user)
        
        access_payload = decode_access_token(tokens.access_token)
        assert access_payload["is_admin"] is True
