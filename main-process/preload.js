const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectImage: () => ipcRenderer.invoke('select-image'),
  selectVideo: () => ipcRenderer.invoke('select-video'),
  selectAudio: () => ipcRenderer.invoke('select-audio'),
  saveFile: (content) => ipcRenderer.send('save-file', content),
  createEditor: (config) => ipcRenderer.send('create-editor', config),
  exportWebsite: (websiteData) => ipcRenderer.send('export-website', websiteData)
});
