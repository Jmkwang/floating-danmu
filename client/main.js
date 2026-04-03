const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen } = require('electron');
const path = require('path');
const Store = require('electron-store');
const http = require('http');

const store = new Store();

let mainWindow = null;
let tray = null;
let currentPageInfo = null;
let currentCookies = null;
let isCapsuleMode = false;

const CLIENT_PORT = 34567;

const WINDOW_CONFIG = {
  expanded: { width: 280, height: 110 },
  capsule: { width: 60, height: 60 }
};

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: WINDOW_CONFIG.expanded.width,
    height: WINDOW_CONFIG.expanded.height,
    x: screenWidth - 300,
    y: screenHeight - 160,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });
}

function setWindowMode(mode) {
  if (!mainWindow) return;

  const config = WINDOW_CONFIG[mode];
  isCapsuleMode = mode === 'capsule';

  mainWindow.setSize(config.width, config.height);
  mainWindow.webContents.send('window-mode-changed', mode);
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  let trayIcon;

  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示悬浮窗',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          if (isCapsuleMode) {
            setWindowMode('expanded');
          }
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Floating Danmu - B站弹幕助手');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        if (isCapsuleMode) {
          setWindowMode('expanded');
        }
      }
    }
  });
}

function createHttpServer() {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/api/message') {
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const message = JSON.parse(body);
          handleMessage(message);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(CLIENT_PORT, () => {
    console.log(`HTTP server listening on port ${CLIENT_PORT}`);
  });

  return server;
}

function handleMessage(message) {
  if (message.type === 'page-update') {
    currentPageInfo = message.pageInfo;
    currentCookies = message.cookies;

    if (mainWindow) {
      mainWindow.webContents.send('page-info-updated', {
        ...currentPageInfo,
        cookies: currentCookies
      });
    }
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  createHttpServer();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

ipcMain.handle('send-danmaku', async (event, data) => {
  const { content } = data;

  try {
    let result;

    if (currentPageInfo && currentPageInfo.type === 'live') {
      result = await sendLiveDanmaku(content, currentCookies, currentPageInfo.roomId);
    } else if (currentPageInfo && currentPageInfo.type === 'video') {
      result = await sendVideoDanmaku(content, currentCookies, currentPageInfo.bvid);
    } else {
      result = { success: false, error: '未检测到B站页面' };
    }

    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.on('window-collapse', () => {
  setWindowMode('capsule');
});

ipcMain.on('window-expand', () => {
  setWindowMode('expanded');
});

async function sendLiveDanmaku(content, cookies, roomId) {
  const axios = require('axios');

  if (!cookies || !cookies.SESSDATA) {
    return { success: false, error: '未登录，请先登录B站' };
  }

  const csrf = cookies.bili_jct || '';
  const cookieStr = buildCookieString(cookies);

  const params = new URLSearchParams({
    roomid: roomId,
    msg: content,
    csrf: csrf,
    csrf_token: csrf,
    bubble: '0',
    color: '16777215',
    mode: '1',
    fontsize: '25',
    rnd: Math.floor(Date.now() / 1000).toString()
  });

  try {
    const response = await axios.post(
      `https://api.live.bilibili.com/msg/send`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieStr,
          'Referer': `https://live.bilibili.com/${roomId}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Origin': 'https://live.bilibili.com'
        }
      }
    );

    console.log('Live danmaku response:', response.data);

    if (response.data && response.data.code === 0) {
      return { success: true };
    } else {
      return { success: false, error: response.data?.message || response.data?.msg || '发送失败' };
    }
  } catch (error) {
    console.error('Live danmaku error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

async function sendVideoDanmaku(content, cookies, bvid) {
  const axios = require('axios');

  if (!cookies || !cookies.SESSDATA) {
    return { success: false, error: '未登录，请先登录B站' };
  }

  const csrf = cookies.bili_jct || '';
  const cookieStr = buildCookieString(cookies);

  try {
    const oidResponse = await axios.get(
      `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
      {
        headers: {
          'Cookie': cookieStr,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    if (!oidResponse.data || oidResponse.data.code !== 0) {
      return { success: false, error: '无法获取视频信息' };
    }

    const oid = oidResponse.data.data.aid;

    const params = new URLSearchParams({
      oid: oid.toString(),
      type: '1',
      message: content,
      csrf: csrf,
      csrf_token: csrf
    });

    const response = await axios.post(
      `https://api.bilibili.com/x/v2/reply/add`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': cookieStr,
          'Referer': `https://www.bilibili.com/video/${bvid}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Origin': 'https://www.bilibili.com'
        }
      }
    );

    console.log('Video danmaku response:', response.data);

    if (response.data && response.data.code === 0) {
      return { success: true };
    } else {
      return { success: false, error: response.data?.message || response.data?.msg || '发送失败' };
    }
  } catch (error) {
    console.error('Video danmaku error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
}

function buildCookieString(cookies) {
  if (!cookies) return '';

  const parts = [];
  if (cookies.SESSDATA) parts.push(`SESSDATA=${cookies.SESSDATA}`);
  if (cookies.bili_jct) parts.push(`bili_jct=${cookies.bili_jct}`);
  if (cookies.DedeUserID) parts.push(`DedeUserID=${cookies.DedeUserID}`);

  return parts.join('; ');
}
