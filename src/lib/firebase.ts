import { initializeFirebase } from '@/firebase';

const sdks = initializeFirebase();

export const db = sdks.firestore;
export const auth = sdks.auth;
export const storage = sdks.storage;

export default sdks;
