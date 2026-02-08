"""
main.py — FastAPI backend for EcoQuest
Run: python main.py
API docs: http://localhost:8000/docs
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import uvicorn

import database as db
from auth import hash_password, verify_password, create_token, get_current_user_id

# ── Init ──
app = FastAPI(
    title="🌍 EcoQuest API",
    description="Backend for the EcoQuest sustainability learning app",
    version="1.0.0",
)

# Allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    db.init_db()
    print("\n  🌍 EcoQuest API running!")
    print("  📖 Docs: http://localhost:8000/docs\n")


# ── Request/Response Models ──

class SignupRequest(BaseModel):
    username: str = Field(min_length=2, max_length=30)
    password: str = Field(min_length=3, max_length=100)
    avatar: str = "🌱"

class LoginRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict

class CompleteRequest(BaseModel):
    item_type: str  # "lesson" or "story"
    item_id: str    # "l1", "s2", etc.
    score: int = 0
    xp_earned: int = 0

class GardenBuyRequest(BaseModel):
    item_id: str
    name: str
    emoji: str
    item_type: str
    cost: int

class AchievementRequest(BaseModel):
    achievement_id: str

class UpdateProfileRequest(BaseModel):
    avatar: Optional[str] = None
    streak: Optional[int] = None


# ── AUTH ROUTES ──

@app.post("/api/auth/signup", response_model=AuthResponse)
def signup(req: SignupRequest):
    """Create a new account."""
    hashed = hash_password(req.password)
    user = db.create_user(req.username, hashed, req.avatar)
    if not user:
        raise HTTPException(status_code=409, detail="Username already taken")
    token = create_token(user["id"], user["username"])
    # Don't send password hash to client
    user.pop("password_hash", None)
    return {"token": token, "user": user}


@app.post("/api/auth/login", response_model=AuthResponse)
def login(req: LoginRequest):
    """Log in and get a JWT token."""
    user = db.get_user_by_username(req.username)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_token(user["id"], user["username"])
    # Update last active
    db.update_user(user["id"], last_active="datetime('now')")
    user.pop("password_hash", None)
    return {"token": token, "user": user}


# ── USER ROUTES ──

@app.get("/api/user/me")
def get_profile(user_id: int = Depends(get_current_user_id)):
    """Get current user's full profile with progress."""
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.pop("password_hash", None)

    progress = db.get_progress(user_id)
    garden = db.get_garden(user_id)
    achievements = db.get_achievements(user_id)

    return {
        **user,
        "completedLessons": progress["completed_lessons"],
        "completedStories": progress["completed_stories"],
        "garden": garden,
        "achievements": [a["achievement_id"] for a in achievements],
    }


@app.put("/api/user/me")
def update_profile(req: UpdateProfileRequest, user_id: int = Depends(get_current_user_id)):
    """Update user profile fields."""
    updates = {}
    if req.avatar is not None:
        updates["avatar"] = req.avatar
    if req.streak is not None:
        updates["streak"] = req.streak
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    user = db.update_user(user_id, **updates)
    user.pop("password_hash", None)
    return user


# ── PROGRESS ROUTES ──

@app.post("/api/progress/complete")
def complete_item(req: CompleteRequest, user_id: int = Depends(get_current_user_id)):
    """Mark a lesson or story as completed. Awards XP."""
    if req.item_type not in ("lesson", "story"):
        raise HTTPException(status_code=400, detail="item_type must be 'lesson' or 'story'")

    db.complete_item(user_id, req.item_type, req.item_id, req.score)

    result = {}
    if req.xp_earned > 0:
        result = db.add_xp(user_id, req.xp_earned)

    progress = db.get_progress(user_id)
    return {
        "success": True,
        **result,
        "completedLessons": progress["completed_lessons"],
        "completedStories": progress["completed_stories"],
    }


@app.get("/api/progress/me")
def get_progress(user_id: int = Depends(get_current_user_id)):
    """Get all progress for current user."""
    return db.get_progress(user_id)


# ── GARDEN ROUTES ──

@app.post("/api/garden/buy")
def buy_garden_item(req: GardenBuyRequest, user_id: int = Depends(get_current_user_id)):
    """Buy an item for the garden."""
    success = db.buy_garden_item(
        user_id, req.item_id, req.name, req.emoji, req.item_type, req.cost
    )
    if not success:
        raise HTTPException(status_code=400, detail="Not enough EcoCoins")
    user = db.get_user_by_id(user_id)
    return {"success": True, "eco_coins": user["eco_coins"], "garden": db.get_garden(user_id)}


@app.get("/api/garden/me")
def get_garden(user_id: int = Depends(get_current_user_id)):
    """Get user's garden items."""
    return db.get_garden(user_id)


# ── ACHIEVEMENT ROUTES ──

@app.post("/api/achievements/earn")
def earn_achievement(req: AchievementRequest, user_id: int = Depends(get_current_user_id)):
    """Record an earned achievement."""
    db.earn_achievement(user_id, req.achievement_id)
    return {"success": True, "achievements": db.get_achievements(user_id)}


@app.get("/api/achievements/me")
def get_achievements(user_id: int = Depends(get_current_user_id)):
    """Get user's achievements."""
    return db.get_achievements(user_id)


# ── HEALTH ──

@app.get("/api/health")
def health():
    return {"status": "ok", "app": "EcoQuest", "version": "1.0.0"}


# ── Run ──

if __name__ == "__main__":
    print("\n  🌍 Starting EcoQuest API...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
