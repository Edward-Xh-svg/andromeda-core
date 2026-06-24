// ============================================================
// routes/users.js — User profile routes
// ============================================================

const express = require('express');
const { getDb } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

// GET /api/users/stats — Platform-wide statistics
router.get('/stats', (req, res) => {
  const db = getDb();

  const users    = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const posts    = db.prepare('SELECT COUNT(*) as c FROM posts').get().c;
  const comments = db.prepare('SELECT COUNT(*) as c FROM comments').get().c;

  res.json({ stats: { users, posts, comments } });
});

// GET /api/users/search?q= — Search users
router.get('/search', authenticate, (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const db = getDb();

  const users = db.prepare(`
    SELECT id, username, full_name, rank, avatar_url
    FROM users
    WHERE username LIKE ? OR full_name LIKE ?
    LIMIT 10
  `).all(q, q);

  res.json({ users });
});

// GET /api/users/me — Own profile
router.get('/me', authenticate, (req, res) => {
  const db   = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ message: 'المستخدم غير موجود.' });

  const postCount = db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').get(user.id).c;

  res.json({ user: { ...sanitizeUser(user), post_count: postCount } });
});

// GET /api/users/:id — Public profile
router.get('/:id', (req, res) => {
  const db   = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ message: 'المستخدم غير موجود.' });

  const postCount = db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').get(user.id).c;

  res.json({ user: { ...sanitizeUser(user), post_count: postCount } });
});

// PUT /api/users/me — Update own profile
router.put('/me', authenticate, (req, res) => {
  const { full_name, bio } = req.body;
  const db = getDb();

  db.prepare(`
    UPDATE users SET full_name = ?, bio = ? WHERE id = ?
  `).run(full_name || '', bio || '', req.user.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: sanitizeUser(user) });
});

module.exports = router;