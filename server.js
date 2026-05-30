const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Data File Paths ---
const COUNTRIES_FILE = path.join(__dirname, 'data', 'countries.json');
const ARSENAL_FILE = path.join(__dirname, 'data', 'arsenal.json');
const CHAT_FILE = path.join(__dirname, 'data', 'chat_log.json');

// --- Helper Functions ---
function readJsonFile(filePath) {
    try {
        const rawData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return null;
    }
}

function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        return false;
    }
}

// Initialize secret codes and chat log file on server start
function initializeGameData() {
    let countries = readJsonFile(COUNTRIES_FILE);
    if (!countries) {
        console.error("CRITICAL: Could not load countries data.");
        return;
    }

    let hasUpdated = false;
    const countriesWithNullCode = countries.filter(c => c.secret_code === null);
    
    if (countriesWithNullCode.length > 0) {
        console.log(`Generating secret codes for ${countriesWithNullCode.length} nations...`);
        countries = countries.map(country => {
            if (country.secret_code === null) {
                let newCode;
                do {
                    newCode = String(Math.floor(1000000 + Math.random() * 9000000));
                } while (countries.some(c => c.secret_code === newCode));
                console.log(`   - ${country.name}: ${newCode}`);
                return { ...country, secret_code: newCode };
            }
            return country;
        });
        hasUpdated = true;
    }

    if (hasUpdated) {
        if (writeJsonFile(COUNTRIES_FILE, countries)) {
            console.log("Secret codes generated and saved successfully.");
        } else {
            console.error("Failed to save updated countries with secret codes.");
        }
    } else {
        console.log("All countries already have secret codes.");
    }

    // Initialize chat log if not exists
    if (!fs.existsSync(CHAT_FILE)) {
        const initialChat = [
            {
                timestamp: new Date().toISOString(),
                sender: "النظام المركزي",
                senderId: "system",
                message: "[إشارة بدء التشغيل] أثير الاتصالات الآن تحت مراقبة الإدارة الفيدرالية.",
                type: "system"
            }
        ];
        writeJsonFile(CHAT_FILE, initialChat);
        console.log("Chat log initialized.");
    }
}

// --- API Endpoints ---

// 1. Login Endpoint
app.post('/api/login', (req, res) => {
    const { countryName, secretCode } = req.body;

    if (!countryName || !secretCode) {
        return res.status(400).json({ success: false, message: "مطلوب اسم الدولة والرمز السري." });
    }

    const countries = readJsonFile(COUNTRIES_FILE);
    if (!countries) {
        return res.status(500).json({ success: false, message: "فشل في قراءة بيانات الخادم." });
    }

    const country = countries.find(c => c.name === countryName && c.secret_code === secretCode);

    if (country) {
        console.log(`Successful login: ${country.name} (${country.name_ar})`);
        return res.json({
            success: true,
            message: `مرحباً بك، قائد ${country.name_ar}. القيادة المركزية جاهزة.`,
            country: {
                id: country.id,
                name: country.name,
                name_ar: country.name_ar,
                role: country.role,
                role_ar: country.role_ar,
                budget: country.budget,
                arsenal: country.arsenal,
                css_class: country.css_class
            }
        });
    } else {
        console.log(`Failed login attempt: ${countryName} with code ${secretCode}`);
        return res.status(401).json({ success: false, message: "فشل المصادقة: اسم الدولة أو الرمز السري غير صحيح." });
    }
});

// 2. Get All Countries Data (for espionage and general info)
app.get('/api/countries', (req, res) => {
    const countries = readJsonFile(COUNTRIES_FILE);
    if (!countries) {
        return res.status(500).json({ success: false, message: "فشل في جلب بيانات الدول." });
    }
    // Return only essential public info for other players
    const publicData = countries.map(({ secret_code, ...rest }) => rest);
    res.json({ success: true, data: publicData });
});

// 3. Get Full Arsenal (Global Market)
app.get('/api/arsenal', (req, res) => {
    const arsenal = readJsonFile(ARSENAL_FILE);
    if (!arsenal) {
        return res.status(500).json({ success: false, message: "فشل في جلب بيانات المستودع." });
    }
    res.json({ success: true, data: arsenal });
});

// 4. Purchase Unit Endpoint
app.post('/api/purchase', (req, res) => {
    const { countryId, itemId, quantity } = req.body;
    const purchaseQuantity = parseInt(quantity, 10) || 1;

    if (!countryId || !itemId || purchaseQuantity < 1) {
        return res.status(400).json({ success: false, message: "بيانات شراء غير مكتملة." });
    }

    let countries = readJsonFile(COUNTRIES_FILE);
    let arsenal = readJsonFile(ARSENAL_FILE);
    if (!countries || !arsenal) {
        return res.status(500).json({ success: false, message: "فشل في قراءة بيانات الخادم." });
    }

    const countryIndex = countries.findIndex(c => c.id === countryId);
    if (countryIndex === -1) {
        return res.status(404).json({ success: false, message: "الدولة غير موجودة." });
    }

    const itemIndex = arsenal.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
        return res.status(404).json({ success: false, message: "السلاح غير موجود في المستودع." });
    }

    const country = countries[countryIndex];
    const item = arsenal[itemIndex];
    const totalCost = item.price_per_unit * purchaseQuantity;

    // Check 1: Budget
    if (country.budget < totalCost) {
        return res.status(400).json({
            success: false,
            message: `الميزانية غير كافية! تحتاج إلى $${totalCost.toLocaleString()} لكن رصيدك هو $${country.budget.toLocaleString()}.`
        });
    }

    // Check 2: Global Stock (Ignore for intelligence missions where stock is -1)
    if (item.global_stock !== -1 && item.global_stock < purchaseQuantity) {
        return res.status(400).json({
            success: false,
            message: `المخزون العالمي غير كاف! متاح: ${item.global_stock}، طلبك: ${purchaseQuantity}.`
        });
    }

    // --- Execute Transaction ---
    // Deduct budget
    countries[countryIndex].budget -= totalCost;

    // Update arsenal for the country
    const existingUnitIndex = countries[countryIndex].arsenal.findIndex(a => a.itemId === itemId);
    if (existingUnitIndex !== -1) {
        countries[countryIndex].arsenal[existingUnitIndex].quantity += purchaseQuantity;
    } else {
        countries[countryIndex].arsenal.push({
            itemId: itemId,
            name: item.name,
            name_ar: item.name_ar,
            icon: item.icon,
            quantity: purchaseQuantity
        });
    }

    // Update global stock if applicable
    if (item.global_stock !== -1) {
        arsenal[itemIndex].global_stock -= purchaseQuantity;
    }

    // Save updated data
    if (!writeJsonFile(COUNTRIES_FILE, countries) || !writeJsonFile(ARSENAL_FILE, arsenal)) {
        return res.status(500).json({ success: false, message: "فشل في حفظ المعاملة. حاول مرة أخرى." });
    }

    // Broadcast purchase to chat log
    const chatLog = readJsonFile(CHAT_FILE) || [];
    const transactionMessage = {
        timestamp: new Date().toISOString(),
        sender: country.name,
        senderId: country.id,
        type: "military_transaction",
        css_class: country.css_class,
        message: `[بلاغ فيدرالي] قامت ${country.name} بإنفاق $${totalCost.toLocaleString()} لشراء ${purchaseQuantity} ${item.name_ar} (${item.name}).`
    };
    chatLog.push(transactionMessage);
    // Keep only last 200 messages
    while (chatLog.length > 200) {
        chatLog.shift();
    }
    writeJsonFile(CHAT_FILE, chatLog);

    console.log(`TRANSACTION: ${country.name} bought ${purchaseQuantity}x ${item.name} for $${totalCost.toLocaleString()}. New budget: $${countries[countryIndex].budget.toLocaleString()}`);
    res.json({
        success: true,
        message: `تمت الصفقة بنجاح! اشتريت ${purchaseQuantity} ${item.name_ar}.`,
        newBudget: countries[countryIndex].budget,
        newArsenal: countries[countryIndex].arsenal
    });
});

// 5. Espionage Endpoint
app.post('/api/espionage', (req, res) => {
    const { spyCountryId, targetCountryId } = req.body;

    if (!spyCountryId || !targetCountryId) {
        return res.status(400).json({ success: false, message: "بيانات المهمة غير مكتملة." });
    }
    if (spyCountryId === targetCountryId) {
        return res.status(400).json({ success: false, message: "لا يمكنك التجسس على نفسك، أيها القائد." });
    }

    let countries = readJsonFile(COUNTRIES_FILE);
    if (!countries) return res.status(500).json({ success: false, message: "فشل في تحميل البيانات." });

    const spyCountry = countries.find(c => c.id === spyCountryId);
    const targetCountry = countries.find(c => c.id === targetCountryId);

    if (!spyCountry || !targetCountry) {
        return res.status(404).json({ success: false, message: "إحدى الدول غير موجودة." });
    }

    const missionCost = 35000;
    if (spyCountry.budget < missionCost) {
        return res.status(400).json({ success: false, message: `فشل تمويل المهمة. أنت بحاجة إلى $${missionCost.toLocaleString()}.` });
    }

    // Execute Mission
    const spyIndex = countries.findIndex(c => c.id === spyCountryId);
    countries[spyIndex].budget -= missionCost;
    writeJsonFile(COUNTRIES_FILE, countries);

    // Simulate a 20% failure chance
    const missionSuccess = Math.random() > 0.2;

    if (missionSuccess) {
        // Calculate total army size
        let totalUnits = 0;
        targetCountry.arsenal.forEach(unit => totalUnits += unit.quantity);

        const intelMessage = {
            timestamp: new Date().toISOString(),
            sender: "جهاز المخابرات المركزية",
            senderId: "intel_service",
            type: "intel_success",
            message: `[مهمة سرية ناجحة] تم اختراق خزينة ${targetCountry.name}. الميزانية الحالية: $${targetCountry.budget.toLocaleString()}. حجم القوات: ${totalUnits} قطعة.`
        };

        // Log to chat
        const chatLog = readJsonFile(CHAT_FILE) || [];
        const publicLeakMessage = {
            timestamp: new Date().toISOString(),
            sender: "مصدر استخباراتي مجهول",
            senderId: "anonymous_leak",
            type: "info_leak",
            message: `[تسريب إخباري] تقارير غير مؤكدة تشير إلى اختراق أمني استهدف البيانات المالية لـ ${targetCountry.name}.`
        };
        chatLog.push(publicLeakMessage);
        chatLog.push(intelMessage);
        while (chatLog.length > 200) chatLog.shift();
        writeJsonFile(CHAT_FILE, chatLog);

        return res.json({
            success: true,
            intel: {
                targetName: targetCountry.name,
                targetBudget: targetCountry.budget,
                targetArsenal: targetCountry.arsenal,
                totalUnits: totalUnits
            },
            message: "نجحت المهمة! تم الحصول على المعلومات."
        });
    } else {
        // Mission failed
        const failMessage = {
            timestamp: new Date().toISOString(),
            sender: "جهاز المخابرات المركزية",
            senderId: "intel_service",
            type: "intel_failure",
            message: `[فشل المهمة] تم كشف عملائنا وفقدان الاتصال بهم قبل اختراق دفاعات ${targetCountry.name}.`
        };
        const chatLog = readJsonFile(CHAT_FILE) || [];
        chatLog.push(failMessage);
        while (chatLog.length > 200) chatLog.shift();
        writeJsonFile(CHAT_FILE, chatLog);

        return res.json({
            success: false,
            message: "فشلت المهمة. تم القبض على العملاء أو قتلهم. لم يتم الحصول على أي معلومات."
        });
    }
});

// 6. Chat Endpoints
app.get('/api/chat', (req, res) => {
    const chatLog = readJsonFile(CHAT_FILE) || [];
    // Return last 100 messages for performance
    const recentChat = chatLog.slice(-100);
    res.json({ success: true, data: recentChat });
});

app.post('/api/chat', (req, res) => {
    const { countryId, countryName, message, cssClass } = req.body;

    if (!countryId || !countryName || !message || message.trim() === '') {
        return res.status(400).json({ success: false, message: "بيانات الرسالة غير مكتملة." });
    }

    const chatLog = readJsonFile(CHAT_FILE) || [];
    const newMessage = {
        timestamp: new Date().toISOString(),
        sender: countryName,
        senderId: countryId,
        type: "diplomatic",
        css_class: cssClass || "",
        message: message.trim()
    };
    chatLog.push(newMessage);
    // Keep only last 200 messages
    while (chatLog.length > 200) chatLog.shift();
    if (writeJsonFile(CHAT_FILE, chatLog)) {
        res.json({ success: true, data: newMessage });
    } else {
        res.status(500).json({ success: false, message: "فشل في إرسال البرقية." });
    }
});

// 7. Update Country Data (for front-end polling)
app.post('/api/country/update', (req, res) => {
    const { countryId } = req.body;
    const countries = readJsonFile(COUNTRIES_FILE);
    if (!countries) return res.status(500).json({ success: false, message: "خطأ في السيرفر." });

    const country = countries.find(c => c.id === countryId);
    if (!country) return res.status(404).json({ success: false, message: "دولة غير موجودة." });

    res.json({
        success: true,
        budget: country.budget,
        arsenal: country.arsenal
    });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`\n--- SOVEREIGN 1926 CENTRAL COMMAND ---`);
    console.log(`Server Operational on Port: ${PORT}`);
    console.log(`Encryption: ACTIVE`);
    console.log(`---------------------------------------\n`);
    initializeGameData();
});