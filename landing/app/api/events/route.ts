import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId, verifyToken } from '@/lib/auth';
import { insertEvent, getEvents, getEventStats, clearEvents } from '@/lib/db';

async function resolveUser(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return verifyToken(auth.slice(7));
  return getSessionUserId();
}

export async function GET(req: NextRequest) {
  const userId = await resolveUser(req);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const limit  = parseInt(req.nextUrl.searchParams.get('limit') || '50');
  const events = await getEvents(userId, limit);
  const stats  = await getEventStats(userId);

  return NextResponse.json({ events, stats });
}

export async function POST(req: NextRequest) {
  const userId = await resolveUser(req);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const { kind, hostname, url, detail } = await req.json();

  if (!kind || !['injection', 'tos'].includes(kind)) {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
  }

  await insertEvent(userId, kind, hostname || '', url || '', detail || null);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await resolveUser(req);
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await clearEvents(userId);
  return NextResponse.json({ ok: true });
}
