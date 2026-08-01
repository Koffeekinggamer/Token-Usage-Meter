"use strict";

/**
 * Keep the Token Usage Meter running whenever Cursor is open.
 * Policy lives in src/lib/watcher.js; this file is the OS adapter.
 */

const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { ensureMeterRunning } = require("../src/lib/watcher");
const {
  defaultPidPath,
  readPidFile,
  isPidAlive,
} = require("../src/lib/pidfile");

const ROOT = path.join(__dirname, "..");
const INTERVAL_MS = Number(process.env.TUM_WATCH_MS) || 5000;
const START_COOLDOWN_MS = Number(process.env.TUM_START_COOLDOWN_MS) || 15_000;
const pidFile = defaultPidPath(ROOT);

/** Real Electron binary (not the node_modules/.bin shim that exits immediately). */
function resolveElectronBinary() {
  // require('electron') returns the binary path when running under Node.
  const fromPackage = require("electron");
  if (typeof fromPackage === "string" && fs.existsSync(fromPackage)) {
    return fromPackage;
  }
  const pathTxt = path.join(ROOT, "node_modules", "electron", "path.txt");
  if (fs.existsSync(pathTxt)) {
    const rel = fs.readFileSync(pathTxt, "utf8").trim();
    const candidate = path.join(ROOT, "node_modules", "electron", "dist", rel);
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error("Electron binary not found — run npm install");
}

function isCursorRunning() {
  // Under App Translocation, `pgrep -x Cursor` often misses the main process.
  // System Events reports the app name reliably.
  try {
    const out = execFileSync(
      "osascript",
      [
        "-e",
        'tell application "System Events" to (name of processes) contains "Cursor"',
      ],
      { encoding: "utf8" }
    ).trim();
    return out === "true";
  } catch {
    try {
      const out = execFileSync("ps", ["-axo", "args="], { encoding: "utf8" });
      return out
        .split("\n")
        .some(
          (line) =>
            line.includes("Cursor.app/Contents/MacOS/Cursor") &&
            !line.includes("Cursor Helper")
        );
    } catch {
      return false;
    }
  }
}

function isMeterRunning() {
  const pid = readPidFile(pidFile);
  if (pid != null && isPidAlive(pid)) return true;

  // Fallback: Electron started for this project (env marker in argv/environ is
  // not always visible; match the project path in the process list).
  try {
    const out = execFileSync("pgrep", ["-fl", "Electron|electron"], {
      encoding: "utf8",
    });
    if (out.includes(ROOT) && /TUM_METER|Token Usage Meter/.test(out)) {
      return true;
    }
  } catch {
    // none
  }
  return false;
}

let lastStartAt = 0;

function startMeter() {
  const now = Date.now();
  if (now - lastStartAt < START_COOLDOWN_MS) {
    return;
  }
  lastStartAt = now;

  const electronBin = resolveElectronBinary();
  const env = { ...process.env, TUM_METER: "1" };
  delete env.ELECTRON_RUN_AS_NODE;

  const child = spawn(electronBin, ["."], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
    env,
  });
  child.unref();
  // Authoritative pid is written by the Meter itself in main.js.
  console.log(`spawned Electron for Token Usage Meter (launcher pid=${child.pid})`);
}

function tick() {
  const result = ensureMeterRunning({
    isCursorRunning,
    isMeterRunning,
    startMeter,
  });
  if (result === "started") {
    console.log("ensureMeterRunning → started");
  }
}

console.log("watching for Cursor…");
tick();
setInterval(tick, INTERVAL_MS);
