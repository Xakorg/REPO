import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const path = url.pathname;

  // Allow specific system paths (Next.js internals and API routes)
  if (path.startsWith('/_next') || path.startsWith('/api')) {
    return NextResponse.next();
  }

  // Allow common static files that might not be caught by the config matcher
  if (path.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/i)) {
    return NextResponse.next();
  }

  // 1. Handle wildcard published subdomains (e.g. projectname.code.xakteir.com)
  if (hostname.endsWith('.code.xakteir.com') && hostname !== 'www.code.xakteir.com') {
    const slug = hostname.replace('.code.xakteir.com', '');
    // Rewrite directly to the site viewer route
    return NextResponse.rewrite(new URL(`/sites/${slug}`, req.url));
  }

  // 1.5 Handle explicit Suite Apps
  const suiteApps = ['forms', 'write', 'sheets', 'slides'];
  for (const app of suiteApps) {
    if (hostname === `${app}.suite.xakteir.com` || hostname === `www.${app}.suite.xakteir.com`) {
      if (path === '/auth' || path.startsWith('/auth/')) return NextResponse.next();
      
      // Allow public published document routes
      if (path.startsWith('/p/')) {
        return NextResponse.rewrite(new URL(`/${app}${path}`, req.url));
      }

      if (!req.cookies.has('xak_session')) {
        return NextResponse.redirect(new URL('/auth', req.url));
      }
      
      // If path is /, rewrite to /app. If path is /something, rewrite to /app/something.
      if (path === '/') return NextResponse.rewrite(new URL(`/${app}`, req.url));
      if (path.startsWith(`/${app}`)) return NextResponse.next();
      return NextResponse.rewrite(new URL(`/${app}${path}`, req.url));
    }
  }

  // 1.6 Handle the main Suite Dashboard
  if (hostname === 'suite.xakteir.com' || hostname === 'www.suite.xakteir.com') {
    if (path === '/auth' || path.startsWith('/auth/')) return NextResponse.next();
    if (!req.cookies.has('xak_session')) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }
    if (path === '/') return NextResponse.rewrite(new URL('/suite', req.url));
    if (path.startsWith('/suite')) return NextResponse.next();
    return NextResponse.redirect(`https://xakteir.com${path}`);
  }

  // 2. Handle XakCode standalone deployment via code.xakteir.com
  if (hostname === 'code.xakteir.com' || hostname === 'www.code.xakteir.com') {
    
    // Serve Authentication flow securely on this subdomain without redirecting back to main
    if (path === '/auth' || path.startsWith('/auth/')) {
      return NextResponse.next(); 
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

  // 4.5 Handle Weather standalone deployment via weather.xakteir.com
  if (hostname === 'weather.xakteir.com' || hostname === 'www.weather.xakteir.com') {
    if (path === '/auth' || path.startsWith('/auth/')) return NextResponse.next();

    if (path === '/') return NextResponse.redirect(new URL('/weather', req.url));
    if (path.startsWith('/weather')) return NextResponse.next();
    
    // Redirect Weather sub-routes
    const weatherRoutes = ['/settings'];
    const rootSegment = '/' + path.split('/')[1]; 
    if (weatherRoutes.includes(rootSegment)) {
      return NextResponse.redirect(new URL(`/weather${path}`, req.url));
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
    
    // Redirect dev-centre sub-routes
    const devRoutes = ['/billing', '/compute', '/crashlytics', '/credentials', '/database', '/edge-config', '/emails', '/functions', '/git', '/monitoring', '/preview', '/sockets', '/storage', '/teams', '/webhooks', '/voltra-apps'];
    const rootSegment = '/' + path.split('/')[1]; 
    if (devRoutes.includes(rootSegment)) {
      return NextResponse.rewrite(new URL(`/dev-centre${path}`, req.url));
    }
    // Redirect other paths to main domain
    return NextResponse.redirect(`https://www.xakteir.com${path}`);
  }

  // 8. Handle Drive standalone deployment via drive.xakteir.com
  if (hostname === 'drive.xakteir.com' || hostname === 'www.drive.xakteir.com') {
    if (path === '/auth' || path.startsWith('/auth/')) return NextResponse.next();
    
    if (!req.cookies.has('xak_session')) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }

    if (path === '/') return NextResponse.rewrite(new URL('/drive', req.url));
    if (path.startsWith('/drive')) return NextResponse.next(); // Already rewritten
    
    // Redirect Drive sub-routes
    const driveRoutes = ['/settings'];
    const rootSegment = '/' + path.split('/')[1]; 
    if (driveRoutes.includes(rootSegment)) {
      return NextResponse.rewrite(new URL(`/drive${path}`, req.url));
    }
    // Redirect other paths to main domain
    return NextResponse.redirect(`https://www.xakteir.com${path}`);
  }

  // 9. Handle Meet standalone deployment via meet.xakteir.com
  if (hostname === 'meet.xakteir.com' || hostname === 'www.meet.xakteir.com') {
    if (path === '/auth' || path.startsWith('/auth/')) return NextResponse.next();

    if (path === '/') return NextResponse.rewrite(new URL('/meet', req.url));
    if (path.startsWith('/meet')) return NextResponse.next(); // Already rewritten
    
    // Check if the path belongs to a known global app, if so redirect
    const globalApps = ['/about', '/admin', '/ai-chat', '/apps', '/archive', '/art', '/authenticator', '/buddy', '/calculator', '/calendar', '/challenge', '/chat', '/classroom', '/code', '/contact', '/desktop', '/dev-centre', '/download-desktop', '/drive', '/forms', '/games', '/installer', '/learn-pro', '/mail', '/map', '/meet', '/mini-player', '/news', '/notes', '/notifications', '/oauth', '/overlay', '/pics', '/privacy', '/profile', '/projects', '/quick-reply', '/rietkax', '/search', '/search-console', '/sheets', '/shop', '/sign', '/sites', '/slides', '/social', '/stream', '/suite', '/tasks', '/terms', '/translate', '/upgrade', '/weather', '/whiteboard', '/write', '/xakarena', '/xakarena-creator', '/xakcode', '/xaksports', '/xakview'];
    const rootSegment = '/' + path.split('/')[1]; 
    if (globalApps.includes(rootSegment)) {
      return NextResponse.redirect(`https://www.xakteir.com${path}`);
    }
    // Otherwise, treat it as a room ID
    return NextResponse.rewrite(new URL(`/meet${path}`, req.url));
  }

  // 10. Handle Account standalone deployment via account.xakteir.com
  if (hostname === 'accounts.xakteir.com' || hostname === 'www.accounts.xakteir.com') {
    return NextResponse.redirect(`https://account.xakteir.com${path}`);
  }

  if (hostname === 'account.xakteir.com' || hostname === 'www.account.xakteir.com') {
    if (path === '/auth' || path.startsWith('/auth/')) return NextResponse.next();
    
    if (!req.cookies.has('xak_session')) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }

    if (path === '/') return NextResponse.rewrite(new URL('/profile', req.url));
    if (path.startsWith('/profile')) return NextResponse.next();
    
    // Redirect Profile sub-routes
    const profileRoutes = ['/security'];
    const rootSegment = '/' + path.split('/')[1]; 
    if (profileRoutes.includes(rootSegment)) {
      return NextResponse.rewrite(new URL(`/profile${path}`, req.url));
    }
    // Redirect other paths to main domain
    return NextResponse.redirect(`https://www.xakteir.com${path}`);
  }

  // 11. Handle Voltra standalone deployment via voltra.xakteir.com
  if (hostname === 'voltra.xakteir.com' || hostname === 'www.voltra.xakteir.com' || hostname.startsWith('voltra.localhost')) {
    if (path === '/') return NextResponse.rewrite(new URL('/voltra', req.url));
    if (path.startsWith('/voltra')) return NextResponse.next(); // Let internal routed assets pass
    
    // If you go to a random path on the subdomain (e.g. voltra.xakteir.com/about), kick to main site
    return NextResponse.redirect(`https://www.xakteir.com${path}`);
  }

  // 11.5 Handle Voltra Store standalone deployment via store.voltra.xakteir.com
  if (hostname === 'store.voltra.xakteir.com' || hostname === 'www.store.voltra.xakteir.com' || hostname.startsWith('store.voltra.localhost')) {
    if (path === '/') return NextResponse.rewrite(new URL('/voltrastore', req.url));
    if (path.startsWith('/voltrastore')) return NextResponse.next();
    
    // Rewrite all other paths to the internal /voltrastore routing directory
    return NextResponse.rewrite(new URL(`/voltrastore${path}`, req.url));
  }

  // 12. Handle VoltraPlay standalone deployment via play.voltra.xakteir.com
  if (hostname === 'play.voltra.xakteir.com' || hostname === 'www.play.voltra.xakteir.com' || hostname.startsWith('play.voltra.localhost')) {
    if (path === '/') return NextResponse.rewrite(new URL('/voltraplay', req.url));
    if (path.startsWith('/voltraplay')) return NextResponse.next();
    
    // If you go to a random path on the subdomain, kick to main site
    return NextResponse.redirect(`https://www.xakteir.com${path}`);
  }

  // 13. Handle VoltraMax standalone deployment via voltramax.xakteir.com
  if (hostname === 'voltramax.xakteir.com' || hostname === 'www.voltramax.xakteir.com' || hostname.startsWith('voltramax.localhost')) {
    if (path === '/') return NextResponse.rewrite(new URL('/voltramax', req.url));
    if (path.startsWith('/voltramax')) return NextResponse.next();
    
    // If you go to a random path on the subdomain, kick to main site
    return NextResponse.redirect(`https://www.xakteir.com${path}`);
  }

  // 13.5 Handle MicroDimension standalone deployment via microdimension.xakteir.com
  if (hostname === 'microdimension.xakteir.com' || hostname === 'www.microdimension.xakteir.com' || hostname.startsWith('microdimension.localhost')) {
    if (path === '/') return NextResponse.rewrite(new URL('/microdimension', req.url));
    if (path.startsWith('/microdimension')) return NextResponse.next();
    
    // Rewrite sub-routes to microdimension directory
    return NextResponse.rewrite(new URL(`/microdimension${path}`, req.url));
  }

  // 13.6 Handle Everyworld standalone deployment via everyworld.xakteir.com
  if (hostname === 'everyworld.xakteir.com' || hostname === 'www.everyworld.xakteir.com' || hostname.startsWith('everyworld.localhost')) {
    if (path === '/') return NextResponse.rewrite(new URL('/everyworld', req.url));
    if (path.startsWith('/everyworld')) return NextResponse.next();
    
    // Rewrite sub-routes to everyworld directory
    return NextResponse.rewrite(new URL(`/everyworld${path}`, req.url));
  }

  // 14. Redirect paths on xakteir.com to their respective subdomains (only in production)
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.startsWith('192.168.');
  
  if (
    !isLocalhost &&
    hostname !== 'code.xakteir.com' && hostname !== 'www.code.xakteir.com' &&
    hostname !== 'chat.xakteir.com' && hostname !== 'www.chat.xakteir.com' &&
    hostname !== 'maps.xakteir.com' && hostname !== 'www.maps.xakteir.com' &&
    hostname !== 'dev.xakteir.com' && hostname !== 'www.dev.xakteir.com' &&
    hostname !== 'drive.xakteir.com' && hostname !== 'www.drive.xakteir.com' &&
    hostname !== 'meet.xakteir.com' && hostname !== 'www.meet.xakteir.com' &&
    hostname !== 'account.xakteir.com' && hostname !== 'www.account.xakteir.com' &&
    hostname !== 'accounts.xakteir.com' && hostname !== 'www.accounts.xakteir.com' &&
    hostname !== 'voltra.xakteir.com' && hostname !== 'www.voltra.xakteir.com' &&
    hostname !== 'store.voltra.xakteir.com' && hostname !== 'www.store.voltra.xakteir.com' &&
    hostname !== 'play.voltra.xakteir.com' && hostname !== 'www.play.voltra.xakteir.com' &&
    hostname !== 'voltramax.xakteir.com' && hostname !== 'www.voltramax.xakteir.com' &&
    hostname !== 'microdimension.xakteir.com' && hostname !== 'www.microdimension.xakteir.com' &&
    hostname !== 'everyworld.xakteir.com' && hostname !== 'www.everyworld.xakteir.com' &&
    hostname !== 'weather.xakteir.com' && hostname !== 'www.weather.xakteir.com'
  ) {
    if (path === '/xakcode') return NextResponse.redirect('https://code.xakteir.com/xakcode');
    if (path.startsWith('/xakcode/')) return NextResponse.redirect(`https://code.xakteir.com${path}`);
    
    if (path === '/chat') return NextResponse.redirect('https://chat.xakteir.com/chat');
    if (path.startsWith('/chat/')) return NextResponse.redirect(`https://chat.xakteir.com${path}`);
    
    if (path === '/map') return NextResponse.redirect('https://maps.xakteir.com/map');
    if (path.startsWith('/map/')) return NextResponse.redirect(`https://maps.xakteir.com${path}`);

    if (path === '/weather') return NextResponse.redirect('https://weather.xakteir.com/weather');
    if (path.startsWith('/weather/')) return NextResponse.redirect(`https://weather.xakteir.com${path}`);

    if (path === '/dev-centre') return NextResponse.redirect('https://dev.xakteir.com');
    if (path.startsWith('/dev-centre/')) return NextResponse.redirect(`https://dev.xakteir.com${path.replace('/dev-centre', '')}`);

    if (path === '/drive') return NextResponse.redirect('https://drive.xakteir.com');
    if (path.startsWith('/drive/')) return NextResponse.redirect(`https://drive.xakteir.com${path.replace('/drive', '')}`);

    if (path === '/meet') return NextResponse.redirect('https://meet.xakteir.com');
    if (path.startsWith('/meet/')) return NextResponse.redirect(`https://meet.xakteir.com${path.replace('/meet', '')}`);

    if (path === '/profile') return NextResponse.redirect('https://account.xakteir.com');
    if (path.startsWith('/profile/')) return NextResponse.redirect(`https://account.xakteir.com${path.replace('/profile', '')}`);

    if (path === '/microdimension') return NextResponse.redirect('https://microdimension.xakteir.com');
    if (path.startsWith('/microdimension/')) return NextResponse.redirect(`https://microdimension.xakteir.com${path.replace('/microdimension', '')}`);

    if (path === '/everyworld') return NextResponse.redirect('https://everyworld.xakteir.com');
    if (path.startsWith('/everyworld/')) return NextResponse.redirect(`https://everyworld.xakteir.com${path.replace('/everyworld', '')}`);

    if (path === '/suite') return NextResponse.redirect('https://suite.xakteir.com');
    if (path.startsWith('/suite/')) return NextResponse.redirect(`https://suite.xakteir.com${path.replace('/suite', '')}`);

    const suiteApps = ['forms', 'write', 'sheets', 'slides'];
    for (const app of suiteApps) {
      if (path === `/${app}`) return NextResponse.redirect(`https://${app}.suite.xakteir.com`);
      if (path.startsWith(`/${app}/`)) return NextResponse.redirect(`https://${app}.suite.xakteir.com${path.replace(`/${app}`, '')}`);
    }
  }

  // 15. Enforce Subdomain Isolation (Prevent direct path access from other domains)
  if (
    hostname !== 'xakarena.xakteir.com' && hostname !== 'www.xakarena.xakteir.com' &&
    hostname !== 'creator.xakarena.xakteir.com' && hostname !== 'www.creator.xakarena.xakteir.com' &&
    hostname !== 'voltra.xakteir.com' && hostname !== 'www.voltra.xakteir.com' && !hostname.startsWith('voltra.localhost') &&
    hostname !== 'store.voltra.xakteir.com' && hostname !== 'www.store.voltra.xakteir.com' && !hostname.startsWith('store.voltra.localhost') &&
    hostname !== 'play.voltra.xakteir.com' && hostname !== 'www.play.voltra.xakteir.com' && !hostname.startsWith('play.voltra.localhost') &&
    hostname !== 'voltramax.xakteir.com' && hostname !== 'www.voltramax.xakteir.com' && !hostname.startsWith('voltramax.localhost') &&
    hostname !== 'microdimension.xakteir.com' && hostname !== 'www.microdimension.xakteir.com' && !hostname.startsWith('microdimension.localhost') &&
    hostname !== 'everyworld.xakteir.com' && hostname !== 'www.everyworld.xakteir.com' && !hostname.startsWith('everyworld.localhost') &&
    !hostname.endsWith('.suite.xakteir.com') && hostname !== 'suite.xakteir.com' && hostname !== 'www.suite.xakteir.com'
  ) {
    if (
      path === '/xakarena' || path.startsWith('/xakarena/') || 
      path === '/xakarena-creator' || path.startsWith('/xakarena-creator/') ||
      path === '/voltra' || path.startsWith('/voltra/') ||
      path === '/voltrastore' || path.startsWith('/voltrastore/') ||
      path === '/voltraplay' || path.startsWith('/voltraplay/') ||
      path === '/voltramax' || path.startsWith('/voltramax/') ||
      path === '/microdimension' || path.startsWith('/microdimension/') ||
      path === '/everyworld' || path.startsWith('/everyworld/') ||
      path === '/suite' || path.startsWith('/suite/') ||
      suiteApps.some(app => path === `/${app}` || path.startsWith(`/${app}/`))
    ) {
      // Rewrite to a non-existent route to trigger Next.js 404 (Hidden from users)
      return NextResponse.rewrite(new URL('/404', req.url));
    }
  }

  // Default behavior for xakteir.com (allow everything)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
