const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-here';

// ---------- إعداد قاعدة البيانات ----------
const dbPath = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('خطأ في قاعدة البيانات:', err);
    else console.log('قاعدة البيانات متصلة');
});

// ---------- إنشاء الجداول ----------
const schema = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT '/images/default-avatar.png',
    bio TEXT DEFAULT '',
    role TEXT DEFAULT 'member',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    category TEXT DEFAULT 'general',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

db.exec(schema, (err) => {
    if (err) console.error('خطأ في إنشاء الجداول:', err);
    else console.log('الجداول جاهزة');
});

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// ---------- Multer للصور ----------
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// ---------- دوال المصادقة ----------
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'غير مصرح' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'توكن غير صالح' });
        req.user = user;
        next();
    });
};

// ---------- Routes ----------

// ---- Auth ----
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'اسم المستخدم أو البريد موجود مسبقاً' });
                }
                return res.status(500).json({ error: err.message });
            }
            const token = jwt.sign({ id: this.lastID, username }, SECRET_KEY);
            res.json({ token, user: { id: this.lastID, username, email } });
        }
    );
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: 'مستخدم غير موجود' });
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(400).json({ error: 'كلمة مرور خاطئة' });
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
        res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    db.get('SELECT id, username, email, avatar, bio, role, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'مستخدم غير موجود' });
        res.json(user);
    });
});

// ---- Posts ----
app.get('/api/posts', (req, res) => {
    db.all(`
        SELECT p.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
    `, (err, posts) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(posts);
    });
});

app.post('/api/posts', authenticateToken, upload.single('image'), (req, res) => {
    const { content } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    db.run(
        'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
        [req.user.id, content, imageUrl],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            db.get('SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?', [this.lastID], (err, post) => {
                res.status(201).json(post);
            });
        }
    );
});

app.post('/api/posts/:id/like', authenticateToken, (req, res) => {
    const postId = req.params.id;
    db.run(
        'INSERT OR IGNORE INTO likes (post_id, user_id) VALUES (?, ?)',
        [postId, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            db.get('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId], (err, result) => {
                res.json({ likes: result.count });
            });
        }
    );
});

app.post('/api/posts/:id/comment', authenticateToken, (req, res) => {
    const postId = req.params.id;
    const { content } = req.body;
    db.run(
        'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
        [postId, req.user.id, content],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            db.get('SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [this.lastID], (err, comment) => {
                res.status(201).json(comment);
            });
        }
    );
});

// ---- Users ----
app.get('/api/users', (req, res) => {
    db.all('SELECT id, username, avatar, bio, role FROM users', (err, users) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(users);
    });
});

app.get('/api/users/:id', (req, res) => {
    db.get('SELECT id, username, avatar, bio, role, created_at FROM users WHERE id = ?', [req.params.id], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'مستخدم غير موجود' });
        res.json(user);
    });
});

// ---- Messages ----
app.get('/api/messages', authenticateToken, (req, res) => {
    db.all(`
        SELECT m.*, u1.username as sender_name, u2.username as receiver_name
        FROM messages m
        JOIN users u1 ON m.sender_id = u1.id
        JOIN users u2 ON m.receiver_id = u2.id
        WHERE m.sender_id = ? OR m.receiver_id = ?
        ORDER BY m.created_at DESC
    `, [req.user.id, req.user.id], (err, messages) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(messages);
    });
});

app.post('/api/messages', authenticateToken, (req, res) => {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) return res.status(400).json({ error: 'المرسل والمحتوى مطلوبان' });
    db.run(
        'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
        [req.user.id, receiverId, content],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            db.get('SELECT m.*, u.username as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?', [this.lastID], (err, message) => {
                res.status(201).json(message);
            });
        }
    );
});

// ---------- تشغيل الخادم ----------
app.listen(PORT, () => {
    console.log(`خادم MALINES PENTAGON يعمل على http://localhost:${PORT}`);
});