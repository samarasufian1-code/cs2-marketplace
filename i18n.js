(function () {
    const translations = [
        ['الملف الشخصي | Dynamic Market', 'Profile | Dynamic Market'],
        ['سوق الأسلحة المتاحة للبيع', 'Skins Marketplace'],
        ['مرجع الأسعار غير متاح حاليًا.', 'Price reference is currently unavailable.'],
        ['تعذر تحميل حالة تحديث الأسعار.', 'Could not load price update status.'],
        ['آخر تعديل لدى المصدر:', 'Feed last modified:'],
        ['آخر فحص ناجح:', 'Last successful check:'],
        ['تسجيل الدخول عبر Steam', 'Sign in with Steam'],
        ['رصيدك الحالي:', 'Your balance:'],
        ['حسابي', 'My account'],
        ['ربط Steam', 'Steam connection'],
        ['متصل', 'Connected'],
        ['الملف الشخصي والمخزون', 'Profile and inventory'],
        ['إخفاء مخزون Steam في هذا الموقع', 'Hide Steam inventory on this site'],
        ['إعداد الخصوصية يخص هذا الموقع فقط.', 'This privacy setting applies only to this site.'],
        ['مخزونك مخفي في صفحة ملفك.', 'Your inventory is hidden on your profile.'],
        ['مخزونك ظاهر في صفحة ملفك؛ هذا الإعداد لا يغيّر خصوصية Steam.', 'Your inventory is visible on your profile; this does not change Steam privacy settings.'],
        ['خطوات الأمان', 'Security tips'],
        ['أدخل بيانات الدخول داخل موقع Steam الرسمي فقط.', 'Enter credentials only on the official Steam website.'],
        ['إخفاء المخزون هنا لا يغيّر إعدادات الخصوصية في Steam.', 'Hiding inventory here does not change Steam privacy settings.'],
        ['سجّل الخروج عند استخدام جهاز مشترك.', 'Sign out when using a shared device.'],
        ['قبل نشر الموقع، تأكد من تشغيله عبر HTTPS.', 'Use HTTPS before publishing the site.'],
        ['تسجيل الخروج', 'Sign out'],
        ['الكل (All)', 'All'],
        ['السكاكين (Knives)', 'Knives'],
        ['الرشاشات (Rifles)', 'Rifles'],
        ['القفازات (Gloves)', 'Gloves'],
        ['ابحث باسم السكن أو الفئة أو حالة الـ wear', 'Search by skin, category, or wear'],
        ['اسم السكن أو الفئة أو الحالة', 'Skin name, category, or condition'],
        ['البحث في السوق', 'Search marketplace'],
        ['بحث السوق', 'Marketplace search'],
        ['فلاتر السوق', 'Marketplace filters'],
        ['نتائج السوق', 'Marketplace results'],
        ['بحث', 'Search'],
        ['الفئة', 'Category'],
        ['فرز حسب', 'Sort by'],
        ['بحث متقدم', 'Advanced search'],
        ['السعر الأدنى', 'Minimum price'],
        ['السعر الأعلى', 'Maximum price'],
        ['كل الحالات', 'Any condition'],
        ['حالة الاهتراء', 'Wear condition'],
        ['السعر المرجعي متوفر فقط', 'Only listings with a price reference'],
        ['إعادة ضبط الفلاتر', 'Reset filters'],
        ['لا توجد نتائج مطابقة للفلاتر الحالية.', 'No listings match the current filters.'],
        ['عرض بالسوق', 'List for sale'],
        ['شراء الآن', 'Buy now'],
        ['ترتيب السكنات', 'Sort skins'],
        ['الصورة غير متوفرة', 'Image unavailable'],
        ['درجة الاهتراء', 'Wear value'],
        ['مرجع الأسعار:', 'Price reference:'],
        ['الترتيب الافتراضي', 'Default sorting'],
        ['السعر: الأعلى إلى الأقل', 'Price: high to low'],
        ['السعر: الأقل إلى الأعلى', 'Price: low to high'],
        ['الاهتراء: الأعلى إلى الأقل', 'Wear: highest to lowest'],
        ['الاهتراء: الأقل إلى الأعلى', 'Wear: lowest to highest'],
        ['مخزون الموقع التجريبي', 'Marketplace test inventory'],
        ['هذه عناصر اشتريتها داخل الموقع، ويمكنك تجربة عرضها هنا. لا يتم نقل سكنات Steam الحقيقية.', 'These are items purchased on this site. You can test listing them here; real Steam items are not transferred.'],
        ['مخزونك في Steam (CS2)', 'Your Steam inventory (CS2)'],
        ['معاينة لمخزون Steam فقط. الإدراج والتداول الحقيقيان غير متاحين قبل ربط Steam Trade Offers.', 'Steam inventory preview only. Real listings and trades require Steam Trade Offers integration.'],
        ['تحديث مخزون Steam', 'Refresh Steam inventory'],
        ['جارٍ تحميل مخزون Steam...', 'Loading Steam inventory...'],
        ['إعلانات الاختبار الخاصة بك', 'Your private test listings'],
        ['هذه القائمة محفوظة لحسابك ولا تظهر في السوق. لا تخصم رصيدًا ولا تنقل أي عنصر في Steam.', 'This list is private to your account. It is not in the marketplace, charges no balance, and transfers no Steam item.'],
        ['سلاح', 'Weapon'],
        ['معاينة السكن', 'Preview skin'],
        ['إغلاق المعاينة', 'Close preview'],
        ['معاينة السكن', 'Preview skin'],
        ['قيمة الاهتراء:', 'Wear value:'],
        ['حالة السلاح:', 'Item condition:'],
        ['اهتراء أعلى', 'More worn'],
        ['اهتراء أقل', 'Less worn'],
        ['غير محدد', 'Unknown'],
        ['غير محددة', 'Unknown'],
        ['سوق CS2', 'CS2 marketplace'],
        ['لا توجد أسلحة معروضة في هذا التصنيف حالياً.', 'No skins are currently listed in this category.'],
        ['مرجع السوق', 'Market reference'],
        ['بائع Steam', 'Steam seller'],
        ['لم يبدأ البيع بعد', 'Not selling yet'],
        ['مبيعات', 'sales'],
        ['بلاغات', 'reports'],
        ['سعر العرض بالدولار', 'Listing price (USD)'],
        ['حفظ السعر', 'Save price'],
        ['إلغاء الإعلان', 'Cancel listing'],
        ['سعر اختبار بالدولار', 'Test price (USD)'],
        ['مضاف لقائمة اختبارك', 'Already in your test listings'],
        ['إدراج اختبار خاص', 'Create private test listing'],
        ['غير متاح للاختبار: غير قابل للتداول', 'Unavailable: item is not tradable'],
        ['لا توجد صورة', 'Image unavailable'],
        ['ما لقينا عناصر CS2 في المخزون العام.', 'No public CS2 items were found.'],
        ['عدد العناصر:', 'Item count:'],
        ['تم تحميل', 'Loaded'],
        ['عنصرًا على الأقل. قد يكون هناك المزيد في مخزون Steam.', 'items at least. More may be available in Steam.'],
        ['المخزون للمعاينة. Steam لا يوفر درجة الاهتراء في هذا الرد.', 'Inventory preview. Steam does not provide wear value in this response.'],
        ['درجة الاهتراء غير متاحة من بيانات Steam', 'Wear value unavailable from Steam data'],
        ['درجة الاهتراء غير متاحة', 'Wear value unavailable'],
        ['لا يوجد مرجع سعري معروف', 'No known price reference'],
        ['قابل للبيع على Steam', 'Marketable on Steam'],
        ['غير قابل للبيع على Steam', 'Not marketable on Steam'],
        ['قابل للتبادل', 'Tradable'],
        ['غير قابل للتبادل', 'Not tradable'],
        ['العنصر غير قابل للتبادل أو البيع على Steam.', 'This item is not tradable or marketable on Steam.'],
        ['مضاف لإعلانات الاختبار الخاصة', 'Added to your private test listings'],
        ['سعر اختبار مقترح (5% أقل من المرجع)', 'Suggested test price (5% below reference)'],
        ['إرجاع للسعر المقترح', 'Reset to suggested price'],
        ['إعلانات البائع', 'Seller listings'],
        ['المبيعات', 'Sales'],
        ['مبيعات البائع', 'Seller sales'],
        ['العروض الخاصة', 'Special Offers'],
        ['إعلانات هذا البائع المسعّرة بأقل من مرجع السوق المتاح.', 'This seller’s listings priced below the available market reference.'],
        ['إعلانات الموقع الحالية. السعر لا ينقل العنصر من Steam بحد ذاته.', 'Current site listings. The price does not transfer a Steam item.'],
        ['لا توجد إعلانات في هذا القسم.', 'No listings in this section.'],
        ['سعر العرض', 'Listing price'],
        ['إرجاع للسعر المرجعي', 'Reset to market reference'],
        ['Special Offer · أقل من السوق', 'Special Offer · Below market'],
        ['السعر المرجعي غير متوفر', 'Market reference unavailable'],
        ['سعر الاختبار', 'Test price'],
        ['حفظ السعر', 'Save price'],
        ['إلغاء الاختبار', 'Cancel test listing'],
        ['لا توجد إعلانات اختبار محفوظة.', 'No saved test listings.'],
        ['أدخل سعرًا صالحًا.', 'Enter a valid price.'],
        ['تعذر تحميل إعلانات الاختبار.', 'Could not load test listings.'],
        ['تعذر إنشاء إدراج الاختبار.', 'Could not create test listing.'],
        ['تعذر تحديث السعر.', 'Could not update price.'],
        ['تعذر إلغاء الاختبار.', 'Could not cancel test listing.'],
        ['الإبلاغ عن البائع', 'Report seller'],
        ['اختر سبب البلاغ', 'Choose a report reason'],
        ['العنصر لا يطابق الإعلان', 'Item does not match listing'],
        ['الإعلان مضلل', 'Misleading listing'],
        ['اشتباه احتيال', 'Suspected fraud'],
        ['سلوك غير مناسب', 'Inappropriate conduct'],
        ['إرسال البلاغ', 'Submit report'],
        ['يمكنك الإبلاغ بعد عملية شراء ناجحة من هذا البائع.', 'You can report this seller after a successful purchase.'],
        ['سبق أن أرسلت بلاغًا عن هذا البائع.', 'You already reported this seller.'],
        ['البلاغ متاح بعد شراء ناجح مسجل في الموقع.', 'Reporting is available after a successful purchase recorded on this site.'],
        ['تم إرسال البلاغ.', 'Report submitted.'],
        ['تعذر تحميل الملف الشخصي', 'Could not load profile'],
        ['سجّل الدخول عبر Steam لفتح ملفك الشخصي.', 'Sign in with Steam to open your profile.'],
        ['جاري تحميل الملف الشخصي...', 'Loading profile...'],
        ['ملف Steam', 'Steam profile'],
        ['مخزون Steam', 'Steam inventory'],
        ['العودة للسوق', 'Back to marketplace'],
        ['القائمة', 'Menu'],
        ['العودة للسوق', 'Back to marketplace'],
        ['الشراء والبيع هنا لا ينفذان Steam Trade Offer تلقائيًا. بوتات الشراء والتحويل الفوري تحتاج تكامل تداول وخدمة خلفية آمنة قبل إطلاقها.', 'Purchases and sales here do not create Steam Trade Offers. Buyer bots and instant transfers require secure trade integration before launch.'],
        ['درجة الاهتراء غير محددة', 'Wear value unknown'],
        ['Factory New', 'Factory New'],
        ['Minimal Wear', 'Minimal Wear'],
        ['Field-Tested', 'Field-Tested'],
        ['Well-Worn', 'Well-Worn'],
        ['Battle-Scarred', 'Battle-Scarred'],
        ['ممتاز', 'Excellent'],
        ['جيد', 'Good'],
        ['سيئ', 'Poor'],
        ['سيئ جدًا', 'Very poor'],
        ['بائع', 'Seller'],
        ['مبيعات ناجحة', 'successful sales'],
        ['السوق', 'Marketplace'],
        ['المتصلون الآن:', 'Online now:'],
        ['سجّل الدخول أولاً.', 'Sign in first.'],
        ['تحديث السعر', 'Update price'],
        ['لا يمكن الاتصال', 'Unable to connect'],
        ['مرجع الأسعار غير متاح حاليًا.', 'Price reference is currently unavailable.'],
        ['تعذر قراءة حالة الأسعار.', 'Could not read price status.'],
        ['تعذر تحميل مخزون Steam الآن.', 'Could not load Steam inventory right now.'],
        ['تعذر تحميل مخزون Steam.', 'Could not load Steam inventory.'],
        ['أدخل سعرًا بين $0.01 و $10,000,000.', 'Enter a price between $0.01 and $10,000,000.'],
        ['تم تحديث سعر الإعلان.', 'Listing price updated.'],
        ['تم إلغاء الإعلان وإعادة السكن إلى مخزونك.', 'Listing canceled and skin returned to your inventory.'],
        ['تعذر تحديث الإعلان.', 'Could not update listing.'],
        ['غير متوفر', 'Unavailable']
    ];

    const extraTranslations = {
        ru: {
            'الملف الشخصي | Dynamic Market': 'Профиль | Dynamic Market',
            'Profile | Dynamic Market': 'Профиль | Dynamic Market',
            'سوق الأسلحة المتاحة للبيع': 'Торговая площадка скинов',
            'Skins Marketplace': 'Торговая площадка скинов',
            'تسجيل الدخول عبر Steam': 'Войти через Steam',
            'Sign in with Steam': 'Войти через Steam',
            'حسابي': 'Мой аккаунт',
            'My account': 'Мой аккаунт',
            'مخزون Steam': 'Инвентарь Steam',
            'Steam inventory': 'Инвентарь Steam',
            'مخزون CS2 في Steam': 'Инвентарь CS2 в Steam',
            'العودة للسوق': 'Назад на рынок',
            'Back to marketplace': 'Назад на рынок',
            'المبيعات': 'Продажи',
            'Sales': 'Продажи',
            'العروض الخاصة': 'Специальные предложения',
            'Special Offers': 'Специальные предложения',
            'معاينة السكن': 'Просмотр скина',
            'Preview skin': 'Просмотр скина',
            'سعر العرض بالدولار': 'Цена объявления (USD)',
            'Listing price (USD)': 'Цена объявления (USD)',
            'حفظ السعر': 'Сохранить цену',
            'Save price': 'Сохранить цену',
            'إلغاء الإعلان': 'Отменить объявление',
            'Cancel listing': 'Отменить объявление',
            'مركز الدعم والشكاوى': 'Поддержка и жалобы',
            'فتح تذكرة': 'Открыть тикет',
            'إرسال البلاغ': 'Отправить жалобу',
            'إرسال الرد': 'Отправить ответ',
            'إغلاق التذكرة': 'Закрыть тикет',
            'المتصلون الآن:': 'Сейчас онлайн:',
            'Online now:': 'Сейчас онлайн:',
            'العربية': 'Арабский',
            'English': 'Английский',
            'Русский': 'Русский',
            '日本語': 'Японский',
            '简体中文': 'Китайский'
        },
        ja: {
            'الملف الشخصي | Dynamic Market': 'プロフィール | Dynamic Market',
            'Profile | Dynamic Market': 'プロフィール | Dynamic Market',
            'سوق الأسلحة المتاحة للبيع': 'スキンマーケット',
            'Skins Marketplace': 'スキンマーケット',
            'تسجيل الدخول عبر Steam': 'Steamでログイン',
            'Sign in with Steam': 'Steamでログイン',
            'حسابي': 'マイアカウント',
            'My account': 'マイアカウント',
            'مخزون Steam': 'Steamインベントリ',
            'Steam inventory': 'Steamインベントリ',
            'مخزون CS2 في Steam': 'SteamのCS2インベントリ',
            'العودة للسوق': 'マーケットに戻る',
            'Back to marketplace': 'マーケットに戻る',
            'المبيعات': '販売',
            'Sales': '販売',
            'العروض الخاصة': '特別オファー',
            'Special Offers': '特別オファー',
            'معاينة السكن': 'スキンをプレビュー',
            'Preview skin': 'スキンをプレビュー',
            'سعر العرض بالدولار': '出品価格 (USD)',
            'Listing price (USD)': '出品価格 (USD)',
            'حفظ السعر': '価格を保存',
            'Save price': '価格を保存',
            'إلغاء الإعلان': '出品をキャンセル',
            'Cancel listing': '出品をキャンセル',
            'مركز الدعم والشكاوى': 'サポートと苦情',
            'فتح تذكرة': 'チケットを作成',
            'إرسال البلاغ': '報告を送信',
            'إرسال الرد': '返信を送信',
            'إغلاق التذكرة': 'チケットを閉じる',
            'المتصلون الآن:': '現在オンライン:',
            'Online now:': '現在オンライン:',
            'العربية': 'アラビア語',
            'English': '英語',
            'Русский': 'ロシア語',
            '日本語': '日本語',
            '简体中文': '中国語'
        },
        zh: {
            'الملف الشخصي | Dynamic Market': '个人资料 | Dynamic Market',
            'Profile | Dynamic Market': '个人资料 | Dynamic Market',
            'سوق الأسلحة المتاحة للبيع': '皮肤市场',
            'Skins Marketplace': '皮肤市场',
            'تسجيل الدخول عبر Steam': '使用 Steam 登录',
            'Sign in with Steam': '使用 Steam 登录',
            'حسابي': '我的账户',
            'My account': '我的账户',
            'مخزون Steam': 'Steam 库存',
            'Steam inventory': 'Steam 库存',
            'مخزون CS2 في Steam': 'Steam CS2 库存',
            'العودة للسوق': '返回市场',
            'Back to marketplace': '返回市场',
            'المبيعات': '销售',
            'Sales': '销售',
            'العروض الخاصة': '特别优惠',
            'Special Offers': '特别优惠',
            'معاينة السكن': '预览皮肤',
            'Preview skin': '预览皮肤',
            'سعر العرض بالدولار': '报价 (USD)',
            'Listing price (USD)': '报价 (USD)',
            'حفظ السعر': '保存价格',
            'Save price': '保存价格',
            'إلغاء الإعلان': '取消挂牌',
            'Cancel listing': '取消挂牌',
            'مركز الدعم والشكاوى': '支持与投诉',
            'فتح تذكرة': '创建工单',
            'إرسال البلاغ': '提交举报',
            'إرسال الرد': '发送回复',
            'إغلاق التذكرة': '关闭工单',
            'المتصلون الآن:': '当前在线:',
            'Online now:': '当前在线:',
            'العربية': '阿拉伯语',
            'English': '英语',
            'Русский': '俄语',
            '日本語': '日语',
            '简体中文': '中文'
        }
    };

    const supportedLanguages = ['ar', 'en', 'ru', 'ja', 'zh'];
    let language = 'en';
    let sourceLanguage = 'ar';
    try {
        const savedLanguage = localStorage.getItem('cs2-market-language-v2');
        if (supportedLanguages.includes(savedLanguage)) language = savedLanguage;
    } catch {}

    function translateValue(value) {
        let pairs;
        if (language === 'ar') pairs = translations
            .map(([arabic, english]) => [english, arabic])
            .filter(([source]) => source !== 'All');
        else if (language === 'en') pairs = translations;
        else pairs = Object.entries(extraTranslations[language] || {});
        pairs.sort((left, right) => right[0].length - left[0].length);
        let translated = value;
        for (const [source, target] of pairs) translated = translated.split(source).join(target);
        return translated;
    }

    let translating = false;

    function translateNode(root) {
        if (!root) return;
        if (translating) return;
        translating = true;
        try {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            let textNode;
            while ((textNode = walker.nextNode())) {
                const parent = textNode.parentElement;
                if (!parent || parent.closest('script, style, textarea, input, #languageSelect, button#languageToggle')) continue;
                const translated = translateValue(textNode.nodeValue);
                if (translated !== textNode.nodeValue) textNode.nodeValue = translated;
            }

            if (root.nodeType === Node.ELEMENT_NODE) {
                for (const attribute of ['placeholder', 'aria-label', 'title', 'alt']) {
                    if (root.hasAttribute(attribute)) root.setAttribute(attribute, translateValue(root.getAttribute(attribute)));
                }
                root.querySelectorAll('[placeholder], [aria-label], [title], img[alt]').forEach(element => {
                    for (const attribute of ['placeholder', 'aria-label', 'title', 'alt']) {
                        if (element.hasAttribute(attribute)) element.setAttribute(attribute, translateValue(element.getAttribute(attribute)));
                    }
                });
            }
        } finally {
            translating = false;
        }
    }

    function translateAddedNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const parent = node.parentElement;
            if (!parent || parent.closest('script, style, textarea, input, #languageSelect')) return;
            node.nodeValue = translateValue(node.nodeValue);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            translateNode(node);
        }
    }

    function observeLocalizedChanges() {
        new MutationObserver(records => {
            if (translating) return;
            for (const record of records) {
                if (record.type === 'characterData') {
                    translateAddedNode(record.target);
                } else {
                    for (const node of record.addedNodes || []) translateAddedNode(node);
                }
            }
        }).observe(document.body, { childList: true, subtree: true });
    }

    function updateLanguageToggle() {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        const select = document.getElementById('languageSelect');
        if (select) {
            select.value = language;
            select.setAttribute('aria-label', language === 'ar' ? 'لغة الموقع' : 'Site language');
        }
        document.title = translateValue(document.title);
        window.siteLanguage = language;
    }

    window.setSiteLanguage = function (nextLanguage) {
        if (!supportedLanguages.includes(nextLanguage)) return;
        sourceLanguage = language;
        language = nextLanguage;
        try { localStorage.setItem('cs2-market-language-v2', language); } catch {}
        updateLanguageToggle();
        translateNode(document.body);
        sourceLanguage = language;
    };

    updateLanguageToggle();
    translateNode(document.body);
    observeLocalizedChanges();
})();