# SportChat: Workout Tracking & Chat Application

## Project Overview

SportChat is a modern, mobile-first web application designed for fitness enthusiasts to track workouts, communicate, and maintain exercise streaks.

### Key Features

- **Real-time Chat Interface**: Modern, responsive chat with edit capabilities
- **Workout Calendar**: Emoji-based tracking of fitness activities
- **Mobile Optimization**: Fully responsive design using shadcn/ui
- **Backend API**: FastAPI-powered RESTful service for data management

## Tech Stack

### Frontend
- React
- TypeScript
- shadcn/ui
- Mobile-first responsive design

### Backend
- FastAPI
- SQLAlchemy
- SQLite Database
- Automatic database migrations

## Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- pip
- npm or yarn

## Installation

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Project Structure

- `/frontend`: React application
- `/backend`: FastAPI server
- `/docs`: Project documentation

## Contributing

Please read our contribution guidelines before submitting pull requests.

## License

[Specify License]
