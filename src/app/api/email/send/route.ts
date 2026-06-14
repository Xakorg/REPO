import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function verifyAuthToken(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) throw new Error('Missing auth token');
  const idToken = auth.split(' ')[1];
  
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({ credential: admin.credential.cert(key) });
    } else {
      admin.initializeApp();
    }
  }
  
  const decoded = await admin.auth().verifyIdToken(idToken);
  return decoded.uid;
}

export async function POST(req: Request) {
  try {
    const uid = await verifyAuthToken(req);
    const { to, subject, body } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userDoc = await admin.firestore().doc(`users/${uid}`).get();
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
    await admin.firestore().collection("users").doc(uid).collection("emails").add({
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
