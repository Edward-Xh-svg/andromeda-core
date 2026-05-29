const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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

// أطلس الأسلحة المحدث بدقة حسب قائمة الأصول الجديدة لعام 1926
let US_FEDERAL_ARSENAL = [
    { id: "wp01", name: "M1922 Thunder", type: "دبابة ثقيلة سريعة", specs: "مدفع 57 ملم، 30 كم/س", count: 800, location: "فورت هود، فورت لويس، المكسيك", cost: 28000 },
    { id: "wp02", name: "M1923 Thunderbolt", type: "دبابة خفيفة استطلاع", specs: "مدفع 37 ملم، 45 كم/س", count: 400, location: "كتائب أريزونا العسكرية", cost: 16500 },
    { id: "wp03", name: "Mark VIII Liberty", type: "دبابة ثقيلة قديمة", specs: "مخصصة للتدريب القتالي", count: 150, location: "مدرسة الدبابات (فورت نوكس)", cost: 8000 },
    { id: "wp04", name: "Ford 3-Ton M1918", type: "دبابة خفيفة احتياطي", specs: "مخزون الدعم التكتيكي", count: 200, location: "مستودعات الاحتياط العام", cost: 4500 },
    { id: "wp05", name: "M1922 Iron Eagle", type: "مقاتلة تفوق جوي", specs: "320 كم/س، 4 رشاشات Browning", count: 800, location: "قاعدة كلارك، ساكرامنتو، المكسيك", cost: 9500 },
    { id: "wp06", name: "M1923 Eagle Eye", type: "طائرة استطلاع استراتيجي", specs: "مزودة بكاميرات مسح جوي متطورة", count: 300, location: "أجنحة الاستكشاف الفيدرالي", cost: 11000 },
    { id: "wp07", name: "M1923 Storm", type: "قاذفة متوسطة التكتيكية", specs: "حمولة قنابل تصل إلى 800 كجم", count: 200, location: "القواعد الساحلية والجوية", cost: 18000 },
    { id: "wp08", name: "M1924 Harvest", type: "قاذفة استراتيجية بعيدة المدى", specs: "مدى عملياتي يصل إلى 2500 كم", count: 100, location: "قاعدة أوماها وساكرامنتو الجوية", cost: 24000 },
    { id: "wp09", name: "Colorado-class", type: "بارجة حربية مدرعة ثقيلة", specs: "8 مدافع عيار 406 ملم (متاح 1 + 3 قيد البناء)", count: 1, location: "ترسانة نورفولك البحرية", cost: 6500000 },
    { id: "wp10", name: "Wickes-class", type: "مدمرة بحرية حديثة سريعة", specs: "12 أنبوب طوربيد 533 ملم", count: 800, location: "الأسطول الأطلسي والهادئ", cost: 85000 },
    { id: "wp11", name: "M1922 Silent Death", type: "غواصة محيطية استراتيجية", specs: "مدى خارق للأعماق يصل إلى 12,000 كم", count: 60, location: "نورفولك، بيرل هاربر العميقة", cost: 520000 },
    { id: "wp12", name: "M1903 Springfield", type: "بندقية قنص قتالية معتمدة", specs: "عيار .30-06، مدى مؤثر 600 م", count: 950000, location: "جميع مستودعات المشاة والجيوش", cost: 45 },
    { id: "wp13", name: "Browning M1918 BAR", type: "رشاش خفيف تكتيكي", specs: "معدل نيران 500 طلقة/دقيقة", count: 12000, location: "قوات الاقتحام السريع الفيدرالية", cost: 120 }
];

app.get('/api/archive', (req, res) => res.json(systemArchivePosts));
app.post('/api/archive', (req, res) => {
    const { title, content, media } = req.body;
    if(!title || !content) return res.status(400).json({ success: false, error: "بيانات غير مكتملة" });
    const newPost = { id: "p_" + Date.now(), title, content, media, date: new Date().toISOString().split('T')[0] };
    systemArchivePosts.unshift(newPost);
    res.status(201).json({ success: true, post: newPost });
});

app.get('/api/diplomacy', (req, res) => res.json(diplomaticMessages));
app.post('/api/diplomacy', (req, res) => {
    const { sender, diplomat, text, media, presidential } = req.body;
    const newMsg = { id: "m_" + Date.now(), sender: sender || "دولة زائرة", diplomat: diplomat || "مجهول", text: text || "", media: media || [], presidential: presidential || false, time: new Date().toTimeString().split(' ')[0].substring(0, 5) };
    diplomaticMessages.push(newMsg);
    res.status(201).json({ success: true, message: newMsg });
});

app.get('/api/arsenal', (req, res) => res.json(US_FEDERAL_ARSENAL));
app.post('/api/arsenal/purchase', (req, res) => {
    const { id, qty, country } = req.body;
    const weapon = US_FEDERAL_ARSENAL.find(w => w.id === id);
    if (!weapon || weapon.count < qty || qty <= 0) return res.status(400).json({ success: false, error: "المخزون غير كافٍ للطلب الجاري." });
    
    weapon.count -= qty;
    diplomaticMessages.push({
        id: "m_sys_" + Date.now(),
        sender: "وزارة الحرب الفيدرالية",
        diplomat: "نظام التوريد الآلي",
        text: `🚨 صفقات 1926 السريعة: اشترت [${country}] عدد (${qty}) من [${weapon.name}] بقيمة إجمالية: $${(qty * weapon.cost).toLocaleString()}.`,
        media: [], presidential: false, time: new Date().toTimeString().split(' ')[0].substring(0, 5)
    });
    res.json({ success: true, weaponName: weapon.name, remaining: weapon.count, totalCost: qty * weapon.cost });
});

app.listen(PORT, () => console.log(`[SERVER UP]: المنصة تعمل وتدعم الشاشات الكاملة والهواتف على المنفذ: ${PORT}`));
