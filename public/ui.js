/**
 * ==========================================
 * SOVEREIGN 1926 - UI CONTROLLER
 * ==========================================
 * Manages screen transitions, audio cues, and DOM rendering helpers.
 */

const UI = {
    currentScreen: null,
    currentSubScreen: 'screen-market',

    /**
     * Initialize UI elements and event listeners after DOM load.
     */
    init() {
        this.bindNavigation();
        this.bindLogout();
    },

    /**
     * Switch between main screens (login / main).
     * @param {string} screenId 
     */
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add('active');
            this.currentScreen = screenId;
        }
    },

    /**
     * Switch between sub-screens in the main interface.
     * @param {string} subScreenId 
     */
    showSubScreen(subScreenId) {
        document.querySelectorAll('.sub-screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(subScreenId);
        if (target) {
            target.classList.add('active');
            this.currentSubScreen = subScreenId;
        }
        
        // Update nav buttons active state
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const btnScreen = btn.getAttribute('data-screen');
            if (btnScreen === subScreenId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },

    /**
     * Bind bottom navigation buttons.
     */
    bindNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screenId = btn.getAttribute('data-screen');
                this.showSubScreen(screenId);
                this.playSound('click');
            });
        });
    },

    /**
     * Bind logout button.
     */
    bindLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.playSound('click');
                // Clear session and go to login
                if (GAME && GAME.currentCountry) {
                    GAME.currentCountry = null;
                }
                this.showScreen('screen-login');
                // Reset UI
                document.getElementById('secret-code').value = '';
                document.getElementById('login-error').textContent = '';
            });
        }
    },

    /**
     * Populate country select dropdowns.
     * @param {Array} countries 
     */
    populateCountrySelects(countries) {
        const loginSelect = document.getElementById('country-select');
        const targetSelect = document.getElementById('target-select');
        
        [loginSelect, targetSelect].forEach(select => {
            if (!select) return;
            // Clear existing options except placeholder
            select.innerHTML = '<option value="" disabled selected>-- اختر الدولة --</option>';
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country.id;
                option.textContent = `${country.name} (${country.name_ar})`;
                select.appendChild(option);
            });
        });
    },

    /**
     * Render market items.
     * @param {Array} arsenal 
     */
    renderMarket(arsenal) {
        const container = document.getElementById('market-list');
        if (!container) return;
        
        container.innerHTML = '';
        if (!arsenal || arsenal.length === 0) {
            container.innerHTML = '<p class="empty-state">المستودع الفيدرالي فارغ حالياً.</p>';
            return;
        }

        arsenal.forEach(item => {
            if (item.id === 'intel_mission') return; // Skip intel in market
            
            const card = document.createElement('div');
            card.className = 'unit-card';
            card.innerHTML = `
                <div class="unit-header">
                    <span class="unit-name">[${item.icon}] ${item.name_ar}</span>
                    <span class="unit-type">${item.type_ar}</span>
                </div>
                <div class="unit-details">
                    <span>السعر: <span class="unit-price">$${item.price_per_unit.toLocaleString()}</span></span>
                    <span>المخزون: <span class="unit-stock">${item.global_stock !== -1 ? item.global_stock : 'غير محدود'}</span></span>
                </div>
                <div class="unit-actions">
                    <input type="number" class="unit-qty" value="1" min="1" max="${item.global_stock !== -1 ? item.global_stock : 100}">
                    <button class="buy-btn" data-item-id="${item.id}">شراء</button>
                </div>
                <p style="font-size:0.7rem;color:#666;">${item.description_ar}</p>
            `;
            container.appendChild(card);
        });

        // Attach buy events
        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = btn.getAttribute('data-item-id');
                const qtyInput = btn.parentElement.querySelector('.unit-qty');
                const quantity = parseInt(qtyInput.value, 10) || 1;
                if (GAME && GAME.handlePurchase) {
                    GAME.handlePurchase(itemId, quantity);
                }
            });
        });
    },

    /**
     * Render player's army.
     * @param {Array} arsenal 
     */
    renderArmy(arsenal) {
        const container = document.getElementById('army-list');
        if (!container) return;
        
        container.innerHTML = '';
        if (!arsenal || arsenal.length === 0) {
            container.innerHTML = '<p class="empty-state">لم تقم بشراء أي وحدات بعد. توجه إلى المستودع الفيدرالي للتسليح.</p>';
            return;
        }

        arsenal.forEach(unit => {
            const card = document.createElement('div');
            card.className = 'unit-card';
            card.innerHTML = `
                <div class="unit-header">
                    <span class="unit-name">[${unit.icon}] ${unit.name_ar}</span>
                    <span class="unit-type">العدد: ${unit.quantity}</span>
                </div>
            `;
            container.appendChild(card);
        });
    },

    /**
     * Display intel report.
     * @param {object|null} intel 
     * @param {boolean} success 
     */
    showIntelResult(intel, success) {
        const resultDiv = document.getElementById('intel-result');
        if (!resultDiv) return;
        
        resultDiv.style.display = 'block';
        if (success && intel) {
            resultDiv.style.color = 'var(--hud-green-glow)';
            resultDiv.innerHTML = `
                [نتيجة المهمة: ناجحة]<br>
                الدولة المستهدفة: ${intel.targetName}<br>
                الميزانية المكتشفة: $${intel.targetBudget.toLocaleString()}<br>
                إجمالي القوات: ${intel.totalUnits} قطعة
            `;
        } else {
            resultDiv.style.color = 'var(--alert-red-glow)';
            resultDiv.textContent = '[فشلت المهمة] تم كشف العملاء. لم يتم الحصول على معلومات.';
        }
        setTimeout(() => { resultDiv.style.display = 'none'; }, 15000);
    },

    /**
     * Add a message to the chat log.
     * @param {object} msg 
     */
    appendChatMessage(msg) {
        const log = document.getElementById('chat-log');
        if (!log) return;
        
        const div = document.createElement('div');
        div.className = 'chat-message';
        
        const time = new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour12: false });
        const senderClass = msg.css_class ? ` ${msg.css_class}` : '';
        
        div.innerHTML = `
            <span class="chat-time">[${time}]</span>
            <span class="chat-sender${senderClass}">${msg.sender}:</span>
            <span class="chat-body ${msg.type === 'military_transaction' ? 'system-msg' : ''}">${msg.message}</span>
        `;
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
    },

    /**
     * Update HUD with current country data.
     * @param {object} country 
     */
    updateHUD(country) {
        document.getElementById('hud-nation').textContent = country.name_ar;
        document.getElementById('hud-budget').textContent = `$${country.budget.toLocaleString()}`;
        document.getElementById('setting-id').textContent = country.id;
    },

    /**
     * Play tactical sound effect.
     * @param {string} type - 'click', 'error', 'success'
     */
    playSound(type) {
        const audioMap = {
            'click': 'audio-click',
            'error': 'audio-error',
            'success': 'audio-success'
        };
        const audioId = audioMap[type];
        if (audioId) {
            const audio = document.getElementById(audioId);
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(e => {});
            }
        }
    },

    /**
     * Show login error.
     * @param {string} message 
     */
    showLoginError(message) {
        const errorEl = document.getElementById('login-error');
        if (errorEl) {
            errorEl.textContent = message;
            this.playSound('error');
        }
    }
};