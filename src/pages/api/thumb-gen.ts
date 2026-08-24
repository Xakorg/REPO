// Minimal serverless thumbnail generator example using sharp
// This is a placeholder example for a Firebase Function or Vercel Serverless.

import sharp from 'sharp';
import { Storage } from '@google-cloud/storage';
import type { NextApiRequest, NextApiResponse } from 'next';

const storage = new Storage();
const BUCKET = process.env.THUMBNAIL_BUCKET || 'xakdrive-thumbs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { bucket, filePath, width = 400 } = req.body;
    if (!bucket || !filePath) return res.status(400).json({ error: 'missing params' });

    const tmp = `/tmp/thumb-${Date.now()}`;
    const file = storage.bucket(bucket).file(filePath);
    await file.download({ destination: tmp });

    const thumbBuffer = await sharp(tmp).resize({ width: Number(width) }).jpeg({ quality: 70 }).toBuffer();
    const thumbName = `thumbs/${filePath.replace(/\//g, '__')}.jpg`;
    const outFile = storage.bucket(BUCKET).file(thumbName);
    await outFile.save(thumbBuffer, { metadata: { contentType: 'image/jpeg' } });

    const publicUrl = `https://storage.googleapis.com/${BUCKET}/${thumbName}`;
    return res.status(200).json({ url: publicUrl });
  } catch (e) {
    console.error('Thumbnail generation failed', e);
    return res.status(500).json({ error: 'thumb-failed' });
  }
}
