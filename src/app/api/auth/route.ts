import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Pre-compute hash at module load (cold start, cached per Lambda)
// Hash of the ERP password — set via ERP_PASSWORD_HASH env var, or computed from ERP_PASSWORD
const HASH = computeHash();

function computeHash(): string {
  // Preferred: pre-computed hash in env var (avoids plaintext)
  if (process.env.ERP_PASSWORD_HASH) {
    return process.env.ERP_PASSWORD_HASH;
  }
  // Fallback: compute from plaintext password (less secure, but still better than client-side)
  if (process.env.ERP_PASSWORD) {
    return bcrypt.hashSync(process.env.ERP_PASSWORD, 12);
  }
  // Development default — CHANGE IN PRODUCTION
  // Hash of '448282' — only used when no env var is set
  return bcrypt.hashSync('448282', 12);
}

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
      // Clear rate limit on success
      attempts.delete(ip);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: '비밀번호가 틀렸습니다.' }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: '오류가 발생했습니다.' }, { status: 500 });
  }
}
