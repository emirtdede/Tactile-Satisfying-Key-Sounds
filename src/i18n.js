// Tactile i18n Engine — Lightweight internationalization module
// Usage in HTML: <span data-i18n="key">Fallback</span>
// Usage in HTML (placeholders): <input data-i18n-placeholder="key" placeholder="Fallback">
// Usage in JS: t('key') or t('key', { name: 'value' })

const translations = {
    tr: {
        // ─── Sidebar ───
        'app.subtitle': 'Tatmin Edici Tuş Sesleri',
        'nav.sound_profiles': 'SES PROFİLLERİ',
        'nav.settings': 'Ayarlar',
        'nav.about': 'Hakkında / Yasal',
        'sidebar.local_user': 'Yerel Kullanıcı',

        // ─── Toolbar ───
        'toolbar.search': 'Profil ara...',
        'toolbar.no_profile': 'Aktif Profil Yok',
        'toolbar.volume': 'Ses',

        // ─── Filters ───
        'filter.all': 'Tümü',

        // ─── Profile Actions ───
        'btn.new_profile': '+ Yeni Ses (Profil)',
        'btn.preview': 'Önizle',
        'btn.set_active': 'Etkinleştir',
        'btn.active': 'Aktif',
        'card.default_desc': 'Premium switch profili',
        'profiles.empty': 'Bu kategoride profil bulunamadı.',

        // ─── Settings View ───
        'settings.title': 'Ayarlar',
        'settings.general': '⚙ GENEL',
        'settings.mute_title': 'Sesleri Kapat',
        'settings.mute_desc': 'Tuş sesi geri bildirimini geçici olarak devre dışı bırak.',
        'settings.startup_title': 'Windows ile Başlat',
        'settings.startup_desc': 'Bilgisayar açıldığında Tactile otomatik olarak arka planda çalışır.',
        'settings.tray_title': 'Tepsi Simgesine Küçült',
        'settings.tray_desc': 'Pencere kapatıldığında Tactile sistem tepsisinde çalışmaya devam eder.',
        'settings.lang_title': 'Uygulama Dili',
        'settings.lang_desc': 'Uygulama arayüzünün dilini seçin.',
        'settings.tray_click_single_title': 'Tepsi Simgesi Tek Tıklama',
        'settings.tray_click_single_desc': 'Sistem tepsisindeki uygulama simgesine tek tıklandığında ne yapılsın?',
        'settings.tray_click_double_title': 'Tepsi Simgesi Çift Tıklama',
        'settings.tray_click_double_desc': 'Sistem tepsisindeki uygulama simgesine çift tıklandığında ne yapılsın?',
        'settings.tray_action_open': 'Uygulamayı Aç',
        'settings.tray_action_mute': 'Sesi Kapat / Aç',
        'settings.tray_action_none': 'Hiçbir Şey',
        'settings.shortcut_title': 'Sesi Aç/Kapat Kısayol Tuşu',
        'settings.shortcut_desc': 'Uygulama arka plandayken sesleri açıp kapatmak için global kısayol tuşu atayın.',
        'settings.shortcut_record_placeholder': 'Kısayol Kaydetmek İçin Tıkla...',
        'settings.shortcut_recording': 'Tuşlara Basın... (Esc ile İptal)',
        'settings.shortcut_error': 'Kısayol Kaydedilemedi (Kullanımda olabilir)',

        // ─── About View ───
        'about.subtitle': 'Günlük iş akışınız için tatmin edici mekanik klavye switch geri bildirimi.',
        'about.developer': 'GELİŞTİRİCİ',
        'about.website': 'Web Sitesi',
        'about.legal': 'YASAL',
        'about.terms_title': 'Kullanım Koşulları (EULA)',
        'about.terms_desc': 'Son kullanıcı lisans sözleşmesi',
        'about.privacy_title': 'Gizlilik Politikası',
        'about.privacy_desc': 'Veri toplama ve gizlilik bilgileri',
        'about.copyright': 'Telif Hakkı © 2026 Vellium. Tüm hakları saklıdır.',
        'about.registered': 'Tactile, Vellium.dev\'in tescilli bir ürünüdür.',

        // ─── Create Profile Modal ───
        'modal.create_title': 'Yeni Ses Listesi (Profil) Oluştur',
        'modal.profile_name': 'Profil (Liste) Adı',
        'modal.profile_name_placeholder': 'ör. Özel mekanik switch\'lerim',
        'modal.description': 'Açıklama',
        'modal.description_placeholder': 'ör. Premium Linear switch ses profili.',
        'modal.switch_type': 'Switch Türü',
        'modal.material': 'Malzeme',
        'modal.new_material': 'Yeni Malzeme Adı',
        'modal.new_material_placeholder': 'ör. Pom, Pirinç, Çelik',
        'modal.creates_empty': 'Boş bir özel paket oluşturur.',
        'modal.create_list': 'Liste Oluştur',
        'modal.add_new_material': '+ Yeni Malzeme Ekle...',

        // ─── Add Sound Modal ───
        'modal.add_sound_title': 'Listeye (Profile) Ses Ekle',
        'modal.sound_title': 'Ses Başlığı / Switch Adı',
        'modal.sound_title_placeholder': 'ör. Boşluk tuşu basma, Cherry Blue Click',
        'modal.sound_desc_placeholder': 'ör. Derin ses imzalı basma',
        'modal.keycode_label': 'Tuş Koduna Ata (ör. 57: Boşluk, 28: Enter, 14: Geri Silme)',
        'modal.keycode_placeholder': 'Tuş kodu numarası girin',
        'modal.select_file': 'Atanacak dosyayı seçin:',
        'modal.choose_audio': 'Ses Dosyası Seç ve Kaydet',

        // ─── Edit Profile Modal ───
        'modal.edit_title': 'Profil Detaylarını Düzenle',
        'modal.edit_profile_name': 'Profil Adı',
        'modal.edit_category': 'Kategori',
        'modal.delete_profile': 'Profili Sil',
        'modal.save_changes': 'Değişiklikleri Kaydet',

        // ─── Create Category Modal ───
        'modal.create_category_title': 'Yeni Kategori Listesi Oluştur',
        'modal.category_name': 'Kategori Adı',
        'modal.category_name_placeholder': 'ör. Tactile Özel, Clicky Premium',
        'modal.category_footer': 'Kenar çubuğuna yeni kategori listesi ekler.',
        'modal.create_category': 'Kategori Oluştur',

        // ─── Manage Categories Modal ───
        'modal.manage_title': 'Kategorileri Yönet',
        'modal.manage_desc': 'Kenar çubuğunda sıralamak için kategorileri sürükleyip bırakın.',
        'modal.drag_sort': 'Sıralamak için sürükleyin.',
        'modal.done': 'Tamam',

        // ─── Legal Modal ───
        'modal.ok': 'Tamam',
        'legal.terms_title': 'Son Kullanıcı Lisans Sözleşmesi (EULA)',
        'legal.privacy_title': 'Gizlilik Politikası',
        'legal.terms_body': `
            <h4>TACTILE — SON KULLANICI LİSANS SÖZLEŞMESİ</h4>
            <p>Bu Sözleşme, Vellium ("Lisans Veren") tarafından geliştirilen Tactile yazılımını ("Yazılım") kullanmanıza ilişkin yasal bir sözleşmedir. Yazılımı kurarak veya kullanarak bu sözleşmenin tüm koşullarını kabul etmiş sayılırsınız.</p>
            
            <h4>1. Lisans Kapsamı</h4>
            <p>Vellium size, bu Sözleşme koşulları dahilinde, kişisel ve ticari olmayan amaçlarla Yazılımı kullanmak için devredilemez, münhasır olmayan ve alt lisanslanamaz bir lisans tanımaktadır.</p>
            
            <h4>2. Kısıtlamalar</h4>
            <p>Aşağıdaki eylemler kesinlikle yasaktır:</p>
            <ul>
                <li>Yazılımı kopyalamak, değiştirmek veya dağıtmak</li>
                <li>Yazılımı tersine mühendislik (reverse engineering), kaynak koda çevirme (decompile) veya parçalara ayırma (disassemble) yoluyla analiz etmek</li>
                <li>Yazılımı kiralamak, ödünç vermek veya ticari amaçlarla alt lisanslamak</li>
            </ul>
            
            <h4>3. Fikri Mülkiyet ve Mülkiyet Beyanı</h4>
            <p>Yazılım ve içerdiği tüm içerik, özellikler ve işlevsellik, Vellium'un münhasır mülkiyetindedir. Bu sözleşme Apple Inc. veya Microsoft Corporation ile değil, yalnızca Lisans Veren (Vellium) ile kullanıcı arasındadır. Apple ve Microsoft'un bu Yazılım ile ilgili hiçbir destek, bakım veya sorumluluk yükümlülüğü bulunmamaktadır.</p>

            <h4>4. Garanti Muafiyeti ve Sorumluluk Sınırı</h4>
            <p>Yazılım "OLDUĞU GİBİ" (AS IS) sunulmaktadır. Lisans Veren, yazılımın hatasız veya kesintisiz çalışacağını garanti etmez. Uygulama sistem düzeyinde klavye hook mekanizması (uIOhook) kullanmaktadır. Donanım uyumluluğu, sistem güncellemeleri veya üçüncü taraf çakışmalarından kaynaklanabilecek sistem kararsızlıkları, veri kayıpları veya dolaylı zararlardan Lisans Veren hiçbir şekilde sorumlu tutulamaz.</p>

            <h4>5. İletişim ve Destek</h4>
            <p>Sözleşme veya Yazılım ile ilgili tüm soru, şikayet veya teknik destek taleplerinizi doğrudan <strong>support@vellium.dev</strong> adresine iletebilirsiniz.</p>
        `,
        'legal.privacy_body': `
            <h4>GİZLİLİK POLİTİKASI</h4>
            <p>Vellium olarak gizliliğinize büyük önem veriyoruz. Tactile uygulamasını kullanırken kişisel verilerinizin nasıl işlendiği ve korunduğu hakkında bilgilendirme aşağıda yer almaktadır.</p>
            
            <h4>1. Toplanan Veriler</h4>
            <p>Tactile, tamamen yerel (local) çalışan bir yazılımdır. Klavyenizden girdiğiniz hiçbir tuş verisi, metin, şifre veya hassas bilgi kesinlikle kaydedilmez, işlenmez ve internet üzerinden dış sunuculara gönderilmez. Sadece yerel olarak seçtiğiniz ses profilleri ve ayarlarınız bilgisayarınızdaki yerel veritabanında saklanır.</p>
            
            <h4>2. Veri Güvenliği ve İletişim</h4>
            <p>Yerel verilerinizin güvenliği tamamen bilgisayarınızın işletim sistemi sınırları içerisinde korunmaktadır. Yazılımımız üzerinden dışarıya herhangi bir veri aktarımı gerçekleşmemektedir. Gizlilik sorularınız için bizimle <strong>support@vellium.dev</strong> üzerinden iletişime geçebilirsiniz.</p>
        `,


        // ─── Context Menu ───
        'context.rename': 'Yeniden Adlandır',
        'context.delete': 'Sil',

        // ─── Custom Dialog ───
        'dialog.notification': 'Bildirim',
        'dialog.ok': 'Tamam',
        'dialog.cancel': 'İptal',
        'dialog.confirm': 'Onayla',
        'dialog.save': 'Kaydet',
        'dialog.confirm_action': 'İşlemi Onayla',
        'dialog.input_required': 'Giriş Gerekli',

        // ─── Custom Import ───
        'import.drag_title': 'Ses Klasörlerini Sürükle ve Bırak',
        'import.drag_desc': 'Yeni bir ses profili olarak içe aktarmak için ses paketi klasörlerinizi buraya bırakın.',
        'import.select_folder': 'Ses Klasörü Seç',

        // ─── Dynamic JS Messages ───
        'msg.import_success': 'Ses profili başarıyla içe aktarıldı:',
        'msg.import_failed': 'İçe aktarma başarısız:',
        'msg.enter_profile_name': 'Lütfen bir liste (profil) adı girin!',
        'msg.enter_material_name': 'Lütfen özel bir malzeme adı girin!',
        'msg.profile_created': 'Liste (profil) başarıyla oluşturuldu:',
        'msg.profile_create_failed': 'Liste oluşturulamadı:',
        'msg.error_occurred': 'Bir hata oluştu: ',
        'msg.select_profile_keycode': 'Lütfen bir profil ve tuş kodu belirtin!',
        'msg.audio_assigned': 'Ses dosyası bu listeye (profile) başarıyla eklendi!',
        'msg.assign_failed': 'Dosya ataması başarısız:',
        'msg.enter_category_name': 'Lütfen bir kategori adı girin!',
        'msg.profile_name_empty': 'Profil adı boş olamaz!',
        'msg.confirm_delete_profile': 'Bu profili silmek istediğinizden emin misiniz: "%s"?',
        'msg.confirm_delete_category': '"%s" kategorisini silmek istediğinize emin misiniz? Bu kategori altındaki tüm ses profilleri de silinecektir.',
        'msg.rename_category': 'Yeni kategori adını girin:',
        'msg.rename_category_title': 'Kategoriyi Yeniden Adlandır',
        'msg.delete_category_title': 'Kategoriyi Sil',

        // ─── System Tray ───
        'tray.mute': 'Sessiz',
        'tray.quit': 'Çıkış',
    },
    en: {
        'app.subtitle': 'Satisfying Key Sounds',
        'nav.sound_profiles': 'SOUND PROFILES',
        'nav.settings': 'Settings',
        'nav.about': 'About / Legal',
        'sidebar.local_user': 'Local User',
        'toolbar.search': 'Search profiles...',
        'toolbar.no_profile': 'No Profile Active',
        'toolbar.volume': 'Volume',
        'filter.all': 'All',
        'btn.new_profile': '+ New Sound (Profile)',
        'btn.preview': 'Preview',
        'btn.set_active': 'Set Active',
        'btn.active': 'Active',
        'card.default_desc': 'Premium switch profile',
        'profiles.empty': 'No profiles found in this category.',
        'settings.title': 'Settings',
        'settings.general': '⚙ GENERAL',
        'settings.mute_title': 'Mute Sounds',
        'settings.mute_desc': 'Temporarily disable key sound feedback.',
        'settings.startup_title': 'Start with Windows',
        'settings.startup_desc': 'Tactile runs automatically in the background when the PC starts.',
        'settings.tray_title': 'Minimize to Tray',
        'settings.tray_desc': 'Keep Tactile running in the system tray when closing the window.',
        'settings.lang_title': 'Application Language',
        'settings.lang_desc': 'Choose the interface language.',
        'settings.tray_click_single_title': 'Tray Icon Single-Click',
        'settings.tray_click_single_desc': 'What should happen when clicking the tray icon once?',
        'settings.tray_click_double_title': 'Tray Icon Double-Click',
        'settings.tray_click_double_desc': 'What should happen when double-clicking the tray icon?',
        'settings.tray_action_open': 'Open Application',
        'settings.tray_action_mute': 'Toggle Mute',
        'settings.tray_action_none': 'None',
        'settings.shortcut_title': 'Toggle Mute Hotkey',
        'settings.shortcut_desc': 'Assign a global hotkey to toggle sounds when the app is running in the background.',
        'settings.shortcut_record_placeholder': 'Click to record shortcut...',
        'settings.shortcut_recording': 'Press keys... (Esc to Cancel)',
        'settings.shortcut_error': 'Shortcut Registration Failed (Might be in use)',
        'about.subtitle': 'Satisfying mechanical keyboard switch feedback for your daily workflow.',
        'about.developer': 'DEVELOPER',
        'about.website': 'Web Site',
        'about.legal': 'LEGAL',
        'about.terms_title': 'Terms of Use (EULA)',
        'about.terms_desc': 'End user license agreement',
        'about.privacy_title': 'Privacy Policy',
        'about.privacy_desc': 'Data collection and privacy information',
        'about.copyright': 'Copyright © 2026 Vellium. All rights reserved.',
        'about.registered': 'Tactile is a registered product of Vellium.dev.',
        'modal.create_title': 'Create New Sound List (Profile)',
        'modal.profile_name': 'Profile (List) Name',
        'modal.profile_name_placeholder': 'e.g. My custom mechanical switches',
        'modal.description': 'Description',
        'modal.description_placeholder': 'e.g. Premium Linear switch sound profile.',
        'modal.switch_type': 'Switch Type',
        'modal.material': 'Material',
        'modal.new_material': 'New Material Name',
        'modal.new_material_placeholder': 'e.g. Pom, Brass, Steel',
        'modal.creates_empty': 'Creates an empty custom pack.',
        'modal.create_list': 'Create List',
        'modal.add_new_material': '+ Add New Material...',
        'modal.add_sound_title': 'Add Sound to List (Profile)',
        'modal.sound_title': 'Sound Title / Switch Name',
        'modal.sound_title_placeholder': 'e.g. Space press, Cherry Blue Click',
        'modal.sound_desc_placeholder': 'e.g. Deep sound signature press',
        'modal.keycode_label': 'Assign to Keycode (e.g. 57: Space, 28: Enter, 14: Backspace)',
        'modal.keycode_placeholder': 'Enter keycode number',
        'modal.select_file': 'Select file to assign:',
        'modal.choose_audio': 'Choose Audio & Save',
        'modal.edit_title': 'Edit Profile Details',
        'modal.edit_profile_name': 'Profile Name',
        'modal.edit_category': 'Category',
        'modal.delete_profile': 'Delete Profile',
        'modal.save_changes': 'Save Changes',
        'modal.create_category_title': 'Create New Category List',
        'modal.category_name': 'Category Name',
        'modal.category_name_placeholder': 'e.g. Tactile Custom, Clicky Premium',
        'modal.category_footer': 'Adds new category list to sidebar.',
        'modal.create_category': 'Create Category',
        'modal.manage_title': 'Manage Categories',
        'modal.manage_desc': 'Drag and drop categories to reorder them in the sidebar.',
        'modal.drag_sort': 'Drag to sort list.',
        'modal.done': 'Done',
        'modal.ok': 'OK',
        'legal.terms_title': 'Terms of Use (EULA)',
        'legal.privacy_title': 'Privacy Policy',
        'legal.terms_body': `
            <h4>TACTILE — END USER LICENSE AGREEMENT</h4>
            <p>This Agreement is a legal agreement between you and Vellium ("Licensor") regarding your use of the Tactile software ("Software"). By installing or using the Software, you agree to be bound by all the terms of this agreement.</p>
            
            <h4>1. License Scope</h4>
            <p>Vellium grants you a non-transferable, non-exclusive, and non-sublicensable license to use the Software for personal and non-commercial purposes, subject to the terms of this Agreement.</p>
            
            <h4>2. Restrictions</h4>
            <p>The following actions are strictly prohibited:</p>
            <ul>
                <li>Copying, modifying, or distributing the Software</li>
                <li>Analyzing the Software through reverse engineering, decompiling, or disassembling</li>
                <li>Renting, leasing, lending, or sublicensing the Software for commercial purposes</li>
            </ul>
            
            <h4>3. Intellectual Property and Ownership Claim</h4>
            <p>The Software and all content, features, and functionality contained therein are the exclusive property of Vellium. This agreement is solely between the Licensor (Vellium) and the user, not with Apple Inc. or Microsoft Corporation. Apple and Microsoft have no support, maintenance, or liability obligations regarding this Software.</p>

            <h4>4. Disclaimer of Warranty and Limitation of Liability</h4>
            <p>The Software is provided "AS IS". The Licensor does not warrant that the software will be error-free or uninterrupted. The application uses a system-level keyboard hook mechanism (uIOhook). Under no circumstances shall the Licensor be held liable for any system instability, data loss, or indirect damages resulting from hardware compatibility, system updates, or third-party conflicts.</p>

            <h4>5. Contact and Support</h4>
            <p>You can send all questions, complaints, or technical support requests regarding the Agreement or the Software directly to <strong>support@vellium.dev</strong>.</p>
        `,
        'legal.privacy_body': `
            <h4>PRIVACY POLICY</h4>
            <p>At Vellium, we attach great importance to your privacy. Below is information about how your personal data is processed and protected when using the Tactile application.</p>
            
            <h4>1. Data Collected</h4>
            <p>Tactile is a software that runs completely locally. No key data, text, password, or sensitive information you enter from your keyboard is recorded, processed, or sent to external servers over the internet. Only your locally selected sound profiles and settings are stored in the local database on your computer.</p>
            
            <h4>2. Data Security and Communication</h4>
            <p>The security of your local data is completely protected within the limits of your computer's operating system. No data transmission is carried out to the outside through our software. For your privacy questions, you can contact us at <strong>support@vellium.dev</strong>.</p>
        `,

        'context.rename': 'Rename',
        'context.delete': 'Delete',
        'dialog.notification': 'Notification',
        'dialog.ok': 'OK',
        'dialog.cancel': 'Cancel',
        'dialog.confirm': 'Confirm',
        'dialog.save': 'Save',
        'dialog.confirm_action': 'Confirm Action',
        'dialog.input_required': 'Input Required',
        'import.drag_title': 'Drag & Drop Sound Folders',
        'import.drag_desc': 'Drop your sound pack folders here to import them as a new sound profile.',
        'import.select_folder': 'Select Sound Folder',
        'msg.import_success': 'Successfully imported sound profile:',
        'msg.import_failed': 'Import failed:',
        'msg.enter_profile_name': 'Please enter a list (profile) name!',
        'msg.enter_material_name': 'Please enter a custom material name!',
        'msg.profile_created': 'List (profile) created successfully:',
        'msg.profile_create_failed': 'Failed to create list:',
        'msg.error_occurred': 'An error occurred: ',
        'msg.select_profile_keycode': 'Please select a profile and specify a keycode!',
        'msg.audio_assigned': 'Audio file successfully added to this list (profile)!',
        'msg.assign_failed': 'Assignment failed:',
        'msg.enter_category_name': 'Please enter a category name!',
        'msg.profile_name_empty': 'Profile name cannot be empty!',
        'msg.confirm_delete_profile': 'Are you sure you want to delete profile "%s"?',
        'msg.confirm_delete_category': 'Are you sure you want to delete category "%s"? This will also delete all sound profiles under this category.',
        'msg.rename_category': 'Enter new category name:',
        'msg.rename_category_title': 'Rename Category',
        'msg.delete_category_title': 'Delete Category',
        'tray.mute': 'Mute',
        'tray.quit': 'Quit',
    }
};

let currentLang = 'tr'; // Default to Turkish

/**
 * Get the current language
 * @returns {string}
 */
function getLang() {
    return currentLang;
}

/**
 * Set the current language and re-apply translations
 * @param {string} lang - Language code (e.g. 'tr', 'en')
 */
function setLang(lang) {
    if (translations[lang]) {
        currentLang = lang;
    }
}

/**
 * Translate a key, with optional interpolation
 * @param {string} key - Translation key
 * @param {Object} [params] - Optional parameters for interpolation
 * @returns {string}
 */
function t(key, params) {
    let text = (translations[currentLang] && translations[currentLang][key]) || 
               (translations['en'] && translations['en'][key]) || 
               key;
    
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(`%${k}`, v);
        }
    }
    // Simple %s replacement
    if (params === undefined && text.includes('%s')) {
        return text; // Return template as-is for later formatting
    }
    return text;
}

/**
 * Format a translation string with %s placeholders
 * @param {string} key - Translation key
 * @param {...string} args - Values to replace %s placeholders
 * @returns {string}
 */
function tf(key, ...args) {
    let text = t(key);
    args.forEach(arg => {
        text = text.replace('%s', arg);
    });
    return text;
}

/**
 * Apply translations to all DOM elements with data-i18n attributes
 */
function applyTranslations() {
    // data-i18n: set innerText
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = t(key);
        if (translated !== key) {
            el.innerText = translated;
        }
    });
    
    // data-i18n-html: set innerHTML
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        const translated = t(key);
        if (translated !== key) {
            el.innerHTML = translated;
        }
    });
    
    // data-i18n-placeholder: set placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translated = t(key);
        if (translated !== key) {
            el.placeholder = translated;
        }
    });

    // data-i18n-title: set title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const translated = t(key);
        if (translated !== key) {
            el.title = translated;
        }
    });
}

// Export for use in both main process (Node) and renderer (browser)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { translations, t, tf, getLang, setLang, applyTranslations };
}
