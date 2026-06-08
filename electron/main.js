import { app, BrowserWindow, shell } from 'electron'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import net from 'net'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = process.env.NODE_ENV === 'development'

const BACKEND_PORT = 18432 // use a fixed non-common port to avoid conflicts
let backendProcess = null
let mainWindow = null

// ── helpers ──────────────────────────────────────────────────────────────────

function getBackendExe() {
  if (isDev) return null // dev mode: assume backend is already running separately
  const exeName = process.platform === 'win32' ? 'backend.exe' : 'backend'
  // In production the exe lives next to the Electron app resources
  return path.join(process.resourcesPath, 'backend', exeName)
}

function waitForPort(port, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout
    const check = () => {
      const sock = net.createConnection(port, '127.0.0.1')
      sock.once('connect', () => { sock.destroy(); resolve() })
      sock.once('error', () => {
        sock.destroy()
        if (Date.now() >= deadline) return reject(new Error(`Backend did not start on port ${port} within ${timeout}ms`))
        setTimeout(check, 300)
      })
    }
    check()
  })
}

// ── backend lifecycle ─────────────────────────────────────────────────────────

async function startBackend() {
  const exe = getBackendExe()
  if (!exe) return // dev mode

  const frontendDist = path.join(process.resourcesPath, 'frontend_dist')

  backendProcess = spawn(exe, ['--port', String(BACKEND_PORT)], {
    env: {
      ...process.env,
      BACKEND_PORT: String(BACKEND_PORT),
      FRONTEND_DIST: frontendDist,  // tell the backend where to serve static files from
    },
    stdio: isDev ? 'inherit' : 'ignore',
    detached: false,
  })

  backendProcess.on('error', (err) => {
    console.error('[backend] failed to start:', err)
  })

  backendProcess.on('exit', (code) => {
    console.log(`[backend] exited with code ${code}`)
    backendProcess = null
  })

  await waitForPort(BACKEND_PORT)
  console.log(`[backend] ready on port ${BACKEND_PORT}`)
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill()
    backendProcess = null
  }
}

// ── window ────────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'CementRegression',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const url = `http://127.0.0.1:${BACKEND_PORT}`
  mainWindow.loadURL(url)

  // Open external links in the OS browser, not inside the app
  mainWindow.webContents.setWindowOpenHandler(({ url: href }) => {
    shell.openExternal(href)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ── app events ────────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  try {
    await startBackend()
  } catch (err) {
    console.error(err)
    // Still try to open the window so the user sees something
  }
  createWindow()
})

app.on('window-all-closed', () => {
  stopBackend()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('before-quit', () => stopBackend())
