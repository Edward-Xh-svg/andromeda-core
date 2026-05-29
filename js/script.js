// ==============================================
// النظام الاستخباراتي - 1925
// ==============================================

document.addEventListener('DOMContentLoaded', () => {
    // ----- عناصر DOM -----
    const loadingScreen = document.getElementById('loading-screen');
    const authOverlay = document.getElementById('auth-overlay');
    const authCodeInput = document.getElementById('auth-code');
    const authSubmit = document.getElementById('auth-submit');
    const authError = document.getElementById('auth-error');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const canvas = document.getElementById('hud-canvas');
    const ctx = canvas.getContext('2d');
    const currentTimeEl = document.getElementById('current-time');
    const currentDateEl = document.getElementById('current-date');
    const counters = document.querySelectorAll('.counter');

    // ----- كلمة المرور السرية -----
    const SECRET_PASSWORD = '20083020117';
    const AUTH_KEY = 'intel_1925_auth_granted';

    // ----- محاكاة التحميل -----
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
    }, 2800);

    // ----- الساعة الحية والتاريخ -----
    function updateClock() {
        const now = new Date();
        // استخدام التاريخ الهجري أو الميلادي حسب الحاجة، هنا نستخدم ميلادي مع تنسيق 1925
        const year = 1925; // خيالي ثابت
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        currentDateEl.textContent = now.toLocaleDateString('ar-SA', options).replace('2025', '1925');
        currentTimeEl.textContent = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    updateClock();
    setInterval(updateClock, 1000);

    // ----- خلفية HUD المتحركة (Canvas) -----
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let particles = [];
    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.5 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.5 + 0.1;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
                this.reset();
            }
        }
        draw() {
            ctx.fillStyle = `rgba(139, 16, 16, ${this.opacity})`;
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
    }

    for (let i = 0; i < 120; i++) {
        particles.push(new Particle());
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(22, 38, 61, 0.3)';
        ctx.lineWidth = 0.5;
        const spacing = 50;
        for (let x = 0; x < canvas.width; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    function animateCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        particles.forEach(p => { p.update(); p.draw(); });
        // رسم خطوط بين الجسيمات القريبة
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    ctx.strokeStyle = `rgba(139, 16, 16, ${0.1 * (1 - dist / 100)})`;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animateCanvas);
    }
    animateCanvas();

    // ----- القائمة الجانبية (Drawer) -----
    function openSidebar() {
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('active');
    }
    function closeSidebar() {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    }
    menuToggle.addEventListener('click', openSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // إغلاق القائمة عند النقر على عنصر (في الهاتف)
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                closeSidebar();
            }
        });
    });

    // ----- التنقل بين الأقسام -----
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const sectionId = `section-${this.dataset.section}`;
            const targetSection = document.getElementById(sectionId);
            
            // التحقق مما إذا كان القسم مصنفًا
            if (this.classList.contains('classified-link')) {
                // التحقق من الجلسة المخزنة
                if (sessionStorage.getItem(AUTH_KEY) === 'true') {
                    // مخول مسبقًا
                    activateSection(this, targetSection);
                } else {
                    // طلب المصادقة
                    showAuthModal(this, targetSection);
                }
            } else {
                // قسم عام
                activateSection(this, targetSection);
            }
        });
    });

    function activateSection(navItem, section) {
        // إزالة النشاط من الكل
        navItems.forEach(n => n.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active-section'));
        
        // تفعيل العنصر المحدد
        navItem.classList.add('active');
        if (section) {
            section.classList.add('active-section');
        }
    }

    // ----- نظام المصادقة -----
    let pendingNavItem = null;
    let pendingSection = null;

    function showAuthModal(navItem, section) {
        pendingNavItem = navItem;
        pendingSection = section;
        authOverlay.classList.add('active');
        authCodeInput.value = '';
        authError.textContent = '';
        setTimeout(() => authCodeInput.focus(), 200);
    }

    function hideAuthModal() {
        authOverlay.classList.remove('active');
    }

    authSubmit.addEventListener('click', () => {
        const enteredCode = authCodeInput.value.trim();
        if (enteredCode === SECRET_PASSWORD) {
            // نجاح المصادقة
            sessionStorage.setItem(AUTH_KEY, 'true');
            hideAuthModal();
            if (pendingNavItem && pendingSection) {
                activateSection(pendingNavItem, pendingSection);
            }
            // تأثير نجاح
            authError.textContent = '';
            authError.style.color = '#33ff33';
            authError.textContent = 'تم التحقق. جارٍ فتح القسم المصنف...';
        } else {
            authError.style.color = '#ff4d4d';
            authError.textContent = 'رمز الوصول غير صحيح. تم تسجيل المحاولة.';
            authCodeInput.classList.add('shake');
            setTimeout(() => authCodeInput.classList.remove('shake'), 500);
        }
    });

    // إغلاق النافذة عند النقر خارجها
    authOverlay.addEventListener('click', (e) => {
        if (e.target === authOverlay) hideAuthModal();
    });

    // دعم Enter في حقل كلمة المرور
    authCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') authSubmit.click();
    });

    // ----- عدادات إحصائية متحركة -----
    function animateCounters() {
        counters.forEach(counter => {
            const target = parseFloat(counter.dataset.target);
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const updateCounter = () => {
                current += step;
                if (current < target) {
                    counter.textContent = current.toFixed(target % 1 !== 0 ? 2 : 0).toLocaleString('en-US');
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target.toLocaleString('en-US');
                }
            };
            updateCounter();
        });
    }

    // تشغيل العدادات عند تحميل الصفحة أو عند التمرير (Intersection Observer)
    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        observer.observe(statsGrid);
    } else {
        animateCounters();
    }

    // ----- الخريطة التفاعلية (Leaflet) -----
    function initMap() {
        if (document.getElementById('leaflet-map')) {
            const map = L.map('leaflet-map', {
                attributionControl: false,
                zoomControl: true
            }).setView([38.9, -77.0], 4);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                maxZoom: 18,
                opacity: 0.8
            }).addTo(map);

            // علامات القواعد العسكرية (خيالية)
            const bases = [
                { name: 'البنتاغون', lat: 38.871, lng: -77.056 },
                { name: 'قاعدة لانغلي', lat: 37.083, lng: -76.35 },
                { name: 'قاعدة بيرل هاربر', lat: 21.35, lng: -157.95 },
                { name: 'أسطول المحيط الأطلسي', lat: 36.85, lng: -75.97 },
                { name: 'قيادة أوروبا', lat: 48.13, lng: 11.58 },
                { name: 'قاعدة المحيط الهادئ', lat: 13.44, lng: 144.65 },
            ];

            const redIcon = L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
            });

            bases.forEach(base => {
                L.marker([base.lat, base.lng], { icon: redIcon })
                    .addTo(map)
                    .bindPopup(`<strong>${base.name}</strong><br>الوضع: نشط`);
            });

            // إعادة تهيئة الحجم عند تغيير حجم النافذة
            window.addEventListener('resize', () => {
                map.invalidateSize();
            });
        }
    }

    // تأخير بسيط لتهيئة الخريطة بعد التحميل
    setTimeout(initMap, 1000);

    // ----- تأثيرات إضافية للواقعية -----
    // وميض عشوائي في شريط الحالة
    setInterval(() => {
        const statusDot = document.querySelector('.status-dot');
        if (statusDot && Math.random() > 0.9) {
            statusDot.style.opacity = '0.4';
            setTimeout(() => statusDot.style.opacity = '1', 100);
        }
    }, 3000);

    // تحديث عشوائي لعداد التنبيهات
    setInterval(() => {
        const badge = document.querySelector('.badge-count');
        if (badge) {
            const newCount = Math.floor(Math.random() * 5) + 1;
            badge.textContent = newCount;
        }
    }, 15000);

    console.log('%cمنصة المراقبة الفيدرالية 1925 | النظام جاهز | مستوى التصنيف: TS/SCI',
        'color: #8b1010; font-size: 1.2rem; font-weight: bold;');
    console.log('%cتم تحميل جميع الوحدات بنجاح. قاعدة البيانات مؤمنة.', 'color: #33ff33;');
});