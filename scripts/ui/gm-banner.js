/**
 * GM Banner - Prominent warning banner that displays when session is locked
 */
class GMBanner {
    static BANNER_ID = 'table-flow-scene-prep-gm-banner';
    
    /**
     * Show the GM banner at the top of the screen
     */
    static show() {
        // Check if banner is enabled in settings
        if (!window.TableFlowScenePrep.Settings.getShowBanner()) {
            return;
        }
        
        // Remove existing banner if present
        this.hide();
        
        // Update page title with lock icon
        if (!document.title.includes('🔒')) {
            document.title = '🔒 LOCKED - ' + document.title.replace('🔒 LOCKED - ', '');
        }
        
        // Count active non-GM players
        const players = Array.from(game.users.values()).filter(u => !u.isGM && u.active);
        const waitingCount = players.length;
        
        // Get banner position from settings
        const topPosition = window.TableFlowScenePrep.Settings.getBannerTopPosition();
        
        // Create banner element
        const banner = document.createElement('div');
        banner.id = this.BANNER_ID;
        banner.className = 'tfsp-gm-banner';
        banner.style.top = `${topPosition}px`;
        
        banner.innerHTML = `
            <div class="tfsp-banner-drag-handle" title="Drag to move vertically">
                <div class="tfsp-banner-drag-line"></div>
                <div class="tfsp-banner-drag-line"></div>
            </div>
            <i class="fas fa-lock tfsp-banner-icon" aria-hidden="true"></i>
            <span class="tfsp-banner-text">Session Locked</span>
            <span class="tfsp-banner-badge" style="display: ${waitingCount > 0 ? 'inline-flex' : 'none'};">${this._badgeHTML(waitingCount)}</span>
            <span class="tfsp-banner-hint">Click to unlock</span>
        `;
        
        document.body.appendChild(banner);
        
        // Initialize dragging FIRST
        this._initializeDragging(banner, topPosition);
        
        // Click to unlock - set after dragging to avoid conflicts
        banner.onclick = (e) => {
            // Don't unlock if clicking the drag handle or if we just finished dragging
            if (e.target.closest('.tfsp-banner-drag-handle') || banner.dataset.justDragged === 'true') {
                banner.dataset.justDragged = 'false';
                return;
            }
            this._handleBannerUnlockClick();
        };
    }
    
    /**
     * Hide the GM banner and restore page title
     */
    static hide() {
        const existingBanner = document.getElementById(this.BANNER_ID);
        if (existingBanner) {
            existingBanner.remove();
        }
        
        // Restore original title
        document.title = document.title.replace('🔒 LOCKED - ', '');
    }
    
    /**
     * Update the player count on the banner
     */
    static updateCount() {
        const banner = document.getElementById(this.BANNER_ID);
        if (!banner) return;
        
        const players = Array.from(game.users.values()).filter(u => !u.isGM && u.active);
        const waitingCount = players.length;
        
        // Only update badge content to preserve drag/click handlers on existing DOM nodes.
        let badge = banner.querySelector('.tfsp-banner-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'tfsp-banner-badge';
            const hint = banner.querySelector('.tfsp-banner-hint');
            if (hint) {
                banner.insertBefore(badge, hint);
            } else {
                banner.appendChild(badge);
            }
        }

        if (waitingCount > 0) {
            badge.innerHTML = this._badgeHTML(waitingCount);
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    }
    
    /**
     * Markup for the waiting-players pill
     * @private
     */
    static _badgeHTML(count) {
        return `<i class="fas fa-users" aria-hidden="true"></i> ${count} waiting`;
    }
    
    /**
     * Initialize dragging functionality for the banner
     * @private
     */
    static _initializeDragging(banner, initialTop) {
        const dragHandle = banner.querySelector('.tfsp-banner-drag-handle');
        if (!dragHandle) return;
        
        let isDragging = false;
        let startY = 0;
        let startTop = initialTop;
        
        const handleDragStart = (e) => {
            isDragging = true;
            startY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            startTop = parseInt(banner.style.top) || initialTop;
            
            banner.style.transition = 'none';
            dragHandle.style.cursor = 'grabbing';
            banner.dataset.justDragged = 'false';
            
            e.preventDefault();
            e.stopPropagation();
        };
        
        const handleDragMove = (e) => {
            if (!isDragging) return;
            
            const currentY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
            const deltaY = currentY - startY;
            const newTop = startTop + deltaY;
            
            // Constrain to viewport
            const minTop = 0;
            const maxTop = window.innerHeight - banner.offsetHeight;
            const constrainedTop = Math.max(minTop, Math.min(maxTop, newTop));
            
            banner.style.top = `${constrainedTop}px`;
        };
        
        const handleDragEnd = () => {
            if (!isDragging) return;
            
            isDragging = false;
            banner.style.transition = '';
            dragHandle.style.cursor = 'grab';
            banner.dataset.justDragged = 'true';
            
            // Save the new position to settings
            const newTop = parseInt(banner.style.top);
            if (window.TableFlowScenePrep?.Settings) {
                window.TableFlowScenePrep.Settings.setBannerTopPosition(newTop);
            }
            
            // Reset the justDragged flag after a short delay
            setTimeout(() => {
                banner.dataset.justDragged = 'false';
            }, 100);
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

    /**
     * Handle click-to-unlock from the banner using authoritative state change.
     * @private
     */
    static async _handleBannerUnlockClick() {
        if (!game.user.isGM) {
            return;
        }

        if (!window.TableFlowScenePrep?.Settings || !window.TableFlowScenePrep?.SocketHandler) {
            return;
        }

        try {
            await window.TableFlowScenePrep.Settings.setLocked(false);
            window.TableFlowScenePrep.SocketHandler.emitUnlock();

            if (window.TableFlowScenePrep?.FloatingButton?.button) {
                window.TableFlowScenePrep.FloatingButton.updateState();
            }

            ui.notifications.info('Session unlocked');
        } catch (error) {
            console.error('Table Flow - Scene Prep | Banner unlock failed:', error);
            ui.notifications.error('Failed to unlock session from banner');
        }
    }
}

// Register in global namespace
window.TableFlowScenePrep = window.TableFlowScenePrep || {};
window.TableFlowScenePrep.GMBanner = GMBanner;
