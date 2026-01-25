"""
Pytest configuration and shared fixtures
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from typing import AsyncGenerator
from unittest.mock import Mock, AsyncMock, patch
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db.models import User
from app.core.constants import UserTier
from app.core.security import get_password_hash


# Test database URL (in-memory SQLite for testing)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False,
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()
    
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(db_session: AsyncSession):
    """Create a test client with overridden database dependency."""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=get_password_hash("testpassword123"),
        tier=UserTier.BASIC,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_vip_user(db_session: AsyncSession) -> User:
    """Create a test VIP user."""
    user = User(
        email="vip@example.com",
        username="vipuser",
        hashed_password=get_password_hash("testpassword123"),
        tier=UserTier.VIP,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_admin_user(db_session: AsyncSession) -> User:
    """Create a test admin user."""
    user = User(
        email="admin@example.com",
        username="admin",
        hashed_password=get_password_hash("adminpassword123"),
        tier=UserTier.VIP,
        is_active=True,
        is_admin=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


# Configure pytest-asyncio
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    mock = AsyncMock()
    mock.get = AsyncMock(return_value=None)
    mock.set = AsyncMock(return_value=True)
    mock.delete = AsyncMock(return_value=True)
    mock.incr = AsyncMock(return_value=1)
    mock.expire = AsyncMock(return_value=True)
    return mock


@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client."""
    mock = AsyncMock()
    mock.chat.completions.create = AsyncMock(return_value=Mock(
        choices=[Mock(message=Mock(content="Test response", role="assistant"))],
        usage=Mock(prompt_tokens=10, completion_tokens=20, total_tokens=30)
    ))
    mock.embeddings.create = AsyncMock(return_value=Mock(
        data=[Mock(embedding=[0.1] * 1536)]
    ))
    return mock
