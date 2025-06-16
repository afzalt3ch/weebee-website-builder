// Global variables for drag, drop, and resize operations
let isDragging = false;
let currentElement = null;
let offsetX = 0;
let offsetY = 0;
let isResizing = false;
let initialWidth = 0;
let initialHeight = 0;
let initialMouseX = 0;
let initialMouseY = 0;
let isResizingText = false;
let canvas; // The editor drop area
let interactionMode = "move"; // "move" or "select"
let editorFontFamily = "";
let selectedBackgroundColor = "#ffffff";
let initialLeft = 0;
let initialTop = 0;

// Page management variables
let pages = [];
let currentPageIndex = 0;

// Helper: Sanitize a page name to create a valid filename.
function sanitizeFilename(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_\-]/g, '') + '.html';
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize website title and canvas width from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const websiteName = urlParams.get('name');
  const websiteWidth = urlParams.get('width');
  const websiteTitleElement = document.getElementById('websiteTitle');
  if (websiteTitleElement && websiteName) {
    websiteTitleElement.textContent = websiteName;
  }
  
  canvas = document.getElementById('canvas');
  if (websiteWidth) {
    canvas.style.maxWidth = websiteWidth + 'px';
    canvas.style.width = websiteWidth + 'px';
  }
  canvas.style.margin = '0 auto';
  canvas.style.height = "auto";
  canvas.style.overflow = "visible";
  canvas.style.backgroundColor = selectedBackgroundColor;
  
  // Instead of auto-adding a default page, prompt for the first page name.
  showFirstPagePopup();
  
  // Setup draggable sidebar elements.
  const sidebarElements = document.querySelectorAll('.element');
  sidebarElements.forEach(el => {
    el.addEventListener('dragstart', (e) => {
      const rect = e.target.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      e.dataTransfer.setData('type', el.dataset.type);
      e.dataTransfer.setData('offsetX', offsetX);
      e.dataTransfer.setData('offsetY', offsetY);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });
  
  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    canvas.classList.add('dragover');
  });
  canvas.addEventListener('dragleave', () => {
    canvas.classList.remove('dragover');
  });
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    canvas.classList.remove('dragover');
    const type = e.dataTransfer.getData('type');
    const offsetXData = parseFloat(e.dataTransfer.getData('offsetX'));
    const offsetYData = parseFloat(e.dataTransfer.getData('offsetY'));
    const canvasRect = canvas.getBoundingClientRect();
    const x = e.clientX - canvasRect.left + canvas.scrollLeft - offsetXData;
    const y = e.clientY - canvasRect.top + canvas.scrollTop - offsetYData;
    createElement(type, x, y);
    updateCanvasHeight();
  });
  
  canvas.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', () => {
    handleMouseUp();
    updateCanvasHeight();
  });
  
  // Export button for multi-page export
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportWebsite);
  }
  
  // Background Color Button
  const bgColorBtn = document.getElementById('bgColorBtn');
  bgColorBtn.addEventListener('click', function() {
    document.getElementById('bgColorPicker').click();
  });
  const bgColorPicker = document.getElementById('bgColorPicker');
  bgColorPicker.addEventListener('change', function() {
    selectedBackgroundColor = this.value;
    canvas.style.backgroundColor = selectedBackgroundColor;
  });
  
  // Global contextmenu for media, text, and delete actions.
  document.addEventListener('contextmenu', (e) => {
    let mediaContainer = e.target.closest('.image-container') ||
                         e.target.closest('.video-container') ||
                         e.target.closest('.audio-container');
    if (mediaContainer) {
      e.preventDefault();
      showMediaContextMenu(e.pageX, e.pageY, mediaContainer);
      return;
    }
    let selection = window.getSelection();
    if (selection && !selection.isCollapsed && e.target.closest('[contenteditable="true"]')) {
      e.preventDefault();
      showTextContextMenu(e.pageX, e.pageY);
      return;
    }
    let canvasElem = e.target.closest('.canvas-element');
    if (canvasElem) {
      e.preventDefault();
      showDeleteMenu(e.pageX, e.pageY, canvasElem);
      return;
    }
  });
  document.addEventListener('click', () => {
    let menu = document.getElementById('customContextMenu');
    if (menu) menu.style.display = 'none';
    let textMenu = document.getElementById('customTextMenu');
    if (textMenu) textMenu.style.display = 'none';
    let deleteMenu = document.getElementById('customDeleteMenu');
    if (deleteMenu) deleteMenu.style.display = 'none';
  });
  
  // Page-length controls.
  const increaseBtn = document.getElementById('increasePageLength');
  const decreaseBtn = document.getElementById('decreasePageLength');
  if (increaseBtn && decreaseBtn && canvas) {
    increaseBtn.addEventListener('click', () => {
      let currentHeight = canvas.offsetHeight;
      canvas.style.height = (currentHeight + 100) + "px";
    });
    decreaseBtn.addEventListener('click', () => {
      let currentHeight = canvas.offsetHeight;
      let newHeight = currentHeight - 100;
      if (newHeight < 400) newHeight = 400;
      canvas.style.height = newHeight + "px";
    });
  }
  
  // Text formatting toolbar listeners.
  document.querySelectorAll('.format-btn').forEach(btn => {
    if (![ 'applyTextSize', 'toggleMode', 'fontColorBtn', 'bgColorBtn' ].includes(btn.id)) {
      btn.addEventListener('click', function() {
        let command = this.getAttribute('data-command');
        let value = this.getAttribute('data-value') || null;
        document.execCommand(command, false, value);
      });
    }
  });
  
  // Text size control.
  const applyTextSizeBtn = document.getElementById('applyTextSize');
  if (applyTextSizeBtn) {
    applyTextSizeBtn.addEventListener('click', function() {
      let newSize = document.getElementById('textSizeInput').value;
      if (newSize) {
        document.execCommand("fontSize", false, "7");
        let fonts = document.getElementsByTagName("font");
        for (let i = 0; i < fonts.length; i++) {
          if (fonts[i].getAttribute("size") == "7") {
            fonts[i].removeAttribute("size");
            fonts[i].style.fontSize = newSize + "px";
          }
        }
      }
    });
  }
  
  // Font color control.
  const fontColorBtn = document.getElementById('fontColorBtn');
  fontColorBtn.addEventListener('click', function() {
    document.getElementById('colorPickerInput').click();
  });
  const colorPickerInput = document.getElementById('colorPickerInput');
  colorPickerInput.addEventListener('change', function() {
    let chosenColor = this.value;
    document.execCommand("foreColor", false, chosenColor);
  });
  
  // Font family dropdown.
  const fontFamilySelect = document.getElementById('fontFamilySelect');
  fontFamilySelect.addEventListener('change', function() {
    let selectedFont = this.value;
    updateEditorFont(selectedFont);
  });
  
  // Interaction mode toggle.
  const toggleBtn = document.getElementById('toggleMode');
  toggleBtn.addEventListener('click', function() {
    if (interactionMode === "move") {
      interactionMode = "select";
      this.textContent = "Switch to Move Mode";
      canvas.style.cursor = "text";
      document.querySelectorAll('audio.uploaded-audio').forEach(audio => {
        audio.style.pointerEvents = 'auto';
      });
    } else {
      interactionMode = "move";
      this.textContent = "Switch to Select Mode";
      canvas.style.cursor = "default";
      document.querySelectorAll('audio.uploaded-audio').forEach(audio => {
        audio.style.pointerEvents = 'none';
      });
    }
  });
  
  // Page Management: Add page button shows a popup for the new page name.
  document.getElementById('addPageBtn').addEventListener('click', showAddPagePopup);
  
  // Page Management: Clicking on a page from the list.
  document.getElementById('pageList').addEventListener('click', (e) => {
    if (e.target && e.target.matches('li.page-item')) {
      const index = parseInt(e.target.getAttribute('data-index'));
      if (index !== currentPageIndex) {
        saveCurrentPage();
        currentPageIndex = index;
        loadCurrentPage();
        updatePageList();
      }
    }
  });
  
  // Load initial page content (if any)
  loadCurrentPage();
});

function updateEditorFont(selectedFont) {
  editorFontFamily = selectedFont;
  canvas.style.fontFamily = selectedFont;
  let styleId = "editorFontStyle";
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = `#canvas * { font-family: ${selectedFont} !important; }`;
}

function handleMouseDown(e) {
  const target = e.target;
  if (interactionMode === "select" &&
      !target.classList.contains('resize-handle') &&
      !target.classList.contains('text-resize-handle')) {
    return;
  }
  
  if (target.classList.contains('resize-handle')) {
    e.stopPropagation();
    isResizing = true;
    if (target.parentElement.classList.contains('image-container') ||
        target.parentElement.classList.contains('video-container') ||
        target.parentElement.classList.contains('audio-container')) {
      currentElement = target.parentElement.parentElement;
    } else {
      currentElement = target.parentElement;
    }
    initialWidth = currentElement.offsetWidth;
    initialHeight = currentElement.offsetHeight;
    initialMouseX = e.clientX;
    initialMouseY = e.clientY;
    return;
  } else if (target.classList.contains('text-resize-handle')) {
    e.stopPropagation();
    isResizingText = true;
    currentElement = target.parentElement;
    initialWidth = currentElement.offsetWidth;
    initialMouseX = e.clientX;
    return;
  } else if (target.closest('.canvas-element') && interactionMode === "move") {
    isDragging = true;
    currentElement = target.closest('.canvas-element');
    const rect = currentElement.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
  }
}

function handleMouseMove(e) {
  if (isResizingText && currentElement) {
    const deltaX = e.clientX - initialMouseX;
    currentElement.style.width = `${initialWidth + deltaX}px`;
  } else if (isResizing && currentElement) {
    const deltaX = e.clientX - initialMouseX;
    const deltaY = e.clientY - initialMouseY;
    currentElement.style.width = `${initialWidth + deltaX}px`;
    currentElement.style.height = `${initialHeight + deltaY}px`;
  } else if (isDragging && currentElement) {
    const canvasRect = canvas.getBoundingClientRect();
    let newX = e.clientX - offsetX - canvasRect.left + canvas.scrollLeft;
    let newY = e.clientY - offsetY - canvasRect.top + canvas.scrollTop;
    newX = Math.max(0, Math.min(newX, canvas.clientWidth - currentElement.offsetWidth));
    newY = Math.max(0, Math.min(newY, canvas.clientHeight - currentElement.offsetHeight));
    currentElement.style.left = `${newX}px`;
    currentElement.style.top = `${newY}px`;
  }
}

function handleMouseUp() {
  isDragging = false;
  isResizing = false;
  isResizingText = false;
  currentElement = null;
}

function showDeleteMenu(x, y, canvasElem) {
  let menu = document.getElementById('customDeleteMenu');
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'customDeleteMenu';
    menu.style.position = 'absolute';
    menu.style.background = '#fff';
    menu.style.border = '1px solid #ccc';
    menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    menu.style.padding = '5px 0';
    menu.style.zIndex = '10000';
    document.body.appendChild(menu);
  }
  menu.innerHTML = '<div id="deleteOption" style="padding: 5px 20px; cursor: pointer;">Delete</div>';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.style.display = 'block';
  menu.querySelector('#deleteOption').onclick = function() {
    canvasElem.remove();
    menu.style.display = 'none';
  };
}

function showTextContextMenu(x, y) {
  // Placeholder for text context menu if needed.
}

function createElement(type, x, y) {
  if (type === 'table') {
    showTablePopup(x, y);
    return;
  }
  if (type === 'hr') {
    showHrPopup(x, y);
    return;
  }
  if (type === 'id') {
    showIdPopup(x, y);
    return;
  }
  if (type === 'goto') {
    showGotoPopup(x, y);
    return;
  }
  if (type === 'ext') {
    showExtPopup(x, y);
    return;
  }
  if (type === 'frame') {
    // New frame element: prompt for frame settings.
    showFramePopup(x, y);
    return;
  }
  const element = document.createElement('div');
  element.className = 'canvas-element';
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  switch (type) {
    case 'heading':
      element.innerHTML = `
        <h2 contentEditable="true">New Heading</h2>
        <div class="text-resize-handle"></div>
      `;
      element.style.width = '200px';
      break;
    case 'paragraph':
      element.innerHTML = `
        <p contentEditable="true">Start typing...</p>
        <div class="text-resize-handle"></div>
      `;
      element.style.width = '300px';
      break;
    case 'image':
      element.innerHTML = `
        <div class="image-container">
          <div class="image-placeholder">📷 Right-click to upload image</div>
          <div class="resize-handle"></div>
        </div>
      `;
      element.style.width = '300px';
      element.style.height = '200px';
      break;
    case 'video':
      element.innerHTML = `
        <div class="video-container" style="position: relative; width: 100%; height: 100%; background: #f0f0f0;">
          <div class="video-placeholder" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">📹 Right-click to upload video</div>
          <div class="resize-handle"></div>
        </div>
      `;
      element.style.width = '300px';
      element.style.height = '200px';
      break;
    case 'audio':
      element.innerHTML = `
        <div class="audio-container" style="position: relative; width: 100%; background: #f0f0f0; display: flex; align-items:center; justify-content:center;">
          <div class="audio-placeholder">🎵 Right-click to upload audio</div>
        </div>
      `;
      element.style.width = '300px';
      element.style.height = '50px';
      let audioContainer = element.querySelector('.audio-container');
      if (audioContainer) {
        audioContainer.addEventListener('contextmenu', function(e) {
          e.preventDefault();
          showMediaContextMenu(e.pageX, e.pageY, audioContainer);
        });
      }
      break;
    case 'id':
      element.innerHTML = `<p contentEditable="true">Editable text...</p><div class="text-resize-handle"></div>`;
      element.style.width = '300px';
      showIdPopup(x, y, element);
      break;
    case 'goto':
      element.innerHTML = `<a href="" contentEditable="true">Editable link text...</a><div class="text-resize-handle"></div>`;
      element.style.width = '300px';
      showGotoPopup(x, y, element);
      break;
    case 'ext':
      element.innerHTML = `<a class="external-link" href="" contentEditable="true">Editable external link...</a><div class="text-resize-handle"></div>`;
      element.style.width = '300px';
      showExtPopup(x, y, element);
      break;
    case 'ul':
      element.innerHTML = `
        <ul contentEditable="true" style="margin:0; padding:10px;">
          <li>Unordered item 1</li>
          <li>Unordered item 2</li>
        </ul>
        <div class="text-resize-handle"></div>
      `;
      element.style.width = '300px';
      break;
    case 'ol':
      element.innerHTML = `
        <ol contentEditable="true" style="margin:0; padding:10px;">
          <li>Ordered item 1</li>
          <li>Ordered item 2</li>
        </ol>
        <div class="text-resize-handle"></div>
      `;
      element.style.width = '300px';
      break;
    case 'dl':
      element.innerHTML = `
        <dl contentEditable="true" style="margin:0; padding:10px;">
          <dt style="font-weight: bold; padding:5px 0;">Term</dt>
          <dd style="padding:5px 0 5px 20px;">Definition 1</dd>
          <dd style="padding:5px 0 5px 20px;">Definition 2</dd>
        </dl>
        <div class="text-resize-handle"></div>
      `;
      element.style.width = '300px';
      break;
    default:
      break;
  }
  canvas.appendChild(element);
  return element;
}

function showHrPopup(x, y) {
  let popup = document.createElement('div');
  popup.id = "hrPopup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "#fff";
  popup.style.border = "1px solid #ccc";
  popup.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  popup.style.padding = "20px";
  popup.style.zIndex = "3000";
  popup.innerHTML = `
    <h3>Create Horizontal Line</h3>
    <form id="hrForm">
      <label>Thickness: <input type="number" id="hrThickness" min="1" value="2" required /></label><br/><br/>
      <label>Color: <input type="color" id="hrColor" value="#000000" required /></label><br/><br/>
      <label>Style:
        <select id="hrStyle">
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
          <option value="double">Double</option>
        </select>
      </label><br/><br/>
      <button type="submit">Create Line</button>
      <button type="button" id="cancelHr">Cancel</button>
    </form>
  `;
  document.body.appendChild(popup);
  document.getElementById("hrForm").addEventListener("submit", function(e) {
    e.preventDefault();
    let thickness = document.getElementById("hrThickness").value;
    let color = document.getElementById("hrColor").value;
    let hrStyle = document.getElementById("hrStyle").value;
    createHorizontalLineElement(x, y, thickness, color, hrStyle);
    document.body.removeChild(popup);
    updateCanvasHeight();
  });
  document.getElementById("cancelHr").addEventListener("click", function(){
    document.body.removeChild(popup);
  });
}

function createHorizontalLineElement(x, y, thickness, color, styleType) {
  const element = document.createElement('div');
  element.className = 'canvas-element';
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  // Set default container width
  element.style.width = '300px';
  // Create an <hr> that fills the container
  element.innerHTML = `<hr style="border: none; border-top: ${thickness}px ${styleType} ${color}; margin: 0; width: 100%;" />`;
  // Append a text-resize-handle so that the horizontal line's width can be resized like a paragraph.
  const textResizeHandle = document.createElement('div');
  textResizeHandle.className = 'text-resize-handle';
  element.appendChild(textResizeHandle);
  canvas.appendChild(element);
  return element;
}

function showIdPopup(x, y, element) {
  let popup = document.createElement('div');
  popup.id = "idPopup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "#fff";
  popup.style.border = "1px solid #ccc";
  popup.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  popup.style.padding = "20px";
  popup.style.zIndex = "3000";
  popup.innerHTML = `
    <h3>Set ID Tag</h3>
    <form id="idForm">
      <label>ID: <input type="text" id="tagId" required /></label><br/><br/>
      <button type="submit">Apply ID</button>
      <button type="button" id="cancelId">Cancel</button>
    </form>
  `;
  document.body.appendChild(popup);
  document.getElementById("idForm").addEventListener("submit", function(e) {
    e.preventDefault();
    let tagId = document.getElementById("tagId").value;
    if (element) {
      let p = element.querySelector('p');
      if (p) {
        p.id = tagId;
      }
    } else {
      createIdElement(x, y, tagId);
    }
    document.body.removeChild(popup);
    updateCanvasHeight();
  });
  document.getElementById("cancelId").addEventListener("click", function(){
    document.body.removeChild(popup);
  });
}

function createIdElement(x, y, tagId) {
  const element = document.createElement('div');
  element.className = 'canvas-element';
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  element.innerHTML = `<p id="${tagId}" contentEditable="true">Editable text...</p><div class="text-resize-handle"></div>`;
  element.style.width = '300px';
  canvas.appendChild(element);
  return element;
}

function showGotoPopup(x, y, element) {
  let popup = document.createElement('div');
  popup.id = "gotoPopup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "#fff";
  popup.style.border = "1px solid #ccc";
  popup.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  popup.style.padding = "20px";
  popup.style.zIndex = "3000";
  popup.innerHTML = `
    <h3>Set Goto Tag</h3>
    <form id="gotoForm">
      <label>Target ID: <input type="text" id="targetId" required /></label><br/><br/>
      <button type="submit">Apply Link</button>
      <button type="button" id="cancelGoto">Cancel</button>
    </form>
  `;
  document.body.appendChild(popup);
  document.getElementById("gotoForm").addEventListener("submit", function(e) {
    e.preventDefault();
    let targetId = document.getElementById("targetId").value;
    if (element) {
      let a = element.querySelector('a');
      if (a) {
        a.href = "#" + targetId;
      }
    } else {
      createGotoElement(x, y, targetId);
    }
    document.body.removeChild(popup);
    updateCanvasHeight();
  });
  document.getElementById("cancelGoto").addEventListener("click", function(){
    document.body.removeChild(popup);
  });
}

function createGotoElement(x, y, targetId) {
  const element = document.createElement('div');
  element.className = 'canvas-element';
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  element.innerHTML = `<a href="#${targetId}" contentEditable="true">Editable link text...</a><div class="text-resize-handle"></div>`;
  element.style.width = '300px';
  canvas.appendChild(element);
  return element;
}

function showExtPopup(x, y, element) {
  let popup = document.createElement('div');
  popup.id = "extPopup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "#fff";
  popup.style.border = "1px solid #ccc";
  popup.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  popup.style.padding = "20px";
  popup.style.zIndex = "3000";
  popup.innerHTML = `
    <h3>Set External Link Tag</h3>
    <form id="extForm">
      <label>URL: <input type="text" id="extUrl" required /></label><br/><br/>
      <button type="submit">Apply External Link</button>
      <button type="button" id="cancelExt">Cancel</button>
    </form>
  `;
  document.body.appendChild(popup);
  document.getElementById("extForm").addEventListener("submit", function(e) {
    e.preventDefault();
    let extUrl = document.getElementById("extUrl").value;
    if (element) {
      let a = element.querySelector('a');
      if (a) {
        a.href = extUrl;
      }
    } else {
      createExtElement(x, y, extUrl);
    }
    document.body.removeChild(popup);
    updateCanvasHeight();
  });
  document.getElementById("cancelExt").addEventListener("click", function(){
    document.body.removeChild(popup);
  });
}

function createExtElement(x, y, extUrl) {
  const element = document.createElement('div');
  element.className = 'canvas-element';
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  element.innerHTML = `<a class="external-link" href="${extUrl}" contentEditable="true">Editable external link...</a><div class="text-resize-handle"></div>`;
  element.style.width = '300px';
  canvas.appendChild(element);
  return element;
}

function showTablePopup(x, y) {
  let popup = document.createElement('div');
  popup.id = "tablePopup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "#fff";
  popup.style.border = "1px solid #ccc";
  popup.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  popup.style.padding = "20px";
  popup.style.zIndex = "3000";
  popup.innerHTML = `
    <h3>Create Table</h3>
    <form id="tableForm">
      <label>Rows: <input type="number" id="tableRows" min="1" value="2" required /></label><br/><br/>
      <label>Columns: <input type="number" id="tableCols" min="1" value="2" required /></label><br/><br/>
      <label><input type="checkbox" id="centerText" /> Center Text</label><br/><br/>
      <label>Table Style:
        <select id="tableStyle">
          <option value="basic">Basic</option>
          <option value="borderless">Borderless</option>
        </select>
      </label><br/><br/>
      <button type="submit">Create Table</button>
      <button type="button" id="cancelTable">Cancel</button>
    </form>
  `;
  document.body.appendChild(popup);
  document.getElementById("tableForm").addEventListener("submit", function(e) {
    e.preventDefault();
    let rows = parseInt(document.getElementById("tableRows").value);
    let cols = parseInt(document.getElementById("tableCols").value);
    let center = document.getElementById("centerText").checked;
    let tableStyle = document.getElementById("tableStyle").value;
    createTableElement(x, y, rows, cols, center, tableStyle);
    document.body.removeChild(popup);
    updateCanvasHeight();
  });
  document.getElementById("cancelTable").addEventListener("click", function(){
    document.body.removeChild(popup);
  });
}

function createTableElement(x, y, rows, cols, center, tableStyle) {
  const element = document.createElement('div');
  element.className = 'canvas-element';
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  let tableHTML = `<table contentEditable="true" style="width:100%; border-collapse: collapse;`;
  if (center) {
    tableHTML += " text-align: center;";
  }
  tableHTML += `">`;
  for (let i = 0; i < rows; i++) {
    tableHTML += "<tr>";
    for (let j = 0; j < cols; j++) {
      tableHTML += `<td style="border: 1px solid #ccc; padding:8px;">Cell</td>`;
    }
    tableHTML += "</tr>";
  }
  tableHTML += "</table>";
  if (tableStyle === "borderless") {
    tableHTML = tableHTML.replace(/border: 1px solid #ccc;/g, "border: none;");
  }
  element.innerHTML = tableHTML + `<div class="text-resize-handle"></div>`;
  element.style.width = '300px';
  canvas.appendChild(element);
  return element;
}

// ====================
// New Frame Functions
// ====================
function showFramePopup(x, y) {
  let popup = document.createElement('div');
  popup.id = "framePopup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "#fff";
  popup.style.border = "1px solid #ccc";
  popup.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  popup.style.padding = "20px";
  popup.style.zIndex = "3000";
  popup.innerHTML = `
    <h3>Create Frame</h3>
    <form id="frameForm">
      <label>Border Size: <input type="number" id="frameBorderSize" min="1" value="2" required /></label><br/><br/>
      <label>Border Color: <input type="color" id="frameBorderColor" value="#000000" required /></label><br/><br/>
      <label>Fill Color: <input type="color" id="frameFillColor" value="#ffffff" required /></label><br/><br/>
      <button type="submit">Create Frame</button>
      <button type="button" id="cancelFrame">Cancel</button>
    </form>
  `;
  document.body.appendChild(popup);
  document.getElementById("frameForm").addEventListener("submit", function(e) {
    e.preventDefault();
    let borderSize = document.getElementById("frameBorderSize").value;
    let borderColor = document.getElementById("frameBorderColor").value;
    let fillColor = document.getElementById("frameFillColor").value;
    createFrameElement(x, y, borderSize, borderColor, fillColor);
    document.body.removeChild(popup);
    updateCanvasHeight();
  });
  document.getElementById("cancelFrame").addEventListener("click", function(){
    document.body.removeChild(popup);
  });
}

function createFrameElement(x, y, borderSize, borderColor, fillColor) {
  const element = document.createElement('div');
  element.className = 'canvas-element frame-element';
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  element.style.width = '300px';
  element.style.height = '200px';
  element.style.border = `${borderSize}px solid ${borderColor}`;
  element.style.backgroundColor = fillColor;
  element.style.position = "absolute";
  
  // Append a resize handle for free resizing (using the text-resize-handle style like paragraphs)
  const textResizeHandle = document.createElement('div');
  textResizeHandle.className = 'resize-handle';
  element.appendChild(textResizeHandle);
  
  canvas.appendChild(element);
  return element;
}

// ====================
// Page Management Functions
// ====================
function saveCurrentPage() {
  pages[currentPageIndex].content = canvas.innerHTML;
}

function loadCurrentPage() {
  canvas.innerHTML = pages[currentPageIndex].content || "";
  attachMediaListeners();
  updateCanvasHeight();
}

function updatePageList() {
  const pageList = document.getElementById('pageList');
  pageList.innerHTML = "";
  pages.forEach((page, index) => {
    const li = document.createElement('li');
    li.textContent = page.title;
    li.className = "page-item";
    li.setAttribute("data-index", index);
    if (index === currentPageIndex) {
      li.style.fontWeight = "bold";
    }
    pageList.appendChild(li);
  });
}

// Popup to add a new page.
function showAddPagePopup() {
  let popup = document.createElement('div');
  popup.id = "addPagePopup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "#fff";
  popup.style.border = "1px solid #ccc";
  popup.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  popup.style.padding = "20px";
  popup.style.zIndex = "3000";
  popup.innerHTML = `
    <h3>Add New Page</h3>
    <form id="addPageForm">
      <label for="newPageName">Page Name:</label>
      <input type="text" id="newPageName" required />
      <br/><br/>
      <button type="submit">Add Page</button>
      <button type="button" id="cancelAddPage">Cancel</button>
    </form>
  `;
  document.body.appendChild(popup);
  document.getElementById("addPageForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const newPageName = document.getElementById("newPageName").value.trim();
    if (newPageName !== "") {
      addNewPage(newPageName);
    }
    document.body.removeChild(popup);
  });
  document.getElementById("cancelAddPage").addEventListener("click", function() {
    document.body.removeChild(popup);
  });
}

function addNewPage(pageName) {
  saveCurrentPage();
  const newPageIndex = pages.length;
  pages.push({
    title: pageName,
    filename: sanitizeFilename(pageName),
    content: ""
  });
  currentPageIndex = newPageIndex;
  updatePageList();
  loadCurrentPage();
}

// Popup for the first page name.
function showFirstPagePopup() {
  let popup = document.createElement('div');
  popup.id = "firstPagePopup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "#fff";
  popup.style.border = "1px solid #ccc";
  popup.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  popup.style.padding = "20px";
  popup.style.zIndex = "3000";
  popup.innerHTML = `
    <h3>Enter First Page Name</h3>
    <form id="firstPageForm">
      <label for="firstPageName">Page Name:</label>
      <input type="text" id="firstPageName" required />
      <br/><br/>
      <button type="submit">OK</button>
    </form>
  `;
  document.body.appendChild(popup);
  document.getElementById("firstPageForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const firstPageName = document.getElementById("firstPageName").value.trim();
    addFirstPage(firstPageName !== "" ? firstPageName : "Page 1");
    document.body.removeChild(popup);
  });
}

function addFirstPage(pageName) {
  pages.push({
    title: pageName,
    filename: sanitizeFilename(pageName),
    content: ""
  });
  currentPageIndex = 0;
  updatePageList();
  loadCurrentPage();
}

// Attach media listeners after load.
function attachMediaListeners() {
  const mediaContainers = canvas.querySelectorAll('.image-container, .video-container, .audio-container');
  mediaContainers.forEach(container => {
    container.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      showMediaContextMenu(e.pageX, e.pageY, container);
    });
  });
}

// Helper: Extract website content from exported HTML.
function extractWebsiteContent(html) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const container = doc.querySelector('.website-container');
    return container ? container.innerHTML : html;
  } catch (e) {
    return html;
  }
}

// ====================
// Export Functionality
// ====================
async function exportWebsite() {
  try {
    saveCurrentPage();
    const response = await fetch('export.css');
    if (!response.ok) {
      throw new Error('Could not load export CSS for final website styling');
    }
    const exportStyle = await response.text();
    
    // Scan each page's content for media files.
    let mediaFilesMap = {};
    let exportedPages = pages.map((page) => {
      let tempContainer = document.createElement('div');
      tempContainer.innerHTML = page.content;
      const mediaElements = tempContainer.querySelectorAll('img, video, audio');
      mediaElements.forEach(el => {
        let src = el.getAttribute('src');
        if (src && src.startsWith('file://')) {
          let sourcePath = src.slice(7);
          let baseName = sourcePath.split(/[/\\]/).pop();
          mediaFilesMap[sourcePath] = baseName;
          el.setAttribute('src', baseName);
        }
      });
      tempContainer.querySelectorAll('.resize-handle, .text-resize-handle').forEach(handle => handle.remove());
      tempContainer.querySelectorAll('a.external-link').forEach(anchor => {
        anchor.removeAttribute("contentEditable");
      });
      return {
        filename: page.filename,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${page.title}</title>
  <style>
    ${exportStyle}
    body {
      background: ${selectedBackgroundColor} !important;
      color: #333;
      line-height: 1.6;
    }
    .website-container { font-family: ${canvas.style.fontFamily || editorFontFamily} !important; }
    .website-container {
      max-width: ${canvas.style.maxWidth};
      margin: 0 auto;
      position: relative;
      min-height: 100vh;
      padding: 20px;
    }
    .canvas-element {
      position: absolute;
    }
  </style>
</head>
<body>
  <div class="website-container">
    ${tempContainer.innerHTML}
  </div>
  <script>
    document.addEventListener('click', function(e) {
      var target = e.target;
      if(target.tagName.toLowerCase() === 'a' && target.getAttribute('href').startsWith('#')) {
        e.preventDefault();
        var id = target.getAttribute('href').substring(1);
        var dest = document.getElementById(id);
        if(dest) {
          dest.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  </script>
</body>
</html>
        `
      };
    });
    
    const mediaFiles = Object.keys(mediaFilesMap).map(source => {
      return { source, filename: mediaFilesMap[source] };
    });
    
    const websiteData = {
      pages: exportedPages,
      mediaFiles: mediaFiles
    };
    
    window.electronAPI.exportWebsite(websiteData);
  } catch (error) {
    alert('Export failed: ' + error.message);
  }
}

function updateCanvasHeight() {
  const currentScrollTop = canvas.scrollTop;
  let maxBottom = 0;
  const children = canvas.children;
  for (let i = 0; i < children.length; i++) {
    const childBottom = children[i].offsetTop + children[i].offsetHeight;
    if (childBottom > maxBottom) {
      maxBottom = childBottom;
    }
  }
  let currentHeight = parseInt(window.getComputedStyle(canvas).height) || 600;
  if (maxBottom > currentHeight) {
    canvas.style.height = maxBottom + "px";
  }
  canvas.scrollTop = currentScrollTop;
}

function showMediaContextMenu(x, y, mediaContainer) {
  let menu = document.getElementById('customContextMenu');
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'customContextMenu';
    menu.style.position = 'absolute';
    menu.style.background = '#fff';
    menu.style.border = '1px solid #ccc';
    menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    menu.style.padding = '5px 0';
    menu.style.zIndex = '10000';
    document.body.appendChild(menu);
  }
  menu.innerHTML = `
    <div id="selectMediaOption" style="padding: 5px 20px; cursor: pointer;">Select File</div>
    <div id="deleteMediaOption" style="padding: 5px 20px; cursor: pointer;">Delete</div>
  `;
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.style.display = 'block';
  menu.querySelector('#selectMediaOption').onclick = async function () {
    let filePath;
    if (mediaContainer.classList.contains('video-container')) {
      filePath = await window.electronAPI.selectVideo();
    } else if (mediaContainer.classList.contains('audio-container')) {
      filePath = await window.electronAPI.selectAudio();
    } else {
      filePath = await window.electronAPI.selectImage();
    }
    if (filePath) {
      if (!filePath.startsWith('file://')) {
        filePath = `file://${filePath}`;
      }
      const placeholderSelector = mediaContainer.classList.contains('video-container')
        ? '.video-placeholder'
        : mediaContainer.classList.contains('audio-container')
          ? '.audio-placeholder'
          : '.image-placeholder';
      const placeholder = mediaContainer.querySelector(placeholderSelector);
      if (placeholder) {
        placeholder.remove();
      }
      mediaContainer.style.background = 'transparent';
      if (mediaContainer.parentElement) {
        mediaContainer.parentElement.style.background = 'transparent';
      }
      if (mediaContainer.classList.contains('video-container')) {
        let videoEl = mediaContainer.querySelector('video.uploaded-video');
        if (!videoEl) {
          videoEl = document.createElement('video');
          videoEl.className = 'uploaded-video';
          videoEl.src = filePath;
          videoEl.controls = true;
          videoEl.style.display = 'block';
          videoEl.style.width = '100%';
          videoEl.style.height = '100%';
          videoEl.style.objectFit = 'contain';
          videoEl.style.pointerEvents = 'auto';
          mediaContainer.insertBefore(videoEl, mediaContainer.firstChild);
          videoEl.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            showMediaContextMenu(e.pageX, e.pageY, mediaContainer);
          });
        } else {
          videoEl.src = filePath;
        }
      } else if (mediaContainer.classList.contains('audio-container')) {
        let audioEl = mediaContainer.querySelector('audio.uploaded-audio');
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.className = 'uploaded-audio';
          audioEl.src = filePath;
          audioEl.controls = true;
          audioEl.style.display = 'block';
          audioEl.style.width = '100%';
          audioEl.style.pointerEvents = interactionMode === "move" ? 'none' : 'auto';
          mediaContainer.insertBefore(audioEl, mediaContainer.firstChild);
          audioEl.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            showMediaContextMenu(e.pageX, e.pageY, mediaContainer);
          });
        } else {
          audioEl.src = filePath;
        }
      } else {
        let img = mediaContainer.querySelector('img.uploaded-image');
        if (!img) {
          img = document.createElement('img');
          img.className = 'uploaded-image';
          img.src = filePath;
          img.style.display = 'block';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          img.style.pointerEvents = 'auto';
          mediaContainer.insertBefore(img, mediaContainer.firstChild);
        } else {
          img.src = filePath;
        }
      }
    }
    menu.style.display = 'none';
  };
  menu.querySelector('#deleteMediaOption').onclick = function () {
    let canvasElem = mediaContainer.closest('.canvas-element');
    if (canvasElem) {
      canvasElem.remove();
    }
    menu.style.display = 'none';
  };
}

function showImageContextMenu(x, y, imageContainer) {
  showMediaContextMenu(x, y, imageContainer);
}
const toggleButton = document.getElementById('toggleMode');
  
    toggleButton.addEventListener('click', function() {
      // Toggle dark-mode class on button
      this.classList.toggle('dark-mode');
  
      // Change button text based on the mode
      if (this.classList.contains('dark-mode')) {
        this.textContent = 'Switch to Light Mode'; // Text for dark mode
      } else {
        this.textContent = 'Switch to Select Mode'; // Text for light mode
      }
    });