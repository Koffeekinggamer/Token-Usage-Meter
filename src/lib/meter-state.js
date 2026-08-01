"use strict";

const { buildGaugeModel } = require("./gauge");

/**
 * @typedef {import('./reading').Reading} Reading
 * @typedef {import('./reading').Fault} Fault
 * @typedef {{
 *   reading: Reading|null,
 *   fault: Fault|null,
 *   showingLastGood: boolean,
 * }} MeterState
 */

/**
 * @returns {MeterState}
 */
function emptyMeterState() {
  return { reading: null, fault: null, showingLastGood: false };
}

/**
 * Reduce a Reading producer event into Meter display state.
 * Keeps last-good reading on fault; never zeros the needle for a transient miss.
 * @param {MeterState|null|undefined} previous
 * @param {{ ok: true, reading: Reading } | { ok: false, fault: Fault }} event
 * @returns {MeterState}
 */
function reduceMeterState(previous, event) {
  const prev = previous || emptyMeterState();

  if (event.ok) {
    return {
      reading: event.reading,
      fault: null,
      showingLastGood: false,
    };
  }

  if (prev.reading) {
    return {
      reading: prev.reading,
      fault: event.fault,
      showingLastGood: true,
    };
  }

  return {
    reading: null,
    fault: event.fault,
    showingLastGood: false,
  };
}

/**
 * @param {Fault|null} fault
 */
function faultSubtitle(fault) {
  if (!fault) return "Unavailable";
  switch (fault.kind) {
    case "missing-db":
      return "No Cursor DB";
    case "unsigned-in":
      return "Sign in";
    case "http":
      return "API error";
    case "parse":
      return "Bad data";
    default:
      return "Fault";
  }
}

/**
 * Build the face view the Meter renderer paints.
 * @param {MeterState} state
 * @param {{ angle: number, velocity: number }} [needle]
 */
function buildFaceView(state, needle = { angle: -120, velocity: 0 }) {
  if (!state.reading) {
    return {
      targetAngle: -120,
      color: "#c23b22",
      label: "!",
      subtitle: faultSubtitle(state.fault),
      account: "",
      showingLastGood: false,
      hasFault: true,
      percent: 0,
    };
  }

  const model = buildGaugeModel(state.reading, needle);
  const subtitle = state.showingLastGood
    ? `${model.subtitle} · held`
    : model.subtitle;

  return {
    ...model,
    subtitle,
    showingLastGood: state.showingLastGood,
    hasFault: Boolean(state.fault),
  };
}

module.exports = {
  emptyMeterState,
  reduceMeterState,
  faultSubtitle,
  buildFaceView,
};
