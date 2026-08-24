import fs from 'fs';
import path from 'path';

// Simple server-side chunk receiver example for Next.js API route.
// Stores chunks temporarily under /tmp/xakdrive-chunks/<sessionId>/chunk-<index>

export const config = {
  api: {
    bodyParser: false,
  },
};

import Busboy from 'busboy';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const busboy = new Busboy({ headers: req.headers });

  const fields = {};
  const chunks: { index: number; path: string }[] = [];
  let sessionId = null;

  busboy.on('field', (name, val) => {
    fields[name] = val;
    if (name === 'sessionId') sessionId = val;
  });

  busboy.on('file', (fieldname, file, info) => {
    const { filename } = info;
    const indexField = fields['index'] || '0';
    const index = Number(indexField);
    const dir = path.join('/tmp', 'xakdrive-chunks', sessionId || 'unknown');
    fs.mkdirSync(dir, { recursive: true });
    const outPath = path.join(dir, `chunk-${index}`);
    const writeStream = fs.createWriteStream(outPath);
    file.pipe(writeStream);
    chunks.push({ index, path: outPath });
  });

  busboy.on('finish', () => {
    // Simple acknowledgement
    res.status(200).json({ ok: true, received: chunks.length });
  });

  req.pipe(busboy);
}
