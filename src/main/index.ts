import { app, BrowserWindow, shell, session } from 'electron'
import { join } from 'path'
import { getStoredWindowBounds, setStoredWindowBounds } from './store'
import { registerIpcHandlers } from './ipc'

// Allow AudioContext to resume without user gesture (needed since AudioContext
// is created after async getUserMedia/getDisplayMedia, outside gesture scope)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const savedBounds = getStoredWindowBounds()

  mainWindow = new BrowserWindow({
    title: 'VU-Meter',
    minWidth: 800,
    minHeight: 600,
    width: savedBounds.width,
    height: savedBounds.height,
    x: savedBounds.x,
    y: savedBounds.y,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Handle renderer process crashes
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone:', details.reason)
    // Reload the renderer
    if (details.reason !== 'crashed' && details.reason !== 'killed') return
    setTimeout(() => {
      if (mainWindow) {
        console.log('Reloading renderer...')
        mainWindow.reload()
      }
    }, 1000)
  })

  // Handle unresponsive renderer
  mainWindow.webContents.on('unresponsive', () => {
    console.warn('Renderer process unresponsive')
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    // Close DevTools if they were opened (e.g. by electron-vite dev mode)
    mainWindow?.webContents.closeDevTools()
  })

  // In dev mode, keep DevTools available for debugging.
  // In production, DevTools are disabled by default.
  // mainWindow.webContents.on('devtools-opened', () => {
  //   mainWindow?.webContents.closeDevTools()
  // })

  mainWindow.on('resize', saveBounds)
  mainWindow.on('move', saveBounds)

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function saveBounds(): void {
  if (!mainWindow) return
  const bounds = mainWindow.getBounds()
  setStoredWindowBounds(bounds)
}

app.whenReady().then(() => {
  // Grant media permissions for desktop capture
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      // display-capture: needed for getDisplayMedia in some Electron versions
      // media: needed for getUserMedia audio capture
      const allowed = ['media', 'mediaKeySystem', 'display-capture']
      callback(allowed.includes(permission))
    }
  )

  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
