# Table Flow - Scene Prep

A FoundryVTT module that lets the GM lock the session so players wait behind a lock screen until the GM is ready. Part of the Table Flow suite.

## Features

### Session Lock

- **Lock / Unlock** - Non-GM players are held behind a full-screen overlay while locked
- **Reliable Sync** - Lock state lives in a world setting and syncs to every client, with sockets as a fast path
- **Late-Join Handling** - Players who connect while locked get the overlay re-sent
- **Resync Lock Screens** - Re-send the overlay to connected clients on demand
- **Auto-Lock** - Optionally lock when the world starts

### GM Tools

- **Floating Button** - Red when locked, green when unlocked; draggable or anchored to a canvas corner; docks below the Table Flow Intermission and Patch Notes buttons when present
- **Control Panel** - Status card, stat cards, lock/unlock actions, and a live player list
- **Lock Banner** - Red bar with a "N waiting" pill, click to unlock, draggable, adjustable top offset; the browser tab title also shows a lock while the session is locked
- **Settings View** - Opened from the header gear; **Lock Screen** tab (message, journal, tips) and **General** tab (banner, session)

### Player Lock Screen

- Customizable lockout message with a padlock icon
- Connected Players pill and player cards showing ready/waiting status
- Optional journal panel
- Rotating tips and trivia
- Clears automatically on unlock

### Lock-Screen Journal

- Pick a world journal page by search or drag and drop; it applies immediately
- The GM publishes a rendered snapshot (secrets stripped), since players cannot read journals they lack permission on
- The snapshot refreshes when the journal is edited, picked, or the GM is ready
- Compendium journals are not supported; use a world journal

### Tips & Trivia

- One tip per line, edited in the GM Settings
- Pasted lists are split into separate tips automatically
- Editable box title (default "Tips & Trivia")
- Shown to players in shuffled order, rotating every 10 seconds

## Installation

1. Download or clone this module to your FoundryVTT modules directory
2. Enable the module in your world's module settings
3. Configure the module settings as desired

## Usage

### 60-Second Quick Start (GM)

1. Open the floating control button.
2. Set your lockout message in the **Custom Message** tab.
3. Click **Lock Session** in **Session Control**.
4. Verify player count in the panel/banner.
5. If any player reports no lock screen, click **Resync Lock Screens**.
6. Click **Unlock Session** when ready.

### For GMs

1. **Floating Button**: Click it to open the control panel
   - Green: session is open
   - Red: session is locked
   - Draggable or anchorable to canvas corners

2. **Control Panel**:
   - Lock/unlock, resync lock screens, and view connected players
   - Gear icon opens Settings; use **Back to Scene Prep** to return
   - Settings tabs: **Lock Screen** (message, journal, tips) and **General** (banner, session)

3. **Visual Feedback**:
   - Red banner appears when locked (customizable position)
   - Browser tab title shows a lock while locked
   - Notifications include how many online players were targeted

4. **Reliability Recovery**:
   - Use **Resync Lock Screens** if a reconnecting player misses the overlay
   - Lock state also syncs via world settings as a fallback

### For Players

When the game is locked:

- A full-screen lock screen is displayed with the lockout message, connected players, and the optional journal and tips
- Players cannot interact with the game interface
- The screen clears automatically when the GM unlocks the game

## Settings

All settings are accessible via the Settings view (header gear) in the GM interface:

### Lock Screen Tab

- **Lockout Message**: Message shown to players during lockout
- **Journal**: Search or drag a world journal page to show on the lock screen
- **Tips**: One tip per line, plus an editable title

### Banner Settings

- **Show Lock Banner**: Toggle the prominent red banner on/off
- **Banner Top Position**: Adjust distance from top (0-300px) to avoid UI conflicts

### Session Settings

- **Auto-Lock on Startup**: Automatically lock when world loads
- **Button Anchor Position**: Choose between:
  - Free (Draggable anywhere)
  - Top Right (anchored to canvas)
  - Top Left (anchored to canvas)
  - Bottom Right (anchored to canvas)
  - Bottom Left (anchored to canvas)

## Technical Details

- **Socket Communication**: Uses FoundryVTT's built-in socket system for real-time updates
- **Targeted Resync**: GM can re-send lock overlay to specific connected clients
- **World Settings**: Lockout state persists across GM sessions
- **Setting-Based Fallback Sync**: Clients reconcile lock/unlock from world setting changes
- **Hook Integration**: Monitors user connections and game readiness

## Compatibility

- **Minimum FoundryVTT Version**: 12
- **Verified Version**: 14.365
- **System Agnostic**: Works with any game system

## License

Copyright (c) 2026 Tableflow. All rights reserved.

You may install and use this module unmodified, including in commercial games. Modification and redistribution are not permitted without written permission. See [LICENSE](LICENSE) for the full terms.

## Support

For issues or feature requests, please create an issue in the repository or contact the module author.

## Release Process

Before publishing an update, run the checklist in `RELEASE_CHECKLIST.md`.

## Changelog

### Version 2.0.1

- Initial public release
