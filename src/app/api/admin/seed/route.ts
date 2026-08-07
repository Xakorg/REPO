import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

const SUPER_ADMIN_EMAILS = ["admin@xakteir.com", "admin2@xakteir.com"];

function initAdmin() {
  if (admin.apps && admin.apps.length) return;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({ credential: admin.credential.cert(key) });
      return;
    } catch (err) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', err);
    }
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp();
    return;
  }
  console.error('No service account credentials found on server.');
}

initAdmin();

async function verifyAdminToken(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) throw new Error('Missing auth token');
  const idToken = auth.split(' ')[1];
  const decoded = await admin.auth().verifyIdToken(idToken);
  const uid = decoded.uid;
  if (decoded.email && SUPER_ADMIN_EMAILS.includes(decoded.email.toLowerCase())) return uid;
  const adminDoc = await admin.firestore().doc(`admins/${uid}`).get();
  if (!adminDoc.exists) throw new Error('Not an admin');
  return uid;
}

export async function POST(req: Request) {
  try {
    await verifyAdminToken(req);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'auth' }, { status: 403 });
  }

  const body = await req.json();
  const count = Number(body.count || 1000);
  const images = Number(body.images || 500);
  const dryRun = !!body.dryRun;

  const db = admin.firestore();
  const seeded = { sites: 0, images: 0 };

  for (let i = 0; i < count; i++) {
    const doc = {
      title: `Seeded Site ${i}`,
      url: `https://seed-${i}.example.com`,
      description: `Auto-seeded site ${i}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (!dryRun) await db.collection('indexedSites').add(doc);
    seeded.sites++;
  }

  for (let j = 0; j < images; j++) {
    const seed = `seed-${Date.now()}-${j}`;
    const thumb = `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/400`;
    const doc = { title: `Image ${j}`, thumb, source: 'picsum', timestamp: admin.firestore.FieldValue.serverTimestamp() };
    if (!dryRun) await db.collection('searchImages').add(doc);
    seeded.images++;
  }

  return NextResponse.json({ ok: true, dryRun, seeded });
}
