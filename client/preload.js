const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendDanmaku: (content) => {
    return ipcRenderer.invoke('send-danmaku', { content });
  },

  collapseWindow: () => {
    ipcRenderer.send('window-collapse');
  },

  expandWindow: () => {
    ipcRenderer.send('window-expand');
  },

  minimizeWindow: () => {
    ipcRenderer.send('window-minimize');
  },

  onPageInfoUpdated: (callback) => {
    ipcRenderer.on('page-info-updated', (event, pageInfo) => {
      callback(pageInfo);
    });
  },

  onWindowModeChanged: (callback) => {
    ipcRenderer.on('window-mode-changed', (event, mode) => {
      callback(mode);
    });
  }
});
