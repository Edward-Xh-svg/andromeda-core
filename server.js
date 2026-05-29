const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// إعدادات البيئة وتمرير السعات الضخمة للوسائط المرفوعة (Base64)
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// توجيه الخادم لقراءة واجهة المستخدم الأمامية من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// ================= قاعدة البيانات المركزية الحية للسيرفر (ذاكرة حية) =================

let systemArchivePosts = [
    {
        id: "p_init",
        title: "إغلاق موازنة حظر التسلح البحري لعام 1926",
        content: "أصدر رئيس الولايات المتحدة مرسوماً فيدرالياً لتنظيم حجم الإنفاق على القطع الحربية المدرعة بما يتوافق مع ملاحق معاهدة واشنطن، وتوجيه الفوائض المالية لصالح دعم بورصات الطاقة الداخلية.",
        media: [],
        date: "1926-05-15"
    }
];

let diplomaticMessages = [
    { 
        id: "m_init",
        sender: "المملكة المصرية", 
        diplomat: "أحمد زيور باشا", 
        text: "نتطلع لتعزيز تبادل المنتجات القطنية مع الشركات الأمريكية لعام 1926 ونقل برقياتنا السياسية للرئيس.", 
        media: [], 
        presidential: false, 
        time: "10:30" 
    }
];

// أطلس الأسلحة الشامل والمخزون الفيدرالي لعام 1926
let US_FEDERAL_ARSENAL = [
    { id: "wp01", name: "M1922 Thunder", type: "دبابة ثقيلة", speed: "30 كم/س", crew: "5 أفراد", armor: "25 ملم", count: 800, location: "فورت هود (تكساس)", cost: 28000 },
    { id: "wp02", name: "M1923 Thunderbolt", type: "دبابة خفيفة استطلاع", speed: "45 كم/س", crew: "3 أفراد", armor: "15 ملم", count: 400, location: "كتائب أريزونا", cost: 16500 },
    { id: "wp03", name: "M1922 Iron Eagle", type: "مقاتلة تفوق جوي", speed: "320 كم/س", range: "1,000 كم", weapons: "4 رشاشات Browning", count: 800, location: "القيادة الغربية، الفلبين", cost: 9500 },
    { id: "wp04", name: "M1924 Harvest", type: "قاذفة استراتيجية", speed: "200 كم/س", range: "2,500 كم", payload: "2,000 كجم", count: 100, location: "قاعدة أوماها الجوية", cost: 24000 },
    { id: "wp05", name: "Colorado-class", type: "بارجة حربية مدرعة ثقيلة", speed: "21 عقدة", guns: "8 مدافع عيار 406 ملم", displacement: "33,000 طن", count: 1, location: "ترسانة نورفولك العسكرية", cost: 6500000 },
    { id: "wp06", name: "Wickes-class", type: "مدمرة بحرية سريعة", speed: "35 عقدة", torpedoes: "12 أنبوب 533 ملم", crew: "150 بحار", count: 800, location: "الأسطول الأطلسي والهادئ", cost: 85000 },
    { id: "wp07", name: "M1922 Silent Death", type: "غواصة محيطية استراتيجية", range: "12,000 كم", tubes: "8 أنابيب", speed: "18 عقدة", count: 60, location: "القواعد المحيطية العميقة", cost: 520000 },
    { id: "wp08", name: "M1903 Springfield", type: "بندقية قنص قتالية", caliber: ".30-06", effectiveRange: "600 م", count: 950000, location: "جميع مستودعات المشاة", cost: 45 },
    { id: "wp09", name: "Browning M1918 BAR", type: "رشاش خفيف تكتيكي", caliber: "7.62 ملم", rateOfFire: "500 طلقة/د", count: 12000, location: "فرق الاقتحام السريع", cost: 120 }
];

// ================= بروتوكولات الـ API لتداول البيانات =================

// 1. قطاع الأخبار والأرشيف الوطني
app.get('/api/archive', (req, res) => res.json(systemArchivePosts));
app.post('/api/archive', (req, res) => {
    const { title, content, media } = req.body;
    if(!title || !content) return res.status(400).json({ success: false, error: "بيانات غير مكتملة" });
    
    const newPost = {
        id: "p_" + Date.now(),
        title,
        content,
        media, // مصفوفة تحتوي على الملفات المرفوعة كـ Base64
        date: new Date().toISOString().split('T')[0]
    };
    systemArchivePosts.unshift(newPost);
    res.status(201).json({ success: true, post: newPost });
});

// 2. قطاع الشبكة الدبلوماسية والقنصليات
app.get('/api/diplomacy', (req, res) => res.json(diplomaticMessages));
app.post('/api/diplomacy', (req, res) => {
    const { sender, diplomat, text, media, presidential } = req.body;
    
    const newMsg = {
        id: "m_" + Date.now(),
        sender: sender || "دولة غير مسجلة",
        diplomat: diplomat || "مجهول",
        text: text || "",
        media: media || [],
        presidential: presidential || false,
        time: new Date().toTimeString().split(' ')[0].substring(0, 5)
    };
    diplomaticMessages.push(newMsg);
    res.status(201).json({ success: true, message: newMsg });
});

// 3. قطاع البنتاغون وسوق التسليح
app.get('/api/arsenal', (req, res) => res.json(US_FEDERAL_ARSENAL));
app.post('/api/arsenal/purchase', (req, res) => {
    const { id, qty, country } = req.body;
    const weapon = US_FEDERAL_ARSENAL.find(w => w.id === id);
    
    if (!weapon) return res.status(444).json({ success: false, error: "السلاح غير موجود بالسجلات الفيدرالية." });
    if (weapon.count < qty || qty <= 0) {
        return res.status(400).json({ success: false, error: "الكمية المطلوبة غير متوفرة بمستودعات وزارة الحرب." });
    }
    
    // الخصم المركزي المباشر من السيرفر
    weapon.count -= qty;
    
    // تلقائياً، يقوم السيرفر بتوليد برقية دبلوماسية تخطر الرئيس بالصفقة
    const marketNotification = {
        id: "m_sys_" + Date.now(),
        sender: "وزارة الحرب الفيدرالية",
        diplomat: "إشعار نظام تلقائي",
        text: `🚨 إشعار صفقة دولية: قامت دولة [${country}] بشراء عدد (${qty}) من طراز [${weapon.name}]. إجمالي قيمة الصفقة: $${(qty * weapon.cost).toLocaleString()}.`,
        media: [],
        presidential: false,
        time: new Date().toTimeString().split(' ')[0].substring(0, 5)
    };
    diplomaticMessages.push(marketNotification);

    res.json({ success: true, weaponName: weapon.name, remaining: weapon.count, totalCost: qty * weapon.cost });
});

// بدء تشغيل الخادم
app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`[FEDERAL SERVER DETECTED]: المنصة المركزية تعمل بنجاح على المنفذ: ${PORT}`);
    console.log(`================================================================`);
});
