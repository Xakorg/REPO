"use server";

const EXPLICIT_FILTERS = [
  "naked", "nude", "sex", "porn", "porno", "nsfw", "gore", "murder", 
  "kill", "rape", "hentai", "boobs", "penis", "vagina", "ass", "dick",
  "fuck", "bitch", "shit", "cunt", "whore", "slut"
];

const FALLBACK_INSTANCES = [
  "https://baresearch.org",
  "https://find.xenorio.xyz"
];

let cachedInstances: string[] = [];
let lastFetchTime = 0;

async function getHealthySearxInstances() {
  const now = Date.now();
  if (cachedInstances.length > 0 && now - lastFetchTime < 1000 * 60 * 60) {
    return cachedInstances;
  }
  try {
    const res = await fetch("https://searx.space/data/instances.json", { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const instances = Object.entries(data.instances)
        .filter(([_, v]: [string, any]) => v.network_type === 'normal' && (v.html?.grade === 'V' || v.html?.grade === 'C'))
        .map(([url]) => url.replace(/\/$/, ""));
      if (instances.length > 0) {
        cachedInstances = instances.sort(() => 0.5 - Math.random());
        lastFetchTime = now;
        return cachedInstances;
      }
    }
  } catch (e) {
    console.error("Failed to fetch SearxNG instances", e);
  }
  return FALLBACK_INSTANCES;
}

export async function performWebSearch(query: string) {
  if (!query) return [];

  // Try DuckDuckGo HTML version first
  try {
    const res = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36'
      },
      body: `q=${encodeURIComponent(query)}`
    });
    
    if (res.ok) {
      const html = await res.text();
      const results = [];
      const linkRegex = /<a[^>]*href="([^"]+)"[^>]*class='result__url'[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class='result__snippet[^>]*>([\s\S]*?)<\/a>/g;
      let match;
      
      while ((match = linkRegex.exec(html)) !== null) {
        let url = match[1];
        if (url.startsWith('//duckduckgo.com/l/?uddg=')) {
          url = decodeURIComponent(url.split('uddg=')[1].split('&')[0]);
        }
        results.push({
          url,
          title: match[2].replace(/<[^>]+>/g, '').trim(),
          description: match[3].replace(/<[^>]+>/g, '').trim(),
          engine: 'duckduckgo'
        });
      }
      
      if (results.length > 0) {
        return results;
      }
    }
  } catch (e) {
    console.warn('DDG HTML scrape failed, falling back to SearxNG', e);
  }

  // Fallback to SearxNG Instances
  const instances = await getHealthySearxInstances();
  for (let i = 0; i < Math.min(3, instances.length); i++) {
    const instance = instances[i];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout
      const res = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&format=json`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0' },
        signal: controller.signal,
        next: { revalidate: 60 }
      });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results.map((r: any) => ({
            title: r.title,
            url: r.url,
            description: r.content || r.snippet || "",
            engine: r.engine || 'searx'
          }));
        }
      }
    } catch (e) {
      console.warn(`Searx instance ${instance} failed`, e);
      continue;
    }
  }

  return [];
}

export async function performImageSearch(query: string) {
  if (!query) return [];

  const instances = await getHealthySearxInstances();
  for (let i = 0; i < Math.min(4, instances.length); i++) {
    const instance = instances[i];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&categories=images&format=json`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: controller.signal,
        next: { revalidate: 60 }
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results.map((r: any) => ({
            title: r.title,
            img_src: r.img_src || r.thumbnail_src || r.url,
            url: r.url,
            source: r.source || r.engine
          })).filter((r: any) => r.img_src);
        }
      }
    } catch (e) {
      console.warn(`Searx instance ${instance} failed for images`, e);
      continue;
    }
  }
  return [];
}

export async function getWikipediaSummary(query: string) {
  if (!query) return null;
  
  const lowerQuery = query.toLowerCase();
  for (const bad of EXPLICIT_FILTERS) {
    if (lowerQuery.includes(bad)) return null;
  }

  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 XakteirSearch/1.0' },
      next: { revalidate: 86400 }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.type === 'standard' || data.type === 'disambiguation') {
        const textToCheck = `${data.title} ${data.extract}`.toLowerCase();
        for (const bad of EXPLICIT_FILTERS) {
          if (textToCheck.includes(bad)) {
             return null;
          }
        }
        
        return {
          title: data.title,
          description: data.description || "Wikipedia Article",
          extract: data.extract,
          thumbnail: data.thumbnail?.source || null,
          url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`
        };
      }
    }
  } catch (e) {
    console.error("Wikipedia fetch failed", e);
  }
  return null;
}
