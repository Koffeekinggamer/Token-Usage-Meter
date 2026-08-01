"use strict";

const canvas = document.getElementById("gauge");
const ctx = canvas.getContext("2d");
const labelEl = document.getElementById("label");
const subtitleEl = document.getElementById("subtitle");

let needle = { angle: -120, velocity: 0 };
let targetAngle = -120;
let accent = "#2f6f4e";
let lastTs = performance.now();
let hasFault = false;

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
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.strokeStyle = "rgba(68, 64, 60, 0.18)";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.stroke();

  const needleRad = (needle.angle * Math.PI) / 180 - Math.PI / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, needleRad);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 10;
  ctx.stroke();

  for (let p = 0; p <= 100; p += 10) {
    const a = ((-120 + (240 * p) / 100) * Math.PI) / 180 - Math.PI / 2;
    const major = p % 50 === 0;
    const inner = r - (major ? 14 : 8);
    const outer = r + 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.strokeStyle = major ? "rgba(28, 25, 23, 0.55)" : "rgba(28, 25, 23, 0.28)";
    ctx.lineWidth = major ? 2 : 1;
    ctx.stroke();
  }

  const tipR = r - 6;
  const backR = 14;
  const tipX = cx + Math.cos(needleRad) * tipR;
  const tipY = cy + Math.sin(needleRad) * tipR;
  const left = needleRad + Math.PI / 2;
  const right = needleRad - Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(cx + Math.cos(left) * 4, cy + Math.sin(left) * 4);
  ctx.lineTo(
    cx + Math.cos(needleRad + Math.PI) * backR,
    cy + Math.sin(needleRad + Math.PI) * backR
  );
  ctx.lineTo(cx + Math.cos(right) * 4, cy + Math.sin(right) * 4);
  ctx.closePath();
  ctx.fillStyle = "#1c1917";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
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
  if (window.tokenMeter?.stepNeedle) {
    needle = window.tokenMeter.stepNeedle(needle, targetAngle, dt);
  } else {
    const stiffness = 48;
    const damping = 10;
    const displacement = targetAngle - needle.angle;
    const acceleration = stiffness * displacement - damping * needle.velocity;
    needle = {
      velocity: needle.velocity + acceleration * dt,
      angle: needle.angle + (needle.velocity + acceleration * dt) * dt,
    };
  }
  drawFace();
  requestAnimationFrame(frame);
}

function applyFace(payload) {
  if (!payload) return;
  labelEl.textContent = payload.label ?? "—";
  subtitleEl.textContent = payload.subtitle ?? "Cursor";
  accent = payload.color ?? "#2f6f4e";
  targetAngle = Number.isFinite(payload.targetAngle) ? payload.targetAngle : -120;
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
