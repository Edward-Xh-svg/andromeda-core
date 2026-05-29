document.addEventListener('DOMContentLoaded', () => {

    // 1. تفعيل الساعة والتزامن القياسي لعام 1926
    function startSystemClock() {
        const clockNode = document.getElementById('fed-clock');
        setInterval(() => {
            clockNode.innerText = new Date().toTimeString().split(' ')[0] + " [مزامنة السيرفر الفيدرالي]";
        }, 1000);
    }
    startSystemClock();

    // 2. قائمة دول وأقاليم العالم الجيوسياسية لعام 1926
    const COUNTRIES_1926 = [
        "الجمهورية التركية", "المملكة المصرية (تحت الحماية البريطانية)", "سلطة نجد والحجاز", "الدولة القاجارية (إيران)", 
        "المملكة العراقية (انتداب بريطاني)", "جمهورية سوريا ولبنان (انتداب فرنسي)", "فلسطين وشرق الأردن (انتداب بريطاني)",
        "الإمبراطورية اليابانية", "جمهورية الصين", "الاتحاد السوفيتي", "المملكة المتحدة", "الجمهورية الفرنسية", 
        "مملكة إيطاليا", "جمهورية فايمار (ألمانيا)", "المملكة المغربية (حماية فرنسية وإسبانية)", "تونس (حماية فرنسية)",
        "الجمهورية الجزائرية (احتلال فرنسي)", "مملكة أفغانستان", "الإمبراطورية الإثيوبية", "جمهورية المكسيك",
        "جمهورية البرازيل", "جمهورية الأرجنتين", "كندا", "كومنولث أستراليا"
    ];

    const GOV_PASSWORD = "2844306161119281464";
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

    // تهيئة البيانات الأساسية من السيرفر فور تحميل التطبيق
    loadArsenalData();
    loadArchiveFeed();
    loadConsulateChat();

    // نظام التنقل وحماية الأقسام
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const secId = btn.getAttribute('data-sec');
            
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
            gateTitle.innerText = "بروتوكول التحقق السيادي الصارم للرئيس";
            gateDesc.innerText = "يرجى إدخال شفرة التحكم المركزية المكونة من 19 رقماً لفتح ملفات الإدارة الرئاسية والأرشيف.";
        } else {
            gateTitle.innerText = "شفرة بوابة التجارة الفيدرالية الدولية";
            gateDesc.innerText = "الوصول لمستودعات بيع السلاح يتطلب الرمز التجاري المصغر (5555).";
        }
        gateModal.classList.remove('hidden');
        gateInput.focus();
    }

    gateClose.addEventListener('click', () => gateModal.add('hidden'));
    gateConfirm.addEventListener('click', processAuthentication);
    gateInput.addEventListener('keyup', (e) => { if(e.key === 'Enter') processAuthentication(); });

    function processAuthentication() {
        const value = gateInput.value.trim();
        if (authTypeNeeded === 'gov' && value === GOV_PASSWORD) {
            currentSessionUser.isLogged = true;
            currentSessionUser.role = "president";
            currentSessionUser.country = "الولايات المتحدة الأمريكية (الرئيس)";
            currentSessionUser.diplomatName = "المكتب البيضاوي";
            
            activeSessionInfo.innerText = "فخامة الرئيس الأمريكي 🇺🇸";
            activeSessionInfo.style.borderColor = "var(--intel-red)";
            adminEditorPanel.classList.remove('hidden'); // فك قفل لوحة التحكم بالتعديل والنشر فوراً للرئيس
            
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
        document.getElementById(`${secId}-sec`).classList.remove('hidden');
        element.classList.add('active');
    }

    // 3. جلب بيانات الأسلحة من السيرفر وبناء جداول البنتاغون والماركت تزامناً وحياً
    async function loadArsenalData() {
        try {
            const res = await fetch('/api/arsenal');
            const arsenal = await res.json();
            
            // تعبئة لوحة القيادة العسكرية للبنتاغون
            const tbody = document.getElementById('pentagon-weapons-table');
            if(tbody) {
                tbody.innerHTML = '';
                arsenal.forEach(w => {
                    tbody.innerHTML += `<tr>
                        <td class="font-bold text-green">${w.name}</td>
                        <td>${w.type}</td>
                        <td>${w.speed || w.caliber || '--'}</td>
                        <td class="font-bold" style="font-size:1.1rem; color:white;">${w.count.toLocaleString()}</td>
                        <td>${w.location}</td>
                        <td class="text-green">$${w.cost.toLocaleString()}</td>
                    </tr>`;
                });
            }

            // تعبئة كروت سوق السلاح الفيدرالي الدولي
            const marketGrid = document.getElementById('market-products-grid');
            if(marketGrid) {
                marketGrid.innerHTML = '';
                arsenal.forEach(w => {
                    marketGrid.innerHTML += `
                        <div class="weapon-market-card">
                            <div>
                                <h4>${w.name}</h4>
                                <div class="spec-line"><strong>نوع العتاد:</strong> ${w.type}</div>
                                <div class="spec-line"><strong>المخزون المتوفر حياً:</strong> <span class="text-green font-bold">${w.count.toLocaleString()} وحدة</span></div>
                                <div class="spec-line"><strong>الموقع وموقع الشحن:</strong> ${w.location}</div>
                            </div>
                            <div>
                                <div class="weapon-price-tag">قيمة القطعة: $${w.cost.toLocaleString()}</div>
                                <div class="buy-action-wrap">
                                    <input type="number" id="qty-${w.id}" value="1" min="1" max="${w.count}">
                                    <button class="btn-buy" data-id="${w.id}">شراء فوري وتوريد</button>
                                </div>
                            </div>
                        </div>`;
                });

                // تفعيل ميكانيكية الشراء الدولي عبر الـ API للسيرفر
                document.querySelectorAll('.btn-buy').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        if(!currentSessionUser.isLogged || currentSessionUser.role === 'guest') {
                            return alert("بروتوكول حظر: يرجى تسجيل حساب دولتك أولاً عبر الملحقية في قسم القنصليات قبل إبرام الصفقات سيادياً.");
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
                            alert(`🚨 تـم تـأكـيـد الـصـفـقـة مـن الـسـيـرفـر الـمـركـزي!\nالسلاح: ${result.weaponName}\nالكمية: ${qty} وحدات\nالقيمة الإجمالية: $${result.totalCost.toLocaleString()}\nتم توليد برقية آلية وإرسالها لغرفة الرئيس الدبلوماسية.`);
                            loadArsenalData(); // تحديث فوري للمخزون أمام الجميع دون تحديث الصفحة
                            loadConsulateChat(); // تحديث الشات ليرى الجميع برقية الصفقة
                        } else {
                            alert(result.error);
                        }
                    });
                });
            }
        } catch (err) { console.error("فشل الاتصال بسيرفر الأسلحة الفيدرالي", err); }
    }

    // 4. رفع الملفات والوسائط والمقالات للأرشيف المركزي
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
            if (type === 'video') previewItem.innerHTML = `<video src="${e.target.result}" controls></video>`;
            if (type === 'audio') previewItem.innerHTML = `<div class="p-2 bg-dark text-xs text-center" style="color:var(--neon-green)">ملف صوتي جاهز</div>`;
            
            mediaPreviewContainer.appendChild(previewItem);
            uploadedMediaPayloads.push({ type: type, data: e.target.result });
        };
        reader.readAsDataURL(file);
    }

    if(uploadImg) uploadImg.addEventListener('change', (e) => { if(e.target.files[0]) handleFileSelection(e.target.files[0], 'image'); });
    if(uploadVid) uploadVid.addEventListener('change', (e) => { if(e.target.files[0]) handleFileSelection(e.target.files[0], 'video'); });
    if(uploadAudio) uploadAudio.addEventListener('change', (e) => { if(e.target.files[0]) handleFileSelection(e.target.files[0], 'audio'); });

    async function loadArchiveFeed() {
        const res = await fetch('/api/archive');
        const posts = await res.json();
        newsFeedContainer.innerHTML = '';
        posts.forEach((post, index) => {
            newsFeedContainer.innerHTML += `
                <div class="post-card">
                    <div class="chat-msg-header"><span>بث موثق في الأرشيف الوطني الأمريكي</span> <span>${post.date}</span></div>
                    <h3 style="margin-bottom:10px; color:var(--neon-green);">${post.title}</h3>
                    <p style="font-size:0.92rem; line-height:1.6; color:#e2e8f0;">${post.content}</p>
                    <div class="post-media-attach" id="media-attach-${index}"></div>
                </div>`;
            
            // حقن الملفات الصوتية والمرئية حركياً للمقال
            setTimeout(() => {
                const box = document.getElementById(`media-attach-${index}`);
                if(box && post.media) {
                    post.media.forEach(m => {
                        if(m.type === 'image') box.innerHTML += `<img src="${m.data}">`;
                        if(m.type === 'video') box.innerHTML += `<video src="${m.data}" controls></video>`;
                        if(m.type === 'audio') box.innerHTML += `<audio src="${m.data}" controls class="preview-audio-node"></audio>`;
                    });
                }
            }, 50);
        });
    }

    if(submitPostBtn) {
        submitPostBtn.addEventListener('click', async () => {
            const title = postTitleInput.value.trim();
            const content = postContentInput.value.trim();
            if(!title || !content) return alert("الرجاء تعبئة نص وموضوع الوثيقة أولاً.");

            const res = await fetch('/api/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, media: uploadedMediaPayloads })
            });
            
            if(res.ok) {
                postTitleInput.value = ''; postContentInput.value = '';
                mediaPreviewContainer.innerHTML = ''; uploadedMediaPayloads = [];
                loadArchiveFeed();
                alert("تم دفع الأوراق الرسمية وحفظها في قاعدة بيانات السيرفر المركزي.");
            }
        });
    }

    // 5. إدارة الملحقية الدبلوماسية، إنشاء الحسابات والاتصال المباشر بالرئيس
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

    // ملء دول خارطة العالم 1926 بالدروب داون
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
            if(!dipName) return alert("يرجى كتابة اسم السفير أو المندوب السامي لاعتماد أوراق الدولة السيرفرية.");

            currentSessionUser.isLogged = true;
            currentSessionUser.role = "diplomat";
            currentSessionUser.country = selectedC;
            currentSessionUser.diplomatName = dipName;

            activeSessionInfo.innerText = `سفير: ${selectedC}`;
            activeSessionInfo.style.borderColor = "var(--market-gold)";
            alert(`تم تأسيس واعتماد حساب دولة [${selectedC}] بنظام المحاكاة بنجاح.`);
        });
    }

    let chatMediaPayloads = [];
    function handleChatFile(file, type) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const d = document.createElement('div');
            d.className = "preview-item";
            d.innerHTML = type === 'image' ? `<img src="${e.target.result}">` : `<div class="p-2 bg-dark text-xs">مرفق ${type} جاهز</div>`;
            chatMediaPreview.appendChild(d);
            chatMediaPayloads.push({ type: type, data: e.target.result });
        };
        reader.readAsDataURL(file);
    }

    if(chatImg) chatImg.addEventListener('change', (e) => { if(e.target.files[0]) handleChatFile(e.target.files[0], 'image'); });
    if(chatVid) chatVid.addEventListener('change', (e) => { if(e.target.files[0]) handleChatFile(e.target.files[0], 'video'); });
    if(chatAudio) chatAudio.addEventListener('change', (e) => { if(e.target.files[0]) handleChatFile(e.target.files[0], 'audio'); });

    async function loadConsulateChat() {
        const res = await fetch('/api/diplomacy');
        const messages = await res.json();
        consulateChatMessages.innerHTML = '';
        
        messages.forEach(msg => {
            const isPres = msg.presidential;
            const card = document.createElement('div');
            card.className = `chat-msg ${isPres ? 'presidential' : ''}`;
            card.innerHTML = `
                <div class="chat-msg-header"><span>${msg.sender} (المندوب: ${msg.diplomat})</span> <span>${msg.time}</span></div>
                <p style="white-space: pre-line; line-height:1.5;">${msg.text}</p>
                <div class="chat-media-render" id="c-media-${msg.id}"></div>
            `;
            consulateChatMessages.appendChild(card);

            // إرفاق الميديا في الشات حركياً في حال وجودها
            setTimeout(() => {
                const box = document.getElementById(`c-media-${msg.id}`);
                if(box && msg.media) {
                    msg.media.forEach(m => {
                        if(m.type === 'image') box.innerHTML += `<img src="${m.data}" style="max-width:100%; max-height:160px; border-radius:4px; margin-top:8px;">`;
                        if(m.type === 'video') box.innerHTML += `<video src="${m.data}" controls style="max-width:100%; max-height:160px; margin-top:8px;"></video>`;
                        if(m.type === 'audio') box.innerHTML += `<audio src="${m.data}" controls style="width:100%; margin-top:8px;"></audio>`;
                    });
                }
            }, 50);
        });
        consulateChatMessages.scrollTop = consulateChatMessages.scrollHeight;
    }

    if(sendChatBtn) {
        sendChatBtn.addEventListener('click', async () => {
            const text = chatTextInput.value.trim();
            if(!text && chatMediaPayloads.length === 0) return;

            const isPres = (currentSessionUser.role === 'president');
            const payload = {
                sender: isPres ? "رئيس الولايات المتحدة الأمريكية 🇺🇸" : currentSessionUser.country,
                diplomat: currentSessionUser.diplomatName,
                text: text,
                media: chatMediaPayloads,
                presidential: isPres
            };

            const res = await fetch('/api/diplomacy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if(res.ok) {
                chatTextInput.value = '';
                chatMediaPreview.innerHTML = '';
                chatMediaPayloads = [];
                loadConsulateChat(); // إعادة تحميل نافذة الدردرشة حياً لتعكس الجديد
            }
        });
    }

    // تحديث دوري وتلقائي للشات والأسلحة كل 5 ثوانٍ لضمان التزامن الحي بين المستخدمين والرئيس
    setInterval(() => {
        loadConsulateChat();
        loadArsenalData();
    }, 5000);
});
