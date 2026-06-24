// ============================================================
// app.js — Main application bootstrap
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  const page = document.body.dataset.page;

  // ── Always bind topbar user info if logged in ──
  Auth.bindTopbarUser();

  switch (page) {
    case 'login':
      Auth.initLoginForm();
      break;

    case 'register':
      Auth.initRegisterForm();
      break;

    case 'feed':
      if (!requireAuth()) return;
      await initFeedPage();
      break;

    case 'profile':
      await initProfilePage();
      break;

    case 'messages':
      Messages.init();
      break;

    case 'post':
      await initPostPage();
      break;
  }
});

// ============================================================
// FEED PAGE
// ============================================================
async function initFeedPage() {
  Posts.initComposeForm();

  const feed = document.getElementById('feed');
  if (feed) await Posts.loadFeed(feed);

  // Load stats
  try {
    const { stats } = await API.users.getStats();
    if (stats) {
      const elUsers    = document.getElementById('stat-users');
      const elPosts    = document.getElementById('stat-posts');
      const elComments = document.getElementById('stat-comments');
      if (elUsers)    elUsers.textContent    = formatNumber(stats.users);
      if (elPosts)    elPosts.textContent    = formatNumber(stats.posts);
      if (elComments) elComments.textContent = formatNumber(stats.comments);
    }
  } catch {}
}

// ============================================================
// PROFILE PAGE
// ============================================================
async function initProfilePage() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');
  const currentUser = API.getUser();

  const targetId = userId || (currentUser ? currentUser.id : null);
  if (!targetId) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const { user } = await API.users.getById(targetId);

    document.getElementById('profile-name').textContent     = user.full_name || user.username;
    document.getElementById('profile-handle').textContent   = '@' + user.username;
    document.getElementById('profile-bio').textContent      = user.bio || 'لا توجد نبذة شخصية.';
    document.getElementById('profile-rank').textContent     = user.rank || '';
    document.getElementById('profile-avatar').textContent   = getInitials(user.full_name || user.username);
    document.getElementById('profile-posts-count').textContent = user.post_count || 0;
    document.getElementById('profile-joined').textContent   = new Date(user.created_at).toLocaleDateString('ar-SA');

    // Show edit button if own profile
    if (currentUser && parseInt(targetId) === currentUser.id) {
      const editSection = document.getElementById('edit-section');
      if (editSection) editSection.classList.remove('hidden');
    }

    // Load posts
    const postsEl = document.getElementById('profile-posts');
    if (postsEl) await Posts.loadUserPosts(postsEl, targetId);
  } catch (err) {
    showToast(err.message);
  }

  // Edit profile form
  const editForm = document.getElementById('edit-profile-form');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bio   = document.getElementById('edit-bio').value.trim();
      const fname = document.getElementById('edit-fullname').value.trim();

      try {
        await API.users.update({ bio, full_name: fname });
        showToast('تم تحديث الملف الشخصي');
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        showToast(err.message);
      }
    });
  }
}

// ============================================================
// SINGLE POST PAGE
// ============================================================
async function initPostPage() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');

  if (!postId) {
    window.location.href = '/index.html';
    return;
  }

  await Posts.loadSinglePost(postId);
}

// ── Format large numbers ──
function formatNumber(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'م';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'ك';
  return String(n);
}