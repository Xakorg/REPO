import 'server-only';
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // expected to be uid

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: 'OAuth not configured' }, { status: 500 });
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    return NextResponse.json({ error: 'Token exchange failed', details: tokenData }, { status: 500 });
  }

  // Persist tokens to Firestore under users/{uid}/connectedAccounts/gmail
  try {
    const db = getAdminDb();
    await db.collection('users').doc(state).collection('connectedAccounts').doc('gmail').set({
      ...tokenData,
      storedAt: new Date().toISOString()
    });
  } catch (e) {
    // ignore but report
    console.error('Failed to store Gmail tokens', e);
  }

  const redirectBack = new URL(process.env.GMAIL_OAUTH_SUCCESS_REDIRECT || '/mail', url.origin);
  redirectBack.searchParams.set('gmail', 'connected');
  return NextResponse.redirect(redirectBack.toString());
}
