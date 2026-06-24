# MALINES PENTAGON
## Official Department of Defense Social Platform

---

## التثبيت المحلي

### المتطلبات
- Node.js 18+
- npm 9+

### خطوات التشغيل

```bash
# 1. تثبيت المكتبات
npm install

# 2. تهيئة قاعدة البيانات (تلقائية عند أول تشغيل)
npm run setup

# 3. تشغيل الخادم
npm start

# أو في وضع التطوير (يعيد التشغيل تلقائياً)
npm run dev
```

الموقع سيعمل على: http://localhost:3000

---

## النشر على Vercel

```bash
# 1. تثبيت Vercel CLI
npm i -g vercel

# 2. تسجيل الدخول
vercel login

# 3. إضافة المتغير السري
vercel env add MP_JWT_SECRET

# 4. النشر
vercel --prod
```

**ملاحظة:** Vercel لا يدعم قواعد بيانات SQLite في البيئة الإنتاجية.
للنشر الكامل، استخدم أحد الخيارات التالية:
- **Railway.app** — يدعم Node.js + SQLite بشكل كامل (موصى به)
- **Render.com** — خطة مجانية مع دعم Node.js
- **قاعدة بيانات بديلة:** استبدل better-sqlite3 بـ PostgreSQL (نeon.tech) أو MySQL (planetscale.com)

---

## هيكل الملفات

```
malines-pentagon/
├── index.html          — الصفحة الرئيسية (Feed)
├── login.html          — تسجيل الدخول
├── register.html       — إنشاء حساب
├── profile.html        — الملف الشخصي
├── messages.html       — الرسائل الخاصة
├── post.html           — عرض منشور فردي
├── css/
│   └── style.css       — التصميم الكامل
├── js/
│   ├── api.js          — عميل API المركزي
│   ├── auth.js         — إدارة المصادقة
│   ├── posts.js        — منطق المنشورات
│   ├── messages.js     — منطق الرسائل
│   └── app.js          — تهيئة التطبيق
├── server/
│   ├── server.js       — الخادم الرئيسي
│   ├── db.js           — قاعدة البيانات SQLite
│   ├── middleware/
│   │   └── auth.js     — JWT middleware
│   └── routes/
│       ├── auth.js     — مسارات المصادقة
│       ├── posts.js    — مسارات المنشورات
│       ├── messages.js — مسارات الرسائل
│       ├── users.js    — مسارات المستخدمين
│       └── comments.js — مسارات التعليقات
├── uploads/            — الصور المرفوعة
├── vercel.json         — إعدادات النشر
├── package.json
└── .gitignore
```

---

## نقاط API

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| POST | /api/auth/register | تسجيل مستخدم جديد |
| POST | /api/auth/login | تسجيل الدخول |
| GET | /api/auth/me | بيانات المستخدم الحالي |
| GET | /api/posts | جلب كل المنشورات |
| POST | /api/posts | إنشاء منشور |
| GET | /api/posts/:id | جلب منشور واحد |
| POST | /api/posts/:id/like | إعجاب/إلغاء إعجاب |
| DELETE | /api/posts/:id | حذف منشور |
| GET | /api/posts/:id/comments | تعليقات المنشور |
| POST | /api/posts/:id/comments | إضافة تعليق |
| GET | /api/messages/conversations | المحادثات |
| GET | /api/messages/thread/:userId | خيط محادثة |
| POST | /api/messages | إرسال رسالة |
| GET | /api/users/stats | إحصائيات المنصة |
| GET | /api/users/:id | ملف مستخدم |
| PUT | /api/users/me | تعديل ملفي الشخصي |
| GET | /api/users/search?q= | البحث عن مستخدمين |

---

## الأمان
- كلمات المرور مشفرة بـ bcrypt (salt rounds: 12)
- التوثيق بـ JWT (صالح لمدة 7 أيام)
- رفع الصور مقيد بـ 5MB وبأنواع صور محددة
- مدخلات API محمية من SQL Injection عبر prepared statements
