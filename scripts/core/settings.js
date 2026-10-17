/**
 * Settings Management Module
 * Handles registration and retrieval of module settings
 */

window.TableFlowScenePrep = window.TableFlowScenePrep || {};

window.TableFlowScenePrep.Settings = class {
    static MODULE_ID = 'table-flow-scene-prep';
    
    /**
     * Register all module settings
     */
    static register() {
        try {
            game.settings.register(this.MODULE_ID, 'isLocked', {
                name: 'Game Locked',
                hint: 'Whether the game is currently locked to prevent player connections',
                scope: 'world',
                config: false,
                type: Boolean,
                default: false,
                onChange: (locked) => this._syncLockState(locked)
            });
            
            game.settings.register(this.MODULE_ID, 'lockoutMessage', {
                name: 'Lockout Message',
                hint: 'Message displayed to players when they try to join during lockout',
                scope: 'world',
                config: false,
                type: String,
                default: 'The session is currently paused. Please wait for the Game Master to continue.',
                onChange: (message) => this._syncLockMessage(message)
            });
            
            game.settings.register(this.MODULE_ID, 'autoLock', {
                name: 'Auto-Lock on Startup',
                hint: 'Automatically lock the game when the world starts',
                scope: 'world',
                config: false,
                type: Boolean,
                default: false
            });
            
            game.settings.register(this.MODULE_ID, 'showBanner', {
                name: 'Show Lock Banner',
                hint: 'Display the banner at the top when session is locked',
                scope: 'world',
                config: false,
                type: Boolean,
                default: true
            });
            
            game.settings.register(this.MODULE_ID, 'bannerTopPosition', {
                name: 'Banner Top Position',
                hint: 'Distance from the top of the screen in pixels',
                scope: 'world',
                config: false,
                type: Number,
                default: 100
            });
            
            game.settings.register(this.MODULE_ID, 'buttonAnchor', {
                name: 'Button Anchor Position',
                hint: 'Where to anchor the floating button',
                scope: 'world',
                config: false,
                type: String,
                default: 'free',
                choices: {
                    'free': 'Free (Draggable)',
                    'top-right': 'Top Right',
                    'top-left': 'Top Left',
                    'bottom-right': 'Bottom Right',
                    'bottom-left': 'Bottom Left'
                }
            });
            
            game.settings.register(this.MODULE_ID, 'lockScreenJournalId', {
                name: 'Lock Screen Journal Entry',
                hint: 'JournalEntry shown to players on the lock screen',
                scope: 'world',
                config: false,
                type: String,
                default: ''
            });
            
            game.settings.register(this.MODULE_ID, 'lockScreenJournalPageId', {
                name: 'Lock Screen Journal Page',
                hint: 'JournalEntryPage shown to players on the lock screen',
                scope: 'world',
                config: false,
                type: String,
                default: ''
            });
            
            game.settings.register(this.MODULE_ID, 'lockScreenTips', {
                name: 'Lock Screen Tips',
                hint: 'Tips and trivia (one per line) rotated on the player lock screen',
                scope: 'world',
                config: false,
                type: String,
                default: '',
                onChange: () => this._syncLockScreenTips()
            });
            
            game.settings.register(this.MODULE_ID, 'lockScreenTipsTitle', {
                name: 'Lock Screen Tips Title',
                hint: 'Heading shown above the rotating tips on the player lock screen',
                scope: 'world',
                config: false,
                type: String,
                default: 'Tips & Trivia',
                onChange: () => this._syncLockScreenTips()
            });
            
            // Players can't read journals they lack permission on, so the GM publishes a copy here
            game.settings.register(this.MODULE_ID, 'lockScreenJournalSnapshot', {
                name: 'Lock Screen Journal Snapshot',
                hint: 'Published copy of the linked journal page shown to players',
                scope: 'world',
                config: false,
                type: Object,
                default: {},
                onChange: () => this._syncLockScreenJournal()
            });
        } catch (error) {
            console.error('Table Flow - Scene Prep | Error registering settings:', error);
        }
    }
    
    /**
     * Get current lock state
     * @returns {boolean} Whether the game is locked
     */
    static isLocked() {
        return game.settings.get(this.MODULE_ID, 'isLocked');
    }
    
    /**
     * Set lock state
     * @param {boolean} locked - Whether to lock the game
     */
    static async setLocked(locked) {
        await game.settings.set(this.MODULE_ID, 'isLocked', locked);
    }
    
    /**
     * Get lockout message
     * @returns {string} The lockout message
     */
    static getLockoutMessage() {
        return game.settings.get(this.MODULE_ID, 'lockoutMessage');
    }
    
    /**
     * Set lockout message
     * @param {string} message - The lockout message
     */
    static async setLockoutMessage(message) {
        await game.settings.set(this.MODULE_ID, 'lockoutMessage', message);
    }
    
    /**
     * Get auto-lock setting
     * @returns {boolean} Whether auto-lock is enabled
     */
    static getAutoLock() {
        return game.settings.get(this.MODULE_ID, 'autoLock');
    }
    
    /**
     * Set auto-lock setting
     * @param {boolean} enabled - Whether to enable auto-lock
     */
    static async setAutoLock(enabled) {
        await game.settings.set(this.MODULE_ID, 'autoLock', enabled);
    }
    
    /**
     * Get show banner setting
     * @returns {boolean} Whether to show the banner
     */
    static getShowBanner() {
        return game.settings.get(this.MODULE_ID, 'showBanner');
    }
    
    /**
     * Set show banner setting
     * @param {boolean} enabled - Whether to show the banner
     */
    static async setShowBanner(enabled) {
        await game.settings.set(this.MODULE_ID, 'showBanner', enabled);
    }
    
    /**
     * Get banner top position
     * @returns {number} Top position in pixels
     */
    static getBannerTopPosition() {
        return game.settings.get(this.MODULE_ID, 'bannerTopPosition');
    }
    
    /**
     * Set banner top position
     * @param {number} position - Top position in pixels
     */
    static async setBannerTopPosition(position) {
        await game.settings.set(this.MODULE_ID, 'bannerTopPosition', position);
    }
    
    /**
     * Get button anchor position
     * @returns {string} Anchor position
     */
    static getButtonAnchor() {
        return game.settings.get(this.MODULE_ID, 'buttonAnchor');
    }
    
    /**
     * Set button anchor position
     * @param {string} anchor - Anchor position
     */
    static async setButtonAnchor(anchor) {
        await game.settings.set(this.MODULE_ID, 'buttonAnchor', anchor);
    }

    /**
     * Get the JournalEntry id linked to the lock screen
     * @returns {string}
     */
    static getLockScreenJournalId() {
        return game.settings.get(this.MODULE_ID, 'lockScreenJournalId');
    }

    /**
     * Get the JournalEntryPage id linked to the lock screen
     * @returns {string}
     */
    static getLockScreenJournalPageId() {
        return game.settings.get(this.MODULE_ID, 'lockScreenJournalPageId');
    }

    /**
     * Get the lock screen tips as a list of non-empty lines
     * @returns {string[]}
     */
    static getLockScreenTips() {
        return String(game.settings.get(this.MODULE_ID, 'lockScreenTips') ?? '')
            .split(/\r?\n/)
            .map(line => line.replace(/^\s*•\s*/, '').trim())
            .filter(Boolean);
    }

    /**
     * Get the heading for the tips box (falls back to the default when blank)
     * @returns {string}
     */
    static getLockScreenTipsTitle() {
        return String(game.settings.get(this.MODULE_ID, 'lockScreenTipsTitle') ?? '').trim() || 'Tips & Trivia';
    }

    /**
     * @param {string} title
     */
    static async setLockScreenTipsTitle(title) {
        await game.settings.set(this.MODULE_ID, 'lockScreenTipsTitle', String(title ?? '').trim());
    }

    /**
     * Save the lock screen tips (one per line)
     * @param {string} text
     */
    static async setLockScreenTips(text) {
        await game.settings.set(this.MODULE_ID, 'lockScreenTips', String(text ?? ''));
    }

    /**
     * Set the journal linked to the lock screen and publish it to players. Passing '' clears it.
     * @param {string} journalId
     * @param {string} pageId
     */
    static async setLockScreenJournal(journalId, pageId) {
        await game.settings.set(this.MODULE_ID, 'lockScreenJournalId', journalId || '');
        await game.settings.set(this.MODULE_ID, 'lockScreenJournalPageId', pageId || '');
        await this.refreshLockScreenJournalSnapshot();
    }

    /**
     * GM only: rebuild the published snapshot from the linked page. Secrets are stripped.
     */
    static async refreshLockScreenJournalSnapshot() {
        if (!game.user.isGM) return;

        const page = game.journal?.get(this.getLockScreenJournalId())?.pages?.get(this.getLockScreenJournalPageId());
        let next = {};
        if (page) {
            let html = '<p><em>This page type cannot be displayed here.</em></p>';
            if (page.type === 'text') {
                const TextEditorImpl = foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor;
                html = await TextEditorImpl.enrichHTML(page.text?.content ?? '', { secrets: false, relativeTo: page });
            }
            next = { pageId: page.id, title: page.name, html };
        }

        const current = game.settings.get(this.MODULE_ID, 'lockScreenJournalSnapshot');
        if (JSON.stringify(current ?? {}) === JSON.stringify(next)) return;
        await game.settings.set(this.MODULE_ID, 'lockScreenJournalSnapshot', next);
    }

    /**
     * Read the published journal snapshot (readable by every client).
     * @returns {{title: string, html: string} | null}
     */
    static getLockScreenJournalContent() {
        const snapshot = game.settings.get(this.MODULE_ID, 'lockScreenJournalSnapshot');
        if (!snapshot?.pageId) return null;
        return { title: snapshot.title, html: snapshot.html ?? '' };
    }

    /**
     * Synchronize lock visuals when lock state changes.
     * This acts as a reliable fallback if a client misses a socket event.
     * @param {boolean} locked - Whether the session is locked
     * @private
     */
    static _syncLockState(locked) {
        if (game.user.isGM) {
            if (window.TableFlowScenePrep.GMBanner) {
                if (locked && this.getShowBanner()) {
                    window.TableFlowScenePrep.GMBanner.show();
                } else {
                    window.TableFlowScenePrep.GMBanner.hide();
                }
            }
            return;
        }

        if (!window.TableFlowScenePrep.PlayerOverlay) {
            return;
        }

        if (locked) {
            window.TableFlowScenePrep.PlayerOverlay.show(this.getLockoutMessage());
        } else {
            window.TableFlowScenePrep.PlayerOverlay.hide();
        }
    }

    /**
     * Synchronize overlay message on clients while locked.
     * @param {string} message - Updated lock message
     * @private
     */
    static _syncLockMessage(message) {
        if (game.user.isGM || !window.TableFlowScenePrep.PlayerOverlay) {
            return;
        }

        if (!this.isLocked()) {
            return;
        }

        const overlayEl = document.getElementById(window.TableFlowScenePrep.PlayerOverlay.OVERLAY_ID);
        if (overlayEl) {
            window.TableFlowScenePrep.PlayerOverlay.updateMessage(message);
            return;
        }

        // Ensure late or desynced clients still get the overlay while locked.
        window.TableFlowScenePrep.PlayerOverlay.show(message);
    }

    /**
     * Synchronize the rotating tips on clients while locked.
     * @private
     */
    static _syncLockScreenTips() {
        if (game.user.isGM || !window.TableFlowScenePrep.PlayerOverlay) {
            return;
        }
        if (!this.isLocked()) {
            return;
        }
        window.TableFlowScenePrep.PlayerOverlay.updateTips(this.getLockScreenTips());
    }

    /**
     * Synchronize the linked journal on clients while locked (fallback for onChange).
     * @private
     */
    static _syncLockScreenJournal() {
        if (game.user.isGM || !window.TableFlowScenePrep.PlayerOverlay) {
            return;
        }
        if (!this.isLocked()) {
            return;
        }
        window.TableFlowScenePrep.PlayerOverlay.updateJournal(this.getLockScreenJournalContent());
    }
};
