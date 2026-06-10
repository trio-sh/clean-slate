// Vercel Serverless Function: send email via SMTP (Gmail by default)
//
// SMTP is server-side only — it cannot run in the browser. The client calls this
// endpoint, which relays the message through the configured SMTP server.
//
// Required environment variable (secret — never commit it):
//   SMTP_PASSWORD     Gmail app password for the authenticating account
//
// Optional environment variables (sensible defaults below):
//   SMTP_HOST         default: smtp.gmail.com
//   SMTP_PORT         default: 587 (STARTTLS)
//   SMTP_USER         default: amaniscleaners@gmail.com (authenticating account)
//   SMTP_FROM_NAME    default: Amani's Cleaners
//   SMTP_FROM_EMAIL   default: info@amanicleaners.com
//   SMTP_REPLY_TO     default: info@amanicleaners.com
//
// NOTE: Gmail only allows the "From" header to be the authenticated account or a
// verified "Send mail as" alias. To send as info@amanicleaners.com, that address
// must be added & verified as a send-as alias on the SMTP_USER Gmail account;
// otherwise Gmail rewrites the From to the authenticated account.
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, html, text, replyTo } = req.body || {};

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, and html or text' });
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || 'amaniscleaners@gmail.com';
  const pass = process.env.SMTP_PASSWORD;
  const fromName = process.env.SMTP_FROM_NAME || "Amani's Cleaners";
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'info@amanicleaners.com';
  const defaultReplyTo = process.env.SMTP_REPLY_TO || 'info@amanicleaners.com';

  if (!pass) {
    return res.status(500).json({ error: 'Email is not configured (missing SMTP_PASSWORD)' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS (secure:false)
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
      replyTo: replyTo || defaultReplyTo,
      // Use the authenticated account as the SMTP envelope sender for deliverability.
      envelope: { from: user, to },
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('SMTP send error:', error);
    return res.status(500).json({ error: 'Failed to send email', message: error.message });
  }
}
