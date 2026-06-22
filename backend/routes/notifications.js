const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const [notifications, unreadCount] = await Promise.all([
      notificationService.listForUser(req.user._id, { unreadOnly }),
      notificationService.unreadCount(req.user._id)
    ]);
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    const count = await notificationService.markAllRead(req.user._id);
    res.json({ markedRead: count });
  } catch (err) {
    res.status(500).json({ message: 'Error marking notifications as read' });
  }
});

router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const updated = await notificationService.markRead(req.params.id, req.user._id);
    if (!updated) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ notification: updated });
  } catch (err) {
    res.status(500).json({ message: 'Error updating notification' });
  }
});

module.exports = router;
