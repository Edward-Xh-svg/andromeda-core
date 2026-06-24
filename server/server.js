// ============================================================
// server.js — Malines Pentagon Backend
// Node.js + Express + SQLite + JWT + bcrypt + Multer
// ============================================================

const express  = require('express');
const path     = require('path');
const cors     = require('cors');
const fs       = require('fs');

const app = express();

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static files (frontend) ──
app.use(express.static(path.join(__dirname, '..')));

// ── Uploads folder ──
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// ── Routes ──
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/posts',    require('./routes/posts'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/comments', require('./routes/comments'));

// ── SPA fallback: serve index.html for all non-API routes ──
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'المسار غير موجود' });
  }
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MALINES PENTAGON server running on http://localhost:${PORT}`);
});

module.exports = app;