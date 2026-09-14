export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebaseAdmin";

function extractSubdomain(host: string | null) {
  if (!host) return null;
  // host examples:
  // chosensub.code.xakteir.com  -> chosensub
  // chosensub.code.xakteir.com:443 -> include port, remove it
  const hostname = host.split(':')[0];
  const m = hostname.match(/^([a-z0-9-]+)\.code\.xakteir\.com$/i);
  if (m) return m[1].toLowerCase();
  return null;
}

async function fetchUpstream(owner: string, repo: string, deployId: string, path: string) {
  const base = `https://${owner}.github.io/${repo}/deployments/${deployId}`;
  const suffix = path ? `/${path}` : '/';
  const target = base + suffix;
  // Note: we use a simple fetch; Vercel will handle outbound networking.
  return fetch(target, { method: 'GET' });
}

export async function GET(req: Request, { params }: any) {
  try {
    const host = req.headers.get('host');
    const subdomain = extractSubdomain(host);
    if (!subdomain) return NextResponse.json({ error: 'subdomain not found in host' }, { status: 400 });

    const db = getFirestore();
    const q = await db.collection('deployments').where('subdomain', '==', subdomain).limit(1).get();
    if (q.empty) return NextResponse.json({ error: 'deploy not found for subdomain' }, { status: 404 });

    const data = q.docs[0].data() as any;
    const owner = data.owner;
    const repo = data.repo;
    const deployId = data.deployId;
    if (!owner || !repo || !deployId) return NextResponse.json({ error: 'mapping incomplete' }, { status: 500 });

    const pathParts = params?.path || [];
    const fetchPath = Array.isArray(pathParts) ? pathParts.join('/') : String(pathParts || '');
    const upstream = await fetchUpstream(owner, repo, deployId, fetchPath);

    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(text, { status: upstream.status });
    }

    // Copy relevant headers from upstream
    const headers = new Headers();
    upstream.headers.forEach((v, k) => {
      if (k.toLowerCase() === 'set-cookie') return;
      headers.set(k, v);
    });

    return new Response(upstream.body, { status: 200, headers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'proxy failed' }, { status: 500 });
  }
}
