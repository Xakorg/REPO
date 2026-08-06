import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Dynamically import pdf-parse to avoid issues with Next.js Edge runtime
    const pdfParse = (await import('pdf-parse')).default;
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
