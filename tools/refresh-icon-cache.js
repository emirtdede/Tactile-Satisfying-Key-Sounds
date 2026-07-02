const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

if (process.platform !== 'win32') {
    process.exit(0);
}

const now = new Date();
const distFiles = [
    path.join(__dirname, '../dist/Tactile Setup 1.0.0.exe'),
    path.join(__dirname, '../dist/win-unpacked/Tactile.exe')
];

for (const filePath of distFiles) {
    if (fs.existsSync(filePath)) {
        fs.utimesSync(filePath, now, now);
    }
}

const ie4uinit = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32/ie4uinit.exe');
if (fs.existsSync(ie4uinit)) {
    for (const args of [['-ClearIconCache'], ['-show']]) {
        try {
            execFileSync(ie4uinit, args, { stdio: 'ignore', windowsHide: true });
        } catch (err) {}
    }
}

console.log('Windows icon cache refresh requested.');
