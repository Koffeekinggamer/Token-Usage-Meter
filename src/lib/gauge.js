"use strict";

const { percentToNeedleAngle } = require("./usage");

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
 * Color for a usage percent band.
 * @param {number} percent
 */
function colorForPercent(percent) {
  if (percent >= 95) return "#c23b22";
  if (percent >= 80) return "#d97706";
  if (percent >= 50) return "#ca8a04";
  return "#2f6f4e";
}

/**
 * Build render model for the overlay face.
 * @param {{ percent: number, email?: string|null, membershipType?: string|null, isUnlimited?: boolean }} usage
 * @param {{ angle: number, velocity: number }} needle
 */
function buildGaugeModel(usage, needle) {
  const percent = usage.isUnlimited ? 0 : Number(usage.percent) || 0;
  const targetAngle = usage.isUnlimited ? -120 : percentToNeedleAngle(percent);
  return {
    percent,
    targetAngle,
    needleAngle: needle.angle,
    needleVelocity: needle.velocity,
    color: usage.isUnlimited ? "#2f6f4e" : colorForPercent(percent),
    label: usage.isUnlimited ? "∞" : `${Math.round(percent)}%`,
    subtitle: usage.membershipType || "Cursor",
    account: usage.email || "",
  };
}

module.exports = {
  stepNeedle,
  colorForPercent,
  buildGaugeModel,
  percentToNeedleAngle,
};
