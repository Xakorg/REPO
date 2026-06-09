import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware — wildcard subdomain routing for code.xakteir.com
 *
 * Hostnames handled:
 *   code.xakteir.com          → normal Next.js routing (IDE at /xakcode)
 *   {slug}.code.xakteir.com   → rewrite to /sites/{slug}  (published project)
 *   localhost / other          → pass through untouched
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';

  // Strip port for local dev (e.g. "localhost:9002")
  const hostname = host.split(':')[0];

  const CODE_DOMAIN = 'code.xakteir.com';

  // Is this a subdomain of code.xakteir.com?
  if (hostname !== CODE_DOMAIN && hostname.endsWith(`.${CODE_DOMAIN}`)) {
    // Extract the project slug from the subdomain
    const slug = hostname.slice(0, hostname.length - CODE_DOMAIN.length - 1);

    if (slug && slug !== 'www') {
      // Rewrite to the /sites/[slug] page without changing the visible URL
      const url = req.nextUrl.clone();
      url.pathname = `/sites/${slug}`;
      return NextResponse.rewrite(url);
    }
  }

  // All other traffic passes through normally
  return NextResponse.next();
}

export const config = {
  // Run on all paths except Next.js internals and static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
