const { app, BrowserWindow, protocol, net, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// 1. Register privileged scheme for "app://" so root-relative URLs, SVGs, XLSX fetch, and fonts work seamlessly
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

// 2. Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow = null;

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(initApp);
}

function resolveDistDir() {
  const candidates = [
    path.join(__dirname, 'dist'),
    path.join(__dirname, '..', 'dist'),
    path.join(app.getAppPath(), 'dist'),
    app.getAppPath(),
  ];

  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'index.html'))) {
      return c;
    }
  }
  return path.join(__dirname, '..', 'dist');
}

function getAppIconPath() {
  const icoPath = path.join(__dirname, 'icon.ico');
  const pngPath = path.join(__dirname, 'icon.png');
  if (fs.existsSync(icoPath)) return icoPath;
  if (fs.existsSync(pngPath)) return pngPath;
  return undefined;
}

function initApp() {
  const distDir = resolveDistDir();

  // Handle all app:// requests and map them directly to dist files
  protocol.handle('app', (request) => {
    try {
      const url = new URL(request.url);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname === '/' || pathname === '') {
        pathname = '/index.html';
      }

      const cleanPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      let targetPath = path.join(distDir, cleanPath);

      if (!fs.existsSync(targetPath)) {
        // Fallback for SPA routing
        targetPath = path.join(distDir, 'index.html');
      }

      return net.fetch(pathToFileURL(targetPath).toString());
    } catch (err) {
      console.error('Error handling protocol request:', err);
      return new Response('Not Found', { status: 404 });
    }
  });

  createWindow(distDir);
}

function createWindow(distDir) {
  const iconPath = getAppIconPath();

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'الفارس الذهبي للدعاية والإعلان',
    icon: iconPath,
    backgroundColor: '#0a0e1a',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      spellcheck: false,
    },
  });

  // Smooth appearance when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Track maximize state
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:stateChange', { isMaximized: true });
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:stateChange', { isMaximized: false });
  });

  // Intercept external links and open them in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('mailto:') ||
      url.startsWith('tel:') ||
      url.startsWith('whatsapp:')
    ) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('mailto:') ||
      url.startsWith('tel:') ||
      url.startsWith('whatsapp:')
    ) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Build minimalist menu with standard keyboard shortcuts
  const template = [
    {
      label: 'ملف',
      submenu: [
        { label: 'إعادة تحميل', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'ملء الشاشة', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
        { type: 'separator' },
        { label: 'خروج', accelerator: 'Alt+F4', click: () => app.quit() },
      ],
    },
    {
      label: 'عرض',
      submenu: [
        { label: 'تكبير', accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
        { label: 'تصغير', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'الحجم الطبيعي', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        {
          label: 'أدوات المطور',
          accelerator: 'F12',
          click: () => mainWindow.webContents.toggleDevTools(),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  // Load the application via app:// protocol (with graceful file:// fallback)
  mainWindow.loadURL('app://localhost/index.html').catch((err) => {
    console.warn('Protocol loadURL failed, fallback to loadFile:', err);
    mainWindow.loadFile(path.join(distDir, 'index.html'));
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
    return mainWindow.isMaximized();
  }
  return false;
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('shell:openExternal', async (_event, url) => {
  if (url && typeof url === 'string') {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

ipcMain.handle('shell:openPath', async (_event, fullPath) => {
  if (fullPath && typeof fullPath === 'string') {
    return await shell.openPath(fullPath);
  }
  return false;
});

ipcMain.handle('shell:showItemInFolder', async (_event, fullPath) => {
  if (fullPath && typeof fullPath === 'string') {
    shell.showItemInFolder(fullPath);
    return true;
  }
  return false;
});

ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getInfo', () => {
  return {
    name: 'الفارس الذهبي للدعاية والإعلان',
    version: app.getVersion(),
    isPackaged: app.isPackaged,
    platform: process.platform,
  };
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    initApp();
  }
});
