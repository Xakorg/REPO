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
