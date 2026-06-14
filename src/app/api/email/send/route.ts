import { NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { Resend } from 'resend';

// Add a fallback so the build doesn't crash if the env var is missing
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_123");

async function verifyAuthToken(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) throw new Error('Missing auth token');
  const idToken = auth.split(' ')[1];
  
  const decoded = await getAdminAuth().verifyIdToken(idToken);
  return decoded.uid;
}

export async function POST(req: Request) {
  try {
    const uid = await verifyAuthToken(req);
    const { to, subject, body } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();
    const userDoc = await db.doc(`users/${uid}`).get();
    if (!userDoc.exists) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userData = userDoc.data() || {};
    
    // Get sender address
    let senderAddress = userData.xakteirEmail;
    if (!senderAddress && userData.username) {
        senderAddress = `${userData.username}@mail.xakteir.com`;
    }
    
    if (!senderAddress) {
        return NextResponse.json({ error: 'You do not have a Xakteir email address configured. Set a username or xakteirEmail in your profile.' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: `${userData.displayName || userData.username} <${senderAddress}>`,
      to: [to],
      subject: subject,
      text: body,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Save to sent folder in firestore
    await db.collection("users").doc(uid).collection("emails").add({
      from: senderAddress,
      to,
      subject,
      text: body,
      date: new Date(),
      read: true,
      folder: "sent",
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
