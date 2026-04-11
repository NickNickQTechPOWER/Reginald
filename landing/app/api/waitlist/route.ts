import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS waitlist (
      id         SERIAL PRIMARY KEY,
      email      TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    await ensureTable();
    await sql`INSERT INTO waitlist (email) VALUES (${email.toLowerCase()}) ON CONFLICT (email) DO NOTHING`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[waitlist]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
