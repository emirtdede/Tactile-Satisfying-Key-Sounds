# Yazılım Gereksinimleri Spesifikasyonu (SRS)

## İşlevsel Gereksinimler

### Core Audio Engine (Ses Motoru)
- **FR-001:** Uygulama, arka plandayken bile kullanıcının klavye vuruşlarını algılayabilmelidir (Global Keystroke Hook).
- **FR-002:** Tuş vuruşu algılandığında gecikmesiz olarak ilgili ses dosyasını (`howler.js` aracılığıyla) oynatabilmelidir.
- **FR-003:** Uygulama kapatıldığında veya "Mute" moduna alındığında global klavye dinleyicisi tamamen durdurulmalıdır.

### User Interface (Arayüz)
- **FR-004:** Kullanıcılar mevcut ses paketlerini modern bir dropdown (select) menüsü üzerinden seçebilmelidir.
- **FR-005:** Kullanıcılar genel ses seviyesini (%0 - %100) ayarlayabilmelidir.
- **FR-006:** Arayüz, Türkçe ve İngilizce dil desteği (i18n) sağlamalıdır ve dil değişimi yapılandırma üzerinden yönetilebilmelidir.

### Microsoft Store ve Paketleme
- **FR-007:** Uygulama, Windows 10/11 cihazlar için `.appx` veya `.msix` formatında paketlenebilmelidir.
- **FR-008:** Uygulama Microsoft'un "Windows App Certification Kit" (WACK) gereksinimlerini karşılamalıdır.

## İşlevsel Olmayan Gereksinimler

### Performans
- Tuş vuruşları ve ses çalınması arasındaki gecikme en fazla 50ms olmalıdır.
- UI geçişleri (animasyonlar) 60fps akıcılığında çalışmalıdır.

### Güvenilirlik
- Uygulama, klavye okuyucu modül çökse dahi işletim sistemini kilitlememelidir.

### Güvenlik
- Global klavye hook işlemi sadece tuş kodlarını (keycode) almalı, yazılan harfleri veya şifreleri KESİNLİKLE loglamamalı veya kaydetmemelidir.
- Arayüz (Renderer), ContextIsolation ve Preload üzerinden güvenli bir şekilde Main Process'e bağlanmalıdır. NodeIntegration kapalı olmalıdır.

## Kısıtlamalar
- Microsoft Store'un global hook (tuş yakalama) işlemleriyle ilgili potansiyel uyarıları. 

## Kabul Kriterleri
- [ ] Tuşlara basıldığında hatasız ses çalması (Global hook test edilecek).
- [ ] Uygulamanın modern cam efektli yeni UI tasarımıyla açılması.
- [ ] `.appx` paketi oluşturulup Windows üzerinde sorunsuz yüklenebilmesi.
