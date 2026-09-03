const { contextBridge, ipcRenderer } = require('electron');

/**
 * Safe context bridge exposing native desktop capabilities to the React web app.
 */
contextBridge.exposeInMainWorld('desktopAPI', {
  isDesktop: true,
  platform: process.platform,

  // Window Controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Shell & Filesystem Utilities
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  openPath: (fullPath) => ipcRenderer.invoke('shell:openPath', fullPath),
  showItemInFolder: (fullPath) => ipcRenderer.invoke('shell:showItemInFolder', fullPath),

  // App Metadata
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),

  // Listeners
  onWindowStateChange: (callback) => {
    const subscription = (_event, state) => callback(state);
    ipcRenderer.on('window:stateChange', subscription);
    return () => ipcRenderer.removeListener('window:stateChange', subscription);
  }
});
