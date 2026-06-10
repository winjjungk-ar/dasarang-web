import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPasswordHash, signSession, verifySession, COOKIE_NAME, SESSION_TTL } from '@/lib/auth-server';

// Pre-compute hash at module load
const HASH = getPasswordHash();

// In-memory rate limit: 5 attempts per IP per minute
const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { ok: false, error: '너무 많은 시도입니다. 1분 후 다시 시도해주세요.' },
      { status: 429 },
    );
  }

  try {
    const { password } = await request.json();
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ ok: false, error: '비밀번호를 입력해주세요.' }, { status: 400 });
    }

    const valid = await bcrypt.compare(password, HASH);
    if (valid) {
      attempts.delete(ip);

      const tokenPayload = JSON.stringify({ exp: Date.now() + SESSION_TTL });
      const token = signSession(tokenPayload);

      const response = NextResponse.json({ ok: true });
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_TTL / 1000,
      });
      return response;
    }

    return NextResponse.json({ ok: false, error: '비밀번호가 틀렸습니다.' }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: '오류가 발생했습니다.' }, { status: 500 });
  }
}

/** GET: verify existing session */
export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  const token = match?.[1];
  if (!token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const session = verifySession(token);
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true, expiresAt: session.exp });
}

/** DELETE: logout — clear session cookie */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
