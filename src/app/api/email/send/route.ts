import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAdminDb } from '@/lib/firebase-admin';

// Add a fallback so the build doesn't crash if the env var is missing
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_123");

export async function POST(req: Request) {
  try {
    const { uid, to, subject, body, senderName, senderDomain } = await req.json();

    if (!uid || !to || !subject || !body || !senderDomain) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();
    
    // 1. Verify the domain is actually verified in Xakteir
    const domainsSnapshot = await db.collection(`dev_accounts/${uid}/email_domains`)
      .where("domain", "==", senderDomain)
      .where("status", "==", "Verified")
      .get();
      
    if (domainsSnapshot.empty) {
      return NextResponse.json({ error: `Domain ${senderDomain} is not verified in your account.` }, { status: 403 });
    }

    const senderEmail = `${senderName || 'Xakteir Dev'} <noreply@mail.xakteir.com>`;
    const replyTo = `reply@${senderDomain}`; // Simulate reply-to their domain

    // 2. Send email via Resend
    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: [to],
      subject: subject,
      html: body,
      replyTo: replyTo
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Log to outbox
    await db.collection(`dev_accounts/${uid}/emails_outbox`).add({
      to,
      subject,
      body,
      senderDomain,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
