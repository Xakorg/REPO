import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      token: process.env.XktrBlb_READ_WRITE_TOKEN,
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'application/pdf', 'text/plain', 'text/html', 'application/javascript', 'text/css', 'font/woff', 'font/woff2', 'font/ttf', 'application/zip', 'application/x-zip-compressed', 'video/mp4', 'audio/mpeg', 'audio/wav', 'application/json', 'application/octet-stream'],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500MB limit
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed', blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
