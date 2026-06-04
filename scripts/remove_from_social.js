/**
 * Safe script to remove or anonymize references to a user in social collections.
 * Usage (dry-run):
 *   node scripts/remove_from_social.js <userIdentifier> --dry-run
 * To execute changes add `--execute` flag and ensure GOOGLE_APPLICATION_CREDENTIALS or
 * FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) is available in the environment.
 */

const admin = require('firebase-admin');
const fs = require('fs');

function initAdmin() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({ credential: admin.credential.cert(key) });
    return;
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp();
    return;
  }
  console.error('No service account credentials found. Set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS.');
  process.exit(1);
}

async function scanAndAnonymize(db, collectionName, identifier, options) {
  console.log(`Scanning collection: ${collectionName}`);
  const colRef = db.collection(collectionName);
  // Try both authorId and author fields
  const byAuthorId = await colRef.where('authorId', '==', identifier).get();
  const byAuthor = await colRef.where('author', '==', identifier).get();

  const matches = [];
  byAuthorId.forEach(d => matches.push({ id: d.id, ref: d.ref }));
  byAuthor.forEach(d => {
    if (!matches.some(m => m.id === d.id)) matches.push({ id: d.id, ref: d.ref });
  });

  console.log(`Found ${matches.length} documents in ${collectionName}`);
  for (const m of matches) {
    console.log(` - ${collectionName}/${m.id}`);
    if (options.execute) {
      await m.ref.update({ authorId: admin.firestore.FieldValue.delete(), author: 'removed' });
      console.log(`   -> anonymized`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/remove_from_social.js <userIdentifier> [--dry-run|--execute]');
    process.exit(1);
  }
  const identifier = args[0];
  const execute = args.includes('--execute');
  const dryRun = args.includes('--dry-run') || !execute;

  initAdmin();
  const db = admin.firestore();

  const collectionsToScan = [
    'globalMessages',
    'social',
    'posts',
    'videos',
    'chats',
    'comments'
  ];

  console.log(`Identifier: ${identifier}`);
  console.log(dryRun ? 'Running in dry-run mode (no changes).' : 'Executing changes.');

  for (const col of collectionsToScan) {
    try {
      await scanAndAnonymize(db, col, identifier, { execute });
    } catch (err) {
      console.warn(`Failed scanning ${col}:`, err.message || err);
    }
  }

  console.log('Done.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
