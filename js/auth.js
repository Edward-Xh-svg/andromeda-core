// ---------- عناصر DOM ----------
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutLink = document.getElementById('logoutLink');
const userInfo = document.getElementById('userInfo');

// ---------- تسجيل الدخول ----------
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const message = document.getElementById('loginMessage');

        try {
            const data = await login(username, password);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/index.html';
            } else {
                message.textContent = 'خطأ في اسم المستخدم أو كلمة المرور';
                message.style.color = 'red';
            }
        } catch (error) {
            message.textContent = 'حدث خطأ في الاتصال';
            message.style.color = 'red';
        }
    });
}

// ---------- إنشاء حساب ----------
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const message = document.getElementById('registerMessage');

        try {
            const data = await register(username, email, password);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/index.html';
            } else {
                message.textContent = 'فشل إنشاء الحساب. حاول مرة أخرى.';
                message.style.color = 'red';
            }
        } catch (error) {
            message.textContent = 'حدث خطأ في الاتصال';
            message.style.color = 'red';
        }
    });
}

// ---------- تسجيل الخروج ----------
if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
}

// ---------- عرض معلومات المستخدم ----------
async function displayUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && userInfo) {
        userInfo.textContent = `مرحباً، ${user.username}`;
    }
}

// ---------- التحقق من المصادقة ----------
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token && window.location.pathname !== '/login.html' && window.location.pathname !== '/register.html') {
        window.location.href = '/login.html';
    }
}

// ---------- تشغيل عند تحميل الصفحة ----------
document.addEventListener('DOMContentLoaded', () => {
    displayUserInfo();
    checkAuth();
});