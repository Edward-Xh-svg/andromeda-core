// ============================================================
// middleware/auth.js — JWT authentication middleware
// ============================================================

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'mp_secure_jwt_secret_2025';

function authenticate(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'غير مخوّل. يرجى تسجيل الدخول.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'الجلسة منتهية. يرجى إعادة تسجيل الدخول.' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {}
  }
  next();
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authenticate, optionalAuth, signToken };