# TayAI Project

AI-powered assistant for hair business mentorship with RAG-enhanced knowledge base.

## Quick Start

```bash
# Backend
cd backend
python3 -m pip install -r requirements.txt
python3 -m app

# Frontend
cd frontend
npm install
npm run dev
```

## Project Structure

```
tayai-project/
├── backend/          # FastAPI backend application
│   ├── app/         # Main application code
│   ├── scripts/     # Utility scripts
│   ├── tests/       # Automated tests
│   └── data/        # Source data files
├── frontend/         # Next.js frontend application
│   ├── app/         # Next.js app directory
│   ├── components/  # React components
│   ├── lib/         # API clients
│   ├── types/       # TypeScript types
│   └── utils/       # Utility functions
└── docs/             # Documentation
    ├── specifications/  # Architecture and specs
    ├── implementation/  # Implementation guides
    └── guides/         # User and developer guides
```

## Documentation

All documentation is organized in the `docs/` directory:

- **Specifications**: See `docs/specifications/`
- **Implementation Guides**: See `docs/implementation/`
- **User Guides**: See `docs/guides/`

For a complete documentation index, see [docs/README.md](./docs/README.md).

## Key Features

### Backend (FastAPI)
- RAG-enhanced chat with knowledge base
- User authentication and authorization
- Usage tracking and limits
- Knowledge base management
- Missing KB detection and logging
- Intelligent escalation to paid offerings

### Frontend (Next.js)
- Chat widget with real-time messaging
- Authentication flow
- Responsive UI with dark mode
- Organized component structure

## Development URLs

- Backend API: http://localhost:8000
- Backend API Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000

## Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=term-missing
```

## Deployment

See `docs/guides/RAILWAY_DEPLOYMENT_GUIDE.md` for deployment instructions.

## License

See [LICENSE](./LICENSE) file.
