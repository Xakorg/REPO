const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
  },
  updater: {
    onUpdateAvailable: (callback) => ipcRenderer.on('update_available', () => callback()),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update_downloaded', () => callback()),
    restartApp: () => ipcRenderer.send('restart_app')
  },
  fs: {
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
    deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
    runTerminalCommand: (command, cwd) => ipcRenderer.invoke('run-terminal-command', command, cwd),
  },
  setListeningState: (state) => ipcRenderer.send('set-listening-state', state),
  onTriggerXakAI: (callback) => ipcRenderer.on('trigger-xak-ai', () => callback()),
  onSetListeningState: (callback) => ipcRenderer.on('set-listening-state', (event, state) => callback(state))
});
