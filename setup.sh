#!/usr/bin/env bash
# ═══════════════════════════════════════════════
# 🌍 EcoQuest — Setup Script
# Run this from the ecoquest/ project root
# ═══════════════════════════════════════════════

set -e

echo ""
echo "  🌍 EcoQuest Setup"
echo "  ═════════════════"
echo ""

# ── Backend Setup ──
echo "📦 Setting up backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "  Creating Python virtual environment..."
    python3 -m venv venv
fi

echo "  Activating venv & installing dependencies..."
source venv/bin/activate
pip install -r requirements.txt --quiet

echo "  ✅ Backend ready!"
cd ..

# ── Frontend Setup ──
echo ""
echo "📦 Setting up frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "  Installing npm packages..."
    npm install --silent
fi

echo "  ✅ Frontend ready!"
cd ..

echo ""
echo "  ════════════════════════════════════════"
echo "  🎉 Setup complete! To start the app:"
echo ""
echo "  Terminal 1 (backend):"
echo "    cd backend && source venv/bin/activate && python main.py"
echo ""
echo "  Terminal 2 (frontend):"
echo "    cd frontend && npm run dev"
echo ""
echo "  Then open: http://localhost:5173"
echo "  API docs:  http://localhost:8000/docs"
echo "  ════════════════════════════════════════"
echo ""
