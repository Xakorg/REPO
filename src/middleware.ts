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

  // 5. Handle Xakarena Game Client via xakarena.xakteir.com
  if (hostname === 'xakarena.xakteir.com' || hostname === 'www.xakarena.xakteir.com') {
    // Note: Public homepage allowed without session. Specific protected routes can be added here later.
    if (path === '/auth' || path.startsWith('/auth/')) return NextResponse.next();
    
    // Internal Rewrite
    if (path === '/') return NextResponse.rewrite(new URL('/xakarena', req.url));
    if (path.startsWith('/xakarena')) return NextResponse.next(); // Already rewritten
    
    return NextResponse.rewrite(new URL(`/xakarena${path}`, req.url));
  }

  // 6. Handle Xakarena Creator Platform via creator.xakarena.xakteir.com
  if (hostname === 'creator.xakarena.xakteir.com' || hostname === 'www.creator.xakarena.xakteir.com') {
    if (path === '/auth' || path.startsWith('/auth/')) return NextResponse.next();
    
    // Internal Rewrite
    if (path === '/') return NextResponse.rewrite(new URL('/xakarena-creator', req.url));
    if (path.startsWith('/xakarena-creator')) return NextResponse.next(); // Already rewritten
    
    return NextResponse.rewrite(new URL(`/xakarena-creator${path}`, req.url));
  }

  // 7. Handle Dev Centre standalone deployment via dev.xakteir.com
  if (hostname === 'dev.xakteir.com' || hostname === 'www.dev.xakteir.com') {
    if (path === '/auth' || path.startsWith('/auth/')) return NextResponse.next();
    
    if (!req.cookies.has('xak_session')) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }

    if (path === '/') return NextResponse.rewrite(new URL('/dev-centre', req.url));
    if (path.startsWith('/dev-centre')) return NextResponse.next(); // Already rewritten
    
    return NextResponse.rewrite(new URL(`/dev-centre${path}`, req.url));
  }

  // 8. Handle Drive standalone deployment via drive.xakteir.com
  if (hostname === 'drive.xakteir.com' || hostname === 'www.drive.xakteir.com') {
    if (path === '/auth' || path.startsWith('/auth/')) return NextResponse.next();
    
    if (!req.cookies.has('xak_session')) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }

    if (path === '/') return NextResponse.rewrite(new URL('/drive', req.url));
    if (path.startsWith('/drive')) return NextResponse.next(); // Already rewritten
    
    return NextResponse.rewrite(new URL(`/drive${path}`, req.url));
  }

  // 8. Enforce Subdomain Isolation (Prevent direct path access from other domains)
  if (
    hostname !== 'xakarena.xakteir.com' && hostname !== 'www.xakarena.xakteir.com' &&
    hostname !== 'creator.xakarena.xakteir.com' && hostname !== 'www.creator.xakarena.xakteir.com'
  ) {
    if (path === '/xakarena' || path.startsWith('/xakarena/') || path === '/xakarena-creator' || path.startsWith('/xakarena-creator/')) {
      // Rewrite to a non-existent route to trigger Next.js 404
      return NextResponse.rewrite(new URL('/404', req.url));
    }
  }

  // Redirect paths on xakteir.com to their respective subdomains (only in production)
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.startsWith('192.168.');
  
  if (
    !isLocalhost &&
    hostname !== 'code.xakteir.com' && hostname !== 'www.code.xakteir.com' &&
    hostname !== 'chat.xakteir.com' && hostname !== 'www.chat.xakteir.com' &&
    hostname !== 'maps.xakteir.com' && hostname !== 'www.maps.xakteir.com' &&
    hostname !== 'dev.xakteir.com' && hostname !== 'www.dev.xakteir.com' &&
    hostname !== 'drive.xakteir.com' && hostname !== 'www.drive.xakteir.com'
  ) {
    if (path === '/xakcode') return NextResponse.redirect('https://code.xakteir.com/xakcode');
    if (path.startsWith('/xakcode/')) return NextResponse.redirect(`https://code.xakteir.com${path}`);
    
    if (path === '/chat') return NextResponse.redirect('https://chat.xakteir.com/chat');
    if (path.startsWith('/chat/')) return NextResponse.redirect(`https://chat.xakteir.com${path}`);
    
    if (path === '/map') return NextResponse.redirect('https://maps.xakteir.com/map');
    if (path.startsWith('/map/')) return NextResponse.redirect(`https://maps.xakteir.com${path}`);

    if (path === '/dev-centre') return NextResponse.redirect('https://dev.xakteir.com');
    if (path.startsWith('/dev-centre/')) return NextResponse.redirect(`https://dev.xakteir.com${path.replace('/dev-centre', '')}`);

    if (path === '/drive') return NextResponse.redirect('https://drive.xakteir.com');
    if (path.startsWith('/drive/')) return NextResponse.redirect(`https://drive.xakteir.com${path.replace('/drive', '')}`);
  }

  // Default behavior for xakteir.com (allow everything)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
