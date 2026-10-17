/**
 * Table Flow - Scene Prep Module for FoundryVTT
 * Main initialization and hook management
 */

// Initialize when ready
Hooks.once('ready', () => {
    setTimeout(() => {
        initializeModule().catch((error) => {
            console.error('Table Flow - Scene Prep | Initialization failed:', error);
        });
    }, 100);
});

async function initializeModule() {
    // Register settings
    window.TableFlowScenePrep.Settings.register();
    
    // Setup socket handler
    window.TableFlowScenePrep.SocketHandler.initialize();
    
    // Initialize UI based on user role
    if (game.user.isGM) {
        // Check if auto-lock is enabled
        const autoLock = window.TableFlowScenePrep.Settings.getAutoLock();
        if (autoLock && !window.TableFlowScenePrep.Settings.isLocked()) {
            await window.TableFlowScenePrep.Settings.setLocked(true);
            window.TableFlowScenePrep.SocketHandler.emitLock(
                window.TableFlowScenePrep.Settings.getLockoutMessage()
            );
        }
        
        // Create floating control button
        window.TableFlowScenePrep.FloatingButton.create();
        
        // Publish the linked lock-screen journal so players can read it
        await window.TableFlowScenePrep.Settings.refreshLockScreenJournalSnapshot();
        
        // Show banner if session is locked
        const isLocked = window.TableFlowScenePrep.Settings.isLocked();
        if (isLocked) {
            window.TableFlowScenePrep.GMBanner.show();
        }
        
        // Start periodic updates for button state and banner
        setInterval(() => {
            if (window.TableFlowScenePrep.FloatingButton.button) {
                window.TableFlowScenePrep.FloatingButton.updateState();
            }
            // Update banner player count if banner is visible
            if (document.getElementById(window.TableFlowScenePrep.GMBanner.BANNER_ID)) {
                window.TableFlowScenePrep.GMBanner.updateCount();
            }
        }, 5000);
    } else {
        const isLocked = window.TableFlowScenePrep.Settings.isLocked();
        
        // Show overlay if session is locked
        if (isLocked) {
            const message = window.TableFlowScenePrep.Settings.getLockoutMessage();
            window.TableFlowScenePrep.PlayerOverlay.show(message);
        }
    }
}

// Hook into canvas ready for additional UI updates
Hooks.on('canvasReady', () => {
    if (game.user.isGM && window.TableFlowScenePrep?.FloatingButton?.button) {
        window.TableFlowScenePrep.FloatingButton.updateState();
    }
    if (game.user.isGM && document.getElementById(window.TableFlowScenePrep?.GMBanner?.BANNER_ID)) {
        window.TableFlowScenePrep.GMBanner.updateCount();
    }
});

// Monitor user connections for player count updates
Hooks.on('userConnected', () => {
    if (game.user.isGM && window.TableFlowScenePrep?.FloatingButton?.button) {
        window.TableFlowScenePrep.FloatingButton.updateState();
    }
    if (game.user.isGM && document.getElementById(window.TableFlowScenePrep?.GMBanner?.BANNER_ID)) {
        window.TableFlowScenePrep.GMBanner.updateCount();
    }
});

Hooks.on('userConnected', (user) => {
    if (!game.user.isGM) {
        return;
    }

    if (!window.TableFlowScenePrep?.Settings?.isLocked()) {
        return;
    }

    // Re-send lock state to newly connected users to prevent missed lock overlays.
    setTimeout(() => {
        if (!window.TableFlowScenePrep?.SocketHandler) {
            return;
        }

        window.TableFlowScenePrep.SocketHandler.emitLock(
            window.TableFlowScenePrep.Settings.getLockoutMessage(),
            user?.id ?? null
        );
    }, 800);
});

Hooks.on('userDisconnected', () => {
    if (game.user.isGM && window.TableFlowScenePrep?.FloatingButton?.button) {
        window.TableFlowScenePrep.FloatingButton.updateState();
    }
    if (game.user.isGM && document.getElementById(window.TableFlowScenePrep?.GMBanner?.BANNER_ID)) {
        window.TableFlowScenePrep.GMBanner.updateCount();
    }
});

// Keep the published lock-screen journal in sync when the GM edits the linked page
const refreshJournalSnapshot = foundry.utils.debounce(() => {
    window.TableFlowScenePrep?.Settings?.refreshLockScreenJournalSnapshot();
}, 800);

Hooks.on('updateJournalEntryPage', (page) => {
    if (!game.user.isGM || !window.TableFlowScenePrep?.Settings) return;
    if (page.id === window.TableFlowScenePrep.Settings.getLockScreenJournalPageId()) {
        refreshJournalSnapshot();
    }
});

Hooks.on('updateJournalEntry', (entry) => {
    if (!game.user.isGM || !window.TableFlowScenePrep?.Settings) return;
    if (entry.id === window.TableFlowScenePrep.Settings.getLockScreenJournalId()) {
        refreshJournalSnapshot();
    }
});
