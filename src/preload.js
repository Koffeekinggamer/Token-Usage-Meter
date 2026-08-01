"use strict";

const { contextBridge, ipcRenderer } = require("electron");
const { stepNeedle } = require("./lib/gauge");

contextBridge.exposeInMainWorld("tokenMeter", {
  onFaceUpdate(callback) {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("meter:face", handler);
    return () => ipcRenderer.removeListener("meter:face", handler);
  },
  /** @deprecated prefer onFaceUpdate */
  onUsageUpdate(callback) {
    return this.onFaceUpdate(callback);
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
});
