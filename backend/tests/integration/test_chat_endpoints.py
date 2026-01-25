"""
Integration tests for chat endpoints
"""
import pytest
from fastapi import status
from unittest.mock import AsyncMock, patch
from app.services.chat_service import ChatService


class TestChatEndpoint:
    """Tests for POST /api/v1/chat"""
    
    @patch('app.api.v1.endpoints.chat.ChatService')
    @patch('app.api.v1.endpoints.chat.UsageService')
    async def test_send_message_success(self, mock_usage_service, mock_chat_service, client, test_user):
        """Test successful chat message"""
        # Login to get token
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "testpassword123"
            }
        )
        access_token = login_response.json()["access_token"]
        
        # Mock chat service response
        mock_response = AsyncMock()
        mock_response.response = "This is a test response"
        mock_response.sources = []
        mock_response.tokens_used = 100
        mock_response.message_id = 1
        
        mock_chat_instance = AsyncMock()
        mock_chat_instance.process_message = AsyncMock(return_value=mock_response)
        mock_chat_service.return_value = mock_chat_instance
        
        # Mock usage service
        mock_usage_instance = AsyncMock()
        mock_usage_instance.record_usage = AsyncMock()
        mock_usage_service.return_value = mock_usage_instance
        
        # Send chat message
        response = await client.post(
            "/api/v1/chat",
            json={
                "message": "Hello, how are you?",
                "conversation_history": [],
                "include_sources": False
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "response" in data
        assert "tokens_used" in data
    
    async def test_send_message_unauthorized(self, client):
        """Test chat message without authentication"""
        response = await client.post(
            "/api/v1/chat",
            json={
                "message": "Hello",
                "conversation_history": []
            }
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    async def test_send_message_empty_message(self, client, test_user):
        """Test chat message with empty message"""
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "testpassword123"
            }
        )
        access_token = login_response.json()["access_token"]
        
        response = await client.post(
            "/api/v1/chat",
            json={
                "message": "",
                "conversation_history": []
            },
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        # Should return 400 or 422 for empty message
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY]
    
    async def test_send_message_with_history(self, client, test_user):
        """Test chat message with conversation history"""
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "testpassword123"
            }
        )
        access_token = login_response.json()["access_token"]
        
        # Mock chat service
        with patch('app.api.v1.endpoints.chat.ChatService') as mock_chat_service, \
             patch('app.api.v1.endpoints.chat.UsageService') as mock_usage_service:
            
            mock_response = AsyncMock()
            mock_response.response = "Response with history"
            mock_response.sources = []
            mock_response.tokens_used = 150
            mock_response.message_id = 1
            
            mock_chat_instance = AsyncMock()
            mock_chat_instance.process_message = AsyncMock(return_value=mock_response)
            mock_chat_service.return_value = mock_chat_instance
            
            mock_usage_instance = AsyncMock()
            mock_usage_instance.record_usage = AsyncMock()
            mock_usage_service.return_value = mock_usage_instance
            
            response = await client.post(
                "/api/v1/chat",
                json={
                    "message": "What did I say before?",
                    "conversation_history": [
                        {"role": "user", "content": "Hello"},
                        {"role": "assistant", "content": "Hi there!"}
                    ],
                    "include_sources": True
                },
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            assert response.status_code == status.HTTP_200_OK


class TestChatHistoryEndpoint:
    """Tests for GET /api/v1/chat/history"""
    
    async def test_get_chat_history_success(self, client, test_user):
        """Test getting chat history"""
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "testpassword123"
            }
        )
        access_token = login_response.json()["access_token"]
        
        response = await client.get(
            "/api/v1/chat/history",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "messages" in data
        assert isinstance(data["messages"], list)
    
    async def test_get_chat_history_unauthorized(self, client):
        """Test getting chat history without authentication"""
        response = await client.get("/api/v1/chat/history")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    async def test_get_chat_history_with_limit(self, client, test_user):
        """Test getting chat history with limit parameter"""
        login_response = await client.post(
            "/api/v1/auth/login",
            data={
                "username": "testuser",
                "password": "testpassword123"
            }
        )
        access_token = login_response.json()["access_token"]
        
        response = await client.get(
            "/api/v1/chat/history?limit=10",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "messages" in data
