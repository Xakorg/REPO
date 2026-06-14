import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Add a fallback so the build doesn't crash if the env var is missing
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_123");

import { firebaseConfig } from '@/firebase/config';

async function verifyAuthToken(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) throw new Error('Missing auth token');
  const idToken = auth.split(' ')[1];
  
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey;
  if (!apiKey) {
    throw new Error('Firebase API Key missing in environment and config');
  }

  // Use REST API to verify token without firebase-admin
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });

  const data = await res.json();
  if (data.error || !data.users || !data.users[0]) {
    throw new Error('Invalid auth token');
  }

  return data.users[0].localId;
}

export async function POST(req: Request) {
  try {
    const uid = await verifyAuthToken(req);
    const { to, subject, body, senderAddress, senderName } = await req.json();

    if (!to || !subject || !body || !senderAddress) {
      return NextResponse.json({ error: 'Missing required fields or sender address' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: `${senderName || 'Xakteir User'} <${senderAddress}>`,
      to: [to],
      subject: subject,
      text: body,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
