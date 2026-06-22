const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');

/**
 * Wrap a plain-text notification message in a minimal branded HTML email.
 * Optionally renders a call-to-action button and an attachment note.
 */
function buildEmailHtml(title, message, { actionUrl, actionLabel, hasAttachment } = {}) {
  const ctaButton = actionUrl
    ? `<p style="margin: 24px 0;">
         <a href="${actionUrl}" style="background: #0f766e; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-size: 14px; display: inline-block;">
           ${actionLabel || 'View in MediDiagnose'}
         </a>
       </p>`
    : '';

  const attachmentNote = hasAttachment
    ? `<p style="font-size: 13px; color: #0f766e; margin-top: 16px;">
         📎 Your prescription PDF is attached to this email.
       </p>`
    : '';

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; color: #1f2937;">
    <div style="background: #0f766e; color: #ffffff; padding: 16px 24px; border-radius: 8px 8px 0 0;">
      <h2 style="margin: 0; font-size: 18px;">MediDiagnose</h2>
    </div>
    <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
      <h3 style="margin-top: 0; color: #0f172a;">${title}</h3>
      <p style="font-size: 14px; line-height: 1.6;">${message}</p>
      ${attachmentNote}
      ${ctaButton}
      <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
        This is an automated message from MediDiagnose. Please do not reply to this email.
      </p>
    </div>
  </div>`;
}

/**
 * Multi-channel notifications (paper: in-app + email/SMS hooks).
 * Email is sent via SMTP when configured, otherwise logged. SMS is a stub.
 *
 * @param {Array} [attachments] email attachments (e.g. prescription PDF)
 * @param {string} [actionUrl] optional CTA link rendered in the email
 * @param {string} [actionLabel] label for the CTA link
 */
async function notifyUser({
  userId,
  sessionId,
  title,
  message,
  channels = ['in_app'],
  attachments = [],
  actionUrl,
  actionLabel
}) {
  const created = [];

  for (const channel of channels) {
    const doc = await Notification.create({
      userId,
      sessionId: sessionId || null,
      channel,
      title,
      message,
      metadata: { deliveredAt: new Date().toISOString() }
    });
    created.push(doc);

    if (channel === 'email') {
      try {
        const user = await User.findById(userId).lean();
        if (user?.email) {
          const hasAttachment = Array.isArray(attachments) && attachments.length > 0;
          await emailService.sendMail({
            to: user.email,
            subject: title,
            text: message,
            html: buildEmailHtml(title, message, { actionUrl, actionLabel, hasAttachment }),
            attachments
          });
        } else {
          console.warn(`[email] User ${userId} has no email on file; skipping email.`);
        }
      } catch (err) {
        console.error(`[email] Error sending notification email to user ${userId}:`, err.message);
      }
    }
    if (channel === 'sms') {
      console.info(`[sms stub] To user ${userId}: ${title}`);
    }
  }

  return created;
}

/**
 * Notify every registered doctor (in-app + email by default).
 * Used when a session enters the doctor review queue after AI processing.
 */
async function notifyDoctors({
  sessionId,
  title,
  message,
  channels = ['in_app', 'email'],
  actionUrl,
  actionLabel
}) {
  const doctors = await User.find({ role: 'doctor' }).lean();
  if (!doctors.length) {
    console.warn('[notify] No doctors found to notify.');
    return [];
  }

  const allCreated = [];
  for (const doctor of doctors) {
    const created = await notifyUser({
      userId: doctor._id,
      sessionId,
      title,
      message,
      channels,
      actionUrl,
      actionLabel
    });
    allCreated.push(...created);
  }
  return allCreated;
}

async function listForUser(userId, { unreadOnly = false, limit = 50 } = {}) {
  const query = { userId, channel: 'in_app' };
  if (unreadOnly) query.read = false;
  return Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean();
}

async function unreadCount(userId) {
  return Notification.countDocuments({ userId, channel: 'in_app', read: false });
}

async function markRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId, channel: 'in_app' },
    { read: true },
    { new: true }
  );
}

async function markAllRead(userId) {
  const result = await Notification.updateMany(
    { userId, channel: 'in_app', read: false },
    { read: true }
  );
  return result.modifiedCount;
}

module.exports = {
  notifyUser,
  notifyDoctors,
  listForUser,
  unreadCount,
  markRead,
  markAllRead
};
