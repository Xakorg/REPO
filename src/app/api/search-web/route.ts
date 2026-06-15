import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    if (!q) {
      return NextResponse.json({ results: [] });
    }

    // Try Tavily First
    try {
      const tavilyRes = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY || "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",
          query: q
        })
      });

      if (tavilyRes.ok) {
        const data = await tavilyRes.json();
        if (data && data.results && Array.isArray(data.results)) {
          const results = data.results.map((item: any) => ({
            title: item.title || '',
            url: item.url || '',
            description: item.content || item.snippet || ''
          }));
          return NextResponse.json({ results });
        }
      }
    } catch (e) {
      console.warn(`Tavily search failed:`, e);
    }

    // Fallback to Serper
    try {
      const serperRes = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY || "907e3915f87c64aa75b296e1ec64f9d049f26836",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ q })
      });

      if (serperRes.ok) {
        const data = await serperRes.json();
        if (data && data.organic && Array.isArray(data.organic)) {
          const results = data.organic.map((item: any) => ({
            title: item.title || '',
            url: item.link || '',
            description: item.snippet || ''
          }));
          return NextResponse.json({ results });
        }
      }
    } catch (e) {
      console.warn(`Serper search failed:`, e);
    }

    return NextResponse.json({ results: [] });
  } catch (err: any) {
    return NextResponse.json({ results: [], error: String(err.message || err) }, { status: 500 });
  }
}
