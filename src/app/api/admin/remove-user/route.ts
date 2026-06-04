import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

function initAdmin() {
  if (admin.apps && admin.apps.length) return;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({ credential: admin.credential.cert(key) });
    return;
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
  const adminDoc = await admin.firestore().doc(`admins/${uid}`).get();
  if (!adminDoc.exists) throw new Error('Not an admin');
  return uid;
}

async function scanAndAnonymize(db, collectionName, identifier, execute) {
  const colRef = db.collection(collectionName);
  const byAuthorId = await colRef.where('authorId', '==', identifier).get();
  const byAuthor = await colRef.where('author', '==', identifier).get();
  const matches = [];
  byAuthorId.forEach(d => matches.push({ id: d.id, ref: d.ref }));
  byAuthor.forEach(d => { if (!matches.some(m => m.id === d.id)) matches.push({ id: d.id, ref: d.ref }); });
  const results = [];
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
  const summary = {};

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
