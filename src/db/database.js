const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db;
let dbPath;

async function initDB() {
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'tactile.sqlite');
    
    const SQL = await initSqlJs({
        // Optional: specify the WASM location if not found automatically
    });

    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON;');

    // Create Tables
    db.run(`
        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );

        CREATE TABLE IF NOT EXISTS sound_categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS sound_profiles (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT, 
            material TEXT, 
            description TEXT,
            key_define_type TEXT,
            folder_path TEXT NOT NULL,
            sound_file TEXT, 
            is_custom BOOLEAN DEFAULT 0,
            sort_order INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS sound_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            profile_id TEXT NOT NULL,
            keycode TEXT NOT NULL,
            file TEXT,
            start INTEGER,
            length INTEGER,
            FOREIGN KEY (profile_id) REFERENCES sound_profiles(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS custom_packs (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            folder_path TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS favorites (
            profile_id TEXT PRIMARY KEY,
            FOREIGN KEY (profile_id) REFERENCES sound_profiles(id) ON DELETE CASCADE
        );
    `);

    // Migration Check: Add sort_order to sound_profiles if missing
    try {
        const checkCols = db.exec("PRAGMA table_info(sound_profiles)");
        if (checkCols.length > 0) {
            const hasSortOrder = checkCols[0].values.some(row => row[1] === 'sort_order');
            if (!hasSortOrder) {
                db.run("ALTER TABLE sound_profiles ADD COLUMN sort_order INTEGER DEFAULT 0");
                saveDB();
            }
        }
    } catch (migErr) {
        console.error("Migration failed:", migErr);
    }

    // Seed default categories

    // Seed default categories
    const catCheck = db.exec("SELECT COUNT(*) as count FROM sound_categories");
    if (catCheck.length === 0 || catCheck[0].values[0][0] === 0) {
        db.run("INSERT INTO sound_categories (id, name, sort_order) VALUES ('linear', 'Linear', 1)");
        db.run("INSERT INTO sound_categories (id, name, sort_order) VALUES ('tactile', 'Tactile', 2)");
        db.run("INSERT INTO sound_categories (id, name, sort_order) VALUES ('clicky', 'Clicky', 3)");
        saveDB();
    }

    // Seed default settings if empty
    const res = db.exec('SELECT COUNT(*) as count FROM app_settings');
    let count = 0;
    if (res.length > 0 && res[0].values.length > 0) {
        count = res[0].values[0][0];
    }

    if (count === 0) {
        const defaultSettings = {
            volume: '50',
            start_minimized: 'false',
            active_volume: 'true',
            tray_icon: 'true',
            theme: 'dark',
            selected_profile: 'default'
        };
        
        db.run('BEGIN TRANSACTION;');
        const stmt = db.prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)');
        for (const [k, v] of Object.entries(defaultSettings)) {
            stmt.run([k, v]);
        }
        stmt.free();
        db.run('COMMIT;');
        saveDB();
    }
}

function saveDB() {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
}

function getSetting(key) {
    const stmt = db.prepare('SELECT value FROM app_settings WHERE key = ?');
    stmt.bind([key]);
    let val = null;
    if (stmt.step()) {
        val = stmt.getAsObject().value;
    }
    stmt.free();
    return val;
}

function setSetting(key, value) {
    db.run('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, value]);
    saveDB();
}

function getProfiles() {
    const res = db.exec('SELECT * FROM sound_profiles ORDER BY sort_order ASC, name ASC');
    if (res.length === 0) return [];
    
    const columns = res[0].columns;
    return res[0].values.map(row => {
        let obj = {};
        columns.forEach((col, idx) => { obj[col] = row[idx]; });
        return obj;
    });
}

function getCategories() {
    const res = db.exec('SELECT * FROM sound_categories ORDER BY sort_order ASC, name ASC');
    if (res.length === 0) return [];
    const columns = res[0].columns;
    return res[0].values.map(row => {
        let obj = {};
        columns.forEach((col, idx) => { obj[col] = row[idx]; });
        return obj;
    });
}

function createCategory(name) {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const orderRes = db.exec('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM sound_categories');
    const order = orderRes[0].values[0][0];
    db.run('INSERT OR REPLACE INTO sound_categories (id, name, sort_order) VALUES (?, ?, ?)', [id, name, order]);
    saveDB();
    return { id, name };
}

function deleteCategory(id) {
    db.run('DELETE FROM sound_categories WHERE id = ?', [id]);
    // Also delete profiles under this category or reset them
    db.run('DELETE FROM sound_profiles WHERE type = (SELECT name FROM sound_categories WHERE id = ?)', [id]);
    saveDB();
}

function updateCategoryOrder(categoryIds) {
    db.run('BEGIN TRANSACTION;');
    const stmt = db.prepare('UPDATE sound_categories SET sort_order = ? WHERE id = ?');
    categoryIds.forEach((id, idx) => {
        stmt.run([idx, id]);
    });
    stmt.free();
    db.run('COMMIT;');
    saveDB();
}

function renameCategory(id, newName) {
    // Update profile categories first to keep relationship
    db.run('UPDATE sound_profiles SET type = ? WHERE type = (SELECT name FROM sound_categories WHERE id = ?)', [newName, id]);
    db.run('UPDATE sound_categories SET name = ? WHERE id = ?', [newName, id]);
    saveDB();
}

function deleteProfile(id) {
    db.run('DELETE FROM sound_profiles WHERE id = ?', [id]);
    saveDB();
}

function updateProfileOrder(profileIds) {
    db.run('BEGIN TRANSACTION;');
    const stmt = db.prepare('UPDATE sound_profiles SET sort_order = ? WHERE id = ?');
    profileIds.forEach((id, idx) => {
        stmt.run([idx, id]);
    });
    stmt.free();
    db.run('COMMIT;');
    saveDB();
}

function updateProfileDetails(id, name, type, material, description) {
    db.run('UPDATE sound_profiles SET name = ?, type = ?, material = ?, description = ? WHERE id = ?', [name, type, material, description, id]);
    // Also rewrite internal JSON config if it exists
    const profile = getProfileDetails(id);
    if (profile && fs.existsSync(path.join(profile.folder_path, 'config.json'))) {
        try {
            const configPath = path.join(profile.folder_path, 'config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            config.name = name;
            config.type = type;
            config.material = material;
            config.description = description;
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        } catch (e) {
            console.error("Failed to update config.json file:", e);
        }
    }
    saveDB();
}

function getProfileDetails(id) {
    const stmt = db.prepare('SELECT * FROM sound_profiles WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
        stmt.free();
        return null;
    }
    const profile = stmt.getAsObject();
    stmt.free();
    
    const soundsRes = db.exec(`SELECT keycode, file, start, length FROM sound_files WHERE profile_id = '${id.replace(/'/g, "''")}'`);
    
    let defines = {};
    if (soundsRes.length > 0) {
        const cols = soundsRes[0].columns;
        soundsRes[0].values.forEach(row => {
            let s = {};
            cols.forEach((col, idx) => { s[col] = row[idx]; });
            if (profile.key_define_type === 'single') {
                defines[s.keycode] = [s.start, s.length];
            } else {
                defines[s.keycode] = s.file;
            }
        });
    }
    
    profile.defines = defines;
    return profile;
}

function insertProfile(data, isCustom = false) {
    try {
        db.run('BEGIN TRANSACTION;');
        
        // Generate a unique ID using the folder name to avoid collision across duplicate config IDs
        const uniqueId = path.basename(data.folder_path) + '_' + data.id;
        
        db.run(`
            INSERT OR REPLACE INTO sound_profiles (id, name, type, material, description, key_define_type, folder_path, sound_file, is_custom)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            uniqueId, data.name, data.type || 'Linear', data.material || 'ABS', data.description || '',
            data.key_define_type, data.folder_path, data.sound || null, isCustom ? 1 : 0
        ]);
        
        db.run(`DELETE FROM sound_files WHERE profile_id = ?`, [uniqueId]);
        
        if (data.defines) {
            const stmt = db.prepare(`INSERT INTO sound_files (profile_id, keycode, file, start, length) VALUES (?, ?, ?, ?, ?)`);
            for (const [kc, val] of Object.entries(data.defines)) {
                if (!val) continue;
                if (data.key_define_type === 'single') {
                    if (Array.isArray(val) && val.length >= 2) {
                        stmt.run([uniqueId, kc, null, val[0], val[1]]);
                    }
                } else {
                    let file = Array.isArray(val) ? val[0] : val;
                    stmt.run([uniqueId, kc, file, null, null]);
                }
            }
            stmt.free();
        }
        
        db.run('COMMIT;');
        saveDB();
    } catch (e) {
        db.run('ROLLBACK;');
        throw e;
    }
}

function loadDefaultPacks() {
    const audioPath = path.join(__dirname, '..', 'audio');
    if (!fs.existsSync(audioPath)) {
        console.error("Audio path does not exist:", audioPath);
        return;
    }
    
    const folders = fs.readdirSync(audioPath);
    let changed = false;
    folders.forEach(folder => {
        const configPath = path.join(audioPath, folder, 'config.json');
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                config.folder_path = path.join(audioPath, folder);
                
                const lname = config.name.toLowerCase();
                const folderName = folder.toLowerCase();
                if (lname.includes('clicky') || lname.includes('blue') || folderName.includes('blue') || folderName.includes('clicky')) {
                    config.type = 'Clicky';
                } else if (lname.includes('tactile') || lname.includes('brown') || lname.includes('panda') || folderName.includes('brown') || folderName.includes('tactile') || folderName.includes('panda')) {
                    config.type = 'Tactile';
                } else {
                    config.type = 'Linear';
                }
                config.material = (lname.includes('pbt') || folderName.includes('pbt')) ? 'PBT' : ((lname.includes('abs') || folderName.includes('abs')) ? 'ABS' : 'Mixed');
                config.description = `Premium ${config.type} switch sound profile.`;
                
                insertProfile(config, false);
                changed = true;
            } catch (err) {
                console.error('Failed to load pack:', folder, 'Error:', err.message);
            }
        } else {
            console.warn("No config.json found in", folder);
        }
    });
    if (changed) saveDB();
}

module.exports = {
    initDB,
    getSetting,
    setSetting,
    getProfiles,
    getCategories,
    createCategory,
    deleteCategory,
    updateCategoryOrder,
    renameCategory,
    deleteProfile,
    updateProfileOrder,
    updateProfileDetails,
    getProfileDetails,
    insertProfile,
    loadDefaultPacks
};
