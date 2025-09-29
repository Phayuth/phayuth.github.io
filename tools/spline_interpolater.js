// Spline Interpolation Tool JavaScript
let waypoints = [
    { x: 0, y: 0 },
    { x: 2, y: 3 },
    { x: 4, y: 1 },
    { x: 6, y: 4 },
    { x: 8, y: 2 },
    { x: 10, y: 5 }
];

let splineData = null;
let currentResolution = 200;

// Initialize the tool
document.addEventListener('DOMContentLoaded', function () {
    updateWaypointTable();
    updateSpline();

    // Set up spline type change handler
    document.getElementById('splineType').addEventListener('change', function () {
        const splineType = this.value;
        const clampedControls = document.getElementById('clampedControls');
        const bsplineControls = document.getElementById('bsplineControls');

        clampedControls.style.display = splineType === 'clamped' ? 'block' : 'none';
        bsplineControls.style.display = splineType === 'bspline' ? 'block' : 'none';

        document.getElementById('currentSplineType').textContent =
            splineType === 'natural' ? 'Natural Cubic' :
                splineType === 'clamped' ? 'Clamped Cubic' :
                splineType === 'periodic' ? 'Periodic Cubic' : 'B-Spline';
        updateSpline();
    });
});

// Status message display
function showStatus(message, isError = false) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = 'status-message ' + (isError ? 'status-error' : 'status-success');
    statusDiv.style.display = 'block';

    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

// CSV parsing
function parseCSV(text) {
    const lines = text.trim().split('\n');
    const data = [];

    for (let line of lines) {
        const row = line.split(',').map(val => parseFloat(val.trim()));
        if (row.length !== 2 || row.some(isNaN)) {
            throw new Error('CSV must contain exactly 2 columns (x, y) with numeric data');
        }
        data.push({ x: row[0], y: row[1] });
    }

    if (data.length < 3) {
        throw new Error('Need at least 3 waypoints for spline interpolation');
    }

    return data;
}

// Load waypoints from CSV
function loadFromCSV() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
        showStatus('Please select a CSV file first.', true);
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const csvText = e.target.result;
            waypoints = parseCSV(csvText);
            updateWaypointTable();
            updateSpline();
            previewCSV(waypoints);
            showStatus(`Successfully loaded ${waypoints.length} waypoints from CSV.`);
        } catch (error) {
            showStatus(`Error parsing CSV: ${error.message}`, true);
        }
    };

    reader.readAsText(file);
}

// Preview CSV data
function previewCSV(data) {
    const previewDiv = document.getElementById('csvPreview');
    const table = document.getElementById('previewTable');

    table.innerHTML = '';

    // Create header
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')).textContent = 'Point';
    headerRow.appendChild(document.createElement('th')).textContent = 'X';
    headerRow.appendChild(document.createElement('th')).textContent = 'Y';
    table.appendChild(headerRow);

    // Show data (max 10 rows)
    const maxRows = Math.min(10, data.length);
    for (let i = 0; i < maxRows; i++) {
        const row = document.createElement('tr');
        row.appendChild(document.createElement('td')).textContent = i + 1;
        row.appendChild(document.createElement('td')).textContent = data[i].x.toFixed(4);
        row.appendChild(document.createElement('td')).textContent = data[i].y.toFixed(4);
        table.appendChild(row);
    }

    if (data.length > 10) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 3;
        cell.textContent = `... and ${data.length - 10} more points`;
        cell.style.fontStyle = 'italic';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        table.appendChild(row);
    }

    previewDiv.style.display = 'block';
}

// Update waypoint table
function updateWaypointTable() {
    const tbody = document.getElementById('waypointTableBody');
    tbody.innerHTML = '';

    waypoints.forEach((point, index) => {
        const row = document.createElement('tr');

        // Index
        const indexCell = document.createElement('td');
        indexCell.textContent = index + 1;
        row.appendChild(indexCell);

        // X coordinate
        const xCell = document.createElement('td');
        const xInput = document.createElement('input');
        xInput.type = 'number';
        xInput.step = '0.1';
        xInput.value = point.x;
        xInput.addEventListener('change', function () {
            waypoints[index].x = parseFloat(this.value) || 0;
            updateSpline();
        });
        xCell.appendChild(xInput);
        row.appendChild(xCell);

        // Y coordinate
        const yCell = document.createElement('td');
        const yInput = document.createElement('input');
        yInput.type = 'number';
        yInput.step = '0.1';
        yInput.value = point.y;
        yInput.addEventListener('change', function () {
            waypoints[index].y = parseFloat(this.value) || 0;
            updateSpline();
        });
        yCell.appendChild(yInput);
        row.appendChild(yCell);

        // Action
        const actionCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'btn-small';
        deleteBtn.style.backgroundColor = '#dc3545';
        deleteBtn.style.color = 'white';
        deleteBtn.style.border = 'none';
        deleteBtn.style.borderRadius = '3px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.addEventListener('click', function () {
            if (waypoints.length > 3) {
                waypoints.splice(index, 1);
                updateWaypointTable();
                updateSpline();
            } else {
                showStatus('Need at least 3 waypoints for spline interpolation.', true);
            }
        });
        actionCell.appendChild(deleteBtn);
        row.appendChild(actionCell);

        tbody.appendChild(row);
    });
}

// Waypoint management functions
function addWaypoint() {
    const lastPoint = waypoints[waypoints.length - 1];
    waypoints.push({
        x: lastPoint.x + 2,
        y: lastPoint.y + Math.random() * 2 - 1
    });
    updateWaypointTable();
    updateSpline();
}

function removeLastWaypoint() {
    if (waypoints.length > 3) {
        waypoints.pop();
        updateWaypointTable();
        updateSpline();
    } else {
        showStatus('Need at least 3 waypoints for spline interpolation.', true);
    }
}

function resetWaypoints() {
    waypoints = [
        { x: 0, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 1 },
        { x: 6, y: 4 },
        { x: 8, y: 2 },
        { x: 10, y: 5 }
    ];
    updateWaypointTable();
    updateSpline();
    showStatus('Reset to default waypoints.');
}

function generateRandomWaypoints() {
    const numPoints = 5 + Math.floor(Math.random() * 6); // 5-10 points
    waypoints = [];

    for (let i = 0; i < numPoints; i++) {
        waypoints.push({
            x: i * (10 / (numPoints - 1)),
            y: Math.random() * 6 - 1
        });
    }

    updateWaypointTable();
    updateSpline();
    showStatus(`Generated ${numPoints} random waypoints.`);
}

// Resolution control
function updateResolution(value) {
    currentResolution = parseInt(value);
    document.getElementById('resolutionValue').value = currentResolution;
    document.getElementById('currentResolution').textContent = currentResolution;
    updateSpline();
}

function updateResolutionFromInput() {
    const value = parseInt(document.getElementById('resolutionValue').value);
    if (value >= 50 && value <= 500) {
        currentResolution = value;
        document.getElementById('resolution').value = currentResolution;
        document.getElementById('currentResolution').textContent = currentResolution;
        updateSpline();
    }
}

// B-Spline degree control
function updateBSplineDegree(value) {
    const degree = parseInt(value);
    document.getElementById('bsplineDegreeValue').value = degree;
    const degreeNames = ['', '', 'Quadratic', 'Cubic', 'Quartic', 'Quintic'];
    document.getElementById('bsplineDegreeLabel').textContent = degreeNames[degree] || degree;
    updateSpline();
}

function updateBSplineDegreeFromInput() {
    const value = parseInt(document.getElementById('bsplineDegreeValue').value);
    if (value >= 2 && value <= 5) {
        document.getElementById('bsplineDegree').value = value;
        const degreeNames = ['', '', 'Quadratic', 'Cubic', 'Quartic', 'Quintic'];
        document.getElementById('bsplineDegreeLabel').textContent = degreeNames[value] || value;
        updateSpline();
    }
}

// Matrix operations for spline computation
class Matrix {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.data = Array(rows).fill().map(() => Array(cols).fill(0));
    }

    static solve(A, b) {
        const n = A.rows;
        const augmented = new Matrix(n, n + 1);

        // Create augmented matrix
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                augmented.data[i][j] = A.data[i][j];
            }
            augmented.data[i][n] = b[i];
        }

        // Gaussian elimination with partial pivoting
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(augmented.data[k][i]) > Math.abs(augmented.data[maxRow][i])) {
                    maxRow = k;
                }
            }

            // Swap rows
            [augmented.data[i], augmented.data[maxRow]] = [augmented.data[maxRow], augmented.data[i]];

            // Forward elimination
            for (let k = i + 1; k < n; k++) {
                const factor = augmented.data[k][i] / augmented.data[i][i];
                for (let j = i; j < n + 1; j++) {
                    augmented.data[k][j] -= factor * augmented.data[i][j];
                }
            }
        }

        // Back substitution
        const solution = new Array(n);
        for (let i = n - 1; i >= 0; i--) {
            solution[i] = augmented.data[i][n];
            for (let j = i + 1; j < n; j++) {
                solution[i] -= augmented.data[i][j] * solution[j];
            }
            solution[i] /= augmented.data[i][i];
        }

        return solution;
    }
}

// Cubic spline interpolation
function computeCubicSpline(points, type = 'natural', derivatives = null) {
    const n = points.length;
    if (n < 3) throw new Error('Need at least 3 points for cubic spline');

    // Sort points by x coordinate
    const sortedPoints = [...points].sort((a, b) => a.x - b.x);

    // Extract x and y arrays
    const x = sortedPoints.map(p => p.x);
    const y = sortedPoints.map(p => p.y);

    // Compute spline coefficients
    const h = [];
    for (let i = 0; i < n - 1; i++) {
        h[i] = x[i + 1] - x[i];
    }

    // Set up system of equations for second derivatives
    const A = new Matrix(n, n);
    const b = new Array(n);

    if (type === 'natural') {
        // Natural spline: second derivative = 0 at endpoints
        A.data[0][0] = 1;
        A.data[n - 1][n - 1] = 1;
        b[0] = 0;
        b[n - 1] = 0;

        for (let i = 1; i < n - 1; i++) {
            A.data[i][i - 1] = h[i - 1];
            A.data[i][i] = 2 * (h[i - 1] + h[i]);
            A.data[i][i + 1] = h[i];
            b[i] = 6 * ((y[i + 1] - y[i]) / h[i] - (y[i] - y[i - 1]) / h[i - 1]);
        }

    } else if (type === 'clamped') {
        // Clamped spline: specified first derivatives at endpoints
        const dy0 = derivatives ? derivatives.start : 0;
        const dyn = derivatives ? derivatives.end : 0;

        A.data[0][0] = 2 * h[0];
        A.data[0][1] = h[0];
        b[0] = 6 * ((y[1] - y[0]) / h[0] - dy0);

        A.data[n - 1][n - 2] = h[n - 2];
        A.data[n - 1][n - 1] = 2 * h[n - 2];
        b[n - 1] = 6 * (dyn - (y[n - 1] - y[n - 2]) / h[n - 2]);

        for (let i = 1; i < n - 1; i++) {
            A.data[i][i - 1] = h[i - 1];
            A.data[i][i] = 2 * (h[i - 1] + h[i]);
            A.data[i][i + 1] = h[i];
            b[i] = 6 * ((y[i + 1] - y[i]) / h[i] - (y[i] - y[i - 1]) / h[i - 1]);
        }

    } else if (type === 'periodic') {
        // Periodic spline: first and second derivatives match at endpoints
        if (Math.abs(y[0] - y[n - 1]) > 1e-10) {
            console.warn('For periodic spline, first and last y-values should be equal');
        }

        // Modified system for periodic conditions
        for (let i = 1; i < n - 1; i++) {
            A.data[i][i - 1] = h[i - 1];
            A.data[i][i] = 2 * (h[i - 1] + h[i]);
            A.data[i][i + 1] = h[i];
            b[i] = 6 * ((y[i + 1] - y[i]) / h[i] - (y[i] - y[i - 1]) / h[i - 1]);
        }

        A.data[0][0] = 2 * (h[0] + h[n - 2]);
        A.data[0][1] = h[0];
        A.data[0][n - 1] = h[n - 2];
        b[0] = 6 * ((y[1] - y[0]) / h[0] - (y[0] - y[n - 2]) / h[n - 2]);

        A.data[n - 1][0] = h[n - 2];
        A.data[n - 1][n - 2] = h[n - 2];
        A.data[n - 1][n - 1] = 2 * (h[0] + h[n - 2]);
        b[n - 1] = 6 * ((y[0] - y[n - 1]) / h[n - 2] - (y[n - 1] - y[n - 2]) / h[n - 2]);
    }

    // Solve for second derivatives
    const c = Matrix.solve(A, b);

    // Return spline evaluation function
    return function (t) {
        // Find interval
        let i = 0;
        while (i < n - 1 && t > x[i + 1]) i++;
        if (i >= n - 1) i = n - 2;

        const dx = x[i + 1] - x[i];
        const dy = y[i + 1] - y[i];
        const a = (c[i + 1] - c[i]) / (6 * dx);
        const b = c[i] / 2;
        const d = dy / dx - dx * (c[i + 1] + 2 * c[i]) / 6;
        const e = y[i];

        const dt = t - x[i];
        return a * dt * dt * dt + b * dt * dt + d * dt + e;
    };
}

// B-Spline implementation
function computeBSpline(points, degree = 3) {
    const n = points.length;
    if (n < degree + 1) throw new Error(`Need at least ${degree + 1} points for degree ${degree} B-spline`);

    // Sort points by x coordinate
    const sortedPoints = [...points].sort((a, b) => a.x - b.x);

    // Extract x and y arrays
    const x = sortedPoints.map(p => p.x);
    const y = sortedPoints.map(p => p.y);

    // Generate knot vector (clamped/open uniform)
    const m = n + degree + 1;
    const knots = new Array(m);

    // Clamped knot vector: repeat first and last knots (degree+1) times
    for (let i = 0; i <= degree; i++) {
        knots[i] = 0;
        knots[m - 1 - i] = 1;
    }

    // Internal knots distributed uniformly
    const numInternalKnots = m - 2 * (degree + 1);
    for (let i = 0; i < numInternalKnots; i++) {
        knots[degree + 1 + i] = (i + 1) / (numInternalKnots + 1);
    }

    // B-spline basis function evaluation using Cox-de Boor recursion
    function basisFunction(i, p, t) {
        if (p === 0) {
            return (t >= knots[i] && t < knots[i + 1]) ? 1 : 0;
        }

        let left = 0, right = 0;

        if (knots[i + p] !== knots[i]) {
            left = ((t - knots[i]) / (knots[i + p] - knots[i])) * basisFunction(i, p - 1, t);
        }

        if (knots[i + p + 1] !== knots[i + 1]) {
            right = ((knots[i + p + 1] - t) / (knots[i + p + 1] - knots[i + 1])) * basisFunction(i + 1, p - 1, t);
        }

        return left + right;
    }

    // Create parametric mapping from x-coordinates to parameter space
    const totalLength = x[n - 1] - x[0];

    return function(t) {
        // Map x-coordinate to parameter space [0, 1]
        const u = Math.max(0, Math.min(1, (t - x[0]) / totalLength));

        // Handle boundary cases
        if (u <= 0) return y[0];
        if (u >= 1) return y[n - 1];

        // Evaluate B-spline
        let result = 0;
        for (let i = 0; i < n; i++) {
            result += y[i] * basisFunction(i, degree, u);
        }

        return result;
    };
}

// Calculate curve length
function calculateCurveLength(splineFn, xMin, xMax, steps = 1000) {
    let length = 0;
    const dx = (xMax - xMin) / steps;

    let prevX = xMin;
    let prevY = splineFn(xMin);

    for (let i = 1; i <= steps; i++) {
        const x = xMin + i * dx;
        const y = splineFn(x);
        length += Math.sqrt((x - prevX) ** 2 + (y - prevY) ** 2);
        prevX = x;
        prevY = y;
    }

    return length;
}

// Main spline update function
function updateSpline() {
    if (waypoints.length < 3) return;

    try {
        const splineType = document.getElementById('splineType').value;
        let splineFn;

        if (splineType === 'bspline') {
            const degree = parseInt(document.getElementById('bsplineDegree').value) || 3;
            if (waypoints.length < degree + 1) {
                showStatus(`Need at least ${degree + 1} waypoints for degree ${degree} B-spline`, true);
                return;
            }
            splineFn = computeBSpline(waypoints, degree);
        } else {
            let derivatives = null;
            if (splineType === 'clamped') {
                derivatives = {
                    start: parseFloat(document.getElementById('startDerivX').value) || 0,
                    end: parseFloat(document.getElementById('endDerivX').value) || 0
                };
            }
            splineFn = computeCubicSpline(waypoints, splineType, derivatives);
        }

        // Generate interpolated points
        const xMin = Math.min(...waypoints.map(p => p.x));
        const xMax = Math.max(...waypoints.map(p => p.x));
        const interpolatedPoints = [];

        for (let i = 0; i < currentResolution; i++) {
            const t = xMin + (i / (currentResolution - 1)) * (xMax - xMin);
            interpolatedPoints.push({ x: t, y: splineFn(t) });
        }

        splineData = {
            waypoints: waypoints,
            interpolated: interpolatedPoints,
            splineFunction: splineFn
        };

        // Update info
        document.getElementById('numWaypoints').textContent = waypoints.length;
        const curveLength = calculateCurveLength(splineFn, xMin, xMax);
        document.getElementById('curveLength').textContent = curveLength.toFixed(3);

        // Plot
        plotSpline();

    } catch (error) {
        showStatus(`Error computing spline: ${error.message}`, true);
        console.error(error);
    }
}

// Plot the spline
function plotSpline() {
    if (!splineData) return;

    const traces = [
        // Original waypoints
        {
            x: splineData.waypoints.map(p => p.x),
            y: splineData.waypoints.map(p => p.y),
            mode: 'markers',
            marker: { size: 10, color: 'red', symbol: 'circle', line: { color: 'darkred', width: 2 } },
            name: 'Waypoints',
            hovertemplate: 'Waypoint<br>X: %{x:.3f}<br>Y: %{y:.3f}<extra></extra>'
        },
        // Interpolated spline curve
        {
            x: splineData.interpolated.map(p => p.x),
            y: splineData.interpolated.map(p => p.y),
            mode: 'lines',
            line: { color: 'blue', width: 3 },
            name: 'Spline Curve',
            hovertemplate: 'Spline<br>X: %{x:.3f}<br>Y: %{y:.3f}<extra></extra>'
        },
        // Connecting lines between waypoints
        {
            x: splineData.waypoints.map(p => p.x),
            y: splineData.waypoints.map(p => p.y),
            mode: 'lines',
            line: { color: 'gray', width: 1, dash: 'dot' },
            name: 'Waypoint Connections',
            showlegend: false,
            hoverinfo: 'skip'
        }
    ];

    const layout = {
        title: { text: `${document.getElementById('currentSplineType').textContent} Interpolation`, font: { size: 18 } },
        xaxis: { title: 'X Coordinate', showgrid: true, gridcolor: 'rgba(128, 128, 128, 0.3)' },
        yaxis: { title: 'Y Coordinate', showgrid: true, gridcolor: 'rgba(128, 128, 128, 0.3)' },
        plot_bgcolor: 'rgba(240, 240, 240, 0.5)',
        paper_bgcolor: 'white',
        hovermode: 'closest',
        showlegend: true,
        legend: { x: 0.02, y: 0.98, bgcolor: 'rgba(255, 255, 255, 0.8)', bordercolor: 'rgba(0, 0, 0, 0.2)', borderwidth: 1 }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        displaylogo: false,
        toImageButtonOptions: { format: 'png', filename: 'spline_interpolation', height: 600, width: 1000, scale: 1 }
    };

    Plotly.newPlot('splinePlot', traces, layout, config);
}

// Export results
function exportResults() {
    if (!splineData) {
        showStatus('No spline data to export. Please generate a spline first.', true);
        return;
    }

    // Create CSV content
    let csvContent = 'X,Y,Type\n';
    splineData.waypoints.forEach(p => csvContent += `${p.x.toFixed(6)},${p.y.toFixed(6)},waypoint\n`);
    splineData.interpolated.forEach(p => csvContent += `${p.x.toFixed(6)},${p.y.toFixed(6)},interpolated\n`);

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spline_interpolation_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showStatus('Spline data exported successfully!');
}