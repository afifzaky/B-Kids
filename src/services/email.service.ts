import nodemailer from 'nodemailer';
import { env } from '../config/env';

// =============================================
// Transport — dev: Ethereal preview, prod: SMTP
// =============================================

let _transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (_transporter) return _transporter;

  if (env.NODE_ENV !== 'production' && !env.SMTP_HOST) {
    // Dev/test: auto-create Ethereal test account, log preview URL
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    return _transporter;
  }

  _transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return _transporter;
}

// =============================================
// HTML escape — cegah XSS jika data user dirender di email
// =============================================

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// =============================================
// Template: Password Reset
// =============================================

function buildResetPasswordEmail(recipientName: string, resetUrl: string): string {
  const safeName = escapeHtml(recipientName);
  const safeUrl  = escapeHtml(resetUrl);

  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <tr><td style="background:#1e3a5f;padding:24px 32px">
          <h1 style="color:#ffffff;margin:0;font-size:22px">🔐 Byond Kids</h1>
        </td></tr>
        <tr><td style="padding:32px">
          <h2 style="color:#1e3a5f;margin:0 0 16px">Reset Password</h2>
          <p style="color:#444;line-height:1.6">Halo <strong>${safeName}</strong>,</p>
          <p style="color:#444;line-height:1.6">
            Kami menerima permintaan untuk mereset password akun Byond Kids kamu.
            Klik tombol di bawah untuk membuat password baru.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${safeUrl}"
               style="background:#1e3a5f;color:#ffffff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block">
              Reset Password
            </a>
          </div>
          <p style="color:#777;font-size:13px;line-height:1.6">
            Link ini berlaku selama <strong>15 menit</strong> dan hanya bisa digunakan sekali.<br>
            Jika kamu tidak meminta reset password, abaikan email ini — akun kamu tetap aman.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
          <p style="color:#aaa;font-size:11px">
            Jika tombol tidak berfungsi, salin URL ini ke browser:<br>
            <span style="color:#1e3a5f;word-break:break-all">${safeUrl}</span>
          </p>
        </td></tr>
        <tr><td style="background:#f4f6f8;padding:16px 32px;text-align:center">
          <p style="color:#aaa;font-size:11px;margin:0">
            © ${new Date().getFullYear()} Byond Kids · Email ini dikirim otomatis, jangan dibalas.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// =============================================
// Template: Username Reminder (daftar anak)
// =============================================

function buildUsernameReminderEmail(
  parentName: string,
  children: { fullName: string; username: string }[],
): string {
  const safeName = escapeHtml(parentName);
  const rows = children
    .map(
      c => `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;color:#333">${escapeHtml(c.fullName)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-family:monospace;color:#1e3a5f;font-weight:bold">${escapeHtml(c.username)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <tr><td style="background:#1e3a5f;padding:24px 32px">
          <h1 style="color:#ffffff;margin:0;font-size:22px">👦 Byond Kids</h1>
        </td></tr>
        <tr><td style="padding:32px">
          <h2 style="color:#1e3a5f;margin:0 0 16px">Username Anak Kamu</h2>
          <p style="color:#444;line-height:1.6">Halo <strong>${safeName}</strong>,</p>
          <p style="color:#444;line-height:1.6">
            Berikut daftar username anak yang terdaftar di akun Byond Kids kamu:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:6px;overflow:hidden;margin:16px 0">
            <thead>
              <tr style="background:#f4f6f8">
                <th style="padding:10px 16px;text-align:left;color:#777;font-size:12px;text-transform:uppercase">Nama Anak</th>
                <th style="padding:10px 16px;text-align:left;color:#777;font-size:12px;text-transform:uppercase">Username</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="color:#777;font-size:13px;line-height:1.6">
            Gunakan username ini untuk login sebagai anak di aplikasi Byond Kids.<br>
            Jika kamu tidak meminta informasi ini, segera hubungi tim support kami.
          </p>
        </td></tr>
        <tr><td style="background:#f4f6f8;padding:16px 32px;text-align:center">
          <p style="color:#aaa;font-size:11px;margin:0">
            © ${new Date().getFullYear()} Byond Kids · Email ini dikirim otomatis, jangan dibalas.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// =============================================
// Public send functions
// =============================================

export async function sendPasswordResetEmail(
  to: string,
  recipientName: string,
  resetUrl: string,
): Promise<void> {
  const transporter = await getTransporter();
  const html = buildResetPasswordEmail(recipientName, resetUrl);

  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: 'Reset Password Byond Kids',
    html,
  });

  if (env.NODE_ENV !== 'production') {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      // intentionally log preview URL in non-prod — safe to print
      console.info('[Email] Preview URL:', previewUrl);
    }
  }
}

export async function sendUsernameReminderEmail(
  to: string,
  parentName: string,
  children: { fullName: string; username: string }[],
): Promise<void> {
  const transporter = await getTransporter();
  const html = buildUsernameReminderEmail(parentName, children);

  const info = await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject: 'Username Anak — Byond Kids',
    html,
  });

  if (env.NODE_ENV !== 'production') {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.info('[Email] Preview URL:', previewUrl);
    }
  }
}
