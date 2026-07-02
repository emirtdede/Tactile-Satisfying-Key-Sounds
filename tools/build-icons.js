const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ICON_SIZES = [256, 128, 64, 48, 32, 24, 16];

const THEMES = {
    bg: {
        svg: path.join(__dirname, '../public/Tactile-bg.svg'),
        outIco: path.join(__dirname, '../public/Tactile-bg.ico')
    },
    light: {
        svg: path.join(__dirname, '../public/Tactile-light.svg'),
        outIco: path.join(__dirname, '../public/Tactile-light.ico')
    }
};

const INSTALLER_HEADER = {
    width: 150,
    height: 57,
    iconSize: 56,
    iconLeft: 94,
    iconTop: 0,
    background: '#F4F6F9',
    outBmp: path.join(__dirname, '../build/installerHeader.bmp')
};

const SETUP_WINDOW_ICON = {
    svg: path.join(__dirname, '../public/Tactile-light-small.svg'),
    outIco: path.join(__dirname, '../build/setupWindowIcon.ico'),
    sizes: [48, 32, 24, 16]
};

function createIco(images) {
    const headerSize = 6;
    const entrySize = 16;
    const header = Buffer.alloc(headerSize);
    const directory = Buffer.alloc(entrySize * images.length);
    let offset = headerSize + directory.length;

    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(images.length, 4);

    images.forEach((image, index) => {
        const entryOffset = index * entrySize;
        directory.writeUInt8(image.size >= 256 ? 0 : image.size, entryOffset);
        directory.writeUInt8(image.size >= 256 ? 0 : image.size, entryOffset + 1);
        directory.writeUInt8(0, entryOffset + 2);
        directory.writeUInt8(0, entryOffset + 3);
        directory.writeUInt16LE(1, entryOffset + 4);
        directory.writeUInt16LE(32, entryOffset + 6);
        directory.writeUInt32LE(image.buffer.length, entryOffset + 8);
        directory.writeUInt32LE(offset, entryOffset + 12);
        offset += image.buffer.length;
    });

    return Buffer.concat([header, directory, ...images.map(image => image.buffer)]);
}

function rgbaToIcoDib(rgbaBuffer, size) {
    const bitmapHeaderSize = 40;
    const pixelDataSize = size * size * 4;
    const maskStride = Math.ceil(size / 32) * 4;
    const maskSize = maskStride * size;
    const dib = Buffer.alloc(bitmapHeaderSize + pixelDataSize + maskSize);

    dib.writeUInt32LE(bitmapHeaderSize, 0);
    dib.writeInt32LE(size, 4);
    dib.writeInt32LE(size * 2, 8);
    dib.writeUInt16LE(1, 12);
    dib.writeUInt16LE(32, 14);
    dib.writeUInt32LE(0, 16);
    dib.writeUInt32LE(pixelDataSize, 20);
    dib.writeInt32LE(0, 24);
    dib.writeInt32LE(0, 28);
    dib.writeUInt32LE(0, 32);
    dib.writeUInt32LE(0, 36);

    let outputOffset = bitmapHeaderSize;
    for (let y = size - 1; y >= 0; y--) {
        const rowOffset = y * size * 4;
        for (let x = 0; x < size; x++) {
            const inputOffset = rowOffset + x * 4;
            dib[outputOffset++] = rgbaBuffer[inputOffset + 2];
            dib[outputOffset++] = rgbaBuffer[inputOffset + 1];
            dib[outputOffset++] = rgbaBuffer[inputOffset];
            dib[outputOffset++] = rgbaBuffer[inputOffset + 3];
        }
    }

    return dib;
}

function rgbToBmp(rawBuffer, width, height, channels = 3) {
    const fileHeaderSize = 14;
    const dibHeaderSize = 40;
    const pixelOffset = fileHeaderSize + dibHeaderSize;
    const rowStride = Math.ceil((width * 3) / 4) * 4;
    const pixelDataSize = rowStride * height;
    const fileSize = pixelOffset + pixelDataSize;
    const bmp = Buffer.alloc(fileSize);

    bmp.write('BM', 0, 'ascii');
    bmp.writeUInt32LE(fileSize, 2);
    bmp.writeUInt32LE(pixelOffset, 10);
    bmp.writeUInt32LE(dibHeaderSize, 14);
    bmp.writeInt32LE(width, 18);
    bmp.writeInt32LE(height, 22);
    bmp.writeUInt16LE(1, 26);
    bmp.writeUInt16LE(24, 28);
    bmp.writeUInt32LE(0, 30);
    bmp.writeUInt32LE(pixelDataSize, 34);
    bmp.writeInt32LE(3780, 38);
    bmp.writeInt32LE(3780, 42);

    let outputOffset = pixelOffset;
    for (let y = height - 1; y >= 0; y--) {
        const rowOffset = y * width * channels;
        for (let x = 0; x < width; x++) {
            const inputOffset = rowOffset + x * channels;
            bmp[outputOffset++] = rawBuffer[inputOffset + 2];
            bmp[outputOffset++] = rawBuffer[inputOffset + 1];
            bmp[outputOffset++] = rawBuffer[inputOffset];
        }
        outputOffset += rowStride - width * 3;
    }

    return bmp;
}

async function renderIconLayer(sourceSvg, size) {
    const raw = await sharp(sourceSvg)
        .resize(size, size, {
            fit: 'contain',
            kernel: sharp.kernel.lanczos3
        })
        .ensureAlpha()
        .raw()
        .toBuffer();

    return {
        size,
        buffer: rgbaToIcoDib(raw, size)
    };
}

async function writeInstallerHeaderBitmap() {
    const icon = await sharp(THEMES.light.svg)
        .resize(INSTALLER_HEADER.iconSize, INSTALLER_HEADER.iconSize, {
            fit: 'contain',
            kernel: sharp.kernel.lanczos3
        })
        .png()
        .toBuffer();

    const { data, info } = await sharp({
        create: {
            width: INSTALLER_HEADER.width,
            height: INSTALLER_HEADER.height,
            channels: 4,
            background: INSTALLER_HEADER.background
        }
    })
        .composite([{
            input: icon,
            left: INSTALLER_HEADER.iconLeft,
            top: INSTALLER_HEADER.iconTop
        }])
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const bmp = rgbToBmp(data, info.width, info.height, info.channels);
    fs.writeFileSync(INSTALLER_HEADER.outBmp, bmp);
    console.log(`Saved installer header BMP -> ${INSTALLER_HEADER.outBmp}`);
}

async function buildTheme(themeName, theme) {
    console.log(`Generating ${themeName} ICO...`);
    const images = [];

    for (const size of ICON_SIZES) {
        images.push(await renderIconLayer(theme.svg, size));
        console.log(`  - ${size}x${size} from ${path.basename(theme.svg)}`);
    }

    const ico = createIco(images);
    fs.writeFileSync(theme.outIco, ico);
    console.log(`Saved ${theme.outIco} (${(ico.length / 1024).toFixed(1)} KB)`);
}

async function buildIcoFromSource(sourceSvg, outputPath, sizes, label) {
    console.log(`Generating ${label} ICO...`);
    const images = [];

    for (const size of sizes) {
        images.push(await renderIconLayer(sourceSvg, size));
        console.log(`  - ${size}x${size} from ${path.basename(sourceSvg)}`);
    }

    const ico = createIco(images);
    fs.writeFileSync(outputPath, ico);
    console.log(`Saved ${outputPath} (${(ico.length / 1024).toFixed(1)} KB)`);
}

async function copyBuildIcons() {
    fs.mkdirSync(path.join(__dirname, '../build'), { recursive: true });

    const buildIconTargets = [
        { source: THEMES.bg.outIco, target: path.join(__dirname, '../build/icon.ico') },
        { source: THEMES.bg.outIco, target: path.join(__dirname, '../build/installerIcon.ico') },
        { source: THEMES.bg.outIco, target: path.join(__dirname, '../build/uninstallerIcon.ico') },
        { source: THEMES.light.outIco, target: path.join(__dirname, '../build/installerHeaderIcon.ico') }
    ];

    for (const { source, target } of buildIconTargets) {
        fs.copyFileSync(source, target);
        console.log(`Copied ${path.basename(source)} -> ${target}`);
    }

    await buildIcoFromSource(
        SETUP_WINDOW_ICON.svg,
        SETUP_WINDOW_ICON.outIco,
        SETUP_WINDOW_ICON.sizes,
        'setup window light'
    );
    await writeInstallerHeaderBitmap();
}

async function run() {
    await buildTheme('dark', THEMES.bg);
    await buildTheme('light', THEMES.light);
    await copyBuildIcons();
    console.log('All ICO files built successfully.');
}

run().catch(err => {
    console.error('Build failed:', err);
    process.exitCode = 1;
});
