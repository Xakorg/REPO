import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { app_id: string } }) {
  try {
    const { app_id } = params;
    
    const res = await fetch(`https://flathub.org/api/v2/appstream/${app_id}`);
    
    if (!res.ok) {
      return NextResponse.json({ error: "App not found" }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Flathub app details proxy error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
