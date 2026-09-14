import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebaseAdmin";

function parseDeployFromHost(host: string | null) {
  if (!host) return null;
  // host examples:
  // dpl-abc123.code.xakteir.com  -> deployId = dpl-abc123
  // owner-repo-dpl-abc123.code.xakteir.com -> optionally parse owner/repo if your naming scheme includes it
  const m = host.match(/^([^\.]+)\.code\.xakteir\.com$/);
  if (m) return m[1];
  return null;
}

async function fetchUpstream(owner: string, repo: string, deployId: string, path: string) {
  const base = `https://${owner}.github.io/${repo}/deployments/${deployId}`;
  // ensure path begins with /
  const suffix = path ? `/${path}` : '/';
  const target = base + suffix;
  // Forward request to GitHub Pages
  return fetch(target, { method: 'GET' });
}

export async function GET(req: Request, { params }: any) {
  try {
    const host = req.headers.get('host');
    const deployId = parseDeployFromHost(host);
    if (!deployId) return NextResponse.json({ error: 'deployId not found in host' }, { status: 400 });

    const db = getFirestore();
    const doc = await db.collection('deployments').doc(deployId).get();
    if (!doc.exists) return NextResponse.json({ error: 'deploy not found' }, { status: 404 });

    const data = doc.data() as any;
    const owner = data.owner;
    const repo = data.repo;
    if (!owner || !repo) return NextResponse.json({ error: 'mapping incomplete' }, { status: 500 });

    // Build path string from params
    const pathParts = params?.path || [];
    const fetchPath = Array.isArray(pathParts) ? pathParts.join('/') : String(pathParts || '');
    const upstream = await fetchUpstream(owner, repo, deployId, fetchPath);

    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(text, { status: upstream.status });
    }

    // Copy response headers (filter as needed)
    const headers = new Headers();
    upstream.headers.forEach((v, k) => {
      if (k.toLowerCase() === 'set-cookie') return;
      headers.set(k, v);
    });

    const body = upstream.body;
    return new Response(body, { status: 200, headers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'proxy failed' }, { status: 500 });
  }
}
