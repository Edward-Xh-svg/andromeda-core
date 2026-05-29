document.addEventListener('DOMContentLoaded', () => {

    // تفعيل تزامن ساعة السيرفر الفيدرالي لعام 1926
    const clockNode = document.getElementById('fed-clock');
    if(clockNode) {
        setInterval(() => {
            clockNode.innerText = new Date().toTimeString().split(' ')[0] + " [مزامنة حية]";
        }, 1000);
    }

    // إدارة وضبط استجابة الهواتف المحمولة وقائمة البرجر (Drawer Sidebar)
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const fedSidebar = document.getElementById('fed-sidebar-id');
    const sidebarOverlay = document.getElementById('sidebar-overlay-id');

    if(mobileMenuToggle && fedSidebar && sidebarOverlay) {
        mobileMenuToggle.addEventListener('click', () => {
            fedSidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('hidden');
        });

        sidebarOverlay.addEventListener('click', () => {
            fedSidebar.classList.remove('open');
            sidebarOverlay.classList.add('hidden');
        });
    }

    const COUNTRIES_1926 = [
        "الجمهورية التركية", "المملكة المصرية", "سلطة نجد والحجاز", "الدولة القاجارية (إيران)", 
        "المملكة العراقية", "جمهورية سوريا ولبنان", "فلسطين وشرق الأردن", "الإمبراطورية اليابانية", 
        "جمهورية الصين", "الاتحاد السوفيتي", "المملكة المتحدة", "الجمهورية الفرنسية", 
        "مملكة إيطاليا", "جمهورية فايمار (ألمانيا)", "المملكة المغربية", "تونس", "الجمهورية الجزائرية"
    ];

    const GOV_PASSWORD = "000000"; // قمنا بتسهيلها كما طلبت لمنع أخطاء الرموز الطويلة
    const MARKET_PASSWORD = "5555";

    let currentSessionUser = { isLogged: false, role: "guest", country: "الولايات المتحدة", diplomatName: "زائر عابر" };

    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.sys-section');
    const gateModal = document.getElementById('gatekeeper-modal');
    const gateTitle = document.getElementById('gate-title');
    const gateDesc = document.getElementById('gate-desc');
    const gateInput = document.getElementById('gate-input-pass');
    const gateError = document.getElementById('gate-error');
    const gateClose = document.getElementById('gate-close');
    const gateConfirm = document.getElementById('gate-confirm');
    const activeSessionInfo = document.getElementById('active-session-info');
    const adminEditorPanel = document.getElementById('admin-editor-panel');

    let targetSectionId = null;
    let authTypeNeeded = null; 
    let activeTriggerButton = null;

    loadArsenalData();
    loadArchiveFeed();
    loadConsulateChat();

    // التنقل وإغلاق القائمة تلقائياً بالهاتف عند نقر أي قطاع
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const secId = btn.getAttribute('data-sec');
            
            if (fedSidebar && sidebarOverlay) {
                fedSidebar.classList.remove('open');
                sidebarOverlay.classList.add('hidden');
            }

            if (btn.classList.contains('secure-gov')) {
                if (currentSessionUser.role !== 'president') {
                    triggerGate(secId, 'gov', btn);
                } else {
                    displaySection(secId, btn);
                }
            } else if (btn.classList.contains('secure-market')) {
                if (!currentSessionUser.isLogged) {
                    triggerGate(secId, 'market', btn);
                } else {
                    displaySection(secId, btn);
                }
            } else {
                displaySection(secId, btn);
            }
        });
    });

    function triggerGate(secId, type, element) {
        targetSectionId = secId;
        authTypeNeeded = type;
        activeTriggerButton = element;
        gateError.style.display = 'none';
        gateInput.value = '';
        
        if (type === 'gov') {
            gateTitle.innerText = "فحص الشفرة السيادية للرئيس";
            gateDesc.innerText = "يرجى كتابة شفرة التحكم الفيدرالية المعتمدة (1234) للعبور للقطاع.";
        } else {
            gateTitle.innerText = "بوابة التجارة ومخازن السلاح الفيدرالية";
            gateDesc.innerText = "ادخل الرمز التجاري المصغر (5555) لتصفح السوق الدولي.";
        }
        gateModal.classList.remove('hidden');
        gateInput.focus();
    }

    if(gateClose) gateClose.addEventListener('click', () => gateModal.classList.add('hidden'));
    if(gateConfirm) gateConfirm.addEventListener('click', processAuthentication);
    if(gateInput) gateInput.addEventListener('keyup', (e) => { if(e.key === 'Enter') processAuthentication(); });

    function processAuthentication() {
        const value = gateInput.value.trim();
        if (authTypeNeeded === 'gov' && value === GOV_PASSWORD) {
            currentSessionUser.isLogged = true;
            currentSessionUser.role = "president";
            currentSessionUser.country = "الولايات المتحدة الأمريكية (الرئيس)";
            currentSessionUser.diplomatName = "المكتب البيضاوي";
            
            activeSessionInfo.innerText = "فخامة الرئيس الرئاسي 🇺🇸";
            if(adminEditorPanel) adminEditorPanel.classList.remove('hidden');
            gateModal.classList.add('hidden');
            displaySection(targetSectionId, activeTriggerButton);
        } else if (authTypeNeeded === 'market' && value === MARKET_PASSWORD) {
            if(currentSessionUser.role !== 'president') {
                currentSessionUser.isLogged = true;
                currentSessionUser.role = "diplomat";
                activeSessionInfo.innerText = `دولة معتمدة: ${currentSessionUser.country}`;
            }
            gateModal.classList.add('hidden');
            displaySection(targetSectionId, activeTriggerButton);
        } else {
            gateError.style.display = 'block';
        }
    }

    function displaySection(secId, element) {
        sections.forEach(s => s.classList.add('hidden'));
        navButtons.forEach(b => b.classList.remove('active'));
        const targetNode = document.getElementById(`${secId}-sec`);
        if(targetNode) targetNode.classList.remove('hidden');
        if(element) element.classList.add('active');
    }

    // جلب وبناء التحديث العسكري من السيرفر
    async function loadArsenalData() {
        try {
            const res = await fetch('/api/arsenal');
            const arsenal = await res.json();
            
            const tbody = document.getElementById('pentagon-weapons-table');
            if(tbody) {
                tbody.innerHTML = '';
                arsenal.forEach(w => {
                    tbody.innerHTML += `<tr>
                        <td class="font-bold text-green">${w.name}</td>
                        <td>${w.type}</td>
                        <td style="font-size:0.8rem; color:var(--text-gray);">${w.specs}</td>
                        <td class="font-bold" style="font-size:1rem; color:white;">${w.count.toLocaleString()}</td>
                        <td>${w.location}</td>
                        <td class="text-green">$${w.cost.toLocaleString()}</td>
                    </tr>`;
                });
            }

            const marketGrid = document.getElementById('market-products-grid');
            if(marketGrid) {
                marketGrid.innerHTML = '';
                arsenal.forEach(w => {
                    marketGrid.innerHTML += `
                        <div class="weapon-market-card">
                            <div>
                                <h4>${w.name}</h4>
                                <div class="spec-line"><strong>التصنيف:</strong> ${w.type}</div>
                                <div class="spec-line"><strong>المواصفات:</strong> ${w.specs}</div>
                                <div class="spec-line"><strong>المخزون المتاح:</strong> <span class="text-green font-bold">${w.count.toLocaleString()} وحدة</span></div>
                            </div>
                            <div>
                                <div class="weapon-price-tag">التكلفة: $${w.cost.toLocaleString()}</div>
                                <div class="buy-action-wrap">
                                    <input type="number" id="qty-${w.id}" value="1" min="1" max="${w.count}">
                                    <button class="btn-buy" data-id="${w.id}">تقديم طلب شراء سيادي</button>
                                </div>
                            </div>
                        </div>`;
                });

                document.querySelectorAll('.btn-buy').forEach(btn => {
                    btn.replaceWith(btn.cloneNode(true)); // تفادي تكرار الأيونت ليسنر عند التحديث الدوري
                });

                document.querySelectorAll('.btn-buy').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        if(!currentSessionUser.isLogged || currentSessionUser.role === 'guest') {
                            return alert("تنبيه: الرجاء تسجيل اسم السفير واعتماد الحساب أولاً من قسم القنصليات قبل الشراء.");
                        }
                        const id = btn.getAttribute('data-id');
                        const qty = parseInt(document.getElementById(`qty-${id}`).value);
                        
                        const response = await fetch('/api/arsenal/purchase', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id, qty, country: currentSessionUser.country })
                        });
                        const result = await response.json();
                        
                        if(result.success) {
                            alert(`تمت الموافقة المباشرة من وزارة الحرب!\nالعتاد: ${result.weaponName}\nالكمية: ${qty}\nالتكلفة الصافية: $${result.totalCost.toLocaleString()}`);
                            loadArsenalData();
                            loadConsulateChat();
                        } else {
                            alert(result.error);
                        }
                    });
                });
            }
        } catch (err) { console.error("خطأ ربط أسلحة السيرفر", err); }
    }

    // معالجات الميديا والأخبار والشات
    const uploadImg = document.getElementById('upload-img');
    const uploadVid = document.getElementById('upload-vid');
    const uploadAudio = document.getElementById('upload-audio');
    const mediaPreviewContainer = document.getElementById('media-preview-container');
    const submitPostBtn = document.getElementById('submit-post-btn');
    const postTitleInput = document.getElementById('post-title');
    const postContentInput = document.getElementById('post-content');
    const newsFeedContainer = document.getElementById('news-feed-container');

    let uploadedMediaPayloads = [];

    function handleFileSelection(file, type) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = "preview-item";
            if (type === 'image') previewItem.innerHTML = `<img src="${e.target.result}">`;
            if (type === 'video') previewItem.innerHTML = `<video src="${e.target.result}"></video>`;
            if (type === 'audio') previewItem.innerHTML = `<div class="p-1 text-xs text-center" style="color:var(--neon-green)">صوت مجهز</div>`;
            mediaPreviewContainer.appendChild(previewItem);
            uploadedMediaPayloads.push({ type, data: e.target.result });
        };
        reader.readAsDataURL(file);
    }

    if(uploadImg) uploadImg.addEventListener('change', (e) => { if(e.target.files[0]) handleFileSelection(e.target.files[0], 'image'); });
    if(uploadVid) uploadVid.addEventListener('change', (e) => { if(e.target.files[0]) handleFileSelection(e.target.files[0], 'video'); });
    if(uploadAudio) uploadAudio.addEventListener('change', (e) => { if(e.target.files[0]) handleFileSelection(e.target.files[0], 'audio'); });

    async function loadArchiveFeed() {
        const res = await fetch('/api/archive');
        const posts = await res.json();
        if(!newsFeedContainer) return;
        newsFeedContainer.innerHTML = '';
        posts.forEach((post, index) => {
            newsFeedContainer.innerHTML += `
                <div class="post-card">
                    <div class="chat-msg-header"><span>وثيقة أرشيف فيدرالي رسمية موثقة</span> <span>${post.date}</span></div>
                    <h3 style="margin-bottom:8px; color:var(--neon-green); font-size:1.05rem;">${post.title}</h3>
                    <p style="font-size:0.88rem; line-height:1.5; color:#cbd5e1;">${post.content}</p>
                    <div class="post-media-attach" id="media-attach-${index}"></div>
                </div>`;
            
            setTimeout(() => {
                const box = document.getElementById(`media-attach-${index}`);
                if(box && post.media) {
                    post.media.forEach(m => {
                        if(m.type === 'image') box.innerHTML += `<img src="${m.data}">`;
                        if(m.type === 'video') box.innerHTML += `<video src="${m.data}" controls></video>`;
                        if(m.type === 'audio') box.innerHTML += `<audio src="${m.data}" controls class="preview-audio-node"></audio>`;
                    });
                }
            }, 30);
        });
    }

    if(submitPostBtn) {
        submitPostBtn.addEventListener('click', async () => {
            const title = postTitleInput.value.trim();
            const content = postContentInput.value.trim();
            if(!title || !content) return alert("الرجاء إدخال نص القرار أو موضوع الوثيقة.");

            const res = await fetch('/api/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, media: uploadedMediaPayloads })
            });
            if(res.ok) {
                postTitleInput.value = ''; postContentInput.value = '';
                mediaPreviewContainer.innerHTML = ''; uploadedMediaPayloads = [];
                loadArchiveFeed();
                alert("تم إيداع الوثيقة بنجاح بسيرفر الأرشيف الفيدرالي المركزي.");
            }
        });
    }

    const countrySelectRegister = document.getElementById('country-select-register');
    const diplomatNameInput = document.getElementById('diplomat-name');
    const registerCountryBtn = document.getElementById('register-country-btn');
    const consulateChatMessages = document.getElementById('consulate-chat-messages');
    const chatTextInput = document.getElementById('chat-text-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const chatImg = document.getElementById('chat-img');
    const chatVid = document.getElementById('chat-vid');
    const chatAudio = document.getElementById('chat-audio');
    const chatMediaPreview = document.getElementById('chat-media-preview');

    if(countrySelectRegister) {
        COUNTRIES_1926.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c; opt.innerText = c;
            countrySelectRegister.appendChild(opt);
        });
    }

    if(registerCountryBtn) {
        registerCountryBtn.addEventListener('click', () => {
            const selectedC = countrySelectRegister.value;
            const dipName = diplomatNameInput.value.trim();
            if(!dipName) return alert("الرجاء تعبئة اسم المندوب السامي لاعتماد الاعتماد الدبلوماسي.");

            currentSessionUser.isLogged = true;
            currentSessionUser.role = "diplomat";
            currentSessionUser.country = selectedC;
            currentSessionUser.diplomatName = dipName;

            activeSessionInfo.innerText = `سفير: ${selectedC}`;
            activeSessionInfo.style.borderColor = "var(--market-gold)";
            alert(`تم تفعيل حساب دولة [${selectedC}] بنجاح ومزامنتها بالسيرفر الفيدرالي.`);
        });
    }

    let chatMediaPayloads = [];
    function handleChatFile(file, type) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const d = document.createElement('div');
            d.className = "preview-item";
            d.innerHTML = type === 'image' ? `<img src="${e.target.result}">` : `<div class="p-1 text-xs">مرفق جاهز</div>`;
            chatMediaPreview.appendChild(d);
            chatMediaPayloads.push({ type, data: e.target.result });
        };
        reader.readAsDataURL(file);
    }

    if(chatImg) chatImg.addEventListener('change', (e) => { if(e.target.files[0]) handleChatFile(e.target.files[0], 'image'); });
    if(chatVid) chatVid.addEventListener('change', (e) => { if(e.target.files[0]) handleChatFile(e.target.files[0], 'video'); });
    if(chatAudio) chatAudio.addEventListener('change', (e) => { if(e.target.files[0]) handleChatFile(e.target.files[0], 'audio'); });

    async function loadConsulateChat() {
        try {
            const res = await fetch('/api/diplomacy');
            const messages = await res.json();
            if(!consulateChatMessages) return;
            consulateChatMessages.innerHTML = '';
            
            messages.forEach(msg => {
                const isPres = msg.presidential;
                const card = document.createElement('div');
                card.className = `chat-msg ${isPres ? 'presidential' : ''}`;
                card.innerHTML = `
                    <div class="chat-msg-header"><span>${msg.sender} (المندوب: ${msg.diplomat})</span> <span>${msg.time}</span></div>
                    <p style="white-space: pre-line; line-height:1.4;">${msg.text}</p>
                    <div class="chat-media-render" id="c-media-${msg.id}"></div>
                `;
                consulateChatMessages.appendChild(card);

                setTimeout(() => {
                    const box = document.getElementById(`c-media-${msg.id}`);
                    if(box && msg.media) {
                        msg.media.forEach(m => {
                            if(m.type === 'image') box.innerHTML += `<img src="${m.data}" style="max-width:100%; max-height:130px; border-radius:4px; margin-top:6px; display:block;">`;
                            if(m.type === 'video') box.innerHTML += `<video src="${m.data}" controls style="max-width:100%; max-height:130px; margin-top:6px; display:block;"></video>`;
                            if(m.type === 'audio') box.innerHTML += `<audio src="${m.data}" controls style="width:100%; margin-top:6px; display:block;"></audio>`;
                        });
                    }
                }, 30);
            });
            consulateChatMessages.scrollTop = consulateChatMessages.scrollHeight;
        } catch(e){}
    }

    if(sendChatBtn) {
        sendChatBtn.addEventListener('click', async () => {
            const text = chatTextInput.value.trim();
            if(!text && chatMediaPayloads.length === 0) return;

            const isPres = (currentSessionUser.role === 'president');
            const payload = {
                sender: isPres ? "رئيس الولايات المتحدة الأمريكية 🇺🇸" : currentSessionUser.country,
                diplomat: currentSessionUser.diplomatName,
                text: text, media: chatMediaPayloads, presidential: isPres
            };

            const res = await fetch('/api/diplomacy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if(res.ok) {
                chatTextInput.value = ''; chatMediaPreview.innerHTML = ''; chatMediaPayloads = [];
                loadConsulateChat();
            }
        });
    }

    // التحديث التلقائي الدوري الفيدرالي لمزامنة التعديلات حياً بين كل الشاشات والهواتف
    setInterval(() => {
        loadConsulateChat();
        loadArsenalData();
    }, 4000);
});
