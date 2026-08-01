# Token Usage Meter

Always-on-top analog needle overlay for your Cursor plan usage.

- Reads the signed-in account from Cursor’s local `state.vscdb` (no manual token paste)
- Polls `https://cursor.com/api/usage-summary`
- Frameless, always-on-top gauge you can drag; double-click to refresh
- Optional watcher that auto-launches the meter whenever Cursor is open

## Setup

```bash
npm install
npm test
npm start
```

### Auto-launch when Cursor opens

```bash
npm run install-autolaunch
```

This installs a macOS LaunchAgent (or Linux autostart entry) that runs `scripts/watch-cursor.js`. The watcher starts the overlay when the Cursor process is running.

```bash
npm run uninstall-autolaunch
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
