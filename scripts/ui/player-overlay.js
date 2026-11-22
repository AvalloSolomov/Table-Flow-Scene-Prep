/**
 * Player Overlay Component
 * Full-screen lockout overlay shown to players when session is locked
 */

window.TableFlowScenePrep = window.TableFlowScenePrep || {};

window.TableFlowScenePrep.PlayerOverlay = class {
    static OVERLAY_ID = 'table-flow-scene-prep-overlay';
    static TIP_ROTATE_MS = 10000;
    static TIP_FADE_MS = 400;
    static tipInterval = null;
    static tipSwapTimer = null;
    static tipQueue = [];
    static tipPos = 0;
    
    /**
     * Show the player lockout overlay
     * @param {string} message - Custom lockout message
     */
    static show(message = null) {
        const displayMessage = message || window.TableFlowScenePrep.Settings.getLockoutMessage();
        
        // Remove existing overlay if any
        this.hide();
        
        const playerInfo = window.TableFlowScenePrep.DOMHelpers.getPlayerInfo();
        const currentPlayer = game.user;
        const otherWaitingPlayers = playerInfo.online.filter(u => u.id !== currentPlayer.id);
        const journalContent = window.TableFlowScenePrep.Settings.getLockScreenJournalContent();
        const tips = window.TableFlowScenePrep.Settings.getLockScreenTips();
        this._resetTipQueue(tips);
        
        const overlay = document.createElement('div');
        overlay.id = this.OVERLAY_ID;
        overlay.className = 'tfsp-player-overlay';
        
        overlay.innerHTML = this._generateOverlayHTML(displayMessage, currentPlayer, otherWaitingPlayers, playerInfo.onlineCount, journalContent, tips);
        
        document.body.appendChild(overlay);
        this._applySidebarInset();
        window.addEventListener('resize', this._boundInset ??= () => this._applySidebarInset());
        this._startTipRotation(tips);
        // Presence can still be settling when a client first loads
        setTimeout(() => this.refreshPlayers(), 1500);

        
        // Only enable dragging for GMs
        if (game.user.isGM) {
            this._initializeDragging();
        }
        
    }
    
    /**
     * GMs can see the overlay too; it must never cover Foundry's right sidebar
     * @private
     */
    static _applySidebarInset() {
        const overlay = document.getElementById(this.OVERLAY_ID);
        if (!overlay || !game.user.isGM) return;
        const inset = window.TableFlowScenePrep.DOMHelpers.getRightSidebarInset();
        overlay.style.width = inset > 0 ? 'auto' : '';
        overlay.style.right = inset > 0 ? `${inset}px` : '';
    }
    
    /**
     * Re-render the connected/waiting player list in place
     */
    static refreshPlayers() {
        const overlay = document.getElementById(this.OVERLAY_ID);
        if (!overlay) return;

        const playerInfo = window.TableFlowScenePrep.DOMHelpers.getPlayerInfo();
        const others = playerInfo.online.filter(u => u.id !== game.user.id);

        const pill = overlay.querySelector('.tfsp-connected-players-pill');
        if (pill) pill.textContent = `${playerInfo.onlineCount} Connected`;

        const card = overlay.querySelector('.tfsp-player-count');
        if (!card) return;
        card.querySelectorAll('.tfsp-player-name').forEach(el => el.remove());
        card.insertAdjacentHTML('beforeend', others.length
            ? others.map(p => `<div class="tfsp-player-name">${window.TableFlowScenePrep.DOMHelpers.escapeHTML(p.name)}</div>`).join('')
            : '<div class="tfsp-player-name">Just you</div>');
    }

    /**
     * Hide the player overlay
     */
    static hide() {
        const overlay = document.getElementById(this.OVERLAY_ID);
        if (overlay) {
            overlay.remove();
        }

        this._stopTipRotation();
    }
    
    /**
     * Replace the rotating tips live (removes the box when the list is empty)
     * @param {string[]} tips
     */
    static updateTips(tips) {
        const overlay = document.getElementById(this.OVERLAY_ID);
        if (!overlay) return;
        
        this._stopTipRotation();
        overlay.querySelector('.tfsp-overlay-tip')?.remove();
        if (!tips.length) return;
        
        this._resetTipQueue(tips);
        overlay.querySelector('.tfsp-overlay-footer')?.insertAdjacentHTML('beforebegin', this._generateTipHTML(tips));
        this._startTipRotation(tips);
    }
    
    /**
     * Shuffle the tips into a fresh play order. A new cycle never opens with the tip just shown.
     * @private
     */
    static _resetTipQueue(tips, avoid = null) {
        const queue = [...tips];
        for (let i = queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue[i], queue[j]] = [queue[j], queue[i]];
        }
        if (queue.length > 1 && queue[0] === avoid) {
            [queue[0], queue[queue.length - 1]] = [queue[queue.length - 1], queue[0]];
        }
        this.tipQueue = queue;
        this.tipPos = 0;
    }
    
    /**
     * Fade to the next tip on a slow timer. Only runs with 2+ tips.
     * @private
     */
    static _startTipRotation(tips) {
        this._stopTipRotation();
        if (tips.length < 2) return;
        
        this.tipInterval = setInterval(() => {
            const textEl = document.querySelector('.tfsp-overlay-tip-text');
            if (!textEl) return;
            
            this.tipPos++;
            if (this.tipPos >= this.tipQueue.length) {
                this._resetTipQueue(tips, this.tipQueue[this.tipQueue.length - 1]);
            }
            const next = this.tipQueue[this.tipPos];
            
            textEl.classList.add('tfsp-tip-fading');
            this.tipSwapTimer = setTimeout(() => {
                textEl.textContent = next;
                textEl.classList.remove('tfsp-tip-fading');
            }, this.TIP_FADE_MS);
        }, this.TIP_ROTATE_MS);
    }
    
    /**
     * @private
     */
    static _stopTipRotation() {
        if (this.tipInterval) {
            clearInterval(this.tipInterval);
            this.tipInterval = null;
        }
        if (this.tipSwapTimer) {
            clearTimeout(this.tipSwapTimer);
            this.tipSwapTimer = null;
        }
    }
    
    /**
     * Generate the tips box HTML, or an empty string when there are no tips
     * @private
     */
    static _generateTipHTML(tips) {
        if (!tips?.length) return '';
        const tip = this.tipQueue[this.tipPos] ?? tips[0];
        return `
            <div class="tfsp-overlay-tip">
                <div class="tfsp-overlay-tip-label">${window.TableFlowScenePrep.DOMHelpers.escapeHTML(window.TableFlowScenePrep.Settings.getLockScreenTipsTitle())}</div>
                <div class="tfsp-overlay-tip-text">${window.TableFlowScenePrep.DOMHelpers.escapeHTML(tip)}</div>
            </div>
        `;
    }
    
    /**
     * Update the message in the overlay
     * @param {string} message - New message
     */
    static updateMessage(message) {
        const messageEl = document.querySelector('.tfsp-overlay-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }
    
    /**
     * Update (or remove) the linked journal box in the overlay
     * @param {{title: string, html: string} | null} content
     */
    static updateJournal(content) {
        const overlay = document.getElementById(this.OVERLAY_ID);
        if (!overlay) return;
        
        const existing = overlay.querySelector('.tfsp-overlay-journal');
        if (!content) {
            existing?.remove();
            return;
        }
        
        const journalHTML = this._generateJournalHTML(content);
        if (existing) {
            existing.outerHTML = journalHTML;
        } else {
            // The tips text sits between the journal and the footer, so the journal goes before whichever comes first
            overlay.querySelector('.tfsp-overlay-tip, .tfsp-overlay-footer')?.insertAdjacentHTML('beforebegin', journalHTML);
        }
    }
    
    /**
     * Generate the linked-journal box HTML, or an empty string if none is linked
     * @private
     */
    static _generateJournalHTML(content) {
        if (!content) return '';
        return `
            <div class="tfsp-overlay-journal">
                <div class="tfsp-overlay-journal-title">${window.TableFlowScenePrep.DOMHelpers.escapeHTML(content.title)}</div>
                <div class="tfsp-overlay-journal-body">${content.html}</div>
            </div>
        `;
    }
    
    /**
     * Generate overlay HTML
     * @private
     */
    static _generateOverlayHTML(message, currentPlayer, otherPlayers, totalWaiting, journalContent = null, tips = []) {
        const otherNamesHTML = otherPlayers.length > 0
            ? otherPlayers.map(player => `<div class="tfsp-player-name">${window.TableFlowScenePrep.DOMHelpers.escapeHTML(player.name)}</div>`).join('')
            : '';
        
        return `
            <!-- Main content card -->
            <div class="tfsp-overlay-card">
                ${game.user.isGM ? `
                <!-- Drag handle (GM only) -->
                <div class="tfsp-drag-handle" title="Drag to move vertically">
                    <div class="tfsp-drag-indicator"></div>
                    <div class="tfsp-drag-indicator"></div>
                    <div class="tfsp-drag-indicator"></div>
                </div>
                ` : ''}
                
                <!-- Content layer -->
                <div class="tfsp-overlay-content">
                    <!-- Bordered intro card: icon, title, description -->
                    <div class="tfsp-overlay-intro">
                        <div class="tfsp-lock-icon-box">
                            <i class="tfsp-icon tfsp-icon-lock" aria-hidden="true"></i>
                        </div>
                        <h2 class="tfsp-overlay-title">Session Paused</h2>
                        <p class="tfsp-overlay-message">${window.TableFlowScenePrep.DOMHelpers.escapeHTML(message)}</p>
                    </div>
                    
                    <!-- Connected players -->
                    <div class="tfsp-connected-players-header">
                        <div class="tfsp-connected-players-title">
                            <i class="tfsp-icon tfsp-icon-users" aria-hidden="true"></i>
                            <span>Connected Players</span>
                        </div>
                        <div class="tfsp-connected-players-pill">${totalWaiting} Connected</div>
                    </div>
                    <div class="tfsp-player-info">
                        <div class="tfsp-player-card tfsp-player-you">
                            <div class="tfsp-player-status">
                                <div class="tfsp-status-dot tfsp-status-online"></div>
                                <span>You're Connected</span>
                            </div>
                            <div class="tfsp-player-name">${currentPlayer.name}</div>
                        </div>
                        
                        <div class="tfsp-player-card tfsp-player-count">
                            <div class="tfsp-player-status">
                                <div class="tfsp-status-dot tfsp-status-waiting"></div>
                                <span>Players Waiting</span>
                            </div>
                            ${otherNamesHTML || '<div class="tfsp-player-name">Just you</div>'}
                        </div>
                    </div>
                    
                    ${this._generateJournalHTML(journalContent)}
                    
                    ${this._generateTipHTML(tips)}
                    
                    <!-- Footer branding -->
                    <div class="tfsp-overlay-footer">
                        <a class="tfsp-overlay-footer-link" href="https://tableflowapps.com" target="_blank" rel="noopener noreferrer" title="tableflowapps.com">
                            <img class="tfsp-overlay-footer-logo" src="modules/table-flow-scene-prep/TABLEFLOW_LOGO.svg" alt="Table Flow">
                        </a>
                        <span class="tfsp-overlay-footer-text">This screen does not interfere with foundry loading</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Initialize dragging functionality for the overlay card
     * @private
     */
    static _initializeDragging() {
        const card = document.querySelector('.tfsp-overlay-card');
        const dragHandle = document.querySelector('.tfsp-drag-handle');
        
        if (!card || !dragHandle) return;
        
        let isDragging = false;
        let startY = 0;
        let startTop = 0;
        
        // Get the vertical center position
        const getCenterY = () => {
            const viewportHeight = window.innerHeight;
            const cardHeight = card.offsetHeight;
            return (viewportHeight - cardHeight) / 2;
        };
        
        // Initialize position to center
        card.style.position = 'relative';
        card.style.top = '0px';
        
        const handleDragStart = (e) => {
            isDragging = true;
            startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            
            const currentTop = parseInt(card.style.top) || 0;
            startTop = currentTop;
            
            card.style.transition = 'none';
            dragHandle.style.cursor = 'grabbing';
            
            e.preventDefault();
        };
        
        const handleDragMove = (e) => {
            if (!isDragging) return;
            
            const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            const deltaY = currentY - startY;
            const newTop = startTop + deltaY;
            
            // Calculate boundaries
            const viewportHeight = window.innerHeight;
            const cardHeight = card.offsetHeight;
            const maxTop = viewportHeight - cardHeight - 20; // 20px margin from bottom
            const minTop = -getCenterY() + 20; // 20px margin from top
            
            // Constrain to viewport
            const constrainedTop = Math.max(minTop, Math.min(maxTop, newTop));
            card.style.top = `${constrainedTop}px`;
        };
        
        const handleDragEnd = () => {
            if (!isDragging) return;
            
            isDragging = false;
            card.style.transition = '';
            dragHandle.style.cursor = 'grab';
        };
        
        // Mouse events
        dragHandle.addEventListener('mousedown', handleDragStart);
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
        
        // Touch events
        dragHandle.addEventListener('touchstart', handleDragStart, { passive: false });
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);
    }
};
