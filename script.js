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

// بيانات الأسلحة والوحدات الموسعة
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

// صفحات المحتوى
let currentPage = "home";
let restrictedAccess = { intel: false, archive: false };
let pendingPage = null;

// Helper: إنشاء جداول HTML
function renderTable(headers, rows) {
    let table = '<table class="official-table"><thead><tr>';
    headers.forEach(h => table += `<th>${h}</th>`);
    table += '</tr></thead><tbody>';
    rows.forEach(row => {
        table += '<tr>';
        row.forEach(cell => table += `<td>${cell}</td>`);
        table += '</tr>';
    });
    table += '</tbody></table>';
    return table;
}

function renderHome() {
    return `
        <div class="gov-card">
            <div class="card-header">النظام الفيدرالي للولايات المتحدة الأمريكية - التقرير السنوي 1925</div>
            <p>أرشيف حكومي استراتيجي يوثق البيانات العسكرية والاقتصادية والصناعية. جميع المعلومات معتمدة من وزارة الحرب والخزانة.</p>
        </div>
        <div class="gov-card">
            <div class="card-header">المؤشرات الرئيسية</div>
            <div class="stats-grid">
                <div class="stat-item"><div class="stat-label">الناتج المحلي الإجمالي</div><div class="stat-value">${STATE_DATA.gdp} USD</div></div>
                <div class="stat-item"><div class="stat-label">الدخل السنوي للبلاد</div><div class="stat-value">${STATE_DATA.annualRevenue} USD</div></div>
                <div class="stat-item"><div class="stat-label">احتياطي الذهب</div><div class="stat-value">${STATE_DATA.goldReserve} USD</div></div>
                <div class="stat-item"><div class="stat-label">سعر الصرف</div><div class="stat-value">${STATE_DATA.exchange}</div></div>
                <div class="stat-item"><div class="stat-label">أهم شركة</div><div class="stat-value">${STATE_DATA.topCompany}</div></div>
                <div class="stat-item"><div class="stat-label">احتياطي النفط</div><div class="stat-value">${STATE_DATA.oilReserve}</div></div>
            </div>
        </div>
        <div class="gov-card">
            <div class="card-header">ملخص القوات المسلحة (1925)</div>
            <div class="stats-grid">
                <div class="stat-item"><div class="stat-label">إجمالي الجنود</div><div class="stat-value">${STATE_DATA.soldiers}</div></div>
                <div class="stat-item"><div class="stat-label">الدبابات</div><div class="stat-value">${STATE_DATA.tanks}</div></div>
                <div class="stat-item"><div class="stat-label">الطائرات</div><div class="stat-value">${STATE_DATA.aircraft}</div></div>
                <div class="stat-item"><div class="stat-label">المدفعية</div><div class="stat-value">${STATE_DATA.artillery}</div></div>
                <div class="stat-item"><div class="stat-label">البوارج</div><div class="stat-value">${STATE_DATA.battleships}</div></div>
                <div class="stat-item"><div class="stat-label">المدمرات</div><div class="stat-value">${STATE_DATA.destroyers}</div></div>
                <div class="stat-item"><div class="stat-label">الغواصات</div><div class="stat-value">${STATE_DATA.submarines}</div></div>
            </div>
        </div>
    `;
}

function renderMilitary() {
    return `
        <div class="gov-card"><div class="card-header">هيكل القوات البرية - 1925</div>
        ${renderTable(["الفئة", "العدد", "الملاحظات"], [
            ["الجيش النظامي", "350,000", "محترفون"],
            ["الحرس الوطني", "450,000", "جاهز خلال 60 يوم"],
            ["الاحتياطي المدرب", "400,000", "خبراء سابقون"],
            ["قوات الاحتلال (المكسيك)", "80,000", "جنرال بيرشينغ"]
        ])}
        </div>
        <div class="gov-card"><div class="card-header">الدبابات (الطرازات)</div>
        ${renderTable(["الطراز", "العدد", "العيار الرئيسي", "ملاحظات"], militaryTables.tanks.map(t => [t.model, t.count, t.caliber, t.notes]))}
        </div>
        <div class="gov-card"><div class="card-header">المدفعية والأسلحة الصغيرة</div>
        ${renderTable(["السلاح", "النوع", "العيار", "الكمية"], militaryTables.weapons.map(w => [w.name, w.type, w.caliber, w.quantity]))}
        </div>
    `;
}

function renderEconomy() {
    return `
        <div class="gov-card"><div class="card-header">المؤشرات الاقتصادية الكلية</div>
        <div class="stats-grid">
            <div class="stat-item"><div class="stat-label">الناتج المحلي</div><div class="stat-value">${STATE_DATA.gdp} USD</div></div>
            <div class="stat-item"><div class="stat-label">الدخل السنوي</div><div class="stat-value">${STATE_DATA.annualRevenue} USD</div></div>
            <div class="stat-item"><div class="stat-label">الاحتياطي الذهبي</div><div class="stat-value">${STATE_DATA.goldReserve} USD</div></div>
            <div class="stat-item"><div class="stat-label">الديون المستحقة لأمريكا</div><div class="stat-value">12 مليار USD</div></div>
        </div>
        </div>
        <div class="gov-card"><div class="card-header">الميزانية الفيدرالية والإنفاق العسكري (1925)</div>
        ${renderTable(["البند", "القيمة"], [["وزارة الحرب", "1.8 مليار USD"], ["وزارة البحرية", "950 مليون USD"], ["مجلس الأبحاث العسكرية", "25 مليون USD"], ["الاستخبارات المركزية", "15 مليون USD"], ["إجمالي الإنفاق الدفاعي", "2.75 مليار USD"]])}
        </div>
    `;
}

function renderIndustry() {
    return `<div class="gov-card"><div class="card-header">الإنتاج الصناعي والطاقة</div>
    ${renderTable(["القطاع", "الإنتاج السنوي", "ملاحظات"], [
        ["الصلب", "45 مليون طن", "الهيمنة لـ US Steel"],
        ["النفط", "450 مليون برميل", "65% من العالم"],
        ["السيارات", "2.2 مليون مركبة", "Ford الأكبر"],
        ["الطيران العسكري", "480 طائرة Iron Eagle", "تفوق على اليابان"]
    ])}
    </div>`;
}

function renderCorporations() {
    return `<div class="gov-card"><div class="card-header">أكبر الشركات المسيطرة - 1925</div>
    ${renderTable(["الشركة", "القطاع", "الحصة السوقية", "الإيرادات التقريبية"], corporationsData.map(c => [c.name, c.sector, c.share, c.revenue]))}
    </div>`;
}

function renderNavy() {
    return `<div class="gov-card"><div class="card-header">أسطول البحرية الأمريكية</div>
    ${renderTable(["الطراز/الفئة", "النوع", "التسليح الرئيسي", "الأسطول", "العدد"], militaryTables.navy.map(n => [n.class, n.type, n.mainGuns, n.fleet, n.count]))}
    </div>
    <div class="gov-card"><div class="card-header">الغواصات الاستراتيجية (Silent Death)</div>
    <p>60 غواصة من طراز M1922 Silent Death منتشرة في المحيطين الأطلسي والهادئ. مدى يصل إلى 12,000 كم.</p>
    </div>`;
}

function renderAirForce() {
    return `<div class="gov-card"><div class="card-header">القوات الجوية - الطرازات العاملة</div>
    ${renderTable(["الطراز", "الدور", "السرعة القصوى", "التسليح/الحمولة", "العدد"], militaryTables.aircraft.map(a => [a.type, a.role, a.speed, a.armament, a.count]))}
    </div>`;
}

function renderDiplomacy() {
    return `<div class="gov-card"><div class="card-header">العلاقات الدولية - تقرير 1925</div>
    <p>فرنسا مدينة لأمريكا بـ6 مليار دولار، بريطانيا 6 مليار. دعم عسكري محدود لفرنسا في الأزمة الجزائرية. التوتر مع اليابان مستمر بسبب التفوق التكنولوجي. احتلال المكسيك مستمر مع خطة سحب جزئي للقوات.</p>
    ${renderTable(["الدولة", "نوع العلاقة", "الديون/الملاحظات"], [
        ["بريطانيا", "حليف استراتيجي", "ديون 6 مليار"],
        ["فرنسا", "حليف متوتر", "دعم عسكري ولوجستي"],
        ["اليابان", "منافس عسكري وتجاري", "فجوة تقنية لصالح أمريكا"],
        ["المكسيك", "منطقة احتلال", "80,000 جندي أمريكي"]
    ])}
    </div>`;
}

function renderIntel() {
    return `<div class="gov-card"><div class="card-header">قاعدة الاستخبارات المركزية - تصنيف سري للغاية</div>
    <p>تقديرات 1925: كتائب المقاومة في الجزائر غير معروفة المصدر، يابان تعيد تسليح جيشها، روسيا السوفيتية في حالة حرب أهلية هادئة. نظام Voice of God المشفر يضمن أمن الاتصالات الأمريكية.</p>
    <p>تم فتح هذا القسم بتفويض خاص من الرئيس.</p>
    </div>`;
}

function renderArchive() {
    return `<div class="gov-card"><div class="card-header">الأرشيف العسكري - الوثائق المؤرشفة 1920-1925</div>
    <p>سجلات مشاريع إعادة التسلح: IRON EAGLE، THUNDER ROAD، SILENT DEATH، VOICE OF GOD، HARVEST. التكلفة الإجمالية 305 مليون دولار.</p>
    <p>خطط انسحاب المكسيك – 1924، توجيهات الرئيس Machiavelli.</p>
    </div>`;
}

function loadPage(page) {
    let content = "";
    switch(page) {
        case "home": content = renderHome(); break;
        case "military": content = renderMilitary(); break;
        case "economy": content = renderEconomy(); break;
        case "diplomacy": content = renderDiplomacy(); break;
        case "industry": content = renderIndustry(); break;
        case "navy": content = renderNavy(); break;
        case "airforce": content = renderAirForce(); break;
        case "corporations": content = renderCorporations(); break;
        case "intel": content = restrictedAccess.intel ? renderIntel() : "<div class='gov-card'><div class='card-header'>مقيد</div><p>هذه المعلومات مصنفة سرية. يلزم التحقق.</p></div>"; break;
        case "archive": content = restrictedAccess.archive ? renderArchive() : "<div class='gov-card'><div class='card-header'>مقيد</div><p>الوصول غير مصرح به. يتطلب تخويل أمني.</p></div>"; break;
        default: content = renderHome();
    }
    document.getElementById("page-content").innerHTML = content;
    // تفعيل الرابط النشط
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

function closeModal() {
    document.getElementById('accessModal').style.display = 'none';
    pendingPage = null;
}

function verifyPassword() {
    const pass = document.getElementById('secretPassword').value;
    if (pass === "20083020117") {
        if (pendingPage === 'intel') restrictedAccess.intel = true;
        else if (pendingPage === 'archive') restrictedAccess.archive = true;
        closeModal();
        loadPage(pendingPage);
        // رسالة نجاح بسيطة في console أو toast
        const msgDiv = document.createElement('div');
        msgDiv.style.position = 'fixed';
        msgDiv.style.bottom = '20px';
        msgDiv.style.right = '20px';
        msgDiv.style.background = '#1e3a5f';
        msgDiv.style.padding = '0.7rem 1.2rem';
        msgDiv.style.borderRadius = '8px';
        msgDiv.innerText = 'تم التحقق من صلاحية الوصول';
        document.body.appendChild(msgDiv);
        setTimeout(() => msgDiv.remove(), 2500);
    } else {
        document.getElementById('passError').innerText = 'كلمة المرور غير صحيحة. الوصول مرفوض.';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // وقت مباشر
    const timeEl = document.getElementById('liveTime');
    function updateTime() {
        const now = new Date();
        timeEl.innerText = now.toLocaleString('ar-EG', { hour12: false });
    }
    updateTime();
    setInterval(updateTime, 1000);
    
    loadPage("home");
    
    // روابط القائمة
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            if ((page === 'intel' || page === 'archive') && 
                ((page === 'intel' && !restrictedAccess.intel) || (page === 'archive' && !restrictedAccess.archive))) {
                showModal(page);
                return;
            }
            currentPage = page;
            loadPage(page);
        });
    });
    
    document.getElementById('confirmPassBtn').addEventListener('click', verifyPassword);
    document.getElementById('cancelPassBtn').addEventListener('click', closeModal);
    document.getElementById('accessModal').addEventListener('click', (e) => { if(e.target === document.getElementById('accessModal')) closeModal(); });
});