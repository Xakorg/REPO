/**
 * Seed search index and images collection.
 * Usage (dry-run): node scripts/seed_search.js --count 1000 --images 500 --dry-run
 * To execute: set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY and run without --dry-run
 */

const admin = require('firebase-admin');
const faker = require('faker');

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

async function main() {
  const argv = require('minimist')(process.argv.slice(2));
  const count = parseInt(argv.count || argv.c || '1000', 10);
  const images = parseInt(argv.images || argv.i || '500', 10);
  const dryRun = argv['dry-run'] || argv.dry || false;

  console.log(`Seed count=${count} images=${images} dryRun=${dryRun}`);
  initAdmin();
  const db = admin.firestore();

  for (let i = 0; i < count; i++) {
    const title = faker.company.companyName() + ' ' + faker.random.word() + ' ' + i;
    const url = `https://${faker.internet.domainName()}`;
    const doc = {
      title,
      url,
      description: faker.lorem.sentence(),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    if (!dryRun) await db.collection('indexedSites').add(doc);
    if ((i+1) % 1000 === 0) console.log(`seeded ${i+1}`);
  }

  for (let j = 0; j < images; j++) {
    const seed = `seed-${Date.now()}-${j}`;
    const thumb = `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/400`;
    const doc = { title: `Image ${j}`, thumb, source: 'picsum', timestamp: admin.firestore.FieldValue.serverTimestamp() };
    if (!dryRun) await db.collection('searchImages').add(doc);
    if ((j+1) % 100 === 0) console.log(`seeded images ${j+1}`);
  }

  console.log('Done seeding.');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
