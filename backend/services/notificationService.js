const Notification = require('../models/Notification');

/**
 * Multi-channel notifications (paper: in-app + email/SMS hooks).
 * Email/SMS are logged stubs until SMTP/Twilio are configured.
 */
async function notifyUser({ userId, sessionId, title, message, channels = ['in_app'] }) {
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
      console.info(`[email stub] To user ${userId}: ${title} — ${message}`);
    }
    if (channel === 'sms') {
      console.info(`[sms stub] To user ${userId}: ${title}`);
    }
  }

  return created;
}

async function listForUser(userId, { unreadOnly = false, limit = 50 } = {}) {
  const query = { userId };
  if (unreadOnly) query.read = false;
  return Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean();
}

async function markRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );
}

module.exports = {
  notifyUser,
  listForUser,
  markRead
};
