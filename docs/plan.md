# Kế Hoạch: Chuyển Đổi Ứng Dụng Web Sang Desktop (Electron)

Chuyển đổi dự án web scrcpy-ws-broadway thành ứng dụng desktop chạy dưới dạng file .exe với Electron.

---

## Yêu Cầu Cần Đáp Ứng

| # | Yêu cầu | Mô tả |
|---|---------|-------|
| 1 | EXE = UI + Server | Chạy file .exe thì vừa hiển thị UI vừa chạy server |
| 2 | Tắt UI = Tắt Server | Khi tắt UI thì tắt server |
| 3 | Build UI Electron | Build UI về Electron, giữ nguyên chức năng |
| 4 | Logo | Sử dụng `F:\view-phone-js-desktop\docs\Logo.jpg` |
| 5 | Màu sắc | Chủ đạo: Trắng, Đen - Phụ: `rgba(0,153,132,1)` |
| 6 | Icon | Dạng iOS, có bo viền |
| 7 | Chức năng | Giữ nguyên tất cả chức năng từ `src/` |

---

## Cấu Trúc Dự Án Mới

```
F:\view-phone-js-desktop\
├── electron/                    [NEW] Thư mục Electron
│   ├── main.js                  [NEW] Main process
│   ├── preload.js               [NEW] Preload script
│   └── package.json             [NEW] Electron config
├── src/
│   ├── client/                  [GIỮNGUYÊN] React UI
│   └── server/                  [GIỮNGUYÊN] Node.js Server
├── dist/                        [NEW] Build output
└── docs/
    ├── Logo.jpg                 [GIỮNGUYÊN]
    └── plan.md                  [FILE NÀY]
```

---

## Proposed Changes

### Component 1: Electron Main Process

#### [NEW] [main.js](file:///F:/view-phone-js-desktop/electron/main.js)

Tạo file main process cho Electron:
- Khởi tạo `BrowserWindow` với cấu hình iOS-style (bo viền)
- Khởi động Node.js server đồng thời với UI
- Xử lý sự kiện `close` để tắt server khi tắt UI
- Cấu hình icon từ Logo.jpg
- Màu sắc: background trắng/đen, accent `rgba(0,153,132,1)`

```javascript
// Pseudocode
const { app, BrowserWindow } = require('electron');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

app.on('ready', () => {
  // Start server
  serverProcess = fork('./server/dist/index.js');
  
  // Create window with rounded corners (iOS-style)
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: true,
    icon: './docs/Logo.jpg',
    backgroundColor: '#FFFFFF',
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  
  mainWindow.loadURL('http://localhost:PORT');
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  app.quit();
});
```

---

#### [NEW] [preload.js](file:///F:/view-phone-js-desktop/electron/preload.js)

Script preload để expose các API an toàn cho renderer process.

---

#### [NEW] [package.json](file:///F:/view-phone-js-desktop/electron/package.json)

Cấu hình Electron với electron-builder:

```json
{
  "name": "view-phone-desktop",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder --win"
  },
  "build": {
    "appId": "com.viewphone.desktop",
    "productName": "View Phone",
    "win": {
      "target": "nsis",
      "icon": "../docs/Logo.ico"
    }
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.0.0"
  }
}
```

---

### Component 2: Icon Conversion

#### [NEW] [Logo.ico](file:///F:/view-phone-js-desktop/docs/Logo.ico)

Chuyển đổi Logo.jpg sang định dạng .ico cho Windows:
- Sử dụng công cụ convert hoặc thư viện
- Kích thước: 256x256, 128x128, 64x64, 32x32, 16x16
- Giữ nguyên style iOS với bo viền

---

### Component 3: Build Scripts

#### [NEW] [build.js](file:///F:/view-phone-js-desktop/scripts/build.js)

Script tự động hóa quá trình build:

1. Build client (Vite): `npm run build` trong `src/client`
2. Build server (Webpack): `npm run build` trong `src/server`
3. Copy tất cả các file cần thiết vào thư mục Electron
4. Chạy `electron-builder` để tạo file .exe

---

### Component 4: UI Styling Updates (Nếu cần)

#### [MODIFY] [styles.css](file:///F:/view-phone-js-desktop/src/client/src/styles.css)

Cập nhật các biến CSS để phù hợp với màu sắc yêu cầu:

```css
:root {
  --color-primary: rgba(0, 153, 132, 1);    /* Màu phụ teal */
  --color-bg-light: #FFFFFF;                 /* Trắng */
  --color-bg-dark: #000000;                  /* Đen */
  --border-radius-ios: 16px;                 /* Bo viền iOS-style */
}
```

---

## Verification Plan

### Automated Tests

| Test | Command | Mô tả |
|------|---------|-------|
| Build Client | `cd src/client && npm run build` | Kiểm tra React build thành công |
| Build Server | `cd src/server && npm run build` | Kiểm tra Server build thành công |
| Electron Start | `cd electron && npm start` | Kiểm tra Electron chạy được |

### Manual Verification

1. **Chạy EXE**: Double-click file .exe để khởi động ứng dụng
   - ✅ UI hiển thị đúng
   - ✅ Server chạy (kiểm tra ADB kết nối)
   
2. **Tắt UI**: Đóng cửa sổ ứng dụng
   - ✅ Không có process server còn lại trong Task Manager
   
3. **Giao diện**: Kiểm tra visual
   - ✅ Icon đúng Logo.jpg
   - ✅ Màu sắc: Trắng/Đen chủ đạo, Teal accent
   - ✅ Bo viền iOS-style

4. **Chức năng**: Kiểm tra tất cả features từ web version
   - ✅ Kết nối thiết bị Android
   - ✅ Hiển thị màn hình điện thoại
   - ✅ Điều khiển từ xa

---

## Implementation Checklist

- [x] Tạo thư mục `electron/`
- [x] Tạo `electron/main.js` - Main process
- [x] Tạo `electron/preload.js` - Preload script
- [x] Tạo `electron/package.json` - Electron config
- [x] Tạo `electron/run.bat` - Fix ELECTRON_RUN_AS_NODE
- [ ] Chuyển đổi Logo.jpg → Logo.ico (sử dụng Logo.jpg fallback)
- [x] Tạo `scripts/build.js` - Build automation
- [ ] Cập nhật styles.css với màu sắc mới (nếu cần)
- [x] Cấu hình electron-builder cho Windows
- [ ] Build và test file .exe
- [x] Kiểm tra tắt UI = tắt Server
- [x] Kiểm tra tất cả chức năng

---

## Rủi Ro & Giải Pháp

| Rủi Ro | Giải Pháp |
|--------|-----------|
| Server port conflict | Sử dụng portfinder để tìm port trống |
| ADB/DLL không bundle đúng | Cấu hình `extraResources` trong electron-builder |
| Size file .exe quá lớn | Exclude node_modules không cần thiết |

---

## Dependencies Cần Cài Đặt

```bash
# Trong thư mục electron/
npm install electron electron-builder --save-dev
npm install find-free-port --save
```
