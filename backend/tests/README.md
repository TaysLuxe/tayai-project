# Test Suite Documentation

## Overview

This test suite provides comprehensive coverage for the TayAI backend application, including unit tests for core utilities and integration tests for API endpoints.

## Test Structure

```
tests/
├── __init__.py
├── conftest.py              # Shared fixtures and test configuration
├── unit/                    # Unit tests (fast, isolated)
│   ├── test_security.py     # Password hashing, JWT tokens
│   ├── test_tokens.py       # Token creation utilities
│   ├── test_text.py         # Text sanitization and validation
│   └── test_cost_calculator.py  # API cost calculations
└── integration/             # Integration tests (API endpoints)
    └── test_auth_endpoints.py  # Authentication endpoints
```

## Setup

### Prerequisites

1. Python 3.8+ with virtual environment support
2. All dependencies from `requirements.txt` installed

### Installation

```bash
# Create virtual environment (if not already created)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Verify pytest installation
pytest --version
```

## Running Tests

### Run All Tests

```bash
pytest tests/ -v
```

### Run Unit Tests Only

```bash
pytest tests/unit/ -v
```

### Run Integration Tests Only

```bash
pytest tests/integration/ -v
```

### Run Specific Test File

```bash
pytest tests/unit/test_security.py -v
```

### Run with Coverage

```bash
pytest tests/ --cov=app --cov-report=html --cov-report=term
```

### Run with Markers

```bash
# Run only unit tests
pytest -m unit -v

# Run only integration tests
pytest -m integration -v
```

## Test Coverage

### Unit Tests

#### Security Tests (`test_security.py`)
- Password hashing and verification
- Access token creation and decoding
- Refresh token creation and decoding
- Password reset token generation and verification
- Token expiration handling
- Token type validation

#### Token Utilities Tests (`test_tokens.py`)
- User token creation for different user tiers
- Token payload validation
- Admin user token handling

#### Text Processing Tests (`test_text.py`)
- Input sanitization (XSS prevention)
- Message content validation
- Text truncation utilities
- HTML/script tag removal
- Special character detection

#### Cost Calculator Tests (`test_cost_calculator.py`)
- Cost estimation from total tokens
- Cost calculation from input/output tokens
- Custom ratio handling
- Precision and rounding

### Integration Tests

#### Authentication Endpoints (`test_auth_endpoints.py`)
- User login (success, invalid credentials, inactive user)
- User registration (success, duplicate username/email, validation)
- Token refresh (success, invalid token, wrong token type)
- Token verification (success, invalid token, missing token)
- Get current user (success, unauthorized)
- Password change (success, wrong current password)

## Test Fixtures

### Database Fixtures
- `db_session`: Async database session with in-memory SQLite
- `test_user`: Basic tier test user
- `test_vip_user`: VIP tier test user
- `test_admin_user`: Admin user

### Client Fixtures
- `client`: Async HTTP test client with database override
- `mock_redis`: Mock Redis client
- `mock_openai_client`: Mock OpenAI client

## Configuration

Test configuration is in `pytest.ini`:
- Test discovery: `tests/` directory
- Async mode: `auto`
- Output: Verbose with short traceback
- Markers: `unit`, `integration`, `slow`

## Notes

- Tests use in-memory SQLite database for isolation
- All async tests use `pytest-asyncio`
- Integration tests require proper async client setup
- Mock fixtures available for external services (Redis, OpenAI)

## Expected Test Results

When all tests pass, you should see output similar to:

```
tests/unit/test_security.py ........................ [100%]
tests/unit/test_tokens.py ........ [100%]
tests/unit/test_text.py ........................ [100%]
tests/unit/test_cost_calculator.py ............ [100%]
tests/integration/test_auth_endpoints.py ................ [100%]

========= X passed in Y.YYs =========
```

## Troubleshooting

### Import Errors
- Ensure virtual environment is activated
- Verify all dependencies are installed: `pip install -r requirements.txt`

### Database Errors
- Tests use in-memory SQLite, no setup required
- If issues occur, check `conftest.py` database configuration

### Async Test Errors
- Ensure `pytest-asyncio` is installed
- Check that test functions are properly marked with `async def`

### Module Not Found
- Run tests from the `backend/` directory
- Ensure `PYTHONPATH` includes the backend directory
