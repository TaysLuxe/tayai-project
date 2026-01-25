"""
Unit tests for security utilities
"""
import pytest
from datetime import timedelta
from jose import jwt
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    generate_password_reset_token,
    verify_password_reset_token,
)
from app.core.config import settings


class TestPasswordHashing:
    """Tests for password hashing and verification"""
    
    def test_hash_password(self):
        """Test password hashing produces different hashes for same password"""
        password = "testpassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        assert hash1 != hash2
        assert len(hash1) > 0
        assert hash1.startswith("$2b$")
    
    def test_verify_correct_password(self):
        """Test verifying correct password"""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
    
    def test_verify_incorrect_password(self):
        """Test verifying incorrect password"""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = get_password_hash(password)
        
        assert verify_password(wrong_password, hashed) is False
    
    def test_verify_empty_password(self):
        """Test verifying empty password"""
        password = ""
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True


class TestAccessTokens:
    """Tests for access token creation and decoding"""
    
    def test_create_access_token(self):
        """Test creating access token"""
        data = {"user_id": 1, "username": "testuser", "tier": "basic"}
        token = create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_decode_valid_access_token(self):
        """Test decoding valid access token"""
        data = {"user_id": 1, "username": "testuser", "tier": "basic"}
        token = create_access_token(data)
        decoded = decode_access_token(token)
        
        assert decoded is not None
        assert decoded["user_id"] == 1
        assert decoded["username"] == "testuser"
        assert decoded["tier"] == "basic"
        assert decoded["type"] == "access"
        assert "exp" in decoded
        assert "iat" in decoded
    
    def test_decode_invalid_token(self):
        """Test decoding invalid token"""
        invalid_token = "invalid.token.here"
        decoded = decode_access_token(invalid_token)
        
        assert decoded is None
    
    def test_decode_expired_token(self):
        """Test decoding expired token"""
        data = {"user_id": 1, "username": "testuser"}
        token = create_access_token(data, expires_delta=timedelta(seconds=-1))
        decoded = decode_access_token(token)
        
        assert decoded is None
    
    def test_access_token_custom_expiration(self):
        """Test access token with custom expiration"""
        data = {"user_id": 1}
        token = create_access_token(data, expires_delta=timedelta(hours=2))
        decoded = decode_access_token(token)
        
        assert decoded is not None
        exp_time = decoded["exp"]
        iat_time = decoded["iat"]
        assert exp_time - iat_time == 7200  # 2 hours in seconds
    
    def test_access_token_rejects_refresh_token(self):
        """Test that access token decoder rejects refresh tokens"""
        data = {"user_id": 1}
        refresh_token = create_refresh_token(data)
        decoded = decode_access_token(refresh_token)
        
        assert decoded is None


class TestRefreshTokens:
    """Tests for refresh token creation and decoding"""
    
    def test_create_refresh_token(self):
        """Test creating refresh token"""
        data = {"user_id": 1}
        token = create_refresh_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_decode_valid_refresh_token(self):
        """Test decoding valid refresh token"""
        data = {"user_id": 1}
        token = create_refresh_token(data)
        decoded = decode_refresh_token(token)
        
        assert decoded is not None
        assert decoded["user_id"] == 1
        assert decoded["type"] == "refresh"
        assert "jti" in decoded
        assert "exp" in decoded
        assert "iat" in decoded
    
    def test_refresh_token_has_unique_jti(self):
        """Test that refresh tokens have unique JTI"""
        data = {"user_id": 1}
        token1 = create_refresh_token(data)
        token2 = create_refresh_token(data)
        
        decoded1 = decode_refresh_token(token1)
        decoded2 = decode_refresh_token(token2)
        
        assert decoded1["jti"] != decoded2["jti"]
    
    def test_refresh_token_rejects_access_token(self):
        """Test that refresh token decoder rejects access tokens"""
        data = {"user_id": 1, "username": "testuser"}
        access_token = create_access_token(data)
        decoded = decode_refresh_token(access_token)
        
        assert decoded is None
    
    def test_refresh_token_custom_expiration(self):
        """Test refresh token with custom expiration"""
        data = {"user_id": 1}
        token = create_refresh_token(data, expires_delta=timedelta(days=14))
        decoded = decode_refresh_token(token)
        
        assert decoded is not None
        exp_time = decoded["exp"]
        iat_time = decoded["iat"]
        assert exp_time - iat_time == 14 * 24 * 3600  # 14 days in seconds


class TestPasswordResetTokens:
    """Tests for password reset token generation and verification"""
    
    def test_generate_password_reset_token(self):
        """Test generating password reset token"""
        email = "test@example.com"
        token = generate_password_reset_token(email)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_verify_valid_password_reset_token(self):
        """Test verifying valid password reset token"""
        email = "test@example.com"
        token = generate_password_reset_token(email)
        verified_email = verify_password_reset_token(token)
        
        assert verified_email == email
    
    def test_verify_invalid_password_reset_token(self):
        """Test verifying invalid password reset token"""
        invalid_token = "invalid.token.here"
        verified_email = verify_password_reset_token(invalid_token)
        
        assert verified_email is None
    
    def test_password_reset_token_rejects_other_tokens(self):
        """Test that password reset token verifier rejects other token types"""
        data = {"user_id": 1}
        access_token = create_access_token(data)
        refresh_token = create_refresh_token(data)
        
        assert verify_password_reset_token(access_token) is None
        assert verify_password_reset_token(refresh_token) is None
