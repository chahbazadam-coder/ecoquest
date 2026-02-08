/*
 * api.js — API client for EcoQuest
 * Talks to FastAPI backend. Falls back to localStorage if backend is down.
 */

const API_BASE = "http://localhost:8000/api";

// ── Token Management ──
function getToken() {
  return localStorage.getItem("ecoquest_token");
}
function setToken(token) {
  localStorage.setItem("ecoquest_token", token);
}
function clearToken() {
  localStorage.removeItem("ecoquest_token");
}

// ── HTTP Helpers ──
async function request(method, path, body = null) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    if (res.status === 401) {
      clearToken();
      throw new Error("UNAUTHORIZED");
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "API error");
    return { ok: true, data };
  } catch (err) {
    if (err.message === "UNAUTHORIZED") throw err;
    // Network error — backend is probably down
    console.warn(`API unavailable (${path}), using localStorage`);
    return { ok: false, error: err.message };
  }
}

// ── Fallback: localStorage Database ──
const LS_KEY = "ecoquest_local_db";

function getLocalDB() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
}
function saveLocalDB(db) {
  localStorage.setItem(LS_KEY, JSON.stringify(db));
}
function getLocalUser() {
  const db = getLocalDB();
  const username = localStorage.getItem("ecoquest_local_user");
  return username ? db[username] || null : null;
}
function saveLocalUser(user) {
  const db = getLocalDB();
  db[user.username] = user;
  saveLocalDB(db);
  localStorage.setItem("ecoquest_local_user", user.username);
}

function createLocalUser(username, password, avatar) {
  const db = getLocalDB();
  if (db[username]) return null;
  const user = {
    id: Date.now(), username, password, avatar: avatar || "🌱",
    level: 1, xp: 0, eco_coins: 50, streak: 1, carbon_saved: 0,
    completedLessons: [], completedStories: [], achievements: [], garden: [],
    created_at: new Date().toISOString(),
  };
  db[username] = user;
  saveLocalDB(db);
  localStorage.setItem("ecoquest_local_user", username);
  return user;
}

function loginLocal(username, password) {
  const db = getLocalDB();
  const user = db[username];
  if (!user || user.password !== password) return null;
  localStorage.setItem("ecoquest_local_user", username);
  return user;
}

// ── PUBLIC API ──

export async function signup(username, password, avatar) {
  const res = await request("POST", "/auth/signup", { username, password, avatar });
  if (res.ok) {
    setToken(res.data.token);
    return { ok: true, user: res.data.user, mode: "api" };
  }
  // Fallback to localStorage
  const user = createLocalUser(username, password, avatar);
  if (!user) return { ok: false, error: "Username taken" };
  return { ok: true, user, mode: "local" };
}

export async function login(username, password) {
  const res = await request("POST", "/auth/login", { username, password });
  if (res.ok) {
    setToken(res.data.token);
    return { ok: true, user: res.data.user, mode: "api" };
  }
  // Fallback
  const user = loginLocal(username, password);
  if (!user) return { ok: false, error: "Invalid credentials" };
  return { ok: true, user, mode: "local" };
}

export async function getProfile() {
  const res = await request("GET", "/user/me");
  if (res.ok) return { ok: true, user: res.data, mode: "api" };
  // Fallback
  const user = getLocalUser();
  if (user) return { ok: true, user, mode: "local" };
  return { ok: false };
}

export async function completeItem(itemType, itemId, score, xpEarned) {
  const res = await request("POST", "/progress/complete", {
    item_type: itemType, item_id: itemId, score, xp_earned: xpEarned,
  });
  if (res.ok) return { ok: true, data: res.data, mode: "api" };

  // Fallback: update locally
  const user = getLocalUser();
  if (!user) return { ok: false };
  const listKey = itemType === "lesson" ? "completedLessons" : "completedStories";
  if (!user[listKey].includes(itemId)) {
    user[listKey].push(itemId);
  }
  user.xp += xpEarned;
  user.eco_coins += Math.floor(xpEarned / 2);
  user.carbon_saved += xpEarned * 0.1;
  user.level = Math.floor(user.xp / 100) + 1;
  saveLocalUser(user);
  return { ok: true, data: user, mode: "local" };
}

export async function buyGardenItem(item) {
  const res = await request("POST", "/garden/buy", {
    item_id: item.id, name: item.name, emoji: item.emoji,
    item_type: item.type, cost: item.cost,
  });
  if (res.ok) return { ok: true, data: res.data, mode: "api" };

  // Fallback
  const user = getLocalUser();
  if (!user || user.eco_coins < item.cost) return { ok: false, error: "Not enough coins" };
  user.eco_coins -= item.cost;
  user.garden.push({ ...item, planted_at: new Date().toISOString() });
  saveLocalUser(user);
  return { ok: true, data: { eco_coins: user.eco_coins, garden: user.garden }, mode: "local" };
}

export async function earnAchievement(achievementId) {
  const res = await request("POST", "/achievements/earn", { achievement_id: achievementId });
  if (res.ok) return { ok: true, mode: "api" };

  // Fallback
  const user = getLocalUser();
  if (!user) return { ok: false };
  if (!user.achievements.includes(achievementId)) {
    user.achievements.push(achievementId);
    saveLocalUser(user);
  }
  return { ok: true, mode: "local" };
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export function logout() {
  clearToken();
  localStorage.removeItem("ecoquest_local_user");
}
