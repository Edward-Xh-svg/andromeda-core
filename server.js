const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 🗃️ قائمة الحسابات الرسمية للعبة (يمكنك إضافة المزيد هنا مستقبلاً)
const GAME_ACCOUNTS = [
    { email: "president@us.gov", password: "202020", country: "الولايات المتحدة الأمريكية", role: "president", diplomatName: "فخامة الرئيس" },
    { email: "eric@malines.nc", password: "C-01331082263KN", country: "دولة مالينس (Malines)", role: "diplomat", diplomatName: "Erik Machiavelli" },
    { email: "stalin@ussr.gov", password: "123", country: "الاتحاد السوفيتي", role: "diplomat", diplomatName: "جوزيف ستالين" },
    { email: "china@gov.cn", password: "123", country: "الإمبراطورية الصينية", role: "diplomat", diplomatName: "المندوب الصيني" }
];

let systemArchivePosts = [
    { id: "p_init", title: "إغلاق موازنة حظر التسلح البحري لعام 1926", content: "أصدر رئيس الولايات المتحدة مرسوماً فيدرالياً لتنظيم حجم الإنفاق.", media: [], date: "1926-05-15" }
];

let diplomaticMessages = [];

let US_FEDERAL_ARSENAL = [
    { id: "wp01", name: "M1922 Thunder", type: "دبابة ثقيلة سريعة", specs: "مدفع 57 ملم، 30 كم/س", count: 800, location: "فورت هود", cost: 28000 },
    { id: "wp05", name: "M1922 Iron Eagle", type: "مقاتلة تفوق جوي", specs: "320 كم/س، 4 رشاشات Browning", count: 800, location: "قاعدة كلارك", cost: 9500 },
    { id: "wp11", name: "M1922 Silent Death", type: "غواصة استراتيجية", specs: "مدى 12,000 كم", count: 60, location: "نورفولك", cost: 520000 }
];

// 🔑 نقطة تسجيل الدخول الجديدة
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const user = GAME_ACCOUNTS.find(u => u.email === email && u.password === password);
    if (user) {
        res.json({ success: true, user });
    } else {
        res.status(401).json({ success: false, error: "البريد الإلكتروني أو كلمة السر غير صحيحة" });
    }
});

app.get('/api/archive', (req, res) => res.json(systemArchivePosts));
app.post('/api/archive', (req, res) => {
    const { title, content, media } = req.body;
    const newPost = { id: "p_" + Date.now(), title, content, media, date: new Date().toISOString().split('T')[0] };
    systemArchivePosts.unshift(newPost);
    res.status(201).json({ success: true, post: newPost });
});

app.get('/api/diplomacy', (req, res) => res.json(diplomaticMessages));
app.post('/api/diplomacy', (req, res) => {
    const { sender, diplomat, text, media, presidential } = req.body;
    const newMsg = { id: "m_" + Date.now(), sender, diplomat, text, media, presidential, time: new Date().toTimeString().split(' ')[0].substring(0, 5) };
    diplomaticMessages.push(newMsg);
    res.status(201).json({ success: true, message: newMsg });
});

app.get('/api/arsenal', (req, res) => res.json(US_FEDERAL_ARSENAL));
app.post('/api/arsenal/purchase', (req, res) => {
    const { id, qty, country, diplomat } = req.body;
    const weapon = US_FEDERAL_ARSENAL.find(w => w.id === id);
    if (!weapon || weapon.count < qty || qty <= 0) return res.status(400).json({ success: false, error: "المخزون غير كافٍ." });
    
    weapon.count -= qty;
    diplomaticMessages.push({
        id: "m_sys_" + Date.now(),
        sender: "نظام التوريد الفيدرالي",
        diplomat: "آلي",
        text: `🚨 اشترت [${country}] بقيادة [${diplomat}] عدد (${qty}) من [${weapon.name}] بقيمة إجمالية: $${(qty * weapon.cost).toLocaleString()}.`,
        media: [], presidential: false, time: new Date().toTimeString().split(' ')[0].substring(0, 5)
    });
    res.json({ success: true, weaponName: weapon.name, remaining: weapon.count, totalCost: qty * weapon.cost });
});

app.listen(PORT, () => console.log(`[SERVER UP]: السيرفر يعمل على المنفذ: ${PORT}`));
