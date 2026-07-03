export function getAbsoluteUrl(path: string): string {
  if (typeof window === "undefined") return path;
  
  let cleanPath = path;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Normalize path to prevent double prefixes
  let finalPath = cleanPath;
  if (finalPath.startsWith("/chat/chat")) finalPath = finalPath.replace("/chat/chat", "/chat");
  if (finalPath.startsWith("/map/map")) finalPath = finalPath.replace("/map/map", "/map");
  if (finalPath.startsWith("/xakcode/xakcode")) finalPath = finalPath.replace("/xakcode/xakcode", "/xakcode");
  
  return finalPath;
}

export function navigateTo(path: string, router: any) {
  if (typeof window === "undefined") return;

  const targetUrl = getAbsoluteUrl(path);
  const currentUrl = window.location.href;

  try {
    const targetObj = new URL(targetUrl, window.location.href);
    const currentObj = new URL(currentUrl);

    // If origins are different (different subdomains/domains), we MUST do a full page reload
    if (targetObj.origin !== currentObj.origin) {
      window.location.href = targetObj.href;
      return;
    }

    // Otherwise, we are on the same domain/subdomain, so use Next.js client router
    // Strip domain and use pathname + search + hash for router
    const relativePath = targetObj.pathname + targetObj.search + targetObj.hash;
    
    // In Next.js App Router, router.push can sometimes fail to trigger a visual update
    // due to aggressive client-side caching or useSearchParams bugs in Layouts.
    // Calling router.refresh() forces a re-render from the server, fixing the glitch.
    router.push(relativePath);
    if (typeof router.refresh === 'function') {
      router.refresh();
    }
  } catch (e) {
    window.location.href = targetUrl;
  }
}
