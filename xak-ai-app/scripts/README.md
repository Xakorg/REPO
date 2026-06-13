remove_offensive_user.js

This script helps remove a user by username from your Firebase project. It requires a Firebase service account key and uses the Admin SDK.

Steps:

1. Create a service account key in the Firebase Console (Project Settings → Service accounts → Generate new private key).
2. Save the JSON file locally and set the environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
# On Windows (PowerShell):
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\path\to\service-account.json'
```

3. Run the script from the project root. The script will scan top-level collections for documents where the `username` field equals the target and delete those documents. It will also attempt to delete the Firebase Auth account by UID or email when possible.

```bash
node scripts/remove_offensive_user.js nigger
```

WARNING: This permanently deletes data. The script only scans top-level collections — there may still be references in nested subcollections or other collections (posts, comments, social objects). BACK UP your Firestore database and review the script before running. Consider exporting data first.

If you want me to run this here, I will need the service-account JSON or you must set `GOOGLE_APPLICATION_CREDENTIALS` in the environment on this machine. Sharing service-account JSON grants wide access — it's safer to run locally.

Additional safe modes and options
---------------------------------

- Preview matches without deleting (dry-run):

```bash
node scripts/remove_offensive_user.js nigger --dry-run
```

- Scan all documents in top-level collections for any string fields containing the username (may be slow):

```bash
node scripts/remove_offensive_user.js nigger --scan-all
```

- Limit documents fetched per collection during `--scan-all` with `--limit=N`:

```bash
node scripts/remove_offensive_user.js nigger --scan-all --limit=200
```

When not using `--dry-run`, the script will prompt for confirmation before deleting.

Fixing the `general` chat visibility
------------------------------------

If the `general` chat room is missing in Firestore, signed-in users will be denied access by the current rules. To create a public `general` chat doc that allows everyone to read messages, run:

```bash
# set credentials first
node scripts/create_general_chat.js
```

This requires the same service-account setup described above.
