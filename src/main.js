const { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./db/database');
const { uIOhook } = require('uiohook-napi');
const { keycodesRemap } = require('./libs/keycodes');
const { t } = require('./i18n');

let win = null;
let tray = null;
let current_pack_data = null;
let is_muted = false;
const activeKeys = new Set();

const SYSTRAY_ICON = path.join(__dirname, 'assets/system-tray-icon.png');

async function initializeApp() {
    console.log("App ready. Initializing database...");
    await db.initDB();
    console.log("DB initialized. Loading default packs...");
    db.loadDefaultPacks();
    
    const startMin = db.getSetting('start_minimized') === 'true';
    is_muted = db.getSetting('muted') === 'true';
    
    createWindow(!startMin);
    setupHook();
    setupTray();
    registerGlobalShortcut();
    
    const profiles = db.getProfiles();
    console.log("Loaded profiles count:", profiles.length);
    console.log("Profiles list:", profiles.map(p => p.name));
    
    const activeProfileId = db.getSetting('selected_profile');
    console.log("Selected profile ID:", activeProfileId);
    if (activeProfileId && activeProfileId !== 'default') {
        loadProfileIntoMemory(activeProfileId);
    } else {
        // Load first available if 'default'
        if (profiles.length > 0) {
            db.setSetting('selected_profile', profiles[0].id);
            loadProfileIntoMemory(profiles[0].id);
        }
    }
}

function registerGlobalShortcut() {
    const shortcut = db.getSetting('shortcut_toggle_mute') || 'Control+K';
    globalShortcut.unregisterAll();
    if (!shortcut) return;
    try {
        const success = globalShortcut.register(shortcut, () => {
            toggleMuteFromShortcut();
        });
        if (success) {
            console.log("Registered global shortcut:", shortcut);
        } else {
            console.error("Failed to register shortcut:", shortcut);
        }
    } catch (err) {
        console.error("Failed to register shortcut:", shortcut, err);
    }
}

function toggleMuteFromShortcut() {
    is_muted = !is_muted;
    db.setSetting('muted', is_muted ? 'true' : 'false');
    if (is_muted) {
        uIOhook.stop();
        activeKeys.clear();
    } else {
        uIOhook.start();
    }
    
    setupTray(); // Rebuild Context Menu to show correct checkbox
    
    if (win && !win.isDestroyed()) {
        win.webContents.send('mute-status-changed', is_muted);
    }
}

function loadProfileIntoMemory(profileId) {
    const profile = db.getProfileDetails(profileId);
    if (!profile) return;
    
    current_pack_data = profile;
    
    const play_type = profile.key_define_type || 'single';
    let soundData = { type: play_type };
    
    if (play_type === 'single') {
        const fullPath = path.join(profile.folder_path, profile.sound_file || '');
        if (profile.sound_file && fs.existsSync(fullPath)) {
            const ext = path.extname(fullPath).toLowerCase().replace('.', '');
            const mimeType = ext === 'mp3' ? 'audio/mpeg' : ext === 'ogg' ? 'audio/ogg' : 'audio/wav';
            const base64Data = fs.readFileSync(fullPath).toString('base64');
            soundData.src = [`data:${mimeType};base64,${base64Data}`];
            soundData.format = [ext];
        } else {
            soundData.src = [`file:///${fullPath.replace(/\\/g, '/')}`];
        }
        soundData.sprite = keycodesRemap(profile.defines);
    } else {
        soundData.data = {};
        const remapped = keycodesRemap(profile.defines);
        
        // Find a fallback file in multi pack (prefer SPACE, ENTER or generic files)
        let fallback_file = null;
        const fallback_options = ['press/SPACE.mp3', 'SPACE.mp3', 'press/GENERIC_R0.mp3', 'GENERIC_R0.mp3'];
        for (const opt of fallback_options) {
            if (fs.existsSync(path.join(profile.folder_path, opt))) {
                fallback_file = opt;
                break;
            }
        }
        // If still no fallback, pick the first defined file
        if (!fallback_file) {
            const firstVal = Object.values(profile.defines)[0];
            fallback_file = Array.isArray(firstVal) ? firstVal[0] : firstVal;
        }

        // Fill all possible keycodes from keycodes fill list so they map to either their specific file or the fallback file
        const { keycodesFill } = require('./libs/keycodes');
        const filledDefines = keycodesFill(profile.defines);
        const remappedFilled = keycodesRemap(filledDefines);

        for (const kc in remappedFilled) {
            let file_name = remapped[kc] || fallback_file;
            if (Array.isArray(file_name)) file_name = file_name[0];
            if (file_name) {
                const fullPath = path.join(profile.folder_path, file_name);
                if (fs.existsSync(fullPath)) {
                    const ext = path.extname(fullPath).toLowerCase().replace('.', '');
                    const mimeType = ext === 'mp3' ? 'audio/mpeg' : ext === 'ogg' ? 'audio/ogg' : 'audio/wav';
                    const base64Data = fs.readFileSync(fullPath).toString('base64');
                    soundData.data[kc] = {
                        src: `data:${mimeType};base64,${base64Data}`,
                        format: [ext]
                    };
                } else {
                    soundData.data[kc] = {
                        src: `file:///${fullPath.replace(/\\/g, '/')}`
                    };
                }
            }
        }
    }
    
    if (win && !win.isDestroyed()) {
        win.webContents.send('load-pack-sounds', soundData);
    }
}

function setupHook() {
    if (!is_muted) {
        uIOhook.start();
    }
    
    uIOhook.on('keydown', (event) => {
        if (activeKeys.has(event.keycode)) {
            return;
        }
        activeKeys.add(event.keycode);

        if(win && !win.isDestroyed()) {
            if (current_pack_data && !is_muted) {
                const play_type = current_pack_data.key_define_type || 'single';
                const sound_id = `keycode-${event.keycode}`;
                win.webContents.send('play-sound', { type: play_type, sound_id });
            }
        }
    });

    uIOhook.on('keyup', (event) => {
        activeKeys.delete(event.keycode);

        if(win && !win.isDestroyed()) {
            // Some profiles map keyup
            if (current_pack_data && !is_muted) {
                const play_type = current_pack_data.key_define_type || 'single';
                const sound_id = `keycode-${event.keycode}-up`;
                win.webContents.send('play-sound', { type: play_type, sound_id });
            }
        }
    });
}

function createWindow(show) {
    win = new BrowserWindow({
        width: 1078,
        height: 705,
        minWidth: 800,
        minHeight: 500,
        frame: false, // Custom titlebar
        transparent: false,
        backgroundColor: '#1A2E40', // Deep navy background
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            autoplayPolicy: 'no-user-gesture-required',
            sandbox: false
        },
        show: show
    });

    win.loadFile(path.join(__dirname, 'app.html'));
    
    // Uncomment to debug renderer
    // win.webContents.openDevTools({ mode: 'detach' });

    win.webContents.on('did-finish-load', () => {
        if (current_pack_data) {
            loadProfileIntoMemory(current_pack_data.id);
        }
    });
    
    win.on('close', function (event) {
        if (!app.isQuiting) {
            event.preventDefault();
            win.hide();
        }
        return false;
    });
}

let clickTimeout = null;

function setupTray() {
    if (db.getSetting('tray_icon') !== 'true') return;
    
    if (!tray) {
        tray = new Tray(SYSTRAY_ICON);
        tray.setToolTip('Tactile');

        const executeTrayAction = (actionType) => {
            const settingKey = actionType === 'single' ? 'tray_click_single' : 'tray_click_double';
            const action = db.getSetting(settingKey) || (actionType === 'single' ? 'open' : 'none');
            
            if (action === 'open') {
                if (win) {
                    win.show();
                    win.focus();
                }
            } else if (action === 'mute') {
                is_muted = !is_muted;
                db.setSetting('muted', is_muted ? 'true' : 'false');
                if (is_muted) {
                    uIOhook.stop();
                    activeKeys.clear();
                } else {
                    uIOhook.start();
                }
                setupTray(); // Rebuild Context Menu to show correct checkbox
                if (win && !win.isDestroyed()) {
                    win.webContents.send('mute-status-changed', is_muted);
                }
            } else if (action === 'vol_up') {
                let vol = parseInt(db.getSetting('volume') || '50');
                vol = Math.min(100, vol + 10);
                db.setSetting('volume', vol.toString());
                if (win && !win.isDestroyed()) {
                    win.webContents.send('volume-changed', vol);
                }
            } else if (action === 'vol_down') {
                let vol = parseInt(db.getSetting('volume') || '50');
                vol = Math.max(0, vol - 10);
                db.setSetting('volume', vol.toString());
                if (win && !win.isDestroyed()) {
                    win.webContents.send('volume-changed', vol);
                }
            }
        };

        tray.on('click', () => {
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                clickTimeout = null;
                executeTrayAction('double');
            } else {
                clickTimeout = setTimeout(() => {
                    clickTimeout = null;
                    executeTrayAction('single');
                }, 250);
            }
        });

        tray.on('double-click', () => {
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                clickTimeout = null;
            }
            executeTrayAction('double');
        });
    }

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Tactile', click: () => { win.show(); win.focus(); } },
        { 
            label: t('tray.mute'), 
            type: 'checkbox', 
            checked: is_muted,
            click: () => {
                is_muted = !is_muted;
                db.setSetting('muted', is_muted ? 'true' : 'false');
                if (is_muted) {
                    uIOhook.stop();
                    activeKeys.clear();
                }
                else uIOhook.start();
                
                if (win && !win.isDestroyed()) {
                    win.webContents.send('mute-status-changed', is_muted);
                }
                setupTray(); // Rebuild context menu
            }
        },
        { label: t('tray.quit'), click: () => { app.isQuiting = true; app.quit(); } }
    ]);

    tray.setContextMenu(contextMenu);
}



// IPC Handlers
ipcMain.on('window-control', (e, action) => {
    if (!win) return;
    if (action === 'minimize') win.minimize();
    if (action === 'maximize') {
        if (win.isMaximized()) win.unmaximize();
        else win.maximize();
    }
    if (action === 'close') win.hide();
});

ipcMain.handle('db-get-settings', () => {
    // Return all settings. SQLite doesn't have a direct "getAll" for our key-val store, 
    // so we'll fetch explicitly or query all.
    // For simplicity, we can fetch specific ones.
    return {
        volume: db.getSetting('volume') || '50',
        start_minimized: db.getSetting('start_minimized') || 'false',
        tray_icon: db.getSetting('tray_icon') || 'true',
        theme: db.getSetting('theme') || 'dark',
        app_icon: db.getSetting('app_icon') || 'dark',
        selected_profile: db.getSetting('selected_profile') || 'default',
        muted: db.getSetting('muted') || 'false',
        tray_click_single: db.getSetting('tray_click_single') || 'open',
        tray_click_double: db.getSetting('tray_click_double') || 'none',
        shortcut_toggle_mute: db.getSetting('shortcut_toggle_mute') || 'Control+K'
    };
});

ipcMain.handle('db-update-setting', (e, key, value) => {
    db.setSetting(key, value);
    if (key === 'tray_icon') {
        if (value === 'true') setupTray();
        else if (tray) { tray.destroy(); tray = null; }
    }
    if (key === 'muted') {
        is_muted = value === 'true';
        if (is_muted) {
            uIOhook.stop();
            activeKeys.clear();
        }
        else uIOhook.start();
    }
    if (key === 'app_icon') {
        // App icon updates are handled dynamically via set-dynamic-app-icon IPC handler
    }
});

ipcMain.handle('set-dynamic-app-icon', (e, pngDataUrl) => {
    if (!win || win.isDestroyed()) return;
    try {
        const image = nativeImage.createFromDataURL(pngDataUrl);
        win.setIcon(image);
        console.log("Dynamically set app icon from data URL");
    } catch (err) {
        console.error("Failed to dynamically set app icon:", err);
    }
});

ipcMain.handle('db-get-profiles', () => db.getProfiles());
ipcMain.handle('db-get-profile-details', (e, id) => {
    const details = db.getProfileDetails(id);
    if (details) {
        // Read file and convert to Base64 for safe CORS-free preview loading in renderer
        if (details.key_define_type === 'single' || !details.key_define_type) {
            const fullPath = path.join(details.folder_path, details.sound_file || '');
            if (details.sound_file && fs.existsSync(fullPath)) {
                const ext = path.extname(fullPath).toLowerCase().replace('.', '');
                const mimeType = ext === 'mp3' ? 'audio/mpeg' : ext === 'ogg' ? 'audio/ogg' : 'audio/wav';
                try {
                    const base64Data = fs.readFileSync(fullPath).toString('base64');
                    details.sound_base64 = `data:${mimeType};base64,${base64Data}`;
                } catch (err) {
                    console.error("Failed to read preview sound file:", fullPath, err);
                }
            }
        } else {
            // Multi-type pack: convert the first key sound file to Base64
            const firstKey = Object.keys(details.defines)[0];
            if (firstKey) {
                const fileName = Array.isArray(details.defines[firstKey]) ? details.defines[firstKey][0] : details.defines[firstKey];
                const fullPath = path.join(details.folder_path, fileName || '');
                if (fileName && fs.existsSync(fullPath)) {
                    const ext = path.extname(fullPath).toLowerCase().replace('.', '');
                    const mimeType = ext === 'mp3' ? 'audio/mpeg' : ext === 'ogg' ? 'audio/ogg' : 'audio/wav';
                    try {
                        const base64Data = fs.readFileSync(fullPath).toString('base64');
                        details.sound_base64 = `data:${mimeType};base64,${base64Data}`;
                    } catch (err) {
                        console.error("Failed to read preview multi file:", fullPath, err);
                    }
                }
            }
        }
    }
    return details;
});
ipcMain.handle('db-delete-profile', (e, id) => db.deleteProfile(id));
ipcMain.handle('db-update-profile-order', (e, ids) => db.updateProfileOrder(ids));
ipcMain.handle('db-update-profile-details', (e, id, name, type, material, desc) => db.updateProfileDetails(id, name, type, material, desc));
ipcMain.handle('db-get-categories', () => db.getCategories());
ipcMain.handle('db-create-category', (e, name) => db.createCategory(name));
ipcMain.handle('db-delete-category', (e, id) => db.deleteCategory(id));
ipcMain.handle('db-update-category-order', (e, ids) => db.updateCategoryOrder(ids));
ipcMain.handle('db-rename-category', (e, id, name) => db.renameCategory(id, name));

ipcMain.handle('set-active-profile', (e, id) => {
    db.setSetting('selected_profile', id);
    loadProfileIntoMemory(id);
});

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('register-shortcut', (e, shortcut) => {
    globalShortcut.unregisterAll();
    if (!shortcut) {
        db.setSetting('shortcut_toggle_mute', '');
        return { success: true };
    }
    try {
        const success = globalShortcut.register(shortcut, () => {
            toggleMuteFromShortcut();
        });
        if (success) {
            db.setSetting('shortcut_toggle_mute', shortcut);
            return { success: true };
        } else {
            return { success: false, error: 'Registration failed (shortcut might be in use)' };
        }
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('unregister-shortcut', () => {
    globalShortcut.unregisterAll();
    db.setSetting('shortcut_toggle_mute', '');
    return { success: true };
});

// Select Folder/File Dialog API
const { dialog } = require('electron');

ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory']
    });
    if (result.canceled) return null;
    return result.filePaths[0];
});

ipcMain.handle('select-audio-file', async () => {
    const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg'] }]
    });
    if (result.canceled) return null;
    return result.filePaths[0];
});

ipcMain.handle('create-profile', async (e, name, type, material, description, soundPath) => {
    try {
        const id = 'custom-' + Date.now();
        const userDataPath = app.getPath('userData');
        const customProfilesDir = path.join(userDataPath, 'custom_profiles');
        if (!fs.existsSync(customProfilesDir)) {
            fs.mkdirSync(customProfilesDir);
        }
        
        const profileFolder = path.join(customProfilesDir, id);
        fs.mkdirSync(profileFolder);

        let copiedSoundFilename = null;
        let playType = 'multi';

        if (soundPath && fs.existsSync(soundPath)) {
            copiedSoundFilename = path.basename(soundPath);
            const destinationPath = path.join(profileFolder, copiedSoundFilename);
            fs.copyFileSync(soundPath, destinationPath);
            playType = 'single';
        }

        const config = {
            id: id,
            name: name,
            type: type,
            material: material,
            description: description || `User created sound list (profile).`,
            key_define_type: playType,
            sound: copiedSoundFilename,
            defines: {}
        };

        const configPath = path.join(profileFolder, 'config.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        config.folder_path = profileFolder;
        db.insertProfile(config, true); // Save to database

        return { success: true, profile: config };
    } catch (err) {
        console.error("Create profile failed:", err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('import-folder-pack', async (e, folderPath) => {
    // Read folder config.json
    try {
        const configPath = path.join(folderPath, 'config.json');
        if (!fs.existsSync(configPath)) {
            // Create a default config if it doesn't exist
            const folderName = path.basename(folderPath);
            const defaultPack = {
                id: 'custom-' + Date.now(),
                name: folderName,
                key_define_type: 'multi',
                defines: {}
            };
            fs.writeFileSync(configPath, JSON.stringify(defaultPack, null, 2));
        }

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config.folder_path = folderPath;
        
        // Guess Switch details
        const lname = config.name.toLowerCase();
        if (lname.includes('clicky') || lname.includes('blue')) {
            config.type = 'Clicky';
        } else if (lname.includes('tactile') || lname.includes('brown') || lname.includes('panda')) {
            config.type = 'Tactile';
        } else {
            config.type = 'Linear';
        }
        config.material = lname.includes('pbt') ? 'PBT' : (lname.includes('abs') ? 'ABS' : 'Mixed');
        config.description = `Custom imported switch sound profile.`;

        db.insertProfile(config, true); // Insert into SQLite as custom profile
        return { success: true, profile: config };
    } catch (err) {
        console.error("Folder import failed:", err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('import-mixed-zip-pack', async (e, targetProfileId, keycode, assignedFilePath) => {
    try {
        // Remap or append sound file directly to profile defines
        const profile = db.getProfileDetails(targetProfileId);
        if (!profile) return { success: false, error: 'Profile not found' };

        // Copy assigned file to the target profile directory
        const destFileName = path.basename(assignedFilePath);
        const destPath = path.join(profile.folder_path, destFileName);
        fs.copyFileSync(assignedFilePath, destPath);

        // Update defines
        const configPath = path.join(profile.folder_path, 'config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (!config.defines) config.defines = {};
        config.defines[keycode] = destFileName;

        // Save back to JSON config and reload into DB
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        config.folder_path = profile.folder_path;
        db.insertProfile(config, profile.is_custom === 1);

        return { success: true };
    } catch (err) {
        console.error("Assign sound failed:", err);
        return { success: false, error: err.message };
    }
});

// App Lifecycle
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (win) { win.show(); win.focus(); }
    });

    app.on('ready', initializeApp);

    app.on('will-quit', () => {
        globalShortcut.unregisterAll();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
}
