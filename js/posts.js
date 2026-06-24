// ============================================================
// posts.js — Post rendering and interactions
// ============================================================

const Posts = (() => {
  const currentUser = API.getUser();

  // ── Render single post card ──
  function renderPost(post) {
    const liked = post.liked_by_me;
    const img = post.image_url
      ? `<img src="${post.image_url}" alt="صورة المنشور" class="post-image" loading="lazy">`
      : '';

    const badge = post.rank
      ? `<span class="badge badge-navy" style="margin-right:8px">${escapeHtml(post.rank)}</span>`
      : '';

    return `
      <div class="post-card" data-id="${post.id}">
        <div class="post-header">
          <div class="avatar">${getInitials(post.full_name || post.username)}</div>
          <div class="post-meta">
            <div class="post-author">
              <a href="/profile.html?id=${post.user_id}" style="color:inherit;text-decoration:none">
                ${escapeHtml(post.full_name || post.username)}
              </a>
              ${badge}
            </div>
            <div class="post-time">
              <span class="text-muted" style="font-size:12px">@${escapeHtml(post.username)}</span>
              &nbsp;&middot;&nbsp;
              ${formatDate(post.created_at)}
            </div>
          </div>
          ${currentUser && currentUser.id === post.user_id
            ? `<button class="btn btn-sm btn-outline" onclick="Posts.deletePost(${post.id}, this)" title="حذف">&#x2715;</button>`
            : ''}
        </div>
        <div class="post-body">${escapeHtml(post.content)}</div>
        ${img}
        <div class="post-footer">
          <button class="action-btn ${liked ? 'liked' : ''}" data-action="like" data-id="${post.id}">
            &#9733; <span class="like-count">${post.like_count || 0}</span>
          </button>
          <a href="/post.html?id=${post.id}" class="action-btn" style="text-decoration:none">
            &#9679; <span>${post.comment_count || 0} تعليق</span>
          </a>
          <button class="action-btn" onclick="copyLink(${post.id})">
            &#8599; مشاركة
          </button>
        </div>
      </div>
    `;
  }

  // ── Render feed ──
  async function loadFeed(container, page = 1) {
    container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span> تحميل المنشورات...</div>';

    try {
      const data = await API.posts.getAll(page);
      if (!data.posts || data.posts.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">&#9633;</div>
            <p>لا توجد منشورات بعد. كن الأول في النشر.</p>
          </div>`;
        return;
      }

      container.innerHTML = data.posts.map(renderPost).join('');
      bindLikes(container);
    } catch (err) {
      container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  }

  // ── Load user's posts ──
  async function loadUserPosts(container, userId) {
    container.innerHTML = '<div class="loading-overlay"><span class="spinner"></span></div>';

    try {
      const data = await API.posts.getByUser(userId);
      if (!data.posts || data.posts.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>لا توجد منشورات.</p></div>`;
        return;
      }
      container.innerHTML = data.posts.map(renderPost).join('');
      bindLikes(container);
    } catch (err) {
      container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  }

  // ── Load single post with comments ──
  async function loadSinglePost(postId) {
    const postEl = document.getElementById('post-container');
    const commEl = document.getElementById('comments-container');
    if (!postEl) return;

    postEl.innerHTML = '<div class="loading-overlay"><span class="spinner"></span></div>';

    try {
      const { post } = await API.posts.getOne(postId);
      postEl.innerHTML = renderPost(post);
      bindLikes(postEl);

      // Load comments
      const { comments } = await API.comments.getByPost(postId);
      renderComments(commEl, comments, postId);
    } catch (err) {
      postEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  }

  // ── Render comments ──
  function renderComments(container, comments, postId) {
    if (!container) return;

    const list = comments.length > 0
      ? comments.map(c => `
          <div class="comment-item">
            <div class="avatar" style="width:30px;height:30px;font-size:11px">${getInitials(c.full_name || c.username)}</div>
            <div class="comment-content">
              <span class="comment-author">${escapeHtml(c.full_name || c.username)}</span>
              <span class="comment-time" style="margin-right:6px">${formatDate(c.created_at)}</span>
              <p class="comment-text">${escapeHtml(c.content)}</p>
            </div>
          </div>`).join('')
      : '<p class="text-muted" style="font-size:13px;padding:12px 0">لا توجد تعليقات بعد.</p>';

    container.innerHTML = `
      <div class="comments-section">
        <div class="section-header" style="margin-bottom:12px">
          <h2>التعليقات (${comments.length})</h2>
        </div>
        ${list}
        ${currentUser ? `
          <div class="comment-form">
            <div class="avatar" style="width:30px;height:30px;font-size:11px">${getInitials(currentUser.full_name || currentUser.username)}</div>
            <input type="text" id="comment-input" placeholder="اكتب تعليقاً..." maxlength="500">
            <button class="btn btn-primary btn-sm" onclick="Posts.submitComment(${postId})">نشر</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ── Submit comment ──
  async function submitComment(postId) {
    const input = document.getElementById('comment-input');
    const content = input?.value.trim();
    if (!content) return;

    try {
      await API.comments.create(postId, { content });
      input.value = '';
      // Reload post
      await loadSinglePost(postId);
      showToast('تم نشر التعليق');
    } catch (err) {
      showToast(err.message);
    }
  }

  // ── Delete post ──
  async function deletePost(postId, btn) {
    if (!confirm('هل تريد حذف هذا المنشور؟')) return;

    try {
      await API.posts.delete(postId);
      const card = document.querySelector(`.post-card[data-id="${postId}"]`);
      if (card) {
        card.style.opacity = '0';
        card.style.transition = 'opacity 0.3s';
        setTimeout(() => card.remove(), 300);
      }
      showToast('تم حذف المنشور');
    } catch (err) {
      showToast(err.message);
    }
  }

  // ── Bind like buttons ──
  function bindLikes(container) {
    container.querySelectorAll('[data-action="like"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!API.getToken()) {
          window.location.href = '/login.html';
          return;
        }

        const id = btn.dataset.id;
        try {
          const { liked, like_count } = await API.posts.like(id);
          btn.classList.toggle('liked', liked);
          btn.querySelector('.like-count').textContent = like_count;
        } catch (err) {
          showToast(err.message);
        }
      });
    });
  }

  // ── Compose form ──
  function initComposeForm() {
    const form = document.getElementById('compose-form');
    if (!form) return;

    const textarea  = document.getElementById('post-content');
    const fileInput = document.getElementById('post-image');
    const preview   = document.getElementById('image-preview');
    const btn       = document.getElementById('compose-btn');

    if (fileInput) {
      fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file && preview) {
          const reader = new FileReader();
          reader.onload = (e) => {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
          };
          reader.readAsDataURL(file);
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const content = textarea.value.trim();
      if (!content) return;

      const fd = new FormData();
      fd.append('content', content);
      if (fileInput?.files[0]) {
        fd.append('image', fileInput.files[0]);
      }

      btn.disabled = true;
      btn.textContent = 'جاري النشر...';

      try {
        await API.posts.create(fd);
        textarea.value = '';
        if (fileInput) fileInput.value = '';
        if (preview) { preview.src = ''; preview.classList.add('hidden'); }
        showToast('تم نشر التغريدة');

        // Reload feed
        const feed = document.getElementById('feed');
        if (feed) await loadFeed(feed);
      } catch (err) {
        showToast(err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'نشر';
      }
    });
  }

  return {
    renderPost,
    loadFeed,
    loadUserPosts,
    loadSinglePost,
    submitComment,
    deletePost,
    initComposeForm,
  };
})();

function copyLink(postId) {
  const url = `${window.location.origin}/post.html?id=${postId}`;
  navigator.clipboard.writeText(url).then(() => showToast('تم نسخ الرابط'))
    .catch(() => showToast('تعذّر نسخ الرابط'));
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str || '').replace(/[&<>"']/g, m => map[m]);
}