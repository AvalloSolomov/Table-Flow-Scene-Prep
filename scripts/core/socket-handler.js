/**
 * Socket Handler Module
 * Manages real-time communication between GM and players
 */

window.TableFlowScenePrep = window.TableFlowScenePrep || {};

window.TableFlowScenePrep.SocketHandler = class {
    static MODULE_ID = 'table-flow-scene-prep';
    static _initialized = false;
    
    /**
     * Initialize socket listeners
     */
    static initialize() {
        if (this._initialized) {
            console.warn('Table Flow - Scene Prep | Socket handler already initialized');
            return;
        }
        
        try {
            game.socket.on(`module.${this.MODULE_ID}`, (data) => {
                this._handleSocketMessage(data);
            });
            
            this._initialized = true;
        } catch (error) {
            console.error('Table Flow - Scene Prep | Error setting up socket:', error);
        }
    }
    
    /**
     * Handle incoming socket messages.
     * Sockets are not authenticated, so players never trust the payload: the world setting
     * (writable only by a GM) is the source of truth and the message is just a nudge to re-check it.
     * @private
     */
    static _handleSocketMessage(data) {
        if (!data?.action) {
            return;
        }

        // Ignore targeted events not intended for this client.
        if (data.targetUserId && data.targetUserId !== game.user.id) {
            return;
        }
        
        // Handle GM banner updates
        if (game.user.isGM) {
            const locked = window.TableFlowScenePrep.Settings.isLocked();
            if (data.action === 'lock' && locked) {
                window.TableFlowScenePrep.GMBanner?.show();
            } else if (data.action === 'unlock' && !locked) {
                window.TableFlowScenePrep.GMBanner?.hide();
            }
            return; // GMs don't need player overlay processing
        }
        
        switch (data.action) {
            case 'lock':
                this._onLock();
                break;
            case 'unlock':
                this._onUnlock();
                break;
            case 'messageUpdate':
                this._onMessageUpdate();
                break;
            case 'journalUpdate':
                this._onJournalUpdate();
                break;
            default:
                console.warn('Table Flow - Scene Prep | Unknown socket action:', data.action);
        }
    }
    
    /**
     * @private
     */
    static _onLock() {
        const settings = window.TableFlowScenePrep.Settings;
        if (settings.isLocked()) {
            window.TableFlowScenePrep.PlayerOverlay?.show(settings.getLockoutMessage());
        }
    }
    
    /**
     * @private
     */
    static _onUnlock() {
        if (!window.TableFlowScenePrep.Settings.isLocked()) {
            window.TableFlowScenePrep.PlayerOverlay?.hide();
        }
    }
    
    /**
     * @private
     */
    static _onMessageUpdate() {
        const settings = window.TableFlowScenePrep.Settings;
        if (settings.isLocked()) {
            window.TableFlowScenePrep.PlayerOverlay?.updateMessage(settings.getLockoutMessage());
        }
    }
    
    /**
     * @private
     */
    static _onJournalUpdate() {
        const settings = window.TableFlowScenePrep.Settings;
        if (settings.isLocked()) {
            window.TableFlowScenePrep.PlayerOverlay?.updateJournal(settings.getLockScreenJournalContent());
        }
    }
    
    /**
     * Emit lock event to all players
     * @param {string} message - Lockout message to display
     */
    static emitLock(message, targetUserId = null) {
        game.socket.emit(`module.${this.MODULE_ID}`, {
            action: 'lock',
            message: message,
            targetUserId,
            timestamp: Date.now()
        });
    }
    
    /**
     * Emit unlock event to all players
     */
    static emitUnlock() {
        game.socket.emit(`module.${this.MODULE_ID}`, {
            action: 'unlock',
            timestamp: Date.now()
        });
    }
    
    /**
     * Emit message update event
     * @param {string} message - New lockout message
     */
    static emitMessageUpdate(message) {
        game.socket.emit(`module.${this.MODULE_ID}`, {
            action: 'messageUpdate',
            message: message,
            timestamp: Date.now()
        });
    }
    
    /**
     * Emit linked journal update event
     */
    static emitJournalUpdate() {
        game.socket.emit(`module.${this.MODULE_ID}`, {
            action: 'journalUpdate',
            timestamp: Date.now()
        });
    }
};
