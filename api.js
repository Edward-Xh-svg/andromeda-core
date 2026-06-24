// ============================================================
// api.js — Centralized API client for Malines Pentagon
// ============================================================

const API = (() => {
  const BASE = '/api';

  function getToken() {
    return localStorage.getItem('mp_token');
  }

  function getUser() {
    const raw = localStorage.getItem('mp_user');
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  }

  async function request(method, path, body, isFormData = false) {
    const headers = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    if (!isFormData && body) {
      headers['Content-Type'] = 'application/json';
    }

    const opts = {
      method,
      headers,
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    };

    const res = await fetch(BASE + path, opts);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `خطأ في الاتصال (${res.status})`);
    }

    return data;
  }

  return {
    getToken,
    getUser,

    // ── Auth ──
    auth: {
      register: (payload) => request('POST', '/auth/register', payload),
      login:    (payload) => request('POST', '/auth/login', payload),
      me:       ()        => request('GET',  '/auth/me'),
    },

    // ── Posts ──
    posts: {
      getAll:   (page = 1) => request('GET', `/posts?page=${page}`),
      getOne:   (id)       => request('GET', `/posts/${id}`),
      create:   (fd)       => request('POST', '/posts', fd, true),
      like:     (id)       => request('POST', `/posts/${id}/like`),
      delete:   (id)       => request('DELETE', `/posts/${id}`),
      getByUser:(uid)      => request('GET', `/posts/user/${uid}`),
    },

    // ── Comments ──
    comments: {
      getByPost: (postId)         => request('GET',  `/posts/${postId}/comments`),
      create:    (postId, payload) => request('POST', `/posts/${postId}/comments`, payload),
      delete:    (id)              => request('DELETE', `/comments/${id}`),
    },

    // ── Messages ──
    messages: {
      getConversations: ()          => request('GET',  '/messages/conversations'),
      getThread:        (userId)    => request('GET',  `/messages/thread/${userId}`),
      send:             (payload)   => request('POST', '/messages', payload),
    },

    // ── Users ──
    users: {
      getById:  (id)   => request('GET', `/users/${id}`),
      search:   (q)    => request('GET', `/users/search?q=${encodeURIComponent(q)}`),
      update:   (data) => request('PUT', '/users/me', data),
      getStats: ()     => request('GET', '/users/stats'),
    },
  };
})();

// ── Toast utility ──
function showToast(message, duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Format date (Arabic-friendly) ──
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60)   return 'الآن';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;

  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Initials from name ──
function getInitials(name = '') {
  return name.split(' ').map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
}

// ── Guard: redirect if not logged in ──
function requireAuth() {
  if (!API.getToken()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// ── Guard: redirect if already logged in ──
function redirectIfAuth() {
  if (API.getToken()) {
    window.location.href = '/index.html';
  }
}
