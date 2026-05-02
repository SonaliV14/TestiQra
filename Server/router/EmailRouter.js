import express from 'express';
import nodemailer from 'nodemailer';

const EmailRouter = express.Router();

// ─── POST /api/v1/email/send-reply ───────────────────────────────────────────
EmailRouter.post('/send-reply', async (req, res) => {
  const { to, subject, body, fromName } = req.body;

  if (!to || !body) {
    return res.status(400).json({ error: 'to and body are required' });
  }

  const senderName  = fromName || process.env.EMAIL_FROM_NAME || 'TestiQra';
  const senderEmail = process.env.EMAIL_USER;

  if (!senderEmail || !process.env.EMAIL_PASS) {
    console.error('EMAIL_USER or EMAIL_PASS env var is missing');
    return res.status(500).json({ error: 'Email service not configured on server' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject: subject || 'Thank you for your testimonial!',
      text: body,
      html: `
  <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; background-color:#f9fafb; padding:40px 0;">
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05);">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg, #0f172a, #111827); padding:24px 32px;">
        <h2 style="color:#ffffff; margin:0; font-size:20px; letter-spacing:0.5px;">
          ${senderName}
        </h2>
        <p style="color:#9ca3af; margin:6px 0 0; font-size:13px;">
          Authentic Testimonials. Real Impact.
        </p>
      </div>

      <!-- Body -->
      <div style="padding:32px;">
      
        <div style="background:#f3f4f6; padding:16px; border-radius:8px; margin:20px 0;">
          <p style="font-size:14px; color:#374151; margin:0; line-height:1.6;">
            ${body.replace(/\n/g, '<br/>')}
          </p>
        </div>

        <p style="font-size:15px; color:#111827; line-height:1.7; margin-bottom:20px;">
          Thank you for taking the time to share your valuable testimonial with us. We truly appreciate your feedback and are grateful for your trust in our platform.
        </p>


        <p style="font-size:15px; color:#111827; line-height:1.7; margin-top:20px;">
          If you have any further feedback or suggestions, feel free to reply to this email. We're always here to improve your experience.
        </p>

        <p style="font-size:15px; color:#111827; margin-top:24px;">
          Warm regards,<br/>
          <strong>${senderName}</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="padding:20px 32px; background:#f9fafb; border-top:1px solid #e5e7eb;">
        <p style="font-size:12px; color:#9ca3af; margin:0; line-height:1.5;">
          You are receiving this email because you submitted a testimonial via ${senderName}. 
          If this wasn't you, you can safely ignore this message.
        </p>
      </div>

    </div>
  </div>
`
    });

    return res.status(200).json({ success: true, message: `Reply sent to ${to}` });
  } catch (err) {
    console.error('Email send error:', err.message);
    return res.status(500).json({ error: 'Failed to send email', details: err.message });
  }
});

export default EmailRouter;