console.log("--- APP LOADED: V2.0 DYNAMIC OVERLAYS (No Collapsibles) ---");

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
            y: 0
        }
    ],
    textLayer: {
        enabled: true,
        content: "",
        size: 40,
        color: "#ffffff",
        x: 50,
        y: 50,
        maxWidth: 400,
        bgOpacity: 0
    },
    // Dynamic Array of Overlays
    overlays: []
    // Format: { id: timestamp, image: null, loaded: false, scale: 50, x: 50, y: 50 }
};

const listeners = [];

function subscribe(callback) {
    listeners.push(callback);
}

function notify() {
    listeners.forEach(cb => cb(state));
}

// Deep update helper
function updateState(path, value) {
    const parts = path.split('.');
    let target = state;
    for (let i = 0; i < parts.length - 1; i++) {
        target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = value;
    notify();
}

// Overlay Specific Actions
function addOverlay() {
    const id = Date.now();
    state.overlays.push({
        id: id,
        image: null,
        loaded: false,
        scale: 50,
        x: 50,
        y: 50
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
        y: 0
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


// --- 2. CANVAS ENGINE ---

function drawCanvas(canvas) {
    const ctx = canvas.getContext('2d');

    // 1. Setup Canvas
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
            drawLayer(ctx, overlay, canvas.width, canvas.height); // Reuse drawLayer
        }
    });

    // 4. Draw Text Layer
    if (state.textLayer.enabled && state.textLayer.content) {
        drawText(ctx, canvas.width, canvas.height);
    }
}

function drawText(ctx, canvasW, canvasH) {
    const { content, size, color, x, y, maxWidth, bgOpacity } = state.textLayer;

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

    // For backgrounds (which default to 0,0) and overlays (50,50), the positioning logic
    // depends on where x,y are relative to.
    // In original code: posX = (x/100)*canvasW. And drawn centered at that pos.

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

// Main Render Loop
function renderApp() {
    drawCanvas(canvas);

    // Toggle Placeholder
    // Toggle Placeholder - check if ANY background is loaded
    const hasAnyBg = state.backgrounds.some(b => b.loaded);
    if (hasAnyBg) {
        placeholderStatus.style.display = 'none';
        canvas.style.display = 'block';
    } else {
        placeholderStatus.style.display = 'block';
        canvas.style.display = 'none';
    }
}

// Global variable to track rendered IDs for diffing UI updates
let renderedIDs = [];

function checkIDsMatch() {
    const newIDs = state.overlays.map(o => o.id);
    if (JSON.stringify(newIDs) !== JSON.stringify(renderedIDs)) {
        renderedIDs = newIDs;
        return false;
    }
    return true;
}

// Expose to window for inline events
window.removeOverlay = removeOverlay;
window.updateOverlay = updateOverlay;
window.removeBackground = removeBackground;
window.updateBackground = updateBackground;
window.moveBackgroundUp = moveBackgroundUp;
window.moveBackgroundDown = moveBackgroundDown;

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
                    notify();
                }
            } else if (type === 'background') {
                const item = state.backgrounds.find(b => b.id === id);
                if (item) {
                    item.image = img;
                    item.width = img.naturalWidth;
                    item.height = img.naturalHeight;
                    item.loaded = true; // Flag as loaded

                    // If this is the first load, set defaults based on size?
                    // Currently defaults are x:0, y:0. 
                    // Let's set defaults to Center for better UX?
                    // Original requirement: "Backgrounds... stacked".
                    // If we use centering logic (drawLayer), 0,0 is top-left corner.
                    // Wait, drawLayer uses: posX = (x/100)*CW. DrawX = posX - w/2.
                    // If x=0, posX=0. DrawX = -w/2. This centers the CENTER of image at 0,0.
                    // This creates an image that is 1/4 visible at top-left.
                    // FIX: For Backgrounds, we probably want default x=50, y=50 (Center).
                    item.x = 50;
                    item.y = 50;

                    notify();
                }
            }
        };
        img.src = url;
    }
}

// Render Overlay Controls
function renderOverlayControls() {
    // Diffing optimization skipped for simplicity
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

function createControlCard(item, index, type) {
    const el = document.createElement('div');
    el.className = 'overlay-control-card glass-panel';
    el.style.background = 'rgba(255, 255, 255, 0.03)';
    el.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    el.style.borderRadius = '8px';
    el.style.marginBottom = '12px';
    el.style.padding = '12px';

    const isBg = type === 'background';
    const title = isBg ? `Layer ${index + 1}` : `Image ${index + 1}`;
    const removeFn = isBg ? `removeBackground(${item.id})` : `removeOverlay(${item.id})`;
    const updateFn = isBg ? `updateBackground` : `updateOverlay`;
    const uploadFn = isBg ? `uploadBackgroundImage` : `uploadOverlayImage`;

    // Reordering buttons for Backgrounds
    let reorderHtml = '';
    if (isBg) {
        reorderHtml = `
            <div style="display:flex; gap:4px; margin-right:8px;">
                <button onclick="moveBackgroundDown(${item.id})" class="icon-btn-small" title="Move Down">↓</button>
                <button onclick="moveBackgroundUp(${item.id})" class="icon-btn-small" title="Move Up">↑</button>
            </div>
        `;
    }

    el.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div style="display:flex; align-items:center;">
                ${reorderHtml}
                <h3 style="margin:0; font-size:0.9rem; font-weight:500;">${title}</h3>
            </div>
            <button onclick="${removeFn}" style="background:none; border:none; cursor:pointer; font-size:1.1rem; opacity:0.6;">✖</button>
        </div>
        
        ${!item.loaded ? `
            <div class="file-input-wrapper" style="margin-bottom:10px;">
                    <input type="file" accept="image/*" onchange="${uploadFn}(this, ${item.id})" style="width:100%">
            </div>
        ` : `
            <div style="color:#4ade80; font-size:0.8rem; margin-bottom:8px;">✓ Image Loaded</div>
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
    return el;
}


// Subscriptions
subscribe(() => {
    renderApp();
    renderOverlayControls(); // Note: checkIDsMatch optimization was removed for simplicity during refactor, can re-add if perf slows
    renderBackgroundControls();
});


// --- INITIALIZATION & STATIC LISTENERS ---

// Background Add Button
document.getElementById('add-bg-btn').addEventListener('click', () => {
    addBackground();
});

// Text Listeners
// Toggle listener removed as text is now always enabled
document.getElementById('text-content').addEventListener('input', (e) => updateState('textLayer.content', e.target.value));
document.getElementById('text-size').addEventListener('input', (e) => updateState('textLayer.size', parseInt(e.target.value)));
document.getElementById('text-color').addEventListener('input', (e) => updateState('textLayer.color', e.target.value));
document.getElementById('text-width').addEventListener('input', (e) => updateState('textLayer.maxWidth', parseInt(e.target.value)));
document.getElementById('text-bg-opacity').addEventListener('input', (e) => {
    updateState('textLayer.bgOpacity', parseInt(e.target.value));
    document.getElementById('text-bg-opacity-val').innerText = e.target.value + '%';
});
document.getElementById('text-x').addEventListener('input', (e) => {
    updateState('textLayer.x', parseInt(e.target.value));
    document.getElementById('text-x-val').innerText = e.target.value + '%';
});
document.getElementById('text-y').addEventListener('input', (e) => {
    updateState('textLayer.y', parseInt(e.target.value));
    document.getElementById('text-y-val').innerText = e.target.value + '%';
});


// Add Overlay Button
document.getElementById('add-overlay-btn').addEventListener('click', () => {
    addOverlay();
});


// Download Logic
document.getElementById('download-btn').addEventListener('click', () => {
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

        console.log("Download triggered.");
    }, 'image/png');
});

// Run Initial Render
renderApp();
