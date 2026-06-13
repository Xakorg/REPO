/*
  Script: create_general_chat.js
  - Creates a public chat room document at `chats/general` with `public: true`.
  - Requires `GOOGLE_APPLICATION_CREDENTIALS` to be set to a service account JSON.

  Usage:
    node scripts/create_general_chat.js
*/

const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp({});
const db = admin.firestore();

async function run() {
  const ref = db.collection('chats').doc('general');
  await ref.set({
    id: 'general',
    name: 'General',
    public: true,
    participants: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('Created/updated chats/general as public.');
}

run().catch((e) => { console.error(e); process.exit(1); });
