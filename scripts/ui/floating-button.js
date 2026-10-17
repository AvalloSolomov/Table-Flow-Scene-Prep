/**
 * Floating Button Component
 * GM control button with draggable positioning
 */

window.TableFlowScenePrep = window.TableFlowScenePrep || {};

window.TableFlowScenePrep.FloatingButton = class {
    static BUTTON_ID = 'table-flow-scene-prep-button';
    static STORAGE_KEY = 'table-flow-scene-prep-button-position';
    // Other Table Flow modules' floating buttons, keyed by the module that must be active for the ID to be trusted
    static ATTACH_ANCHORS = [
        { moduleId: 'table-flow-intermission', buttonId: 'gm-ready-check-button' },
        { moduleId: 'table-flow-intermission', buttonId: 'gm-break-button' },
        { moduleId: 'table-flow-patch-notes', buttonId: 'table-flow-patch-notes-button' }
    ];
    static ATTACH_GAP = 8;
    static button = null;
    static _dragCleanup = null;
    static _attachTimer = null;
    static _anchor = null;
    static _anchorObserver = null;
    static _boundResize = null;
    static _attached = false;
    
    /**
     * Create and initialize the floating button
     */
    static create() {
        if (this.button) {
            console.warn('Table Flow - Scene Prep | Button already exists');
            return;
        }
        
        this.button = document.createElement('div');
        this.button.id = this.BUTTON_ID;
        this.button.className = 'tfsp-floating-button';
        
        // Set initial position styling (required for visibility)
        this.button.style.position = 'fixed';
        this.button.style.zIndex = '10000';
        
        document.body.appendChild(this.button);
        
        // Dock below sibling Table Flow module buttons when present, otherwise fall back
        // to anchor/free positioning inside the watcher itself
        this._startAttachWatcher();
        
        this.updateState();
    }
    
    /**
     * Find the lowest-sitting floating button belonging to another active Table Flow module.
     * @returns {HTMLElement|null}
     * @private
     */
    static _findAttachAnchor() {
        let anchor = null;
        let anchorBottom = -Infinity;
        
        for (const { moduleId, buttonId } of this.ATTACH_ANCHORS) {
            if (!game.modules.get(moduleId)?.active) continue;
            
            const el = document.getElementById(buttonId);
            if (!el || el === this.button) continue;
            
            const bottom = el.getBoundingClientRect().bottom;
            if (bottom > anchorBottom) {
                anchor = el;
                anchorBottom = bottom;
            }
        }
        
        return anchor;
    }
    
    /**
     * Snap our button directly below the lowest sibling button, right-aligned with it.
     * @param {HTMLElement} anchor
     * @private
     */
    static _positionBelowAnchor(anchor) {
        const rect = anchor.getBoundingClientRect();
        const rightOffset = Math.max(0, window.innerWidth - rect.right);
        
        this.button.style.top = `${rect.bottom + this.ATTACH_GAP}px`;
        this.button.style.right = `${rightOffset}px`;
        this.button.style.bottom = 'auto';
        this.button.style.left = 'auto';
    }
    
    /**
     * Continuously follow sibling Table Flow module buttons (they're user-draggable and can
     * appear/disappear), falling back to our own anchor/free positioning when none are found.
     * @private
     */
    static _startAttachWatcher() {
        this._boundClick ??= () => this.onClick();
        
        // Sibling buttons move by changing their inline style, so observing it tracks drags
        // in the same frame with no polling cost.
        this._anchorObserver = new MutationObserver(() => {
            if (this._attached && this._anchor?.isConnected) {
                this._positionBelowAnchor(this._anchor);
            }
        });
        
        const tryAttach = () => {
            const anchor = this._findAttachAnchor();
            if (anchor) {
                if (anchor !== this._anchor) {
                    this._anchorObserver.disconnect();
                    this._anchorObserver.observe(anchor, { attributes: true, attributeFilter: ['style', 'class'] });
                    this._anchor = anchor;
                }
                if (!this._attached) {
                    // Switching into attached mode: drop independent drag/anchor handling
                    if (this._dragCleanup) {
                        this._dragCleanup();
                        this._dragCleanup = null;
                    }
                    this.button.onclick = this._boundClick;
                    this._attached = true;
                }
                this._positionBelowAnchor(anchor);
            } else if (this._attached) {
                // Anchor disappeared (e.g. sibling module disabled mid-session) - go independent
                this._anchorObserver.disconnect();
                this._anchor = null;
                this._attached = false;
                this.button.onclick = null;
                this.applyAnchorPosition();
            }
        };
        
        tryAttach();
        if (!this._attached) {
            // No sibling buttons yet; use normal anchor/free positioning in the meantime
            this.applyAnchorPosition();
        }
        
        // Slow poll only discovers anchors appearing/disappearing; movement is handled by the observer.
        this._attachTimer = setInterval(tryAttach, 1000);
        this._boundResize = tryAttach;
        window.addEventListener('resize', this._boundResize);
    }
    
    /**
     * Apply anchor position based on settings
     */
    static applyAnchorPosition() {
        if (!this.button) return;

        // While docked to a sibling Table Flow module button, the attach watcher owns
        // positioning/click handling exclusively - settings-driven changes apply once we detach.
        if (this._attached) return;

        // Remove previous draggable handlers before applying new anchor mode
        if (this._dragCleanup) {
            this._dragCleanup();
            this._dragCleanup = null;
        }

        const anchor = window.TableFlowScenePrep.Settings.getButtonAnchor();
        
        // Clear existing position
        this.button.style.top = '';
        this.button.style.right = '';
        this.button.style.bottom = '';
        this.button.style.left = '';
        
        if (anchor === 'free') {
            // Make draggable with callbacks
            this._dragCleanup = window.TableFlowScenePrep.DOMHelpers.makeDraggable(
                this.button,
                () => this.savePosition(),
                () => this.onClick()
            );

            // Let draggable helper handle click-vs-drag in free mode
            this.button.onclick = null;
            
            // Load saved position (will override default if exists)
            window.TableFlowScenePrep.DOMHelpers.loadPosition(this.STORAGE_KEY, this.button);
            
            // Set default if no saved position
            if (!this.button.style.top && !this.button.style.bottom) {
                this.button.style.top = '20px';
                this.button.style.right = '20px';
            }
        } else {
            // Anchored mode uses standard click behavior
            this.button.onclick = () => this.onClick();
            
            // Canvas-aware positioning (avoiding sidebars and chat)
            const topOffset = '70px';  // Below top nav bar
            const bottomOffset = '20px';
            const leftSidebarWidth = 310;  // Left sidebar width
            const rightSidebarWidth = 310; // Right sidebar (chat) width
            const horizontalOffset = '20px';
            
            switch (anchor) {
                case 'top-right':
                    this.button.style.top = topOffset;
                    this.button.style.right = `calc(${rightSidebarWidth}px + ${horizontalOffset})`;
                    break;
                case 'top-left':
                    this.button.style.top = topOffset;
                    this.button.style.left = `calc(${leftSidebarWidth}px + ${horizontalOffset})`;
                    break;
                case 'bottom-right':
                    this.button.style.bottom = bottomOffset;
                    this.button.style.right = `calc(${rightSidebarWidth}px + ${horizontalOffset})`;
                    break;
                case 'bottom-left':
                    this.button.style.bottom = bottomOffset;
                    this.button.style.left = `calc(${leftSidebarWidth}px + ${horizontalOffset})`;
                    break;
            }
        }
    }
    
    /**
     * Update button appearance based on current state
     */
    static updateState() {
        if (!this.button) return;
        
        const isLocked = window.TableFlowScenePrep.Settings.isLocked();
        const playerInfo = window.TableFlowScenePrep.DOMHelpers.getPlayerInfo();
        const waitingCount = isLocked ? playerInfo.waitingCount : 0;
        
        // Ensure position is maintained (in case it was cleared)
        if (!this.button.style.position || this.button.style.position !== 'fixed') {
            this.button.style.position = 'fixed';
            this.button.style.zIndex = '10000';
        }
        
        // Update button appearance
        if (isLocked && waitingCount > 0) {
            // Locked with waiting players
            this.button.className = 'tfsp-floating-button tfsp-btn-locked tfsp-btn-waiting';
            this.button.innerHTML = `
                <i class="fas fa-users tfsp-btn-icon" aria-hidden="true"></i>
                <span class="tfsp-btn-count">${waitingCount}</span>
                <span class="tfsp-btn-label">waiting</span>
            `;
        } else if (isLocked) {
            // Locked, no players
            this.button.className = 'tfsp-floating-button tfsp-btn-locked';
            this.button.innerHTML = `
                <i class="fas fa-lock tfsp-btn-icon" aria-hidden="true"></i>
                <span class="tfsp-btn-label">Locked</span>
            `;
        } else {
            // Unlocked
            this.button.className = 'tfsp-floating-button tfsp-btn-unlocked';
            this.button.innerHTML = '<i class="fas fa-lock-open tfsp-btn-icon" aria-hidden="true"></i>';
        }
    }
    
    /**
     * Handle button click
     * @private
     */
    static onClick() {
        if (window.TableFlowScenePrep.GMInterface) {
            window.TableFlowScenePrep.GMInterface.show();
        }
    }
    
    /**
     * Save button position
     * @private
     */
    static savePosition() {
        window.TableFlowScenePrep.DOMHelpers.savePosition(this.STORAGE_KEY, this.button);
    }
    
    /**
     * Remove the button
     */
    static remove() {
        if (this._attachTimer) {
            clearInterval(this._attachTimer);
            this._attachTimer = null;
        }

        this._anchorObserver?.disconnect();
        this._anchorObserver = null;
        this._anchor = null;

        if (this._boundResize) {
            window.removeEventListener('resize', this._boundResize);
            this._boundResize = null;
        }

        if (this._dragCleanup) {
            this._dragCleanup();
            this._dragCleanup = null;
        }

        this._attached = false;

        if (this.button) {
            this.button.remove();
            this.button = null;
        }
    }
};
