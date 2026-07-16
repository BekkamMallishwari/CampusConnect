import nodemailer from 'nodemailer';

const getTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);

  if (!user || !pass) {
    // Use Ethereal for development if no SMTP credentials provided
    console.warn('[EmailService] No SMTP credentials. Using console transport fallback.');
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
};

interface MatchEmailData {
  lostUser: { name: string; email: string };
  foundUser: { name: string; email: string };
  lostItem: { itemName: string; description: string; images: string[] };
  foundItem: { itemName: string; description: string; images: string[] };
  matchPercentage: number;
  matchId: string;
}

const getMatchEmailHtml = (data: MatchEmailData, isLostUser: boolean): string => {
  const { lostItem, foundItem, matchPercentage, matchId } = data;
  const recipientName = isLostUser ? data.lostUser.name : data.foundUser.name;
  const headline = isLostUser
    ? 'We found a possible match for your lost item!'
    : 'Someone may have lost the item you found!';

  const appUrl = process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:5173';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>CampusConnect – Match Found</title>
</head>
<body style="margin:0;padding:0;background:#020617;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0e7490,#6d28d9);padding:32px;text-align:center;">
              <div style="font-size:28px;font-weight:700;color:#fff;letter-spacing:-0.5px;">🔍 CampusConnect</div>
              <div style="font-size:13px;color:#a5f3fc;margin-top:6px;letter-spacing:2px;text-transform:uppercase;">Lost &amp; Found</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:14px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Hello, ${recipientName}</p>
              <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#f1f5f9;line-height:1.3;">${headline}</h1>
              
              <!-- Match Score Badge -->
              <div style="background:linear-gradient(135deg,#0e7490,#6d28d9);border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
                <div style="font-size:42px;font-weight:800;color:#fff;">${matchPercentage}%</div>
                <div style="font-size:13px;color:#a5f3fc;margin-top:4px;">Match Confidence</div>
              </div>
              
              <!-- Items Comparison -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="48%" style="background:#1e293b;border-radius:12px;padding:16px;vertical-align:top;">
                    <div style="font-size:11px;color:#38bdf8;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">🔴 Lost Item</div>
                    <div style="font-size:16px;font-weight:600;color:#f1f5f9;margin-bottom:6px;">${lostItem.itemName}</div>
                    <div style="font-size:13px;color:#94a3b8;line-height:1.5;">${lostItem.description.slice(0, 100)}${lostItem.description.length > 100 ? '...' : ''}</div>
                    ${lostItem.images[0] ? `<img src="${lostItem.images[0]}" alt="Lost Item" style="width:100%;border-radius:8px;margin-top:12px;object-fit:cover;max-height:120px;" />` : ''}
                  </td>
                  <td width="4%" style="text-align:center;vertical-align:middle;">
                    <div style="font-size:20px;color:#6d28d9;">⟷</div>
                  </td>
                  <td width="48%" style="background:#1e293b;border-radius:12px;padding:16px;vertical-align:top;">
                    <div style="font-size:11px;color:#34d399;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">🟢 Found Item</div>
                    <div style="font-size:16px;font-weight:600;color:#f1f5f9;margin-bottom:6px;">${foundItem.itemName}</div>
                    <div style="font-size:13px;color:#94a3b8;line-height:1.5;">${foundItem.description.slice(0, 100)}${foundItem.description.length > 100 ? '...' : ''}</div>
                    ${foundItem.images[0] ? `<img src="${foundItem.images[0]}" alt="Found Item" style="width:100%;border-radius:8px;margin-top:12px;object-fit:cover;max-height:120px;" />` : ''}
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <div style="text-align:center;">
                <a href="${appUrl}/matches/${matchId}" style="display:inline-block;background:linear-gradient(135deg,#0e7490,#6d28d9);color:#fff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:50px;text-decoration:none;">
                  View Match &amp; Connect
                </a>
              </div>
              
              <p style="margin:24px 0 0;font-size:13px;color:#64748b;text-align:center;">
                If this doesn't look right, you can dismiss the match in your dashboard.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:20px;text-align:center;border-top:1px solid #1e293b;">
              <p style="margin:0;font-size:12px;color:#475569;">© 2026 CampusConnect Lost &amp; Found · <a href="${appUrl}" style="color:#38bdf8;text-decoration:none;">Visit App</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

export const sendMatchNotificationEmail = async (data: MatchEmailData): Promise<void> => {
  const transporter = getTransporter();

  const lostUserMail = {
    from: `"CampusConnect" <${process.env.SMTP_USER || 'noreply@campusconnect.app'}>`,
    to: data.lostUser.email,
    subject: `🔍 ${data.matchPercentage}% Match Found for Your Lost Item – CampusConnect`,
    html: getMatchEmailHtml(data, true),
  };

  const foundUserMail = {
    from: `"CampusConnect" <${process.env.SMTP_USER || 'noreply@campusconnect.app'}>`,
    to: data.foundUser.email,
    subject: `📦 Possible Owner Found for Item You Reported – CampusConnect`,
    html: getMatchEmailHtml(data, false),
  };

  try {
    const info1 = await transporter.sendMail(lostUserMail);
    const info2 = await transporter.sendMail(foundUserMail);
    console.log('[EmailService] Match emails sent:', info1.messageId, info2.messageId);
  } catch (err) {
    console.error('[EmailService] Failed to send match emails:', err);
  }
};

export const sendPasswordResetEmail = async (email: string, name: string, resetUrl: string): Promise<void> => {
  const transporter = getTransporter();
  const html = `
    <div style="background:#020617;font-family:'Segoe UI',Arial,sans-serif;padding:40px 20px;">
      <div style="max-width:480px;margin:0 auto;background:#0f172a;border-radius:16px;border:1px solid #1e293b;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0e7490,#6d28d9);padding:24px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:22px;">Password Reset</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#94a3b8;margin:0 0 16px;">Hi <strong style="color:#f1f5f9;">${name}</strong>,</p>
          <p style="color:#94a3b8;margin:0 0 24px;">Click the button below to reset your password. This link expires in 1 hour.</p>
          <div style="text-align:center;">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#0e7490,#6d28d9);color:#fff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:50px;text-decoration:none;">Reset Password</a>
          </div>
          <p style="color:#475569;font-size:12px;margin:24px 0 0;text-align:center;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"CampusConnect" <${process.env.SMTP_USER || 'noreply@campusconnect.app'}>`,
      to: email,
      subject: 'Reset Your CampusConnect Password',
      html,
    });
  } catch (err) {
    console.error('[EmailService] Failed to send reset email:', err);
  }
};
