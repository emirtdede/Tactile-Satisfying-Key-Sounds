# Proje Hafızası

Son güncelleme: 2026-06-30

## Proje Özeti
Tactile, mekanik klavye seslerini yazarken oynatan bir Electron masaüstü uygulamasıdır. Küresel bir kullanıcı kitlesi hedeflenmektedir.

## Teknik Özet
- Frontend: HTML/CSS/VanillaJS (Glassmorphism UI)
- Backend: Electron 12+, IPC, Preload, Context Isolation
- DB: electron-store (JSON)
- Auth: Yok
- Hook: uiohook-napi

## Şu Anki Durum
- Tamamlanan: VIBE CODING doküman hiyerarşisi, Microsoft Store hazırlığı, uiohook geçişi, Context Isolation ve Glassmorphism arayüz revizyonu.
- Devam eden: Microsoft Store yayın hazırlığı (Test aşaması).
- Sıradaki: Manuel doğrulama ve Build onayı.

## Son Yapılan İş
Eski `iohook` modülü `uiohook-napi` ile değiştirildi. Arayüz baştan aşağı yenilenerek cam efektli modern bir tasarıma geçirildi. Main ve Renderer süreçleri arasındaki iletişim, güvenlik için NodeIntegration kapatılıp Preload scriptleri ile güvenli IPC yapısına geçirildi. `package.json` dosyasına `.appx` (MSIX) çıktı hedefi eklendi.

## Dikkat Edilmesi Gerekenler
- Uygulama arka plan global hook için `uiohook-napi` kullanıyor.
- Renderer sürecinde Node.js yetkileri yoktur (ContextIsolation devrede). Her türlü dosya veya OS işlemi Main'den gönderilmelidir.

## Açık Sorunlar
- `.appx` çıktısı için WACK testleri ve gerçek cihaz doğrulamasının yapılması gerekiyor.
