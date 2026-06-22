import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const path = url.pathname;

  // Allow static assets, API routes, and files
  if (path.startsWith('/_next') || path.startsWith('/api') || path.includes('.')) {
    return NextResponse.next();
  }

  // 1. Handle wildcard published subdomains (e.g. projectname.code.xakteir.com)
  if (hostname.endsWith('.code.xakteir.com')) {
    const slug = hostname.replace('.code.xakteir.com', '');
    // Rewrite directly to the site viewer route
    return NextResponse.rewrite(new URL(`/sites/${slug}`, req.url));
  }

  // 2. Handle XakCode standalone deployment via code.xakteir.com
  if (hostname === 'code.xakteir.com' || hostname === 'www.code.xakteir.com') {
    
    // Serve Authentication flow securely on this subdomain without redirecting back to main
    if (path === '/auth' || path.startsWith('/auth/')) {
      return NextResponse.next(); 
    }

    if (!req.cookies.has('xak_session')) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }

    // Redirect Root to the IDE prefixed route
    if (path === '/') {
      return NextResponse.redirect(new URL('/xakcode', req.url));
    }

    // Explicit requests to /xakcode/... paths are allowed directly 
    if (path.startsWith('/xakcode')) {
      return NextResponse.next();
    }

    // Redirect XakCode sub-routes (/console, /hosting, /utilities, etc.)
    const xakcodeRoutes = ['/console', '/hosting', '/utilities', '/settings', '/git'];
    const rootSegment = '/' + path.split('/')[1]; // handles /console and /console/something
    if (xakcodeRoutes.includes(rootSegment)) {
      return NextResponse.redirect(new URL(`/xakcode${path}`, req.url));
    }

    // For any OTHER path (like /map, /games, App Launcher navigation), kick them back to the main domain
    return NextResponse.redirect(`https://xakteir.com${path}`);
  }

  // 3. Handle Chat standalone deployment via chat.xakteir.com
  if (hostname === 'chat.xakteir.com' || hostname === 'www.chat.xakteir.com') {
    if (path === '/auth' || path.startsWith('/auth/')) return NextResponse.next();
    
    if (!req.cookies.has('xak_session')) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }

    if (path === '/') return NextResponse.redirect(new URL('/chat', req.url));
    if (path.startsWith('/chat')) return NextResponse.next();
    
    // Redirect Chat sub-routes
    const chatRoutes = ['/s', '/dm', '/settings'];
    const rootSegment = '/' + path.split('/')[1]; 
    if (chatRoutes.includes(rootSegment)) {
      return NextResponse.redirect(new URL(`/chat${path}`, req.url));
    }
    return NextResponse.redirect(`https://xakteir.com${path}`);
  }

  // 4. Handle Maps standalone deployment via maps.xakteir.com
  if (hostname === 'maps.xakteir.com' || hostname === 'www.maps.xakteir.com') {
    if (path === '/auth' || path.startsWith('/auth/')) return NextResponse.next();

    if (!req.cookies.has('xak_session')) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }

    if (path === '/') return NextResponse.redirect(new URL('/map', req.url));
    if (path.startsWith('/map')) return NextResponse.next();
    
    // Redirect Maps sub-routes (e.g., settings)
    const mapRoutes = ['/settings'];
    const rootSegment = '/' + path.split('/')[1]; 
    if (mapRoutes.includes(rootSegment)) {
      return NextResponse.redirect(new URL(`/map${path}`, req.url));
    }
    return NextResponse.redirect(`https://xakteir.com${path}`);
  }

  // Redirect paths on xakteir.com to their respective subdomains (only in production)
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.startsWith('192.168.');
  
  if (
    !isLocalhost &&
    hostname !== 'code.xakteir.com' && hostname !== 'www.code.xakteir.com' &&
    hostname !== 'chat.xakteir.com' && hostname !== 'www.chat.xakteir.com' &&
    hostname !== 'maps.xakteir.com' && hostname !== 'www.maps.xakteir.com'
  ) {
    if (path === '/xakcode') return NextResponse.redirect('https://code.xakteir.com/xakcode');
    if (path.startsWith('/xakcode/')) return NextResponse.redirect(`https://code.xakteir.com${path}`);
    
    if (path === '/chat') return NextResponse.redirect('https://chat.xakteir.com/chat');
    if (path.startsWith('/chat/')) return NextResponse.redirect(`https://chat.xakteir.com${path}`);
    
    if (path === '/map') return NextResponse.redirect('https://maps.xakteir.com/map');
    if (path.startsWith('/map/')) return NextResponse.redirect(`https://maps.xakteir.com${path}`);
  }

  // Default behavior for xakteir.com (allow everything)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
