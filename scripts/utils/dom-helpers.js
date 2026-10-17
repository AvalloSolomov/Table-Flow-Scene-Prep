/**
 * DOM Helper Utilities
 * Reusable DOM manipulation functions
 */

window.TableFlowScenePrep = window.TableFlowScenePrep || {};

window.TableFlowScenePrep.DOMHelpers = class {
    /**
     * Create an element with specified attributes and styles
     * @param {string} tag - Element tag name
     * @param {Object} options - Configuration options
     * @returns {HTMLElement}
     */
    static createElement(tag, options = {}) {
        const element = document.createElement(tag);
        
        if (options.id) element.id = options.id;
        if (options.className) element.className = options.className;
        if (options.innerHTML) element.innerHTML = options.innerHTML;
        if (options.textContent) element.textContent = options.textContent;
        if (options.styles) Object.assign(element.style, options.styles);
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        if (options.events) {
            Object.entries(options.events).forEach(([event, handler]) => {
                element.addEventListener(event, handler);
            });
        }
        
        return element;
    }
    
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
     * Safely set innerHTML with text content fallback
     * @param {HTMLElement} element - Target element
     * @param {string} content - Content to set
     * @param {boolean} sanitize - Whether to use textContent for safety
     */
    static setContent(element, content, sanitize = false) {
        if (sanitize) {
            element.textContent = content;
        } else {
            element.innerHTML = content;
        }
    }
    
    /**
     * Make an element draggable
     * @param {HTMLElement} element - Element to make draggable
     * @param {Function} onDragEnd - Callback when drag ends
     * @param {Function} onClick - Callback for click without drag
     */
    static makeDraggable(element, onDragEnd = null, onClick = null) {
        let dragging = false;
        let moved = false;
        const originalTransition = element.style.transition;
        
        const handleMouseDown = function(e) {
            dragging = true;
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
            
            document.addEventListener('mousemove', onMouseMove);
            
            element.onmouseup = function() {
                document.removeEventListener('mousemove', onMouseMove);
                element.onmouseup = null;
                dragging = false;
                
                // Restore transitions
                element.style.transition = originalTransition;
                
                if (moved && onDragEnd) {
                    onDragEnd(element);
                } else if (!moved && onClick) {
                    onClick(element);
                }
            };
        };

        const handleDragStart = function() {
            return false;
        };

        element.addEventListener('mousedown', handleMouseDown);
        element.ondragstart = handleDragStart;
        
        return function cleanupDraggable() {
            element.removeEventListener('mousedown', handleMouseDown);
            element.onmouseup = null;
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
