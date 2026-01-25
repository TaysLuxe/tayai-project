"""
Integration tests for authentication endpoints
"""
import pytest
from fastapi import status
from app.core.security import decode_access_token, decode_refresh_token
from app.services.user_service import UserService


class TestLoginEndpoint:
    """Tests for POST /api/v1/auth/login"""
    
    async def test_login_success(self, client, test_user):
        """Test successful login"""
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "testpassword123"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
        
        # Verify token payload
        access_payload = decode_access_token(data["access_token"])
        assert access_payload is not None
        assert access_payload["user_id"] == test_user.id
        assert access_payload["sub"] == "testuser"
    
    async def test_login_invalid_username(self, client):
        """Test login with invalid username"""
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "nonexistent",
                "password": "password123"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    async def test_login_invalid_password(self, client, test_user):
        """Test login with invalid password"""
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    async def test_login_inactive_user(self, client, db_session, test_user):
        """Test login with inactive user"""
        user_service = UserService(db_session)
        await user_service.update_user(test_user.id, is_active=False)
        
        response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "testpassword123"
            }
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestRegisterEndpoint:
    """Tests for POST /api/v1/auth/register"""
    
    async def test_register_success(self, client):
        """Test successful user registration"""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "username": "newuser",
                "password": "newpassword123"
            }
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["username"] == "newuser"
        assert "id" in data
        assert data["tier"] == "basic"
        assert "hashed_password" not in data
    
    async def test_register_duplicate_username(self, client, test_user):
        """Test registration with duplicate username"""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "different@example.com",
                "username": "testuser",
                "password": "password123"
            }
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response.json()["detail"].lower()
    
    async def test_register_duplicate_email(self, client, test_user):
        """Test registration with duplicate email"""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "username": "differentuser",
                "password": "password123"
            }
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already registered" in response.json()["detail"].lower()
    
    async def test_register_invalid_email(self, client):
        """Test registration with invalid email format"""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "notanemail",
                "username": "newuser",
                "password": "password123"
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestRefreshTokenEndpoint:
    """Tests for POST /api/v1/auth/refresh"""
    
    async def test_refresh_token_success(self, client, test_user):
        """Test successful token refresh"""
        # First login to get tokens
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "testpassword123"
            }
        )
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh tokens
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        
        # Verify new access token
        access_payload = decode_access_token(data["access_token"])
        assert access_payload is not None
        assert access_payload["user_id"] == test_user.id
    
    async def test_refresh_token_invalid(self, client):
        """Test refresh with invalid token"""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid.token.here"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    async def test_refresh_token_access_token(self, client, test_user):
        """Test refresh with access token (should fail)"""
        # Get access token
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "testpassword123"
            }
        )
        access_token = login_response.json()["access_token"]
        
        # Try to use access token as refresh token
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": access_token}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestVerifyTokenEndpoint:
    """Tests for POST /api/v1/auth/verify"""
    
    async def test_verify_token_success(self, client, test_user):
        """Test successful token verification"""
        # Login to get token
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "testpassword123"
            }
        )
        access_token = login_response.json()["access_token"]
        
        # Verify token
        response = await client.post(
            "/api/v1/auth/verify",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["valid"] is True
        assert data["user_id"] == test_user.id
        assert data["username"] == "testuser"
        assert data["tier"] == "basic"
    
    async def test_verify_token_invalid(self, client):
        """Test verification with invalid token"""
        response = await client.post(
            "/api/v1/auth/verify",
            headers={"Authorization": "Bearer invalid.token.here"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    async def test_verify_token_missing(self, client):
        """Test verification without token"""
        response = await client.post("/api/v1/auth/verify")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestGetCurrentUserEndpoint:
    """Tests for GET /api/v1/auth/me"""
    
    async def test_get_current_user_success(self, client, test_user):
        """Test getting current user info"""
        # Login to get token
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "testpassword123"
            }
        )
        access_token = login_response.json()["access_token"]
        
        # Get current user
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == test_user.id
        assert data["email"] == test_user.email
        assert data["username"] == test_user.username
        assert "hashed_password" not in data
    
    async def test_get_current_user_unauthorized(self, client):
        """Test getting current user without authentication"""
        response = await client.get("/api/v1/auth/me")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestChangePasswordEndpoint:
    """Tests for POST /api/v1/auth/password/change"""
    
    async def test_change_password_success(self, client, test_user):
        """Test successful password change"""
        # Login to get token
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "testpassword123"
            }
        )
        access_token = login_response.json()["access_token"]
        
        # Change password
        response = await client.post(
            "/api/v1/auth/password/change",
            json={
                "current_password": "testpassword123",
                "new_password": "newpassword123"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        assert "successfully" in response.json()["message"].lower()
        
        # Verify new password works
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "newpassword123"
            }
        )
        assert login_response.status_code == status.HTTP_200_OK
    
    async def test_change_password_wrong_current(self, client, test_user):
        """Test password change with wrong current password"""
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "testpassword123"
            }
        )
        access_token = login_response.json()["access_token"]
        
        response = await client.post(
            "/api/v1/auth/password/change",
            json={
                "current_password": "wrongpassword",
                "new_password": "newpassword123"
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
