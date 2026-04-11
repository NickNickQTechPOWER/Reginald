import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// ── Schema migration (runs once on first request) ─────────────────────────────

let migrated = false;

async function migrate() {
  if (migrated) return;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      name        TEXT NOT NULL DEFAULT '',
      api_key     TEXT NOT NULL DEFAULT '',
      shield_on   INTEGER NOT NULL DEFAULT 1,
      tos_on      INTEGER NOT NULL DEFAULT 1,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id          SERIAL PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind        TEXT NOT NULL,
      hostname    TEXT NOT NULL DEFAULT '',
      url         TEXT NOT NULL DEFAULT '',
      detail      TEXT,
      timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_user ON events (user_id, timestamp DESC)`;
  migrated = true;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  api_key: string;
  shield_on: number;
  tos_on: number;
  created_at: string;
}

export interface Event {
  id: number;
  user_id: string;
  kind: string;
  hostname: string;
  url: string;
  detail: string | null;
  timestamp: string;
}

// ── User helpers ──────────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<User | null> {
  await migrate();
  const rows = await sql`
    SELECT id, email, name, api_key, shield_on, tos_on, created_at
    FROM users WHERE id = ${id}
  `;
  return (rows[0] as User) ?? null;
}

export async function getUserByEmail(email: string): Promise<(User & { password: string }) | null> {
  await migrate();
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
  return (rows[0] as (User & { password: string })) ?? null;
}

export async function createUser(id: string, email: string, hashedPassword: string, name: string): Promise<User> {
  await migrate();
  await sql`INSERT INTO users (id, email, password, name) VALUES (${id}, ${email}, ${hashedPassword}, ${name})`;
  return (await getUserById(id))!;
}

export async function updateUserSettings(
  id: string,
  fields: Partial<Pick<User, 'name' | 'api_key' | 'shield_on' | 'tos_on'>>
) {
  await migrate();
  if (fields.name      !== undefined) await sql`UPDATE users SET name      = ${fields.name}      WHERE id = ${id}`;
  if (fields.api_key   !== undefined) await sql`UPDATE users SET api_key   = ${fields.api_key}   WHERE id = ${id}`;
  if (fields.shield_on !== undefined) await sql`UPDATE users SET shield_on = ${fields.shield_on} WHERE id = ${id}`;
  if (fields.tos_on    !== undefined) await sql`UPDATE users SET tos_on    = ${fields.tos_on}    WHERE id = ${id}`;
}

// ── Event helpers ─────────────────────────────────────────────────────────────

export async function insertEvent(
  userId: string, kind: string, hostname: string, url: string, detail: object | null
) {
  await migrate();
  const detailStr = detail ? JSON.stringify(detail) : null;
  await sql`
    INSERT INTO events (user_id, kind, hostname, url, detail)
    VALUES (${userId}, ${kind}, ${hostname}, ${url}, ${detailStr})
  `;
}

export async function getEvents(userId: string, limit = 100): Promise<Event[]> {
  await migrate();
  const rows = await sql`
    SELECT * FROM events WHERE user_id = ${userId}
    ORDER BY timestamp DESC LIMIT ${limit}
  `;
  return rows as Event[];
}

export async function getEventStats(userId: string) {
  await migrate();
  const rows = await sql`
    SELECT
      COUNT(*)                                          AS total,
      SUM(CASE WHEN kind='injection' THEN 1 ELSE 0 END) AS injections,
      SUM(CASE WHEN kind='tos'       THEN 1 ELSE 0 END) AS tos_reviews
    FROM events WHERE user_id = ${userId}
  `;
  const r = rows[0];
  return {
    total:       Number(r.total),
    injections:  Number(r.injections),
    tos_reviews: Number(r.tos_reviews),
  };
}

export async function clearEvents(userId: string) {
  await migrate();
  await sql`DELETE FROM events WHERE user_id = ${userId}`;
}
