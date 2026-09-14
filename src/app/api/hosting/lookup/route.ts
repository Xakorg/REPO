import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebaseAdmin";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const deployId = url.searchParams.get('deployId');
    if (!deployId) return NextResponse.json({ error: 'deployId is required' }, { status: 400 });

    const db = getFirestore();
    const doc = await db.collection('deployments').doc(deployId).get();
    if (!doc.exists) return NextResponse.json({ error: 'deploy not found' }, { status: 404 });

    const data = doc.data();
    return NextResponse.json({ owner: data?.owner, repo: data?.repo, ref: data?.ref, previewUrl: data?.previewUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}
