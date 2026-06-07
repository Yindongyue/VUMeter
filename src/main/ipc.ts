import { ipcMain, dialog, desktopCapturer, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { getConfig, setConfig } from './store'

export function registerIpcHandlers(): void {
  // Layout persistence
  ipcMain.handle('get:layout', () => {
    return getConfig('layout')
  })

  ipcMain.handle('save:layout', (_event, layout) => {
    setConfig('layout', layout as Record<string, unknown>)
    return true
  })

  ipcMain.handle('get:layouts', () => {
    return getConfig('layouts') || []
  })

  ipcMain.handle('delete:layout', (_event, id: string) => {
    const layouts = (getConfig('layouts') as Array<{ id: string }>) || []
    setConfig('layouts', layouts.filter((l: { id: string }) => l.id !== id))
    return true
  })

  // Theme persistence
  ipcMain.handle('get:theme', () => {
    return getConfig('theme')
  })

  ipcMain.handle('save:theme', (_event, theme) => {
    setConfig('theme', theme as Record<string, unknown>)
    return true
  })

  ipcMain.handle('get:themes', () => {
    return getConfig('themes') || []
  })

  ipcMain.handle('delete:theme', (_event, id: string) => {
    const themes = (getConfig('themes') as Array<{ id: string }>) || []
    setConfig('themes', themes.filter((t: { id: string }) => t.id !== id))
    return true
  })

  // File dialogs
  ipcMain.handle('dialog:save', async (_event, options) => {
    const win = BrowserWindow.getFocusedWindow()
    return dialog.showSaveDialog(win!, options)
  })

  ipcMain.handle('dialog:open', async (_event, options) => {
    const win = BrowserWindow.getFocusedWindow()
    return dialog.showOpenDialog(win!, options)
  })

  // File read/write
  ipcMain.handle('file:read', (_event, path: string) => {
    return readFileSync(path, 'utf-8')
  })

  ipcMain.handle('file:write', (_event, path: string, data: string) => {
    writeFileSync(path, data, 'utf-8')
    return true
  })

  // Desktop capturer - return serializable source info
  ipcMain.handle('get:desktop-source-ids', async () => {
    const sources = await desktopCapturer.getSources({ types: ['screen'] })
    return sources.map(s => ({ id: s.id, name: s.name }))
  })

  // Window size
  ipcMain.handle('window:set-size', (_event, width: number, height: number) => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.setSize(width, height)
    }
    return true
  })
}
