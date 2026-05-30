// ============ المتغيرات العامة ============
let currentSession = null;
let currentNation = null;
let currentScreen = 'news';
let chatPollingInterval = null;

const API_BASE = 'http://localhost:3000/api';

// ============ عناصر DOM ============
const loginOverlay = document.getElementById('loginOverlay');
const appContainer = document.getElementById('appContainer');
const mainContent = document.getElementById('mainContent');
const nationNameDisplay = document.getElementById('nationNameDisplay');
const budgetDisplay = document.getElementById('budgetDisplay');

// ============ نظام تسجيل الدخول ============
document.getElementById('loginButton').addEventListener('click', async () => {
    const nation = document.getElementById('nationSelect').value;
    const representative = document.getElementById('representativeInput').value;
    const code = document.getElementById('codeInput').value;
    const errorDiv = document.getElementById('loginError');
    
    if (!nation) {
        errorDiv.textContent = 'يرجى اختيار الدولة';
        return;
    }
    
    if (!representative) {
        errorDiv.textContent = 'يرجى إدخال اسم الممثل الدبلوماسي';
        return;
    }
    
    if (!code || code.length !== 7) {
        errorDiv.textContent = 'الرمز السري يجب أن يكون 7 أرقام';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nation, representative, code })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentSession = data.sessionId;
            currentNation = data;
            loginOverlay.style.display = 'none';
            appContainer.style.display = 'flex';
            initializeApp();
        } else {
            errorDiv.textContent = data.error;
        }
    } catch (error) {
        errorDiv.textContent = 'خطأ في الاتصال بالخادم';
    }
});

// ============ تهيئة التطبيق ============
function initializeApp() {
    updateStatusBar();
    navigateTo('news');
    setupNavigation();
    startChatPolling();
}

// ============ تحديث شريط الحالة ============
function updateStatusBar() {
    nationNameDisplay.textContent = currentNation.nationName;
    budgetDisplay.textContent = formatNumber(currentNation.budget) + '$';
}

// ============ نظام التنقل ============
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-button');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const screen = button.dataset.screen;
            navigateTo(screen);
            
            navButtons.forEach(b => b.classList.remove('active'));
            button.classList.add('active');
        });
    });
}

function navigateTo(screen) {
    currentScreen = screen;
    
    switch(screen) {
        case 'news':
            loadNewsScreen();
            break;
        case 'chat':
            loadChatScreen();
            break;
        case 'military':
            loadMilitaryScreen();
            break;
        case 'economy':
            loadEconomyScreen();
            break;
        case 'diplomacy':
            loadDiplomacyScreen();
            break;
    }
}

// ============ شاشة الأرشيف ============
async function loadNewsScreen() {
    try {
        const response = await fetch(`${API_BASE}/news`, {
            headers: { 'session-id': currentSession }
        });
        const news = await response.json();
        
        let html = '';
        
        // لوحة تحكم الرئيس
        if (currentNation.role === 'president') {
            html += `
                <div class="admin-panel">
                    <div class="admin-title">لوحة القيادة - نشر بيان رسمي</div>
                    <div class="input-group">
                        <label class="input-label">عنوان البيان</label>
                        <input type="text" id="newsTitle" class="military-input" placeholder="عنوان البيان الرسمي">
                    </div>
                    <div class="input-group">
                        <label class="input-label">نص البيان</label>
                        <textarea id="newsContent" class="military-input" rows="4" placeholder="نص البيان الرسمي"></textarea>
                    </div>
                    <div class="input-group">
                        <label>
                            <input type="checkbox" id="newsPinned"> تثبيت البيان
                        </label>
                    </div>
                    <button onclick="publishNews()" class="military-button">نشر البيان الرسمي</button>
                </div>
            `;
        }
        
        html += '<div class="news-container">';
        
        news.forEach(article => {
            const pinnedClass = article.pinned ? 'pinned' : '';
            const pinBadge = article.pinned ? '<span class="pin-badge">مثبت</span>' : '';
            
            html += `
                <article class="news-article ${pinnedClass}">
                    <div class="news-header">
                        <h3 class="news-title">${article.title}</h3>
                        ${pinBadge}
                    </div>
                    <div class="news-meta">
                        <span>${formatDate(article.timestamp)}</span>
                        <span>${getNationName(article.author)}</span>
                    </div>
                    <div class="news-content">${article.content}</div>
                    <div class="news-footer">
                        <span class="news-author">${getNationName(article.author)}</span>
                        <span>رقم ${article.id}</span>
                    </div>
                </article>
            `;
        });
        
        html += '</div>';
        mainContent.innerHTML = html;
    } catch (error) {
        mainContent.innerHTML = '<div class="error-message">خطأ في تحميل الأرشيف</div>';
    }
}

async function publishNews() {
    const title = document.getElementById('newsTitle').value;
    const content = document.getElementById('newsContent').value;
    const pinned = document.getElementById('newsPinned').checked;
    
    if (!title || !content) {
        alert('يرجى ملء جميع الحقول');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/news`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'session-id': currentSession
            },
            body: JSON.stringify({ title, content, pinned })
        });
        
        if (response.ok) {
            loadNewsScreen();
        }
    } catch (error) {
        alert('خطأ في نشر البيان');
    }
}

// ============ شاشة المراسلات ============
function loadChatScreen() {
    const html = `
        <div class="chat-container">
            <div class="chat-messages" id="chatMessages"></div>
            <div class="chat-input-area">
                <input type="text" id="chatInput" class="chat-input" placeholder="اكتب رسالتك الدبلوماسية...">
                <button onclick="sendMessage()" class="send-button">إرسال</button>
            </div>
        </div>
    `;
    
    mainContent.innerHTML = html;
    loadChatMessages();
}

async function loadChatMessages() {
    try {
        const response = await fetch(`${API_BASE}/chat`, {
            headers: { 'session-id': currentSession }
        });
        const messages = await response.json();
        
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        let html = '';
        messages.forEach(msg => {
            let messageClass = '';
            if (msg.type === 'alert') messageClass = 'system-alert';
            else if (msg.type === 'economic') messageClass = 'economic-alert';
            else if (msg.type === 'military') messageClass = 'military-alert';
            
            html += `
                <div class="chat-message ${messageClass}">
                    <div class="message-header">
                        <span class="message-sender">${msg.sender} - ${getNationName(msg.nation)}</span>
                        <span class="message-time">${formatTime(msg.timestamp)}</span>
                    </div>
                    <div class="message-body">${msg.message}</div>
                </div>
            `;
        });
        
        chatMessages.innerHTML = html;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('خطأ في تحميل الرسائل');
    }
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    try {
        await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'session-id': currentSession
            },
            body: JSON.stringify({ message })
        });
        
        input.value = '';
        loadChatMessages();
    } catch (error) {
        alert('خطأ في إرسال الرسالة');
    }
}

function startChatPolling() {
    if (chatPollingInterval) clearInterval(chatPollingInterval);
    
    chatPollingInterval = setInterval(() => {
        if (currentScreen === 'chat') {
            loadChatMessages();
        }
    }, 3000);
}

// ============ شاشة المتجر العسكري ============
async function loadMilitaryScreen() {
    try {
        const response = await fetch(`${API_BASE}/store`, {
            headers: { 'session-id': currentSession }
        });
        const data = await response.json();
        
        let html = `
            <div class="store-header" style="margin-bottom: 20px;">
                <h2 style="color: var(--accent-gold);">مستودع السلاح الفيدرالي</h2>
                <p style="color: var(--text-secondary);">الميزانية المتاحة: ${formatNumber(data.budget)}$</p>
            </div>
            <div class="store-container">
        `;
        
        data.weapons.forEach(weapon => {
            html += `
                <div class="weapon-card">
                    <div class="weapon-header">
                        <h3 class="weapon-name">${weapon.name}</h3>
                        <span class="weapon-type">${weapon.type}</span>
                    </div>
                    <div class="weapon-stats">
                        <div class="stat-item">
                            <span>القوة التدميرية</span>
                            <span class="stat-value">${weapon.damage}</span>
                        </div>
                        <div class="stat-item">
                            <span>الدفاع</span>
                            <span class="stat-value">${weapon.defense}</span>
                        </div>
                    </div>
                    <div class="weapon-footer">
                        <div>
                            <div class="weapon-price">${formatNumber(weapon.price)}$</div>
                            <div class="stock-info">المخزون: ${weapon.stock}</div>
                        </div>
                        <button onclick="purchaseWeapon(${weapon.id})" class="buy-button" ${weapon.stock === 0 ? 'disabled' : ''}>
                            شراء
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        mainContent.innerHTML = html;
    } catch (error) {
        mainContent.innerHTML = '<div class="error-message">خطأ في تحميل المتجر</div>';
    }
}

async function purchaseWeapon(weaponId) {
    const quantity = prompt('أدخل الكمية المطلوبة:');
    if (!quantity || quantity <= 0) return;
    
    try {
        const response = await fetch(`${API_BASE}/store/purchase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'session-id': currentSession
            },
            body: JSON.stringify({ weaponId, quantity: parseInt(quantity) })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentNation.budget = data.remainingBudget;
            updateStatusBar();
            loadMilitaryScreen();
            alert('تمت عملية الشراء بنجاح');
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('خطأ في عملية الشراء');
    }
}

// ============ شاشة الاقتصاد ============
async function loadEconomyScreen() {
    try {
        const response = await fetch(`${API_BASE}/economy`, {
            headers: { 'session-id': currentSession }
        });
        const data = await response.json();
        
        let html = `
            <div class="economy-container">
                <h2 style="color: var(--accent-gold);">الخزانة الوطنية</h2>
                
                <div class="resources-grid">
                    <div class="resource-card">
                        <div class="resource-name">النفط</div>
                        <div class="resource-value">${data.resources.oil}</div>
                    </div>
                    <div class="resource-card">
                        <div class="resource-name">الصلب</div>
                        <div class="resource-value">${data.resources.steel}</div>
                    </div>
                    <div class="resource-card">
                        <div class="resource-name">المؤن</div>
                        <div class="resource-value">${data.resources.food}</div>
                    </div>
                </div>
                
                <div class="trade-form">
                    <h3 style="color: var(--accent-gold); margin-bottom: 15px;">إتفاقية تجارية</h3>
                    <div class="input-group">
                        <label class="input-label">الدولة المستهدفة</label>
                        <select id="tradeTarget" class="military-select">
                            <option value="usa">الولايات المتحدة</option>
                            <option value="malines">دولة مالينس</option>
                            <option value="soviet">الاتحاد السوفيتي</option>
                            <option value="china">الإمبراطورية الصينية</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">المورد</label>
                        <select id="tradeResource" class="military-select">
                            <option value="oil">النفط</option>
                            <option value="steel">الصلب</option>
                            <option value="food">المؤن</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">الكمية</label>
                        <input type="number" id="tradeAmount" class="military-input" min="1">
                    </div>
                    <div class="input-group">
                        <label class="input-label">السعر</label>
                        <input type="number" id="tradePrice" class="military-input" min="1000">
                    </div>
                    <button onclick="executeTrade()" class="military-button">تنفيذ الصفقة</button>
                </div>
            </div>
        `;
        
        mainContent.innerHTML = html;
    } catch (error) {
        mainContent.innerHTML = '<div class="error-message">خطأ في تحميل البيانات الاقتصادية</div>';
    }
}

async function executeTrade() {
    const targetNation = document.getElementById('tradeTarget').value;
    const resource = document.getElementById('tradeResource').value;
    const amount = parseInt(document.getElementById('tradeAmount').value);
    const price = parseInt(document.getElementById('tradePrice').value);
    
    if (!amount || !price) {
        alert('يرجى ملء جميع الحقول');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/economy/trade`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'session-id': currentSession
            },
            body: JSON.stringify({ targetNation, resource, amount, price })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('تمت الصفقة التجارية بنجاح');
            loadEconomyScreen();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('خطأ في تنفيذ الصفقة');
    }
}

// ============ شاشة الدبلوماسية ============
async function loadDiplomacyScreen() {
    try {
        const [diplomacyRes, statsRes] = await Promise.all([
            fetch(`${API_BASE}/diplomacy`, {
                headers: { 'session-id': currentSession }
            }),
            fetch(`${API_BASE}/statistics`, {
                headers: { 'session-id': currentSession }
            })
        ]);
        
        const diplomacy = await diplomacyRes.json();
        const stats = await statsRes.json();
        
        let html = `
            <div class="diplomacy-container">
                <h2 style="color: var(--accent-gold);">العلاقات الدبلوماسية</h2>
                <div class="relations-list">
        `;
        
        for (let nation in diplomacy.relations) {
            const relation = diplomacy.relations[nation];
            html += `
                <div class="relation-card">
                    <div>
                        <div class="relation-name">${stats[nation].name}</div>
                        <div class="relation-bar">
                            <div class="relation-fill" style="width: ${relation}%"></div>
                        </div>
                    </div>
                    <div class="relation-score">${relation}/100</div>
                </div>
            `;
        }
        
        html += `
                </div>
                <div style="margin-top: 30px;">
                    <h3 style="color: var(--accent-gold); margin-bottom: 15px;">توقيع معاهدة</h3>
                    <div class="input-group">
                        <label class="input-label">الدولة المستهدفة</label>
                        <select id="treatyTarget" class="military-select">
                            <option value="usa">الولايات المتحدة</option>
                            <option value="malines">دولة مالينس</option>
                            <option value="soviet">الاتحاد السوفيتي</option>
                            <option value="china">الإمبراطورية الصينية</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">نوع المعاهدة</label>
                        <select id="treatyType" class="military-select">
                            <option value="عدم اعتداء">عدم اعتداء</option>
                            <option value="تعاون عسكري">تعاون عسكري</option>
                            <option value="تحالف استراتيجي">تحالف استراتيجي</option>
                            <option value="اتفاقية تجارية">اتفاقية تجارية</option>
                        </select>
                    </div>
                    <button onclick="signTreaty()" class="military-button">توقيع المعاهدة</button>
                </div>
            </div>
        `;
        
        mainContent.innerHTML = html;
    } catch (error) {
        mainContent.innerHTML = '<div class="error-message">خطأ في تحميل البيانات الدبلوماسية</div>';
    }
}

async function signTreaty() {
    const targetNation = document.getElementById('treatyTarget').value;
    const treatyType = document.getElementById('treatyType').value;
    
    if (targetNation === currentNation.nation) {
        alert('لا يمكن توقيع معاهدة مع نفس الدولة');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/diplomacy/treaty`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'session-id': currentSession
            },
            body: JSON.stringify({ targetNation, treatyType })
        });
        
        if (response.ok) {
            alert('تم توقيع المعاهدة بنجاح');
            loadDiplomacyScreen();
        }
    } catch (error) {
        alert('خطأ في توقيع المعاهدة');
    }
}

// ============ دوال مساعدة ============
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getNationName(nationCode) {
    const nations = {
        'usa': 'الولايات المتحدة',
        'malines': 'دولة مالينس',
        'soviet': 'الاتحاد السوفيتي',
        'china': 'الإمبراطورية الصينية',
        'system': 'النظام'
    };
    return nations[nationCode] || nationCode;
}