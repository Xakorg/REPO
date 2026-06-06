import { NextResponse } from 'next/server';

const SEARX_INSTANCES = [
  "https://searx.tiekoetter.com",
  "https://searx.be",
  "https://search.mdcnet.de",
  "https://priv.au",
  "https://searx.work"
];

// Helper to fetch with a timeout
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    if (!q) {
      return NextResponse.json({ results: [] });
    }

    for (const instance of SEARX_INSTANCES) {
      try {
        const apiUrl = `${instance}/search?q=${encodeURIComponent(q)}&format=json`;
        const res = await fetchWithTimeout(apiUrl, 2500);
        if (!res.ok) continue;
        
        const data = await res.json();
        if (data && Array.isArray(data.results)) {
          const results = data.results.map((item: any) => ({
            title: item.title || '',
            url: item.url || '',
            description: item.content || item.snippet || ''
          }));
          return NextResponse.json({ results });
        }
      } catch (e) {
        console.warn(`SearXNG proxy failed for instance ${instance}:`, e);
      }
    }

    return NextResponse.json({ results: [] });
  } catch (err: any) {
    return NextResponse.json({ results: [], error: String(err.message || err) }, { status: 500 });
  }
}
