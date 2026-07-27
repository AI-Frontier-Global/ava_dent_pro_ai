const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const http = require('http');

const BRIDGE_PORT = 3001;
const WEB_PORT = 5173;

let mainWindow = null;
let bridgeProc = null;
let viteProc = null;

function isPortOpen(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve(true);
      res.destroy();
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForPort(port, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function startBridge() {
  const bridgePath = path.join(__dirname, '..', 'local-ollama-bridge.js');
  bridgeProc = fork(bridgePath, [], {
    env: { ...process.env, NO_TUNNEL: '1' },
    stdio: 'pipe',
  });
  bridgeProc.on('exit', (code) => {
    console.log(`Bridge exited with code ${code}`);
  });
  await waitForPort(BRIDGE_PORT, 15000);
}

async function startVitePreview() {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    viteProc = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', 'preview', '--port', String(WEB_PORT), '--host', '127.0.0.1'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      shell: false,
    });
    viteProc.on('error', (err) => {
      console.error('Failed to start vite preview:', err);
      resolve(false);
    });
    waitForPort(WEB_PORT, 20000).then(resolve);
  });
}

async function createWindow() {
  const isDev = !app.isPackaged;

  if (isDev) {
    const ok = await waitForPort(WEB_PORT, 30000);
    if (!ok) {
      console.error('Vite dev server not reachable. Make sure npm run dev is running.');
    }
  } else {
    await startBridge();
    await startVitePreview();
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'نظام إدارة عيادة الأسنان',
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);

  const url = isDev
    ? `http://localhost:${WEB_PORT}`
    : `http://127.0.0.1:${WEB_PORT}`;

  mainWindow.loadURL(url);

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('http')) {
      shell.openExternal(targetUrl);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (bridgeProc) bridgeProc.kill();
  if (viteProc) viteProc.kill();
  app.quit();
});

app.on('before-quit', () => {
  if (bridgeProc) bridgeProc.kill();
  if (viteProc) viteProc.kill();
});
