"""
Unit tests for Pydantic schemas
"""
import pytest
from pydantic import ValidationError
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.auth import UserLogin, TokenResponse
from app.schemas.knowledge import KnowledgeBaseCreate


class TestChatRequest:
    """Tests for ChatRequest schema."""
    
    def test_valid_request(self):
        request = ChatRequest(
            message="Hello, how are you?",
            conversation_history=[{"role": "user", "content": "Hi"}],
        )
        assert request.message == "Hello, how are you?"
        assert len(request.conversation_history) == 1
    
    def test_message_required(self):
        with pytest.raises(ValidationError):
            ChatRequest(conversation_history=[])
    
    def test_empty_message_invalid(self):
        with pytest.raises(ValidationError):
            ChatRequest(message="")
    
    def test_optional_conversation_history(self):
        request = ChatRequest(message="Hello")
        assert request.conversation_history is None or request.conversation_history == []


class TestChatResponse:
    """Tests for ChatResponse schema."""
    
    def test_valid_response(self):
        response = ChatResponse(
            response="Hello! How can I help you?",
            sources=[{"title": "Test", "content": "Content"}],
        )
        assert response.response == "Hello! How can I help you?"
        assert len(response.sources) == 1
    
    def test_response_required(self):
        with pytest.raises(ValidationError):
            ChatResponse(sources=[])
    
    def test_optional_sources(self):
        response = ChatResponse(response="Hello")
        assert response.sources is None or response.sources == []


class TestUserLogin:
    """Tests for UserLogin schema."""
    
    def test_valid_login(self):
        login = UserLogin(username="testuser", password="password123")
        assert login.username == "testuser"
        assert login.password == "password123"
    
    def test_username_required(self):
        with pytest.raises(ValidationError):
            UserLogin(password="password123")
    
    def test_password_required(self):
        with pytest.raises(ValidationError):
            UserLogin(username="testuser")


class TestKnowledgeBaseCreate:
    """Tests for KnowledgeBaseCreate schema."""
    
    def test_valid_create(self):
        kb_item = KnowledgeBaseCreate(
            title="Test Title",
            content="This is test content for the knowledge base.",
            category="tutorials",
            namespace="tutorials_technique",
        )
        assert kb_item.title == "Test Title"
        assert kb_item.category == "tutorials"
        assert kb_item.namespace == "tutorials_technique"
    
    def test_title_required(self):
        with pytest.raises(ValidationError):
            KnowledgeBaseCreate(content="Some content")
    
    def test_content_required(self):
        with pytest.raises(ValidationError):
            KnowledgeBaseCreate(title="Test Title")
    
    def test_min_content_length(self):
        with pytest.raises(ValidationError):
            KnowledgeBaseCreate(title="Test", content="Short")
    
    def test_optional_fields(self):
        kb_item = KnowledgeBaseCreate(
            title="Test Title",
            content="This is test content for the knowledge base.",
        )
        assert kb_item.category is None
        assert kb_item.namespace is None
