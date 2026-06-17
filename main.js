const { app, BrowserWindow, ipcMain, dialog, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const { exec } = require('child_process');
const { autoUpdater } = require('electron-updater');

// Basic auto updater configuration
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false, // Custom frameless window
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'public', 'favicon.ico'),
    title: "Xak AI"
  });

  const startUrl = process.env.ELECTRON_START_URL ? process.env.ELECTRON_START_URL.replace('/desktop', '/ai-chat') : `file://${path.join(__dirname, 'desktop-out/ai-chat.html')}`;
  
  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Check for updates once the window is ready
  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

let overlayWindow = null;
function createOverlayWindow() {
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  
  overlayWindow = new BrowserWindow({
    x: primaryDisplay.bounds.x,
    y: primaryDisplay.bounds.y,
    width: primaryDisplay.bounds.width,
    height: primaryDisplay.bounds.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  const startUrl = process.env.ELECTRON_START_URL 
    ? process.env.ELECTRON_START_URL.replace('/desktop', '/overlay') 
    : `file://${path.join(__dirname, 'desktop-out/overlay.html')}`; // This won't exist in static export unless Next.js outputs it correctly, we will use the local dev URL for now or just routing
  
  // Since we load the same index, we can append a hash or query param or use Next.js routing if static export handles it
  overlayWindow.loadURL(process.env.ELECTRON_START_URL ? process.env.ELECTRON_START_URL.replace('/desktop', '/overlay') : `file://${path.join(__dirname, 'desktop-out/overlay.html')}`);

  overlayWindow.on('closed', function () {
    overlayWindow = null;
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'public', 'favicon.ico'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open Xak AI', click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setToolTip('Xak AI');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    } else {
      createWindow();
    }
  });
}

// Auto-updater events
autoUpdater.on('update-available', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update_available');
  }
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update_downloaded');
  }
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

// Window controls IPC
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.hide(); // Hide instead of close to keep in tray
});

ipcMain.on('set-listening-state', (event, state) => {
  if (overlayWindow) {
    overlayWindow.webContents.send('set-listening-state', state);
  }
});

// File System IPC for Xak AI
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('run-terminal-command', (event, command, cwd) => {
  return new Promise((resolve) => {
    exec(command, { cwd: cwd || process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: error.message, stderr, stdout });
      } else {
        resolve({ success: true, data: stdout, stderr });
      }
    });
  });
});

ipcMain.handle('create-desktop-shortcuts', async () => {
  try {
    const desktopPath = path.join(require('os').homedir(), 'Desktop');
    const folderPath = path.join(desktopPath, 'Xakteir Apps');
    
    // Create folder
    await fs.mkdir(folderPath, { recursive: true });

    const apps = [
      { name: 'Xak AI', url: 'http://localhost:9002/ai-chat' }, // or the actual production URL
      { name: 'Xakteir Hub', url: 'https://hub.xakteir.com' },
      { name: 'Xakchat', url: 'https://chat.xakteir.com' },
      { name: 'Xakteir Suite', url: 'https://suite.xakteir.com' }
    ];

    // Create .url files (Windows standard internet shortcut)
    for (const app of apps) {
      const shortcutPath = path.join(folderPath, `${app.name}.url`);
      const shortcutContent = `[InternetShortcut]\nURL=${app.url}\n`;
      await fs.writeFile(shortcutPath, shortcutContent, 'utf-8');
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('wake-xak', async (event, command) => {
  if (mainWindow) {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    if (!mainWindow.isFocused()) {
      mainWindow.focus();
    }
    mainWindow.webContents.send('trigger-xak-ai-with-command', command);
    return { success: true };
  }
  return { success: false };
});

app.whenReady().then(() => {
  createWindow();
  createOverlayWindow();
  createTray();

  // Global Shortcut for Xak AI
  globalShortcut.register('CommandOrControl+Space', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        if (!mainWindow.isFocused()) {
          mainWindow.focus();
        }
      } else {
        mainWindow.show();
      }
      mainWindow.webContents.send('trigger-xak-ai');
    } else {
      createWindow();
    }
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
