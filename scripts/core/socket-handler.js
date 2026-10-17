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
     * Handle incoming socket messages
     * @private
     */
    static _handleSocketMessage(data) {
        // Ignore targeted events not intended for this client.
        if (data?.targetUserId && data.targetUserId !== game.user.id) {
            return;
        }
        
        // Handle GM banner updates
        if (game.user.isGM) {
            switch (data.action) {
                case 'lock':
                    if (window.TableFlowScenePrep.GMBanner) {
                        window.TableFlowScenePrep.GMBanner.show();
                    }
                    break;
                case 'unlock':
                    if (window.TableFlowScenePrep.GMBanner) {
                        window.TableFlowScenePrep.GMBanner.hide();
                    }
                    break;
            }
            return; // GMs don't need player overlay processing
        }
        
        switch (data.action) {
            case 'lock':
                this._onLock(data);
                break;
            case 'unlock':
                this._onUnlock(data);
                break;
            case 'messageUpdate':
                this._onMessageUpdate(data);
                break;
            case 'journalUpdate':
                this._onJournalUpdate(data);
                break;
            default:
                console.warn('Table Flow - Scene Prep | Unknown socket action:', data.action);
        }
    }
    
    /**
     * Handle lock event
     * @private
     */
    static _onLock(data) {
        if (window.TableFlowScenePrep.PlayerOverlay) {
            window.TableFlowScenePrep.PlayerOverlay.show(data.message);
        }
    }
    
    /**
     * Handle unlock event
     * @private
     */
    static _onUnlock(data) {
        if (window.TableFlowScenePrep.PlayerOverlay) {
            window.TableFlowScenePrep.PlayerOverlay.hide();
        }
    }
    
    /**
     * Handle message update event
     * @private
     */
    static _onMessageUpdate(data) {
        if (window.TableFlowScenePrep.PlayerOverlay) {
            window.TableFlowScenePrep.PlayerOverlay.updateMessage(data.message);
        }
    }
    
    /**
     * Handle linked journal update event
     * @private
     */
    static _onJournalUpdate(data) {
        if (window.TableFlowScenePrep.PlayerOverlay) {
            window.TableFlowScenePrep.PlayerOverlay.updateJournal(window.TableFlowScenePrep.Settings.getLockScreenJournalContent());
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
