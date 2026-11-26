# Table Flow - Scene Prep

A Foundry VTT module that locks the session behind a waiting screen while you work. One click lets everyone in.

## What it does

### Locking the session

- **Lock / Unlock.** While it's locked, players who aren't the GM sit behind a full-screen lock screen. They can't click through it.
- **It stays in sync.** The lock state is saved in the world, so every client sees the same thing. It updates right away.
- **Late joiners get locked too.** If a player connects while the session is locked, they get the lock screen.
- **Re-send the lock screen.** If someone's screen didn't load, send it again from the control panel.
- **Auto-lock.** You can set it to lock on its own when the world starts.

### GM tools

- **Floating button.** Red when locked, green when open. Drag it where you want it, or pin it to a corner. It sits below the Intermission and Patch Notes buttons when those are there.
- **Control panel.** Shows the lock status, who's connected, and the lock and unlock buttons.
- **Lock indicator.** A red bar at the top while the session is locked. Click it to unlock. You can move it up or down. The browser tab shows a lock too.
- **Settings.** Open them from the gear in the panel. The Lock Screen tab is for the message, journal, and tips. The General tab is for the lock indicator and session settings.

### The waiting screen

- Your own lockout message, with a padlock icon.
- A choice of solid dark or the included dice-and-map background.
- Player cards showing who's connected and waiting.
- A journal page, if you set one.
- Tips and trivia that rotate every 10 seconds.
- It goes away on its own when you unlock.

### Journal on the lock screen

- Pick a world journal page by searching for it or dragging it in. It shows up right away.
- What players see is a copy with the secrets taken out, so they can read it without journal permission.
- The copy updates when you edit the journal, pick a different page, or when the GM loads the world.
- Compendium journals don't work here. It has to be a world journal.

### Tips & Trivia

- One tip per line, edited in GM Settings.
- Paste in a list and it splits into separate tips on its own.
- You can rename the box. It starts as "Tips & Trivia".
- Players see them shuffled, one at a time, every 10 seconds.

## Installation

1. In Foundry, open **Add-on Modules** and click **Install Module**.
2. Paste this into the **Manifest URL** field and click **Install**:

   ```
   https://github.com/AvalloSolomov/Table-Flow-Scene-Prep/releases/latest/download/module.json
   ```

3. Enable **Table Flow - Scene Prep** in your world's module settings.

## Usage

### 60-second quick start

1. Open the floating button.
2. Open **Settings** (the gear) and set your lockout message on the **Lock Screen** tab.
3. Click **Lock Session**.
4. Check the player count in the panel or the lock indicator.
5. If a player says they don't see the lock screen, click **Resync Lock Screens**.
6. Click **Unlock Session** when you're ready.

### For GMs

- **Floating button.** Green means the session is open. Red means it's locked. Drag it or pin it to a corner.
- **Control panel.** Lock, unlock, re-send lock screens, and see who's connected. The gear opens Settings in its own window.
- **While it's locked.** The lock indicator shows, the browser tab shows a lock, and notifications say how many players were affected.
- **If something goes wrong.** Use **Resync Lock Screens** if a player reconnects and misses the lock screen. The lock state is saved in the world, so it survives a reload.

### For players

When the game is locked:

- You get a full-screen lock screen with the lockout message, who's connected, and the journal and tips if the GM set them.
- You can't click through to the game.
- The screen clears on its own when the GM unlocks.

## Settings

Everything is in the Settings window. Open it from the gear in the GM panel.

### Lock Screen tab

- **Lockout Message.** What players see while they're waiting.
- **Built-in Background.** Choose Solid Dark or Dice and Map, then save settings.
  Custom images and videos require Scene Prep Premium; an active Premium
  background overrides this choice until it is removed.
- **Lock Screen Journal.** Search for a world journal page, or drag one in.
- **Lock Screen Tips.** One tip per line, plus the box title.

### General tab

- **Show Lock Indicator.** Turn the lock indicator on or off.
- **Indicator Style.** Bar (click to unlock), Compact pill, Screen frame, or Bar and frame.
- **Bar Top Position (px).** How far down the bar sits, 0–300.
- **Auto-Lock on Startup.** Lock the session when the world loads.
- **Button Anchor Position.** Free (Draggable), Top Right, Top Left, Bottom Right, or Bottom Left.

## Technical details

- Updates go out over Foundry's built-in socket system.
- The GM can re-send the lock screen to specific players.
- The lock state is saved in a world setting, so it sticks between sessions.
- If a client misses an update, it catches up from the world setting.
- It watches for players connecting and for the game being ready.

## Troubleshooting

- **A player doesn't see the lock screen.** Make sure the session is locked, then click **Resync Lock Screens** and ask them to refresh once. Check they're in the connected players list. If that doesn't do it, unlock and lock again.
- **The lock screen shows no journal.** Pick a world journal page in **Settings → Lock Screen**. Compendium journals don't work. The GM has to be online, since the GM's client is what publishes the journal players read.
- **The button is missing or in the wrong place.** Reload Foundry, check the module is enabled, and set **Button Anchor Position** to a corner in **Settings → General**. Another module might be covering it.
- **Lock and unlock feel inconsistent.** Have only one GM run the lock. Click **Resync Lock Screens** while locked. Hard refresh (Ctrl+F5) so every client is on the same version.
- **Styling looks wrong.** Hard refresh (Ctrl+F5).

If that doesn't fix it, open the browser console (F12), look for errors mentioning "Table Flow - Scene Prep", and include them in a [support issue](https://github.com/AvalloSolomov/Table-Flow-Scene-Prep/issues).

## Compatibility

- Minimum Foundry VTT version: 12
- Verified version: 14.365
- Works with any game system.

## License

Copyright (c) 2026 Tableflow. All rights reserved.

You may install and use this module unmodified, including in commercial games. Modification and redistribution are not permitted without written permission. See [LICENSE](LICENSE) for the full terms.

Interface icons are from [Lucide](https://lucide.dev) and are used under the ISC license. The license text is in [icons/LICENSE](icons/LICENSE).

## Support

For bug reports or feature requests, open an issue at https://github.com/AvalloSolomov/Table-Flow-Scene-Prep/issues.

## Changelog

### Version 2.1.2

- Fixed the release package missing the `icons` folder, which left the interface icons blank

### Version 2.1.1

- Initial public release
