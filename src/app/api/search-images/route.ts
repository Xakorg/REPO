import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    if (!q) return NextResponse.json({ images: [] });

    // Wikimedia API - generator search with thumbnails
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=pageimages|pageterms&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=12&pithumbsize=400&piprop=thumbnail|name&origin=*`;

    const res = await fetch(apiUrl);
    const data = await res.json();

    const images: Array<{ title: string; thumb?: string; page?: string }> = [];
    if (data && data.query && data.query.pages) {
      for (const id of Object.keys(data.query.pages)) {
        const p = data.query.pages[id];
        images.push({ title: p.title, thumb: p.thumbnail?.source, page: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}` });
      }
    }

    return NextResponse.json({ images });
  } catch (err: any) {
    return NextResponse.json({ images: [], error: String(err.message || err) }, { status: 500 });
  }
}
