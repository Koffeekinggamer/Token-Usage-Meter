"use strict";

const canvas = document.getElementById("gauge");
const ctx = canvas.getContext("2d");
const labelEl = document.getElementById("label");
const subtitleEl = document.getElementById("subtitle");

let cursorNeedle = { angle: -120, velocity: 0 };
let otherNeedle = { angle: -120, velocity: 0 };
let cursorTarget = -120;
let otherTarget = -120;
let cursorColor = "#2563eb";
let otherColor = "#1c1917";
let otherArcColor = "#2f6f4e";
let lastTs = performance.now();
let hasFault = false;

function step(state, target, dt) {
  if (window.tokenMeter?.stepNeedle) {
    return window.tokenMeter.stepNeedle(state, target, dt);
  }
  const stiffness = 48;
  const damping = 10;
  const displacement = target - state.angle;
  const acceleration = stiffness * displacement - damping * state.velocity;
  return {
    velocity: state.velocity + acceleration * dt,
    angle: state.angle + (state.velocity + acceleration * dt) * dt,
  };
}

function drawNeedle(cx, cy, angleDeg, color, tipR, widthScale) {
  const needleRad = (angleDeg * Math.PI) / 180 - Math.PI / 2;
  const backR = 12 * widthScale;
  const half = 3.2 * widthScale;
  const tipX = cx + Math.cos(needleRad) * tipR;
  const tipY = cy + Math.sin(needleRad) * tipR;
  const left = needleRad + Math.PI / 2;
  const right = needleRad - Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(cx + Math.cos(left) * half, cy + Math.sin(left) * half);
  ctx.lineTo(
    cx + Math.cos(needleRad + Math.PI) * backR,
    cy + Math.sin(needleRad + Math.PI) * backR
  );
  ctx.lineTo(cx + Math.cos(right) * half, cy + Math.sin(right) * half);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  return needleRad;
}

function drawArc(cx, cy, r, start, angleDeg, color, width) {
  const needleRad = (angleDeg * Math.PI) / 180 - Math.PI / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, needleRad);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawFace() {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2 + 8;
  const r = 78;

  ctx.clearRect(0, 0, w, h);

  const plate = ctx.createRadialGradient(cx - 16, cy - 20, 8, cx, cy, r + 18);
  plate.addColorStop(0, "rgba(250, 247, 241, 0.96)");
  plate.addColorStop(0.7, "rgba(232, 224, 210, 0.94)");
  plate.addColorStop(1, "rgba(196, 181, 160, 0.9)");
  ctx.beginPath();
  ctx.arc(cx, cy, r + 14, 0, Math.PI * 2);
  ctx.fillStyle = plate;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(68, 64, 60, 0.35)";
  ctx.stroke();

  const start = (-120 * Math.PI) / 180 - Math.PI / 2;
  const end = (120 * Math.PI) / 180 - Math.PI / 2;

  // Outer track — other models
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.strokeStyle = "rgba(68, 64, 60, 0.16)";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.stroke();
  drawArc(cx, cy, r, start, otherNeedle.angle, otherArcColor, 9);

  // Inner track — cursor models (blue)
  ctx.beginPath();
  ctx.arc(cx, cy, r - 14, start, end);
  ctx.strokeStyle = "rgba(37, 99, 235, 0.18)";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.stroke();
  drawArc(cx, cy, r - 14, start, cursorNeedle.angle, cursorColor, 7);

  for (let p = 0; p <= 100; p += 10) {
    const a = ((-120 + (240 * p) / 100) * Math.PI) / 180 - Math.PI / 2;
    const major = p % 50 === 0;
    const inner = r - (major ? 16 : 10);
    const outer = r + 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.strokeStyle = major ? "rgba(28, 25, 23, 0.55)" : "rgba(28, 25, 23, 0.28)";
    ctx.lineWidth = major ? 2 : 1;
    ctx.stroke();
  }

  // Draw other (dark) under, cursor (blue) on top
  drawNeedle(cx, cy, otherNeedle.angle, otherColor, r - 8, 1);
  drawNeedle(cx, cy, cursorNeedle.angle, cursorColor, r - 22, 0.85);

  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fillStyle = cursorColor;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#faf7f1";
  ctx.fill();

  if (hasFault) {
    ctx.beginPath();
    ctx.arc(cx + r * 0.62, cy - r * 0.55, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#c23b22";
    ctx.fill();
  }
}

function frame(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;
  cursorNeedle = step(cursorNeedle, cursorTarget, dt);
  otherNeedle = step(otherNeedle, otherTarget, dt);
  drawFace();
  requestAnimationFrame(frame);
}

function applyFace(payload) {
  if (!payload) return;
  labelEl.textContent = payload.label ?? "—";
  subtitleEl.textContent = payload.subtitle ?? "cursor · other";
  cursorColor = payload.cursorColor ?? payload.color ?? "#2563eb";
  otherColor = payload.otherColor ?? "#1c1917";
  otherArcColor = payload.otherArcColor ?? "#2f6f4e";
  cursorTarget = Number.isFinite(payload.cursorTargetAngle)
    ? payload.cursorTargetAngle
    : Number.isFinite(payload.targetAngle)
      ? payload.targetAngle
      : -120;
  otherTarget = Number.isFinite(payload.otherTargetAngle)
    ? payload.otherTargetAngle
    : -120;
  hasFault = Boolean(payload.hasFault);
}

let dragging = false;
let lastX = 0;
let lastY = 0;

window.addEventListener("pointerdown", (e) => {
  dragging = true;
  lastX = e.screenX;
  lastY = e.screenY;
  e.target.setPointerCapture?.(e.pointerId);
});

window.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const dx = e.screenX - lastX;
  const dy = e.screenY - lastY;
  lastX = e.screenX;
  lastY = e.screenY;
  window.tokenMeter?.dragBy(dx, dy);
});

window.addEventListener("pointerup", () => {
  dragging = false;
});

window.addEventListener("dblclick", () => {
  window.tokenMeter?.refresh();
});

window.tokenMeter?.onFaceUpdate?.(applyFace) ||
  window.tokenMeter?.onUsageUpdate?.(applyFace);
requestAnimationFrame(frame);
