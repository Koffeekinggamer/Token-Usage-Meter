"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { ensureMeterRunning } = require("../src/lib/watcher");

describe("ensureMeterRunning", () => {
  it("does nothing when Cursor is down", () => {
    let started = 0;
    const result = ensureMeterRunning({
      isCursorRunning: () => false,
      isMeterRunning: () => false,
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
      isMeterRunning: () => false,
      startMeter: () => {
        started += 1;
      },
    });
    assert.equal(result, "started");
    assert.equal(started, 1);
  });

  it("does not double-launch when Meter is already running", () => {
    let started = 0;
    const result = ensureMeterRunning({
      isCursorRunning: () => true,
      isMeterRunning: () => true,
      startMeter: () => {
        started += 1;
      },
    });
    assert.equal(result, "already-running");
    assert.equal(started, 0);
  });
});
