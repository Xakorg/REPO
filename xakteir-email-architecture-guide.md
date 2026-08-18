# Xakteir Custom Email Architecture Guide

A complete guide for the Xakteir platform to implement custom domain email routing (inbound/outbound) using Cloudflare, Resend, and Firebase.

> Goal: provide a low-cost (free-tier friendly) architecture so Xakteir users can receive and send mail using custom domains managed inside the Dev Centre.

---

## Architecture Overview

- Inbound Receiving: Cloudflare Email Routing (Catch-All) + Cloudflare Worker (lightweight processing).
- Database: Firebase Firestore (stores domains and inbox messages).
- Outbound Sending: Resend API (send transactional/SMTP-like emails via API).
- Domain verification and outbound signing: Resend provides DKIM/SPF values; Cloudflare manages DNS.

High-level flow:
1. User adds domain in Dev Centre → backend registers domain with Resend and stores domain record in Firestore (status: pending).
2. Dev shows DNS records (MX for Cloudflare Email Routing + Resend SPF/DKIM values). User adds DNS records in Cloudflare.
3. Once verified, user clicks "Verify & Connect" → backend updates domain status to `active`.
4. Cloudflare Email Routing forwards incoming mail to a Cloudflare Worker which parses the mail and forwards to a secure backend or writes into Firestore.
5. Outbound emails are sent by the backend using the Resend API on behalf of the user's verified domain.

---

## Step 1: Firebase Setup

Create two collections in Firestore (recommended names):

1. `domains`
   - Fields: `userId` (string), `domainName` (string), `status` (string: 'pending'|'active'), `resendDomainId` (string, optional), `dkim` (map, optional), `spf` (string, optional), `createdAt` (timestamp).

2. `inbox_emails`
   - Fields: `domainId` (string), `userId` (string), `recipient` (string), `sender` (string), `subject` (string), `bodyHtml` (string), `raw` (string, optional), `createdAt` (timestamp).

Notes:
- Use Firebase Admin SDK on your backend to write to Firestore. Writing directly from Cloudflare Workers to Firestore REST API is possible but requires careful auth handling (service account key in secrets or a short-lived token). Simpler and more secure: have the Worker forward parsed messages to your backend HTTPS endpoint which then writes to Firestore with the Admin SDK.

---

## Step 2: Dev Centre UI Workflow

Screen 1: Add a Domain
- UX: user inputs `company.com`.
- Backend action:
  - Call Resend API to create/register domain for sending (if Resend supports domain management via API).
  - Save the returned DKIM/SPF values to Firestore along with domain record and set `status: 'pending'`.
- DB action: create a document in `domains` collection.

Screen 2: DNS Configuration
- Display to the user the DNS records they need to add (copy values from Resend API response and standard MX values for Cloudflare Email Routing):

Cloudflare MX (for Email Routing):
- `10 routing.cloudflare.net`
- `20 routing.cloudflare.net`
- `30 routing.cloudflare.net`

Resend (example):
- SPF / TXT: value provided by Resend (e.g., `v=spf1 include:resend.net ~all`)
- DKIM CNAME / TXT: values provided by Resend

- User clicks "Verify & Connect" once they've added DNS records.
- Backend verifies domain (call Resend verify API or check DNS + Resend responses), then update `status` to `active` in Firestore.

---

## Step 3: Inbound — Cloudflare Worker Options

Two recommended approaches for inbound handling:

Option A (Recommended): Cloudflare Worker parses the email and POSTs to an authenticated backend endpoint (Xakteir API). The backend uses Firebase Admin SDK to write to Firestore.

Benefits:
- Avoids complex auth from Worker → Firestore directly.
- Backend can run administrative logic, validation, spam checks, attachments handling, and user notifications.

Cloudflare Worker (example) — parse with `postal-mime` then forward to backend:

```js
import PostalMime from 'postal-mime';

export default {
  async email(message, env, ctx) {
    try {
      const recipient = message.to; // string or array depending on Cloudflare event object
      const rawResponse = new Response(message.raw);
      const parser = new PostalMime.default();
      const parsed = await parser.parse(await rawResponse.arrayBuffer());

      const bodyHtml = parsed.html || parsed.text || '';
      const payload = {
        recipient,
        from: message.from,
        subject: parsed.subject || 'No Subject',
        bodyHtml,
        raw: '' // optionally attach base64 raw
      };

      // Forward to Xakteir backend. Protect this endpoint with a secret header.
      await fetch(env.XAKTEIR_INBOUND_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-xakteir-secret': env.XAKTEIR_INBOUND_SECRET
        },
        body: JSON.stringify(payload)
      });

    } catch (err) {
      // Cloudflare logs
      console.error('Inbound worker error', err);
    }
  }
};
```

Notes:
- Deploy the worker via Wrangler or the Cloudflare dashboard.
- Set `XAKTEIR_INBOUND_ENDPOINT` and `XAKTEIR_INBOUND_SECRET` as environment variables (Wrangler secrets or dashboard bindings).
- `postal-mime` is required; include it in your worker build.

Option B (Direct Firestore REST from Worker — advanced):
- Not recommended unless comfortable handling Google service account keys inside Worker secrets.
- If you prefer this route, either:
  - Store a service-account JSON as a Worker secret and implement OAuth 2.0 JWT exchange to request a short-lived access token, or
  - Use a small proxy service (Option A) which is easier and safer.

---

## Step 4: Backend Endpoint (example Node/Express)

This backend receives parsed inbound mail and writes to Firestore using the Admin SDK.

Example (Node.js / Express):

```js
// inbound-handler.js
const express = require('express');
const admin = require('firebase-admin');

const app = express();
app.use(express.json({ limit: '10mb' }));

admin.initializeApp({
  credential: admin.credential.applicationDefault(), // or from service account
});
const db = admin.firestore();

app.post('/email/inbound', async (req, res) => {
  const secret = req.get('x-xakteir-secret');
  if (secret !== process.env.XAKTEIR_INBOUND_SECRET) return res.status(403).end();

  const { recipient, from, subject, bodyHtml } = req.body;
  const targetDomain = recipient.split('@')[1];

  // Find domain doc
  const domainsRef = db.collection('domains');
  const q = await domainsRef.where('domainName', '==', targetDomain).limit(1).get();
  if (q.empty) return res.status(200).send('domain not configured');

  const domainDoc = q.docs[0];
  const domainId = domainDoc.id;
  const userId = domainDoc.data().userId;

  await db.collection('inbox_emails').add({
    domainId,
    userId,
    recipient,
    sender: from,
    subject: subject || 'No Subject',
    bodyHtml: bodyHtml || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return res.status(200).send('ok');
});

module.exports = app;
```

Deploy this backend where it can be reached by the Cloudflare Worker (HTTPS). Protect with a strong `XAKTEIR_INBOUND_SECRET` header.

---

## Step 5: Outbound — Resend Integration

When a user sends an email from the Xakteir dashboard, send it from the backend using the Resend SDK/API.

Example (Node):

```js
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: `hello@${userDomain}`,
  to: [recipient],
  subject,
  html: bodyHtml
});
```

Notes:
- Ensure the sending domain (`userDomain`) is verified/activated with Resend and DNS values (DKIM/SPF) are set.
- Consider adding a reply-to header and handling bounce webhooks from Resend.

---

## Security & Operational Notes

- Protect inbound endpoints with a secret header and/or IP allowlist.
- Rate-limit the inbound route and implement spam filtering.
- Store secrets securely (Cloudflare Worker secrets, environment variables on backend, or secret manager).
- Use Firebase security rules to prevent direct client writes to `domains` or `inbox_emails` unless strictly intended.
- Keep raw message storage optional to avoid high storage costs — store only parsed content and attachments as needed.

---

## Testing & Verification

1. Register the domain and show DNS records in UI.
2. Add DNS records in Cloudflare (MX + Resend TXT/CNAME). Use DNS check tools to verify propagation.
3. Send test email from external address → verify Cloudflare routes to Worker → Worker forwards to backend → backend writes into Firestore.
4. From Xakteir UI, attempt to send outbound mail and verify Resend delivery + headers (DKIM passes).

---

## Checklist — What you (developer / operator) need to do

1. Firebase
   - Create Firebase project and Firestore collections: `domains`, `inbox_emails`.
   - Create a service account for backend with Firestore permissions and install Admin SDK on backend.
   - Securely store service account credentials in backend environment.

2. Resend
   - Create account and API key.
   - Add domain(s) via Resend (or through API) to obtain DKIM/SPF values.
   - Keep domain verification steps ready to show to users.

3. Cloudflare
   - Add domain to Cloudflare and enable Email Routing.
   - Create a catch-all rule or routing to a Cloudflare Worker. Add MX records as shown above.
   - Deploy the Cloudflare Worker (using Wrangler or Dashboard). Set secrets/bindings: `XAKTEIR_INBOUND_SECRET`, `XAKTEIR_INBOUND_ENDPOINT`.

4. Backend
   - Implement `/email/inbound` endpoint (example provided) using Firebase Admin SDK.
   - Implement domain registration flow calling Resend API and storing results in `domains` collection.
   - Implement outbound send route using Resend SDK.
   - Add verification endpoints and UI hooks for "Verify & Connect" flow.

5. Dev Centre UI
   - Screen for "Add Domain" → calls backend to register domain with Resend and create Firestore record.
   - Screen for DNS instructions and a "Verify & Connect" button.
   - Inbox view: list `inbox_emails` for a user / domain.
   - Compose/send UI that calls backend outbound route.

6. Monitoring & Webhooks
   - Subscribe to Resend webhooks for bounces and delivery events; update DB accordingly.
   - Add logging/alerting (errors during inbound parsing, failed writes to Firestore, etc.).

---

## Appendix — Useful Links and Commands

- Cloudflare Workers quickstart: https://developers.cloudflare.com/workers/
- Postal-mime (npm): https://www.npmjs.com/package/postal-mime
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- Resend docs: https://resend.com/docs

---

If you'd like, next steps can include:
- Committing this guide to the repo and opening a draft PR.
- Adding a sample Cloudflare Worker project skeleton under `examples/` with required bindings.
- Implementing the Node inbound handler in a new `services/email-inbound/` folder and adding tests.

Tell me which of the next steps to perform (commit file, add example worker, implement backend skeleton) and it can be done now.
