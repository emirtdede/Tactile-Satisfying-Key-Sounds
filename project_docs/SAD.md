# Sistem Mimarisi Belgesi (SAD / TDD)

## Mimari Genel Bakış
Sistem, Electron altyapısı üzerine kurulu bir masaüstü uygulamasıdır. Arka planda Node.js süreçleri (Main Process) işletim sistemi seviyesindeki işlemleri (klavye dinleme, sistem tepsisi vb.) yönetirken, Chromium (Renderer Process) modern arayüzü sunmaktadır.

## Teknoloji Stack'i
| Katman        | Teknoloji          | Versiyon | Sebep                      |
|---------------|--------------------|----------|----------------------------|
| Core          | Electron           | ^12.x+   | Çapraz platform desteği    |
| Klavye Hook   | uiohook-napi       | latest   | iohook yerine daha stabil  |
| Frontend      | HTML/CSS/VanillaJS | -        | Modern Glassmorphism UI    |
| Ses Motoru    | howler.js          | ^2.2.4   | Hızlı ve stabil ses okuma  |
| Paketleme     | electron-builder   | ^24.x    | MSIX/AppX desteği          |

## Kritik Algoritmalar ve İş Mantığı
- **Klavye Dinleyici (Hook):** `uiohook-napi` modülü, işletim sisteminden klavye olaylarını alır. Gelen "keydown" olayları, seçili ses paketindeki ilgili ses dosyasıyla eşlenip (veya varsayılan bir sese yönlendirilip) IPC kanalı üzerinden Renderer'a iletilir ve `howler` ile oynatılır.
- **Ses Yönetimi:** Dinamik ses seviyesi (Active Volume Adjustment), sistemin ana ses düzeyine oranlanarak hesaplanır ve mekanik seslerin çok patlamaması veya duyulmaması engellenir.

## Veri Akışı
1. Kullanıcı tuşa basar.
2. İşletim sistemi tuş olayını `uiohook-napi` (Main Process) e iletir.
3. Main Process, olayı `preload.js` üzerinden Renderer Process'e (`app.js`) aktarır.
4. Renderer, mevcut yüklü ses paketinden o tuşa ait sesi `howler.js` ile çalar.

## Güvenlik Mimarisi
- **Context Isolation:** Renderer süreçlerinde `nodeIntegration` kapatılıp, `contextIsolation` aktif edilecek.
- **Preload Script:** Main process ile renderer process arası haberleşme, `contextBridge` kullanılarak özel bir preload dosyasında kısıtlanacak. Sadece belirli IPC kanallarına izin verilecek.

## Ölçeklendirme Stratejisi
- Masaüstü uygulaması olduğu için yerel kaynakları tüketir. Ses dosyaları yüklenirken belleği şişirmemek için `howler.js` ile optimizasyon yapılır.
