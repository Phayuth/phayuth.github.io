let trajectoryData = null;

function showStatus(message, isError = false) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = 'status-message ' + (isError ? 'status-error' : 'status-success');
    statusDiv.style.display = 'block';

    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

function parseCSV(text) {
    const lines = text.trim().split('\n');
    const data = [];

    for (let line of lines) {
        const row = line.split(',').map(val => parseFloat(val.trim()));
        if (row.some(isNaN)) {
            throw new Error('Invalid numeric data found in CSV');
        }
        data.push(row);
    }

    if (data.length === 0) {
        throw new Error('CSV file is empty');
    }

    // Check if all rows have the same number of columns
    const numCols = data[0].length;
    if (!data.every(row => row.length === numCols)) {
        throw new Error('All rows must have the same number of columns');
    }

    return data;
}

function previewCSV(data) {
    const previewDiv = document.getElementById('csvPreview');
    const table = document.getElementById('previewTable');

    // Clear previous content
    table.innerHTML = '';

    // Create header
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')).textContent = 'Waypoint';
    for (let j = 0; j < data[0].length; j++) {
        const th = document.createElement('th');
        th.textContent = `Joint ${j + 1}`;
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);

    // Show first 10 rows maximum
    const maxRows = Math.min(10, data.length);
    for (let i = 0; i < maxRows; i++) {
        const row = document.createElement('tr');
        const waypointCell = document.createElement('td');
        waypointCell.textContent = `WP ${i + 1}`;
        waypointCell.style.fontWeight = 'bold';
        row.appendChild(waypointCell);

        for (let j = 0; j < data[i].length; j++) {
            const cell = document.createElement('td');
            cell.textContent = data[i][j].toFixed(4);
            row.appendChild(cell);
        }
        table.appendChild(row);
    }

    if (data.length > 10) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = data[0].length + 1;
        cell.textContent = `... and ${data.length - 10} more waypoints`;
        cell.style.fontStyle = 'italic';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        table.appendChild(row);
    }

    previewDiv.style.display = 'block';
}

function updateInfo(data) {
    document.getElementById('numWaypoints').textContent = data.length;
    document.getElementById('numJoints').textContent = data[0].length;
}

function plotTrajectory() {
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
            trajectoryData = parseCSV(csvText);

            previewCSV(trajectoryData);
            updateInfo(trajectoryData);
            createPlot(trajectoryData);

            showStatus(`Successfully loaded trajectory with ${trajectoryData.length} waypoints and ${trajectoryData[0].length} joints.`);
        } catch (error) {
            showStatus(`Error parsing CSV: ${error.message}`, true);
        }
    };

    reader.readAsText(file);
}

function createPlot(data) {
    const numWaypoints = data.length;
    const numJoints = data[0].length;

    // Create normalized x-axis (0 to 1)
    const xAxis = Array.from({ length: numWaypoints }, (_, i) => i / (numWaypoints - 1));

    // Create subplot titles
    const subplotTitles = Array.from({ length: numJoints }, (_, i) => `Joint ${i + 1}`);

    // Create traces for each joint
    const traces = [];
    for (let joint = 0; joint < numJoints; joint++) {
        const yValues = data.map(waypoint => waypoint[joint]);

        traces.push({
            x: xAxis,
            y: yValues,
            type: 'scatter',
            mode: 'lines+markers',
            name: `Joint ${joint + 1}`,
            line: {
                width: 2,
                color: `hsl(${(joint * 360 / numJoints) % 360}, 70%, 50%)`
            },
            marker: {
                size: 6,
                color: `hsl(${(joint * 360 / numJoints) % 360}, 70%, 40%)`
            },
            xaxis: 'x',
            yaxis: `y${joint === 0 ? '' : joint + 1}`,
            hovertemplate:
                '<b>Joint ' + (joint + 1) + '</b><br>' +
                'Progress: %{x:.3f}<br>' +
                'Value: %{y:.4f}<br>' +
                '<extra></extra>'
        });
    }

    // Create subplot layout
    const layout = {
        title: {
            text: `Joint Trajectory Plot (${numJoints} DOF Robot)`,
            font: { size: 20 }
        },
        showlegend: false,
        grid: {
            rows: numJoints,
            columns: 1,
            subplots: Array.from({ length: numJoints }, (_, i) => [`xy${i === 0 ? '' : i + 1}`]),
            roworder: 'top to bottom'
        },
        height: Math.max(400, numJoints * 200),
        margin: { l: 80, r: 50, t: 80, b: 60 },
        plot_bgcolor: 'rgba(240, 240, 240, 0.5)',
        paper_bgcolor: 'white'
    };

    // Configure x-axis for bottom subplot only
    layout[`xaxis${numJoints === 1 ? '' : numJoints}`] = {
        title: 'Trajectory Progress [0, 1]',
        range: [0, 1],
        showgrid: true,
        gridcolor: 'rgba(128, 128, 128, 0.3)'
    };

    // Configure y-axes for each subplot
    for (let i = 0; i < numJoints; i++) {
        const yAxisKey = `yaxis${i === 0 ? '' : i + 1}`;
        layout[yAxisKey] = {
            title: `Joint ${i + 1} Value`,
            showgrid: true,
            gridcolor: 'rgba(128, 128, 128, 0.3)'
        };

        // Hide x-axis labels for all but the bottom subplot
        if (i < numJoints - 1) {
            const xAxisKey = `xaxis${i === 0 ? '' : i + 1}`;
            layout[xAxisKey] = {
                showticklabels: false,
                showgrid: true,
                gridcolor: 'rgba(128, 128, 128, 0.3)',
                range: [0, 1]
            };
        }
    }

    // Plot configuration
    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        displaylogo: false,
        toImageButtonOptions: {
            format: 'png',
            filename: 'joint_trajectory_plot',
            height: layout.height,
            width: 1200,
            scale: 1
        }
    };

    Plotly.newPlot('trajectoryPlot', traces, layout, config);
}

function exportPlot() {
    if (!trajectoryData) {
        showStatus('Please load and plot trajectory data first.', true);
        return;
    }

    Plotly.downloadImage('trajectoryPlot', {
        format: 'png',
        filename: 'joint_trajectory_plot',
        height: 800,
        width: 1200,
        scale: 2
    }).then(() => {
        showStatus('Plot exported successfully!');
    }).catch(() => {
        showStatus('Failed to export plot.', true);
    });
}

// File input change handler for automatic preview
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('csvFile').addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            showStatus(`Selected file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
        }
    });
});