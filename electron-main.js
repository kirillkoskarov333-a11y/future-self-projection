const { app, BrowserWindow, shell, Menu, dialog } = require("electron")
const path = require("node:path")

let mainWindow = null

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1440, height: 920, minWidth: 1200, minHeight: 760,
    show: false, autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true }
  })
  const url = process.env.ELECTRON_START_URL || "http://localhost:3001"
  console.log("Loading:", url)
  mainWindow.loadURL(url)
  mainWindow.once("ready-to-show", () => { mainWindow.show(); console.log("Window shown!") })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" } })
})
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit() })
