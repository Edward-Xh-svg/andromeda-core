// ============================================================
// routes/posts.js — Post CRUD routes
// ============================================================

const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { getDb }      = require('../db');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ── Multer config ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `post_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('نوع الملف غير مسموح به. الأنواع المسموح بها: JPEG, PNG, GIF, WebP'));
  },
});

// ── Helper: enrich posts with like/comment counts and liked status ──
function enrichPosts(posts, userId) {
  const db = getDb();

  return posts.map(post => {
    const likeCount = db.prepare('SELECT COUNT(*) as c FROM likes WHERE post_id = ?').get(post.id).c;
    const commentCount = db.prepare('SELECT COUNT(*) as c FROM comments WHERE post_id = ?').get(post.id).c;
    const likedByMe = userId
      ? !!db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?').get(userId, post.id)
      : false;

    return { ...post, like_count: likeCount, comment_count: commentCount, liked_by_me: likedByMe };
  });
}

// GET /api/posts — Feed (paginated)
router.get('/', optionalAuth, (req, res) => {
  const db   = getDb();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const posts = db.prepare(`
    SELECT p.*, u.username, u.full_name, u.rank, u.avatar_url
    FROM posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  const total = db.prepare('SELECT COUNT(*) as c FROM posts').get().c;

  res.json({
    posts: enrichPosts(posts, req.user?.id),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// GET /api/posts/user/:userId — Posts by user
router.get('/user/:userId', optionalAuth, (req, res) => {
  const db = getDb();
  const posts = db.prepare(`
    SELECT p.*, u.username, u.full_name, u.rank, u.avatar_url
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
    LIMIT 50
  `).all(req.params.userId);

  res.json({ posts: enrichPosts(posts, req.user?.id) });
});

// GET /api/posts/:id — Single post
router.get('/:id', optionalAuth, (req, res) => {
  const db   = getDb();
  const post = db.prepare(`
    SELECT p.*, u.username, u.full_name, u.rank, u.avatar_url
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!post) return res.status(404).json({ message: 'المنشور غير موجود.' });

  res.json({ post: enrichPosts([post], req.user?.id)[0] });
});

// POST /api/posts — Create post
router.post('/', authenticate, upload.single('image'), (req, res) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'محتوى المنشور مطلوب.' });
  }

  if (content.trim().length > 1000) {
    return res.status(400).json({ message: 'المنشور يجب أن يكون أقل من 1000 حرف.' });
  }

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)
  `).run(req.user.id, content.trim(), imageUrl);

  const post = db.prepare(`
    SELECT p.*, u.username, u.full_name, u.rank, u.avatar_url
    FROM posts p JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ post: enrichPosts([post], req.user.id)[0] });
});

// POST /api/posts/:id/like — Toggle like
router.post('/:id/like', authenticate, (req, res) => {
  const db     = getDb();
  const postId = req.params.id;

  const existing = db.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?')
    .get(req.user.id, postId);

  let liked;
  if (existing) {
    db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(req.user.id, postId);
    liked = false;
  } else {
    db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').run(req.user.id, postId);
    liked = true;
  }

  const like_count = db.prepare('SELECT COUNT(*) as c FROM likes WHERE post_id = ?').get(postId).c;
  res.json({ liked, like_count });
});

// DELETE /api/posts/:id — Delete post
router.delete('/:id', authenticate, (req, res) => {
  const db   = getDb();
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);

  if (!post) return res.status(404).json({ message: 'المنشور غير موجود.' });

  if (post.user_id !== req.user.id) {
    return res.status(403).json({ message: 'لا تملك صلاحية حذف هذا المنشور.' });
  }

  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ message: 'تم حذف المنشور.' });
});

// GET /api/posts/:id/comments — Get comments for a post
router.get('/:id/comments', (req, res) => {
  const db = getDb();
  const comments = db.prepare(`
    SELECT c.*, u.username, u.full_name, u.avatar_url
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.id);

  res.json({ comments });
});

// POST /api/posts/:id/comments — Add comment
router.post('/:id/comments', authenticate, (req, res) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'محتوى التعليق مطلوب.' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)
  `).run(req.user.id, req.params.id, content.trim());

  const comment = db.prepare(`
    SELECT c.*, u.username, u.full_name, u.avatar_url
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ comment });
});

module.exports = router;