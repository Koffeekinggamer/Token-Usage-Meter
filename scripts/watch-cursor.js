"use strict";

/**
 * Keep the Token Usage Meter running whenever Cursor is open.
 * Intended for LaunchAgents / scheduled runners.
 */

const { spawn, execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const INTERVAL_MS = Number(process.env.TUM_WATCH_MS) || 5000;
const electronBin = path.join(ROOT, "node_modules", ".bin", "electron");
const pidFile = path.join(ROOT, ".meter.pid");

function isCursorRunning() {
  try {
    if (process.platform === "darwin") {
      execFileSync("pgrep", ["-x", "Cursor"], { stdio: "ignore" });
      return true;
    }
    if (process.platform === "win32") {
      const out = execFileSync("tasklist", ["/FI", "IMAGENAME eq Cursor.exe"], {
        encoding: "utf8",
      });
      return /Cursor\.exe/i.test(out);
    }
    execFileSync("pgrep", ["-f", "cursor"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function meterPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readMeterPid() {
  try {
    const raw = fs.readFileSync(pidFile, "utf8").trim();
    const pid = Number(raw);
    return Number.isFinite(pid) ? pid : null;
  } catch {
    return null;
  }
}

function startMeter() {
  if (!fs.existsSync(electronBin)) {
    console.error("electron not installed — run npm install in", ROOT);
    return;
  }
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(electronBin, ["."], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
    env,
  });
  child.unref();
  fs.writeFileSync(pidFile, String(child.pid));
  console.log(`started Token Usage Meter pid=${child.pid}`);
}

function tick() {
  const cursorUp = isCursorRunning();
  const pid = readMeterPid();
  const meterUp = pid != null && meterPidAlive(pid);

  if (cursorUp && !meterUp) {
    startMeter();
  }
}

console.log("watching for Cursor…");
tick();
setInterval(tick, INTERVAL_MS);
