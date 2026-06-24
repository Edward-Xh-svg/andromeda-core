// ============================================================
// routes/comments.js — Comment management
// ============================================================

const express = require('express');
const { getDb } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// DELETE /api/comments/:id — Delete a comment
router.delete('/:id', authenticate, (req, res) => {
  const db      = getDb();
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);

  if (!comment) return res.status(404).json({ message: 'التعليق غير موجود.' });

  if (comment.user_id !== req.user.id) {
    return res.status(403).json({ message: 'لا تملك صلاحية حذف هذا التعليق.' });
  }

  db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  res.json({ message: 'تم حذف التعليق.' });
});

module.exports = router;