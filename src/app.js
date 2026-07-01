// Tactile UI Logic

let profiles = [];
let audio_instances = {}; // For previewing sounds in UI
let current_view = 'linear';
let active_profile_id = null;
let settings = {};
let categories = [];
let materials = ['PBT', 'ABS', 'Mixed'];

// Custom Dialog Promise wrappers
function showCustomAlert(message, title = t('dialog.notification')) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-dialog-overlay');
        document.getElementById('dialog-title-text').innerText = title;
        document.getElementById('dialog-body-message').innerText = message;
        document.getElementById('dialog-input-group').style.display = 'none';
        document.getElementById('dialog-cancel-btn').style.display = 'none';
        
        const confirmBtn = document.getElementById('dialog-confirm-btn');
        confirmBtn.innerText = t('dialog.ok');
        
        const closeHandler = () => {
            overlay.classList.remove('active');
            confirmBtn.removeEventListener('click', closeHandler);
            resolve();
        };
        confirmBtn.addEventListener('click', closeHandler);
        overlay.classList.add('active');
    });
}

function showCustomConfirm(message, title = t('dialog.confirm_action')) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-dialog-overlay');
        document.getElementById('dialog-title-text').innerText = title;
        document.getElementById('dialog-body-message').innerText = message;
        document.getElementById('dialog-input-group').style.display = 'none';
        
        const cancelBtn = document.getElementById('dialog-cancel-btn');
        const confirmBtn = document.getElementById('dialog-confirm-btn');
        cancelBtn.style.display = 'inline-block';
        cancelBtn.innerText = t('dialog.cancel');
        confirmBtn.innerText = t('dialog.confirm');
        
        const onConfirm = () => {
            overlay.classList.remove('active');
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(true);
        };
        
        const onCancel = () => {
            overlay.classList.remove('active');
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(false);
        };
        
        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
        overlay.classList.add('active');
    });
}

function showCustomPrompt(message, defaultValue = "", title = t('dialog.input_required')) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-dialog-overlay');
        document.getElementById('dialog-title-text').innerText = title;
        document.getElementById('dialog-body-message').innerText = message;
        document.getElementById('dialog-input-group').style.display = 'block';
        
        const inputField = document.getElementById('dialog-prompt-input');
        inputField.value = defaultValue;
        
        const cancelBtn = document.getElementById('dialog-cancel-btn');
        const confirmBtn = document.getElementById('dialog-confirm-btn');
        cancelBtn.style.display = 'inline-block';
        cancelBtn.innerText = t('dialog.cancel');
        confirmBtn.innerText = t('dialog.save');
        
        const onConfirm = () => {
            const val = inputField.value;
            overlay.classList.remove('active');
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(val);
        };
        
        const onCancel = () => {
            overlay.classList.remove('active');
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(null);
        };
        
        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
        overlay.classList.add('active');
        inputField.focus();
    });
}

// Helper to load and render dynamic materials filters
function loadAndRenderMaterials(skipSelectSync = false) {
    const filtersContainer = document.querySelector('.filters');
    if (!filtersContainer) return;
    
    // Read currently active filter
    const activeChip = filtersContainer.querySelector('.chip.active');
    const activeText = activeChip ? activeChip.innerText.trim() : 'All';
    
    // Reset materials array to standard defaults, then append active ones
    materials = ['PBT', 'ABS', 'Mixed'];
    const uniqueFromProfiles = [...new Set(profiles.map(p => p.material).filter(Boolean))];
    uniqueFromProfiles.forEach(m => {
        if (!materials.includes(m)) {
            materials.push(m);
        }
    });
    
    filtersContainer.innerHTML = `<button class="chip">${t('filter.all')}</button>`;
    materials.forEach(mat => {
        const btn = document.createElement('button');
        btn.className = 'chip';
        btn.innerText = mat;
        filtersContainer.appendChild(btn);
    });
    
    // Restore active state
    let foundActive = false;
    filtersContainer.querySelectorAll('.chip').forEach(c => {
        if (c.innerText.trim() === activeText) {
            c.classList.add('active');
            foundActive = true;
        }
    });
    if (!foundActive) {
        filtersContainer.querySelector('.chip').classList.add('active');
    }
    
    // Rebind chip clicks
    filtersContainer.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            filtersContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderProfiles(current_view);
        });
    });
    
    if (skipSelectSync) return;

    // Sync the selects options dynamically (options only, no event listeners)
    const rebuildSelectOptions = (selectId) => {
        const select = document.getElementById(selectId);
        if (!select) return;
        if (select.children.length > 0) return; // Already populated from HTML or prior call
        
        const currentVal = select.value;
        
        materials.forEach(mat => {
            const opt = document.createElement('option');
            opt.value = mat;
            opt.innerText = mat;
            select.appendChild(opt);
        });
        
        const addOpt = document.createElement('option');
        addOpt.value = '__NEW__';
        addOpt.innerText = t('modal.add_new_material');
        select.appendChild(addOpt);
        
        if (currentVal && (materials.includes(currentVal) || currentVal === '__NEW__')) {
            select.value = currentVal;
        }
    };
    
    rebuildSelectOptions('select-new-profile-material');
    rebuildSelectOptions('select-edit-profile-material');
}

// Helper to populate and load sidebar categories
async function loadAndRenderCategories() {
    const categoriesListContainer = document.getElementById('dynamic-categories-list');
    const selectNewProfileType = document.getElementById('select-new-profile-type');
    const selectEditProfileType = document.getElementById('select-edit-profile-type');
    
    categories = await window.api.getCategories();
    
    // Render in sidebar
    categoriesListContainer.innerHTML = '';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `nav-item ${current_view === cat.id ? 'active' : ''}`;
        btn.setAttribute('data-view', cat.id);
        btn.innerText = cat.name;
        
        // Add right-click context menu listener
        btn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const ctxMenu = document.getElementById('custom-context-menu');
            ctxMenu.style.display = 'block';
            ctxMenu.style.left = `${e.clientX}px`;
            ctxMenu.style.top = `${e.clientY}px`;
            
            // Bind context actions
            document.getElementById('context-rename-cat').onclick = async () => {
                const newName = await showCustomPrompt(t('msg.rename_category'), cat.name, t('msg.rename_category_title'));
                if (newName && newName !== cat.name) {
                    await window.api.renameCategory(cat.id, newName);
                    await loadAndRenderCategories();
                    profiles = await window.api.getProfiles();
                    renderProfiles(current_view);
                }
                ctxMenu.style.display = 'none';
            };
            
            document.getElementById('context-delete-cat').onclick = async () => {
                const confirmed = await showCustomConfirm(tf('msg.confirm_delete_category', cat.name), t('msg.delete_category_title'));
                if (confirmed) {
                    await window.api.deleteCategory(cat.id);
                    if (current_view === cat.id) {
                        current_view = 'linear';
                    }
                    await loadAndRenderCategories();
                    profiles = await window.api.getProfiles();
                    renderProfiles(current_view);
                }
                ctxMenu.style.display = 'none';
            };
        });

        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            switchView(cat.id);
        });
        categoriesListContainer.appendChild(btn);
    });

    // Close context menu on general click
    document.addEventListener('click', () => {
        document.getElementById('custom-context-menu').style.display = 'none';
    });

    // Populate selects
    selectNewProfileType.innerHTML = '';
    selectEditProfileType.innerHTML = '';
    categories.forEach(cat => {
        const opt1 = document.createElement('option');
        opt1.value = cat.name; // Keep DB compatibility
        opt1.innerText = cat.name;
        selectNewProfileType.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = cat.name;
        opt2.innerText = cat.name;
        selectEditProfileType.appendChild(opt2);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Window Controls
    document.getElementById('btn-min').addEventListener('click', () => window.api.minimize());
    document.getElementById('btn-max').addEventListener('click', () => window.api.maximize());
    document.getElementById('btn-close').addEventListener('click', () => window.api.close());

    // Audio Playback Listeners (Must be registered early to receive initial soundpack load events)
    window.api.onLoadPackSounds((soundData) => {
        // Unload old
        Object.values(audio_instances).forEach(h => h.unload());
        audio_instances = {};
        
        const vol = parseInt(document.getElementById('global-volume').value) / 100;
        
        if (soundData.type === 'single') {
            audio_instances['single'] = new Howl({
                src: soundData.src,
                sprite: soundData.sprite,
                volume: vol,
                html5: false, // Forces Web Audio API (highly responsive, low latency)
                preload: true
            });
        } else {
            for (const kc in soundData.data) {
                audio_instances[kc] = new Howl({
                    src: [soundData.data[kc].src],
                    volume: vol,
                    html5: false, // Forces Web Audio API
                    preload: true
                });
            }
        }
    });

    window.api.onPlaySound((data) => {
        // We only use this for UI preview if needed, but the main process handles global hook playback.
        // Wait, the main process sends 'play-sound' here so the RENDERER actually plays it!
        // Yes, Howler lives in the renderer.
        const vol = parseInt(document.getElementById('global-volume').value) / 100;
        
        if (data.type === 'single') {
            if (audio_instances['single']) {
                audio_instances['single'].volume(vol);
                audio_instances['single'].play(data.sound_id);
            }
        } else {
            const h = audio_instances[data.sound_id];
            if (h) {
                h.volume(vol);
                h.play();
            }
        }
    });

    // Load initial data
    settings = await window.api.getSettings();
    profiles = await window.api.getProfiles();
    
    // Set active profile on startup to load sounds into memory
    active_profile_id = settings.selected_profile;
    if (active_profile_id && active_profile_id !== 'default') {
        setActiveProfile(active_profile_id);
    } else if (profiles.length > 0) {
        setActiveProfile(profiles[0].id);
    }

    // Apply saved language before applying dynamic translations
    const savedLang = settings.language || 'tr';
    setLang(savedLang);
    applyTranslations();

    document.getElementById('app-version-display').innerText = `Version ${await window.api.getAppVersion()}`;

    // Apply Settings
    document.getElementById('global-volume').value = settings.volume;
    document.getElementById('setting-tray').checked = settings.tray_icon === 'true';
    document.getElementById('setting-startup').checked = settings.start_minimized === 'true'; // Map to start minimized / startup behavior
    
    // Mute UI Control & Synchronization
    const btnMute = document.getElementById('btn-toggle-mute');
    function updateMuteUI(isMuted) {
        if (isMuted) {
            btnMute.innerHTML = `
                <svg class="volume-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
            `;
            btnMute.title = "Ses Aç";
        } else {
            btnMute.innerHTML = `
                <svg class="volume-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
            `;
            btnMute.title = "Sessiz";
        }
        const settingMute = document.getElementById('setting-mute');
        if (settingMute) {
            settingMute.checked = isMuted;
        }
    }

    const initialMuted = settings.muted === 'true';
    updateMuteUI(initialMuted);
    
    const langSelect = document.getElementById('setting-lang');
    if (langSelect) {
        langSelect.value = savedLang;
        langSelect.addEventListener('change', async (e) => {
            const nextLang = e.target.value;
            setLang(nextLang);
            await window.api.updateSetting('language', nextLang);
            applyTranslations();
            
            // Re-render categories and profiles to update all textual filters and navigation
            await loadAndRenderCategories();
            loadAndRenderMaterials();
            renderProfiles(current_view);
            updateActiveProfileBadge();
        });
    }

    // Settings event listeners
    document.getElementById('global-volume').addEventListener('input', (e) => {
        window.api.updateSetting('volume', e.target.value);
    });

    document.getElementById('setting-tray').addEventListener('change', (e) => {
        window.api.updateSetting('tray_icon', e.target.checked ? 'true' : 'false');
    });

    document.getElementById('setting-startup').addEventListener('change', (e) => {
        window.api.updateSetting('start_minimized', e.target.checked ? 'true' : 'false');
    });

    document.getElementById('setting-mute').addEventListener('change', async (e) => {
        const nextMute = e.target.checked;
        settings.muted = nextMute ? 'true' : 'false';
        await window.api.updateSetting('muted', settings.muted);
        updateMuteUI(nextMute);
    });

    btnMute.addEventListener('click', async () => {
        const nextMute = settings.muted !== 'true';
        settings.muted = nextMute ? 'true' : 'false';
        await window.api.updateSetting('muted', settings.muted);
        updateMuteUI(nextMute);
    });

    // Listen for tray mute changes
    window.api.onMuteStatusChanged((muted) => {
        settings.muted = muted ? 'true' : 'false';
        updateMuteUI(muted);
    });

    window.api.onVolumeChanged((vol) => {
        settings.volume = vol.toString();
        document.getElementById('global-volume').value = vol;
        const hVol = vol / 100;
        Object.values(audio_instances).forEach(h => h.volume(hVol));
    });

    // Apply initial values for new settings
    const traySingleSelect = document.getElementById('setting-tray-single');
    const trayDoubleSelect = document.getElementById('setting-tray-double');
    const btnRecordShortcut = document.getElementById('btn-record-shortcut');
    const btnClearShortcut = document.getElementById('btn-clear-shortcut');

    if (traySingleSelect) traySingleSelect.value = settings.tray_click_single || 'open';
    if (trayDoubleSelect) trayDoubleSelect.value = settings.tray_click_double || 'none';
    
    const formatShortcutForUser = (shortcut) => {
        if (!shortcut) return '';
        return shortcut
            .replace(/Control/g, 'CTRL')
            .replace(/CommandOrControl/g, 'CTRL')
            .replace(/Shift/g, 'SHIFT')
            .replace(/Alt/g, 'ALT')
            .replace(/Meta/g, 'META')
            .split('+')
            .join(' + ');
    };
    
    const updateShortcutButtonLabel = () => {
        const currentShortcut = settings.shortcut_toggle_mute || '';
        if (currentShortcut) {
            btnRecordShortcut.innerText = formatShortcutForUser(currentShortcut);
        } else {
            btnRecordShortcut.innerText = t('settings.shortcut_record_placeholder');
        }
    };
    updateShortcutButtonLabel();

    // Dropdowns change events
    if (traySingleSelect) {
        traySingleSelect.addEventListener('change', async (e) => {
            settings.tray_click_single = e.target.value;
            await window.api.updateSetting('tray_click_single', settings.tray_click_single);
        });
    }
    if (trayDoubleSelect) {
        trayDoubleSelect.addEventListener('change', async (e) => {
            settings.tray_click_double = e.target.value;
            await window.api.updateSetting('tray_click_double', settings.tray_click_double);
        });
    }

    // Shortcut recording logic
    let isRecordingShortcut = false;
    
    const handleShortcutKeyDown = async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const key = event.key;

        // Escape cancels recording
        if (key === 'Escape') {
            stopRecording();
            return;
        }

        // If user presses only modifiers, wait for a normal key
        if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
            return;
        }

        // Build the shortcut string in Electron format
        const parts = [];
        if (event.ctrlKey) parts.push('Control');
        if (event.altKey) parts.push('Alt');
        if (event.shiftKey) parts.push('Shift');
        if (event.metaKey) parts.push('Meta');

        // Map javascript key names to Electron globalShortcut key strings
        let electronKey = key.toUpperCase();
        if (key === ' ') electronKey = 'Space';
        if (key.startsWith('Arrow')) electronKey = key.substring(5); // ArrowUp -> Up, ArrowDown -> Down
        
        parts.push(electronKey);
        
        const shortcutString = parts.join('+');
        
        stopRecording();
        
        // Register the new shortcut via Main Process
        const res = await window.api.registerShortcut(shortcutString);
        if (res.success) {
            settings.shortcut_toggle_mute = shortcutString;
            updateShortcutButtonLabel();
        } else {
            showCustomAlert(t('settings.shortcut_error'));
            updateShortcutButtonLabel();
        }
    };

    function startRecording() {
        isRecordingShortcut = true;
        btnRecordShortcut.innerText = t('settings.shortcut_recording');
        btnRecordShortcut.classList.add('recording');
        window.addEventListener('keydown', handleShortcutKeyDown, true);
    }

    function stopRecording() {
        isRecordingShortcut = false;
        btnRecordShortcut.classList.remove('recording');
        window.removeEventListener('keydown', handleShortcutKeyDown, true);
    }

    btnRecordShortcut.addEventListener('click', () => {
        if (isRecordingShortcut) {
            stopRecording();
            updateShortcutButtonLabel();
        } else {
            startRecording();
        }
    });

    btnClearShortcut.addEventListener('click', async () => {
        stopRecording();
        await window.api.unregisterShortcut();
        settings.shortcut_toggle_mute = '';
        updateShortcutButtonLabel();
    });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.getAttribute('data-view');
            
            // Clear search box when switching tabs
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.value = '';
            const btnClearSearch = document.getElementById('btn-clear-search');
            if (btnClearSearch) btnClearSearch.style.display = 'none';
            
            switchView(view);
        });
    });

    // Search input listener
    const searchInput = document.getElementById('search-input');
    const btnClearSearch = document.getElementById('btn-clear-search');
    
    const updateSearchClearButton = () => {
        if (searchInput && btnClearSearch) {
            if (searchInput.value.trim() !== '') {
                btnClearSearch.style.display = 'flex';
            } else {
                btnClearSearch.style.display = 'none';
            }
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            updateSearchClearButton();
            renderProfiles(current_view);
        });
    }

    if (btnClearSearch && searchInput) {
        btnClearSearch.addEventListener('click', () => {
            searchInput.value = '';
            updateSearchClearButton();
            renderProfiles(current_view);
            searchInput.focus();
        });
    }

    // Material Filter Chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderProfiles(current_view);
        });
    });

    // ─── Material Select: Show/Hide "New Material Name" input ───
    function bindMaterialSelectToggle(selectId, wrapId, inputId) {
        const sel = document.getElementById(selectId);
        if (!sel) return;
        sel.addEventListener('change', () => {
            const wrap = document.getElementById(wrapId);
            const inp  = document.getElementById(inputId);
            if (sel.value === '__NEW__') {
                if (wrap) {
                    wrap.style.display = 'block';
                    // Force reflow before animating
                    void wrap.offsetHeight;
                    wrap.style.maxHeight = '200px';
                    wrap.style.opacity = '1';
                    wrap.style.marginTop = '12px';
                }
                if (inp) setTimeout(() => inp.focus(), 60);
            } else {
                if (wrap) {
                    wrap.style.maxHeight = '0';
                    wrap.style.opacity = '0';
                    wrap.style.marginTop = '0';
                    setTimeout(() => { wrap.style.display = 'none'; }, 300);
                }
                if (inp) inp.value = '';
            }
        });
    }
    bindMaterialSelectToggle(
        'select-new-profile-material',
        'wrap-new-profile-material-new',
        'input-new-profile-material-new'
    );
    bindMaterialSelectToggle(
        'select-edit-profile-material',
        'wrap-edit-profile-material-new',
        'input-edit-profile-material-new'
    );

    // External Links
    document.getElementById('link-website').addEventListener('click', (e) => {
        e.preventDefault(); window.api.openExternal('https://vellium.dev');
    });
    document.getElementById('btn-web-site').addEventListener('click', (e) => {
        e.preventDefault(); window.api.openExternal('https://vellium.dev');
    });

    // Custom Pack Import & Remap Toggles
    const dropZone = document.getElementById('drop-zone');
    const selectAppendProfile = document.getElementById('select-append-profile');
    const keycodeInput = document.getElementById('input-target-keycode');
    
    // Drag & Drop Folder Import
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--accent-gold)';
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = 'var(--border-subtle)';
        });

        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--border-subtle)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const folderPath = files[0].path; // Electron file path
                const res = await window.api.importFolderPack(folderPath);
                if (res.success) {
                    await showCustomAlert(`${t('msg.import_success')} ${res.profile.name}`);
                    profiles = await window.api.getProfiles(); // Reload local list
                    if (selectAppendProfile) populateAppendProfiles();
                    renderProfiles(current_view);
                } else {
                    await showCustomAlert(`${t('msg.import_failed')} ${res.error}`);
                }
            }
        });
    }

    // Select Folder via Dialog
    const btnSelectFolder = document.getElementById('btn-select-folder');
    if (btnSelectFolder) {
        btnSelectFolder.addEventListener('click', async () => {
            const folderPath = await window.api.selectDirectory();
            if (folderPath) {
                const res = await window.api.importFolderPack(folderPath);
                if (res.success) {
                    await showCustomAlert(`${t('msg.import_success')} ${res.profile.name}`);
                    profiles = await window.api.getProfiles();
                    if (selectAppendProfile) populateAppendProfiles();
                    renderProfiles(current_view);
                } else {
                    await showCustomAlert(`${t('msg.import_failed')} ${res.error}`);
                }
            }
        });
    }

    // Populator for Append dropdown
    const populateAppendProfiles = () => {
        if (!selectAppendProfile) return;
        selectAppendProfile.innerHTML = '';
        profiles.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.innerText = p.name;
            selectAppendProfile.appendChild(opt);
        });
    };

    // Trigger select profile listing on load
    if (selectAppendProfile) {
        setTimeout(populateAppendProfiles, 500);
    }

    // Select & Remap individual key file
    const btnAppendFile = document.getElementById('btn-append-file');
    if (btnAppendFile) {
        btnAppendFile.addEventListener('click', async () => {
            const targetId = selectAppendProfile ? selectAppendProfile.value : null;
            const keycode = keycodeInput ? keycodeInput.value : null;
            if (!targetId || !keycode) {
                await showCustomAlert(t('msg.select_profile_keycode'));
                return;
            }

            const filePath = await window.api.selectAudioFile();
            if (filePath) {
                const res = await window.api.importMixedZipPack(targetId, keycode, filePath);
                if (res.success) {
                    await showCustomAlert(t('msg.audio_assigned'));
                    profiles = await window.api.getProfiles();
                    renderProfiles(current_view);
                } else {
                    await showCustomAlert(`${t('msg.assign_failed')} ${res.error}`);
                }
            }
        });
    }

    // Category Creation Modal
    const createCategoryModal = document.getElementById('create-category-modal');
    document.getElementById('btn-add-category').addEventListener('click', (e) => {
        e.stopPropagation();
        createCategoryModal.classList.add('active');
    });
    document.getElementById('modal-category-close-x').addEventListener('click', () => {
        createCategoryModal.classList.remove('active');
    });
    document.getElementById('modal-category-save-btn').addEventListener('click', async () => {
        const name = document.getElementById('input-new-category-name').value;
        if (!name) {
            await showCustomAlert(t('msg.enter_category_name'));
            return;
        }
        await window.api.createCategory(name);
        document.getElementById('input-new-category-name').value = '';
        createCategoryModal.classList.remove('active');
        await loadAndRenderCategories();
    });

    // Manage Categories Modal & Drag Reorder
    const manageCategoriesModal = document.getElementById('manage-categories-modal');
    const manageCategoriesList = document.getElementById('manage-categories-list');

    document.getElementById('btn-edit-categories').addEventListener('click', () => {
        renderManageCategories();
        manageCategoriesModal.classList.add('active');
    });

    document.getElementById('modal-manage-close-x').addEventListener('click', () => {
        manageCategoriesModal.classList.remove('active');
    });

    document.getElementById('modal-manage-ok-btn').addEventListener('click', () => {
        manageCategoriesModal.classList.remove('active');
    });

    const renderManageCategories = () => {
        manageCategoriesList.innerHTML = '';
        categories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'manage-cat-item';
            item.draggable = true;
            item.setAttribute('data-id', cat.id);
            item.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: var(--bg-surface-hover);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-md);
                padding: 10px 16px;
                cursor: grab;
                color: var(--text-primary);
                font-size: 13px;
                gap: 12px;
            `;
            item.innerHTML = `
                <span style="flex-grow: 1;">☰ ${cat.name}</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="btn btn-rename-cat" title="Rename" style="padding: 6px; font-size: 12px; flex: none; width: auto; background: transparent; border: none; color: var(--accent-gold); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
                        </svg>
                    </button>
                    <button class="btn btn-delete-cat" title="Delete" style="padding: 6px; font-size: 12px; flex: none; width: auto; background: transparent; border: none; color: #E81123; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            `;

            // Bind click handlers inside Manage dialog
            item.querySelector('.btn-rename-cat').addEventListener('click', async (e) => {
                e.stopPropagation();
                const newName = await showCustomPrompt(t('msg.rename_category'), cat.name, t('msg.rename_category_title'));
                if (newName && newName !== cat.name) {
                    await window.api.renameCategory(cat.id, newName);
                    await loadAndRenderCategories();
                    profiles = await window.api.getProfiles();
                    renderManageCategories();
                    renderProfiles(current_view);
                }
            });

            item.querySelector('.btn-delete-cat').addEventListener('click', async (e) => {
                e.stopPropagation();
                const confirmed = await showCustomConfirm(tf('msg.confirm_delete_category', cat.name), t('msg.delete_category_title'));
                if (confirmed) {
                    await window.api.deleteCategory(cat.id);
                    if (current_view === cat.id) {
                        current_view = 'linear';
                    }
                    await loadAndRenderCategories();
                    profiles = await window.api.getProfiles();
                    renderManageCategories();
                    renderProfiles(current_view);
                }
            });
            // Bind Category Drag & Drop Events
            item.addEventListener('dragstart', (e) => {
                // If dragging was initiated on a button or inside a button, prevent dragging
                if (e.target.closest('button')) {
                    e.preventDefault();
                    return;
                }
                e.dataTransfer.setData('text/plain', cat.id);
                item.style.opacity = '0.5';
            });
            item.addEventListener('dragend', () => {
                item.style.opacity = '1';
            });
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            item.addEventListener('drop', async (e) => {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain');
                if (draggedId && draggedId !== cat.id) {
                    const draggedIdx = categories.findIndex(x => x.id === draggedId);
                    const targetIdx = categories.findIndex(x => x.id === cat.id);
                    if (draggedIdx !== -1 && targetIdx !== -1) {
                        const temp = categories[draggedIdx];
                        categories.splice(draggedIdx, 1);
                        categories.splice(targetIdx, 0, temp);

                        // Save category order
                        await window.api.updateCategoryOrder(categories.map(x => x.id));
                        await loadAndRenderCategories();
                        renderManageCategories();
                    }
                }
            });

            manageCategoriesList.appendChild(item);
        });
    };

    // Custom Profile (List) Creation Modal Toggles
    const createProfileModal = document.getElementById('create-profile-modal');
    
    document.getElementById('btn-create-profile-modal').addEventListener('click', () => {
        createProfileModal.classList.add('active');
    });

    document.getElementById('modal-create-close-x').addEventListener('click', () => {
        createProfileModal.classList.remove('active');
    });

    document.getElementById('modal-create-save-btn').addEventListener('click', async () => {
        try {
            const name = document.getElementById('input-new-profile-name').value;
            const type = document.getElementById('select-new-profile-type').value;
            let material = document.getElementById('select-new-profile-material').value;
            const desc = document.getElementById('input-new-profile-desc').value;

            console.log('[CREATE] name:', name, 'type:', type, 'material:', material, 'desc:', desc);

            if (!name) {
                await showCustomAlert(t('msg.enter_profile_name'));
                return;
            }

            if (material === '__NEW__') {
                const customInput = document.getElementById('input-new-profile-material-new');
                const customVal = customInput ? customInput.value.trim() : '';
                console.log('[CREATE] custom material:', customVal);
                if (!customVal) {
                    await showCustomAlert(t('msg.enter_material_name'));
                    return;
                }
                material = customVal;
                if (!materials.includes(material)) {
                    materials.push(material);
                    
                    // Force sync dropdown lists to contain the new material
                    document.getElementById('select-new-profile-material').innerHTML = '';
                    document.getElementById('select-edit-profile-material').innerHTML = '';
                    loadAndRenderMaterials();
                }
            }

            console.log('[CREATE] calling createProfile with:', name, type, material, desc);
            const res = await window.api.createProfile(name, type, material, desc);
            console.log('[CREATE] result:', res);
            
            if (res.success) {
                await showCustomAlert(`${t('msg.profile_created')} ${name}`);
                
                // Clean custom material input fields and reset state
                const targetWrap = document.getElementById('wrap-new-profile-material-new');
                if (targetWrap) {
                    targetWrap.style.maxHeight = '0';
                    targetWrap.style.opacity = '0';
                    targetWrap.style.marginTop = '0';
                    targetWrap.style.display = 'none';
                }
                const targetInput = document.getElementById('input-new-profile-material-new');
                if (targetInput) targetInput.value = '';

                // Reset form
                document.getElementById('input-new-profile-name').value = '';
                document.getElementById('input-new-profile-desc').value = '';
                document.getElementById('select-new-profile-material').value = materials[0] || 'PBT';

                createProfileModal.classList.remove('active');
                profiles = await window.api.getProfiles(); // Reload local list
                loadAndRenderMaterials();
                populateAppendProfiles();
                renderProfiles(current_view);
            } else {
                await showCustomAlert(`${t('msg.profile_create_failed')} ${res.error}`);
            }
        } catch (err) {
            console.error('[CREATE] Error:', err);
            await showCustomAlert(t('msg.error_occurred') + err.message);
        }
    });

    // Add Sound (Remap Key) Modal Dialog Actions
    const addSoundModal = document.getElementById('add-sound-modal');
    const targetProfileIdInput = document.getElementById('input-add-sound-profile-id');
    const targetKeycodeInput = document.getElementById('input-add-sound-keycode');

    window.openAddSoundModal = (profileId) => {
        targetProfileIdInput.value = profileId;
        addSoundModal.classList.add('active');
    };

    document.getElementById('modal-add-close-x').addEventListener('click', () => {
        addSoundModal.classList.remove('active');
    });

    document.getElementById('modal-add-select-btn').addEventListener('click', async () => {
        const profileId = targetProfileIdInput.value;
        const keycode = targetKeycodeInput.value;
        if (!profileId || !keycode) {
            showCustomAlert(t('msg.select_profile_keycode'));
            return;
        }

        const filePath = await window.api.selectAudioFile();
        if (filePath) {
            const res = await window.api.importMixedZipPack(profileId, keycode, filePath);
            if (res.success) {
                showCustomAlert(t('msg.audio_assigned'));
                addSoundModal.classList.remove('active');
                profiles = await window.api.getProfiles(); // Refresh details
            } else {
                showCustomAlert(`${t('msg.assign_failed')} ${res.error}`);
            }
        }
    });

    // Edit Profile Modal Toggles & Actions
    const editProfileModal = document.getElementById('edit-profile-modal');
    const editProfileIdInput = document.getElementById('input-edit-profile-id');
    const editProfileNameInput = document.getElementById('input-edit-profile-name');
    const editProfileTypeSelect = document.getElementById('select-edit-profile-type');
    const editProfileMaterialSelect = document.getElementById('select-edit-profile-material');
    const editProfileDescInput = document.getElementById('input-edit-profile-desc');

    window.openEditProfileModal = async (profileId) => {
        const details = await window.api.getProfileDetails(profileId);
        if (!details) return;
        editProfileIdInput.value = details.id;
        editProfileNameInput.value = details.name;
        editProfileTypeSelect.value = details.type;
        editProfileMaterialSelect.value = details.material;
        editProfileDescInput.value = details.description || '';
        editProfileModal.classList.add('active');
    };

    document.getElementById('modal-edit-close-x').addEventListener('click', () => {
        editProfileModal.classList.remove('active');
    });

    document.getElementById('modal-edit-save-btn').addEventListener('click', async () => {
        const id = editProfileIdInput.value;
        const name = editProfileNameInput.value;
        const type = editProfileTypeSelect.value;
        let material = editProfileMaterialSelect.value;
        const desc = editProfileDescInput.value;

        if (!name) {
            await showCustomAlert(t('msg.profile_name_empty'));
            return;
        }

        if (material === '__NEW__') {
            const customInput = document.getElementById('input-edit-profile-material-new');
            const customVal = customInput ? customInput.value.trim() : '';
            if (!customVal) {
                await showCustomAlert('Please enter a custom material name!');
                return;
            }
            material = customVal;
            if (!materials.includes(material)) {
                materials.push(material);
                
                // Force sync dropdown lists to contain the new material
                document.getElementById('select-new-profile-material').innerHTML = '';
                document.getElementById('select-edit-profile-material').innerHTML = '';
                loadAndRenderMaterials();
            }
        }

        await window.api.updateProfileDetails(id, name, type, material, desc);
        
        // Clean custom material input fields and reset state
        const targetWrap = document.getElementById('wrap-edit-profile-material-new');
        if (targetWrap) {
            targetWrap.style.maxHeight = '0';
            targetWrap.style.opacity = '0';
            targetWrap.style.marginTop = '0';
        }
        const targetInput = document.getElementById('input-edit-profile-material-new');
        if (targetInput) targetInput.value = '';

        editProfileModal.classList.remove('active');
        profiles = await window.api.getProfiles();
        renderProfiles(current_view);
    });

    document.getElementById('modal-edit-delete-btn').addEventListener('click', async () => {
        const id = editProfileIdInput.value;
        const name = editProfileNameInput.value;
        const confirmed = await showCustomConfirm(tf('msg.confirm_delete_profile', name));
        if (confirmed) {
            await window.api.deleteProfile(id);
            editProfileModal.classList.remove('active');
            profiles = await window.api.getProfiles();
            
            // Clear material option selectors and rebuild filters on delete
            document.getElementById('select-new-profile-material').innerHTML = '';
            document.getElementById('select-edit-profile-material').innerHTML = '';
            loadAndRenderMaterials();

            renderProfiles(current_view);
        }
    });

    // Legal Modal Toggles
    const legalModal = document.getElementById('legal-modal');
    const modalTitle = document.getElementById('modal-title-text');
    const modalBody = document.getElementById('modal-body-content');
    const modalLink = document.getElementById('modal-external-link');
    
    const showLegalModal = (type) => {
        if (type === 'terms') {
            modalTitle.innerText = t('legal.terms_title');
            modalLink.innerText = 'vellium.dev/eula';
            modalLink.onclick = (e) => { e.preventDefault(); window.api.openExternal('https://vellium.dev/eula'); };
            modalBody.innerHTML = t('legal.terms_body');
        } else {
            modalTitle.innerText = t('legal.privacy_title');
            modalLink.innerText = 'vellium.dev/privacy';
            modalLink.onclick = (e) => { e.preventDefault(); window.api.openExternal('https://vellium.dev/privacy'); };
            modalBody.innerHTML = t('legal.privacy_body');
        }
        legalModal.classList.add('active');
    };

    document.getElementById('modal-close-x').addEventListener('click', () => legalModal.classList.remove('active'));
    document.getElementById('modal-ok-btn').addEventListener('click', () => legalModal.classList.remove('active'));
    
    document.getElementById('link-privacy').addEventListener('click', (e) => {
        e.preventDefault(); showLegalModal('privacy');
    });
    document.getElementById('link-terms').addEventListener('click', (e) => {
        e.preventDefault(); showLegalModal('terms');
    });



    // Load initial categories
    await loadAndRenderCategories();
    
    // Set initial view to first available category
    if (categories && categories.length > 0) {
        current_view = categories[0].id;
    }
    
    // Render initial materials filters & sync select tags
    loadAndRenderMaterials();

    // Render Initial View
    renderProfiles(current_view);
    updateActiveProfileBadge();
});

function switchView(view) {
    current_view = view;
    
    // Hide all views first
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // Check if view matches any dynamic category id
    const isCategory = categories.some(cat => cat.id === view);
    
    if (isCategory) {
        document.getElementById('view-profiles').classList.add('active');
        renderProfiles(view);
    } else if (view === 'custom') {
        document.getElementById('view-custom').classList.add('active');
        renderProfiles('custom');
    } else {
        const targetView = document.getElementById(`view-${view}`);
        if (targetView) {
            targetView.classList.add('active');
        }
    }

    // Explicitly sync the sidebar active highlighting
    document.querySelectorAll('.nav-item').forEach(b => {
        if (b.getAttribute('data-view') === view) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
}

function renderProfiles(type = current_view) {
    let container = document.getElementById('profiles-grid');
    if (type === 'custom') {
        container = document.getElementById('custom-grid');
    }
    
    if (!container) return;
    container.innerHTML = '';

    const isCustomView = type === 'custom';
    
    // Get currently active material filter chip
    const activeChip = document.querySelector('.chip.active');
    const activeChipText = activeChip ? activeChip.innerText.trim().toUpperCase() : 'ALL';
    
    // Support comparing against translated variants of 'All' / 'Tümü'
    const isAllFilter = activeChipText === 'ALL' || 
                        activeChipText === 'TÜMÜ' || 
                        activeChipText === t('filter.all').toUpperCase();
    
    // Read search query
    const searchInputEl = document.getElementById('search-input');
    const query = searchInputEl ? searchInputEl.value.trim().toLowerCase() : '';
    
    // Render profile card matching either is_custom or matching normalized string of type
    const filtered = profiles.filter(p => {
        // Apply search query filter (searches in name, description, material, and switch type)
        if (query) {
            const nameMatch = (p.name || '').toLowerCase().includes(query);
            const descMatch = (p.description || '').toLowerCase().includes(query);
            const matMatch = (p.material || '').toLowerCase().includes(query);
            const typeMatch = (p.type || '').toLowerCase().includes(query);
            if (!nameMatch && !descMatch && !matMatch && !typeMatch) {
                return false;
            }
        }

        // Apply material filter
        if (!isAllFilter) {
            const pMat = (p.material || '').toUpperCase();
            if (pMat !== activeChipText) return false;
        }

        if (isCustomView) return p.is_custom;
        const normalizedType = p.type.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const normalizedView = type.toLowerCase().replace(/[^a-z0-9]/g, '-');
        return normalizedType === normalizedView;
    });

    filtered.forEach(p => {
        const isActive = p.id === active_profile_id;
        const card = document.createElement('div');
        card.className = `card ${isActive ? 'active' : ''}`;
        card.draggable = true;
        card.setAttribute('data-id', p.id);
        
        // Add drag & drop event listeners to handle custom profile list ordering
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', p.id);
            card.style.opacity = '0.5';
        });
        card.addEventListener('dragend', () => {
            card.style.opacity = '1';
        });
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        card.addEventListener('drop', async (e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('text/plain');
            if (draggedId && draggedId !== p.id) {
                // Reorder profiles
                const draggedIdx = profiles.findIndex(x => x.id === draggedId);
                const targetIdx = profiles.findIndex(x => x.id === p.id);
                if (draggedIdx !== -1 && targetIdx !== -1) {
                    const temp = profiles[draggedIdx];
                    profiles.splice(draggedIdx, 1);
                    profiles.splice(targetIdx, 0, temp);
                    
                    // Save new order to database
                    await window.api.updateProfileOrder(profiles.map(x => x.id));
                    renderProfiles(type);
                }
            }
        });

        card.innerHTML = `
            <div class="card-header" style="position: relative;">
                <div class="card-title">${p.name}</div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div class="card-type">${p.material}</div>
                    <button class="btn-edit-profile" onclick="window.openEditProfileModal('${p.id}')" style="background:transparent; border:none; cursor:pointer; color:var(--accent-gold); display:flex; align-items:center; justify-content:center; padding: 2px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="card-desc">${p.description || t('card.default_desc')}</div>
            <div class="card-actions">
                <button class="btn" onclick="previewProfile('${p.id}')">${t('btn.preview')}</button>
                <button class="btn ${isActive ? 'primary' : ''}" onclick="setActiveProfile('${p.id}')">
                    ${isActive ? t('btn.active') : t('btn.set_active')}
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p style="color:var(--text-secondary); grid-column: 1/-1;">${t('profiles.empty')}</p>`;
    }
}

async function setActiveProfile(id) {
    active_profile_id = id;
    await window.api.setActiveProfile(id);
    renderProfiles(current_view);
    updateActiveProfileBadge();
}

function updateActiveProfileBadge() {
    const active = profiles.find(p => p.id === active_profile_id);
    document.getElementById('active-profile-name').innerText = active ? active.name : t('toolbar.no_profile');
}

async function previewProfile(id) {
    const details = await window.api.getProfileDetails(id);
    if (!details) return;
    
    // Play a preview sound directly in UI
    const play_type = details.key_define_type || 'single';
    const vol = parseInt(document.getElementById('global-volume').value) / 100;
    
    if (play_type === 'single') {
        const srcPath = `file:///${details.folder_path.replace(/\\/g, '/')}/${details.sound_file}`;
        const defines = details.defines || {}; 
        
        // Ensure sprite values are formatted as arrays [start, duration]
        let formattedSprite = {};
        for (const [key, val] of Object.entries(defines)) {
            if (Array.isArray(val) && val.length >= 2) {
                formattedSprite[key] = [val[0], val[1]];
            }
        }

        const testKey = formattedSprite['57'] ? '57' : Object.keys(formattedSprite)[0];
        if (testKey) {
            const previewHowl = new Howl({
                src: [srcPath],
                sprite: formattedSprite,
                volume: vol,
                html5: false,
                preload: true
            });
            previewHowl.once('load', () => {
                previewHowl.play(testKey);
            });
        }
    } else {
        // Multi
        const firstKey = Object.keys(details.defines)[0];
        if (firstKey) {
            const fileName = Array.isArray(details.defines[firstKey]) ? details.defines[firstKey][0] : details.defines[firstKey];
            const srcPath = `file:///${details.folder_path.replace(/\\/g, '/')}/${fileName}`;
            const previewHowl = new Howl({
                src: [srcPath],
                volume: vol,
                html5: false,
                preload: true
            });
            previewHowl.once('load', () => {
                previewHowl.play();
            });
        }
    }
}
