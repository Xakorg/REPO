export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebaseAdmin";

function validateSubdomain(s: string) {
  if (!s) return false;
  const ok = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(s);
  const reserved = new Set(['www','api','admin','mail','ftp','localhost']);
  return ok && !reserved.has(s.toLowerCase());
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const subdomain = url.searchParams.get('subdomain');
    if (!subdomain) return NextResponse.json({ error: 'subdomain required' }, { status: 400 });

    const s = subdomain.toLowerCase();
    if (!validateSubdomain(s)) return NextResponse.json({ available: false, reason: 'invalid' });

    const db = getFirestore();
    const q = await db.collection('deployments').where('subdomain', '==', s).limit(1).get();
    if (!q.empty) return NextResponse.json({ available: false, reason: 'taken' });

    return NextResponse.json({ available: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}
