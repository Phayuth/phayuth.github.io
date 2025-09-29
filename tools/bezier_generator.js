// Bezier Generator JavaScript
const canvasPosition = document.getElementById('canvasPosition');
const ctxPosition = canvasPosition.getContext('2d');

// Canvas dimensions
const width = canvasPosition.width;
const heightPosition = canvasPosition.height;

// Define axis ranges for position (now variables)
let xMin = -10, xMax = 10;
let yMin = -10, yMax = 10;

// Margins for axes
const margin = { top: 20, right: 20, bottom: 50, left: 50 };

// Scaling functions for position (now dynamic)
let scaleX = (width - margin.left - margin.right) / (xMax - xMin);
let scaleY = (heightPosition - margin.top - margin.bottom) / (yMax - yMin);

// Function to update scaling based on current axis ranges
function updateScaling() {
    scaleX = (width - margin.left - margin.right) / (xMax - xMin);
    scaleY = (heightPosition - margin.top - margin.bottom) / (yMax - yMin);
}

// Function to parse CSV and add data points
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const newDataPoints = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') continue;

        const values = line.split(',');
        if (values.length >= 2) {
            const x = parseFloat(values[0].trim());
            const y = parseFloat(values[1].trim());

            if (!isNaN(x) && !isNaN(y)) {
                newDataPoints.push({ x, y });
            }
        }
    }

    return newDataPoints;
}

// Function to handle CSV file upload
function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const csvText = e.target.result;
            const newPoints = parseCSV(csvText);

            if (newPoints.length === 0) {
                alert('No valid data points found in CSV. Expected format: x,y (one pair per line)');
                return;
            }

            dataPoints = newPoints;
            draw();
            alert(`Loaded ${dataPoints.length} data points from CSV`);
        } catch (error) {
            alert('Error reading CSV file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Function to clear data points
function clearDataPoints() {
    dataPoints = [];
    draw();
}

// Function to update control points display
function updateControlPointsDisplay() {
    const displayDiv = document.getElementById('controlPointsDisplay');
    if (controlPoints.length === 0) {
        displayDiv.innerHTML = '<p>No control points defined.</p>';
        return;
    }

    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr style="background-color: #f0f0f0;"><th style="padding: 8px; border: 1px solid #ddd;">Point</th><th style="padding: 8px; border: 1px solid #ddd;">X Coordinate</th><th style="padding: 8px; border: 1px solid #ddd;">Y Coordinate</th></tr>';

    controlPoints.forEach((point, index) => {
        html += `<tr>`;
        html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center;">$P_{${index}}$</td>`;
        html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-family: monospace;">${point.x.toFixed(3)}</td>`;
        html += `<td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-family: monospace;">${point.y.toFixed(3)}</td>`;
        html += `</tr>`;
    });

    html += '</table>';
    html += `<p style="margin-top: 15px; font-size: 14px; color: #666;">Total: ${controlPoints.length} control points (degree ${controlPoints.length - 1} Bezier curve)</p>`;

    displayDiv.innerHTML = html;

    // Re-render MathJax for the updated content
    if (window.MathJax) {
        MathJax.typesetPromise([displayDiv]).catch((err) => console.log(err.message));
    }
}

// Function to copy control points in Python format
function copyControlPointsPython() {
    if (controlPoints.length === 0) {
        alert('No control points to copy!');
        return;
    }

    let pythonCode = '# Bezier curve control points\n';
    pythonCode += 'control_points = [\n';
    controlPoints.forEach((point, index) => {
        const comma = index < controlPoints.length - 1 ? ',' : '';
        pythonCode += `    [${point.x.toFixed(6)}, ${point.y.toFixed(6)}]${comma}\n`;
    });
    pythonCode += ']\n\n';
    pythonCode += '# Example usage with numpy:\n';
    pythonCode += '# import numpy as np\n';
    pythonCode += '# control_points = np.array(control_points)\n';
    pythonCode += '# x_coords = control_points[:, 0]\n';
    pythonCode += '# y_coords = control_points[:, 1]';

    navigator.clipboard.writeText(pythonCode).then(() => {
        alert('Python format copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy to clipboard. Please copy manually.');
    });
}

// Function to copy control points in C++ format
function copyControlPointsCpp() {
    if (controlPoints.length === 0) {
        alert('No control points to copy!');
        return;
    }

    let cppCode = '// Bezier curve control points\n';
    cppCode += '#include <vector>\n';
    cppCode += '#include <utility>\n\n';
    cppCode += 'std::vector<std::pair<double, double>> controlPoints = {\n';
    controlPoints.forEach((point, index) => {
        const comma = index < controlPoints.length - 1 ? ',' : '';
        cppCode += `    {${point.x.toFixed(6)}, ${point.y.toFixed(6)}}${comma}\n`;
    });
    cppCode += '};\n\n';
    cppCode += '// Alternative using separate vectors:\n';
    cppCode += '// std::vector<double> x_coords = {';
    controlPoints.forEach((point, index) => {
        const comma = index < controlPoints.length - 1 ? ', ' : '';
        cppCode += `${point.x.toFixed(6)}${comma}`;
    });
    cppCode += '};\n';
    cppCode += '// std::vector<double> y_coords = {';
    controlPoints.forEach((point, index) => {
        const comma = index < controlPoints.length - 1 ? ', ' : '';
        cppCode += `${point.y.toFixed(6)}${comma}`;
    });
    cppCode += '};';

    navigator.clipboard.writeText(cppCode).then(() => {
        alert('C++ format copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy to clipboard. Please copy manually.');
    });
}

// Function to copy control points in CSV format
function copyControlPointsCSV() {
    if (controlPoints.length === 0) {
        alert('No control points to copy!');
        return;
    }

    let csvData = 'x,y\n'; // Header
    controlPoints.forEach(point => {
        csvData += `${point.x.toFixed(6)},${point.y.toFixed(6)}\n`;
    });

    navigator.clipboard.writeText(csvData).then(() => {
        alert('CSV format copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy to clipboard. Please copy manually.');
    });
}

// Function to update axis ranges from user input
function updateAxisRanges() {
    const xMinInput = document.getElementById('xMin');
    const xMaxInput = document.getElementById('xMax');
    const yMinInput = document.getElementById('yMin');
    const yMaxInput = document.getElementById('yMax');

    const newXMin = parseFloat(xMinInput.value);
    const newXMax = parseFloat(xMaxInput.value);
    const newYMin = parseFloat(yMinInput.value);
    const newYMax = parseFloat(yMaxInput.value);

    // Validate ranges
    if (isNaN(newXMin) || isNaN(newXMax) || isNaN(newYMin) || isNaN(newYMax)) {
        alert('Please enter valid numbers for all axis ranges');
        return;
    }

    if (newXMin >= newXMax) {
        alert('X Min must be less than X Max');
        return;
    }

    if (newYMin >= newYMax) {
        alert('Y Min must be less than Y Max');
        return;
    }

    // Update axis ranges
    xMin = newXMin;
    xMax = newXMax;
    yMin = newYMin;
    yMax = newYMax;

    // Update scaling
    updateScaling();

    // Redraw
    draw();
}

// Sample data points in data coordinates (empty by default)
let dataPoints = [];

// Initial Bezier control points in data coordinates
let controlPoints = [
    { x: -8, y: -5 },
    { x: -3, y: 0 },
    { x: 3, y: 2 },
    { x: 8, y: 6 }
];

// Dragging state
let selectedPoint = null;
const pointRadius = 10;

// Convert data coordinates to canvas coordinates
function toCanvasX(x) {
    return margin.left + (x - xMin) * scaleX;
}

function toCanvasY(y) {
    return heightPosition - margin.bottom - (y - yMin) * scaleY;
}

// Convert canvas coordinates back to data coordinates
function toDataX(x) {
    return xMin + (x - margin.left) / scaleX;
}

function toDataY(y) {
    return yMin + (heightPosition - margin.bottom - y) / scaleY;
}

// Scaling for velocity and acceleration (t: [0,1]) - removed as using Plotly now
const tMin = 0, tMax = 1;

// Binomial coefficient
function binomial(n, k) {
    if (k < 0 || k > n) return 0;
    let result = 1;
    for (let i = 1; i <= k; i++) {
        result *= (n - i + 1) / i;
    }
    return result;
}

// Bernstein polynomial
function bernstein(i, n, t) {
    return binomial(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
}

// First derivative of Bernstein polynomial
function bernsteinDerivative(i, n, t) {
    if (n === 0) return 0;
    return n * (bernstein(i - 1, n - 1, t) - bernstein(i, n - 1, t));
}

// Second derivative of Bernstein polynomial
function bernsteinSecondDerivative(i, n, t) {
    if (n <= 1) return 0;
    return n * (n - 1) * (bernstein(i - 2, n - 2, t) - 2 * bernstein(i - 1, n - 2, t) + bernstein(i, n - 2, t));
}

// Bezier curve position
function computeBezier(t, points) {
    const n = points.length - 1;
    let x = 0, y = 0;
    for (let i = 0; i <= n; i++) {
        const b = bernstein(i, n, t);
        x += points[i].x * b;
        y += points[i].y * b;
    }
    return { x, y };
}

// Bezier curve velocity (first derivative)
function computeBezierVelocity(t, points) {
    const n = points.length - 1;
    let dx_dt = 0, dy_dt = 0;
    for (let i = 0; i <= n; i++) {
        const b_prime = bernsteinDerivative(i, n, t);
        dx_dt += points[i].x * b_prime;
        dy_dt += points[i].y * b_prime;
    }
    return { x: dx_dt, y: dy_dt };
}

// Bezier curve acceleration (second derivative)
function computeBezierAcceleration(t, points) {
    const n = points.length - 1;
    let d2x_dt2 = 0, d2y_dt2 = 0;
    for (let i = 0; i <= n; i++) {
        const b_double_prime = bernsteinSecondDerivative(i, n, t);
        d2x_dt2 += points[i].x * b_double_prime;
        d2y_dt2 += points[i].y * b_double_prime;
    }
    return { x: d2x_dt2, y: d2y_dt2 };
}

// Draw axes, ticks, and grid for position canvas
function drawPositionAxes() {
    // Calculate canvas coordinates for origin (0,0)
    const originX = toCanvasX(0);
    const originY = toCanvasY(0);

    ctxPosition.beginPath();
    ctxPosition.strokeStyle = 'black';
    ctxPosition.lineWidth = 2;

    // X-axis through origin (0,0)
    ctxPosition.moveTo(margin.left, originY);
    ctxPosition.lineTo(width - margin.right, originY);

    // Y-axis through origin (0,0)
    ctxPosition.moveTo(originX, margin.top);
    ctxPosition.lineTo(originX, heightPosition - margin.bottom);
    ctxPosition.stroke();

    // X-axis ticks and grid
    ctxPosition.font = '12px Arial';
    ctxPosition.fillStyle = 'black';
    ctxPosition.textAlign = 'center';
    ctxPosition.textBaseline = 'top';
    const xTickCount = 11; // -10 to 10
    for (let i = 0; i < xTickCount; i++) {
        const x = xMin + i * (xMax - xMin) / (xTickCount - 1);
        const canvasX = toCanvasX(x);
        // Tick on X-axis (through origin)
        ctxPosition.beginPath();
        ctxPosition.strokeStyle = 'black';
        ctxPosition.moveTo(canvasX, originY - 5);
        ctxPosition.lineTo(canvasX, originY + 5);
        ctxPosition.stroke();
        // Label below X-axis
        ctxPosition.fillText(x.toFixed(0), canvasX, originY + 15);
        // Grid line
        ctxPosition.beginPath();
        ctxPosition.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctxPosition.moveTo(canvasX, margin.top);
        ctxPosition.lineTo(canvasX, heightPosition - margin.bottom);
        ctxPosition.stroke();
    }

    // Y-axis ticks and grid
    ctxPosition.textAlign = 'right';
    ctxPosition.textBaseline = 'middle';
    const yTickCount = 11; // -10 to 10
    for (let i = 0; i < yTickCount; i++) {
        const y = yMin + i * (yMax - yMin) / (yTickCount - 1);
        const canvasY = toCanvasY(y);
        // Tick on Y-axis (through origin)
        ctxPosition.beginPath();
        ctxPosition.strokeStyle = 'black';
        ctxPosition.moveTo(originX - 5, canvasY);
        ctxPosition.lineTo(originX + 5, canvasY);
        ctxPosition.stroke();
        // Label to the left of Y-axis
        ctxPosition.fillText(y.toFixed(0), originX - 15, canvasY);
        // Grid line
        ctxPosition.beginPath();
        ctxPosition.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctxPosition.moveTo(margin.left, canvasY);
        ctxPosition.lineTo(width - margin.right, canvasY);
        ctxPosition.stroke();
    }

    // Axis labels
    ctxPosition.textAlign = 'center';
    ctxPosition.fillText('X', width - margin.right + 30, originY);
    ctxPosition.textBaseline = 'bottom';
    ctxPosition.fillText('Y', originX, margin.top - 10);
}

// Plotly plotting functions
function plotWithPlotly() {
    const steps = 100;
    const tValues = [];
    const bezierX = [];
    const bezierY = [];
    const velocityX = [];
    const velocityY = [];
    const accelerationX = [];
    const accelerationY = [];

    // Generate data points for Plotly
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        tValues.push(t);

        const pos = computeBezier(t, controlPoints);
        bezierX.push(pos.x);
        bezierY.push(pos.y);

        const vel = computeBezierVelocity(t, controlPoints);
        velocityX.push(vel.x);
        velocityY.push(vel.y);

        const acc = computeBezierAcceleration(t, controlPoints);
        accelerationX.push(acc.x);
        accelerationY.push(acc.y);
    }

    // Plot Position
    plotPosition(bezierX, bezierY);

    // Plot Velocity
    plotVelocity(tValues, velocityX, velocityY);

    // Plot Acceleration
    plotAcceleration(tValues, accelerationX, accelerationY);
}

function plotPosition(bezierX, bezierY) {
    const traces = [];

    // Bezier curve
    traces.push({
        x: bezierX,
        y: bezierY,
        mode: 'lines',
        name: 'Bezier Curve',
        line: { color: 'black', width: 2 }
    });

    // Data points
    if (dataPoints.length > 0) {
        traces.push({
            x: dataPoints.map(p => p.x),
            y: dataPoints.map(p => p.y),
            mode: 'markers',
            name: 'Data Points',
            marker: { color: 'blue', size: 8 }
        });
    }

    // Control points
    traces.push({
        x: controlPoints.map(p => p.x),
        y: controlPoints.map(p => p.y),
        mode: 'markers+lines',
        name: 'Control Points',
        marker: { color: 'red', size: 10 },
        line: { color: 'gray', width: 1, dash: 'dash' }
    });

    const layout = {
        title: 'Bezier Curve Position',
        width: 1000,
        height: 1000,
        xaxis: {
            title: 'X',
            range: [xMin, xMax],
            zeroline: true,
            zerolinewidth: 2,
            zerolinecolor: 'black'
        },
        yaxis: {
            title: 'Y',
            range: [yMin, yMax],
            zeroline: true,
            zerolinewidth: 2,
            zerolinecolor: 'black'
        },
        showlegend: true,
        hovermode: 'closest'
    };

    Plotly.newPlot('plotlyPosition', traces, layout);
}

function plotVelocity(tValues, velocityX, velocityY) {
    const traces = [
        {
            x: tValues,
            y: velocityX,
            mode: 'lines',
            name: 'dx/dt',
            line: { color: 'blue', width: 2 }
        },
        {
            x: tValues,
            y: velocityY,
            mode: 'lines',
            name: 'dy/dt',
            line: { color: 'red', width: 2 }
        }
    ];

    const layout = {
        title: 'Velocity vs Time',
        xaxis: {
            title: 't',
            range: [0, 1]
        },
        yaxis: {
            title: 'Velocity',
            zeroline: true,
            zerolinewidth: 1,
            zerolinecolor: 'gray'
        },
        showlegend: true,
        hovermode: 'x unified'
    };

    Plotly.newPlot('plotlyVelocity', traces, layout);
}

function plotAcceleration(tValues, accelerationX, accelerationY) {
    const traces = [
        {
            x: tValues,
            y: accelerationX,
            mode: 'lines',
            name: 'd²x/dt²',
            line: { color: 'blue', width: 2 }
        },
        {
            x: tValues,
            y: accelerationY,
            mode: 'lines',
            name: 'd²y/dt²',
            line: { color: 'red', width: 2 }
        }
    ];

    const layout = {
        title: 'Acceleration vs Time',
        xaxis: {
            title: 't',
            range: [0, 1]
        },
        yaxis: {
            title: 'Acceleration',
            zeroline: true,
            zerolinewidth: 1,
            zerolinecolor: 'gray'
        },
        showlegend: true,
        hovermode: 'x unified'
    };

    Plotly.newPlot('plotlyAcceleration', traces, layout);
}

// Draw the entire scene
function draw() {
    // Clear canvas
    ctxPosition.clearRect(0, 0, width, heightPosition);

    // Draw canvas version
    drawPositionAxes();

    // Draw data points on canvas
    ctxPosition.fillStyle = 'blue';
    dataPoints.forEach(point => {
        ctxPosition.beginPath();
        ctxPosition.arc(toCanvasX(point.x), toCanvasY(point.y), 5, 0, 2 * Math.PI);
        ctxPosition.fill();
    });

    // Draw control points on canvas
    ctxPosition.fillStyle = 'red';
    controlPoints.forEach(point => {
        ctxPosition.beginPath();
        ctxPosition.arc(toCanvasX(point.x), toCanvasY(point.y), pointRadius, 0, 2 * Math.PI);
        ctxPosition.fill();
    });

    // Draw control lines on canvas
    ctxPosition.beginPath();
    ctxPosition.strokeStyle = 'gray';
    ctxPosition.lineWidth = 1;
    ctxPosition.moveTo(toCanvasX(controlPoints[0].x), toCanvasY(controlPoints[0].y));
    for (let i = 1; i < controlPoints.length; i++) {
        ctxPosition.lineTo(toCanvasX(controlPoints[i].x), toCanvasY(controlPoints[i].y));
    }
    ctxPosition.stroke();

    // Draw Bezier curve on canvas
    ctxPosition.beginPath();
    ctxPosition.strokeStyle = 'black';
    ctxPosition.lineWidth = 2;
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const point = computeBezier(t, controlPoints);
        if (i === 0) {
            ctxPosition.moveTo(toCanvasX(point.x), toCanvasY(point.y));
        } else {
            ctxPosition.lineTo(toCanvasX(point.x), toCanvasY(point.y));
        }
    }
    ctxPosition.stroke();

    // Update Plotly plots
    plotWithPlotly();

    // Update control points display
    updateControlPointsDisplay();
}

// Check if mouse is over a control point
function getPointAtPosition(x, y) {
    return controlPoints.findIndex(point => {
        const dx = x - toCanvasX(point.x);
        const dy = y - toCanvasY(point.y);
        return Math.sqrt(dx * dx + dy * dy) < pointRadius;
    });
}

// Update control points based on input
function updateControlPoints() {
    const numPointsInput = document.getElementById('numPoints');
    let numPoints = parseInt(numPointsInput.value);
    if (isNaN(numPoints) || numPoints < 2) {
        alert('Please enter an integer >= 2');
        numPointsInput.value = controlPoints.length;
        return;
    }

    // Generate new control points between 0 and 1
    controlPoints = [];
    for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1);
        // Place control points in a line from (0,0) to (1,1)
        const x = t; // x goes from 0 to 1
        const y = t; // y goes from 0 to 1
        controlPoints.push({ x, y });
    }

    // Redraw all canvases
    draw();
}

// Mouse event handlers (only on position canvas)
canvasPosition.addEventListener('mousedown', (e) => {
    const rect = canvasPosition.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pointIndex = getPointAtPosition(x, y);
    if (pointIndex !== -1) {
        selectedPoint = pointIndex;
    }
});

canvasPosition.addEventListener('mousemove', (e) => {
    if (selectedPoint !== null) {
        const rect = canvasPosition.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        controlPoints[selectedPoint].x = toDataX(x);
        controlPoints[selectedPoint].y = toDataY(y);
        draw();
    }
});

canvasPosition.addEventListener('mouseup', () => {
    selectedPoint = null;
});

canvasPosition.addEventListener('contextmenu', (e) => e.preventDefault());

// Initialize input values and draw on page load
function initializeInputs() {
    document.getElementById('xMin').value = xMin;
    document.getElementById('xMax').value = xMax;
    document.getElementById('yMin').value = yMin;
    document.getElementById('yMax').value = yMax;
    document.getElementById('numPoints').value = controlPoints.length;

    // Add event listener for CSV file input
    document.getElementById('csvInput').addEventListener('change', handleCSVUpload);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeInputs();
    draw();
});