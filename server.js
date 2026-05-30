const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ============ قاعدة البيانات المؤقتة ============
const nationsDB = {
    'usa': {
        code: '1010101',
        name: 'الولايات المتحدة الأمريكية',
        role: 'president',
        representative: 'فرانكلين روزفلت',
        budget: 5000000,
        military: { infantry: 150000, tanks: 200, aircraft: 350, submarines: 50 },
        territories: 12,
        treasury: 1200000,
        resources: { oil: 800, steel: 600, food: 1000 }
    },
    'malines': {
        code: '2020202',
        name: 'دولة مالينس',
        role: 'diplomat',
        representative: 'Erik Machiavelli',
        budget: 2800000,
        military: { infantry: 85000, tanks: 120, aircraft: 200, submarines: 35 },
        territories: 7,
        treasury: 900000,
        resources: { oil: 450, steel: 380, food: 700 }
    },
    'soviet': {
        code: '3030303',
        name: 'الاتحاد السوفيتي',
        role: 'diplomat',
        representative: 'جوزيف ستالين',
        budget: 4200000,
        military: { infantry: 200000, tanks: 350, aircraft: 280, submarines: 80 },
        territories: 15,
        treasury: 1500000,
        resources: { oil: 950, steel: 750, food: 900 }
    },
    'china': {
        code: '4040404',
        name: 'الإمبراطورية الصينية',
        role: 'diplomat',
        representative: 'صن يات سين',
        budget: 3500000,
        military: { infantry: 180000, tanks: 180, aircraft: 250, submarines: 45 },
        territories: 10,
        treasury: 1100000,
        resources: { oil: 500, steel: 550, food: 1100 }
    }
};

const weaponsStore = [
    { id: 1, name: 'دبابة M1922 Thunder', type: 'tank', price: 150000, stock: 25, damage: 85, defense: 70, armor: 65 },
    { id: 2, name: 'مقاتلة Iron Eagle', type: 'aircraft', price: 220000, stock: 15, damage: 95, defense: 45, speed: 80 },
    { id: 3, name: 'غواصة Silent Death', type: 'submarine', price: 350000, stock: 10, damage: 90, defense: 80, stealth: 85 },
    { id: 4, name: 'مدفعية Long Reach', type: 'artillery', price: 180000, stock: 20, damage: 75, defense: 55, range: 90 },
    { id: 5, name: 'قاذفة صواريخ Red Storm', type: 'rocket', price: 280000, stock: 12, damage: 100, defense: 35, precision: 70 },
    { id: 6, name: 'حاملة طائرات Ocean Fortress', type: 'carrier', price: 500000, stock: 5, damage: 60, defense: 95, capacity: 50 }
];

let chatMessages = [
    { 
        id: 1, 
        nation: 'usa', 
        sender: 'فرانكلين روزفلت', 
        message: 'نرحب بجميع الدبلوماسيين في هذه القناة المشفرة',
        timestamp: new Date().toISOString(),
        type: 'diplomatic'
    }
];

let newsFeed = [
    {
        id: 1,
        title: 'معاهدة عدم اعتداء جديدة',
        content: 'تم توقيع معاهدة عدم اعتداء بين الولايات المتحدة ودولة مالينس لتعزيز السلام الإقليمي.',
        timestamp: new Date().toISOString(),
        pinned: true,
        author: 'usa',
        category: 'diplomacy'
    }
];

let sessions = {};
let diplomaticRelations = {
    'usa': { 'malines': 75, 'soviet': 30, 'china': 45 },
    'malines': { 'usa': 75, 'soviet': 50, 'china': 60 },
    'soviet': { 'usa': 30, 'malines': 50, 'china': 70 },
    'china': { 'usa': 45, 'malines': 60, 'soviet': 70 }
};

let economicTransactions = [];
let militaryCampaigns = [];

// ============ Middleware ============
const authenticateSession = (req, res, next) => {
    const sessionId = req.headers['session-id'];
    if (!sessionId || !sessions[sessionId]) {
        return res.status(401).json({ error: 'غير مصرح بالدخول' });
    }
    req.nation = sessions[sessionId].nation;
    req.role = sessions[sessionId].role;
    req.representative = sessions[sessionId].representative;
    next();
};

// ============ نظام تسجيل الدخول ============
app.post('/api/login', (req, res) => {
    const { nation, representative, code } = req.body;
    
    if (!nationsDB[nation]) {
        return res.status(400).json({ error: 'الدولة غير موجودة في النظام' });
    }
    
    if (nationsDB[nation].code !== code) {
        return res.status(401).json({ error: 'الرمز السري غير صحيح' });
    }
    
    const sessionId = Math.random().toString(36).substring(7) + Date.now().toString(36);
    sessions[sessionId] = {
        nation: nation,
        role: nationsDB[nation].role,
        representative: representative || nationsDB[nation].representative,
        loginTime: new Date()
    };
    
    res.json({
        sessionId,
        nation: nation,
        role: nationsDB[nation].role,
        representative: representative || nationsDB[nation].representative,
        nationName: nationsDB[nation].name,
        budget: nationsDB[nation].budget,
        military: nationsDB[nation].military,
        territories: nationsDB[nation].territories,
        treasury: nationsDB[nation].treasury,
        resources: nationsDB[nation].resources
    });
});

// ============ نظام المعلومات الوطنية ============
app.get('/api/nation', authenticateSession, (req, res) => {
    const nation = nationsDB[req.nation];
    res.json({
        nation: req.nation,
        role: req.role,
        representative: req.representative,
        nationName: nation.name,
        budget: nation.budget,
        military: nation.military,
        territories: nation.territories,
        treasury: nation.treasury,
        resources: nation.resources
    });
});

// ============ نظام الأخبار ============
app.get('/api/news', authenticateSession, (req, res) => {
    const sortedNews = [...newsFeed].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    res.json(sortedNews);
});

app.post('/api/news', authenticateSession, (req, res) => {
    if (req.role !== 'president') {
        return res.status(403).json({ error: 'فقط الرئيس يمكنه نشر الأخبار' });
    }
    
    const { title, content, pinned } = req.body;
    const news = {
        id: newsFeed.length + 1,
        title,
        content,
        timestamp: new Date().toISOString(),
        pinned: pinned || false,
        author: req.nation,
        category: 'announcement'
    };
    
    newsFeed.unshift(news);
    res.json({ success: true, news });
});

app.delete('/api/news/:id', authenticateSession, (req, res) => {
    if (req.role !== 'president') {
        return res.status(403).json({ error: 'غير مصرح' });
    }
    
    newsFeed = newsFeed.filter(n => n.id !== parseInt(req.params.id));
    res.json({ success: true });
});

// ============ نظام الشات الدبلوماسي ============
app.get('/api/chat', authenticateSession, (req, res) => {
    res.json(chatMessages);
});

app.post('/api/chat', authenticateSession, (req, res) => {
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'الرسالة فارغة' });
    }
    
    const chatMsg = {
        id: chatMessages.length + 1,
        nation: req.nation,
        sender: req.representative,
        message: message,
        timestamp: new Date().toISOString(),
        type: 'diplomatic'
    };
    
    chatMessages.push(chatMsg);
    res.json({ success: true, message: chatMsg });
});

// ============ نظام المتجر العسكري ============
app.get('/api/store', authenticateSession, (req, res) => {
    res.json({
        weapons: weaponsStore,
        budget: nationsDB[req.nation].budget,
        treasury: nationsDB[req.nation].treasury
    });
});

app.post('/api/store/purchase', authenticateSession, (req, res) => {
    const { weaponId, quantity } = req.body;
    const weapon = weaponsStore.find(w => w.id === weaponId);
    const nation = nationsDB[req.nation];
    
    if (!weapon) {
        return res.status(404).json({ error: 'السلاح غير موجود' });
    }
    
    if (weapon.stock < quantity) {
        return res.status(400).json({ error: 'المخزون غير كاف' });
    }
    
    const totalCost = weapon.price * quantity;
    if (nation.budget < totalCost) {
        return res.status(400).json({ error: 'الميزانية غير كافية' });
    }
    
    // تحديث المخزون والميزانية
    weapon.stock -= quantity;
    nation.budget -= totalCost;
    nation.treasury -= totalCost * 0.1;
    
    // تحديث القوات العسكرية
    switch(weapon.type) {
        case 'tank':
            nation.military.tanks += quantity;
            break;
        case 'aircraft':
            nation.military.aircraft += quantity;
            break;
        case 'submarine':
            nation.military.submarines += quantity;
            break;
    }
    
    // إرسال إشعار تلقائي للشات
    const alertMessage = {
        id: chatMessages.length + 1,
        nation: 'system',
        sender: 'النظام الآلي',
        message: `[برقية عسكرية] قامت ${nation.name} بشراء ${quantity} ${weapon.name} بقيمة ${totalCost}$`,
        timestamp: new Date().toISOString(),
        type: 'alert'
    };
    chatMessages.push(alertMessage);
    
    economicTransactions.push({
        type: 'purchase',
        nation: req.nation,
        weapon: weapon.name,
        quantity,
        cost: totalCost,
        timestamp: new Date().toISOString()
    });
    
    res.json({
        success: true,
        remainingBudget: nation.budget,
        remainingStock: weapon.stock,
        militaryUpdate: nation.military
    });
});

// ============ نظام الاقتصاد المتقدم ============
app.get('/api/economy', authenticateSession, (req, res) => {
    const nation = nationsDB[req.nation];
    res.json({
        budget: nation.budget,
        treasury: nation.treasury,
        resources: nation.resources,
        transactions: economicTransactions.filter(t => t.nation === req.nation)
    });
});

app.post('/api/economy/trade', authenticateSession, (req, res) => {
    const { targetNation, resource, amount, price } = req.body;
    
    if (!nationsDB[targetNation]) {
        return res.status(404).json({ error: 'الدولة المستهدفة غير موجودة' });
    }
    
    const seller = nationsDB[req.nation];
    const buyer = nationsDB[targetNation];
    
    if (!seller.resources[resource] || seller.resources[resource] < amount) {
        return res.status(400).json({ error: 'الموارد غير كافية' });
    }
    
    if (buyer.budget < price) {
        return res.status(400).json({ error: 'ميزانية المشتري غير كافية' });
    }
    
    // تنفيذ الصفقة
    seller.resources[resource] -= amount;
    seller.budget += price;
    buyer.resources[resource] += amount;
    buyer.budget -= price;
    
    // تحسين العلاقات الدبلوماسية
    if (diplomaticRelations[req.nation]) {
        diplomaticRelations[req.nation][targetNation] = Math.min(100, 
            (diplomaticRelations[req.nation][targetNation] || 50) + 5);
    }
    
    const tradeAlert = {
        id: chatMessages.length + 1,
        nation: 'system',
        sender: 'النظام الاقتصادي',
        message: `[صفقة تجارية] قامت ${seller.name} ببيع ${amount} ${resource} إلى ${buyer.name} بقيمة ${price}$`,
        timestamp: new Date().toISOString(),
        type: 'economic'
    };
    chatMessages.push(tradeAlert);
    
    res.json({ success: true, sellerResources: seller.resources, buyerResources: buyer.resources });
});

// ============ نظام إدارة القوات العسكرية ============
app.get('/api/military', authenticateSession, (req, res) => {
    const nation = nationsDB[req.nation];
    res.json({
        military: nation.military,
        territories: nation.territories,
        campaigns: militaryCampaigns.filter(c => 
            c.attacker === req.nation || c.defender === req.nation
        )
    });
});

app.post('/api/military/deploy', authenticateSession, (req, res) => {
    const { targetNation, units } = req.body;
    
    if (!nationsDB[targetNation]) {
        return res.status(404).json({ error: 'الدولة المستهدفة غير موجودة' });
    }
    
    const attacker = nationsDB[req.nation];
    
    // التحقق من توفر القوات
    for (let unitType in units) {
        if (attacker.military[unitType] < units[unitType]) {
            return res.status(400).json({ error: `قوات ${unitType} غير كافية` });
        }
    }
    
    // خصم القوات
    for (let unitType in units) {
        attacker.military[unitType] -= units[unitType];
    }
    
    const campaign = {
        id: militaryCampaigns.length + 1,
        attacker: req.nation,
        defender: targetNation,
        units: units,
        startTime: new Date().toISOString(),
        status: 'active',
        battleProgress: 0
    };
    
    militaryCampaigns.push(campaign);
    
    const deployAlert = {
        id: chatMessages.length + 1,
        nation: 'system',
        sender: 'القيادة العسكرية',
        message: `[تعبئة عسكرية] قامت ${attacker.name} بنشر قواتها نحو ${nationsDB[targetNation].name}`,
        timestamp: new Date().toISOString(),
        type: 'military'
    };
    chatMessages.push(deployAlert);
    
    res.json({ success: true, campaign, remainingForces: attacker.military });
});

// ============ نظام العلاقات الدبلوماسية ============
app.get('/api/diplomacy', authenticateSession, (req, res) => {
    res.json({
        relations: diplomaticRelations[req.nation] || {},
        alliances: [],
        treaties: []
    });
});

app.post('/api/diplomacy/treaty', authenticateSession, (req, res) => {
    const { targetNation, treatyType } = req.body;
    
    if (!nationsDB[targetNation]) {
        return res.status(404).json({ error: 'الدولة غير موجودة' });
    }
    
    diplomaticRelations[req.nation][targetNation] = Math.min(100, 
        (diplomaticRelations[req.nation][targetNation] || 50) + 10);
    
    const treatyAlert = {
        id: chatMessages.length + 1,
        nation: 'system',
        sender: 'السلك الدبلوماسي',
        message: `[معاهدة] توقيع معاهدة ${treatyType} بين ${nationsDB[req.nation].name} و ${nationsDB[targetNation].name}`,
        timestamp: new Date().toISOString(),
        type: 'diplomatic'
    };
    chatMessages.push(treatyAlert);
    
    res.json({ success: true, relations: diplomaticRelations[req.nation] });
});

// ============ نظام إحصائيات اللعبة ============
app.get('/api/statistics', authenticateSession, (req, res) => {
    const stats = {};
    for (let nation in nationsDB) {
        stats[nation] = {
            name: nationsDB[nation].name,
            budget: nationsDB[nation].budget,
            militaryStrength: Object.values(nationsDB[nation].military).reduce((a, b) => a + b, 0),
            territories: nationsDB[nation].territories,
            resources: nationsDB[nation].resources
        };
    }
    res.json(stats);
});

app.listen(PORT, () => {
    console.log(`الخادم العسكري يعمل على المنفذ ${PORT}`);
});