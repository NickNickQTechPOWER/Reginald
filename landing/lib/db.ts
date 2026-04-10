import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';

const DB_DIR  = path.join(os.homedir(), '.reginald');
const DB_PATH = path.join(DB_DIR, 'reginald.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  migrate(_db);
  return _db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      name        TEXT NOT NULL DEFAULT '',
      api_key     TEXT NOT NULL DEFAULT '',
      shield_on   INTEGER NOT NULL DEFAULT 1,
      tos_on      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind        TEXT NOT NULL,          -- 'injection' | 'tos'
      hostname    TEXT NOT NULL DEFAULT '',
      url         TEXT NOT NULL DEFAULT '',
      detail      TEXT,                   -- JSON blob
      timestamp   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_events_user    ON events (user_id, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_events_ts      ON events (timestamp DESC);
  `);
}

// ── User helpers ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  api_key: string;
  shield_on: number;
  tos_on: number;
  created_at: string;
}

export function getUserById(id: string): User | null {
  return (getDb().prepare('SELECT id,email,name,api_key,shield_on,tos_on,created_at FROM users WHERE id=?').get(id) as User) ?? null;
}

export function getUserByEmail(email: string): (User & { password: string }) | null {
  return (getDb().prepare('SELECT * FROM users WHERE email=?').get(email) as (User & { password: string })) ?? null;
}

export function createUser(id: string, email: string, hashedPassword: string, name: string): User {
  getDb().prepare('INSERT INTO users (id,email,password,name) VALUES (?,?,?,?)').run(id, email, hashedPassword, name);
  return getUserById(id)!;
}

export function updateUserSettings(id: string, fields: Partial<Pick<User, 'name' | 'api_key' | 'shield_on' | 'tos_on'>>) {
  const sets = Object.entries(fields).map(([k]) => `${k}=?`).join(', ');
  const vals = [...Object.values(fields), id];
  getDb().prepare(`UPDATE users SET ${sets} WHERE id=?`).run(...vals);
}

// ── Event helpers ─────────────────────────────────────────────────────────────

export interface Event {
  id: number;
  user_id: string;
  kind: string;
  hostname: string;
  url: string;
  detail: string | null;
  timestamp: string;
}

export function insertEvent(userId: string, kind: string, hostname: string, url: string, detail: object | null) {
  return getDb()
    .prepare('INSERT INTO events (user_id,kind,hostname,url,detail) VALUES (?,?,?,?,?)')
    .run(userId, kind, hostname, url, detail ? JSON.stringify(detail) : null);
}

export function getEvents(userId: string, limit = 100): Event[] {
  return getDb()
    .prepare('SELECT * FROM events WHERE user_id=? ORDER BY timestamp DESC LIMIT ?')
    .all(userId, limit) as Event[];
}

export function getEventStats(userId: string) {
  const row = getDb().prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(kind='injection') AS injections,
      SUM(kind='tos')       AS tos_reviews
    FROM events WHERE user_id=?
  `).get(userId) as { total: number; injections: number; tos_reviews: number };
  return row;
}

export function clearEvents(userId: string) {
  getDb().prepare('DELETE FROM events WHERE user_id=?').run(userId);
}
