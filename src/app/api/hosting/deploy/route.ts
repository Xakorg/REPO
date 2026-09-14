export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebaseAdmin";

function makeDeployId() {
  const now = Date.now().toString(36);
  const rnd = Math.floor(Math.random() * 1e6).toString(36);
  return `dpl-${now}-${rnd}`;
}

function validateSubdomain(s: string) {
  if (!s) return false;
  // lowercase, letters/numbers/hyphen, 3-63 chars, no leading/trailing hyphen
  const ok = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/.test(s);
  const reserved = new Set(['www','api','admin','mail','ftp','localhost']);
  return ok && !reserved.has(s.toLowerCase());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { owner, repo, ref, subdomain } = body || {};
    if (!owner || !repo) {
      return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 });
    }

    const db = getFirestore();

    // If subdomain provided, validate & ensure available
    let chosenSubdomain: string | null = null;
    if (subdomain) {
      const s = String(subdomain).toLowerCase();
      if (!validateSubdomain(s)) {
        return NextResponse.json({ error: 'invalid subdomain (allowed: a-z0-9 and hyphen, 3-63 chars, not reserved)' }, { status: 400 });
      }
      // Check if already taken
      const existingQ = await db.collection('deployments').where('subdomain', '==', s).limit(1).get();
      if (!existingQ.empty) {
        return NextResponse.json({ error: 'subdomain already taken' }, { status: 409 });
      }
      chosenSubdomain = s;
    }

    const deployId = makeDeployId();
    const previewHost = chosenSubdomain ? `${chosenSubdomain}.code.xakteir.com` : `${deployId}.code.xakteir.com`;
    const docRef = db.collection('deployments').doc(deployId);
    await docRef.set({
      owner,
      repo,
      ref: ref || 'main',
      status: 'pending',
      createdAt: new Date().toISOString(),
      deployId,
      subdomain: chosenSubdomain || null,
      previewUrl: `https://${previewHost}/`,
    });

    const payload: any = {
      event_type: 'xakcode-deploy',
      client_payload: {
        deployId,
        ref: ref || 'main',
        // include chosen subdomain so GH Action or downstream steps can reference it if you want
        subdomain: chosenSubdomain || null,
      },
    };

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      // keep the mapping so you can debug locally; but report back error
      await docRef.update({ status: 'dispatch_failed', dispatchDetails: 'GITHUB_TOKEN not configured' });
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
      // keep the mapping record so you can debug
      await docRef.update({ status: 'dispatch_failed', dispatchDetails: text });
      return NextResponse.json({ error: 'GitHub dispatch failed', details: text }, { status: dispatchRes.status });
    }

    await docRef.update({ status: 'dispatched' });

    const previewUrl = `https://${previewHost}/`;
    return NextResponse.json({ deployId, previewUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'failed' }, { status: 500 });
  }
}
