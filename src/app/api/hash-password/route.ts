import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifySession, COOKIE_NAME } from '@/lib/auth-server';

const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  return match?.[1] || null;
}

// POST: hash a password — ADMIN ONLY
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const token = getSessionToken(request);
  if (!token || !verifySession(token)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { password } = await request.json();
    if (!password || typeof password !== 'string' || password.length < 4) {
      return NextResponse.json({ ok: false, error: 'Password too short' }, { status: 400 });
    }
    const hash = await bcrypt.hash(password, 12);
    return NextResponse.json({ ok: true, hash });
  } catch {
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
