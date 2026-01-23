# TayAI Project Structure

This document explains the project structure and how components are organized.

## Overview

The TayAI project follows a clean architecture pattern with clear separation between:
- **Backend**: FastAPI application handling business logic, AI integration, and data persistence
- **Frontend**: Next.js application providing the user interface
- **Infrastructure**: Docker Compose for local development

## Backend Structure (`backend/`)

### `app/` - Main Application

```
app/
├── __init__.py          # Package info and version
├── __main__.py          # CLI entry point
├── main.py              # FastAPI application entry point
├── dependencies.py      # Shared dependencies (auth, database)
│
├── api/                 # API routes
│   └── v1/
│       ├── __init__.py      # API v1 exports
│       ├── router.py        # Main API router
│       ├── decorators.py    # API decorators (error handling, validation)
│       └── endpoints/       # Individual endpoint modules
│           ├── __init__.py      # Endpoint exports
│           ├── admin.py         # Admin & knowledge management
│           ├── auth.py          # Authentication endpoints
│           ├── chat.py          # Chat endpoints
│           ├── membership.py    # Membership platform integration
│           └── usage.py         # Usage tracking endpoints
│
├── core/                # Core configuration and utilities
│   ├── __init__.py          # Core module exports
│   ├── clients.py           # Shared OpenAI/Pinecone clients
│   ├── config.py            # Application settings (.env loading)
│   ├── constants.py         # Application-wide constants
│   ├── exceptions.py        # Custom exception classes
│   ├── performance.py       # Caching and performance utilities
│   ├── permissions.py        # Role-based access control (RBAC)
│   ├── query_helpers.py     # Database query optimization
│   ├── rate_limiter.py      # Rate limiting utilities
│   ├── security.py          # JWT and password hashing
│   └── prompts/             # Prompt engineering system
│       ├── __init__.py      # Package exports
│       ├── persona.py       # PersonaConfig, DEFAULT_PERSONA
│       ├── context.py       # ConversationContext, detection
│       ├── generation.py    # System prompt builders
│       └── fallbacks.py     # Fallback responses
│
├── db/                  # Database layer
│   ├── __init__.py          # Database module exports
│   ├── database.py          # Database connection and session
│   └── models.py            # SQLAlchemy models
│
├── schemas/             # Pydantic schemas (request/response)
│   ├── __init__.py          # Schema exports
│   ├── auth.py              # Token, UserLogin schemas
│   ├── chat.py              # ChatRequest, ChatResponse
│   ├── common.py            # Common schemas (ApiResponse, PaginatedResponse)
│   ├── knowledge.py         # Knowledge base schemas
│   ├── logging.py           # Logging schemas (MissingKBItem, QuestionLog)
│   └── usage.py             # Usage tracking schemas
│
├── services/            # Business logic layer
│   ├── __init__.py          # Service exports
│   ├── base.py              # BaseService class with common CRUD operations
│   ├── chat_service.py      # Chat and AI processing
│   ├── knowledge_service.py # Knowledge base management
│   ├── membership_service.py # Membership platform integration
│   ├── rag_service.py       # RAG (embeddings, vector search)
│   ├── usage_service.py     # Usage tracking and limits
│   ├── user_service.py      # User operations
│   └── helpers/             # Service helper modules
│       ├── __init__.py
│       ├── missing_kb_detector.py
│       ├── escalation_handler.py
│       ├── response_generator.py
│       └── namespace_mapper.py
│
├── middleware/          # Custom middleware
│   ├── __init__.py          # Middleware exports
│   └── rate_limit.py        # Rate limiting middleware
│
└── utils/               # Shared utility functions
    ├── __init__.py          # Utility exports
    ├── conversation.py      # Conversation history helpers
    ├── cost_calculator.py   # API cost estimation
    ├── text.py              # Text manipulation (sanitize, validate, truncate)
    ├── tokens.py            # Token creation utilities
    └── usage.py              # Usage limit checking dependency
```

### `scripts/` - Utility Scripts

```
scripts/
├── __init__.py
├── README.md                # Scripts documentation
├── build_foundational_kb.py # Build KB from source files
├── kb_coverage_checker.py   # Analyze KB coverage
├── kb_namespace_mapper.py   # Map content to namespaces
├── weekly_kb_review.py      # Generate weekly reports
├── process_ig_posts.py      # Process Instagram posts
├── download_zoom_transcripts.py  # Download transcripts
├── transcribe_recordings.py # Transcribe audio files
└── tests/                   # Test scripts
    ├── simple_test.py
    └── transcribe_test.py
```

### `tests/` - Automated Tests

```
tests/
├── __init__.py
├── conftest.py              # Shared fixtures and mocks
├── unit/                    # Unit tests (isolated)
│   ├── test_prompts.py      # Prompt engineering tests
│   ├── test_context.py      # Context detection tests
│   ├── test_utils.py        # Utility function tests
│   ├── test_schemas.py      # Schema validation tests
│   └── test_rag_service.py  # RAG service tests
└── integration/             # Integration tests
    └── test_api.py          # API endpoint tests
```

## Frontend Structure (`frontend/`)

```
frontend/
├── app/                 # Next.js App Directory
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
│
├── components/          # React Components
│   ├── __init__.ts
│   ├── ChatWidget.tsx   # Main chat interface
│   └── ui/              # Reusable UI components
│       ├── LoginForm.tsx
│       ├── MessageItem.tsx
│       ├── MessageList.tsx
│       ├── ChatInput.tsx
│       ├── LoadingSpinner.tsx
│       ├── LoadingIndicator.tsx
│       ├── ErrorAlert.tsx
│       └── index.ts
│
├── contexts/            # React Contexts
│   ├── __init__.ts
│   └── AuthContext.tsx  # Authentication state
│
├── lib/                 # Library code
│   └── api/             # API clients
│       ├── auth.ts      # Authentication API
│       ├── chat.ts      # Chat API
│       └── index.ts     # API exports
│
├── types/               # TypeScript type definitions
│   └── index.ts
│
├── utils/               # Utility functions
│   ├── api.ts           # API helpers
│   └── storage.ts       # Storage utilities
│
├── constants/           # Application constants
│   └── index.ts
│
└── hooks/               # Custom React hooks (future)
```

## Content Directory (`content/`)

Custom knowledge base content for TayAI:

```
content/
├── README.md            # Content authoring guide
├── faqs.yaml            # Frequently asked questions
├── frameworks.yaml      # Business frameworks
├── quick_tips.yaml      # Quick tips
└── courses/             # Course transcripts
    ├── README.md        # Course format guide
    └── _example-course.md  # Example template
```

## Documentation Structure

All documentation is organized in the `docs/` directory:

```
docs/
├── specifications/    # Core specs and architecture
│   ├── TAY_AI_SPECIFICATION.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── SECURITY_AUDIT.md
│   └── PROJECT_STRUCTURE.md (this file)
├── implementation/    # Implementation guides and summaries
│   ├── ACCOUNTABILITY_*.md
│   ├── ESCALATION_*.md
│   ├── KB_*.md
│   ├── TIER_BASED_*.md
│   └── ... (25+ implementation docs)
└── guides/            # User and developer guides
    ├── ADMIN_GUIDE.md
    ├── USER_GUIDE.md
    ├── API_DOCUMENTATION.md
    ├── RAILWAY_DEPLOYMENT_GUIDE.md
    └── ... (7 guide docs)
```

## Configuration Files

### Root Level
- `.env.example` - Environment variable template
- `.gitignore` - Git ignore rules
- `docker-compose.yml` - Docker services
- `docker-compose.prod.yml` - Production Docker services
- `README.md` - Project overview
- `LICENSE` - Project license

### Backend
- `requirements.txt` - Python dependencies
- `Dockerfile` - Backend container
- `alembic.ini` - Database migrations
- `pytest.ini` - Test configuration

### Frontend
- `package.json` - Node.js dependencies
- `Dockerfile` - Frontend container
- `tsconfig.json` - TypeScript config
- `tailwind.config.js` - Tailwind CSS
- `next.config.js` - Next.js config

## Key Design Patterns

### 1. Layered Architecture
- **API Layer**: FastAPI routers handle HTTP
- **Service Layer**: Business logic (ChatService, RAGService)
- **Data Layer**: SQLAlchemy models, Pinecone

### 2. Dependency Injection
- Database sessions via `get_db()`
- Current user via `get_current_user()`
- Shared clients via `get_openai_client()`, `get_pinecone_index()`

### 3. Module Exports
- Each package has `__init__.py` with `__all__` exports
- Clean imports: `from app.schemas import ChatResponse`
- Centralized configuration: `from app.core import settings`

## Data Flow

### Chat Request Flow
1. User sends message via frontend
2. `POST /api/v1/chat/` received by FastAPI
3. `ChatService.process_message()`:
   - Detect conversation context
   - Retrieve RAG context from Pinecone
   - Build system prompt with persona
   - Call OpenAI GPT-4
   - Save to PostgreSQL
4. Return response to frontend

### RAG Pipeline
1. User query received
2. Generate embedding via OpenAI
3. Query Pinecone for similar vectors
4. Filter by relevance score
5. Format context for prompt injection
6. Include in GPT-4 system message

## Running Tests

```bash
cd backend

# Run all tests
python3 -m pytest tests/ -v

# Run specific test file
python3 -m pytest tests/unit/test_prompts.py -v

# Run with coverage
python3 -m pytest tests/ --cov=app --cov-report=term-missing
```
