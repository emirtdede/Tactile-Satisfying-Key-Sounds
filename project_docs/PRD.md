# Ürün Gereksinimleri Belgesi (PRD)

## Ürün Vizyonu
Kullanıcıların daktilo, mekanik klavye veya özel ses paketleriyle klavye deneyimlerini kişiselleştirebilecekleri, Microsoft Store uyumlu, modern ve güvenli bir arka plan klavye ses motoru.

## Hedef Kitle
- **Birincil Kullanıcı:** Kodlama veya yazarlık yaparken motivasyon artırıcı ve tatmin edici klavye sesleri arayan masaüstü kullanıcıları.
- **İkincil Kullanıcı:** Eski daktilo veya farklı mekanik switch'lerin (Cherry MX Blue, Brown vb.) seslerini dijital ortamda deneyimlemek isteyen hobi kullanıcıları.

## İş Hedefleri
- Modern, akıcı ve cam efektli (glassmorphism) bir arayüz (UI) ile kullanıcı deneyimini premium seviyeye çıkarmak.
- Eski ve sorunlu `iohook` modülünü `uiohook-napi` ile güncelleyerek daha stabil ve modern Node.js/Electron sürümlerine uyum sağlamak.
- Uygulamayı Microsoft Store standartlarında (AppX/MSIX) paketlenebilir hale getirmek.
- Çift dil (Türkçe ve İngilizce) desteğini baştan entegre ederek küresel kullanıcı tabanına hitap etmek.

## Kullanıcı Hikayeleri (User Stories)
- **Masaüstü kullanıcısı** olarak, **klavyede yazdığım her tuşta mekanik sesler duymak** istiyorum; böylece **yazı yazma hızımı ve motivasyonumu artırabilirim**.
- **Windows kullanıcısı** olarak, **uygulamayı Microsoft Store'dan güvenle indirip kurabilmek** istiyorum; böylece **sistemimde şüpheli bir yazılım barındırma endişesi taşımam**.
- **Kişiselleştirme seven kullanıcı** olarak, **koyu tema ve cam efektli modern arayüz üzerinden ses seviyesini ve ses paketini kolayca değiştirmek** istiyorum; böylece **göze hitap eden bir deneyim yaşarım**.

## Başarı Metrikleri (KPI)
| Metrik | Hedef | Ölçüm Yöntemi |
|--------|-------|---------------|
| Microsoft Store Kabulü | Onaylanmak | App Certification Kit sonuçları ve Store Dashboard |
| Stabilite | %99 Crash-free | Tuş basımlarında çökme oranlarının loglanması (electron-log) |
| Performans | <50ms gecikme | Tuşa basıldığında sesin çalma süresi |

## Kapsam Dışı (Out of Scope)
- Kullanıcının kendi özel ses paketlerini UI üzerinden oluşturmasını sağlayan editör (Mevcut editör korunabilir ancak revizyona dahil değil).
- İnternet üzerinden mağaza gibi ses paketi indirme sistemi (manuel klasöre atma sistemi korunacak).
