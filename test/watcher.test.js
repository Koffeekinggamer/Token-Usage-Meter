"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { ensureMeterRunning } = require("../src/lib/watcher");

describe("ensureMeterRunning", () => {
  it("does nothing when Cursor is down", () => {
    let started = 0;
    const result = ensureMeterRunning({
      isCursorRunning: () => false,
      readMeterPid: () => null,
      isMeterAlive: () => false,
      startMeter: () => {
        started += 1;
      },
    });
    assert.equal(result, "cursor-down");
    assert.equal(started, 0);
  });

  it("starts the Meter when Cursor is up and Meter is down", () => {
    let started = 0;
    const result = ensureMeterRunning({
      isCursorRunning: () => true,
      readMeterPid: () => null,
      isMeterAlive: () => false,
      startMeter: () => {
        started += 1;
      },
    });
    assert.equal(result, "started");
    assert.equal(started, 1);
  });

  it("does not double-launch when Meter pid is alive", () => {
    let started = 0;
    const result = ensureMeterRunning({
      isCursorRunning: () => true,
      readMeterPid: () => 1234,
      isMeterAlive: (pid) => pid === 1234,
      startMeter: () => {
        started += 1;
      },
    });
    assert.equal(result, "already-running");
    assert.equal(started, 0);
  });

  it("restarts when pid file is stale", () => {
    let started = 0;
    const result = ensureMeterRunning({
      isCursorRunning: () => true,
      readMeterPid: () => 999,
      isMeterAlive: () => false,
      startMeter: () => {
        started += 1;
      },
    });
    assert.equal(result, "started");
    assert.equal(started, 1);
  });
});
