"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  emptyMeterState,
  reduceMeterState,
  buildFaceView,
} = require("../src/lib/meter-state");

const reading = {
  percent: 42,
  used: 42,
  limit: 100,
  remaining: 58,
  autoPercentUsed: null,
  apiPercentUsed: null,
  onDemandUsed: null,
  membershipType: "pro",
  isUnlimited: false,
  billingCycleStart: null,
  billingCycleEnd: null,
  displayMessage: null,
  email: "a@b.c",
};

describe("reduceMeterState", () => {
  it("stores a successful Reading", () => {
    const next = reduceMeterState(emptyMeterState(), {
      ok: true,
      reading,
    });
    assert.equal(next.reading.percent, 42);
    assert.equal(next.fault, null);
    assert.equal(next.showingLastGood, false);
  });

  it("keeps last-good reading on fault", () => {
    const good = reduceMeterState(emptyMeterState(), { ok: true, reading });
    const held = reduceMeterState(good, {
      ok: false,
      fault: { kind: "http", message: "usage-summary failed (500)" },
    });
    assert.equal(held.reading.percent, 42);
    assert.equal(held.showingLastGood, true);
    assert.equal(held.fault.kind, "http");
  });

  it("shows fault with no reading when nothing is held", () => {
    const next = reduceMeterState(emptyMeterState(), {
      ok: false,
      fault: { kind: "unsigned-in", message: "sign in" },
    });
    assert.equal(next.reading, null);
    assert.equal(next.showingLastGood, false);
    assert.equal(next.fault.kind, "unsigned-in");
  });

  it("does not snap percent to zero on transient fault", () => {
    const good = reduceMeterState(emptyMeterState(), { ok: true, reading });
    const held = reduceMeterState(good, {
      ok: false,
      fault: { kind: "http", message: "boom" },
    });
    const face = buildFaceView(held);
    assert.equal(face.label, "42%");
    assert.match(face.subtitle, /held/);
    assert.equal(face.hasFault, true);
    assert.notEqual(face.targetAngle, -120);
  });
});

describe("buildFaceView", () => {
  it("uses shared percentToNeedleAngle for 100%", () => {
    const face = buildFaceView({
      reading: { ...reading, percent: 100 },
      fault: null,
      showingLastGood: false,
    });
    assert.equal(face.targetAngle, 120);
    assert.equal(face.label, "100%");
  });

  it("renders cold fault without a reading", () => {
    const face = buildFaceView({
      reading: null,
      fault: { kind: "unsigned-in", message: "x" },
      showingLastGood: false,
    });
    assert.equal(face.label, "!");
    assert.equal(face.subtitle, "Sign in");
    assert.equal(face.targetAngle, -120);
  });
});
