import { initializeFirebase } from './firebase/index';

const sdks = initializeFirebase();

export const auth = sdks.auth;
export const db = sdks.firestore;
export const storage = sdks.storage;
export const firebaseApp = sdks.firebaseApp;

export * from './firebase/index';
