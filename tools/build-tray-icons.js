const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetsDir = path.join(__dirname, '../src/assets');

if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

const icons = {
    'tray-app.png': `
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Isometric keycap/switch vector matching Tactile theme -->
            <path d="M12 2L3 6.5L12 11L21 6.5L12 2Z" stroke="#D4AF37" stroke-width="2" stroke-linejoin="round"/>
            <path d="M3 6.5V15.5L12 20V11" stroke="#D4AF37" stroke-width="2" stroke-linejoin="round"/>
            <path d="M21 6.5V15.5L12 20" stroke="#D4AF37" stroke-width="2" stroke-linejoin="round"/>
            <!-- Core stem -->
            <path d="M12 5.5L8 7.5L12 9.5L16 7.5L12 5.5Z" fill="#D4AF37"/>
        </svg>
    `,
    'tray-mute.png': `
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="#D4AF37" stroke-width="2" stroke-linejoin="round" fill="#D4AF37" fill-opacity="0.1"/>
            <path d="M23 9L17 15" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>
            <path d="M17 9L23 15" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `,
    'tray-sound.png': `
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="#D4AF37" stroke-width="2" stroke-linejoin="round" fill="#D4AF37" fill-opacity="0.1"/>
            <path d="M15.54 8.46C16.4774 9.39768 17.0041 10.6692 17.0041 11.995C17.0041 13.3208 16.4774 14.5923 15.54 15.53" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>
            <path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07" stroke="#D4AF37" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `,
    'tray-quit.png': `
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 17L21 12L16 7" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 12H9" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `
};

async function build() {
    console.log("Generating system tray menu icons...");
    for (const [filename, svgContent] of Object.entries(icons)) {
        const outPath = path.join(assetsDir, filename);
        await sharp(Buffer.from(svgContent.trim()))
            .resize(16, 16)
            .png()
            .toFile(outPath);
        console.log(`  - Saved ${filename}`);
    }
    console.log("Tray menu icons generated successfully.");
}

build().catch(err => {
    console.error("Error building tray menu icons:", err);
    process.exit(1);
});
