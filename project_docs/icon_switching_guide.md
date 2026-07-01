# Windows Electron Dinamik İkon Değiştirme ve Çözünürlük Optimizasyonu Kılavuzu

Bu kılavuz, Windows işletim sistemi üzerinde bir Electron uygulamasının **Masaüstü kısayol**, **Başlangıç menüsü**, **Görev çubuğu** (Pinned Taskbar) ve **Aktif Çalışan Pencere** ikonlarını kullanıcı ayarına bağlı olarak dinamik, gecikmesiz ve pürüzsüz şekilde değiştirmenin adımlarını anlatır.

---

## 1. Problem Tanımları ve Kısıtlamalar

Windows'ta ikon yenilerken karşılaşılan en büyük 3 engel şunlardır:
1. **İkon Önbelleği (Icon Cache):** Windows kısayol ikonlarını agresif bir şekilde önbelleğe alır. Kısayolun ikon yolunu değiştirmek, ikonun masaüstünde anında güncellenmesini sağlamaz.
2. **Uyumsuz Dosya Formatları:** Windows kısayolları (`.lnk` dosyaları) sadece `.ico` (veya exe içi kaynak) dosyalarını destekler. `.png` veya `.svg` verilirse değişiklik başarısız olur.
3. **Küçük Boyutlarda Bulanıklaşma (Tainted Canvas & Scaling):** İnce detaylı 256x256 piksellik bir vektör resmi 32x32px veya 16x16px boyutlarına (Görev çubuğu / Pencere başlığı) küçüldüğünde, pikseller iç içe geçerek görünmez olur. 
4. **CORS ve app.asar Güvenlik Engeli:** Paketlenen Electron uygulamasında yerel SVG dosyaları canvas'a yüklenip rasterize edilmeye çalışıldığında güvenlik hatası (`Tainted Canvas`) fırlatılır.

---

## 2. Adım Adım Çözüm Mimarisi

### Adım 1: Çoklu Çözünürlüklü .ico Dosyası Oluşturma (Tasarım Optimizasyonu)

Her tema için iki farklı SVG hazırlayın:
*   `Tactile-bg.svg` (Büyük boyutlar için orijinal detaylı tasarım)
*   `Tactile-bg-small.svg` (48px, 32px, 16px gibi küçük boyutlar için çizgileri kalınlaştırılmış, ince detaylardan ve dashed çizgilerden arındırılmış sade tasarım)

Bu iki SVG'yi tek bir `.ico` dosyası (farklı PNG çözünürlükleri içeren bir konteyner) haline getiren bir Node.js betiği (`tools/build-icons.js`) kullanın:

```javascript
const sharp = require('sharp');
// ICO dosya yapısını yazan ikili buffer birleştirici
function createIco(buffers, sizes) {
    // ICO Header ve Directory byte yapılandırması yapılır...
    // PNG buffer'ları sırayla tek bir ICO dosyasında birleştirilir.
}
// 256 ve 128px boyutları için ana SVG; 64, 48, 32 ve 16px için kalın çizgili small.svg derlenir.
```

---

### Adım 2: Paket İçindeki SVG'yi Güvenli Okuma (CORS Aşımı)

Kayıtlı SVG dosyasını renderer (arayüz) katmanında doğrudan `Image.src = 'file://'` ile okumak paketli uygulamada hata vereceğinden, dosyayı **Ana Süreçte (Main Process)** okuyup Base64 data URI'ye dönüştürün:

**`main.js` (Ana Süreç):**
```javascript
ipcMain.handle('get-svg-data-uri', (e, iconType) => {
    const isSmall = iconType.includes('small');
    const svgPath = path.join(__dirname, isSmall ? '../public/Tactile-bg-small.svg' : '../public/Tactile-bg.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf-8');
    return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
});
```

---

### Adım 3: Görev Çubuğu ve Pencere İkonunu Güncelleme (Renderer -> Main)

Arayüz katmanında data URI'yi alıp bir `<canvas>` üzerinde rasterize ederek PNG'ye dönüştürün ve aktif pencere ikonunu set edin. Görev çubuğunun (taskbar) keskin görünmesi için **küçük çözünürlük varyasyonunu (`-small`)** gönderin:

**`app.js` (Arayüz / Renderer):**
```javascript
const applyAppIcon = async (iconType) => {
    // Görev çubuğu/pencere için kalın çizgili küçük versiyonu yükle
    const dataUri = await window.api.getSvgDataUri(iconType + '-small');
    const pngDataUrl = await rasterizeSvgToPng(dataUri); // Canvas ile toDataURL('image/png')
    await window.api.setDynamicAppIcon(pngDataUrl, iconType);
};
```

---

### Adım 4: Masaüstü, Başlat ve Görev Çubuğu Kısayollarını Güncelleme

İkon değiştiğinde ana süreçte hem çalışan pencerenin ikonunu güncelleyin hem de sistemdeki tüm kısayol dosyalarını (`.lnk`) güncelleyin. 

**`main.js` (Ana Süreç):**
```javascript
// Uygulama başlangıcına Windows'un kısayolları ve süreci doğru eşleştirmesi için AppID ekleyin:
app.setAppUserModelId('sizin.uygulama.id');

function updateShortcutIcons(iconType) {
    const userDataPath = app.getPath('userData');
    const iconFileName = iconType === 'light' ? 'Tactile-light.ico' : 'Tactile-bg.ico';
    const destIconPath = path.join(userDataPath, iconFileName);
    
    // 1. ICO dosyasını kalıcı bir yere (AppData/userData) kopyalayın
    fs.copyFileSync(sourceIconPath, destIconPath);

    // 2. Windows'taki tüm olası kısayol hedeflerini tarayın
    const targets = [
        path.join(app.getPath('desktop'), 'Tactile.lnk'), // Masaüstü
        path.join(app.getPath('appData'), 'Microsoft/Windows/Start Menu/Programs/Tactile.lnk'), // Başlangıç Menüsü
        path.join(app.getPath('appData'), 'Microsoft/Internet Explorer/Quick Launch/User Pinned/TaskBar/Tactile.lnk') // Görev Çubuğu
    ];

    const now = new Date();
    targets.forEach(shortcutPath => {
        if (fs.existsSync(shortcutPath)) {
            // 3. Electron Shell API ile kısayolun ikon hedefini güncelleyin
            shell.writeShortcutLink(shortcutPath, 'update', {
                icon: destIconPath,
                iconIndex: 0
            });
            
            // 4. Windows Explorer önbelleğini anında yenilemek için kısayola "DOKUNUN" (Touch)
            fs.utimesSync(shortcutPath, now, now);
        }
    });
}
```

---

## 3. Özet Formül (Hızlı Çözüm İçin Akılda Kalanlar)

1. **Format:** Kısayollar için sadece **`.ico`** kullanın.
2. **Kopya Konumu:** İkon dosyasını sistemin her zaman erişebileceği `app.getPath('userData')` (AppData) altına kopyalayın.
3. **Pencere & Görev Çubuğu:** Çalışan pencere için `win.setIcon()` kullanın, ancak görselin bulanıklaşmaması için **çizgileri kalınlaştırılmış alternatif bir SVG'den** türetilmiş PNG gönderin.
4. **Gruplama:** `app.setAppUserModelId` satırını mutlaka ekleyin, yoksa görev çubuğu kısayol güncellemelerini algılamaz.
5. **Önbellek Yenileme:** Kısayolu güncelledikten sonra `fs.utimesSync` ile kısayol dosyasının değiştirilme tarihini güncelleyin. Windows bunu gördüğü an Explorer'daki ikonu anında günceller.
