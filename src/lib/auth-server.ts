import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/** Get the computed password hash (same as api/auth/route.ts) */
export function getPasswordHash(): string {
  if (process.env.ERP_PASSWORD_HASH) {
    return process.env.ERP_PASSWORD_HASH;
  }
  if (process.env.ERP_PASSWORD) {
    return bcrypt.hashSync(process.env.ERP_PASSWORD, 12);
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ERP_PASSWORD_HASH or ERP_PASSWORD environment variable must be set in production'
    );
  }
  throw new Error(
    'ERP_PASSWORD_HASH or ERP_PASSWORD must be set.'
  );
}

/** Session signing key — derived from password hash (stable per deployment) */
function getSessionKey(): Buffer {
  const hash = getPasswordHash();
  return crypto.createHash('sha256')
    .update(hash + (process.env.ERP_SESSION_SALT || 'dasarang-erp'))
    .digest();
}

/** Sign a session token: base64url(payload).base64url(HMAC-SHA256(payload, key)) */
export function signSession(payload: string): string {
  const key = getSessionKey();
  const sig = crypto.createHmac('sha256', key).update(payload).digest('base64url');
  return Buffer.from(payload).toString('base64url') + '.' + sig;
}

/** Verify a session token. Returns parsed payload or null. */
export function verifySession(token: string): { exp: number } | null {
  try {
    const key = getSessionKey();
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return null;
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const expected = crypto.createHmac('sha256', key).update(payload).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const data = JSON.parse(payload);
    if (typeof data.exp !== 'number' || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export const COOKIE_NAME = 'erp_session';
export const SESSION_TTL = 4 * 60 * 60 * 1000; // 4 hours
