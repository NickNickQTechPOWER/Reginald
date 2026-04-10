import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { getUserByEmail } from '@/lib/db';
import { signToken, cookieOptions, COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await getUserByEmail(email.toLowerCase());
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = await signToken(user.id);
    const res   = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name }, token });
    res.cookies.set(COOKIE, token, cookieOptions());
    return res;
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
