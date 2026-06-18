const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;
let initialized = false;

/**
 * Lazily build the SMTP transporter from config. Returns null when SMTP is not
 * configured so the caller can fall back to logging instead of crashing.
 */
function getTransporter() {
  if (initialized) return transporter;
  initialized = true;

  const { host, port, user, pass, secure } = config.email;
  if (!host || !user || !pass) {
    console.warn(
      '[email] SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing). Emails will be logged only.'
    );
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
  return transporter;
}

/**
 * Send an email. Falls back to a console stub when SMTP is not configured so
 * local/dev environments keep working without credentials.
 *
 * @param {Array} [attachments] nodemailer attachment objects, e.g.
 *   [{ filename: 'prescription.pdf', path: '/abs/path/to.pdf' }]
 */
async function sendMail({ to, subject, text, html, attachments }) {
  if (!to) {
    console.warn('[email] No recipient address; skipping send.');
    return { sent: false, reason: 'no-recipient' };
  }

  const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

  const tx = getTransporter();
  if (!tx) {
    const attachNote = hasAttachments
      ? ` [+${attachments.length} attachment(s): ${attachments.map((a) => a.filename).join(', ')}]`
      : '';
    console.info(`[email stub] To ${to}: ${subject} — ${text || ''}${attachNote}`);
    return { sent: false, reason: 'not-configured' };
  }

  try {
    const info = await tx.sendMail({
      from: config.email.from,
      to,
      subject,
      text,
      html: html || undefined,
      attachments: hasAttachments ? attachments : undefined
    });
    console.info(`[email] Sent to ${to}: "${subject}" (messageId: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[email] Failed to send to ${to}:`, err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendMail };
