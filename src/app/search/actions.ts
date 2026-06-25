"use server";

const SEARX_INSTANCES = [
  "https://baresearch.org",
  "https://failsearx.culturanerd.it",
  "https://search.catboy.house",
  "https://search.bladerunn.in",
  "https://find.xenorio.xyz",
  "https://search.anoni.net"
];

export async function performWebSearch(query: string) {
  if (!query) return [];

  for (const instance of SEARX_INSTANCES) {
    try {
      const res = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&format=json`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        next: { revalidate: 60 }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results.map((r: any) => ({
            title: r.title,
            url: r.url,
            description: r.content || r.snippet || "",
            engine: r.engine
          }));
        }
      }
    } catch (e) {
      console.warn(`Searx instance ${instance} failed`, e);
      continue;
    }
  }

  // Fallback to DuckDuckGo HTML if all SearxNG instances fail
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (res.ok) {
      const html = await res.text();
      const results = [];
      const blockRegex = /<div class="result__body">[\s\S]*?<\/div>\s*<\/div>/g;
      let blockMatch;
      while ((blockMatch = blockRegex.exec(html)) !== null) {
        const block = blockMatch[0];
        const titleMatch = block.match(/<h2 class="result__title">\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
        const snippetMatch = block.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/);
        if (titleMatch && snippetMatch) {
          let url = titleMatch[1];
          if (url.startsWith('//duckduckgo.com/l/?uddg=')) {
            url = decodeURIComponent(url.split('uddg=')[1].split('&')[0]);
          }
          results.push({
            url: url,
            title: titleMatch[2].replace(/<[^>]+>/g, '').trim(),
            description: snippetMatch[1].replace(/<[^>]+>/g, '').trim(),
            engine: 'duckduckgo'
          });
        }
      }
      if (results.length > 0) return results;
    }
  } catch (e) {
    console.error('DuckDuckGo fallback failed', e);
  }

  return [];
}

export async function performImageSearch(query: string) {
  if (!query) return [];

  for (const instance of SEARX_INSTANCES) {
    try {
      const res = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&categories=images&format=json`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        next: { revalidate: 60 }
      });
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
      console.warn(`Searx instance ${instance} failed`, e);
      continue;
    }
  }
  return [];
}
