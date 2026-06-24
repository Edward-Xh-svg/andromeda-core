// ============================================================
// messages.js — Private messaging interface
// ============================================================

const Messages = (() => {
  let activeUserId = null;
  let pollInterval = null;
  const currentUser = API.getUser();

  function renderConvoList(convos) {
    const list = document.getElementById('convo-list');
    if (!list) return;

    if (!convos || convos.length === 0) {
      list.innerHTML = `<div style="padding:20px;text-align:center;font-size:13px;color:var(--muted)">لا توجد محادثات بعد.</div>`;
      return;
    }

    list.innerHTML = convos.map(c => `
      <div class="convo-item ${activeUserId === c.user_id ? 'active' : ''}"
           data-userid="${c.user_id}" data-username="${escapeHtml(c.username)}"
           onclick="Messages.openThread(${c.user_id}, '${escapeHtml(c.full_name || c.username)}')">
        <div class="avatar">${getInitials(c.full_name || c.username)}</div>
        <div class="convo-info">
          <div class="convo-name">${escapeHtml(c.full_name || c.username)}</div>
          <div class="convo-preview">${escapeHtml(c.last_message || '')}</div>
        </div>
        <div class="convo-time">${formatDate(c.last_time)}</div>
      </div>
    `).join('');
  }

  async function loadConversations() {
    try {
      const { conversations } = await API.messages.getConversations();
      renderConvoList(conversations);
    } catch (err) {
      console.error(err);
    }
  }

  function renderMessages(messages) {
    const body = document.getElementById('msg-body');
    if (!body) return;

    if (!messages || messages.length === 0) {
      body.innerHTML = `<div class="empty-state"><p>ابدأ المحادثة الآن.</p></div>`;
      return;
    }

    body.innerHTML = messages.map(m => {
      const mine = currentUser && m.sender_id === currentUser.id;
      return `
        <div class="msg-bubble ${mine ? 'sent' : 'received'}">
          ${escapeHtml(m.content)}
          <div class="msg-time">${formatDate(m.created_at)}</div>
        </div>
      `;
    }).join('');

    body.scrollTop = body.scrollHeight;
  }

  async function openThread(userId, displayName) {
    activeUserId = userId;

    // Update header
    const header = document.getElementById('msg-header-name');
    if (header) header.textContent = displayName;

    const panel = document.getElementById('messages-panel');
    if (panel) panel.classList.remove('hidden');

    // Mark active convo
    document.querySelectorAll('.convo-item').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.userid) === userId);
    });

    await fetchThread(userId);

    // Poll for new messages every 5s
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(() => fetchThread(userId), 5000);
  }

  async function fetchThread(userId) {
    try {
      const { messages } = await API.messages.getThread(userId);
      renderMessages(messages);
    } catch (err) {
      console.error(err);
    }
  }

  async function sendMessage() {
    if (!activeUserId) return;

    const input = document.getElementById('msg-input');
    const content = input?.value.trim();
    if (!content) return;

    input.value = '';

    try {
      await API.messages.send({ recipient_id: activeUserId, content });
      await fetchThread(activeUserId);
      await loadConversations();
    } catch (err) {
      showToast(err.message);
    }
  }

  function initNewMessageSearch() {
    const input = document.getElementById('new-msg-search');
    const results = document.getElementById('new-msg-results');
    if (!input) return;

    let timeout;
    input.addEventListener('input', () => {
      clearTimeout(timeout);
      const q = input.value.trim();
      if (!q) { results.innerHTML = ''; return; }

      timeout = setTimeout(async () => {
        try {
          const { users } = await API.users.search(q);
          results.innerHTML = users.map(u => `
            <div class="convo-item" onclick="Messages.startNew(${u.id}, '${escapeHtml(u.full_name || u.username)}')">
              <div class="avatar">${getInitials(u.full_name || u.username)}</div>
              <div class="convo-info">
                <div class="convo-name">${escapeHtml(u.full_name || u.username)}</div>
                <div class="convo-preview">@${escapeHtml(u.username)}</div>
              </div>
            </div>
          `).join('') || '<div style="padding:12px 18px;font-size:13px;color:var(--muted)">لا نتائج.</div>';
        } catch { results.innerHTML = ''; }
      }, 300);
    });
  }

  function startNew(userId, displayName) {
    const overlay = document.getElementById('new-msg-overlay');
    if (overlay) overlay.classList.add('hidden');
    openThread(userId, displayName);
    loadConversations();
  }

  function init() {
    requireAuth();
    loadConversations();

    // Send on Enter (Shift+Enter = newline)
    const input = document.getElementById('msg-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);

    const newMsgBtn = document.getElementById('new-msg-btn');
    const overlay   = document.getElementById('new-msg-overlay');
    const closeOverlay = document.getElementById('close-overlay');

    if (newMsgBtn && overlay) {
      newMsgBtn.addEventListener('click', () => overlay.classList.toggle('hidden'));
    }
    if (closeOverlay && overlay) {
      closeOverlay.addEventListener('click', () => overlay.classList.add('hidden'));
    }

    initNewMessageSearch();
  }

  return { init, openThread, sendMessage, startNew, loadConversations };
})();