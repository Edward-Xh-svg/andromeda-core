// ============================================================
// routes/messages.js — Private messaging routes
// ============================================================

const express = require('express');
const { getDb } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/conversations — List all conversations
router.get('/conversations', authenticate, (req, res) => {
  const db  = getDb();
  const uid = req.user.id;

  const conversations = db.prepare(`
    SELECT
      other.id        AS user_id,
      other.username  AS username,
      other.full_name AS full_name,
      other.rank      AS rank,
      m.content       AS last_message,
      m.created_at    AS last_time
    FROM (
      SELECT
        CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END AS other_id,
        MAX(id) AS latest_id
      FROM messages
      WHERE sender_id = ? OR recipient_id = ?
      GROUP BY other_id
    ) AS threads
    JOIN messages m ON m.id = threads.latest_id
    JOIN users other ON other.id = threads.other_id
    ORDER BY m.created_at DESC
  `).all(uid, uid, uid);

  res.json({ conversations });
});

// GET /api/messages/thread/:userId — Get thread with a specific user
router.get('/thread/:userId', authenticate, (req, res) => {
  const db  = getDb();
  const uid = req.user.id;
  const other = parseInt(req.params.userId);

  const messages = db.prepare(`
    SELECT m.*, u.username AS sender_username, u.full_name AS sender_name
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE (m.sender_id = ? AND m.recipient_id = ?)
       OR (m.sender_id = ? AND m.recipient_id = ?)
    ORDER BY m.created_at ASC
    LIMIT 100
  `).all(uid, other, other, uid);

  // Mark messages from other user as read
  db.prepare(`
    UPDATE messages SET read_at = CURRENT_TIMESTAMP
    WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL
  `).run(other, uid);

  res.json({ messages });
});

// POST /api/messages — Send a message
router.post('/', authenticate, (req, res) => {
  const { recipient_id, content } = req.body;

  if (!recipient_id || !content || !content.trim()) {
    return res.status(400).json({ message: 'المستلم ومحتوى الرسالة مطلوبان.' });
  }

  if (parseInt(recipient_id) === req.user.id) {
    return res.status(400).json({ message: 'لا يمكنك إرسال رسائل لنفسك.' });
  }

  const db = getDb();

  const recipient = db.prepare('SELECT id FROM users WHERE id = ?').get(recipient_id);
  if (!recipient) {
    return res.status(404).json({ message: 'المستلم غير موجود.' });
  }

  const result = db.prepare(`
    INSERT INTO messages (sender_id, recipient_id, content) VALUES (?, ?, ?)
  `).run(req.user.id, recipient_id, content.trim());

  const message = db.prepare(`
    SELECT m.*, u.username AS sender_username
    FROM messages m JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ message });
});

module.exports = router;