export {}

interface DesktopSourceInfo {
  id: string
  name: string
}

interface ElectronAPI {
  // Layout
  getLayout: () => Promise<unknown>
  saveLayout: (layout: unknown) => Promise<boolean>
  getLayouts: () => Promise<unknown[]>
  deleteLayout: (id: string) => Promise<boolean>
  // Theme
  getTheme: () => Promise<unknown>
  saveTheme: (theme: unknown) => Promise<boolean>
  getThemes: () => Promise<unknown[]>
  deleteTheme: (id: string) => Promise<boolean>
  // Dialogs
  showSaveDialog: (options: unknown) => Promise<{ canceled: boolean; filePath?: string }>
  showOpenDialog: (options: unknown) => Promise<{ canceled: boolean; filePaths: string[] }>
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, data: string) => Promise<boolean>
  // Desktop capturer
  getDesktopSourceIds: () => Promise<DesktopSourceInfo[]>
  // Window
  setWindowSize: (width: number, height: number) => Promise<boolean>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
