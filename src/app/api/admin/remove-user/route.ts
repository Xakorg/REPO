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

async function scanAndAnonymize(db: FirebaseFirestore.Firestore, collectionName: string, identifier: string, execute: boolean) {
  const colRef = db.collection(collectionName);
  const byAuthorId = await colRef.where('authorId', '==', identifier).get();
  const byAuthor = await colRef.where('author', '==', identifier).get();
  const matches: Array<{ id: string; ref: FirebaseFirestore.DocumentReference }> = [];
  byAuthorId.forEach(d => matches.push({ id: d.id, ref: d.ref }));
  byAuthor.forEach(d => { if (!matches.some(m => m.id === d.id)) matches.push({ id: d.id, ref: d.ref }); });
  const results: string[] = [];
  for (const m of matches) {
    results.push(`${collectionName}/${m.id}`);
    if (execute) {
      await m.ref.update({ authorId: admin.firestore.FieldValue.delete(), author: 'removed' });
    }
  }
  return results;
}

export async function POST(req: Request) {
  try {
    await verifyAdminToken(req);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'auth' }, { status: 403 });
  }

  const body = await req.json();
  const identifier = body.identifier;
  const execute = !!body.execute;

  if (!identifier) return NextResponse.json({ ok: false, error: 'missing identifier' }, { status: 400 });

  const db = admin.firestore();
  const collections = ['globalMessages','social','posts','videos','chats','comments'];
  const summary: Record<string, number> = {};

  for (const c of collections) {
    try {
      const res = await scanAndAnonymize(db, c, identifier, execute);
      summary[c] = res.length;
    } catch (err) {
      summary[c] = -1;
    }
  }

  return NextResponse.json({ ok: true, execute, identifier: identifier.replace(/./g, '*'), summary });
}
