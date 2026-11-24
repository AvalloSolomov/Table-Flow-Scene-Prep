# Manual Foundry test checklist

The automated tests (`npm test`) run against a simulated Foundry, so they do not cover real clients, real sockets, or the Foundry versions below. Run this checklist in Foundry before each release and record the version tested.

**Setup:** one GM browser and at least two player browsers (separate profiles or private windows) in the same world. Install the module from the release `module.json` URL, not from a local folder.

Record: Foundry version ____ · game system ____ · module version ____ · date ____

## 1. Install and activation

- [ ] Install from the manifest URL. The install completes with no errors.
- [ ] Enable the module in a world. No errors in the console (F12) for any user.
- [ ] Every icon renders (floating button, panel, settings tabs, header buttons, lock screen). None are blank squares.
- [ ] The Table Flow logo shows in the panel header and the lock screen footer.
- [ ] Update an older install to 2.1.1. The module loads and existing settings are kept.

## 2. GM controls

- [ ] The floating button appears for the GM only.
- [ ] Clicking the button opens the Scene Prep panel. Closing and reopening works.
- [ ] Minimize and close in the panel header both close the panel.
- [ ] The gear opens Settings in its own window. The gear toggles it closed. Its close button works.
- [ ] Both windows can be dragged by the header and stay on screen.
- [ ] Online Players, Total Players and the Connected Players list match who is connected. Names containing `<` or `&` display as plain text.
- [ ] Lock Session is disabled while locked. Unlock Session and Resync Lock Screens are disabled while unlocked.

## 3. Lock and unlock

- [ ] Lock Session: every non-GM client shows the full-screen lock screen within about a second.
- [ ] The GM sees the lock indicator, the browser tab title starts with the lock, and the floating button turns red with a waiting count.
- [ ] Players cannot click through the lock screen to the canvas, sidebar or chat.
- [ ] The notification reports the correct number of online players.
- [ ] Unlock Session: all lock screens clear, the indicator and tab title go back to normal.
- [ ] Clicking the lock indicator bar unlocks. Dragging its handle moves it without unlocking.
- [ ] Rapid lock/unlock/lock does not leave a lock screen on an unlocked world or the reverse.
- [ ] A player cannot unlock or lock the world from the browser console (as a player, while locked, run `game.socket.emit('module.table-flow-scene-prep', { action: 'unlock' })`). The lock screen stays.
- [ ] A player cannot change module settings or open the GM panel (`TableFlowScenePrep.GMInterface.show()` does nothing).

## 4. Connections and reconnections

- [ ] A player who logs in while the world is locked gets the lock screen on load.
- [ ] A player who refreshes while locked gets the lock screen again.
- [ ] A player who disconnects and reconnects while locked gets the lock screen again.
- [ ] A player who disconnects while unlocked and reconnects after a lock gets the lock screen.
- [ ] The Connected Players count and names on the lock screen update when others join or leave.
- [ ] Resync Lock Screens re-sends the screen to a player whose overlay was removed. It warns when unlocked or when nobody is online.
- [ ] The GM refreshes while locked. The indicator and floating button return and the lock holds.
- [ ] Two GMs: locking on one shows the indicator on the other, and unlocking clears both.
- [ ] Reload the whole world while locked. The lock persists.
- [ ] Auto-Lock on Startup: with it on, loading the world locks it once and players see the screen.
- [ ] Switching scenes as GM does not remove the lock screen or indicator.

## 5. Settings

- [ ] Lockout Message: edit, then **Save Message**. The text updates on a live lock screen. An empty message is not saved.
- [ ] A message containing `<b>`, `&` and quotes shows as plain text on the lock screen and in the editor.
- [ ] Show Lock Indicator off: no indicator while locked. On: it returns.
- [ ] Indicator Style: Bar, Compact pill, Screen frame, Bar and frame each display correctly and stay clear of the sidebar.
- [ ] Bar Top Position: values below 0 and above 300 are clamped. Dragging the bar saves its position.
- [ ] Button Anchor Position: Free, and each corner. Free remembers the dragged position after a reload.
- [ ] The button docks below the Table Flow Intermission and Patch Notes buttons when those modules are active, and goes back to its own position when they are disabled.
- [ ] **Save Settings** shows "Settings saved". Reload and confirm every value persisted.
- [ ] Tips: type, press Enter for a new bullet, paste a list with numbers and dashes. Tips split into one per line. An empty list hides the box. The box title saves (40 characters max).
- [ ] No default tips ship. The tips box is hidden until the GM adds tips, and it shows them after saving.
- [ ] Message and tips changes made by the GM appear on a player's live lock screen without a refresh.

## 6. Lock-screen journal

- [ ] Search finds world journal entries and pages. Selecting one shows it on a live lock screen.
- [ ] Drag a journal entry and a journal page onto the picker. Both link.
- [ ] Dropping a compendium journal or an actor is rejected with a warning.
- [ ] Players who cannot view the journal still see its content on the lock screen.
- [ ] GM-secret blocks (`<section class="secret">`) do not appear for players.
- [ ] Editing the linked page updates the lock screen within about a second.
- [ ] Images, tables, lists, headings and content links in the page display correctly. Content links do not break the screen.
- [ ] A page containing `<script>` or an `onerror` attribute does not run anything on the player's screen.
- [ ] An image or video page shows "This page type cannot be displayed here."
- [ ] The remove button clears the journal and removes the box.
- [ ] Long journal content scrolls or fits without covering the footer.

## 7. Cleanup

- [ ] Closing the panel and settings leaves no leftover elements (check the Elements panel for `table-flow-scene-prep-*`).
- [ ] Locking and unlocking 10 times does not slow dragging.
- [ ] Disabling the module and reloading removes all module UI.

## 8. Compatibility

Repeat sections 1 to 6 on each version you claim. Only list a version in `module.json` after it passes.

- [ ] Foundry v12 (minimum): ____
- [ ] Foundry v13: ____
- [ ] Foundry v14.365 (verified): ____
- [ ] One game system with a custom sidebar or UI (confirm the lock screen covers it).
- [ ] With Table Flow Intermission and Patch Notes enabled (button docking).
- [ ] With a popular UI-changing module enabled (z-index and layout).
- [ ] In Chrome and Firefox (icons use CSS masks).

## 9. Release

- [ ] The GitHub release assets contain `module.json` and `module.zip`.
- [ ] `module.json` in the release has version 2.1.1 and the correct `manifest` and `download` URLs.
- [ ] `module.zip` contains `icons/` (including `icons/LICENSE`), `scripts/`, `styles/`, the logo, `README.md` and `LICENSE`. It does not contain `tests/` or `node_modules/`.
- [ ] Installing from `https://github.com/AvalloSolomov/Table-Flow-Scene-Prep/releases/latest/download/module.json` works on a clean Foundry install.
