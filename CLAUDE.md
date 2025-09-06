# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SportChat is a full-stack fitness tracking and chat application with AI integration. The architecture consists of:
- **Frontend**: React + TypeScript + shadcn/ui components (mobile-first)
- **Backend**: FastAPI + SQLAlchemy + SQLite/PostgreSQL  
- **AI Integration**: n8n webhook for chat processing
- **Auth**: Supabase authentication
- **Deployment**: Vercel (frontend) + Railway (backend)

## Development Commands

### Frontend Development
```bash
cd frontend
npm install          # Install dependencies
npm start           # Start development server (port 3000)
npm run build       # Build for production
npm test            # Run tests
```

### Backend Development  
```bash
cd backend
python -m venv venv                    # Create virtual environment
source venv/bin/activate               # Activate (Unix) or venv\Scripts\activate (Windows)
pip install -r requirements.txt       # Install dependencies
uvicorn main:app --reload            # Start development server (port 8000)
```

### Full Stack Development
Run both servers concurrently:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Backend health check: http://localhost:8000/health

## Architecture

### Frontend Structure (`src/`)
- `components/`: React components organized by feature
  - `Chat/`: Real-time chat interface with n8n integration
  - `Auth/`: Supabase authentication components
  - `TrainerDashboard/`: Analytics and metrics
  - `WorkoutCalendar/`: Exercise tracking with emojis
  - `ui/`: shadcn/ui component library
- `contexts/`: React context providers
- `lib/`: Utilities and API client setup

### Backend Structure (`backend/`)
- `app/routers/`: FastAPI route handlers
  - `chat.py`: Chat messages and n8n webhook integration
  - `workouts.py`: Workout tracking and management
  - `exercises.py`: Exercise database operations
  - `goals.py`: Goal setting and progress tracking
- `app/database/`: SQLAlchemy models and database setup
- `app/config.py`: Environment configuration

### Key Integration Points
- **n8n Webhook**: Processes chat messages for AI responses at `/api/chat/webhook`
- **Supabase Auth**: Frontend authentication with backend JWT validation
- **CORS Configuration**: Supports both localhost development and production domains

### Database
- Development: SQLite (`backend/sportchat.db`)  
- Production: PostgreSQL via Supabase
- Auto-migration on startup via `create_tables()`

### Deployment Configuration
- `vercel.json`: Frontend deployment with API proxy to backend
- `backend/Procfile`: Railway deployment configuration  
- Environment variables managed through platform-specific interfaces

## Development Notes

- Uses TypeScript throughout frontend with strict typing
- Backend follows FastAPI patterns with Pydantic models
- Mobile-first responsive design using Tailwind CSS
- Real-time features implemented via REST polling (WebSocket upgrade available)
- Chat history persisted in database with n8n AI processing