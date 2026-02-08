"""
database.py — SQLite database setup for EcoQuest
Zero configuration, file-based, persistent storage.
"""

import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "ecoquest.db")


def get_db():
    """Get a database connection. Creates DB + tables if they don't exist."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return dicts instead of tuples
    conn.execute("PRAGMA journal_mode=WAL")  # Better concurrent access
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create all tables if they don't exist."""
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            avatar TEXT DEFAULT '🌱',
            level INTEGER DEFAULT 1,
            xp INTEGER DEFAULT 0,
            eco_coins INTEGER DEFAULT 50,
            streak INTEGER DEFAULT 1,
            carbon_saved REAL DEFAULT 0.0,
            created_at TEXT DEFAULT (datetime('now')),
            last_active TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_type TEXT NOT NULL,       -- 'lesson' or 'story'
            item_id TEXT NOT NULL,          -- e.g., 'l1', 's2'
            score INTEGER DEFAULT 0,
            completed_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, item_type, item_id)
        );

        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            achievement_id TEXT NOT NULL,
            earned_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id),
            UNIQUE(user_id, achievement_id)
        );

        CREATE TABLE IF NOT EXISTS garden (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_id TEXT NOT NULL,
            item_name TEXT NOT NULL,
            item_emoji TEXT NOT NULL,
            item_type TEXT NOT NULL,
            cost INTEGER NOT NULL,
            planted_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    conn.commit()
    conn.close()
    print(f"✓ Database initialized at {DB_PATH}")


# ── User Operations ──

def create_user(username: str, password_hash: str, avatar: str = "🌱") -> dict | None:
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (username, password_hash, avatar) VALUES (?, ?, ?)",
            (username, password_hash, avatar)
        )
        conn.commit()
        return get_user_by_username(username)
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


def get_user_by_username(username: str) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)


def get_user_by_id(user_id: int) -> dict | None:
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)


def update_user(user_id: int, **kwargs) -> dict | None:
    conn = get_db()
    sets = ", ".join(f"{k} = ?" for k in kwargs)
    values = list(kwargs.values()) + [user_id]
    conn.execute(f"UPDATE users SET {sets} WHERE id = ?", values)
    conn.commit()
    result = get_user_by_id(user_id)
    conn.close()
    return result


def add_xp(user_id: int, amount: int) -> dict:
    conn = get_db()
    user = dict(conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone())
    new_xp = user["xp"] + amount
    new_coins = user["eco_coins"] + amount // 2
    new_carbon = user["carbon_saved"] + amount * 0.1
    new_level = (new_xp // 100) + 1
    level_up = new_level > user["level"]

    conn.execute(
        "UPDATE users SET xp=?, eco_coins=?, carbon_saved=?, level=?, last_active=datetime('now') WHERE id=?",
        (new_xp, new_coins, new_carbon, new_level, user_id)
    )
    conn.commit()
    conn.close()
    return {"level_up": level_up, "new_level": new_level, "xp": new_xp, "eco_coins": new_coins}


# ── Progress Operations ──

def complete_item(user_id: int, item_type: str, item_id: str, score: int = 0) -> bool:
    conn = get_db()
    try:
        conn.execute(
            "INSERT OR IGNORE INTO progress (user_id, item_type, item_id, score) VALUES (?, ?, ?, ?)",
            (user_id, item_type, item_id, score)
        )
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()


def get_progress(user_id: int) -> dict:
    conn = get_db()
    rows = conn.execute("SELECT * FROM progress WHERE user_id = ?", (user_id,)).fetchall()
    conn.close()
    lessons = [dict(r) for r in rows if r["item_type"] == "lesson"]
    stories = [dict(r) for r in rows if r["item_type"] == "story"]
    return {
        "completed_lessons": [r["item_id"] for r in lessons],
        "completed_stories": [r["item_id"] for r in stories],
        "lesson_scores": {r["item_id"]: r["score"] for r in lessons},
        "story_scores": {r["item_id"]: r["score"] for r in stories},
    }


# ── Garden Operations ──

def buy_garden_item(user_id: int, item_id: str, name: str, emoji: str, item_type: str, cost: int) -> bool:
    conn = get_db()
    user = dict(conn.execute("SELECT eco_coins FROM users WHERE id = ?", (user_id,)).fetchone())
    if user["eco_coins"] < cost:
        conn.close()
        return False
    conn.execute(
        "UPDATE users SET eco_coins = eco_coins - ? WHERE id = ?", (cost, user_id)
    )
    conn.execute(
        "INSERT INTO garden (user_id, item_id, item_name, item_emoji, item_type, cost) VALUES (?,?,?,?,?,?)",
        (user_id, item_id, name, emoji, item_type, cost)
    )
    conn.commit()
    conn.close()
    return True


def get_garden(user_id: int) -> list:
    conn = get_db()
    rows = conn.execute("SELECT * FROM garden WHERE user_id = ? ORDER BY planted_at", (user_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Achievement Operations ──

def earn_achievement(user_id: int, achievement_id: str) -> bool:
    conn = get_db()
    try:
        conn.execute(
            "INSERT OR IGNORE INTO achievements (user_id, achievement_id) VALUES (?, ?)",
            (user_id, achievement_id)
        )
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()


def get_achievements(user_id: int) -> list:
    conn = get_db()
    rows = conn.execute("SELECT achievement_id, earned_at FROM achievements WHERE user_id = ?", (user_id,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


if __name__ == "__main__":
    init_db()
    print("Database ready!")
