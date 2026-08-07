import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json({ error: 'No PDF document provided.' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a .pdf document.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);

    const cleanedText = (data.text || '')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return NextResponse.json({
      text: cleanedText,
      numPages: data.numpages || 1,
      info: data.info || {},
      fileName: file.name,
    });
  } catch (err: any) {
    console.error('PDF parse error:', err);
    return NextResponse.json({ error: 'Failed to parse PDF document: ' + err.message }, { status: 500 });
  }
}
