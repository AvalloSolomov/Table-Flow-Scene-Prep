# Troubleshooting Guide

## Button Not Appearing

### 1. Reload FoundryVTT

- Close the browser tab, reopen FoundryVTT, and log in as GM.
- The button appears in the top-right corner by default.

### 2. Clear Browser Cache

- Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac).
- Clear cached images and files, then reload FoundryVTT.

### 3. Check the Console for Errors

- Press `F12` and open the **Console** tab.
- Look for errors mentioning "Table Flow - Scene Prep".

### 4. Check the Module Is Enabled

- Go to Settings → Manage Modules.
- Verify "Table Flow - Scene Prep" is checked, then reload.

### 5. Verify Scripts Loaded

In the browser console, each of these should return a class:

```javascript
window.TableFlowScenePrep.Settings
window.TableFlowScenePrep.SocketHandler
window.TableFlowScenePrep.FloatingButton
window.TableFlowScenePrep.GMInterface
window.TableFlowScenePrep.PlayerOverlay
window.TableFlowScenePrep.DOMHelpers
```

### 6. Create the Button Manually

```javascript
window.TableFlowScenePrep.FloatingButton.create();
```

## Expected Button Behavior

- **Unlocked:** green button.
- **Locked:** red button, showing the number of players waiting.
- The button can be dragged, or anchored to a canvas corner in Settings → General.
- It docks below the Table Flow Intermission and Patch Notes buttons when those are present.

## Common Issues

### Player does not see lock screen

1. Confirm session is currently locked in GM panel.
2. In **Session Control**, click **Resync Lock Screens**.
3. Ask the affected player to refresh once if still unsynced.
4. Verify player is online in the connected players list.
5. Unlock and relock as a final recovery step.

Notes:

- The module now uses both socket events and setting-based sync fallback.
- Reconnecting players should receive a targeted lock resend automatically.

### Lock screen shows no journal

- Pick a **world** journal page in Settings → Lock Screen (compendium journals are not supported).
- The GM client must be online; it publishes the journal snapshot that players read.

### Button appears but is invisible

- Check whether another module is overlaying it.
- Try dragging it from the top-right corner.

### Button appears in wrong position

- Reload the page; if it is still wrong, set **Button Anchor** to a corner in Settings → General.

### Button doesn't respond to clicks

- Check browser console for JavaScript errors
- Verify `gm-interface.js` is loaded
- Try: `window.TableFlowScenePrep.GMInterface.show()`

### Lock/unlock feels inconsistent across clients

- Ensure only one GM is managing lock state at a time
- Use **Resync Lock Screens** while locked to force client reconciliation
- Verify the module is updated on all clients and browser cache is refreshed

### CSS not applied

- Verify `table-flow-scene-prep.css` exists in styles folder
- Check module.json includes the CSS file
- Hard refresh browser (Ctrl+F5)
