'use strict'

const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { spawn } = require('node:child_process')
const http = require('node:http')

const PORT = 3001
let serverProcess = null
let mainWindow = null

function waitForServer(retries = 40, delay = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    function check() {
      attempts++
      const req = http.get(`http://127.0.0.1:${PORT}`, (res) => {
        res.resume()
        resolve()
      })
      req.on('error', () => {
        if (attempts < retries) {
          setTimeout(check, delay)
        } else {
          reject(new Error(`Server not ready after ${retries} attempts`))
        }
      })
      req.setTimeout(400, () => { req.destroy() })
    }
    check()
  })
}

function ensureStaticFiles(appPath) {
  // In dev mode, copy .next/static into .next/standalone/.next/static
  // so the standalone server can serve JS/CSS files
  if (app.isPackaged) return
  const src = path.join(appPath, '.next', 'static')
  const dest = path.join(appPath, '.next', 'standalone', '.next', 'static')
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    console.log('[electron] Copying static assets to standalone...')
    fs.cpSync(src, dest, { recursive: true, force: true })
  }
}

function startNextServer() {
  const appPath = app.getAppPath()

  // Make sure static files are available for standalone server
  ensureStaticFiles(appPath)

  // In packaged app, asarUnpack extracts standalone outside the .asar
  const serverScript = app.isPackaged
    ? path.join(appPath.replace('app.asar', 'app.asar.unpacked'), '.next', 'standalone', 'server.js')
    : path.join(appPath, '.next', 'standalone', 'server.js')

  console.log('[electron] Starting Next.js standalone server:', serverScript)

  // ELECTRON_RUN_AS_NODE=1 makes Electron behave as plain Node.js for the server process
  // Data is stored in ~/.future-self-projection/ (handled by storage.ts)
  const env = { ...process.env, PORT: String(PORT), HOSTNAME: '127.0.0.1', ELECTRON_RUN_AS_NODE: '1' }

  serverProcess = spawn(process.execPath, [serverScript], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: path.dirname(serverScript),
  })

  serverProcess.stdout.on('data', (d) => process.stdout.write('[server] ' + d))
  serverProcess.stderr.on('data', (d) => process.stderr.write('[server] ' + d))
  serverProcess.on('exit', (code, signal) => {
    console.log(`[electron] Server exited: code=${code} signal=${signal}`)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1200,
    minHeight: 760,
    show: false,
    frame: false,              // убираем системную рамку
    titleBarStyle: 'hidden',   // скрываем заголовок (macOS светофоры тоже скрыты)
    autoHideMenuBar: true,
    backgroundColor: '#0f0f0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    console.log('[electron] Window shown')
  })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.on('closed', () => { mainWindow = null })
}

// IPC handlers for window controls (minimize, maximize, close)
ipcMain.on('window-minimize', () => { if (mainWindow) mainWindow.minimize() })
ipcMain.on('window-maximize', () => {
  if (!mainWindow) return
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
})
ipcMain.on('window-close', () => { if (mainWindow) mainWindow.close() })

app.whenReady().then(async () => {
  startNextServer()

  console.log('[electron] Waiting for server on port', PORT, '...')
  try {
    await waitForServer()
    console.log('[electron] Server ready, creating window')
    createWindow()
  } catch (e) {
    console.error('[electron] Failed to start server:', e.message)
    app.quit()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (serverProcess && !serverProcess.killed) {
    console.log('[electron] Killing server process')
    serverProcess.kill()
  }
})
