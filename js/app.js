console.log("--- APP LOADED: V2.1 FIXED ---");

// --- 1. STATE MANAGEMENT ---

const state = {
    // Dynamic Array of Backgrounds (Index 0 = Bottom)
    backgrounds: [
        {
            id: Date.now(),
            image: null,
            loaded: false,
            width: 0,
            height: 0,
            opacity: 100,
            scale: 100,
            x: 0,
            y: 0,
            expanded: true,
            filename: null
        }
    ],
    // Dynamic Array of Texts (Index 0 = Bottom)
    texts: [],
    // Dynamic Array of Overlays
    overlays: []
    // Format: { id: timestamp, image: null, loaded: false, scale: 50, x: 50, y: 50, expanded: true, filename: null }
};

const listeners = [];

function subscribe(callback) {
    listeners.push(callback);
}

function notify() {
    listeners.forEach(cb => cb(state));
}

// Overlay Specific Actions
function addOverlay() {
    state.overlays.push({
        id: Date.now(),
        image: null,
        loaded: false,
        scale: 50,
        x: 50,
        y: 50,
        expanded: true,
        filename: null
    });
    notify();
}

function removeOverlay(id) {
    state.overlays = state.overlays.filter(o => o.id !== id);
    notify();
}

function updateOverlay(id, prop, value) {
    const overlay = state.overlays.find(o => o.id === id);
    if (overlay) {
        overlay[prop] = value;
        notify();
    }
}

// Background Specific Actions
function addBackground() {
    state.backgrounds.push({
        id: Date.now(),
        image: null,
        loaded: false,
        width: 0,
        height: 0,
        opacity: 100,
        scale: 100,
        x: 0,
        y: 0,
        expanded: true,
        filename: null
    });
    notify();
}

function removeBackground(id) {
    state.backgrounds = state.backgrounds.filter(b => b.id !== id);
    notify();
}

function updateBackground(id, prop, value) {
    const bg = state.backgrounds.find(b => b.id === id);
    if (bg) {
        bg[prop] = value;
        notify();
    }
}

function moveBackgroundUp(id) {
    const idx = state.backgrounds.findIndex(b => b.id === id);
    if (idx < state.backgrounds.length - 1) {
        const temp = state.backgrounds[idx];
        state.backgrounds[idx] = state.backgrounds[idx + 1];
        state.backgrounds[idx + 1] = temp;
        notify();
    }
}

function moveBackgroundDown(id) {
    const idx = state.backgrounds.findIndex(b => b.id === id);
    if (idx > 0) {
        const temp = state.backgrounds[idx];
        state.backgrounds[idx] = state.backgrounds[idx - 1];
        state.backgrounds[idx - 1] = temp;
        notify();
    }
}

// Text Specific Actions
function addText() {
    state.texts.push({
        id: Date.now(),
        content: "New Text",
        size: 40,
        color: "#ffffff",
        x: 50,
        y: 50,
        maxWidth: 400,
        bgOpacity: 0,
        expanded: true
    });
    notify();
}

function removeText(id) {
    state.texts = state.texts.filter(t => t.id !== id);
    notify();
}

function updateText(id, prop, value) {
    const text = state.texts.find(t => t.id === id);
    if (text) {
        text[prop] = value;
        notify();
    }
}

function moveTextUp(id) {
    const idx = state.texts.findIndex(t => t.id === id);
    if (idx < state.texts.length - 1) {
        const temp = state.texts[idx];
        state.texts[idx] = state.texts[idx + 1];
        state.texts[idx + 1] = temp;
        notify();
    }
}

function moveTextDown(id) {
    const idx = state.texts.findIndex(t => t.id === id);
    if (idx > 0) {
        const temp = state.texts[idx];
        state.texts[idx] = state.texts[idx - 1];
        state.texts[idx - 1] = temp;
        notify();
    }
}

// Common Toggle Action
function toggleLayerExpansion(id, type) {
    let list;
    if (type === 'background') list = state.backgrounds;
    if (type === 'overlay') list = state.overlays;
    if (type === 'text') list = state.texts;

    const item = list.find(i => i.id === id);
    if (item) {
        item.expanded = !item.expanded;
        notify();
    }
}


// --- 2. CANVAS ENGINE ---

function drawCanvas(canvas) {
    const ctx = canvas.getContext('2d');

    // 1. Setup Canvas Dimensions
    // Find the largest natural dimensions among loaded backgrounds
    let maxWidth = 800;
    let maxHeight = 600;
    const loadedBgs = state.backgrounds.filter(b => b.loaded);

    if (loadedBgs.length === 0) {
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Determine Canvas Size based on largest loaded background
    loadedBgs.forEach(bg => {
        if (bg.width > maxWidth) maxWidth = bg.width;
        if (bg.height > maxHeight) maxHeight = bg.height;
    });

    canvas.width = maxWidth;
    canvas.height = maxHeight;

    // 2. Draw Backgrounds (Bottom to Top)
    state.backgrounds.forEach(bg => {
        if (bg.loaded && bg.image) {
            drawLayer(ctx, bg, canvas.width, canvas.height);
        }
    });

    // 3. Draw Dynamic Overlays (under text)
    state.overlays.forEach(overlay => {
        if (overlay.loaded && overlay.image) {
            drawLayer(ctx, overlay, canvas.width, canvas.height);
        }
    });

    // 4. Draw Text Layers
    state.texts.forEach(textItem => {
        drawText(ctx, textItem, canvas.width, canvas.height);
    });
}

function drawText(ctx, textItem, canvasW, canvasH) {
    const { content, size, color, x, y, maxWidth, bgOpacity } = textItem;

    ctx.font = `${size}px 'Outfit', sans-serif`;
    ctx.textBaseline = 'top';

    const posX = (x / 100) * canvasW;
    const posY = (y / 100) * canvasH;

    const lineHeight = size * 1.2;
    let currentY = posY;

    const paragraphs = content.split('\n');
    let allLinesToDraw = [];

    // Measure wrapping
    ctx.font = `${size}px 'Outfit', sans-serif`;
    paragraphs.forEach(paragraph => {
        const pWords = paragraph.split(' ');
        let currentLine = '';

        for (let n = 0; n < pWords.length; n++) {
            const testLine = currentLine + pWords[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                allLinesToDraw.push(currentLine);
                currentLine = pWords[n] + ' ';
            } else {
                currentLine = testLine;
            }
        }
        allLinesToDraw.push(currentLine);
    });

    // Draw Background rect
    if (bgOpacity > 0) {
        const padding = size * 0.5;
        let maxLineWidth = 0;
        allLinesToDraw.forEach(l => {
            const m = ctx.measureText(l);
            if (m.width > maxLineWidth) maxLineWidth = m.width;
        });

        const totalHeight = allLinesToDraw.length * lineHeight;

        ctx.fillStyle = `rgba(0, 0, 0, ${bgOpacity / 100})`;
        ctx.fillRect(
            posX - padding,
            posY - padding,
            maxLineWidth + (padding * 2),
            totalHeight + (padding * 2)
        );
    }

    // Draw Text
    ctx.fillStyle = color;
    allLinesToDraw.forEach(l => {
        ctx.fillText(l, posX, currentY);
        currentY += lineHeight;
    });
}

function drawLayer(ctx, layer, canvasW, canvasH) {
    const { image, scale, x, y, opacity } = layer;

    // Default opacity to 100 if undefined (legacy safety)
    const op = opacity !== undefined ? opacity : 100;

    const w = image.naturalWidth * (scale / 100);
    const h = image.naturalHeight * (scale / 100);

    const posX = (x / 100) * canvasW;
    const posY = (y / 100) * canvasH;

    // Center the image at the position
    const drawX = posX - (w / 2);
    const drawY = posY - (h / 2);

    ctx.save();
    ctx.globalAlpha = op / 100;
    ctx.drawImage(image, drawX, drawY, w, h);
    ctx.restore();
}


// --- 3. UI GENERATION & EVENTS ---

const canvas = document.getElementById('main-canvas');
const placeholderStatus = document.getElementById('placeholder-msg');
const overlaysList = document.getElementById('overlays-list');
const bgList = document.getElementById('bg-list');
const textList = document.getElementById('text-list');

// Main Render Loop
function renderApp() {
    drawCanvas(canvas);

    // Toggle Placeholder
    const hasAnyBg = state.backgrounds.some(b => b.loaded);
    if (hasAnyBg) {
        placeholderStatus.style.display = 'none';
        canvas.style.display = 'block';
    } else {
        placeholderStatus.style.display = 'block';
        canvas.style.display = 'none';
    }
}

// Expose to window for inline events
window.removeOverlay = removeOverlay;
window.updateOverlay = updateOverlay;
window.removeBackground = removeBackground;
window.updateBackground = updateBackground;
window.moveBackgroundUp = moveBackgroundUp;
window.moveBackgroundDown = moveBackgroundDown;
window.toggleLayerExpansion = toggleLayerExpansion;

window.removeText = removeText;
window.updateText = updateText;
window.moveTextUp = moveTextUp;
window.moveTextDown = moveTextDown;

window.uploadOverlayImage = function (input, id) {
    handleFileUpload(input, id, 'overlay');
};

window.uploadBackgroundImage = function (input, id) {
    handleFileUpload(input, id, 'background');
};

function handleFileUpload(input, id, type) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            if (type === 'overlay') {
                const item = state.overlays.find(o => o.id === id);
                if (item) {
                    item.image = img;
                    item.loaded = true;
                    item.filename = file.name;
                    notify();
                }
            } else if (type === 'background') {
                const item = state.backgrounds.find(b => b.id === id);
                if (item) {
                    // Check if this is a restore/swap (has filename) or a fresh layer
                    const isFreshLayer = !item.filename;

                    item.image = img;
                    item.width = img.naturalWidth;
                    item.height = img.naturalHeight;
                    item.loaded = true;
                    item.filename = file.name;

                    // Only default to Center if it's a fresh layer (initialized at 0,0)
                    // If it has a filename (loaded from settings), keep the saved x/y.
                    if (isFreshLayer) {
                        item.x = 50;
                        item.y = 50;
                    }

                    notify();
                }
            }
        };
        img.src = url;
    }
}

function createControlCard(item, index, type) {
    const el = document.createElement('div');
    el.className = 'overlay-control-card glass-panel';
    el.style.background = 'rgba(255, 255, 255, 0.03)';
    el.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    el.style.borderRadius = '8px';
    el.style.marginBottom = '12px';
    el.style.padding = '12px';

    const isBg = type === 'background';
    const isText = type === 'text';

    let title = `Image ${index + 1}`;
    if (isBg) title = `Layer ${index + 1}`;
    if (isText) title = `Text ${index + 1}`;

    let removeFn = `removeOverlay(${item.id})`;
    if (isBg) removeFn = `removeBackground(${item.id})`;
    if (isText) removeFn = `removeText(${item.id})`;

    const updateFn = isBg ? `updateBackground` : (isText ? `updateText` : `updateOverlay`);
    const uploadFn = isBg ? `uploadBackgroundImage` : `uploadOverlayImage`;

    // Reordering buttons for Backgrounds and Texts
    let reorderHtml = '';
    if (isBg || isText) {
        const moveDownFn = isBg ? `moveBackgroundDown(${item.id})` : `moveTextDown(${item.id})`;
        const moveUpFn = isBg ? `moveBackgroundUp(${item.id})` : `moveTextUp(${item.id})`;

        reorderHtml = `
            <div style="display:flex; gap:4px; margin-right:8px;" onclick="event.stopPropagation()">
                <button onclick="${moveDownFn}" class="icon-btn-small" title="Move Down">↓</button>
                <button onclick="${moveUpFn}" class="icon-btn-small" title="Move Up">↑</button>
            </div>
        `;
    }

    // Header Part
    const isExpanded = item.expanded !== false; // Default true if undefined
    const arrowChar = isExpanded ? '▼' : '▶';

    let innerHTML = `
        <div class="clickable" onclick="toggleLayerExpansion(${item.id}, '${type}')" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; cursor:pointer;">
            <div style="display:flex; align-items:center;">
                <span class="arrow" style="margin-right:8px;">${arrowChar}</span>
                ${reorderHtml}
                <h3 style="margin:0; font-size:0.9rem; font-weight:500;">${title}</h3>
            </div>
            <button onclick="event.stopPropagation(); ${removeFn}" style="background:none; border:none; cursor:pointer; font-size:1.1rem; opacity:0.6;">✖</button>
        </div>
    `;

    // Content Wrapper start
    innerHTML += `<div class="${isExpanded ? '' : 'hidden'}" style="${isExpanded ? '' : 'display:none;'}">`;

    // Content Part
    if (isText) {
        innerHTML += `
            <div class="controls">
                <textarea 
                    oninput="updateText(${item.id}, 'content', this.value)" 
                    placeholder="Enter your text here...">${item.content}</textarea>

                <div class="row">
                    <label>
                        <span>Font Size (px)</span>
                        <input type="number" value="${item.size}" min="10" 
                               oninput="updateText(${item.id}, 'size', parseInt(this.value))">
                    </label>
                    <label>
                        <span>Color</span>
                        <input type="color" value="${item.color}" 
                               oninput="updateText(${item.id}, 'color', this.value)">
                    </label>
                </div>

                <div class="row">
                    <label>
                        <span>Background Opacity</span>
                        <span class="val-display">${item.bgOpacity}%</span>
                        <input type="range" min="0" max="100" value="${item.bgOpacity}"
                               oninput="updateText(${item.id}, 'bgOpacity', parseInt(this.value)); this.previousElementSibling.textContent = this.value + '%'">
                    </label>
                    <label>
                        <span>Max Width (px)</span>
                        <input type="number" value="${item.maxWidth}" min="50"
                               oninput="updateText(${item.id}, 'maxWidth', parseInt(this.value))">
                    </label>
                </div>

                <div class="row">
                    <label>
                        <span>Horizontal Position</span>
                        <span class="val-display">${item.x}%</span>
                        <input type="range" min="0" max="100" value="${item.x}"
                               oninput="updateText(${item.id}, 'x', parseInt(this.value)); this.previousElementSibling.textContent = this.value + '%'">
                    </label>
                    <label>
                        <span>Vertical Position</span>
                        <span class="val-display">${item.y}%</span>
                        <input type="range" min="0" max="100" value="${item.y}"
                               oninput="updateText(${item.id}, 'y', parseInt(this.value)); this.previousElementSibling.textContent = this.value + '%'">
                    </label>
                </div>
            </div>
        `;
    } else {
        // Image / Overlay Controls
        const placeholderText = item.filename ? `Waiting for: <strong>${item.filename}</strong>` : '';
        const inputLabelStr = item.filename ? `Re-upload Image` : `Upload Image`;

        innerHTML += `
            ${!item.loaded ? `
                <div class="file-input-wrapper" style="margin-bottom:10px;">
                        ${placeholderText ? `<div style="font-size:0.8rem; color: #facc15; margin-bottom:4px; word-break:break-all;">${placeholderText}</div>` : ''}
                        <input type="file" accept="image/*" onchange="${uploadFn}(this, ${item.id})" style="width:100%">
                </div>
            ` : `
                <div style="color:#4ade80; font-size:0.8rem; margin-bottom:8px; word-break: break-all; white-space: normal;">✓ ${item.filename || 'Image Loaded'}</div>
            `}

            <div class="${!item.loaded ? 'hidden' : ''}">
                 <div class="row" style="margin-bottom:8px">
                    <label style="display:flex; justify-content:space-between; width:100%; font-size:0.85rem;">
                        Opacity <span class="val-display-static">${item.opacity !== undefined ? item.opacity : 100}%</span>
                    </label>
                    <input type="range" min="0" max="100" value="${item.opacity !== undefined ? item.opacity : 100}" style="width:100%"
                            oninput="${updateFn}(${item.id}, 'opacity', parseInt(this.value)); this.previousElementSibling.querySelector('span').textContent = this.value + '%'">
                </div>
                <div class="row" style="margin-bottom:8px">
                    <label style="display:flex; justify-content:space-between; width:100%; font-size:0.85rem;">
                        Scale <span class="val-display-static">${item.scale}%</span>
                    </label>
                    <input type="range" min="1" max="200" value="${item.scale}" style="width:100%"
                            oninput="${updateFn}(${item.id}, 'scale', parseInt(this.value)); this.previousElementSibling.querySelector('span').textContent = this.value + '%'">
                </div>
                <div class="row" style="margin-bottom:8px">
                    <label style="display:flex; justify-content:space-between; width:100%; font-size:0.85rem;">
                        Horizontal <span class="val-display-static">${item.x}%</span>
                    </label>
                    <input type="range" min="0" max="100" value="${item.x}" style="width:100%"
                            oninput="${updateFn}(${item.id}, 'x', parseInt(this.value)); this.previousElementSibling.querySelector('span').textContent = this.value + '%'">
                </div>
                <div class="row" style="margin-bottom:0px">
                    <label style="display:flex; justify-content:space-between; width:100%; font-size:0.85rem;">
                        Vertical <span class="val-display-static">${item.y}%</span>
                    </label>
                    <input type="range" min="0" max="100" value="${item.y}" style="width:100%"
                            oninput="${updateFn}(${item.id}, 'y', parseInt(this.value)); this.previousElementSibling.querySelector('span').textContent = this.value + '%'">
                </div>
            </div>
        `;
    }

    innerHTML += `</div>`; // Close content wrapper

    el.innerHTML = innerHTML;
    return el;
}


function renderOverlayControls() {
    overlaysList.innerHTML = '';
    state.overlays.forEach((overlay, index) => {
        overlaysList.appendChild(createControlCard(overlay, index, 'overlay'));
    });
}

function renderBackgroundControls() {
    bgList.innerHTML = '';
    state.backgrounds.forEach((bg, index) => {
        bgList.appendChild(createControlCard(bg, index, 'background'));
    });
}

function renderTextControls() {
    textList.innerHTML = '';
    state.texts.forEach((text, index) => {
        textList.appendChild(createControlCard(text, index, 'text'));
    });
}


// Subscriptions
subscribe(() => {
    renderApp();
    renderOverlayControls();
    renderBackgroundControls();
    renderTextControls();
});


// --- INITIALIZATION & STATIC LISTENERS ---

function toggleSection(elementId, arrowId) {
    const el = document.getElementById(elementId);
    const arrow = document.getElementById(arrowId);
    if (el && arrow) {
        const isHidden = el.classList.contains('hidden') || window.getComputedStyle(el).display === 'none';

        if (isHidden) {
            el.classList.remove('hidden');
            el.style.display = '';
            arrow.textContent = '▼';
        } else {
            el.classList.add('hidden');
            el.style.display = 'none';
            arrow.textContent = '▶';
        }
    }
}
window.toggleSection = toggleSection;

function expandSection(elementId, arrowId) {
    const el = document.getElementById(elementId);
    const arrow = document.getElementById(arrowId);
    if (el && arrow) {
        el.classList.remove('hidden');
        el.style.display = '';
        arrow.textContent = '▼';
    }
}

function setupCollapsibles() {
    const sections = [
        { headerId: 'header-bg', listId: 'bg-list', arrowId: 'bg-arrow' },
        { headerId: 'header-text', listId: 'text-list', arrowId: 'text-arrow' },
        { headerId: 'header-overlays', listId: 'overlays-list', arrowId: 'overlay-arrow' }
    ];

    sections.forEach(({ headerId, listId, arrowId }) => {
        const header = document.getElementById(headerId);
        if (header) {
            header.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') return;
                toggleSection(listId, arrowId);
            });
        }
    });

    // Auto-expand on Add Button Click
    const bgBtn = document.getElementById('add-bg-btn');
    if (bgBtn) bgBtn.addEventListener('click', () => expandSection('bg-list', 'bg-arrow'));

    const textBtn = document.getElementById('add-text-btn');
    if (textBtn) textBtn.addEventListener('click', () => expandSection('text-list', 'text-arrow'));

    const overlayBtn = document.getElementById('add-overlay-btn');
    if (overlayBtn) overlayBtn.addEventListener('click', () => expandSection('overlays-list', 'overlay-arrow'));
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log("Setting up collapsibles...");
    setupCollapsibles();
});

// Background Add Button
const bgBtn = document.getElementById('add-bg-btn');
if (bgBtn) {
    bgBtn.addEventListener('click', () => {
        console.log("Add BG Clicked");
        addBackground();
    });
}

// Text Listeners
const textBtn = document.getElementById('add-text-btn');
if (textBtn) {
    textBtn.addEventListener('click', () => {
        console.log("Add Text Clicked");
        addText();
    });
}

// Add Overlay Button
const overlayBtn = document.getElementById('add-overlay-btn');
if (overlayBtn) {
    overlayBtn.addEventListener('click', () => {
        console.log("Add Overlay Clicked");
        addOverlay();
    });
}


// Save Settings
function saveSettings() {
    // Create a deep copy of state to modify for export
    const exportState = JSON.parse(JSON.stringify(state));

    // Strip image data (too large) and loaded status
    // We only want to save the configuration (names, positions, sizes, text)
    exportState.backgrounds.forEach(b => {
        b.image = null;
        b.loaded = false;
        // filename is kept
    });
    exportState.overlays.forEach(o => {
        o.image = null;
        o.loaded = false;
        // filename is kept
    });
    // Texts can be saved as is

    const data = JSON.stringify(exportState, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `overlay-project.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Load Settings
function loadSettings(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const loadedState = JSON.parse(e.target.result);

            // Basic validation
            if (!loadedState.backgrounds || !loadedState.overlays || !loadedState.texts) {
                alert("Invalid settings file.");
                return;
            }

            // Restore state
            state.backgrounds = loadedState.backgrounds || [];
            state.overlays = loadedState.overlays || [];
            state.texts = loadedState.texts || [];

            // Images are naturally null from the save process, so loaded=false remains correct
            // The renderer will see "filename" but "loaded=false" and show the prompt

            notify();
            alert("Settings loaded. Please re-upload the images where prompted.");
        } catch (err) {
            console.error(err);
            alert("Error parsing settings file.");
        }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = '';
}

// Event Listeners for Save/Load
const saveBtn = document.getElementById('save-btn');
if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
}

const openBtn = document.getElementById('open-btn');
const settingsInput = document.getElementById('settings-input');
if (openBtn && settingsInput) {
    openBtn.addEventListener('click', () => {
        settingsInput.click();
    });
    settingsInput.addEventListener('change', loadSettings);
}


// Download Logic
const downloadBtn = document.getElementById('download-btn');
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        const hasAnyBg = state.backgrounds.some(b => b.loaded);
        if (!hasAnyBg) {
            alert("Please upload a background image first.");
            return;
        }

        drawCanvas(canvas);

        canvas.toBlob((originalBlob) => {
            if (!originalBlob) {
                alert("Failed to export.");
                return;
            }

            const blob = new Blob([originalBlob], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `composition-${timestamp}.png`;
            link.href = url;

            document.body.appendChild(link);
            link.click();
        }, 'image/png');
    });
}

// Run Initial Render
renderApp();
renderOverlayControls();
renderBackgroundControls();
renderTextControls();
