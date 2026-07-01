<div align="center">

# ⌨️ Tactile - Satisfying Key Sounds

[![](https://img.shields.io/badge/Language-English-blue?style=for-the-badge&logo=google-translate)](#english-version)
&nbsp;&nbsp;&nbsp;&nbsp;
[![](https://img.shields.io/badge/Dil-T%C3%BCrk%C3%A7e-red?style=for-the-badge&logo=google-translate)](#turkish-version)

---

[![Electron](https://img.shields.io/badge/Electron-v30.1.0-47848F?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![SQLite WASM](https://img.shields.io/badge/SQLite-WASM%20(sql.js)-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://github.com/sql-js/sql.js/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio-Howler.js-FF6F00?style=flat-square&logo=webrtc&logoColor=white)](https://howlerjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

</div>

---

<a id="english-version"></a>
# English Version

**Tactile** is a premium, lightweight desktop application designed with Electron that brings satisfying mechanical keyboard switch sound profiles to your typing experience. Working seamlessly in the background, Tactile captures global hardware keyboard events and plays crisp, latency-free switch sound effects, supporting a variety of switches (Linear, Tactile, Clicky), materials (PBT, ABS), and customizable user-imported sound packs.

---

## 🚀 Key Features

*   **⚡ Zero-Latency Audio Engine**: Uses in-memory Base64 audio stream rendering through the Web Audio API (via Howler.js). Bypasses file system CORS restrictions and eliminates delay or echo issues even during high-speed typing (supports overlapping playback).
*   **🎹 Global Hardware Keyboard Hooking**: Captures hardware keyboard events globally (regardless of which app is active) using native `uiohook-napi` bindings in the main process.
*   **💾 Robust SQLite WASM Storage**: Employs WebAssembly-based `sql.js` for local settings, categorized profiles, and sound layouts. Implements debounced file system writes (500ms) and will-quit synchronization to prevent data corruption.
*   **🎨 Dynamic Icon Changer**: Rasterizes vector SVGs to high-quality PNGs via Canvas dynamically. Automatically updates desktop shortcuts, Start Menu, and pinned Taskbar links (`Tactile.lnk`) while updating modification times to force-refresh Windows Explorer's icon cache.
*   **🔍 Multi-Resolution ICO support**: Icon assets are optimized using separate SVG versions (thin lines for large resolutions, thick strokes for 32px/16px) compiled into multi-res `.ico` files containing 256, 128, 64, 48, 32, and 16px sizes.
*   **🛡️ Store & Installer Compliance**: Includes automated process termination inside NSIS macros to shut down active instances during installation/uninstallation. Bypasses smart-screen warnings when packaged via Microsoft Store.
*   **🌐 Bilingual UI (i18n)**: Out-of-the-box support for English and Turkish languages.

---

## 🛠️ Technology Stack

### Application Shell & Core
- **Electron v30.1.0** (Cross-platform desktop app framework)
- **Node.js v20 / Chromium v124** (Underlying runtimes)

### System APIs & DB
- **uiohook-napi v1.5.5** (Global native hardware keyboard hooking)
- **sql.js v1.8.0** (WebAssembly port of SQLite database client)
- **Howler.js v2.2.4** (Web Audio API abstraction layer)
- **Sharp v0.35.2** (Image resizing and conversion)

### Bundling & Installer
- **electron-builder v24.13.3** (NSIS installer and AppX package creator)

---

## 📁 Project Structure

```text
Tactile/
├── build/                     # Installer configurations and custom NSIS macros
│   └── installer.nsh          # Processes VC++ Redistributable check & taskkill on setup/remove
├── dist/                      # Packaged distribution files (EXE / APPX)
├── locales/                   # UI Translation dictionaries (TR / EN)
├── project_docs/              # Architecture documents, API specs, and developers guides
├── public/                    # Vektör assets (SVG and multi-resolution ICO files)
├── src/
│   ├── assets/                # App styles (app.css, Milligram framework) and static assets
│   ├── audio/                 # Default mechanical soundpacks (Linear, Clicky, Tactile profiles)
│   ├── db/                    # Local storage layer
│   │   └── database.js        # SQLite tables structure, settings hooks, and debounce logic
│   ├── libs/                  # Native keycode mapping helpers
│   ├── app.html               # Single-page interface markup (sidebar, card grids, settings)
│   ├── app.js                 # Frontend renderer (HTML5 Canvas rasterizer & Web Audio triggers)
│   ├── i18n.js                # Dictionary loader and UI translator
│   ├── main.js                # Main Electron process (Windows manager, IPC events, hardware hooker)
│   └── preload.js             # Secure Context Bridge exposing APIs to Renderer
└── tools/                     # Developer utility tools (build-icons.js)
```

---

## 💾 Database/Data Schema

| Table Name | Description | Key Fields | Disk Sync |
| :--- | :--- | :--- | :--- |
| `app_settings` | Stores general application preferences | `key` (PK), `value` | Debounced (500ms) |
| `sound_categories` | Profile folders grouping | `id` (PK), `name`, `sort_order` | Debounced (500ms) |
| `sound_profiles` | Mechanical sound pack metadata | `id` (PK), `name`, `type`, `material`, `description`, `key_define_type`, `folder_path`, `sound_file`, `is_custom`, `sort_order` | Debounced (500ms) |
| `sound_files` | Audio file mappings per keycode | `id` (PK), `profile_id` (FK), `keycode`, `file`, `start`, `length` | Debounced (500ms) |

---

## ⚙️ Installation & Usage

### 1. Installation
Ensure Node.js (v18+) is installed on your computer. Clone the repository and run:
```bash
npm install
```

### 2. Execution
Start the application in developer mode:
```bash
npm start
```

### 3. Packaging
Build the installer (`Tactile Setup 1.0.0.exe`) and Store package (`Tactile 1.0.0.appx`) for Windows:
```bash
npm run build:win
```

---

## ⚖️ License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<a id="turkish-version"></a>
# Türkçe Versiyon

**Tactile**, Electron ile tasarlanmış, yazı yazma deneyiminize tatmin edici mekanik klavye ses profilleri getiren birinci sınıf, hafif bir masaüstü uygulamasıdır. Arka planda sorunsuz çalışan Tactile, sistem genelindeki donanımsal klavye olaylarını yakalar ve çeşitli anahtar türlerini (Linear, Tactile, Clicky), materyalleri (PBT, ABS) ve kullanıcı tarafından dışarıdan aktarılan özel ses paketlerini destekleyerek gecikmesiz tuş sesleri çalar.

---

## 🚀 Öne Çıkan Özellikler

*   **⚡ Sıfır Gecikmeli Ses Motoru**: Web Audio API (Howler.js) kullanarak ses akışlarını hafızada Base64 formatında oynatır. Dosya sistemi CORS kısıtlamalarını aşar ve yüksek hızlı yazımlarda bile birikme veya yankı yapmadan anında tepki verir (overlapping oynatımı destekler).
*   **🎹 Global Donanımsal Klavye Kancası**: Ana süreçteki (Main Process) yerel `uiohook-napi` kütüphanesi sayesinde, uygulamanın odağı fark etmeksizin tüm sistem genelindeki klavye basışlarını yakalar.
*   **💾 Güvenli SQLite WASM Depolama**: Yerel ayarlar, kategorize edilmiş profiller ve tuş ses eşleşmeleri için WebAssembly tabanlı `sql.js` kullanır. Dosya bütünlüğünün korunması için 500ms debounced disk yazımı ve kapatılırken kaydetme (`will-quit`) protokollerini uygular.
*   **🎨 Dinamik İkon Değiştirici**: Vektör SVG ikonlarını arayüzdeki Canvas API ile dinamik olarak yüksek kaliteli PNG'lere dönüştürür. Masaüstü kısayollarını, Başlangıç Menüsünü ve iğnelenmiş Görev Çubuğu kısayollarını (`Tactile.lnk`) otomatik günceller ve Explorer önbelleğini anında tazelemek için son değiştirilme tarihlerini (touch) günceller.
*   **🔍 Çoklu Çözünürlüklü ICO Desteği**: Büyük boyutlar (256px, 128px) için detaylı şablonlar, 32px ve 16px gibi küçük boyutlar için ise kalınlaştırılmış özel SVG'ler kullanılarak derlenmiş 256, 128, 64, 48, 32, 16px çözünürlükleri içeren zengin `.ico` konteynerleri barındırır.
*   **🛡️ Mağaza ve Kurulum Kaldırma Uyumluluğu**: NSIS makrolarında kurulum kaldırılırken veya kurulurken aktif çalışan `Tactile.exe` süreçlerini otomatik kapatan process-kill (`taskkill`) mekanizması içerir. Microsoft Store için tam WACK uyumluluğuna sahiptir.
*   **🌐 Çift Dilli Arayüz (i18n)**: Türkçe ve İngilizce dilleri için varsayılan tam yerelleştirme desteği.

---

## 🛠️ Kullanılan Teknolojiler

### Uygulama İskeleti ve Çekirdek
- **Electron v30.1.0** (Çapraz platform masaüstü uygulama iskeleti)
- **Node.js v20 / Chromium v124** (Altyapı çalışma ortamları)

### Sistem API'leri ve Veritabanı
- **uiohook-napi v1.5.5** (Global donanımsal klavye kancası)
- **sql.js v1.8.0** (SQLite veritabanı istemcisinin WebAssembly sürümü)
- **Howler.js v2.2.4** (Web Audio API soyutlama kütüphanesi)
- **Sharp v0.35.2** (Görsel boyutlandırma ve dönüştürme)

### Paketleme ve Dağıtım
- **electron-builder v24.13.3** (NSIS kurulum yöneticisi ve AppX paketi üreticisi)

---

## 📁 Klasör Yapısı

```text
Tactile/
├── build/                     # Kurulum yöneticisi yapılandırmaları ve özel NSIS makroları
│   └── installer.nsh          # Kurulum/Kaldırma anında VC++ Redistributable kontrolü ve taskkill işlemlerini yönetir
├── dist/                      # Paketlenmiş dağıtım dosyaları (EXE / APPX)
├── locales/                   # Arayüz dil çeviri dosyaları (TR / EN)
├── project_docs/              # Teknik belgeler, API özellikleri ve geliştirici kılavuzları
├── public/                    # Vektör görseller (SVG ve çoklu çözünürlüklü ICO dosyaları)
├── src/
│   ├── assets/                # Uygulama stilleri (app.css, Milligram kütüphanesi) ve statik dosyalar
│   ├── audio/                 # Varsayılan mekanik klavye ses paketleri (Linear, Clicky, Tactile)
│   ├── db/                    # Yerel depolama katmanı
│   │   └── database.js        # SQLite tabloları, ayar sorguları ve debounce kaydetme mantığı
│   ├── libs/                  # Donanımsal keycode remapping yardımcıları
│   ├── app.html               # Tek sayfa kullanıcı arayüzü (sidebar, kart ızgaraları, ayarlar)
│   ├── app.js                 # Ön yüz uygulama mantığı (HTML5 Canvas rasterizer ve ses tetiklemeleri)
│   ├── i18n.js                # Dil sözlük yükleyicisi ve çevirici
│   ├── main.js                # Ana Electron süreci (Pencere yönetimi, IPC dinleyicileri, donanım kancası)
│   └── preload.js             # Arayüze güvenli API'leri açan Context Bridge
└── tools/                     # Geliştirici araçları (build-icons.js)
```

---

## 💾 Veritabanı Tablo Şeması

| Tablo Adı | Tanım | Önemli Alanlar | Disk Senkronizasyonu |
| :--- | :--- | :--- | :--- |
| `app_settings` | Genel uygulama ayarlarını tutar | `key` (PK), `value` | Debounced (500ms) |
| `sound_categories` | Profil gruplandırma klasörleri | `id` (PK), `name`, `sort_order` | Debounced (500ms) |
| `sound_profiles` | Ses paketi metaverileri | `id` (PK), `name`, `type`, `material`, `description`, `key_define_type`, `folder_path`, `sound_file`, `is_custom`, `sort_order` | Debounced (500ms) |
| `sound_files` | Tuş kodlarına göre atanmış sesler | `id` (PK), `profile_id` (FK), `keycode`, `file`, `start`, `length` | Debounced (500ms) |

---

## ⚙️ Kurulum ve Çalıştırma

### 1. Kurulum
Bilgisayarınızda Node.js (v18+) kurulu olduğundan emin olun. Projeyi klonlayıp aşağıdaki komutu çalıştırın:
```bash
npm install
```

### 2. Çalıştırma
Uygulamayı geliştirici modunda başlatmak için:
```bash
npm start
```

### 3. Paketleme
Windows için kurulum dosyasını (`Tactile Setup 1.0.0.exe`) ve Mağaza paketini (`Tactile 1.0.0.appx`) derlemek için:
```bash
npm run build:win
```

---

## ⚖️ Lisans
Bu proje MIT Lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına göz atabilirsiniz.
