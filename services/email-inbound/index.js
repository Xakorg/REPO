require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

// Minimal inbound handler: validates secret and writes to Firestore
// Usage: set FIREBASE_SERVICE_ACCOUNT_JSON (path or JSON) and XAKTEIR_INBOUND_SECRET

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.warn('Warning: FIREBASE_SERVICE_ACCOUNT_JSON not set. The server will fail without credentials.');
}

try {
  const svc = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (svc) {
    let creds = null;
    try { creds = JSON.parse(svc); } catch (e) { creds = require(svc); }
    admin.initializeApp({ credential: admin.credential.cert(creds) });
  } else {
    admin.initializeApp(); // fallback to ADC
  }
} catch (e) {
  console.error('Firebase admin init error', e);
}

const db = admin.firestore();
const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/email/inbound', async (req, res) => {
  const secret = req.get('x-xakteir-secret');
  if (!process.env.XAKTEIR_INBOUND_SECRET || secret !== process.env.XAKTEIR_INBOUND_SECRET) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const { recipient, from, subject, bodyHtml, rawBase64 } = req.body;
  if (!recipient || !from) return res.status(400).json({ error: 'missing recipient/from' });

  try {
    const targetDomain = recipient.split('@')[1];
    const q = await db.collection('domains').where('domainName', '==', targetDomain).limit(1).get();
    if (q.empty) return res.status(200).json({ ok: true, note: 'domain not configured' });

    const domainDoc = q.docs[0];
    const domainId = domainDoc.id;
    const userId = domainDoc.data().userId || null;

    await db.collection('inbox_emails').add({
      domainId,
      userId,
      recipient,
      sender: from,
      subject: subject || 'No Subject',
      bodyHtml: bodyHtml || '',
      raw: rawBase64 || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('inbound handler error', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

const port = process.env.PORT || 3010;
app.listen(port, () => console.log(`Email inbound service listening on ${port}`));
