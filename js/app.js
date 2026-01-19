console.log("--- APP LOADED: V2.0 DYNAMIC OVERLAYS (No Collapsibles) ---");

// --- 1. STATE MANAGEMENT ---

const state = {
    background: {
        image: null,
        loaded: false,
        width: 0,
        height: 0
    },
    textLayer: {
        enabled: false,
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


// --- 2. CANVAS ENGINE ---

function drawCanvas(canvas) {
    const ctx = canvas.getContext('2d');

    // 1. Setup Canvas
    if (!state.background.loaded || !state.background.image) {
        canvas.width = 800;
        canvas.height = 600;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    canvas.width = state.background.width;
    canvas.height = state.background.height;

    // 2. Draw Background
    ctx.drawImage(state.background.image, 0, 0);

    // 3. Draw Dynamic Overlays (under text)
    state.overlays.forEach(overlay => {
        if (overlay.loaded && overlay.image) {
            drawOverlay(ctx, overlay, canvas.width, canvas.height);
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

function drawOverlay(ctx, layer, canvasW, canvasH) {
    const { image, scale, x, y } = layer;
    const w = image.naturalWidth * (scale / 100);
    const h = image.naturalHeight * (scale / 100);

    const posX = (x / 100) * canvasW;
    const posY = (y / 100) * canvasH;

    const drawX = posX - (w / 2);
    const drawY = posY - (h / 2);

    ctx.drawImage(image, drawX, drawY, w, h);
}


// --- 3. UI GENERATION & EVENTS ---

const canvas = document.getElementById('main-canvas');
const placeholderStatus = document.getElementById('placeholder-msg');
const overlaysList = document.getElementById('overlays-list');

// Main Render Loop
function renderApp() {
    drawCanvas(canvas);

    // Toggle Placeholder
    if (state.background.loaded) {
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
window.uploadOverlayImage = function (input, id) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const overlay = state.overlays.find(o => o.id === id);
            if (overlay) {
                overlay.image = img;
                overlay.loaded = true;
                notify();
            }
        };
        img.src = url;
    }
};

// Render Control Logic (Cleaned - No Collapsibles)
function renderOverlayControls() {
    // If IDs match, we could update values, but for simplicity in V2 we'll re-render if count changes
    // or just let the input events handle value updates effectively. 
    // To keep UI responsive, we rebuild if list changes.

    // For sliders, we rely on the notify loop re-rendering inputs? 
    // No, standard react-style pattern: verify if we need to destroy DOM.
    if (checkIDsMatch()) {
        // IDs match, just update values to avoid losing focus if we were typing?
        // Actually, we are using oninput, so state is source of truth.
        // We can just update value attributes if needed, but best not to kill focus.
        // For this V2 implementation, we'll skip full re-render if IDs match.
        return;
    }

    overlaysList.innerHTML = '';

    state.overlays.forEach((overlay, index) => {
        const el = document.createElement('div');
        el.className = 'overlay-control-card glass-panel';
        // Basic non-collapsible card style
        el.style.background = 'rgba(255, 255, 255, 0.03)';
        el.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        el.style.borderRadius = '8px';
        el.style.marginBottom = '12px';
        el.style.padding = '12px';

        el.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h3 style="margin:0; font-size:0.9rem; font-weight:500;">Image ${index + 1}</h3>
                <button onclick="removeOverlay(${overlay.id})" style="background:none; border:none; cursor:pointer; font-size:1.1rem; opacity:0.6;">✖</button>
            </div>
            
            ${!overlay.loaded ? `
                <div class="file-input-wrapper" style="margin-bottom:10px;">
                        <input type="file" accept="image/*" onchange="uploadOverlayImage(this, ${overlay.id})" style="width:100%">
                </div>
            ` : `
                <div style="color:#4ade80; font-size:0.8rem; margin-bottom:8px;">✓ Image Loaded</div>
            `}

            <div class="${!overlay.loaded ? 'hidden' : ''}">
                <div class="row" style="margin-bottom:8px">
                    <label style="display:flex; justify-content:space-between; width:100%; font-size:0.85rem;">
                        Scale <span class="val-display-static">${overlay.scale}%</span>
                    </label>
                    <input type="range" min="1" max="100" value="${overlay.scale}" style="width:100%"
                            oninput="updateOverlay(${overlay.id}, 'scale', parseInt(this.value)); this.previousElementSibling.querySelector('span').textContent = this.value + '%'">
                </div>
                <div class="row" style="margin-bottom:8px">
                    <label style="display:flex; justify-content:space-between; width:100%; font-size:0.85rem;">
                        Horizontal <span class="val-display-static">${overlay.x}%</span>
                    </label>
                    <input type="range" min="0" max="100" value="${overlay.x}" style="width:100%"
                            oninput="updateOverlay(${overlay.id}, 'x', parseInt(this.value)); this.previousElementSibling.querySelector('span').textContent = this.value + '%'">
                </div>
                <div class="row" style="margin-bottom:0px">
                    <label style="display:flex; justify-content:space-between; width:100%; font-size:0.85rem;">
                        Vertical <span class="val-display-static">${overlay.y}%</span>
                    </label>
                    <input type="range" min="0" max="100" value="${overlay.y}" style="width:100%"
                            oninput="updateOverlay(${overlay.id}, 'y', parseInt(this.value)); this.previousElementSibling.querySelector('span').textContent = this.value + '%'">
                </div>
            </div>
        `;
        overlaysList.appendChild(el);
    });
}


// Subscriptions
subscribe(() => {
    renderApp();
    renderOverlayControls();
});


// --- INITIALIZATION & STATIC LISTENERS ---

// Background Drag & Drop
function handleBgUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const img = new Image();
    img.onload = () => {
        state.background.image = img;
        state.background.width = img.naturalWidth;
        state.background.height = img.naturalHeight;
        state.background.loaded = true;
        notify();
    };
    img.src = URL.createObjectURL(file);
}

document.getElementById('bg-upload').addEventListener('change', (e) => handleBgUpload(e.target.files[0]));

// Text Listeners
document.getElementById('text-enabled').addEventListener('change', (e) => {
    updateState('textLayer.enabled', e.target.checked);
    const controls = document.getElementById('text-controls');
    if (e.target.checked) controls.classList.remove('hidden');
    else controls.classList.add('hidden');
});
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
    if (!state.background.loaded) {
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
