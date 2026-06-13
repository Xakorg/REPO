import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { domain } = await req.json();
    if (!domain) return NextResponse.json({ error: 'Domain is required' }, { status: 400 });

    const response = await fetch(`https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'Failed to add domain' }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');
    
    if (!domain) return NextResponse.json({ error: 'Domain is required' }, { status: 400 });

    const response = await fetch(`https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${domain}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'Failed to remove domain' }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

