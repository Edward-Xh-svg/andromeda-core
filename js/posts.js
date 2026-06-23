// ---------- عناصر DOM ----------
const postsFeed = document.getElementById('postsFeed');
const submitPostBtn = document.getElementById('submitPost');
const postContent = document.getElementById('postContent');
const postImage = document.getElementById('postImage');

// ---------- عرض المنشورات ----------
async function loadPosts() {
    if (!postsFeed) return;

    try {
        const posts = await getPosts();
        postsFeed.innerHTML = '';

        posts.forEach(post => {
            const postElement = createPostElement(post);
            postsFeed.appendChild(postElement);
        });

        // تحديث الإحصائيات
        const statsPosts = document.getElementById('statsPosts');
        if (statsPosts) statsPosts.textContent = `المنشورات: ${posts.length}`;
    } catch (error) {
        console.error('خطأ في تحميل المنشورات:', error);
    }
}

// ---------- إنشاء عنصر منشور ----------
function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'post';
    div.dataset.postId = post.id;

    div.innerHTML = `
        <div class="post-header">
            <div class="post-avatar">${post.username.charAt(0).toUpperCase()}</div>
            <div>
                <div class="post-user">${post.username}</div>
                <div class="post-time">${new Date(post.created_at).toLocaleString('ar-EG')}</div>
            </div>
        </div>
        <div class="post-content">${post.content}</div>
        ${post.image_url ? `<img src="${post.image_url}" class="post-image" />` : ''}
        <div class="post-actions">
            <button class="like-btn" data-post-id="${post.id}">👍 ${post.likes_count || 0}</button>
            <button class="comment-btn" data-post-id="${post.id}">💬 ${post.comments_count || 0}</button>
            <button class="share-btn" data-post-id="${post.id}">🔗 مشاركة</button>
        </div>
    `;

    // إضافة أحداث
    div.querySelector('.like-btn').addEventListener('click', async () => {
        try {
            const result = await likePost(post.id);
            const likeBtn = div.querySelector('.like-btn');
            likeBtn.textContent = `👍 ${result.likes}`;
        } catch (error) {
            console.error('خطأ في الإعجاب:', error);
        }
    });

    div.querySelector('.comment-btn').addEventListener('click', () => {
        window.location.href = `/post.html?id=${post.id}`;
    });

    div.querySelector('.share-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.origin + `/post.html?id=${post.id}`);
        alert('تم نسخ رابط المنشور');
    });

    return div;
}

// ---------- إنشاء منشور جديد ----------
if (submitPostBtn) {
    submitPostBtn.addEventListener('click', async () => {
        const content = postContent.value.trim();
        if (!content) {
            alert('الرجاء كتابة محتوى المنشور');
            return;
        }

        try {
            const newPost = await createPost(content, null);
            if (newPost) {
                postContent.value = '';
                loadPosts();
            }
        } catch (error) {
            console.error('خطأ في نشر المنشور:', error);
            alert('فشل نشر المنشور');
        }
    });
}

// ---------- تحميل المنشورات عند تحميل الصفحة ----------
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
});