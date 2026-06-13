# XakCode Hosting Setup

## What Is Wired In

- `xakcode` is available at `/xakcode`
- Firebase CLI now reads `firestore.rules` from `firebase.json`
- The default Firebase project is set in `.firebaserc`
- App Hosting runtime settings stay in `apphosting.yaml`

## Required For Real AI

- Set `GOOGLE_API_KEY` in the server environment for Genkit
- Set `FIREBASE_SERVICE_ACCOUNT_KEY` to a JSON service account locally if you want AI tools to save docs/files/tasks from your machine
- In Firebase App Hosting or Google Cloud, application default credentials can handle admin access without a local key

## Required For Real Hosting

- Deploy the app to Firebase App Hosting
- Connect the custom domain in Firebase console
- Recommended primary domain: `www.yourdomain.com`
- Point the apex domain to redirect to `www`

## Domain Verification Flow

1. Open `XakCode`
2. Go to the `hosting` tab
3. Enter your domain, ideally the `www` subdomain
4. Add the generated TXT verification record in your DNS provider
5. Complete the domain connection in Firebase console

## Useful Commands

```bash
firebase deploy --only firestore:rules
firebase apphosting:backends:list
```
