const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createConfigWindow() {
  const configWindow = new BrowserWindow({
    width: 600,
    height: 480,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  configWindow.loadFile(path.join(__dirname, '../src/config.html'));
}

ipcMain.on('create-editor', (event, config) => {
  BrowserWindow.getAllWindows().forEach(window => {
    if (window.title === 'WeeBee - Setup') window.close();
  });
  mainWindow = new BrowserWindow({
    width: parseInt(config.width) + 300,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.loadFile(path.join(__dirname, '../src/editor.html'), {
    query: { name: config.name, width: config.width }
  });
});

// Register media file selection handlers.
ipcMain.handle('select-image', async () => {
  const options = {
    title: 'Select Image File',
    properties: ['openFile'],
    filters: [{ name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] }]
  };
  const result = await dialog.showOpenDialog(options);
  if (!result.canceled && result.filePaths && result.filePaths[0]) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-video', async () => {
  const options = {
    title: 'Select Video File',
    properties: ['openFile'],
    filters: [{ name: 'Video Files', extensions: ['mp4', 'mov', 'avi', 'mkv'] }]
  };
  const result = await dialog.showOpenDialog(options);
  if (!result.canceled && result.filePaths && result.filePaths[0]) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-audio', async () => {
  const options = {
    title: 'Select Audio File',
    properties: ['openFile'],
    filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg'] }]
  };
  const result = await dialog.showOpenDialog(options);
  if (!result.canceled && result.filePaths && result.filePaths[0]) {
    return result.filePaths[0];
  }
  return null;
});

// Legacy single-page export handler.
ipcMain.on('save-file', (event, content) => {
  const options = {
    title: 'Save Website',
    defaultPath: path.join(app.getPath('documents'), 'website.html'),
    filters: [{ name: 'HTML Files', extensions: ['html'] }]
  };
  dialog.showSaveDialog(options).then(result => {
    if (!result.canceled && result.filePath) {
      fs.writeFile(result.filePath, content, (err) => {
        if (err) {
          event.sender.send('save-error', err.message);
        } else {
          event.sender.send('save-success', result.filePath);
        }
      });
    }
  });
});

// Updated export handler: Save each page and copy media files.
ipcMain.on('export-website', async (event, websiteData) => {
  try {
    const options = {
      title: 'Select Folder to Export Website',
      properties: ['openDirectory']
    };
    const result = await dialog.showOpenDialog(options);
    if (!result.canceled && result.filePaths && result.filePaths[0]) {
      const folderPath = result.filePaths[0];
      // Save each HTML page.
      websiteData.pages.forEach(page => {
        const filePath = path.join(folderPath, page.filename);
        fs.writeFileSync(filePath, page.html, 'utf-8');
      });
      // Copy all media files.
      if (websiteData.mediaFiles && Array.isArray(websiteData.mediaFiles)) {
        websiteData.mediaFiles.forEach(media => {
          // media.source is the original file path, media.filename is the basename.
          const dest = path.join(folderPath, media.filename);
          try {
            fs.copyFileSync(media.source, dest);
          } catch (err) {
            console.error("Error copying media file:", media.source, err);
          }
        });
      }
      event.sender.send('export-success', folderPath);
    }
  } catch (err) {
    event.sender.send('export-error', err.message);
  }
});

app.whenReady().then(createConfigWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
