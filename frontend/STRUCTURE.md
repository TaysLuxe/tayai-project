# Frontend Code Structure

This document describes the organized structure of the TayAI frontend codebase.

## Directory Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (login + chat)
│   └── globals.css        # Global styles
│
├── components/            # React Components
│   ├── ChatWidget.tsx     # Main chat interface
│   └── ui/                # Reusable UI components
│       ├── LoginForm.tsx
│       ├── LoadingSpinner.tsx
│       ├── MessageItem.tsx
│       ├── MessageList.tsx
│       ├── LoadingIndicator.tsx
│       ├── ChatInput.tsx
│       ├── ErrorAlert.tsx
│       └── index.ts       # Component exports
│
├── contexts/              # React Contexts
│   ├── AuthContext.tsx    # Authentication state
│   └── __init__.ts
│
├── lib/                   # Library code
│   └── api/               # API clients
│       ├── auth.ts        # Authentication API
│       ├── chat.ts        # Chat API
│       └── index.ts       # API exports
│
├── types/                 # TypeScript type definitions
│   └── index.ts           # All type exports
│
├── utils/                 # Utility functions
│   ├── api.ts             # API helper functions
│   └── storage.ts         # Local storage utilities
│
├── constants/             # Application constants
│   └── index.ts           # All constants
│
└── hooks/                 # Custom React hooks (future)
```

## Key Improvements

### 1. **Type Safety**
- Centralized type definitions in `types/index.ts`
- All components use shared types
- Better TypeScript support throughout

### 2. **Component Organization**
- **UI Components**: Reusable components in `components/ui/`
  - `LoginForm`: Extracted login form
  - `MessageItem`: Individual message display
  - `MessageList`: Message list with auto-scroll
  - `ChatInput`: Chat input form
  - `LoadingSpinner`: Loading indicator
  - `LoadingIndicator`: Chat-specific loading
  - `ErrorAlert`: Error display component

- **Feature Components**: Main feature components
  - `ChatWidget`: Orchestrates chat functionality

### 3. **API Organization**
- **Separated API modules**:
  - `lib/api/auth.ts`: Authentication endpoints
  - `lib/api/chat.ts`: Chat endpoints
  - `lib/api/index.ts`: Centralized exports

- **API utilities**:
  - `utils/api.ts`: Generic fetch wrapper
  - `utils/storage.ts`: Token storage helpers

### 4. **Constants Management**
- All constants in `constants/index.ts`
- API endpoints, storage keys, UI constants
- Easy to update and maintain

### 5. **Utility Functions**
- `utils/storage.ts`: LocalStorage wrapper with SSR safety
- `utils/api.ts`: Reusable API fetch function
- Type-safe and reusable

## Benefits

1. **Maintainability**: Clear separation of concerns
2. **Reusability**: UI components can be reused across the app
3. **Type Safety**: Centralized types prevent inconsistencies
4. **Scalability**: Easy to add new features and components
5. **Testability**: Smaller, focused components are easier to test
6. **Developer Experience**: Clear structure makes code easier to find

## Usage Examples

### Using Types
```typescript
import type { Message, User } from '@/types';
```

### Using API
```typescript
import { authApi, chatApi } from '@/lib/api';
```

### Using Components
```typescript
import { LoginForm, MessageList } from '@/components/ui';
```

### Using Constants
```typescript
import { API_ENDPOINTS, STORAGE_KEYS } from '@/constants';
```

### Using Utilities
```typescript
import { tokenStorage } from '@/utils/storage';
import { fetchApi } from '@/utils/api';
```

## Next Steps

- Add custom hooks in `hooks/` directory
- Add more UI components as needed
- Consider adding a `services/` directory for business logic
- Add unit tests for components and utilities
