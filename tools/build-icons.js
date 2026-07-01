const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ICO compiler helper
function createIco(buffers, sizes) {
    const headerSize = 6;
    const directoryEntrySize = 16;
    const totalHeaderAndDirSize = headerSize + directoryEntrySize * buffers.length;

    const header = Buffer.alloc(headerSize);
    header.writeUInt16LE(0, 0); // Reserved
    header.writeUInt16LE(1, 2); // Type (1 = ICO)
    header.writeUInt16LE(buffers.length, 4); // Number of images

    const directory = Buffer.alloc(directoryEntrySize * buffers.length);
    let offset = totalHeaderAndDirSize;

    for (let i = 0; i < buffers.length; i++) {
        const size = sizes[i];
        const data = buffers[i];
        const dirOffset = i * directoryEntrySize;

        directory.writeUInt8(size >= 256 ? 0 : size, dirOffset + 0); // Width
        directory.writeUInt8(size >= 256 ? 0 : size, dirOffset + 1); // Height
        directory.writeUInt8(0, dirOffset + 2); // Color count
        directory.writeUInt8(0, dirOffset + 3); // Reserved
        directory.writeUInt16LE(1, dirOffset + 4); // Planes
        directory.writeUInt16LE(32, dirOffset + 6); // Bits per pixel
        directory.writeUInt32LE(data.length, dirOffset + 8); // Size
        directory.writeUInt32LE(offset, dirOffset + 12); // Offset

        offset += data.length;
    }

    return Buffer.concat([header, directory, ...buffers]);
}

async function buildIcoTheme(theme) {
    const isLight = theme === 'light';
    const mainSvg = path.join(__dirname, `../public/Tactile-${theme}.svg`);
    const smallSvg = path.join(__dirname, `../public/Tactile-${theme}-small.svg`);
    const outIco = path.join(__dirname, `../public/Tactile-${theme}.ico`);

    console.log(`Generating ICO for ${theme} theme...`);

    const sizes = [256, 128, 64, 48, 32, 16];
    const buffers = [];

    for (const size of sizes) {
        // Use high-detail SVG for >= 128px, and optimized thick SVG for < 128px
        const sourceSvg = size >= 128 ? mainSvg : smallSvg;
        
        const pngBuffer = await sharp(sourceSvg)
            .resize(size, size)
            .png()
            .toBuffer();
            
        buffers.push(pngBuffer);
        console.log(`  - Rendered ${size}x${size} from ${path.basename(sourceSvg)}`);
    }

    const icoBuffer = createIco(buffers, sizes);
    fs.writeFileSync(outIco, icoBuffer);
    console.log(`Saved compiled ICO to: ${outIco} (${(icoBuffer.length / 1024).toFixed(1)} KB)`);
}

async function run() {
    try {
        await buildIcoTheme('bg');
        await buildIcoTheme('light');
        console.log("All ICO files built successfully.");
    } catch (err) {
        console.error("Build failed:", err);
    }
}

run();
