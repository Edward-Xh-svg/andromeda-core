document.addEventListener('DOMContentLoaded', () => {
    
    // --- بنية التنقل والأمن الفيدرالي الفئة أ ---
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const securityGate = document.getElementById('security-gate');
    const passwordInput = document.getElementById('password-input');
    const securityError = document.getElementById('security-error');
    const submitAuthBtn = document.getElementById('submit-auth');
    const cancelAuthBtn = document.getElementById('cancel-auth');
    const successToast = document.getElementById('success-toast');

    const MASTER_KEY = "20083020117";
    let pendingTargetSection = null;
    let pendingTargetItem = null;
    let isAuthorized = false; 

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);

            if (item.classList.contains('secure-link') && !isAuthorized) {
                pendingTargetSection = targetSection;
                pendingTargetItem = item;
                openSecurityGate();
            } else {
                switchSection(targetSection, item);
            }
        });
    });

    function switchSection(targetSection, activeNavItem) {
        sections.forEach(sec => {
            sec.classList.add('hidden');
            sec.classList.remove('fade-in-secure');
        });
        navItems.forEach(nav => nav.classList.remove('active'));

        targetSection.classList.remove('hidden');
        activeNavItem.classList.add('active');

        if (targetSection.classList.contains('hidden-secure')) {
            targetSection.classList.add('fade-in-secure');
        }
    }

    function openSecurityGate() {
        securityGate.classList.remove('hidden');
        passwordInput.value = '';
        securityError.style.display = 'none';
        passwordInput.focus();
    }

    function closeSecurityGate() {
        securityGate.classList.add('hidden');
        pendingTargetSection = null;
        pendingTargetItem = null;
    }

    function handleAuthentication() {
        if (passwordInput.value === MASTER_KEY) {
            isAuthorized = true; 
            securityGate.classList.add('hidden');
            
            successToast.classList.remove('hidden');
            setTimeout(() => { successToast.classList.add('hidden'); }, 3000);

            if (pendingTargetSection && pendingTargetItem) {
                switchSection(pendingTargetSection, pendingTargetItem);
            }
        } else {
            securityError.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    submitAuthBtn.addEventListener('click', handleAuthentication);
    cancelAuthBtn.addEventListener('click', closeSecurityGate);
    passwordInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') handleAuthentication(); });

    // --- محرك الرادار التكتيكي الحي (1925 RADAR ENGINE) ---
    const canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const panelEmpty = document.getElementById('panel-empty-state');
    const panelContent = document.getElementById('panel-real-content');
    
    const uiName = document.getElementById('unit-name');
    const uiType = document.getElementById('unit-type');
    const uiCrew = document.getElementById('unit-crew');
    const uiWeapons = document.getElementById('unit-weapons');
    const uiRoute = document.getElementById('unit-route');
    const uiSpeed = document.getElementById('unit-speed');
    const uiEta = document.getElementById('unit-eta');
    const imgShip = document.getElementById('unit-img-ship');
    const imgPlane = document.getElementById('unit-img-plane');

    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight || 500;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // قطع عسكرية حقيقية ومتحركة لعام 1925
    const militaryUnits = [
        {
            id: 1, name: "البارجة يو إس إس أريزونا (USS Arizona)", type: "ship",
            x: 100, y: 150, targetX: 420, targetY: 250, speed: 1.1,
            crew: "1,081 ضابط وبحار مقاتل", 
            weapons: "12 مدفع رئيسي عيار 14 بوصة، تكتيك اختراق ثقيل",
            route: "من قاعدة نورفولك البحرية ⇐ المياه الإقليمية للأطلسي",
            eta: 210
        },
        {
            id: 2, name: "سرب طائرات الاستطلاع والاعتراض الـ 45", type: "plane",
            x: 480, y: 80, targetX: 150, targetY: 380, speed: 2.6,
            crew: "24 طياراً تكتيكياً (طائرات ثنائية السطح 1925)", 
            weapons: "رشاشات بروانينغ متزامنة ثنائية عيار .30 ملم حارقة",
            route: "من حقل طيران سان دييغو ⇐ دورية حماية الأجواء الغربية",
            eta: 85
        },
        {
            id: 3, name: "غواصة الأعماق الهجومية إس-18 (USS S-18)", type: "ship",
            x: 250, y: 420, targetX: 580, targetY: 140, speed: 0.7,
            crew: "42 بحاراً تحت قيادة الأركان الفيدرالية", 
            weapons: "4 أنابيب طوربيد عيار 21 بوصة مدمرة للمنشآت",
            route: "من محطة ميامي ⇐ استطلاع خطوط طاقة Standard Oil",
            eta: 390
        }
    ];

    let selectedUnitId = null;

    function updateAndRenderRadar() {
        ctx.fillStyle = "#02050a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(26, 42, 74, 0.35)";
        ctx.lineWidth = 1;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        for (let r = 60; r < Math.max(canvas.width, canvas.height); r += 80) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
            ctx.stroke();
        }

        militaryUnits.forEach(unit => {
            const dx = unit.targetX - unit.x;
            const dy = unit.targetY - unit.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 2) {
                unit.x += (dx / distance) * (unit.speed * 0.15);
                unit.y += (dy / distance) * (unit.speed * 0.15);
                if (Math.random() > 0.96 && unit.eta > 3) {
                    unit.eta -= 1;
                }
            } else {
                const tempX = unit.x;
                unit.targetX = Math.random() * (canvas.width - 120) + 60;
                unit.targetY = Math.random() * (canvas.height - 120) + 60;
                unit.eta = Math.floor(Math.random() * 250) + 90;
            }

            ctx.beginPath();
            ctx.strokeStyle = selectedUnitId === unit.id ? "rgba(139, 0, 0, 0.7)" : "rgba(37, 99, 235, 0.25)";
            ctx.setLineDash([4, 4]);
            ctx.moveTo(unit.x, unit.y);
            ctx.lineTo(unit.targetX, unit.targetY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = selectedUnitId === unit.id ? "#ef4444" : "#3b82f6";
            ctx.beginPath();
            if (unit.type === 'plane') {
                ctx.arc(unit.x, unit.y, 6, 0, 2 * Math.PI);
            } else {
                ctx.moveTo(unit.x, unit.y - 8);
                ctx.lineTo(unit.x + 6, unit.y + 6);
                ctx.lineTo(unit.x - 6, unit.y + 6);
                ctx.closePath();
            }
            ctx.fill();

            ctx.fillStyle = selectedUnitId === unit.id ? "#f87171" : "#94a3b8";
            ctx.font = "11px Cairo";
            ctx.fillText(unit.type === 'plane' ? "✈ " + unit.name.split(' ')[0] : "⚓ " + unit.name.split(' ')[1], unit.x + 12, unit.y + 4);
        });

        if (selectedUnitId) {
            const currentUnit = militaryUnits.find(u => u.id === selectedUnitId);
            if (currentUnit) {
                const mins = Math.floor(currentUnit.eta / 60);
                const secs = currentUnit.eta % 60;
                uiEta.innerText = `${mins} دقيقة و ${secs} ثانية للوصول`;
            }
        }

        requestAnimationFrame(updateAndRenderRadar);
    }

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
        let foundUnit = null;

        militaryUnits.forEach(unit => {
            const dist = Math.sqrt((clickX - unit.x) ** 2 + (clickY - unit.y) ** 2);
            if (dist < 20) foundUnit = unit;
        });

        if (foundUnit) {
            selectedUnitId = foundUnit.id;
            uiName.innerText = foundUnit.name;
            uiType.innerText = foundUnit.type === "plane" ? "سلاح الجو التكتيكي" : "قطع الأسطول الفيدرالي";
            uiCrew.innerText = foundUnit.crew;
            uiWeapons.innerText = foundUnit.weapons;
            uiRoute.innerText = foundUnit.route;
            uiSpeed.innerText = foundUnit.type === "plane" ? "135 عقدة/ساعة" : "24 عقدة ثابتة";
            
            if(foundUnit.type === "plane") {
                imgPlane.classList.remove('hidden'); imgShip.classList.add('hidden');
            } else {
                imgShip.classList.remove('hidden'); imgPlane.classList.add('hidden');
            }

            panelEmpty.classList.add('hidden');
            panelContent.classList.remove('hidden');
        }
    });

    updateAndRenderRadar();
});
