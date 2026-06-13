import 'server-only';

import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

type ServiceAccountShape = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function getServiceAccountFromEnv(): ServiceAccountShape | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ServiceAccountShape;
    return {
      projectId: parsed.projectId,
      clientEmail: parsed.clientEmail,
      privateKey: parsed.privateKey.replace(/\\n/g, '\n'),
    };
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    return null;
  }
}

function getAdminApp() {
  const existing = getApps()[0];
  if (existing) {
    return existing;
  }

  const serviceAccount = getServiceAccountFromEnv();
  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });
  }

  return initializeApp({
    credential: applicationDefault(),
  });
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
