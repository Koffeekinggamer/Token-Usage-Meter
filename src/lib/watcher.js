"use strict";

/**
 * Pure Watcher policy: when Cursor is up and the Meter is down, start it.
 * Process/OS details sit behind injectable adapters.
 *
 * @param {{
 *   isCursorRunning: () => boolean,
 *   readMeterPid: () => number|null,
 *   isMeterAlive: (pid: number) => boolean,
 *   startMeter: () => void,
 * }} adapters
 * @returns {'started'|'already-running'|'cursor-down'}
 */
function ensureMeterRunning(adapters) {
  if (!adapters.isCursorRunning()) {
    return "cursor-down";
  }

  const pid = adapters.readMeterPid();
  if (pid != null && adapters.isMeterAlive(pid)) {
    return "already-running";
  }

  adapters.startMeter();
  return "started";
}

module.exports = { ensureMeterRunning };
