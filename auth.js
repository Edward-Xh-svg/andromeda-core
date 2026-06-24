// ============================================================
// auth.js — Authentication handlers for Malines Pentagon
// ============================================================

const Auth = (() => {
  function saveSession(token, user) {
    localStorage.setItem('mp_token', token);
    localStorage.setItem('mp_user', JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem('mp_token');
    localStorage.removeItem('mp_user');
  }

  function logout() {
    clearSession();
    showToast('تم تسجيل الخروج');
    setTimeout(() => { window.location.href = '/login.html'; }, 600);
  }

  function bindTopbarUser() {
    const user = API.getUser();
    if (!user) return;

    const el = document.getElementById('topbar-username');
    if (el) el.textContent = user.username;

    const av = document.getElementById('topbar-avatar');
    if (av) av.textContent = getInitials(user.full_name || user.username);

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
  }

  // ── Login form ──
  function initLoginForm() {
    redirectIfAuth();
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('login-error');
      const btn   = form.querySelector('button[type="submit"]');

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      if (!username || !password) {
        errEl.textContent = 'يرجى ملء جميع الحقول.';
        errEl.classList.remove('hidden');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'جاري تسجيل الدخول...';
      errEl.classList.add('hidden');

      try {
        const data = await API.auth.login({ username, password });
        saveSession(data.token, data.user);
        window.location.href = '/index.html';
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'تسجيل الدخول';
      }
    });
  }

  // ── Register form ──
  function initRegisterForm() {
    redirectIfAuth();
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('register-error');
      const btn   = form.querySelector('button[type="submit"]');

      const username  = document.getElementById('username').value.trim();
      const email     = document.getElementById('email').value.trim();
      const full_name = document.getElementById('full_name').value.trim();
      const password  = document.getElementById('password').value;
      const password2 = document.getElementById('password2').value;
      const rank      = document.getElementById('rank').value;

      if (!username || !email || !password) {
        errEl.textContent = 'يرجى ملء جميع الحقول المطلوبة.';
        errEl.classList.remove('hidden');
        return;
      }

      if (password !== password2) {
        errEl.textContent = 'كلمتا المرور غير متطابقتين.';
        errEl.classList.remove('hidden');
        return;
      }

      if (password.length < 6) {
        errEl.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.';
        errEl.classList.remove('hidden');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'جاري إنشاء الحساب...';
      errEl.classList.add('hidden');

      try {
        const data = await API.auth.register({ username, email, full_name, password, rank });
        saveSession(data.token, data.user);
        window.location.href = '/index.html';
      } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'إنشاء حساب';
      }
    });
  }

  return { saveSession, clearSession, logout, bindTopbarUser, initLoginForm, initRegisterForm };
})();
