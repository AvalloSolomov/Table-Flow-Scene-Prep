/**
 * DOM Helper Utilities
 * Reusable DOM manipulation functions
 */

window.TableFlowScenePrep = window.TableFlowScenePrep || {};

window.TableFlowScenePrep.DOMHelpers = class {
    /**
     * Remove element by ID if it exists
     * @param {string} id - Element ID
     */
    static removeElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
            return true;
        }
        return false;
    }
    
    /**
     * Make an element draggable
     * @param {HTMLElement} element - Element to make draggable
     * @param {Function} onDragEnd - Callback when drag ends
     * @param {Function} onClick - Callback for click without drag
     */
    static makeDraggable(element, onDragEnd = null, onClick = null) {
        let moved = false;
        const originalTransition = element.style.transition;
        
        const handleMouseDown = function(e) {
            moved = false;
            
            // Disable transitions during drag
            element.style.transition = 'none';
            element.style.transform = 'none';
            
            const shiftX = e.clientX - element.getBoundingClientRect().left;
            const shiftY = e.clientY - element.getBoundingClientRect().top;
            
            function moveAt(pageX, pageY) {
                element.style.left = pageX - shiftX + 'px';
                element.style.top = pageY - shiftY + 'px';
                element.style.position = 'fixed';
                element.style.right = 'auto';
                element.style.bottom = 'auto';
            }
            
            function onMouseMove(e) {
                moved = true;
                moveAt(e.pageX, e.pageY);
            }
            
            const onMouseUp = function() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                
                // Restore transitions
                element.style.transition = originalTransition;
                
                if (moved && onDragEnd) {
                    onDragEnd(element);
                } else if (!moved && onClick) {
                    onClick(element);
                }
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const handleDragStart = function() {
            return false;
        };

        element.addEventListener('mousedown', handleMouseDown);
        element.ondragstart = handleDragStart;
        
        return function cleanupDraggable() {
            element.removeEventListener('mousedown', handleMouseDown);
            if (element.ondragstart === handleDragStart) {
                element.ondragstart = null;
            }
        };
    }
    
    /**
     * Save element position to localStorage
     * @param {string} key - Storage key
     * @param {HTMLElement} element - Element to save position for
     */
    static savePosition(key, element) {
        const rect = element.getBoundingClientRect();
        const position = {
            left: rect.left,
            top: rect.top,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(key, JSON.stringify(position));
        } catch (error) {
            console.warn(`Failed to save position for ${key}:`, error);
        }
    }
    
    /**
     * Load element position from localStorage
     * @param {string} key - Storage key
     * @param {HTMLElement} element - Element to restore position for
     * @param {number} maxAge - Maximum age in milliseconds (default: 30 days)
     * @returns {boolean} Whether position was restored
     */
    static loadPosition(key, element, maxAge = 30 * 24 * 60 * 60 * 1000) {
        try {
            const saved = localStorage.getItem(key);
            if (!saved) return false;
            
            const position = JSON.parse(saved);
            
            // Validate timestamp and data
            if (!position.timestamp || 
                (Date.now() - position.timestamp > maxAge) ||
                typeof position.left !== 'number' || 
                typeof position.top !== 'number') {
                return false;
            }
            
            // Validate position is within viewport
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            if (position.left >= 0 && position.left < viewportWidth - 50 &&
                position.top >= 0 && position.top < viewportHeight - 50) {
                
                element.style.left = position.left + 'px';
                element.style.top = position.top + 'px';
                element.style.right = 'auto';
                element.style.bottom = 'auto';
                
                return true;
            }
        } catch (error) {
            console.warn(`Failed to load position for ${key}:`, error);
        }
        
        return false;
    }
    
    /**
     * Escape text for safe interpolation into HTML
     * @param {string} value
     * @returns {string}
     */
    static escapeHTML(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    /**
     * Strip scripts, embedded content, inline event handlers and javascript: URLs from HTML
     * before it is shown on the lock screen. Foundry's own enrichment is trusted for markup;
     * this is a defensive second pass.
     * @param {string} html
     * @returns {string}
     */
    static sanitizeHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = String(html ?? '');

        template.content.querySelectorAll('script, iframe, object, embed, link, meta, base, form').forEach(el => el.remove());
        template.content.querySelectorAll('*').forEach(el => {
            for (const attr of Array.from(el.attributes)) {
                const name = attr.name.toLowerCase();
                const value = attr.value.replace(/[\u0000-\u0020]/g, '').toLowerCase();
                if (name.startsWith('on') || (['href', 'src', 'xlink:href', 'action', 'formaction'].includes(name) && /^(javascript|vbscript|data:text\/html)/.test(value))) {
                    el.removeAttribute(attr.name);
                }
            }
        });

        return template.innerHTML;
    }

    /**
     * Width (px) taken by Foundry's right-hand sidebar, so lock UI can stay clear of it.
     * Measured live because the sidebar can be collapsed or resized. Returns 0 when absent.
     * @returns {number}
     */
    static getRightSidebarInset() {
        const sidebar = document.getElementById('sidebar') || document.getElementById('ui-right');
        const rect = sidebar?.getBoundingClientRect();
        if (!rect || !rect.width) return 0;
        return Math.max(0, Math.round(window.innerWidth - rect.left));
    }
    
    /**
     * Get active player information
     * @returns {Object} Player counts and lists
     */
    static getPlayerInfo() {
        const allPlayers = Array.from(game.users.values()).filter(u => !u.isGM);
        const onlinePlayers = allPlayers.filter(u => u.active);
        
        return {
            all: allPlayers,
            online: onlinePlayers,
            totalCount: allPlayers.length,
            onlineCount: onlinePlayers.length,
            waitingCount: onlinePlayers.length
        };
    }
};
