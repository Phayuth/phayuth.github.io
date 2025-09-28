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