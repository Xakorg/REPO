import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAdminDb } from '@/lib/firebase-admin';

// Add a fallback so the build doesn't crash if the env var is missing
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_123");

export async function POST(req: Request) {
  try {
    const { uid, to, subject, body, senderName, senderDomain, senderAddress } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();
    
    let finalSenderEmail = '';
    let finalReplyTo = '';

    if (senderDomain && uid) {
      // Developer Custom Domain Route
      const domainsSnapshot = await db.collection(`dev_accounts/${uid}/email_domains`)
        .where("domain", "==", senderDomain)
        .where("status", "==", "Verified")
        .get();
        
      if (domainsSnapshot.empty) {
        return NextResponse.json({ error: `Domain ${senderDomain} is not verified in your account.` }, { status: 403 });
      }

      finalSenderEmail = `${senderName || 'Xakteir Dev'} <noreply@mail.xakteir.com>`;
      finalReplyTo = `reply@${senderDomain}`;
      
      // Log to outbox for dev accounts
      await db.collection(`dev_accounts/${uid}/emails_outbox`).add({
        to,
        subject,
        body,
        senderDomain,
        timestamp: new Date().toISOString()
      });
    } else if (senderAddress && senderAddress.toLowerCase().endsWith('@mail.xakteir.com')) {
      // Webmail Client Route — use the actual username@mail.xakteir.com address
      const normalizedAddress = senderAddress.toLowerCase();
      finalSenderEmail = `${senderName || 'Xakteir Member'} <${normalizedAddress}>`;
      finalReplyTo = normalizedAddress;
    } else {
      return NextResponse.json({ error: 'Invalid sender configuration' }, { status: 400 });
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: finalSenderEmail,
      to: [to],
      subject: subject,
      html: body,
      replyTo: finalReplyTo
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
