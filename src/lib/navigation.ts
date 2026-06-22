export function getAbsoluteUrl(path: string): string {
  if (typeof window === "undefined") return path;
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : "";
  
  const isLocalhost = hostname.includes("localhost") || hostname.includes("127.0.0.1") || hostname.startsWith("192.168.");
  
  let cleanPath = path;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const parsed = new URL(path);
      if (parsed.hostname.endsWith("xakteir.com")) {
        if (parsed.hostname.startsWith("chat.")) {
          cleanPath = `/chat${parsed.pathname}${parsed.search}${parsed.hash}`;
        } else if (parsed.hostname.startsWith("maps.")) {
          cleanPath = `/map${parsed.pathname}${parsed.search}${parsed.hash}`;
        } else if (parsed.hostname.startsWith("code.")) {
          cleanPath = `/xakcode${parsed.pathname}${parsed.search}${parsed.hash}`;
        } else {
          cleanPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
      } else {
        // Third-party external URL
        return path;
      }
    } catch (e) {
      return path;
    }
  }

  if (isLocalhost) {
    // On localhost, all apps are served from the same origin, so keep it local
    // Normalize path to prevent double prefixes
    let finalPath = cleanPath;
    if (finalPath.startsWith("/chat/chat")) finalPath = finalPath.replace("/chat/chat", "/chat");
    if (finalPath.startsWith("/map/map")) finalPath = finalPath.replace("/map/map", "/map");
    if (finalPath.startsWith("/xakcode/xakcode")) finalPath = finalPath.replace("/xakcode/xakcode", "/xakcode");
    
    return `${protocol}//${hostname}${port}${finalPath}`;
  }
  
  // Production subdomain routing
  if (cleanPath.startsWith("/chat") || cleanPath.startsWith("/s/") || cleanPath.startsWith("/dm/")) {
    let finalPath = cleanPath.startsWith("/chat") ? cleanPath : `/chat${cleanPath}`;
    if (finalPath.startsWith("/chat/chat")) finalPath = finalPath.replace("/chat/chat", "/chat");
    return `https://chat.xakteir.com${finalPath}`;
  }
  if (cleanPath.startsWith("/map")) {
    let finalPath = cleanPath;
    if (finalPath.startsWith("/map/map")) finalPath = finalPath.replace("/map/map", "/map");
    return `https://maps.xakteir.com${finalPath}`;
  }
  if (cleanPath.startsWith("/xakcode") || cleanPath.startsWith("/console") || cleanPath.startsWith("/hosting") || cleanPath.startsWith("/utilities") || cleanPath.startsWith("/git")) {
    let finalPath = cleanPath.startsWith("/xakcode") ? cleanPath : `/xakcode${cleanPath}`;
    if (finalPath.startsWith("/xakcode/xakcode")) finalPath = finalPath.replace("/xakcode/xakcode", "/xakcode");
    return `https://code.xakteir.com${finalPath}`;
  }
  
  // Everything else goes to the main domain
  return `https://xakteir.com${cleanPath}`;
}

export function navigateTo(path: string, router: any) {
  if (typeof window === "undefined") return;

  const targetUrl = getAbsoluteUrl(path);
  const currentUrl = window.location.href;

  try {
    const targetObj = new URL(targetUrl);
    const currentObj = new URL(currentUrl);

    // If origins are different (different subdomains/domains), we MUST do a full page reload
    if (targetObj.origin !== currentObj.origin) {
      window.location.href = targetUrl;
      return;
    }

    // Otherwise, we are on the same domain/subdomain, so use Next.js client router
    // Strip domain and use pathname + search + hash for router
    const relativePath = targetObj.pathname + targetObj.search + targetObj.hash;
    router.push(relativePath);
  } catch (e) {
    window.location.href = targetUrl;
  }
}
