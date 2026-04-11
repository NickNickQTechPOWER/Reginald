import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const ADMIN_KEY = process.env.ADMIN_KEY || 'reginald-admin';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`SELECT email, created_at FROM waitlist ORDER BY created_at DESC`;
  return NextResponse.json({ count: rows.length, emails: rows });
}
