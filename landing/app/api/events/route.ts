import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId, verifyToken } from '@/lib/auth';
import { insertEvent, getEvents, getEventStats, clearEvents } from '@/lib/db';

// Resolve user from cookie (web) or Bearer token (extension)
async function resolveUser(req: NextRequest): Promise<string | null> {
  // Try Authorization header first (extension sends this)
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    return verifyToken(auth.slice(7));
  }
  // Fall back to cookie (web dashboard)
  return getSessionUserId();
}

// GET /api/events — fetch events + stats for dashboard
export async function GET(req: NextRequest) {
  const userId = await resolveUser(req);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const limit  = parseInt(req.nextUrl.searchParams.get('limit') || '50');
  const events = getEvents(userId, limit);
  const stats  = getEventStats(userId);

  return NextResponse.json({ events, stats });
}

// POST /api/events — extension pushes events here
export async function POST(req: NextRequest) {
  const userId = await resolveUser(req);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const body = await req.json();
  const { kind, hostname, url, detail } = body;

  if (!kind || !['injection', 'tos'].includes(kind)) {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
  }

  insertEvent(userId, kind, hostname || '', url || '', detail || null);
  return NextResponse.json({ ok: true });
}

// DELETE /api/events — clear all events
export async function DELETE(req: NextRequest) {
  const userId = await resolveUser(req);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  clearEvents(userId);
  return NextResponse.json({ ok: true });
}
