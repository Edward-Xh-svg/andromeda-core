document.addEventListener('DOMContentLoaded', () => {
    // إعدادات الواجهة للهواتف
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const fedSidebar = document.getElementById('fed-sidebar-id');
    const sidebarOverlay = document.getElementById('sidebar-overlay-id');

    if(mobileMenuToggle && fedSidebar && sidebarOverlay) {
        mobileMenuToggle.addEventListener('click', () => { fedSidebar.classList.toggle('open'); sidebarOverlay.classList.toggle('hidden'); });
        sidebarOverlay.addEventListener('click', () => { fedSidebar.classList.remove('open'); sidebarOverlay.classList.add('hidden'); });
    }

    // متغيرات الجلسة وتحديد هوية اللاعب
    let currentSessionUser = { isLogged: false, role: "guest", country: "زائر", diplomatName: "غير معروف" };

    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.sys-section');
    const loginModal = document.getElementById('login-modal');
    const loginEmailInput = document.getElementById('login-email');
    const loginPassInput = document.getElementById('login-pass');
    const loginError = document.getElementById('login-error');
    const activeSessionInfo = document.getElementById('top-login-btn');
    
    let targetSectionId = null;
    let activeTriggerButton = null;

    loadArsenalData();
    loadArchiveFeed();
    loadConsulateChat();

    // النقر على زر "تسجيل الدخول" في الأعلى
    activeSessionInfo.addEventListener('click', () => {
        if(!currentSessionUser.isLogged) showLoginModal();
    });

    // التنقل بين الأقسام
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const secId = btn.getAttribute('data-sec');
            
            if (fedSidebar && sidebarOverlay) { fedSidebar.classList.remove('open'); sidebarOverlay.classList.add('hidden'); }

            // إذا كان القسم محمي واللاعب غير مسجل دخول، تفتح نافذة الدخول
            if (btn.classList.contains('secure-zone') && !currentSessionUser.isLogged) {
                targetSectionId = secId;
                activeTriggerButton = btn;
                showLoginModal();
            } else {
                displaySection(secId, btn);
            }
        });
    });

    function showLoginModal() {
        loginError.style.display = 'none';
        loginEmailInput.value = '';
        loginPassInput.value = '';
        loginModal.classList.remove('hidden');
        loginEmailInput.focus();
    }

    document.getElementById('login-close').addEventListener('click', () => loginModal.classList.add('hidden'));
    document.getElementById('login-confirm').addEventListener('click', processLogin);
    loginPassInput.addEventListener('keyup', (e) => { if(e.key === 'Enter') processLogin(); });

    // 🌐 إرسال بيانات الإيميل والباسوورد للسيرفر للتحقق
    async function processLogin() {
        const email = loginEmailInput.value.trim();
        const password = loginPassInput.value.trim();

        if(!email || !password) return;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if(data.success) {
                currentSessionUser = {
                    isLogged: true,
                    role: data.user.role,
                    country: data.user.country,
                    diplomatName: data.user.diplomatName
                };

                // تغيير شكل الزر ليعرض علم واسم الدولة بدلاً من "تسجيل دخول"
                const icon = data.user.role === 'president' ? '🇺🇸' : '🚩';
                activeSessionInfo.innerText = `${data.user.country} ${icon}`;
                activeSessionInfo.style.backgroundColor = "var(--tactical-blue)";
                activeSessionInfo.style.cursor = "default";

                if(data.user.role === 'president') document.getElementById('admin-editor-panel').classList.remove('hidden');

                loginModal.classList.add('hidden');
                if(targetSectionId) displaySection(targetSectionId, activeTriggerButton);

                alert(`تم التحقق من الهوية بنجاح.\nأهلاً بك: ${data.user.diplomatName}\nالجهة: ${data.user.country}`);
            } else {
                loginError.style.display = 'block'; // إظهار رسالة الخطأ
            }
        } catch(e) { console.error("خطأ في الاتصال", e); }
    }

    function displaySection(secId, element) {
        sections.forEach(s => s.classList.add('hidden'));
        navButtons.forEach(b => b.classList.remove('active'));
        document.getElementById(`${secId}-sec`).classList.remove('hidden');
        if(element) element.classList.add('active');
    }

    // باقي الوظائف (السلاح، الشات، الأخبار) تم ربطها بهوية اللاعب المدمجة
    async function loadArsenalData() {
        const res = await fetch('/api/arsenal');
        const arsenal = await res.json();
        const marketGrid = document.getElementById('market-products-grid');
        if(!marketGrid) return;
        marketGrid.innerHTML = '';
        arsenal.forEach(w => {
            marketGrid.innerHTML += `
                <div class="weapon-market-card">
                    <div>
                        <h4>${w.name}</h4><div class="spec-line">${w.specs}</div>
                        <div class="spec-line text-green font-bold">المتاح: ${w.count} وحدة</div>
                    </div>
                    <div>
                        <div class="weapon-price-tag">$${w.cost.toLocaleString()}</div>
                        <div class="buy-action-wrap">
                            <input type="number" id="qty-${w.id}" value="1" min="1" max="${w.count}">
                            <button class="btn-buy" data-id="${w.id}">شراء</button>
                        </div>
                    </div>
                </div>`;
        });
        document.querySelectorAll('.btn-buy').forEach(btn => {
            btn.addEventListener('click', async () => {
                if(!currentSessionUser.isLogged) return alert("الرجاء تسجيل الدخول أولاً!");
                const id = btn.getAttribute('data-id');
                const qty = parseInt(document.getElementById(`qty-${id}`).value);
                const response = await fetch('/api/arsenal/purchase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, qty, country: currentSessionUser.country, diplomat: currentSessionUser.diplomatName })
                });
                const result = await response.json();
                if(result.success) { loadArsenalData(); loadConsulateChat(); alert("تم الشراء بنجاح!"); }
                else alert(result.error);
            });
        });
    }

    async function loadArchiveFeed() {
        const res = await fetch('/api/archive');
        const posts = await res.json();
        const container = document.getElementById('news-feed-container');
        if(!container) return;
        container.innerHTML = '';
        posts.forEach(post => {
            container.innerHTML += `<div class="post-card"><h3 class="text-green">${post.title}</h3><p>${post.content}</p></div>`;
        });
    }

    if(document.getElementById('submit-post-btn')) {
        document.getElementById('submit-post-btn').addEventListener('click', async () => {
            const title = document.getElementById('post-title').value.trim();
            const content = document.getElementById('post-content').value.trim();
            if(!title || !content) return;
            await fetch('/api/archive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content }) });
            document.getElementById('post-title').value = ''; document.getElementById('post-content').value = '';
            loadArchiveFeed();
        });
    }

    async function loadConsulateChat() {
        const res = await fetch('/api/diplomacy');
        const messages = await res.json();
        const container = document.getElementById('consulate-chat-messages');
        if(!container) return;
        container.innerHTML = '';
        messages.forEach(msg => {
            const isPres = msg.presidential;
            container.innerHTML += `
                <div class="chat-msg ${isPres ? 'presidential' : ''}">
                    <div class="chat-msg-header"><span>${msg.sender} (${msg.diplomat})</span> <span>${msg.time}</span></div>
                    <p>${msg.text}</p>
                </div>`;
        });
        container.scrollTop = container.scrollHeight;
    }

    if(document.getElementById('send-chat-btn')) {
        document.getElementById('send-chat-btn').addEventListener('click', async () => {
            const text = document.getElementById('chat-text-input').value.trim();
            if(!text) return;
            const isPres = (currentSessionUser.role === 'president');
            await fetch('/api/diplomacy', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sender: currentSessionUser.country, diplomat: currentSessionUser.diplomatName, text: text, presidential: isPres })
            });
            document.getElementById('chat-text-input').value = '';
            loadConsulateChat();
        });
    }

    setInterval(() => { loadConsulateChat(); loadArsenalData(); }, 3000);
});
