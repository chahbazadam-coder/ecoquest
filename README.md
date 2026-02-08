# 🌍 EcoQuest — Full Production Setup

A Duolingo-inspired sustainability learning app for kids with:
- **FastAPI backend** (Python) with SQLite database
- **React frontend** (Vite) with localStorage fallback
- **REST API** with JWT auth
- **Persistent** users, progress, achievements, garden
- 100% local, 100% free, no paid APIs

## Architecture

```
┌─────────────────────────────────────────┐
│  React Frontend (Vite, port 5173)       │
│  ├── Auth screens (login/signup)        │
│  ├── Dashboard, Lessons, Stories        │
│  ├── Mini Games, Garden, Profile        │
│  └── localStorage fallback if no API    │
│           │                             │
│           ▼ HTTP REST API               │
│  FastAPI Backend (port 8000)            │
│  ├── JWT Authentication                 │
│  ├── /api/auth/*   (login, signup)      │
│  ├── /api/user/*   (profile, progress)  │
│  ├── /api/progress/* (lessons, stories) │
│  └── /api/garden/* (buy, list)          │
│           │                             │
│           ▼                             │
│  SQLite Database (ecoquest.db)          │
│  ├── users table                        │
│  ├── progress table                     │
│  ├── achievements table                 │
│  └── garden table                       │
└─────────────────────────────────────────┘
```

## Quick Start

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
Backend runs at http://localhost:8000
API docs at http://localhost:8000/docs (Swagger UI — free!)

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
Frontend runs at http://localhost:5173

### 3. Open browser → http://localhost:5173

Sign up, start learning, save the planet! 🌱

## Features

| Feature | Description |
|---------|-------------|
| 🔐 Auth | JWT-based signup/login, passwords hashed with bcrypt |
| 📚 6 Lessons | Waste, water, climate, energy, ocean topics with quizzes |
| 📖 4 Stories | Illustrated eco-stories with comprehension quizzes |
| 🎮 2 Games | Eco Sorter (waste sorting), Water Drop Quest (reflexes) |
| 🌻 Garden | Virtual garden — buy plants/creatures with EcoCoins |
| 🏆 Achievements | 8 unlockable badges tracked server-side |
| 📊 Dashboard | XP, level, streak, CO₂ saved, daily tips |
| 💾 Persistence | SQLite DB — survives restarts. localStorage fallback |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Create account |
| POST | /api/auth/login | Get JWT token |
| GET | /api/user/me | Get user profile |
| PUT | /api/user/me | Update profile |
| POST | /api/progress/complete | Mark lesson/story complete |
| GET | /api/progress/me | Get all progress |
| POST | /api/garden/buy | Purchase garden item |
| GET | /api/garden/me | Get garden items |
| GET | /api/achievements/me | Get achievements |

## Tech Stack

- **Backend**: Python 3.10+, FastAPI, SQLite, JWT, bcrypt
- **Frontend**: React 18, Vite, Fetch API
- **Database**: SQLite (zero config, file-based)
- **Auth**: JWT tokens (no cookies, no sessions)
- **Styling**: Inline styles + Google Fonts (Fredoka, Quicksand)
