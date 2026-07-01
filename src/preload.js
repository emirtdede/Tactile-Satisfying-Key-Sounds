const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Window Controls
    minimize: () => ipcRenderer.send('window-control', 'minimize'),
    maximize: () => ipcRenderer.send('window-control', 'maximize'),
    close: () => ipcRenderer.send('window-control', 'close'),

    // App API
    openExternal: (url) => shell.openExternal(url),
    
    // DB Queries
    getSettings: () => ipcRenderer.invoke('db-get-settings'),
    updateSetting: (key, value) => ipcRenderer.invoke('db-update-setting', key, value),
    getProfiles: () => ipcRenderer.invoke('db-get-profiles'),
    getProfileDetails: (id) => ipcRenderer.invoke('db-get-profile-details', id),
    setActiveProfile: (id) => ipcRenderer.invoke('set-active-profile', id),
    deleteProfile: (id) => ipcRenderer.invoke('db-delete-profile', id),
    updateProfileOrder: (ids) => ipcRenderer.invoke('db-update-profile-order', ids),
    updateProfileDetails: (id, name, type, material, desc) => ipcRenderer.invoke('db-update-profile-details', id, name, type, material, desc),
    getCategories: () => ipcRenderer.invoke('db-get-categories'),
    createCategory: (name) => ipcRenderer.invoke('db-create-category', name),
    deleteCategory: (id) => ipcRenderer.invoke('db-delete-category', id),
    updateCategoryOrder: (ids) => ipcRenderer.invoke('db-update-category-order', ids),
    renameCategory: (id, name) => ipcRenderer.invoke('db-rename-category', id, name),
    
    // Custom Pack Import API
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    selectAudioFile: () => ipcRenderer.invoke('select-audio-file'),
    importFolderPack: (folderPath) => ipcRenderer.invoke('import-folder-pack', folderPath),
    importMixedZipPack: (targetProfileId, keycode, assignedFilePath) => ipcRenderer.invoke('import-mixed-zip-pack', targetProfileId, keycode, assignedFilePath),
    createProfile: (name, type, material, description) => ipcRenderer.invoke('create-profile', name, type, material, description),

    // Playback and UI Events from Main
    onLoadPackSounds: (callback) => ipcRenderer.on('load-pack-sounds', (e, data) => callback(data)),
    onPlaySound: (callback) => ipcRenderer.on('play-sound', (e, data) => callback(data)),
    onMuteStatusChanged: (callback) => ipcRenderer.on('mute-status-changed', (e, muted) => callback(muted)),
    
    // System Integration
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    registerShortcut: (shortcut) => ipcRenderer.invoke('register-shortcut', shortcut),
    unregisterShortcut: () => ipcRenderer.invoke('unregister-shortcut')
});
