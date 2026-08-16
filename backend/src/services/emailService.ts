import { Resend } from 'resend';

// ─── Resend client (lazy-initialised) ────────────────────────────────────────
let _resend: Resend | null = null;

const getResend = (): Resend | null => {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey || apiKey === 'dummy_resend_api_key') {
      return null;
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
};

const FROM = () => process.env.EMAIL_FROM || 'CampusConnect <onboarding@resend.dev>';
const APP_URL = () => {
  const primary = process.env.CLIENT_URL?.split(',')[0]?.trim();
  if (primary && !primary.includes('localhost') && !primary.includes('127.0.0.1')) return primary;
  return primary || 'https://campusconnect-app-eight.vercel.app';
};

// ─── Shared HTML shell ────────────────────────────────────────────────────────
const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>CampusConnect</title>
</head>
<body style="margin:0;padding:0;background:#020617;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:28px 32px;text-align:center;">
            <div style="font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;">🎓 CampusConnect</div>
            <div style="font-size:11px;color:#93c5fd;margin-top:6px;letter-spacing:3px;text-transform:uppercase;">University Lost &amp; Found Platform</div>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0a0f1e;padding:18px 32px;text-align:center;border-top:1px solid #1e293b;">
            <p style="margin:0;font-size:12px;color:#475569;">
              © 2026 CampusConnect &nbsp;·&nbsp;
              <a href="${APP_URL()}" style="color:#38bdf8;text-decoration:none;">Visit App</a> &nbsp;·&nbsp;
              <span style="color:#334155;">Automated System Notification</span>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

const ctaButton = (href: string, label: string) =>
  `<div style="text-align:center;margin-top:28px;">
     <a href="${href}"
        style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;
               font-weight:700;font-size:15px;padding:14px 38px;border-radius:50px;text-decoration:none;
               letter-spacing:0.3px;">
       ${label}
     </a>
   </div>`;

// Safe Dispatch Helper
const safeSendEmail = async (to: string, subject: string, html: string) => {
  const resend = getResend();
  if (!resend) {
    console.info(`[EmailService] Resend not configured. Simulated dispatch to ${to} | Subject: "${subject}"`);
    return;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM(),
      to,
      subject,
      html,
    });
    if (error) {
      console.error(`[EmailService] Resend error for ${to}:`, error);
    } else {
      console.log(`[EmailService] Email sent to ${to}. Message ID: ${data?.id}`);
    }
  } catch (err) {
    console.error(`[EmailService] Failed to send email to ${to}:`, err);
  }
};

// 1. WELCOME EMAIL
export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const body = `
    <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Welcome to CampusConnect</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#f1f5f9;line-height:1.3;">
      Hello ${name}, your account is ready! 🚀
    </h1>
    <p style="margin:0 0 16px;font-size:14px;color:#94a3b8;line-height:1.6;">
      Welcome to your university's official Lost & Found platform. You can now report lost items, return found belongings, verify ownership with AI matching, and earn community rewards.
    </p>
    ${ctaButton(`${APP_URL()}/dashboard`, 'Go to Dashboard')}
  `;
  await safeSendEmail(email, '🎓 Welcome to CampusConnect!', emailWrapper(body));
};

// 2. LOGIN ALERT EMAIL
export interface LoginAlertData {
  email: string;
  name: string;
  ip: string;
  device: string;
  browser: string;
  os: string;
  time: Date;
  isNewDevice?: boolean;
}

export const sendLoginAlertEmail = async (data: LoginAlertData): Promise<void> => {
  const body = `
    <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Security Notification</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#f1f5f9;line-height:1.3;">
      ${data.isNewDevice ? '⚠️ New Login Detected on Your Account' : 'Successful Account Login'}
    </h1>
    <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;width:35%;">📱 Device</td>
          <td style="padding:6px 0;font-size:13px;color:#f1f5f9;font-weight:600;">${data.device} (${data.os})</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;">🌐 Browser</td>
          <td style="padding:6px 0;font-size:13px;color:#f1f5f9;font-weight:600;">${data.browser}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;">📍 IP Address</td>
          <td style="padding:6px 0;font-size:13px;color:#cbd5e1;">${data.ip}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;">🕒 Time</td>
          <td style="padding:6px 0;font-size:13px;color:#cbd5e1;">${data.time.toLocaleString()}</td>
        </tr>
      </table>
    </div>
    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
      If this was you, no action is needed. If you did not log in, please reset your password immediately.
    </p>
    ${ctaButton(`${APP_URL()}/forgot-password`, 'Secure Account')}
  `;
  await safeSendEmail(
    data.email,
    data.isNewDevice ? '🔐 Security Alert: Login from new device' : '🔐 Account Login Notification',
    emailWrapper(body),
  );
};

// 3. LOST ITEM REPORT CONFIRMATION
export interface LostItemReportEmailData {
  userName: string;
  userEmail: string;
  itemName: string;
  category: string;
  description: string;
  lostLocation: string;
  lostDate: string;
  imageUrl?: string;
  itemId: string;
}

export const sendLostItemReportEmail = async (data: LostItemReportEmailData): Promise<void> => {
  const body = `
    <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Hi, ${data.userName}</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#f1f5f9;line-height:1.3;">
      Your lost item report has been submitted ✅
    </h1>
    <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
      ${data.imageUrl ? `<img src="${data.imageUrl}" alt="Item" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:16px;" />` : ''}
      <div style="font-size:20px;font-weight:700;color:#f1f5f9;margin-bottom:8px;">${data.itemName}</div>
      <div style="font-size:13px;color:#94a3b8;line-height:1.6;margin-bottom:12px;">${data.description}</div>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;width:40%;">📍 Location</td>
          <td style="padding:6px 0;font-size:13px;color:#cbd5e1;">${data.lostLocation}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;">📅 Date Lost</td>
          <td style="padding:6px 0;font-size:13px;color:#cbd5e1;">${data.lostDate}</td>
        </tr>
      </table>
    </div>
    ${ctaButton(`${APP_URL()}/lost-items/${data.itemId}`, 'View Your Report')}
  `;
  await safeSendEmail(data.userEmail, `📋 Report Submitted – "${data.itemName}" | CampusConnect`, emailWrapper(body));
};

// 4. FOUND ITEM REPORT CONFIRMATION
export interface FoundItemReportEmailData {
  userName: string;
  userEmail: string;
  itemName: string;
  category: string;
  description: string;
  foundLocation: string;
  foundDate: string;
  imageUrl?: string;
  itemId: string;
}

export const sendFoundItemReportEmail = async (data: FoundItemReportEmailData): Promise<void> => {
  const body = `
    <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Thank You, ${data.userName}</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#f1f5f9;line-height:1.3;">
      Found item report received 🎁
    </h1>
    <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
      ${data.imageUrl ? `<img src="${data.imageUrl}" alt="Item" style="width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin-bottom:16px;" />` : ''}
      <div style="font-size:20px;font-weight:700;color:#f1f5f9;margin-bottom:8px;">${data.itemName}</div>
      <div style="font-size:13px;color:#94a3b8;line-height:1.6;margin-bottom:12px;">${data.description}</div>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;width:40%;">📍 Found Location</td>
          <td style="padding:6px 0;font-size:13px;color:#cbd5e1;">${data.foundLocation}</td>
        </tr>
      </table>
    </div>
    ${ctaButton(`${APP_URL()}/found-items/${data.itemId}`, 'View Found Item')}
  `;
  await safeSendEmail(data.userEmail, `🟢 Found Item Logged – "${data.itemName}" | CampusConnect`, emailWrapper(body));
};

// 5. MATCH DETECTED (sent to BOTH users)
export interface MatchEmailData {
  lostUser: { name: string; email: string };
  foundUser: { name: string; email: string };
  lostItem: { itemName: string; description: string; images: string[] };
  foundItem: { itemName: string; description: string; images: string[] };
  matchPercentage: number;
  matchId: string;
}

const buildMatchEmailHtml = (data: MatchEmailData, isLostUser: boolean): string => {
  const { lostItem, foundItem, matchPercentage, matchId } = data;
  const recipientName = isLostUser ? data.lostUser.name : data.foundUser.name;
  const headline = isLostUser
    ? '🔍 A possible match was found for your lost item!'
    : '📦 Someone may have lost the item you found!';

  const body = `
    <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Hello, ${recipientName}</p>
    <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;color:#f1f5f9;line-height:1.3;">${headline}</h1>
    <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;font-weight:900;color:#fff;">${matchPercentage}%</div>
      <div style="font-size:12px;color:#93c5fd;margin-top:4px;letter-spacing:2px;text-transform:uppercase;">AI Match Confidence</div>
    </div>
    ${ctaButton(`${APP_URL()}/matches/${matchId}`, 'Review Match')}
  `;
  return emailWrapper(body);
};

export const sendMatchNotificationEmail = async (data: MatchEmailData): Promise<void> => {
  await Promise.all([
    safeSendEmail(
      data.lostUser.email,
      `🔍 ${data.matchPercentage}% AI Match Found for "${data.lostItem.itemName}" – CampusConnect`,
      buildMatchEmailHtml(data, true),
    ),
    safeSendEmail(
      data.foundUser.email,
      `📦 AI Match Detected for Found Item "${data.foundItem.itemName}" – CampusConnect`,
      buildMatchEmailHtml(data, false),
    ),
  ]);
};

// 6. MATCH CONFIRMED
export interface MatchConfirmedEmailData {
  lostUser: { name: string; email: string };
  foundUser: { name: string; email: string };
  lostItem: { itemName: string };
  foundItem: { itemName: string };
  matchId: string;
}

export const sendMatchConfirmedEmail = async (data: MatchConfirmedEmailData): Promise<void> => {
  const body = (isLostUser: boolean) => `
    <p style="margin:0 0 6px;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;">Match Confirmed</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#f1f5f9;line-height:1.3;">
      ✅ Ownership Verified for "${data.lostItem.itemName}"!
    </h1>
    <p style="margin:0 0 16px;font-size:14px;color:#94a3b8;line-height:1.6;">
      Both parties have confirmed this match. Private chat messaging is unlocked.
    </p>
    ${ctaButton(`${APP_URL()}/matches/${data.matchId}`, 'Open Match Chat')}
  `;

  await Promise.all([
    safeSendEmail(data.lostUser.email, `✅ Match Confirmed – "${data.lostItem.itemName}"`, emailWrapper(body(true))),
    safeSendEmail(data.foundUser.email, `✅ Match Confirmed – "${data.foundItem.itemName}"`, emailWrapper(body(false))),
  ]);
};

// 7. PASSWORD RESET EMAIL
export const sendPasswordResetEmail = async (email: string, name: string, resetUrl: string): Promise<void> => {
  const body = `
    <p style="margin:0 0 8px;color:#94a3b8;">Hi <strong style="color:#f1f5f9;">${name}</strong>,</p>
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f1f5f9;">Reset Your Password</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">
      Click the button below to set a new password. This link expires in 1 hour.
    </p>
    ${ctaButton(resetUrl, 'Reset Password')}
  `;
  await safeSendEmail(email, '🔑 Reset Your CampusConnect Password', emailWrapper(body));
};

// 8. CLAIM NOTIFICATION EMAIL
export const sendClaimEmail = async (
  recipientEmail: string,
  userName: string,
  itemName: string,
  action: 'requested' | 'approved' | 'rejected',
): Promise<void> => {
  const titles = {
    requested: `Claim Requested for "${itemName}"`,
    approved: `Claim Approved for "${itemName}" 🎉`,
    rejected: `Update on Claim for "${itemName}"`,
  };
  const body = `
    <p style="margin:0 0 8px;color:#94a3b8;">Hi ${userName},</p>
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f1f5f9;">${titles[action]}</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">
      Your claim status has been updated. Please log in to CampusConnect to view details.
    </p>
    ${ctaButton(`${APP_URL()}/matches`, 'View Claim Details')}
  `;
  await safeSendEmail(recipientEmail, `📢 ${titles[action]} | CampusConnect`, emailWrapper(body));
};

// 9. REWARD RECEIVED EMAIL
export const sendRewardReceivedEmail = async (
  recipientEmail: string,
  userName: string,
  amount: number,
  itemName: string,
): Promise<void> => {
  const body = `
    <p style="margin:0 0 8px;color:#94a3b8;">Congratulations ${userName}!</p>
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f1f5f9;">💰 Reward Payment Received</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">
      You received a reward of <strong>₹${amount}</strong> for returning "${itemName}". Thank you for keeping our campus honest!
    </p>
    ${ctaButton(`${APP_URL()}/rewards`, 'View Reward History')}
  `;
  await safeSendEmail(recipientEmail, `💰 Reward Received: ₹${amount} for "${itemName}"`, emailWrapper(body));
};

// 10. REPORT CLOSED EMAIL
export const sendReportClosedEmail = async (
  recipientEmail: string,
  userName: string,
  itemName: string,
): Promise<void> => {
  const body = `
    <p style="margin:0 0 8px;color:#94a3b8;">Hi ${userName},</p>
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#f1f5f9;">Report Closed</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">
      Your report for "${itemName}" has been marked as returned and closed.
    </p>
    ${ctaButton(`${APP_URL()}/dashboard`, 'Go to Dashboard')}
  `;
  await safeSendEmail(recipientEmail, `✅ Report Closed – "${itemName}"`, emailWrapper(body));
};
