# Token Usage Meter

Always-on-top analog needle overlay for your Cursor plan usage.

**Repo:** https://github.com/Koffeekinggamer/Token-Usage-Meter

- Reads the signed-in account from Cursor’s local `state.vscdb` (no manual token paste)
- Polls `https://cursor.com/api/usage-summary`
- Dual needles: **blue = Cursor/Auto models**, **dark = other/API models**
- Frameless, always-on-top gauge you can drag; double-click to refresh
- Optional Watcher auto-launches the Meter whenever Cursor is open

## Requirements

- Node.js 18+
- Cursor installed and signed in
- macOS recommended for auto-launch (Linux autostart supported; Windows: run the Watcher manually)

## Install (other machines / other users)

```bash
git clone https://github.com/Koffeekinggamer/Token-Usage-Meter.git
cd Token-Usage-Meter
npm install
npm test
npm start
```

### Auto-launch when Cursor opens

```bash
npm run install-autolaunch
```

This installs a macOS LaunchAgent (or Linux autostart entry) that runs `scripts/watch-cursor.js`. The Watcher detects Cursor via System Events, starts the real Electron binary (not the npm shim), and the Meter writes `.meter.pid` so it won’t double-launch.

```bash
npm run uninstall-autolaunch
```

On Windows, keep the Watcher running in a terminal:

```bash
npm run watch-cursor
```

## How auth works

| OS | `state.vscdb` |
|---|---|
| macOS | `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb` |
| Windows | `%APPDATA%\Cursor\User\globalStorage\state.vscdb` |
| Linux | `~/.config/Cursor/User/globalStorage/state.vscdb` |

Override with `CURSOR_STATE_DB=/path/to/state.vscdb` if needed.

The app copies the DB to a temp file (avoids WAL locks), reads `cursorAuth/accessToken`, builds the `WorkosCursorSessionToken` cookie from the JWT `sub`, and calls Cursor’s usage API. The token is never written to disk by this app.

## Controls

- Drag the dial to reposition
- Double-click to force a refresh
- Poll interval: `TUM_POLL_MS` (default `60000`)

## Reliability

- **Reading** production lives in `src/lib/reading.js` (signed-in account → plan usage)
- **Last-good reading** + **fault state** are reduced in `src/lib/meter-state.js` — a failed refresh keeps the previous needle position and marks a fault
- Needle physics are shared via `src/lib/gauge.js` (preload → renderer)
- Watcher policy (`ensureMeterRunning`) is in `src/lib/watcher.js` so it can’t double-launch

## Domain glossary

See [`CONTEXT.md`](./CONTEXT.md) for Meter / Reading / Fault vocabulary used by agents and contributors.
