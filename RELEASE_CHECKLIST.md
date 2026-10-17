# Table Flow - Scene Prep Release Checklist

Use this checklist before publishing a free-version update.

## 1. Version and Metadata

- [ ] Bump `version` in `module.json`.
- [ ] Update changelog section in `README.md`.
- [ ] Confirm `compatibility.minimum` and `compatibility.verified` are correct.
- [ ] Ensure the repo URL is correct; the release workflow fills `url`, `manifest`, and `download` from the release tag.
- [ ] Tag the release as `vX.Y.Z` and publish it so the workflow uploads `module.json` and `module.zip`.

## 2. GM Smoke Tests

- [ ] Launch world as GM and verify floating button appears.
- [ ] Open GM interface and verify all tabs render.
- [ ] Lock session and verify:
  - [ ] Red banner appears.
  - [ ] Button switches to locked/waiting state.
  - [ ] Notification shows targeted online player count.
- [ ] Unlock session and verify:
  - [ ] Banner disappears.
  - [ ] Overlay is removed on players.
  - [ ] Notification shows released online player count.

## 3. Player Sync Smoke Tests

Run with at least 2 non-GM clients.

- [ ] Player A connected before lock receives overlay.
- [ ] Player B joins after lock and receives overlay.
- [ ] Player refresh during lock and receives overlay after reconnect.
- [ ] GM clicks **Resync Lock Screens** and both players re-confirm overlay.
- [ ] Unlock removes overlay for all connected players.

## 4. Regression Checks

- [ ] No duplicate overlay elements after repeated lock/unlock cycles.
- [ ] No stuck overlay after unlock.
- [ ] Custom lock message updates and displays correctly.
- [ ] Banner top position setting persists and applies.
- [ ] Button anchor setting persists and applies.
- [ ] Auto-lock on startup works when enabled.
- [ ] Lock-screen journal shows for a player without permission on that journal.
- [ ] Tips rotate and the title edit applies.
- [ ] Floating button docks below Intermission / Patch Notes buttons when present.

## 5. Console and Error Review

- [ ] No unhandled errors in browser console during lock/unlock/resync flow.
- [ ] Lock/unlock/resync flow runs without console noise.
- [ ] Settings changes do not produce warnings/errors.

## 6. Documentation and Support

- [ ] README quick start matches current UI labels.
- [ ] TROUBLESHOOTING includes lock-screen recovery path.
- [ ] New user-visible behavior is documented in changelog.

## 7. Release Go/No-Go

Ship only if all are true:

- [ ] All sections above complete.
- [ ] No blocker bugs affecting lock/unlock reliability.
- [ ] Reconnect and late-join scenarios pass.

If any item fails, fix and rerun this checklist before release.
