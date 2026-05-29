document.addEventListener('DOMContentLoaded', () => {

    // --- الساعة الفيدرالية الحية للنظام ---
    function updateClock() {
        const now = new Date();
        const timeString = now.toTimeString().split(' ')[0];
        document.getElementById('live-clock').innerText = timeString;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- مصفوفة جدار الحماية والتحقق من كلمة المرور (20083020117) ---
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    const securityGateOverlay = document.getElementById('security-gate-overlay');
    const fedPassInput = document.getElementById('fed-pass-input');
    const securityErrorMsg = document.getElementById('security-error-msg');
    const submitGateBtn = document.getElementById('submit-gate-btn');
    const cancelGateBtn = document.getElementById('cancel-gate-btn');
    const authSuccessToast = document.getElementById('auth-success-toast');

    const MASTER_PASSWORD = "20083020117";
    let isSessionAuthorized = false;
    let pendingSection = null;
    let pendingLink = null;

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);

            if (link.classList.contains('secure-link') && !isSessionAuthorized) {
                pendingSection = targetSection;
                pendingLink = link;
                openSecurityGate();
            } else {
                if (targetSection) switchSection(targetSection, link);
            }
        });
    });

    function switchSection(targetSection, activeLink) {
        sections.forEach(sec => sec.classList.add('hidden'));
        navLinks.forEach(lnk => lnk.classList.remove('active'));
        
        targetSection.classList.remove('hidden');
        activeLink.classList.add('active');

        // إعادة ضبط أبعاد خريطة Leaflet عند الانتقال إليها لتعمل بكفاءة كاملة
        if (activeLink.getAttribute('data-target') === 'cmd-center') {
            setTimeout(() => { radarLeafletMap.invalidateSize(); }, 200);
        }
    }

    function openSecurityGate() {
        securityGateOverlay.classList.remove('hidden');
        fedPassInput.value = '';
        securityErrorMsg.style.display = 'none';
        fedPassInput.focus();
    }

    function closeSecurityGate() {
        securityGateOverlay.classList.add('hidden');
        pendingSection = null;
        pendingLink = null;
    }

    function processGateAuthentication() {
        if (fedPassInput.value === MASTER_PASSWORD) {
            isSessionAuthorized = true;
            securityGateOverlay.classList.add('hidden');
            
            // إظهار تنبيه النجاح الفيدرالي الفئة أ
            authSuccessToast.classList.remove('hidden');
            setTimeout(() => { authSuccessToast.classList.add('hidden'); }, 3000);

            if (pendingSection && pendingLink) {
                switchSection(pendingSection, pendingLink);
            }
        } else {
            securityErrorMsg.style.display = 'block';
            fedPassInput.value = '';
            fedPassInput.focus();
        }
    }

    submitGateBtn.addEventListener('click', processGateAuthentication);
    cancelGateBtn.addEventListener('click', closeSecurityGate);
    fedPassInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') processGateAuthentication(); });


    // --- محرك الخريطة التفاعلية الفيدرالية والرادار الحي (LEAFLET RADAR ENGINE) ---
    // بناء الخريطة بنمط تعقب ليلي مظلم وبأبعاد عسكرية واضحة
    const radarLeafletMap = L.map('leafletRadarMap', {
        center: [20.0, -40.0],
        zoom: 3,
        zoomControl: true,
        attributionControl: false
    });

    // استخدام خرائط CartoDB الرمادية الداكنة المتوافقة مع هوية الأرشيف في الصورة
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 10,
        minZoom: 2
    }).addTo(radarLeafletMap);

    // قاعدة بيانات القطع الحركية المتغيرة ومساراتها عام 1925
    const liveRadarAssets = [
        {
            id: 101, name: "البارجة يو إس إس أريزونا (USS Arizona)", type: "ship",
            lat: 36.7, lng: -75.5, destLat: 25.0, destLng: -40.0, speed: 0.08,
            crew: "1,081 ضابط وبحار مدرب الفئة المقاتلة",
            weapons: "12 مدفع رئيسي عيار 14 بوصة، 22 مدفع حماية ساحلية عيار 5 بوصة",
            route: "قاعدة نورفولك (الأطلسي) ⇐ نقطة الاعتراض التكتيكية الشرقية",
            eta: 140
        },
        {
            id: 102, name: "سرب الطيران الاعتراضي الـ 45", type: "plane",
            lat: 32.5, lng: -114.0, destLat: 23.5, destLng: -102.0, speed: 0.35,
            crew: "24 طياراً تكتيكياً (طائرات M1922 Iron Eagle ثنائية الأسطح)",
            weapons: "رشاشات بروانينغ مزدوجة متزامنة عيار .30 ملم حارقة"،
            route: "حقل طيران كاليفورنيا الفيدرالي ⇐ أجواء قواعد الاحتلال بالمكسيك",
            eta: 45
        },
        {
            id: 103, name: "غواصة الأعماق إس-18 (USS S-18)", type: "ship",
            lat: 21.3, lng: -157.8, destLat: 34.0, destLng: -125.0, speed: 0.04,
            crew: "42 من نخبة سلاح الغواصات السري والعمليات المكتومة",
            weapons: "4 أنابيب طوربيد عيار 21 بوصة ثقيلة، مدفع سطح عيار 100 ملم",
            route: "قاعدة بيرل هاربر (هاواي) ⇐ مهمة استطلاع مياه الهادئ الشرقية",
            eta: 290
        }
    ];

    // لوحة العرض والاعتراض الجانبية
    const sidebarEmpty = document.getElementById('sidebar-empty-state');
    const sidebarData = document.getElementById('sidebar-data-state');
    const pName = document.getElementById('panel-unit-name');
    const pType = document.getElementById('panel-unit-type');
    const pCrew = document.getElementById('panel-unit-crew');
    const pWeapons = document.getElementById('panel-unit-weapons');
    const pRoute = document.getElementById('panel-unit-route');
    const pEta = document.getElementById('panel-unit-eta');
    const assetShipImg = document.getElementById('img-asset-ship');
    const assetPlaneImg = document.getElementById('img-asset-plane');

    let activeSelectedAssetId = null;
    const activeMarkersMap = {};

    // إنشاء وتحديث القطع العسكرية على خريطة الرادار
    function renderAndMoveMilitaryAssets() {
        liveRadarAssets.forEach(asset => {
            
            // حسابات الحركة التدريجية الرياضية لمحاكاة النقل الحي بأسلوب الرادار
            const dLat = asset.destLat - asset.lat;
            const dLng = asset.destLng - asset.lng;
            const distance = Math.sqrt(dLat * dLat + dLng * dLng);

            if (distance > 0.5) {
                asset.lat += (dLat / distance) * asset.speed;
                asset.lng += (dLng / distance) * asset.speed;
                // محاكاة العد التنازلي للزمن المتبقي للوصول
                if (Math.random() > 0.7 && asset.eta > 2) asset.eta -= 1;
            } else {
                // إعادة تدوير المسار عند بلوغ الهدف لخلق حركة أبدية للرادار
                const tempLat = asset.lat;
                asset.destLat = asset.lat - (Math.random() * 15 - 7.5);
                asset.destLng = asset.lng - (Math.random() * 15 - 7.5);
                asset.eta = Math.floor(Math.random() * 200) + 60;
            }

            // إعداد أيقونة الرادار التكتيكية المخصصة لكل قطعة
            const iconHtml = asset.type === 'plane' 
                ? `<div class="radar-custom-marker"><i class="fa-solid fa-plane-up radar-icon-pulse-plane"></i></div>`
                : `<div class="radar-custom-marker"><i class="fa-solid fa-ship radar-icon-pulse-ship"></i></div>`;

            const customMarkerIcon = L.divIcon({
                html: iconHtml,
                className: 'clear-marker-bg',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });

            // تحديث إحداثيات الـ Marker القائم أو إنشاء جديد بالكامل
            if (activeMarkersMap[asset.id]) {
                activeMarkersMap[asset.id].setLatLng([asset.lat, asset.lng]);
            } else {
                const marker = L.marker([asset.lat, asset.lng], { icon: customMarkerIcon }).addTo(radarLeafletMap);
                
                // التقاط حدث الضغط فوق القطعة لاعتراض البيانات
                marker.on('click', () => {
                    activeSelectedAssetId = asset.id;
                    displayAssetIntelToSidebar(asset);
                });
                
                activeMarkersMap[asset.id] = marker;
            }
        });

        // تحديث مستمر لبيانات اللوحة الجانبية الحية للقطعة النشطة حالياً
        if (activeSelectedAssetId) {
            const currentSelected = liveRadarAssets.find(a => a.id === activeSelectedAssetId);
            if (currentSelected) {
                pEta.innerText = `${currentSelected.eta} دقيقة تكتيكية مقدرة للوصول للهدف`;
            }
        }
    }

    // تعبئة وعرض وثيقة الاعتراض الاستخباراتي للقطعة المحددة بالكامل
    function displayAssetIntelToSidebar(asset) {
        pName.innerText = asset.name;
        pType.innerText = asset.type === 'plane' ? "سلاح الجو الفيدرالي (1925)" : "سلاح البحرية والأسطول";
        pCrew.innerText = asset.crew;
        pWeapons.innerText = asset.weapons;
        pRoute.innerText = asset.route;

        if (asset.type === 'plane') {
            assetPlaneImg.classList.remove('hidden');
            assetShipImg.classList.add('hidden');
        } else {
            assetShipImg.classList.remove('hidden');
            assetPlaneImg.classList.add('hidden');
        }

        sidebarEmpty.classList.add('hidden');
        sidebarData.classList.remove('hidden');
    }

    // تشغيل محرك الرادار والتحركات فوراً والتحديث الدوري التلقائي كل 10 ثوانٍ
    renderAndMoveMilitaryAssets();
    setInterval(renderAndMoveMilitaryAssets, 10000);
});
