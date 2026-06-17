const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    openMiniPlayer: (type, id) => ipcRenderer.send('open-mini-player', { type, id }),
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
  onTriggerXakAIWithCommand: (callback) => ipcRenderer.on('trigger-xak-ai-with-command', (event, command) => callback(command)),
  onSetListeningState: (callback) => ipcRenderer.on('set-listening-state', (event, state) => callback(state)),
  notifications: {
    show: (options) => ipcRenderer.send('show-notification', options),
    onReply: (callback) => ipcRenderer.on('notification-reply', (event, { id, reply }) => callback(id, reply)),
    onClick: (callback) => ipcRenderer.on('notification-click', (event, { id }) => callback(id)),
  },
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
});
