import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { getUserById, updateUserSettings } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const body = await req.json();
  const allowed = ['name', 'api_key', 'shield_on', 'tos_on'] as const;
  const fields: Record<string, unknown> = {};

  for (const key of allowed) {
    if (key in body) fields[key] = body[key];
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  updateUserSettings(userId, fields as Parameters<typeof updateUserSettings>[1]);
  const user = getUserById(userId)!;

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, api_key: user.api_key, shield_on: user.shield_on, tos_on: user.tos_on },
  });
}
