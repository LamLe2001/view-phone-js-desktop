const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // App info
    getVersion: () => process.env.npm_package_version || '1.0.0',
    getPlatform: () => process.platform,

    // Window controls
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    maximizeWindow: () => ipcRenderer.send('window-maximize'),
    closeWindow: () => ipcRenderer.send('window-close'),

    // Server status
    onServerStatus: (callback) => {
        ipcRenderer.on('server-status', (event, status) => callback(status));
    },

    // Notification
    showNotification: (title, body) => {
        ipcRenderer.send('show-notification', { title, body });
    }
});

console.log('Preload script loaded');
