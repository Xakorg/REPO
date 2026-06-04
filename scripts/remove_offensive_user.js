/*
  Script: remove_offensive_user.js
  - Requires a Firebase service account key JSON pointed by GOOGLE_APPLICATION_CREDENTIALS env var
  - Deletes Firestore documents in `users` collection where username matches the target
  - Tries to delete the corresponding Firebase Auth user when possible
  USAGE (run from project root):
    node scripts/remove_offensive_user.js <username-to-remove>

  WARNING: This permanently deletes data. Review before running.
*/

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const readline = require('readline');

function usageAndExit() {
  console.error('Usage: node scripts/remove_offensive_user.js <username> [--dry-run] [--scan-all] [--limit=N]');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 1) usageAndExit();

const targetUsername = args[0].toLowerCase();
const dryRun = args.includes('--dry-run');
const scanAll = args.includes('--scan-all');
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

if (!admin.apps.length) {
  admin.initializeApp({});
}

const db = getFirestore();
const auth = getAuth();

function containsStringRecursive(obj, needle) {
  if (obj == null) return false;
  if (typeof obj === 'string') return obj.toLowerCase().includes(needle);
  if (typeof obj !== 'object') return false;
  for (const k of Object.keys(obj)) {
    if (containsStringRecursive(obj[k], needle)) return true;
  }
  return false;
}

async function confirmPrompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim().toLowerCase() === 'yes');
    });
  });
}

async function run() {
  console.log(`Target username: '${targetUsername}'  dryRun=${dryRun}  scanAll=${scanAll}${limit ? ` limit=${limit}` : ''}`);

  const collections = await db.listCollections();
  let anyFound = false;

  for (const col of collections) {
    let colSnap;
    try {
      if (!scanAll) {
        const q = col.where('username', '==', targetUsername);
        colSnap = await q.get();
      } else {
        // fetch docs (optionally limited) for manual scan
        if (limit) colSnap = await col.limit(limit).get();
        else colSnap = await col.get();
      }
    } catch (e) {
      console.warn('Skipping collection', col.id, 'due to error:', e.message || e);
      continue;
    }

    if (!colSnap || colSnap.empty) continue;
    for (const d of colSnap.docs) {
      const data = d.data();

      let matches = false;
      if (!scanAll) {
        matches = true; // query matched by username
      } else {
        // scan all string fields for occurrences
        matches = containsStringRecursive(data, targetUsername);
      }

      if (!matches) continue;
      anyFound = true;
      console.log(`MATCH: ${col.id}/${d.id}`);
      console.log(JSON.stringify(data, null, 2));

      if (!dryRun) {
        // attempt to delete Auth user by uid (doc id)
        try {
          await auth.deleteUser(d.id);
          console.log('Deleted Firebase Auth user (by uid):', d.id);
        } catch (err) {
          // fallback: try delete by email field if present
          if (data && data.email) {
            try {
              const u = await auth.getUserByEmail(data.email);
              await auth.deleteUser(u.uid);
              console.log('Deleted Firebase Auth user (by email):', u.uid);
            } catch (err2) {
              console.warn('Could not delete Auth user by email:', err2.message || err2);
            }
          } else {
            console.warn('Could not delete Auth user for doc id:', d.id, err.message || err);
          }
        }

        try {
          await col.doc(d.id).delete();
          console.log(`Deleted Firestore doc ${col.id}/${d.id}`);
        } catch (err) {
          console.warn('Failed to delete Firestore doc:', err.message || err);
        }
      }
    }
  }

  if (!anyFound) console.log('No matches found in top-level collections.');

  if (!dryRun && anyFound) {
    console.log('Deletion operations completed. Note: nested subcollections and references elsewhere are not deleted by this script.');
  }
}

(async () => {
  if (!dryRun) {
    console.log('You are about to PERMANENTLY DELETE matching documents and attempt Auth deletions.');
    const ok = await confirmPrompt("Type 'yes' to proceed: ");
    if (!ok) {
      console.log('Aborted by user.');
      process.exit(0);
    }
  }

  try {
    await run();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
