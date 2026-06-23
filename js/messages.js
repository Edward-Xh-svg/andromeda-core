// ---------- عناصر DOM ----------
const conversationsList = document.getElementById('conversationsList');
const messagesDisplay = document.getElementById('messagesDisplay');
const sendMessageBtn = document.getElementById('sendMessage');
const messageContent = document.getElementById('messageContent');

// ---------- تحميل المحادثات ----------
async function loadConversations() {
    if (!conversationsList) return;

    try {
        const messages = await getMessages();
        const users = await getUsers();

        // تجميع المحادثات حسب المرسل
        const conversations = {};
        messages.forEach(msg => {
            const otherId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
            if (!conversations[otherId]) {
                conversations[otherId] = {
                    user: users.find(u => u.id === otherId),
                    lastMessage: msg,
                    unread: !msg.is_read && msg.receiver_id === currentUserId
                };
            }
        });

        conversationsList.innerHTML = '';
        Object.values(conversations).forEach(conv => {
            if (!conv.user) return;
            const div = document.createElement('div');
            div.className = 'conversation-item';
            div.innerHTML = `
                <strong>${conv.user.username}</strong>
                <p>${conv.lastMessage.content.substring(0, 50)}...</p>
                ${conv.unread ? '<span class="unread-badge">جديد</span>' : ''}
            `;
            div.addEventListener('click', () => loadConversation(conv.user.id, conv.user.username));
            conversationsList.appendChild(div);
        });
    } catch (error) {
        console.error('خطأ في تحميل المحادثات:', error);
    }
}

// ---------- تحميل محادثة محددة ----------
async function loadConversation(userId, username) {
    if (!messagesDisplay) return;

    try {
        const messages = await getMessages();
        const filtered = messages.filter(msg =>
            (msg.sender_id === currentUserId && msg.receiver_id === userId) ||
            (msg.sender_id === userId && msg.receiver_id === currentUserId)
        );

        messagesDisplay.innerHTML = `<h4>محادثة مع ${username}</h4>`;
        filtered.forEach(msg => {
            const div = document.createElement('div');
            div.className = `message ${msg.sender_id === currentUserId ? 'sent' : 'received'}`;
            div.textContent = msg.content;
            messagesDisplay.appendChild(div);
        });

        // تحديث currentConversation
        currentConversation = userId;
    } catch (error) {
        console.error('خطأ في تحميل المحادثة:', error);
    }
}

// ---------- إرسال رسالة ----------
if (sendMessageBtn) {
    sendMessageBtn.addEventListener('click', async () => {
        const content = messageContent.value.trim();
        if (!content || !currentConversation) {
            alert('الرجاء كتابة رسالة واختيار محادثة');
            return;
        }

        try {
            await sendMessage(currentConversation, content);
            messageContent.value = '';
            loadConversation(currentConversation, '');
        } catch (error) {
            console.error('خطأ في إرسال الرسالة:', error);
        }
    });
}

// ---------- متغيرات ----------
let currentUserId = null;
let currentConversation = null;

// ---------- تهيئة عند تحميل الصفحة ----------
document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        currentUserId = user.id;
        loadConversations();
    }
});