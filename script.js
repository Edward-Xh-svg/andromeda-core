document.addEventListener('DOMContentLoaded', () => {
    
    // عناصر النظام والتحكم الأساسي بالصفحات
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const securityGate = document.getElementById('security-gate');
    const passwordInput = document.getElementById('password-input');
    const securityError = document.getElementById('security-error');
    const submitAuthBtn = document.getElementById('submit-auth');
    const cancelAuthBtn = document.getElementById('cancel-auth');
    const successToast = document.getElementById('success-toast');

    // الإعدادات الأمنية الصارمة للمحاكاة الفيدرالية
    const MASTER_KEY = "20083020117";
    let pendingTargetSection = null;
    let pendingTargetItem = null;
    let isAuthorized = false; // يتم التحقق لمرة واحدة في الجلسة لحماية الأقسام السرية

    // التبديل وملاحة الصفحات والتحقق الأمني
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);

            // التحقق مما إذا كان القسم المطلوب مصنفاً كأرشيف استخباراتي سري
            if (item.classList.contains('secure-link') && !isAuthorized) {
                pendingTargetSection = targetSection;
                pendingTargetItem = item;
                openSecurityGate();
            } else {
                switchSection(targetSection, item);
            }
        });
    });

    // تبديل الأقسام الظاهرة مع الحفاظ على الهوية الرسمية
    function switchSection(targetSection, activeNavItem) {
        sections.forEach(sec => {
            sec.classList.add('hidden');
            sec.classList.remove('fade-in-secure');
        });
        navItems.forEach(nav => nav.classList.remove('active'));

        targetSection.classList.remove('hidden');
        activeNavItem.classList.add('active');

        // إضافة تأثير أنيميشن خفيف واحترافي في حال فتح أقسام الاستخبارات أو الأرشيف
        if (targetSection.classList.contains('hidden-secure')) {
            targetSection.classList.add('fade-in-secure');
        }
    }

    // فتح شاشة الأمان وبوابة التحقق من كلمة المرور
    function openSecurityGate() {
        securityGate.classList.remove('hidden');
        passwordInput.value = '';
        securityError.style.display = 'none';
        passwordInput.focus();
    }

    // إغلاق بوابة التحقق في حال الإلغاء
    function closeSecurityGate() {
        securityGate.classList.add('hidden');
        pendingTargetSection = null;
        pendingTargetItem = null;
    }

    // فحص ومعالجة الرمز السري المدخل
    function handleAuthentication() {
        if (passwordInput.value === MASTER_KEY) {
            isAuthorized = true; // رفع مستوى التصريح الأمني بنجاح
            securityGate.classList.add('hidden');
            
            // إظهار إشعار التأكيد الإيجابي الاحترافي
            successToast.classList.remove('hidden');
            setTimeout(() => {
                successToast.classList.add('hidden');
            }, 4000);

            // الانتقال الفوري للقسم المكتوم المستهدف
            if (pendingTargetSection && pendingTargetItem) {
                switchSection(pendingTargetSection, pendingTargetItem);
            }
        } else {
            // إظهار رسالة خطأ صريحة ورسمية
            securityError.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    // مستمعي الأحداث لأزرار التحكم وبوابة التحقق الفيدرالية
    submitAuthBtn.addEventListener('click', handleAuthentication);
    cancelAuthBtn.addEventListener('click', closeSecurityGate);

    // تفعيل ضغط مفتاح Enter للتحقق بشكل سريع وسلس
    passwordInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            handleAuthentication();
        }
    });
});
