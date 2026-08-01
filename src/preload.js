"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("tokenMeter", {
  onUsageUpdate(callback) {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on("usage:update", handler);
    return () => ipcRenderer.removeListener("usage:update", handler);
  },
  refresh() {
    return ipcRenderer.invoke("usage:refresh");
  },
  dragBy(dx, dy) {
    ipcRenderer.send("window:drag", { dx, dy });
  },
});
