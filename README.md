<p align="center">
  <img src="https://raw.githubusercontent.com/afzalt3ch/banner.png/main/Gemini_Generated_Image_hb31fqhb31fqhb31.png" alt="WeeBee Banner" width="100%" />
</p>

<h1 align="center">🛠️ WeeBee – Drag & Drop Website Builder</h1>

<p align="center">
  A powerful drag-and-drop desktop app for building custom websites without writing code.  
  Built using Electron, HTML, CSS, and JavaScript.
</p>

---

## ✨ Features

- 📄 **Drag-and-Drop Elements**:
  - Headings, Paragraphs, Images, Videos, Audio, Horizontal Lines
  - Lists: Ordered, Unordered, Definition
  - Custom Tables with row/column input

- 🎨 **Full Text & Style Formatting**:
  - Bold, Italic, Underline, Font Size, Font Color, Background Color
  - Font Family and Alignment options

- 📋 **Link Insertion**:
  - Internal ID links
  - Go-to Section links
  - External website links with popups

- 🖱️ **Canvas & Layout Features**:
  - Resize page height dynamically
  - Select/Move toggle
  - Resize and reposition elements
  - Canvas background customization

- 💾 **Export Options**:
  - Export the entire design as static HTML and CSS
  - Saved inside selected folder directory

- ⚙️ **Cross-Platform Desktop App**:
  - Built using Electron
  - Can be packaged into a `.exe` file using `electron-builder`

---

## 🎥 Demo GIFs

> A quick look into the app and websites built using WeeBee

### ▶️ App Launch and Basic Demo

![WeeBee Demo](https://github.com/afzalt3ch/weebee-website-builder/blob/main/screenshots/weebee_demo.gif?raw=true)

### 🧩 F-Droid Clone Built with WeeBee

![F-Droid Clone](https://github.com/afzalt3ch/weebee-website-builder/blob/main/Sites/F-Droid/fdroid_rec.gif?raw=true)

### 🔥 Fitgirl Clone Built with WeeBee

![Fitgirl Clone](https://github.com/afzalt3ch/weebee-website-builder/blob/main/Sites/fitgirl/fitgirl_rec.gif?raw=true)

---

## 📂 Folder Structure

```
weebee-website-builder/
├── Sites/               # Example websites built with WeeBee
├── main-process/        # Electron main & preload scripts
├── src/                 # UI files (index.html, script.js, style.css)
├── screenshots/         # Demo videos (.gif)
├── package.json         # Electron setup & config
├── requirements.txt     # Dependency reference
└── README.md
```

---

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Framework**: Electron.js
- **Export System**: Node.js `fs` and `dialog` APIs

---

## 🚀 Getting Started

### Clone and install:

```bash
git clone https://github.com/afzalt3ch/weebee-website-builder.git
cd weebee-website-builder
npm install
```

### Run the app:

```bash
npm start
```

### Build for production (Windows):

```bash
npm run dist
```

> Output will be in the `dist/` folder.

---

## 📦 Requirements

See [`requirements.txt`](https://github.com/afzalt3ch/weebee-website-builder/blob/main/requirements.txt)

```txt
electron
electron-builder
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">Made with ❤️ by <strong>Afzal T3ch</strong></p>
