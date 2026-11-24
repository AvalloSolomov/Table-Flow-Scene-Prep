/**
 * GM Interface Component
 * Tabbed control panel for session management
 */

window.TableFlowScenePrep = window.TableFlowScenePrep || {};

window.TableFlowScenePrep.GMInterface = class {
    static INTERFACE_ID = 'table-flow-scene-prep-interface';
    static SETTINGS_ID = 'table-flow-scene-prep-settings';
    
    /**
     * Show the GM control interface
     */
    static show() {
        if (!game.user.isGM) return;
        this.hide(); // Remove existing
        
        const isLocked = window.TableFlowScenePrep.Settings.isLocked();
        const message = window.TableFlowScenePrep.Settings.getLockoutMessage();
        const playerInfo = window.TableFlowScenePrep.DOMHelpers.getPlayerInfo();
        
        const gmInterface = document.createElement('div');
        gmInterface.id = this.INTERFACE_ID;
        gmInterface.className = `tfsp-gm-interface ${isLocked ? 'tfsp-panel-locked' : 'tfsp-panel-unlocked'}`;
        
        gmInterface.innerHTML = this._generateHTML(isLocked, message, playerInfo);
        
        document.body.appendChild(gmInterface);
        this._makeWindowDraggable(gmInterface);
        this._attachEventListeners();
        
    }
    
    /**
     * Hide the interface (and its settings popup)
     */
    static hide() {
        this.closeSettings();
        window.TableFlowScenePrep.DOMHelpers.removeElement(this.INTERFACE_ID);
    }
    
    /**
     * Open the Settings popup, or close it if it is already open
     */
    static toggleSettings() {
        if (document.getElementById(this.SETTINGS_ID)) {
            this.closeSettings();
            return;
        }
        
        const popup = document.createElement('div');
        popup.id = this.SETTINGS_ID;
        popup.className = 'tfsp-gm-interface tfsp-settings-popup';
        popup.innerHTML = this._generateSettingsHTML(window.TableFlowScenePrep.Settings.getLockoutMessage());
        document.body.appendChild(popup);
        this._makeWindowDraggable(popup);
        
        document.getElementById('gm-interface-settings')?.classList.add('tfsp-header-btn-active');
        this._attachSettingsListeners();
    }
    
    /**
     * Let the GM drag a window by its header. The window switches from its centred CSS
     * position to explicit left/top on the first drag and is kept on screen.
     * @private
     */
    static _makeWindowDraggable(win) {
        const handle = win?.querySelector('.tfsp-interface-header');
        if (!handle) return;
        handle.classList.add('tfsp-drag-header');
        
        handle.addEventListener('mousedown', (e) => {
            if (e.button !== 0 || e.target.closest('button, a, input, select, textarea')) return;
            e.preventDefault();
            
            const rect = win.getBoundingClientRect();
            const shiftX = e.clientX - rect.left;
            const shiftY = e.clientY - rect.top;
            win.style.transform = 'none';
            win.style.left = `${rect.left}px`;
            win.style.top = `${rect.top}px`;
            
            const onMove = (ev) => {
                const left = Math.max(0, Math.min(window.innerWidth - rect.width, ev.clientX - shiftX));
                const top = Math.max(0, Math.min(window.innerHeight - 48, ev.clientY - shiftY));
                win.style.left = `${left}px`;
                win.style.top = `${top}px`;
            };
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }
    
    /**
     * Close the Settings popup
     */
    static closeSettings() {
        window.TableFlowScenePrep.DOMHelpers.removeElement(this.SETTINGS_ID);
        document.getElementById('gm-interface-settings')?.classList.remove('tfsp-header-btn-active');
    }
    
    /**
     * Generate interface HTML
     * @private
     */
    static _generateHTML(isLocked, message, playerInfo) {
        return `
            <!-- Header -->
            <div class="tfsp-interface-header">
                <div class="tfsp-header-gradient"></div>
                <div class="tfsp-header-content">
                    <div class="tfsp-header-left">
                        <div class="tfsp-header-icon">
                            <a class="tfsp-header-icon-link" href="https://tableflowapps.com" target="_blank" rel="noopener noreferrer" title="tableflowapps.com">
                                <img src="modules/table-flow-scene-prep/TABLEFLOW_LOGO.svg" alt="Table Flow">
                            </a>
                        </div>
                        <div>
                            <h2 class="tfsp-interface-title">Scene Prep</h2>
                            <div class="tfsp-interface-subtitle">Manage player access and session status</div>
                        </div>
                    </div>
                    <div class="tfsp-header-buttons">
                        <button id="gm-interface-minimize" class="tfsp-header-btn" title="Minimize" aria-label="Minimize"><i class="tfsp-icon tfsp-icon-minus" aria-hidden="true"></i></button>
                        <button id="gm-interface-settings" class="tfsp-header-btn" title="Settings" aria-label="Settings"><i class="tfsp-icon tfsp-icon-settings" aria-hidden="true"></i></button>
                        <button id="gm-interface-close" class="tfsp-header-btn" title="Close" aria-label="Close"><i class="tfsp-icon tfsp-icon-x" aria-hidden="true"></i></button>
                    </div>
                </div>
            </div>
            
            <!-- Content -->
            <div class="tfsp-tab-content-wrapper">
                <!-- Control View -->
                <div id="tab-control-content" class="tfsp-tab-content tfsp-tab-active">
                    <div class="tfsp-section-heading">
                        <i class="tfsp-icon tfsp-icon-clock" aria-hidden="true"></i>
                        <span>Session Control</span>
                    </div>
                    
                    <!-- Status Card -->
                    <div class="tfsp-status-card ${isLocked ? 'tfsp-status-locked' : 'tfsp-status-unlocked'}">
                        <span class="tfsp-status-label">${isLocked ? 'Session Locked' : 'Session Unlocked'}</span>
                    </div>
                    
                    <!-- Player Count -->
                    <div class="tfsp-player-stats">
                        <div class="tfsp-stat-card">
                            <div class="tfsp-stat-value">${playerInfo.onlineCount}</div>
                            <div class="tfsp-stat-label">Online Players</div>
                        </div>
                        <div class="tfsp-stat-card">
                            <div class="tfsp-stat-value">${playerInfo.totalCount}</div>
                            <div class="tfsp-stat-label">Total Players</div>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="tfsp-action-buttons">
                        <button id="gm-lock-button" class="tfsp-action-btn tfsp-btn-lock ${isLocked ? 'tfsp-btn-disabled' : ''}">
                            <span>Lock Session</span>
                        </button>
                        <button id="gm-unlock-button" class="tfsp-action-btn tfsp-btn-unlock ${!isLocked ? 'tfsp-btn-disabled' : ''}">
                            <span>Unlock Session</span>
                        </button>
                    </div>

                    <div class="tfsp-action-buttons">
                        <button id="gm-resync-lock-button" class="tfsp-action-btn tfsp-btn-sync ${!isLocked ? 'tfsp-btn-disabled' : ''}">
                            <span>Resync Lock Screens</span>
                        </button>
                    </div>
                    
                    <!-- Player List -->
                    <div class="tfsp-player-list">
                        <div class="tfsp-player-list-header">
                            <span><i class="tfsp-icon tfsp-icon-users" aria-hidden="true"></i> Connected Players</span>
                            <span class="tfsp-player-count-pill">${playerInfo.onlineCount} ONLINE | ${playerInfo.onlineCount} READY</span>
                        </div>
                        <div class="tfsp-player-list-content">
                            ${this._generatePlayerList(playerInfo.all)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Generate the Settings popup HTML
     * @private
     */
    static _generateSettingsHTML(message) {
        return `
            <div class="tfsp-interface-header">
                <div class="tfsp-header-content">
                    <div class="tfsp-header-left">
                        <div>
                            <h2 class="tfsp-interface-title">Settings</h2>
                            <div class="tfsp-interface-subtitle">Lock screen and general options</div>
                        </div>
                    </div>
                    <div class="tfsp-header-buttons">
                        <button id="gm-settings-close" class="tfsp-header-btn" title="Close" aria-label="Close"><i class="tfsp-icon tfsp-icon-x" aria-hidden="true"></i></button>
                    </div>
                </div>
            </div>
            
            <div class="tfsp-popup-tabs">
                <div class="tfsp-subnav" role="tablist">
                    <button type="button" class="tfsp-subnav-btn tfsp-subnav-active" data-subtab="lockscreen"><i class="tfsp-icon tfsp-icon-lock" aria-hidden="true"></i><span>Lock Screen</span></button>
                    <button type="button" class="tfsp-subnav-btn" data-subtab="general"><i class="tfsp-icon tfsp-icon-sliders-horizontal" aria-hidden="true"></i><span>General</span></button>
                </div>
            </div>
            
            <div class="tfsp-tab-content-wrapper">
                <div id="tab-settings-content">
                    
                    <div class="tfsp-subpanel tfsp-subpanel-active" data-subpanel="lockscreen">
                    
                    <div class="tfsp-settings-section">
                        <h3 class="tfsp-settings-header">Lockout Message</h3>
                        
                        <div class="tfsp-message-editor">
                            <label class="tfsp-message-label">
                                <span class="tfsp-message-hint">Shown to players when the session is locked</span>
                            </label>
                            <textarea 
                                id="table-flow-scene-prep-message" 
                                class="tfsp-message-input"
                                rows="3"
                                placeholder="Enter the message players will see..."
                            >${window.TableFlowScenePrep.DOMHelpers.escapeHTML(message)}</textarea>
                            <button id="save-message-button" class="tfsp-save-btn">Save Message</button>
                        </div>
                    </div>
                    
                    </div>
                    
                    <div class="tfsp-subpanel" data-subpanel="general">
                    <div class="tfsp-settings-section">
                        <h3 class="tfsp-settings-header">Lock Indicator</h3>
                        
                        <div class="tfsp-setting-item">
                            <label class="tfsp-setting-label">
                                <input type="checkbox" id="setting-show-banner" ${window.TableFlowScenePrep.Settings.getShowBanner() ? 'checked' : ''}>
                                <span>Show Lock Indicator</span>
                            </label>
                            <div class="tfsp-setting-hint">Show the GM when the session is locked</div>
                        </div>
                        
                        <div class="tfsp-setting-item">
                            <label class="tfsp-setting-label" for="setting-lock-indicator">
                                <span>Indicator Style</span>
                            </label>
                            <div class="tfsp-setting-hint">How the lock shows on your screen (players always get the full-screen lock)</div>
                            <select id="setting-lock-indicator" class="tfsp-setting-input">
                                ${[['bar', 'Bar (click to unlock)'], ['compact', 'Compact pill'], ['frame', 'Screen frame'], ['bar-frame', 'Bar and frame']].map(([value, label]) => `<option value="${value}" ${window.TableFlowScenePrep.Settings.getLockIndicator() === value ? 'selected' : ''}>${label}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="tfsp-setting-item">
                            <label class="tfsp-setting-label">
                                <span>Bar Top Position (px)</span>
                            </label>
                            <div class="tfsp-setting-hint">Distance from the top of the screen</div>
                            <input type="number" id="setting-banner-position" class="tfsp-setting-input" min="0" max="300" step="10" value="${window.TableFlowScenePrep.Settings.getBannerTopPosition()}">
                        </div>
                    </div>
                    
                    <div class="tfsp-settings-section">
                        <h3 class="tfsp-settings-header">Session Settings</h3>
                        
                        <div class="tfsp-setting-item">
                            <label class="tfsp-setting-label">
                                <input type="checkbox" id="setting-auto-lock" ${window.TableFlowScenePrep.Settings.getAutoLock() ? 'checked' : ''}>
                                <span>Auto-Lock on Startup</span>
                            </label>
                            <div class="tfsp-setting-hint">Automatically lock the session when the world loads</div>
                        </div>
                        
                        <div class="tfsp-setting-item">
                            <label class="tfsp-setting-label">
                                <span>Button Anchor Position</span>
                            </label>
                            <div class="tfsp-setting-hint">Where to anchor the floating button (Free = draggable)</div>
                            <select id="setting-button-anchor" class="tfsp-setting-input">
                                <option value="free" ${window.TableFlowScenePrep.Settings.getButtonAnchor() === 'free' ? 'selected' : ''}>Free (Draggable)</option>
                                <option value="top-right" ${window.TableFlowScenePrep.Settings.getButtonAnchor() === 'top-right' ? 'selected' : ''}>Top Right</option>
                                <option value="top-left" ${window.TableFlowScenePrep.Settings.getButtonAnchor() === 'top-left' ? 'selected' : ''}>Top Left</option>
                                <option value="bottom-right" ${window.TableFlowScenePrep.Settings.getButtonAnchor() === 'bottom-right' ? 'selected' : ''}>Bottom Right</option>
                                <option value="bottom-left" ${window.TableFlowScenePrep.Settings.getButtonAnchor() === 'bottom-left' ? 'selected' : ''}>Bottom Left</option>
                            </select>
                        </div>
                    </div>
                    
                    </div>
                    
                    <!-- Lock Screen continues here: panels sharing a data-subpanel show together -->
                    <div class="tfsp-subpanel tfsp-subpanel-active" data-subpanel="lockscreen">
                    <div class="tfsp-settings-section">
                        <h3 class="tfsp-settings-header">Lock Screen Journal</h3>
                        
                        <div class="tfsp-setting-item">
                            <div class="tfsp-setting-hint">Drag a journal entry or page here, or search for one. Applies immediately and updates the lock screen live.</div>
                            <div id="tfsp-journal-picker" class="tfsp-journal-picker">
                                <div id="tfsp-journal-current" class="tfsp-journal-current">${this._generateJournalCurrentHTML()}</div>
                                <input type="text" id="tfsp-journal-search" class="tfsp-setting-input" placeholder="Search journals and pages..." autocomplete="off">
                                <div id="tfsp-journal-results" class="tfsp-journal-results" hidden></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="tfsp-settings-section tfsp-tips-section">
                        <h3 class="tfsp-settings-header">Lock Screen Tips</h3>
                        
                        <div class="tfsp-setting-item">
                            <label class="tfsp-setting-label" for="setting-lock-tips-title">
                                <span>Box Title</span>
                            </label>
                            <input type="text" id="setting-lock-tips-title" class="tfsp-setting-input" maxlength="40" placeholder="Tips & Trivia" value="${window.TableFlowScenePrep.DOMHelpers.escapeHTML(window.TableFlowScenePrep.Settings.getLockScreenTipsTitle())}">
                        </div>
                        
                        <div class="tfsp-setting-item tfsp-tips-item">
                            <div class="tfsp-setting-hint">One tip per bullet (press Enter for the next). Pasted lists split automatically. Keep each under about 170 characters. Leave empty to hide the section.</div>
                            <textarea id="setting-lock-tips" class="tfsp-message-input" rows="6">${window.TableFlowScenePrep.DOMHelpers.escapeHTML(this._bulletTips(window.TableFlowScenePrep.Settings.getLockScreenTips()))}</textarea>
                        </div>
                    </div>
                    
                    </div>
                </div>
            </div>
            
            <div class="tfsp-popup-footer">
                <button id="save-settings-button" class="tfsp-save-btn">Save Settings</button>
            </div>
        `;
    }
    
    /**
     * Split the tips textarea into clean tip strings. Blank lines and any leading bullet,
     * dash or list number are dropped, so pasted lists work as-is.
     * @private
     */
    static _parseTipLines(text) {
        return String(text ?? '')
            .split(/\r?\n/)
            .map(line => line.replace(/^\s*(?:•\s*|[-*–—]\s+|\d+[.)]\s+)/, '').trim())
            .filter(Boolean);
    }
    
    /**
     * Prefix each tip with a bullet for display in the GM editor only
     * @private
     */
    static _bulletTips(tips) {
        return tips.map(tip => `• ${tip}`).join('\n');
    }
    
    /**
     * Markup for the currently linked journal page (or the empty state)
     * @private
     */
    static _generateJournalCurrentHTML() {
        const escape = (v) => window.TableFlowScenePrep.DOMHelpers.escapeHTML(v);
        const entry = game.journal.get(window.TableFlowScenePrep.Settings.getLockScreenJournalId());
        const page = entry?.pages.get(window.TableFlowScenePrep.Settings.getLockScreenJournalPageId());
        
        if (!entry || !page) {
            return '<span class="tfsp-journal-empty"><i class="tfsp-icon tfsp-icon-book-open" aria-hidden="true"></i> No journal linked</span>';
        }
        
        const label = this._journalLabel(entry, page);
        return `
            <span class="tfsp-journal-current-name"><i class="tfsp-icon tfsp-icon-book-open" aria-hidden="true"></i> ${escape(label)}</span>
            <button type="button" class="tfsp-journal-clear" title="Remove linked journal" aria-label="Remove linked journal"><i class="tfsp-icon tfsp-icon-x" aria-hidden="true"></i></button>
        `;
    }
    
    /**
     * Display label for a page, collapsing single-page entries to just the entry name
     * @private
     */
    static _journalLabel(entry, page) {
        return entry.pages.size === 1 || entry.name === page.name ? entry.name : `${entry.name} \u203A ${page.name}`;
    }
    
    /**
     * Find journal pages whose label contains every search term
     * @private
     */
    static _searchJournalPages(query) {
        const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        const results = [];
        
        for (const entry of game.journal.contents) {
            for (const page of entry.pages.contents) {
                const label = this._journalLabel(entry, page);
                const haystack = `${entry.name} ${page.name}`.toLowerCase();
                if (terms.every(term => haystack.includes(term))) {
                    results.push({ entryId: entry.id, pageId: page.id, label });
                }
            }
        }
        
        return results.sort((a, b) => a.label.localeCompare(b.label));
    }
    
    /**
     * Render the search result list
     * @private
     */
    static _renderJournalResults(query) {
        const container = document.getElementById('tfsp-journal-results');
        if (!container) return;
        
        const escape = (v) => window.TableFlowScenePrep.DOMHelpers.escapeHTML(v);
        const MAX_RESULTS = 40;
        const matches = this._searchJournalPages(query);
        
        if (matches.length === 0) {
            container.innerHTML = '<div class="tfsp-no-players">No matching journals</div>';
        } else {
            const shown = matches.slice(0, MAX_RESULTS);
            container.innerHTML = shown.map(m => `
                <button type="button" class="tfsp-journal-result" data-entry-id="${escape(m.entryId)}" data-page-id="${escape(m.pageId)}">${escape(m.label)}</button>
            `).join('') + (matches.length > MAX_RESULTS
                ? `<div class="tfsp-setting-hint">Showing ${MAX_RESULTS} of ${matches.length} - keep typing to narrow it down</div>`
                : '');
        }
        container.hidden = false;
    }
    
    /**
     * Link a journal page to the lock screen and publish it to players
     * @private
     */
    static async _selectJournalPage(entryId, pageId) {
        await window.TableFlowScenePrep.Settings.setLockScreenJournal(entryId, pageId);
        
        const current = document.getElementById('tfsp-journal-current');
        if (current) current.innerHTML = this._generateJournalCurrentHTML();
        
        const search = document.getElementById('tfsp-journal-search');
        if (search) search.value = '';
        const results = document.getElementById('tfsp-journal-results');
        if (results) results.hidden = true;
        
        ui.notifications.info(entryId ? 'Lock screen journal updated' : 'Lock screen journal removed');
    }
    
    /**
     * Resolve a dropped journal entry/page and link it
     * @private
     */
    static async _handleJournalDrop(data) {
        const doc = data?.uuid ? await fromUuid(data.uuid) : null;
        let entry = null;
        let page = null;
        
        if (doc?.documentName === 'JournalEntryPage') {
            page = doc;
            entry = doc.parent;
        } else if (doc?.documentName === 'JournalEntry') {
            entry = doc;
            page = doc.pages.find(p => p.type === 'text') ?? doc.pages.contents[0];
        }
        
        if (!entry || !page) {
            ui.notifications.warn('Drop a journal entry or journal page.');
            return;
        }
        if (entry.pack || !game.journal.has(entry.id)) {
            ui.notifications.warn('Import that journal into the world first - compendium journals can\'t be linked.');
            return;
        }
        
        await this._selectJournalPage(entry.id, page.id);
    }
    
    /**
     * Generate player list HTML
     * @private
     */
    static _generatePlayerList(players) {
        if (!players || players.length === 0) {
            return '<div class="tfsp-no-players">No players connected</div>';
        }
        
        return players.map(player => {
            const isOnline = player.active;
            const statusClass = isOnline ? 'tfsp-player-online' : 'tfsp-player-offline';
            const statusText = isOnline ? 'Ready' : 'Offline';
            
            return `
                <div class="tfsp-player-item ${statusClass}">
                    <div class="tfsp-player-info">
                        <div class="tfsp-player-dot"></div>
                        <div class="tfsp-player-name">${window.TableFlowScenePrep.DOMHelpers.escapeHTML(player.name)}</div>
                    </div>
                    <div class="tfsp-player-status">${statusText}</div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Attach event listeners
     * @private
     */
    static _attachEventListeners() {
        // Close button
        document.getElementById('gm-interface-close')?.addEventListener('click', () => {
            this.hide();
        });
        
        // Minimize button
        document.getElementById('gm-interface-minimize')?.addEventListener('click', () => {
            this.minimize();
        });
        
        // Lock button
        document.getElementById('gm-lock-button')?.addEventListener('click', async () => {
            await this._handleLock();
        });
        
        // Unlock button
        document.getElementById('gm-unlock-button')?.addEventListener('click', async () => {
            await this._handleUnlock();
        });
        
        // Resync lock screens button
        document.getElementById('gm-resync-lock-button')?.addEventListener('click', async () => {
            await this._handleResyncLockScreens();
        });
        
        // Gear button opens the Settings popup
        document.getElementById('gm-interface-settings')?.addEventListener('click', () => {
            this.toggleSettings();
        });
    }
    
    /**
     * Attach listeners for the Settings popup
     * @private
     */
    static _attachSettingsListeners() {
        document.getElementById('gm-settings-close')?.addEventListener('click', () => {
            this.closeSettings();
        });
        
        // Save message button
        document.getElementById('save-message-button')?.addEventListener('click', async () => {
            await this._handleSaveMessage();
        });
        
        // Save settings button
        document.getElementById('save-settings-button')?.addEventListener('click', async () => {
            await this._handleSaveSettings();
        });
        
        // Tips textarea: bullets are an editing aid only and are stripped before saving
        const tipsBox = document.getElementById('setting-lock-tips');
        tipsBox?.addEventListener('focus', () => {
            if (!tipsBox.value.trim()) tipsBox.value = '• ';
        });
        tipsBox?.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            tipsBox.setRangeText('\n• ', tipsBox.selectionStart, tipsBox.selectionEnd, 'end');
        });
        tipsBox?.addEventListener('blur', () => {
            tipsBox.value = this._bulletTips(this._parseTipLines(tipsBox.value));
        });
        // Pasted text (with or without blank lines between tips) is split and bulleted right away
        tipsBox?.addEventListener('paste', () => {
            setTimeout(() => {
                tipsBox.value = this._bulletTips(this._parseTipLines(tipsBox.value));
                tipsBox.selectionStart = tipsBox.selectionEnd = tipsBox.value.length;
            }, 0);
        });
        
        // Journal picker: search, click-to-select, clear, and drag/drop
        const picker = document.getElementById('tfsp-journal-picker');
        const searchInput = document.getElementById('tfsp-journal-search');
        const results = document.getElementById('tfsp-journal-results');
        
        searchInput?.addEventListener('input', () => this._renderJournalResults(searchInput.value));
        searchInput?.addEventListener('focus', () => this._renderJournalResults(searchInput.value));
        
        results?.addEventListener('click', async (e) => {
            const item = e.target.closest('.tfsp-journal-result');
            if (item) await this._selectJournalPage(item.dataset.entryId, item.dataset.pageId);
        });
        
        picker?.addEventListener('focusout', (e) => {
            if (results && !picker.contains(e.relatedTarget)) results.hidden = true;
        });
        
        document.getElementById('tfsp-journal-current')?.addEventListener('click', async (e) => {
            if (e.target.closest('.tfsp-journal-clear')) await this._selectJournalPage('', '');
        });
        
        picker?.addEventListener('dragover', (e) => {
            e.preventDefault();
            picker.classList.add('tfsp-drag-over');
        });
        picker?.addEventListener('dragleave', (e) => {
            if (!picker.contains(e.relatedTarget)) picker.classList.remove('tfsp-drag-over');
        });
        picker?.addEventListener('drop', async (e) => {
            e.preventDefault();
            picker.classList.remove('tfsp-drag-over');
            const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor;
            await this._handleJournalDrop(TextEditorImpl.getDragEventData(e));
        });
        
        // Sub-menu tabs
        this._setupSubmenus();
    }
    
    /**
     * Switch between the Settings sub-menus (Lock Screen / General)
     * @private
     */
    static _setupSubmenus() {
        const view = document.getElementById(this.SETTINGS_ID);
        view?.querySelector('.tfsp-subnav')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.tfsp-subnav-btn');
            if (!btn) return;
            
            view.querySelectorAll('.tfsp-subnav-btn').forEach(b => b.classList.toggle('tfsp-subnav-active', b === btn));
            view.querySelectorAll('.tfsp-subpanel').forEach(p => p.classList.toggle('tfsp-subpanel-active', p.dataset.subpanel === btn.dataset.subtab));
        });
    }
    
    /**
     * Handle lock action
     * @private
     */
    static async _handleLock() {
        const message = document.getElementById('table-flow-scene-prep-message')?.value.trim();
        if (message) {
            await window.TableFlowScenePrep.Settings.setLockoutMessage(message);
        }

        const playerInfo = window.TableFlowScenePrep.DOMHelpers.getPlayerInfo();
        
        await window.TableFlowScenePrep.Settings.setLocked(true);
        window.TableFlowScenePrep.SocketHandler.emitLock(
            message || window.TableFlowScenePrep.Settings.getLockoutMessage()
        );
        
        // Show GM banner immediately
        if (window.TableFlowScenePrep.GMBanner) {
            window.TableFlowScenePrep.GMBanner.show();
        }
        
        setTimeout(() => this.show(), 100);
        ui.notifications.info(`Session locked. Sent lock screen to ${playerInfo.onlineCount} online player${playerInfo.onlineCount === 1 ? '' : 's'}.`);
    }
    
    /**
     * Handle unlock action
     * @private
     */
    static async _handleUnlock() {
        const playerInfo = window.TableFlowScenePrep.DOMHelpers.getPlayerInfo();

        await window.TableFlowScenePrep.Settings.setLocked(false);
        window.TableFlowScenePrep.SocketHandler.emitUnlock();
        
        // Hide GM banner immediately
        if (window.TableFlowScenePrep.GMBanner) {
            window.TableFlowScenePrep.GMBanner.hide();
        }
        
        setTimeout(() => this.show(), 100);
        ui.notifications.info(`Session unlocked for ${playerInfo.onlineCount} online player${playerInfo.onlineCount === 1 ? '' : 's'}.`);
    }

    /**
     * Re-send lock screens to all currently connected players.
     * @private
     */
    static async _handleResyncLockScreens() {
        if (!window.TableFlowScenePrep.Settings.isLocked()) {
            ui.notifications.warn('Session is not locked. Lock the session before resyncing lock screens.');
            return;
        }

        const playerInfo = window.TableFlowScenePrep.DOMHelpers.getPlayerInfo();
        if (playerInfo.onlineCount === 0) {
            ui.notifications.warn('No online players to resync.');
            return;
        }

        const message = window.TableFlowScenePrep.Settings.getLockoutMessage();
        for (const player of playerInfo.online) {
            window.TableFlowScenePrep.SocketHandler.emitLock(message, player.id);
        }

        ui.notifications.info(`Resynced lock screens to ${playerInfo.onlineCount} online player${playerInfo.onlineCount === 1 ? '' : 's'}.`);
    }
    
    /**
     * Handle save message action
     * @private
     */
    static async _handleSaveMessage() {
        const message = document.getElementById('table-flow-scene-prep-message')?.value.trim();
        if (message) {
            await window.TableFlowScenePrep.Settings.setLockoutMessage(message);
            window.TableFlowScenePrep.SocketHandler.emitMessageUpdate(message);
            ui.notifications.info('Message saved');
        }
    }
    
    /**
     * Handle save settings action
     * @private
     */
    static async _handleSaveSettings() {
        // Get values from form
        const showBanner = document.getElementById('setting-show-banner')?.checked ?? true;
        const bannerPositionInput = document.getElementById('setting-banner-position');
        const rawBannerPosition = Number.parseInt(bannerPositionInput?.value ?? '', 10);
        const currentBannerPosition = window.TableFlowScenePrep.Settings.getBannerTopPosition();
        const bannerPosition = Number.isNaN(rawBannerPosition)
            ? currentBannerPosition
            : Math.max(0, Math.min(300, rawBannerPosition));
        const autoLock = document.getElementById('setting-auto-lock')?.checked ?? false;
        const buttonAnchor = document.getElementById('setting-button-anchor')?.value ?? 'free';
        const lockTips = this._parseTipLines(document.getElementById('setting-lock-tips')?.value ?? '').join('\n');
        const lockTipsTitle = document.getElementById('setting-lock-tips-title')?.value ?? '';

        if (bannerPositionInput) {
            bannerPositionInput.value = String(bannerPosition);
        }
        
        // Save settings
        await window.TableFlowScenePrep.Settings.setShowBanner(showBanner);
        await window.TableFlowScenePrep.Settings.setBannerTopPosition(bannerPosition);
        await window.TableFlowScenePrep.Settings.setAutoLock(autoLock);
        await window.TableFlowScenePrep.Settings.setButtonAnchor(buttonAnchor);
        await window.TableFlowScenePrep.Settings.setLockIndicator(document.getElementById('setting-lock-indicator')?.value ?? 'bar');
        await window.TableFlowScenePrep.Settings.setLockScreenTips(lockTips);
        await window.TableFlowScenePrep.Settings.setLockScreenTipsTitle(lockTipsTitle);

        const isLocked = window.TableFlowScenePrep.Settings.isLocked();

        // Apply banner visibility immediately when changing the setting
        if (showBanner && isLocked) {
            window.TableFlowScenePrep.GMBanner.show();
        } else if (!showBanner) {
            window.TableFlowScenePrep.GMBanner.hide();
        }
        
        // Apply banner position immediately
        const banner = document.getElementById(window.TableFlowScenePrep.GMBanner.BANNER_ID);
        if (banner) {
            banner.style.top = `${bannerPosition}px`;
        }
        
        // Apply button anchor immediately
        if (window.TableFlowScenePrep.FloatingButton.button) {
            window.TableFlowScenePrep.FloatingButton.applyAnchorPosition();
        }
        
        ui.notifications.info('Settings saved');
    }
    
    /**
     * Minimize (close) the interface
     */
    static minimize() {
        this.hide();
    }
};
