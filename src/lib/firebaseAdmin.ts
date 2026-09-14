import admin from 'firebase-admin';

let firestore: admin.firestore.Firestore | null = null;

export function getFirestore() {
  if (firestore) return firestore;

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not set');
  }

  const serviceAccount = typeof key === 'string' ? JSON.parse(key) : key;

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  firestore = admin.firestore();
  return firestore;
}
