import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://dasarangcare.co.kr',
  'https://www.dasarangcare.co.kr',
];

// Skip CSRF check for safe methods
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // CSRF: check Origin/Referer for state-changing methods
  if (!SAFE_METHODS.has(request.method)) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    const isAllowed = (header: string | null) => {
      if (!header) return false;
      try {
        const url = new URL(header);
        return ALLOWED_ORIGINS.some(
          (allowed) =>
            url.origin === allowed ||
            url.hostname === new URL(allowed).hostname,
        );
      } catch {
        return false;
      }
    };

    if (!isAllowed(origin) && !isAllowed(referer)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
