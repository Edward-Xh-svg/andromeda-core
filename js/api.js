// ---------- API CONFIG ----------
const API_BASE = '/api';

// ---------- دالة مساعدة للطلبات ----------
async function apiRequest(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    return data;
}

// ---------- دوال المصادقة ----------
async function register(username, email, password) {
    return apiRequest('/auth/register', 'POST', { username, email, password });
}

async function login(username, password) {
    return apiRequest('/auth/login', 'POST', { username, password });
}

async function getCurrentUser() {
    return apiRequest('/auth/me', 'GET');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// ---------- دوال المنشورات ----------
async function getPosts() {
    return apiRequest('/posts', 'GET');
}

async function createPost(content, image = null) {
    return apiRequest('/posts', 'POST', { content, image });
}

async function likePost(postId) {
    return apiRequest(`/posts/${postId}/like`, 'POST');
}

async function addComment(postId, content) {
    return apiRequest(`/posts/${postId}/comment`, 'POST', { content });
}

// ---------- دوال الرسائل ----------
async function getMessages() {
    return apiRequest('/messages', 'GET');
}

async function sendMessage(receiverId, content) {
    return apiRequest('/messages', 'POST', { receiverId, content });
}

// ---------- دوال المستخدمين ----------
async function getUsers() {
    return apiRequest('/users', 'GET');
}

async function getUserProfile(userId) {
    return apiRequest(`/users/${userId}`, 'GET');
}