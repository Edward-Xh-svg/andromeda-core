// بيانات الدولة - 1925
const STATE_DATA = {
    gdp: "800,000,000,000",
    annualRevenue: "95,000,000,000",
    goldReserve: "3,500,000,000",
    soldiers: "1,280,000",
    tanks: "1,550",
    aircraft: "2,700",
    artillery: "4,600",
    battleships: "12",
    destroyers: "130",
    submarines: "100",
    oilReserve: "6,750,000,000 برميل",
    exchange: "1 USD = 2.6 JPY",
    topCompany: "Standard Oil (نيوجيرسي)"
};

const militaryTables = {
    tanks: [
        { model: "M1922 Thunder", count: 800, caliber: "مدفع 57 ملم", notes: "دبابة ثقيلة سريعة" },
        { model: "M1923 Thunderbolt", count: 400, caliber: "مدفع 37 ملم", notes: "دبابة خفيفة استطلاع" },
        { model: "Mark VIII Liberty", count: 150, caliber: "-", notes: "للتدريب" },
        { model: "Ford 3-Ton", count: 200, caliber: "-", notes: "احتياطي" }
    ],
    aircraft: [
        { type: "M1922 Iron Eagle", role: "مقاتلة تفوق جوي", speed: "320 كم/س", armament: "4 رشاشات", count: 800 },
        { type: "M1923 Eagle Eye", role: "استطلاع استراتيجي", speed: "280 كم/س", armament: "كاميرات", count: 300 },
        { type: "M1923 Storm", role: "قاذفة متوسطة", speed: "220 كم/س", armament: "800 كجم قنابل", count: 200 },
        { type: "M1924 Harvest", role: "قاذفة بعيدة المدى", speed: "200 كم/س", armament: "2000 كجم", count: 100 },
        { type: "de Havilland DH-4", role: "قاذفة تكتيكية", speed: "190 كم/س", armament: "4 رشاشات", count: 300 }
    ],
    navy: [
        { class: "New York / Nevada", type: "بارجة", mainGuns: "356 ملم", fleet: "الأسطول الأطلسي", count: 4 },
        { class: "Pennsylvania / New Mexico", type: "بارجة", mainGuns: "356 ملم", fleet: "الأسطول الهادئ", count: 5 },
        { class: "Tennessee / Colorado", type: "بارجة", mainGuns: "406 ملم", fleet: "الأسطول الهادئ", count: 3 },
        { class: "M1922 Silent Death", type: "غواصة محيطية", mainGuns: "طوربيدات", fleet: "منتشرة", count: 60 },
        { class: "Wickes / Clemson", type: "مدمرة", mainGuns: "102 ملم", fleet: "جميع الأساطيل", count: 130 }
    ],
    weapons: [
        { name: "M1903 Springfield", type: "بندقية قنص", caliber: ".30-06", quantity: "950,000" },
        { name: "M1917 Enfield", type: "بندقية قتال", caliber: ".30-06", quantity: "600,000" },
        { name: "Browning M1917", type: "رشاش ثقيل", caliber: "7.62 ملم", quantity: "35,000" },
        { name: "Browning BAR", type: "رشاش خفيف", caliber: "7.62 ملم", quantity: "12,000" },
        { name: "M1911 Colt", type: "مسدس نصف آلي", caliber: ".45 ACP", quantity: "450,000" }
    ]
};

const corporationsData = [
    { name: "Standard Oil (نيوجيرسي)", sector: "النفط والطاقة", share: "35% محلي + 40% المكسيك", revenue: "4.2 مليار $" },
    { name: "U.S. Steel", sector: "الصلب", share: "45% الإنتاج", revenue: "1.9 مليار $" },
    { name: "Bethlehem Steel", sector: "الصناعات الثقيلة", share: "25%", revenue: "980 مليون $" },
    { name: "Ford Motor Company", sector: "السيارات والشاحنات", share: "50% السيارات", revenue: "1.2 مليار $" },
    { name: "Curtiss / Boeing", sector: "الطيران العسكري", share: "60% السوق", revenue: "310 مليون $" },
    { name: "AT&T", sector: "الاتصالات", share: "90% الهاتف", revenue: "650 مليون $" },
    { name: "J.P. Morgan & Co.", sector: "التمويل", share: "الهيمنة على القروض", revenue: "غير معلن" }
];

// تخزين حالة فتح الأقسام (كل الأقسام ما عدا "news")
let unlockedPages = {
    home: false, military: false, economy: false, diplomacy: false,
    industry: false, intel: false, navy: false, airforce: false,
    corporations: false, archive: false
};
let pendingPage = null;

function renderTable(headers, rows) {
    let table = '<table class="official-table"><thead><tr>';
    headers.forEach(h => table += `<th>${h}</th>`);
    table += ' </thead><tbody>';
    rows.forEach(row => {
        table += '<tr>';
        row.forEach(cell => table += `<td>${cell}</td>`);
        table += '</tr>';
    });
    table += '</tbody></tr>';
    return table;
}

// صفحة الأخبار (مفتوحة بالكامل)
function renderNews() {
    return `
        <div class="gov-card">
            <div class="card-header">النشرة الإخبارية الرسمية - الولايات المتحدة (1925)</div>
            <p><strong>الحدث الرئيسي:</strong> الانسحاب الجزئي للقوات الأمريكية من المكسيك مستمر، مع بقاء 80,000 جندي لحماية المصالح النفطية.</p>
            <p><strong>التطورات الدولية:</strong> كتائب المقاومة في الجزائر تواصل السيطرة على المناطق الداخلية، فرنسا تطلب دعماً عسكرياً إضافياً من أمريكا.</p>
            <p><strong>الاقتصاد:</strong> الفائض التجاري يسجل 2.4 مليار دولار هذا العام، والنفط الأمريكي يغطي 65% من الطلب العالمي.</p>
            <p><strong>التسلح:</strong> اكتمال نشر أسطول الطائرات M1922 Iron Eagle بالكامل، لتحقيق التفوق الجوي على اليابان.</p>
            <p><strong>الكونجرس:</strong> مناقشة خطة دعم فرنسا بقيمة 550 مليون دولار مقابل امتيازات بترولية في الصحراء الجزائرية.</p>
            <p class="stat-value" style="font-size:0.9rem; margin-top:1rem;">آخر تحديث: 15 أبريل 1925</p>
        </div>
    `;
}

function renderHome() { return `<div class="gov-card"><div class="card-header">النظام الفيدرالي - الرئيسية</div><p>بيانات حساسة. تم فتح هذا القسم بتفويض.</p>${renderStats()}</div>`; }
function renderMilitary() { return `<div class="gov-card"><div class="card-header">الجيش - التفاصيل الكاملة</div>${renderMilitaryTables()}</div>`; }
function renderEconomy() { return `<div class="gov-card"><div class="card-header">الاقتصاد والميزانية</div>${renderEconomyTables()}</div>`; }
function renderDiplomacy() { return `<div class="gov-card"><div class="card-header">الدبلوماسية والعلاقات الدولية</div>${renderDiploTables()}</div>`; }
function renderIndustry() { return `<div class="gov-card"><div class="card-header">الصناعة والإنتاج</div>${renderIndustryTables()}</div>`; }
function renderIntel() { return `<div class="gov-card"><div class="card-header">الاستخبارات - تقييمات سرية</div><p>تقديرات 1925: إعادة تسليح يابانية، تمويل روسي محتمل لكتائب المقاومة، نظام Voice of God يعمل بكفاءة.</p></div>`; }
function renderNavy() { return `<div class="gov-card"><div class="card-header">البحرية الأمريكية</div>${renderNavyTables()}</div>`; }
function renderAirForce() { return `<div class="gov-card"><div class="card-header">القوات الجوية</div>${renderAirForceTables()}</div>`; }
function renderCorporations() { return `<div class="gov-card"><div class="card-header">الشركات المسيطرة</div>${renderCorpTables()}</div>`; }
function renderArchive() { return `<div class="gov-card"><div class="card-header">الأرشيف السري</div><p>وثائق العمليات الخاصة والمشاريع العسكرية 1920-1925 متاحة الآن.</p></div>`; }

function renderStats() {
    return `<div class="stats-grid">
        ${Object.entries({ "الناتج المحلي": STATE_DATA.gdp, "الدخل السنوي": STATE_DATA.annualRevenue, "احتياطي الذهب": STATE_DATA.goldReserve, "إجمالي الجنود": STATE_DATA.soldiers, "الدبابات": STATE_DATA.tanks, "الطائرات": STATE_DATA.aircraft }).map(([k,v]) => `<div class="stat-item"><div class="stat-label">${k}</div><div class="stat-value">${v}</div></div>`).join('')}
    </div>`;
}
function renderMilitaryTables() { return renderTable(["الطراز", "العدد", "العيار", "ملاحظات"], militaryTables.tanks.map(t => [t.model, t.count, t.caliber, t.notes])); }
function renderEconomyTables() { return renderTable(["البند", "القيمة"], [["وزارة الحرب", "1.8 مليار"], ["وزارة البحرية", "950 مليون"], ["الاستخبارات", "15 مليون"], ["إجمالي الإنفاق الدفاعي", "2.75 مليار"]]); }
function renderDiploTables() { return renderTable(["الدولة", "العلاقة", "الديون/ملاحظات"], [["بريطانيا","حليف","6 مليار"],["فرنسا","حليف متوتر","6 مليار + دعم"],["اليابان","منافس","فجوة تقنية"],["المكسيك","احتلال","80,000 جندي"]]); }
function renderIndustryTables() { return renderTable(["القطاع","الإنتاج","الملاحظات"],[["الصلب","45 مليون طن","US Steel"],["النفط","450 مليون برميل","65% عالمياً"],["السيارات","2.2 مليون","Ford"],["الطيران","480 طائرة/سنة","Iron Eagle"]]); }
function renderNavyTables() { return renderTable(["الفئة","النوع","التسليح","الأسطول","العدد"], militaryTables.navy.map(n => [n.class, n.type, n.mainGuns, n.fleet, n.count])); }
function renderAirForceTables() { return renderTable(["الطراز","الدور","السرعة","التسليح","العدد"], militaryTables.aircraft.map(a => [a.type, a.role, a.speed, a.armament, a.count])); }
function renderCorpTables() { return renderTable(["الشركة","القطاع","الحصة","الإيرادات"], corporationsData.map(c => [c.name, c.sector, c.share, c.revenue])); }

function loadPage(page) {
    let content = "";
    if (page === "news") {
        content = renderNews();
    } else {
        if (!unlockedPages[page]) {
            content = `<div class="gov-card"><div class="card-header">مقيد</div><p>هذه المعلومات مصنفة سرية. يلزم التحقق من الصلاحية.</p></div>`;
        } else {
            switch(page) {
                case "home": content = renderHome(); break;
                case "military": content = renderMilitary(); break;
                case "economy": content = renderEconomy(); break;
                case "diplomacy": content = renderDiplomacy(); break;
                case "industry": content = renderIndustry(); break;
                case "intel": content = renderIntel(); break;
                case "navy": content = renderNavy(); break;
                case "airforce": content = renderAirForce(); break;
                case "corporations": content = renderCorporations(); break;
                case "archive": content = renderArchive(); break;
                default: content = renderHome();
            }
        }
    }
    document.getElementById("page-content").innerHTML = content;
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`.nav-link[data-page="${page}"]`).classList.add('active');
}

function showModal(targetPage) {
    pendingPage = targetPage;
    const modal = document.getElementById('accessModal');
    modal.style.display = 'flex';
    document.getElementById('secretPassword').value = '';
    document.getElementById('passError').innerText = '';
}
function closeModal() { document.getElementById('accessModal').style.display = 'none'; pendingPage = null; }
function verifyPassword() {
    const pass = document.getElementById('secretPassword').value;
    if (pass === "20083020117") {
        if (pendingPage && unlockedPages.hasOwnProperty(pendingPage)) {
            unlockedPages[pendingPage] = true;
        }
        closeModal();
        loadPage(pendingPage);
        const msgDiv = document.createElement('div');
        msgDiv.style.position = 'fixed'; msgDiv.style.bottom = '20px'; msgDiv.style.right = '20px';
        msgDiv.style.background = '#1e3a5f'; msgDiv.style.padding = '0.7rem 1.2rem';
        msgDiv.style.borderRadius = '8px'; msgDiv.innerText = 'تم التحقق من صلاحية الوصول';
        document.body.appendChild(msgDiv);
        setTimeout(() => msgDiv.remove(), 2500);
    } else {
        document.getElementById('passError').innerText = 'كلمة المرور غير صحيحة. الوصول مرفوض.';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const timeEl = document.getElementById('liveTime');
    function updateTime() { timeEl.innerText = new Date().toLocaleString('ar-EG', { hour12: false }); }
    updateTime(); setInterval(updateTime, 1000);
    loadPage("news");
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            if (page === "news") {
                loadPage("news");
                return;
            }
            if (!unlockedPages[page]) {
                showModal(page);
            } else {
                loadPage(page);
            }
        });
    });
    document.getElementById('confirmPassBtn').addEventListener('click', verifyPassword);
    document.getElementById('cancelPassBtn').addEventListener('click', closeModal);
    document.getElementById('accessModal').addEventListener('click', (e) => { if(e.target === document.getElementById('accessModal')) closeModal(); });
});