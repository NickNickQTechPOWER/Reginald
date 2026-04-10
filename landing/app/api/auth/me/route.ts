import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { getUserById } from '@/lib/db';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    user: {
      id:        user.id,
      email:     user.email,
      name:      user.name,
      api_key:   user.api_key,
      shield_on: user.shield_on,
      tos_on:    user.tos_on,
    },
  });
}
