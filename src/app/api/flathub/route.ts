import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    const res = await fetch('https://flathub.org/api/v2/search', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'VoltraStore/1.0'
      },
      body: JSON.stringify({ query: query || "" })
    });
    
    if (!res.ok) {
      return NextResponse.json({ hits: [] }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Flathub proxy error:", error);
    return NextResponse.json({ hits: [] }, { status: 500 });
  }
}
