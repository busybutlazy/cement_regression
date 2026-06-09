// Preload scripts run in Electron's sandboxed CJS context — must use require(), not import.
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
})
