// ============================================================
// routes/auth.js — Authentication routes
// ============================================================

const express  = require('express');
const bcrypt   = require('bcryptjs');
const { getDb }      = require('../db');
const { authenticate, signToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password, full_name, rank } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'اسم المستخدم والبريد الإلكتروني وكلمة المرور مطلوبة.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' });
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ message: 'اسم المستخدم يجب أن يحتوي على حروف وأرقام وشرطات سفلية فقط.' });
  }

  try {
    const db   = getDb();
    const hash = await bcrypt.hash(password, 12);

    const stmt = db.prepare(`
      INSERT INTO users (username, email, password, full_name, rank)
      VALUES (?, ?, ?, ?, ?)
    `);

    let result;
    try {
      result = stmt.run(username.toLowerCase(), email.toLowerCase(), hash, full_name || '', rank || '');
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        if (err.message.includes('username')) {
          return res.status(409).json({ message: 'اسم المستخدم مستخدم بالفعل.' });
        }
        return res.status(409).json({ message: 'البريد الإلكتروني مستخدم بالفعل.' });
      }
      throw err;
    }

    const user  = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = signToken({ id: user.id, username: user.username });

    res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ في الخادم.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'اسم المستخدم وكلمة المرور مطلوبان.' });
  }

  try {
    const db   = getDb();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase());

    if (!user) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
    }

    const token = signToken({ id: user.id, username: user.username });

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ في الخادم.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const db   = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!user) return res.status(404).json({ message: 'المستخدم غير موجود.' });
  res.json({ user: sanitizeUser(user) });
});

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

module.exports = router;