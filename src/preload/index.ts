import { contextBridge, ipcRenderer } from 'electron'

export interface DesktopSourceInfo {
  id: string
  name: string
}

contextBridge.exposeInMainWorld('electronAPI', {
  // Layout persistence
  getLayout: () => ipcRenderer.invoke('get:layout'),
  saveLayout: (layout: unknown) => ipcRenderer.invoke('save:layout', layout),
  getLayouts: () => ipcRenderer.invoke('get:layouts'),
  deleteLayout: (id: string) => ipcRenderer.invoke('delete:layout', id),

  // Theme persistence
  getTheme: () => ipcRenderer.invoke('get:theme'),
  saveTheme: (theme: unknown) => ipcRenderer.invoke('save:theme', theme),
  getThemes: () => ipcRenderer.invoke('get:themes'),
  deleteTheme: (id: string) => ipcRenderer.invoke('delete:theme', id),

  // File dialogs for import/export
  showSaveDialog: (options: unknown) => ipcRenderer.invoke('dialog:save', options),
  showOpenDialog: (options: unknown) => ipcRenderer.invoke('dialog:open', options),
  readFile: (path: string) => ipcRenderer.invoke('file:read', path),
  writeFile: (path: string, data: string) => ipcRenderer.invoke('file:write', path, data),

  // Desktop capturer - get source IDs only (serializable)
  getDesktopSourceIds: () => ipcRenderer.invoke('get:desktop-source-ids') as Promise<DesktopSourceInfo[]>,

  // Window controls
  setWindowSize: (width: number, height: number) =>
    ipcRenderer.invoke('window:set-size', width, height)
})
