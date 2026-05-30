/**
 * ==========================================
 * SOVEREIGN 1926 - API COMMUNICATION LAYER
 * ==========================================
 * Handles all fetch requests to the central server.
 */

const API_BASE = window.location.origin;

const API = {
    /**
     * Authenticate a nation using its name and secret code.
     * @param {string} countryName 
     * @param {string} secretCode 
     * @returns {Promise<object>} response
     */
    async login(countryName, secretCode) {
        const res = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ countryName, secretCode })
        });
        return await res.json();
    },

    /**
     * Fetch all countries (public data).
     * @returns {Promise<object>}
     */
    async getCountries() {
        const res = await fetch(`${API_BASE}/api/countries`);
        return await res.json();
    },

    /**
     * Fetch full arsenal (global market).
     * @returns {Promise<object>}
     */
    async getArsenal() {
        const res = await fetch(`${API_BASE}/api/arsenal`);
        return await res.json();
    },

    /**
     * Purchase a unit from the global market.
     * @param {string} countryId 
     * @param {string} itemId 
     * @param {number} quantity 
     * @returns {Promise<object>}
     */
    async purchase(countryId, itemId, quantity) {
        const res = await fetch(`${API_BASE}/api/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ countryId, itemId, quantity })
        });
        return await res.json();
    },

    /**
     * Execute an espionage mission against a target nation.
     * @param {string} spyCountryId 
     * @param {string} targetCountryId 
     * @returns {Promise<object>}
     */
    async espionage(spyCountryId, targetCountryId) {
        const res = await fetch(`${API_BASE}/api/espionage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spyCountryId, targetCountryId })
        });
        return await res.json();
    },

    /**
     * Fetch chat messages.
     * @returns {Promise<object>}
     */
    async getChat() {
        const res = await fetch(`${API_BASE}/api/chat`);
        return await res.json();
    },

    /**
     * Send a diplomatic message.
     * @param {string} countryId 
     * @param {string} countryName 
     * @param {string} message 
     * @param {string} cssClass 
     * @returns {Promise<object>}
     */
    async sendChat(countryId, countryName, message, cssClass) {
        const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ countryId, countryName, message, cssClass })
        });
        return await res.json();
    },

    /**
     * Update current country data (budget, arsenal).
     * @param {string} countryId 
     * @returns {Promise<object>}
     */
    async updateCountry(countryId) {
        const res = await fetch(`${API_BASE}/api/country/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ countryId })
        });
        return await res.json();
    }
};