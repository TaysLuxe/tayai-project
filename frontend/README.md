# TayAI Frontend

Next.js frontend application for TayAI.

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Build

```bash
npm run build
npm start
```

## Project Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - React components
- `contexts/` - React contexts (Auth)
- `lib/` - Utility functions and API client

