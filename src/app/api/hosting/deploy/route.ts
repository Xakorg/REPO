import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebaseAdmin";

function makeDeployId() {
  const now = Date.now().toString(36);
  const rnd = Math.floor(Math.random() * 1e6).toString(36);
  return `dpl-${now}-${rnd}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { owner, repo, ref } = body || {};
    if (!owner || !repo) {
      return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 });
    }

    const deployId = makeDeployId();
    const db = getFirestore();
    const docRef = db.collection('deployments').doc(deployId);
    await docRef.set({
      owner,
      repo,
      ref: ref || 'main',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    const payload: any = {
      event_type: 'xakcode-deploy',
      client_payload: {
        deployId,
        ref: ref || 'main',
      },
    };

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Server GITHUB_TOKEN not configured' }, { status: 500 });
    }

    const dispatchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!dispatchRes.ok) {
      const text = await dispatchRes.text();
      return NextResponse.json({ error: 'GitHub dispatch failed', details: text }, { status: dispatchRes.status });
    }

    const previewUrl = `https://${deployId}.code.xakteir.com/`;
    // Update the doc
    await docRef.update({ status: 'dispatched', previewUrl });

    return NextResponse.json({ deployId, previewUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}
