"use strict";

const { percentToNeedleAngle } = require("./usage");

/** Blue needle — Cursor / Auto models (`autoPercentUsed`). */
const CURSOR_NEEDLE_COLOR = "#2563eb";

/** Dark needle body for other / API models. */
const OTHER_NEEDLE_COLOR = "#1c1917";

/**
 * Spring-damper step toward a target needle angle.
 * @param {{ angle: number, velocity: number }} state
 * @param {number} targetAngle
 * @param {number} dtSeconds
 * @param {{ stiffness?: number, damping?: number }} [opts]
 */
function stepNeedle(state, targetAngle, dtSeconds, opts = {}) {
  const stiffness = opts.stiffness ?? 48;
  const damping = opts.damping ?? 10;
  const dt = Math.max(0, Math.min(dtSeconds, 0.05));
  const displacement = targetAngle - state.angle;
  const acceleration = stiffness * displacement - damping * state.velocity;
  const velocity = state.velocity + acceleration * dt;
  const angle = state.angle + velocity * dt;
  return { angle, velocity };
}

/**
 * Color for a usage percent band (used on the other-models arc).
 * @param {number} percent
 */
function colorForPercent(percent) {
  if (percent >= 95) return "#c23b22";
  if (percent >= 80) return "#d97706";
  if (percent >= 50) return "#ca8a04";
  return "#2f6f4e";
}

/**
 * Resolve Cursor-models % (Auto) and other-models % (API/named).
 * @param {{
 *   percent?: number,
 *   autoPercentUsed?: number|null,
 *   apiPercentUsed?: number|null,
 *   isUnlimited?: boolean,
 * }} usage
 */
function dualPercents(usage) {
  if (usage.isUnlimited) {
    return { cursorPercent: 0, otherPercent: 0 };
  }
  const cursorPercent = Number.isFinite(Number(usage.autoPercentUsed))
    ? Number(usage.autoPercentUsed)
    : Number(usage.percent) || 0;
  const otherPercent = Number.isFinite(Number(usage.apiPercentUsed))
    ? Number(usage.apiPercentUsed)
    : 0;
  return {
    cursorPercent: Math.max(0, Math.min(cursorPercent, 150)),
    otherPercent: Math.max(0, Math.min(otherPercent, 150)),
  };
}

/**
 * Build render model for the dual-needle overlay face.
 * @param {{
 *   percent?: number,
 *   autoPercentUsed?: number|null,
 *   apiPercentUsed?: number|null,
 *   email?: string|null,
 *   membershipType?: string|null,
 *   isUnlimited?: boolean,
 * }} usage
 * @param {{
 *   cursor?: { angle: number, velocity: number },
 *   other?: { angle: number, velocity: number },
 * }} [needles]
 */
function buildGaugeModel(usage, needles = {}) {
  const cursorNeedle = needles.cursor || { angle: -120, velocity: 0 };
  const otherNeedle = needles.other || { angle: -120, velocity: 0 };
  const { cursorPercent, otherPercent } = dualPercents(usage);

  if (usage.isUnlimited) {
    return {
      percent: 0,
      cursorPercent: 0,
      otherPercent: 0,
      cursorTargetAngle: -120,
      otherTargetAngle: -120,
      targetAngle: -120,
      needleAngle: cursorNeedle.angle,
      needleVelocity: cursorNeedle.velocity,
      cursorColor: CURSOR_NEEDLE_COLOR,
      otherColor: OTHER_NEEDLE_COLOR,
      color: CURSOR_NEEDLE_COLOR,
      otherArcColor: "#2f6f4e",
      label: "∞",
      subtitle: "Unlimited",
      account: usage.email || "",
    };
  }

  return {
    percent: Number(usage.percent) || 0,
    cursorPercent,
    otherPercent,
    cursorTargetAngle: percentToNeedleAngle(cursorPercent),
    otherTargetAngle: percentToNeedleAngle(otherPercent),
    targetAngle: percentToNeedleAngle(cursorPercent),
    needleAngle: cursorNeedle.angle,
    needleVelocity: cursorNeedle.velocity,
    otherNeedleAngle: otherNeedle.angle,
    otherNeedleVelocity: otherNeedle.velocity,
    cursorColor: CURSOR_NEEDLE_COLOR,
    otherColor: OTHER_NEEDLE_COLOR,
    color: CURSOR_NEEDLE_COLOR,
    otherArcColor: colorForPercent(otherPercent),
    label: `${Math.round(cursorPercent)} · ${Math.round(otherPercent)}`,
    subtitle: usage.membershipType || "cursor · other",
    account: usage.email || "",
  };
}

module.exports = {
  stepNeedle,
  colorForPercent,
  dualPercents,
  buildGaugeModel,
  percentToNeedleAngle,
  CURSOR_NEEDLE_COLOR,
  OTHER_NEEDLE_COLOR,
};
