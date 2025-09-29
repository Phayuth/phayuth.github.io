let originalImage = null;
let originalMat = null;
let isOpenCvReady = false;

// Status management
function updateStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}

// OpenCV.js ready callback
function onOpenCvReady() {
    isOpenCvReady = true;
    updateStatus('OpenCV.js loaded successfully! Upload an image to start.', 'ready');
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // File upload
    document.getElementById('imageUpload').addEventListener('change', handleImageUpload);

    // Canvas click for color picking
    document.getElementById('originalCanvas').addEventListener('click', handleCanvasClick);

    // HSV sliders
    const sliders = ['hueMin', 'satMin', 'valMin', 'hueMax', 'satMax', 'valMax'];
    sliders.forEach(slider => {
        const element = document.getElementById(slider);
        const valueDisplay = document.getElementById(slider + 'Value');

        element.addEventListener('input', function () {
            valueDisplay.textContent = this.value;
            if (originalMat) {
                processImage();
            }
        });
    });
}

// Handle canvas click for color picking
function handleCanvasClick(event) {
    if (!originalMat) return;

    const canvas = event.target;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);

    // Ensure coordinates are within bounds
    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        pickColorAtPosition(x, y);
    }
}

// Pick color at specific position
function pickColorAtPosition(x, y) {
    try {
        // Get RGB values from original image
        const rgbPixel = originalMat.ucharPtr(y, x);
        const r = rgbPixel[0];
        const g = rgbPixel[1];
        const b = rgbPixel[2];

        // Convert RGB to HSV using OpenCV
        let rgbMat = new cv.Mat(1, 1, cv.CV_8UC3);
        let hsvMat = new cv.Mat();

        // Set the single pixel value
        rgbMat.data[0] = r;
        rgbMat.data[1] = g;
        rgbMat.data[2] = b;

        // Convert to HSV
        cv.cvtColor(rgbMat, hsvMat, cv.COLOR_RGB2HSV);

        const hsvPixel = hsvMat.ucharPtr(0, 0);
        const h = hsvPixel[0];
        const s = hsvPixel[1];
        const v = hsvPixel[2];

        // Update display
        updateColorDisplay(r, g, b, h, s, v, x, y);

        // Cleanup
        rgbMat.delete();
        hsvMat.delete();

    } catch (error) {
        console.error('Error picking color:', error);
    }
}

// Update color display with RGB and HSV values
function updateColorDisplay(r, g, b, h, s, v, x, y) {
    // Update RGB values
    document.getElementById('redValue').textContent = r;
    document.getElementById('greenValue').textContent = g;
    document.getElementById('blueValue').textContent = b;

    // Update HSV values
    document.getElementById('hueValue').textContent = h;
    document.getElementById('satValue').textContent = s;
    document.getElementById('valValue').textContent = v;

    // Update coordinate info
    document.getElementById('coordinates').textContent = `Position: (${x}, ${y})`;

    // Update hex value
    const hex = rgbToHex(r, g, b);
    document.getElementById('hexValue').textContent = hex;

    // Update color samples
    const rgbColor = `rgb(${r}, ${g}, ${b})`;
    document.getElementById('rgbColorSample').style.backgroundColor = rgbColor;
    document.getElementById('hsvColorSample').style.backgroundColor = rgbColor;
}

// Convert RGB to Hex
function rgbToHex(r, g, b) {
    const componentToHex = (c) => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            originalImage = img;
            loadImageToCanvas();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Load image to canvas and create OpenCV Mat
function loadImageToCanvas() {
    if (!isOpenCvReady || !originalImage) return;

    const originalCanvas = document.getElementById('originalCanvas');
    const ctx = originalCanvas.getContext('2d');

    // Set canvas size to image size (with max width constraint)
    const maxWidth = 600;
    const scaleFactor = Math.min(1, maxWidth / originalImage.width);
    const displayWidth = originalImage.width * scaleFactor;
    const displayHeight = originalImage.height * scaleFactor;

    originalCanvas.width = displayWidth;
    originalCanvas.height = displayHeight;

    // Add cursor pointer style for color picking
    originalCanvas.style.cursor = 'crosshair';

    // Draw original image
    ctx.drawImage(originalImage, 0, 0, displayWidth, displayHeight);

    // Create OpenCV Mat from canvas
    if (originalMat) originalMat.delete();
    originalMat = cv.imread(originalCanvas);

    // Initialize segmented canvas
    const segmentedCanvas = document.getElementById('segmentedCanvas');
    segmentedCanvas.width = displayWidth;
    segmentedCanvas.height = displayHeight;

    // Process image with current HSV values
    processImage();

    updateStatus('Image loaded successfully! Adjust HSV sliders to segment colors.', 'ready');
}

// Process image with current HSV values
function processImage() {
    if (!isOpenCvReady || !originalMat) return;

    try {
        // Get HSV values from sliders
        const hueMin = parseInt(document.getElementById('hueMin').value);
        const satMin = parseInt(document.getElementById('satMin').value);
        const valMin = parseInt(document.getElementById('valMin').value);
        const hueMax = parseInt(document.getElementById('hueMax').value);
        const satMax = parseInt(document.getElementById('satMax').value);
        const valMax = parseInt(document.getElementById('valMax').value);

        // Convert to HSV
        let hsvMat = new cv.Mat();
        cv.cvtColor(originalMat, hsvMat, cv.COLOR_RGB2HSV);

        // Create mask with HSV range
        let mask = new cv.Mat();
        const lowerBound = new cv.Mat(hsvMat.rows, hsvMat.cols, hsvMat.type(), [hueMin, satMin, valMin, 255]);
        const upperBound = new cv.Mat(hsvMat.rows, hsvMat.cols, hsvMat.type(), [hueMax, satMax, valMax, 255]);
        cv.inRange(hsvMat, lowerBound, upperBound, mask);

        // Create result image - show only the segmented parts
        let result = new cv.Mat();
        originalMat.copyTo(result, mask);

        // Display segmented result
        cv.imshow('segmentedCanvas', result);

        // Cleanup
        hsvMat.delete();
        mask.delete();
        result.delete();
        lowerBound.delete();
        upperBound.delete();

    } catch (error) {
        console.error('Error processing image:', error);
        updateStatus('Error processing image: ' + error.message, 'error');
    }
}

// Reset HSV values to defaults
function resetValues() {
    document.getElementById('hueMin').value = 0;
    document.getElementById('satMin').value = 50;
    document.getElementById('valMin').value = 50;
    document.getElementById('hueMax').value = 179;
    document.getElementById('satMax').value = 255;
    document.getElementById('valMax').value = 255;

    // Update displays
    document.getElementById('hueMinValue').textContent = 0;
    document.getElementById('satMinValue').textContent = 50;
    document.getElementById('valMinValue').textContent = 50;
    document.getElementById('hueMaxValue').textContent = 179;
    document.getElementById('satMaxValue').textContent = 255;
    document.getElementById('valMaxValue').textContent = 255;

    if (originalMat) {
        processImage();
    }
}

// Initialize status when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    updateStatus('Loading OpenCV.js...', 'loading');
});

// Make onOpenCvReady available globally for OpenCV.js callback
window.onOpenCvReady = onOpenCvReady;
window.resetValues = resetValues;