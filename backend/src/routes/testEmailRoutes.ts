import { Router, Request, Response, NextFunction } from 'express';
import { Resend } from 'resend';

const router = Router();

// POST /api/test-email
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (process.env.NODE_ENV !== 'production') {
    res.json({
      success: true,
      message: 'Email sending is disabled in development. This is a mock response.',
      emailId: `mock-${Date.now()}`,
    });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'Resend API key is not configured on the server.' });
    return;
  }

  const { to } = req.body;
  if (!to) {
    res.status(400).json({ error: "Missing 'to' field in the request body." });
    return;
  }

  try {
    const resend = new Resend(apiKey);
    const emailFrom = process.env.EMAIL_FROM || 'CampusConnect <onboarding@resend.dev>';
    
    console.log(`[Resend Email] Attempting to send test email to: ${to} from: ${emailFrom}`);
    
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to,
      subject: 'CampusConnect Resend Test Email',
      html: `
        <div style="font-family: sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 40px; border-radius: 8px; border: 1px solid #1e293b;">
          <h1 style="color: #38bdf8; margin-top: 0;">Resend Configuration Verified!</h1>
          <p>This is a test email from the CampusConnect backend verifying that your Resend integration is configured and functioning correctly.</p>
          <hr style="border-color: #1e293b; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    if (error) {
      console.error('[Resend Email] Resend API returned error:', error);
      res.status(500).json({ error: error.message || 'Resend API failed to send email.' });
      return;
    }

    console.log('[Resend Email] Email sent successfully. ID:', data?.id);
    res.json({
      success: true,
      message: 'Test email sent successfully via Resend.',
      emailId: data?.id,
    });
  } catch (error: any) {
    console.error('[Resend Email] Connection/SDK Error:', error);
    res.status(500).json({
      error: 'Failed to send email due to connection or SDK error.',
      details: error.message || String(error),
    });
  }
});

export default router;
