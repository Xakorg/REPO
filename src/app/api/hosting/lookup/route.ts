export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const deployId = url.searchParams.get('deployId');
    const subdomain = url.searchParams.get('subdomain');

    const db = getFirestore();

    if (subdomain) {
      const q = await db.collection('deployments').where('subdomain', '==', subdomain.toLowerCase()).limit(1).get();
      if (q.empty) return NextResponse.json({ error: 'deploy not found' }, { status: 404 });
      const data = q.docs[0].data();
      return NextResponse.json({ owner: data.owner, repo: data.repo, ref: data.ref, previewUrl: data.previewUrl, deployId: data.deployId });
    }

    if (!deployId) return NextResponse.json({ error: 'deployId or subdomain is required' }, { status: 400 });

    const doc = await db.collection('deployments').doc(deployId).get();
    if (!doc.exists) return NextResponse.json({ error: 'deploy not found' }, { status: 404 });

    const data = doc.data();
    return NextResponse.json({ owner: data?.owner, repo: data?.repo, ref: data?.ref, previewUrl: data?.previewUrl, subdomain: data?.subdomain });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}
