import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { createUser, getUserByEmail } from '@/lib/db';
import { signToken, cookieOptions, COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = getUserByEmail(email.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const hashed = await hash(password, 12);
    const user   = createUser(randomUUID(), email.toLowerCase(), hashed, name || '');
    const token  = await signToken(user.id);

    const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
    res.cookies.set(COOKIE, token, cookieOptions());
    return res;
  } catch (err) {
    console.error('[signup]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
