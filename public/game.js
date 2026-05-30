/**
 * ==========================================
 * SOVEREIGN 1926 - GAME ENGINE
 * ==========================================
 * Central orchestrator connecting UI, API, and game logic.
 */

const GAME = {
    currentCountry: null,
    allCountries: [],
    arsenal: [],
    chatInterval: null,
    dataInterval: null,

    /**
     * Initialize the game after page load.
     */
    async init() {
        UI.init();
        
        // Load initial data for login dropdown
        try {
            const countriesRes = await API.getCountries();
            if (countriesRes.success) {
                this.allCountries = countriesRes.data;
                UI.populateCountrySelects(this.allCountries);
            }
        } catch (err) {
            console.error('Failed to load countries:', err);
        }

        // Bind login button
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('secret-code').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Bind chat
        document.getElementById('send-chat-btn').addEventListener('click', () => this.handleSendChat());
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendChat();
        });

        // Bind espionage
        document.getElementById('espionage-btn').addEventListener('click', () => this.handleEspionage());

        // Show login screen
        UI.showScreen('screen-login');
    },

    /**
     * Handle login process.
     */
    async handleLogin() {
        const countrySelect = document.getElementById('country-select');
        const codeInput = document.getElementById('secret-code');
        
        const selectedId = countrySelect.value;
        const secretCode = codeInput.value.trim();

        if (!selectedId || secretCode.length !== 7) {
            UI.showLoginError('يجب اختيار الدولة وإدخال الرمز السري المكون من 7 أرقام.');
            return;
        }

        // Find country name from ID
        const countryData = this.allCountries.find(c => c.id === selectedId);
        if (!countryData) {
            UI.showLoginError('الدولة المختارة غير صالحة.');
            return;
        }

        try {
            const res = await API.login(countryData.name, secretCode);
            if (res.success) {
                this.currentCountry = res.country;
                UI.updateHUD(this.currentCountry);
                UI.showScreen('screen-main');
                UI.showSubScreen('screen-market');
                
                // Load game data
                await this.loadGameData();
                
                // Start polling intervals
                this.startPolling();
                
                UI.playSound('success');
            } else {
                UI.showLoginError(res.message || 'فشل تسجيل الدخول.');
            }
        } catch (err) {
            UI.showLoginError('خطأ في الاتصال بالقيادة المركزية.');
            console.error(err);
        }
    },

    /**
     * Load arsenal and initial data after login.
     */
    async loadGameData() {
        try {
            const arsenalRes = await API.getArsenal();
            if (arsenalRes.success) {
                this.arsenal = arsenalRes.data;
                UI.renderMarket(this.arsenal);
            }

            // Refresh countries list
            const countriesRes = await API.getCountries();
            if (countriesRes.success) {
                this.allCountries = countriesRes.data;
                UI.populateCountrySelects(this.allCountries);
            }

            // Load chat history
            const chatRes = await API.getChat();
            if (chatRes.success) {
                document.getElementById('chat-log').innerHTML = '';
                chatRes.data.forEach(msg => UI.appendChatMessage(msg));
            }

            // Update own army display
            UI.renderArmy(this.currentCountry.arsenal);
        } catch (err) {
            console.error('Failed to load game data:', err);
        }
    },

    /**
     * Start polling for live updates.
     */
    startPolling() {
        // Clear any existing intervals
        if (this.chatInterval) clearInterval(this.chatInterval);
        if (this.dataInterval) clearInterval(this.dataInterval);

        // Poll chat every 2.5 seconds
        this.chatInterval = setInterval(async () => {
            if (!this.currentCountry) return;
            try {
                const chatRes = await API.getChat();
                if (chatRes.success) {
                    const currentMsgCount = document.getElementById('chat-log').childElementCount;
                    if (chatRes.data.length > currentMsgCount) {
                        // Append new messages
                        const newMessages = chatRes.data.slice(currentMsgCount);
                        newMessages.forEach(msg => UI.appendChatMessage(msg));
                    }
                }
            } catch (err) { /* silent */ }
        }, 2500);

        // Poll country data (budget/arsenal) every 3 seconds
        this.dataInterval = setInterval(async () => {
            if (!this.currentCountry) return;
            try {
                const updateRes = await API.updateCountry(this.currentCountry.id);
                if (updateRes.success) {
                    this.currentCountry.budget = updateRes.budget;
                    this.currentCountry.arsenal = updateRes.arsenal;
                    UI.updateHUD(this.currentCountry);
                    
                    // Refresh army display if on that screen
                    if (UI.currentSubScreen === 'screen-army') {
                        UI.renderArmy(this.currentCountry.arsenal);
                    }
                }
            } catch (err) { /* silent */ }
        }, 3000);
    },

    /**
     * Handle purchase of units.
     * @param {string} itemId 
     * @param {number} quantity 
     */
    async handlePurchase(itemId, quantity) {
        if (!this.currentCountry) return;

        try {
            const res = await API.purchase(this.currentCountry.id, itemId, quantity);
            if (res.success) {
                // Update local data immediately
                this.currentCountry.budget = res.newBudget;
                this.currentCountry.arsenal = res.newArsenal;
                UI.updateHUD(this.currentCountry);
                UI.renderArmy(this.currentCountry.arsenal);
                
                // Reload market to reflect global stock changes
                const arsenalRes = await API.getArsenal();
                if (arsenalRes.success) {
                    this.arsenal = arsenalRes.data;
                    UI.renderMarket(this.arsenal);
                }
                
                UI.playSound('success');
                alert(res.message);
            } else {
                UI.playSound('error');
                alert(res.message);
            }
        } catch (err) {
            UI.playSound('error');
            alert('فشلت عملية الشراء. حاول مرة أخرى.');
            console.error(err);
        }
    },

    /**
     * Handle espionage mission.
     */
    async handleEspionage() {
        if (!this.currentCountry) return;
        
        const targetSelect = document.getElementById('target-select');
        const targetId = targetSelect.value;
        
        if (!targetId) {
            alert('يجب اختيار الدولة المستهدفة.');
            return;
        }

        if (targetId === this.currentCountry.id) {
            alert('لا يمكنك التجسس على نفسك.');
            return;
        }

        // Disable button temporarily
        const btn = document.getElementById('espionage-btn');
        btn.disabled = true;
        btn.textContent = 'جاري تنفيذ المهمة...';

        try {
            const res = await API.espionage(this.currentCountry.id, targetId);
            
            if (res.success) {
                UI.showIntelResult(res.intel, true);
                UI.playSound('success');
                // Update budget after mission cost
                const updateRes = await API.updateCountry(this.currentCountry.id);
                if (updateRes.success) {
                    this.currentCountry.budget = updateRes.budget;
                    UI.updateHUD(this.currentCountry);
                }
            } else {
                UI.showIntelResult(null, false);
                UI.playSound('error');
                // Still update budget (cost was deducted even if failed)
                const updateRes = await API.updateCountry(this.currentCountry.id);
                if (updateRes.success) {
                    this.currentCountry.budget = updateRes.budget;
                    UI.updateHUD(this.currentCountry);
                }
            }
        } catch (err) {
            UI.playSound('error');
            alert('فشلت المهمة بسبب خطأ في الاتصال.');
            console.error(err);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span class="btn-text">بدء المهمة السرية</span><span class="btn-icon">[!]</span>';
        }
    },

    /**
     * Handle sending a chat message.
     */
    async handleSendChat() {
        if (!this.currentCountry) return;
        
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        try {
            const res = await API.sendChat(
                this.currentCountry.id,
                this.currentCountry.name,
                message,
                this.currentCountry.css_class
            );
            
            if (res.success) {
                UI.appendChatMessage(res.data);
                input.value = '';
                UI.playSound('click');
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    }
};

// Boot the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    GAME.init();
});