"""
Pytest configuration and shared fixtures
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, Mock
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db.models import Base


# Test database URL (in-memory SQLite for testing)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
def mock_db_session():
    """Mock database session for unit tests."""
    session = AsyncMock(spec=AsyncSession)
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()
    session.add = Mock()
    session.delete = Mock()
    return session


@pytest.fixture
async def test_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Real database session for integration tests."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client."""
    client = AsyncMock()
    client.embeddings.create = AsyncMock()
    client.chat.completions.create = AsyncMock()
    return client


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "user_id": 1,
        "username": "testuser",
        "tier": "basic",
        "is_admin": False,
    }


@pytest.fixture
def sample_message():
    """Sample chat message for testing."""
    return "How do I price my wigs?"


@pytest.fixture
def sample_conversation_history():
    """Sample conversation history."""
    return [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi! How can I help you?"},
    ]


@pytest.fixture
def mock_context_result():
    """Mock RAG context result."""
    from app.services.rag_service import ContextResult, Source
    
    return ContextResult(
        context="Sample context from knowledge base",
        sources=[
            Source(title="Test Source 1", content="Content 1", score=0.85),
            Source(title="Test Source 2", content="Content 2", score=0.75),
        ],
        total_matches=2,
    )


@pytest.fixture
def empty_context_result():
    """Empty RAG context result."""
    from app.services.rag_service import ContextResult
    
    return ContextResult(
        context="",
        sources=[],
        total_matches=0,
    )
