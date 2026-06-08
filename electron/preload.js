// Preload script runs in a privileged context but is exposed to the renderer
// via contextBridge. Keep it minimal — only expose what the UI actually needs.
import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
})
