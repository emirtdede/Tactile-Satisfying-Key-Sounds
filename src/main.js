const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./db/database');
const { uIOhook } = require('uiohook-napi');
const { keycodesRemap } = require('./libs/keycodes');

let win = null;
let tray = null;
let current_pack_data = null;
let is_muted = false;

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

function loadProfileIntoMemory(profileId) {
    const profile = db.getProfileDetails(profileId);
    if (!profile) return;
    
    current_pack_data = profile;
    
    const play_type = profile.key_define_type || 'single';
    let soundData = { type: play_type };
    
    if (play_type === 'single') {
        soundData.src = [`file:///${path.join(profile.folder_path, profile.sound_file).replace(/\\/g, '/')}`];
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
                soundData.data[kc] = { src: `file:///${path.join(profile.folder_path, file_name).replace(/\\/g, '/')}` };
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
        if(win && !win.isDestroyed()) {
            if (current_pack_data && !is_muted) {
                const play_type = current_pack_data.key_define_type || 'single';
                const sound_id = `keycode-${event.keycode}`;
                win.webContents.send('play-sound', { type: play_type, sound_id });
            }
        }
    });

    uIOhook.on('keyup', (event) => {
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
        width: 900,
        height: 650,
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

function setupTray() {
    if (db.getSetting('tray_icon') !== 'true') return;
    if (tray) return;

    tray = new Tray(SYSTRAY_ICON);
    tray.setToolTip('Tactile');

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Tactile', click: () => { win.show(); win.focus(); } },
        { 
            label: 'Mute', 
            type: 'checkbox', 
            checked: is_muted,
            click: () => {
                is_muted = !is_muted;
                db.setSetting('muted', is_muted ? 'true' : 'false');
                if (is_muted) uIOhook.stop();
                else uIOhook.start();
            }
        },
        { label: 'Quit', click: () => { app.isQuiting = true; app.quit(); } }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on("double-click", () => { win.show(); win.focus(); });
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
        selected_profile: db.getSetting('selected_profile') || 'default',
        muted: db.getSetting('muted') || 'false'
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
        if (is_muted) uIOhook.stop();
        else uIOhook.start();
    }
});

ipcMain.handle('db-get-profiles', () => db.getProfiles());
ipcMain.handle('db-get-profile-details', (e, id) => db.getProfileDetails(id));
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

ipcMain.handle('create-profile', async (e, name, type, material, description) => {
    try {
        const id = 'custom-' + Date.now();
        const userDataPath = app.getPath('userData');
        const customProfilesDir = path.join(userDataPath, 'custom_profiles');
        if (!fs.existsSync(customProfilesDir)) {
            fs.mkdirSync(customProfilesDir);
        }
        
        const profileFolder = path.join(customProfilesDir, id);
        fs.mkdirSync(profileFolder);

        const config = {
            id: id,
            name: name,
            type: type,
            material: material,
            description: description || `User created sound list (profile).`,
            key_define_type: 'multi',
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

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
}
