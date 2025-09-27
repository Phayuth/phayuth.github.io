const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const pdfInput = document.getElementById('pdfInput');
const pageInput = document.getElementById('pageInput');

// Rectangle properties
let rect = {
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    isSelected: false,
    isResizing: false
};

// Mouse state
let isDragging = false;
let startX, startY;

// Resize handle size
const handleSize = 10;

// Background image from PDF
let backgroundImage = null;
let pdfDoc = null;
let canvasWidth = 595; // Default A4 width (actual PDF dimensions)
let canvasHeight = 842; // Default A4 height (actual PDF dimensions)
let displayScale = 1.0; // Scale factor for display only

// Scale slider elements
const scaleSlider = document.getElementById('scaleSlider');
const scaleValue = document.getElementById('scaleValue');

// Handle scale slider changes
scaleSlider.addEventListener('input', (e) => {
    displayScale = parseInt(e.target.value) / 100;
    scaleValue.textContent = e.target.value + '%';
    updateCanvasDisplay();
    draw();
});

// Function to update canvas display size while keeping actual dimensions
function updateCanvasDisplay() {
    canvas.style.width = (canvasWidth * displayScale) + 'px';
    canvas.style.height = (canvasHeight * displayScale) + 'px';
}

// Function to detect paper type based on dimensions
function detectPaperType(width, height) {
    // Convert from PDF points to inches (72 points = 1 inch)
    const widthInches = width / 72;
    const heightInches = height / 72;

    // Check for A4 (8.27 × 11.69 inches)
    if (Math.abs(widthInches - 8.27) < 0.1 && Math.abs(heightInches - 11.69) < 0.1) {
        return 'A4';
    }
    // Check for Letter (8.5 × 11 inches)
    else if (Math.abs(widthInches - 8.5) < 0.1 && Math.abs(heightInches - 11) < 0.1) {
        return 'Letter';
    }
    // Check for Legal (8.5 × 14 inches)
    else if (Math.abs(widthInches - 8.5) < 0.1 && Math.abs(heightInches - 14) < 0.1) {
        return 'Legal';
    }
    // Check for Tabloid/Ledger (11 × 17 inches)
    else if (Math.abs(widthInches - 11) < 0.1 && Math.abs(heightInches - 17) < 0.1) {
        return 'Tabloid';
    }
    else {
        return 'Custom';
    }
}

// Function to update information panel
function updateInfoPanel() {
    const paperType = detectPaperType(canvasWidth, canvasHeight);
    const widthInches = (canvasWidth / 72).toFixed(2);
    const heightInches = (canvasHeight / 72).toFixed(2);
    const widthMm = (canvasWidth / 72 * 25.4).toFixed(1);
    const heightMm = (canvasHeight / 72 * 25.4).toFixed(1);

    const rectWidthInches = (rect.width / 72).toFixed(2);
    const rectHeightInches = (rect.height / 72).toFixed(2);
    const rectWidthMm = (rect.width / 72 * 25.4).toFixed(1);
    const rectHeightMm = (rect.height / 72 * 25.4).toFixed(1);

    const widthPercent = ((rect.width / canvasWidth) * 100).toFixed(2);
    const heightPercent = ((rect.height / canvasHeight) * 100).toFixed(2);

    // Calculate aspect ratio and height vs width percentage
    const aspectRatio = (rect.width / rect.height).toFixed(4);
    const heightVsWidthPercent = ((rect.height / rect.width) * 100).toFixed(2);

    document.getElementById('paperType').textContent = paperType;
    document.getElementById('paperSize').textContent = `${widthInches}" × ${heightInches}" (${widthMm} × ${heightMm} mm)`;
    document.getElementById('pageDimensions').textContent = `${canvasWidth} × ${canvasHeight} pts`;
    document.getElementById('rectangleSize').textContent = `${rectWidthInches}" × ${rectHeightInches}" (${rectWidthMm} × ${rectHeightMm} mm)`;
    document.getElementById('widthPercentage').textContent = `${widthPercent}%`;
    document.getElementById('heightPercentage').textContent = `${heightPercent}%`;
    document.getElementById('aspectRatio').textContent = `${aspectRatio}:1`;
    document.getElementById('heightVsWidth').textContent = `${heightVsWidthPercent}%`;
}

// Load PDF and render selected page
async function loadPDFPage(pageNum) {
    if (!pdfDoc) return;

    // Ensure page number is valid
    pageNum = Math.max(1, Math.min(pageNum, pdfDoc.numPages));
    pageInput.value = pageNum;

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 }); // 1 PDF unit = 1 pixel (72 DPI)

    // Set canvas size to match PDF page (actual dimensions for calculations)
    canvasWidth = viewport.width;
    canvasHeight = viewport.height;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Update display size based on scale
    updateCanvasDisplay();

    // Adjust rectangle if canvas is too small
    rect.x = Math.min(rect.x, canvasWidth - rect.width);
    rect.y = Math.min(rect.y, canvasHeight - rect.height);

    // Off-screen canvas for rendering PDF page
    const offscreenCanvas = document.createElement('canvas');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    offscreenCanvas.width = canvasWidth;
    offscreenCanvas.height = canvasHeight;

    await page.render({ canvasContext: offscreenCtx, viewport }).promise;

    // Convert to image
    backgroundImage = new Image();
    backgroundImage.src = offscreenCanvas.toDataURL('image/png');
    backgroundImage.onload = () => {
        draw(); // Redraw with background
        updateInfoPanel(); // Update info panel with new dimensions
    };
}

// Handle PDF file input
pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
    loadPDFPage(parseInt(pageInput.value) || 1);
});

// Handle page number input
pageInput.addEventListener('change', () => {
    const pageNum = parseInt(pageInput.value) || 1;
    loadPDFPage(pageNum);
});

// Draw the background, rectangle, and handle
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw PDF background if loaded
    if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
    }

    // Fill rectangle with transparent red
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    // Draw rectangle border with red
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    // Draw resize handle if selected
    if (rect.isSelected) {
        ctx.fillStyle = 'red';
        ctx.fillRect(rect.x + rect.width - handleSize, rect.y + rect.height - handleSize, handleSize, handleSize);
    }

    // Update information panel
    updateInfoPanel();
}

// Check if mouse is inside rectangle
function isMouseInRect(mx, my) {
    return mx >= rect.x && mx <= rect.x + rect.width && my >= rect.y && my <= rect.y + rect.height;
}

// Check if mouse is over resize handle
function isMouseInHandle(mx, my) {
    return mx >= rect.x + rect.width - handleSize && mx <= rect.x + rect.width &&
        my >= rect.y + rect.height - handleSize && my <= rect.y + rect.height;
}

// Mouse down event
canvas.addEventListener('mousedown', (e) => {
    const rectBound = canvas.getBoundingClientRect();
    const mx = (e.clientX - rectBound.left) / displayScale;
    const my = (e.clientY - rectBound.top) / displayScale;

    if (isMouseInHandle(mx, my)) {
        rect.isResizing = true;
        rect.isSelected = true;
    } else if (isMouseInRect(mx, my)) {
        rect.isSelected = true;
        isDragging = true;
        startX = mx - rect.x;
        startY = my - rect.y;
    } else {
        rect.isSelected = false;
    }
    draw();
});

// Mouse move event
canvas.addEventListener('mousemove', (e) => {
    const rectBound = canvas.getBoundingClientRect();
    const mx = (e.clientX - rectBound.left) / displayScale;
    const my = (e.clientY - rectBound.top) / displayScale;

    if (isDragging) {
        rect.x = mx - startX;
        rect.y = my - startY;
        draw();
    } else if (rect.isResizing) {
        rect.width = mx - rect.x;
        rect.height = my - rect.y;
        // Minimum size
        if (rect.width < 10) rect.width = 10;
        if (rect.height < 10) rect.height = 10;
        draw();
    }
});

// Mouse up event
canvas.addEventListener('mouseup', () => {
    isDragging = false;
    rect.isResizing = false;
});

// Initial canvas setup (default A4 size until PDF is loaded)
canvas.width = canvasWidth;
canvas.height = canvasHeight;
updateCanvasDisplay(); // Set initial display size
draw();
updateInfoPanel(); // Initialize info panel with default values