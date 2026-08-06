import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Use require for CJS-compatible pdf-parse
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);

    return NextResponse.json({
      text: data.text,
      numPages: data.numpages,
      info: data.info,
    });
  } catch (err: any) {
    console.error('PDF parse error:', err);
    return NextResponse.json({ error: 'Failed to parse PDF: ' + err.message }, { status: 500 });
  }
}
