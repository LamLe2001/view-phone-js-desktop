const { app, BrowserWindow, dialog } = require('electron');
const { fork } = require('child_process');
const path = require('path');
const net = require('net');
const http = require('http');
const fs = require('fs');

let mainWindow;
let serverProcess;
let clientServer;
const SERVER_PORT = 8000;
const CLIENT_PORT = 8080;

// Tìm port trống
async function findFreePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findFreePort(startPort + 1));
    });
  });
}

// MIME types cho static files
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

// Khởi động client static server
async function startClientServer() {
  const clientPath = path.join(__dirname, '..', 'src', 'client', 'dist');

  return new Promise((resolve, reject) => {
    clientServer = http.createServer((req, res) => {
      let filePath = path.join(clientPath, req.url === '/' ? 'index.html' : req.url);

      // Nếu không có extension, serve index.html (SPA routing)
      if (!path.extname(filePath)) {
        filePath = path.join(clientPath, 'index.html');
      }

      const extname = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[extname] || 'application/octet-stream';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          if (err.code === 'ENOENT') {
            // Fallback to index.html for SPA
            fs.readFile(path.join(clientPath, 'index.html'), (err2, content2) => {
              if (err2) {
                res.writeHead(404);
                res.end('Not found');
              } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content2);
              }
            });
          } else {
            res.writeHead(500);
            res.end('Server error');
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content);
        }
      });
    });

    clientServer.listen(CLIENT_PORT, () => {
      console.log(`Client server running on port ${CLIENT_PORT}`);
      resolve();
    });

    clientServer.on('error', (err) => {
      console.error('Client server error:', err);
      reject(err);
    });
  });
}

// Khởi động backend server
async function startServer() {
  const serverPath = path.join(__dirname, '..', 'src', 'server', 'dist', 'index.js');

  return new Promise((resolve, reject) => {
    serverProcess = fork(serverPath, [], {
      cwd: path.join(__dirname, '..', 'src', 'server'),
      env: { ...process.env, PORT: SERVER_PORT },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`[Server]: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server Error]: ${data}`);
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start server:', err);
      reject(err);
    });

    // Đợi server khởi động
    setTimeout(() => {
      resolve();
    }, 2000);
  });
}

// Tạo cửa sổ chính
async function createWindow() {
  // Sử dụng Logo.jpg nếu Logo.ico không tồn tại
  let iconPath = path.join(__dirname, '..', 'docs', 'Logo.ico');
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, '..', 'docs', 'Logo.jpg');
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: iconPath,
    backgroundColor: '#FFFFFF',
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load client UI từ local static server
  const clientUrl = `http://localhost:${CLIENT_PORT}`;

  try {
    await mainWindow.loadURL(clientUrl);
  } catch (err) {
    console.error('Failed to load client:', err);
    dialog.showErrorBox('Error', `Failed to load application: ${err.message}`);
  }

  // DevTools trong development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App ready
app.whenReady().then(async () => {
  try {
    console.log('Starting client server...');
    await startClientServer();
    console.log('Starting backend server...');
    await startServer();
    console.log('Server started. Creating window...');
    await createWindow();
    console.log('Window created.');
  } catch (err) {
    console.error('Startup error:', err);
    dialog.showErrorBox('Startup Error', err.message);
    app.quit();
  }
});

// Tắt tất cả khi đóng cửa sổ
app.on('window-all-closed', () => {
  console.log('All windows closed. Shutting down...');

  // Kill server process
  if (serverProcess) {
    console.log('Killing server process...');
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }

  // Close client server
  if (clientServer) {
    console.log('Closing client server...');
    clientServer.close();
    clientServer = null;
  }

  app.quit();
});

// Cleanup khi app thoát
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  if (clientServer) {
    clientServer.close();
  }
});

// macOS: Tạo lại cửa sổ khi click vào dock icon
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

