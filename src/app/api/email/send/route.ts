import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { firebaseConfig } from '@/firebase/config';

// Add a fallback so the build doesn't crash if the env var is missing
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_123");

async function verifyAuthToken(req: Request) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) throw new Error('Missing auth token');
  const idToken = auth.split(' ')[1];
  
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey;
  if (!apiKey) {
    throw new Error('Firebase API Key missing in environment and config');
  }

  // Use REST API to verify token without firebase-admin
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });

  const data = await res.json();
  if (data.error || !data.users || !data.users[0]) {
    throw new Error('Invalid auth token');
  }

  return data.users[0].localId;
}

export async function POST(req: Request) {
  try {
    const uid = await verifyAuthToken(req);
    const { to, subject, body, senderAddress, senderName, senderPhoto } = await req.json();

    if (!to || !subject || !body || !senderAddress) {
      return NextResponse.json({ error: 'Missing required fields or sender address' }, { status: 400 });
    }

    // Embed profile picture as a small signature block if provided
    let finalHtml = body;
    if (senderPhoto) {
      finalHtml += `
        <br><br>
        <div style="display:flex;align-items:center;margin-top:20px;border-top:1px solid #eee;padding-top:10px;">
          <img src="${senderPhoto}" alt="${senderName}" style="width:40px;height:40px;border-radius:50%;margin-right:10px;" />
          <div>
            <p style="margin:0;font-weight:bold;color:#333;">${senderName}</p>
            <p style="margin:0;font-size:12px;color:#777;">Sent via Xakteir Mail</p>
          </div>
        </div>
      `;
    }

    // Cascade 1: Resend
    try {
      const { data, error } = await resend.emails.send({
        from: `${senderName || 'Xakteir User'} <${senderAddress}>`,
        to: [to],
        subject: subject,
        html: finalHtml,
      });
      if (!error) {
        return NextResponse.json({ success: true, provider: 'resend', data });
      }
      console.warn("Resend failed, falling back to Brevo...", error);
    } catch (e) {
      console.warn("Resend exception, falling back to Brevo...", e);
    }

    // Cascade 2: Brevo
    if (process.env.BREVO_API_KEY) {
      try {
        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: senderName || 'Xakteir User', email: senderAddress },
            to: [{ email: to }],
            subject: subject,
            htmlContent: finalHtml
          })
        });
        
        if (brevoRes.ok) {
          const data = await brevoRes.json();
          return NextResponse.json({ success: true, provider: 'brevo', data });
        } else {
          console.warn("Brevo failed, falling back to SendGrid...", await brevoRes.text());
        }
      } catch (e) {
        console.warn("Brevo exception, falling back to SendGrid...", e);
      }
    } else {
      console.warn("BREVO_API_KEY missing, skipping Brevo...");
    }

    // Cascade 3: SendGrid
    if (process.env.SENDGRID_API_KEY) {
      try {
        const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: senderAddress, name: senderName || 'Xakteir User' },
            subject: subject,
            content: [{ type: "text/html", value: finalHtml }]
          })
        });
        
        if (sgRes.ok) {
          return NextResponse.json({ success: true, provider: 'sendgrid' });
        } else {
          console.warn("SendGrid failed...", await sgRes.text());
        }
      } catch (e) {
        console.warn("SendGrid exception...", e);
      }
    } else {
      console.warn("SENDGRID_API_KEY missing, skipping SendGrid...");
    }

    return NextResponse.json({ error: "All email providers failed or missing API keys" }, { status: 500 });

  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
