"use strict";

const { contextBridge, ipcRenderer } = require("electron");
const { stepNeedle } = require("./lib/gauge");
const { drawMeterFace } = require("./lib/paint");
const { faceFrame } = require("./lib/face");

contextBridge.exposeInMainWorld("tokenMeter", {
  onFaceUpdate(callback) {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("meter:face", handler);
    return () => ipcRenderer.removeListener("meter:face", handler);
  },
  refresh() {
    return ipcRenderer.invoke("usage:refresh");
  },
  dragBy(dx, dy) {
    ipcRenderer.send("window:drag", { dx, dy });
  },
  stepNeedle(state, targetAngle, dtSeconds) {
    return stepNeedle(state, targetAngle, dtSeconds);
  },
  drawMeterFace(ctx, frame, size) {
    return drawMeterFace(ctx, frame, size);
  },
  faceFrame(face, angles) {
    return faceFrame(face, angles);
  },
});
