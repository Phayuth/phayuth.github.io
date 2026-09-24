const state = {
    lengths: [1, 1, 1],
    target: [1, 2],
    q: [0, 0, 0],
    branch: 1,
    nullspacePosition: 0.5
};
let cspaceCamera = null;
let cspaceRelayoutBound = false;

const plotLayout = {
    paper_bgcolor: 'white',
    plot_bgcolor: 'rgba(240, 240, 240, 0.5)',
    margin: { l: 55, r: 20, t: 20, b: 50 },
    font: { family: 'Arial, sans-serif', size: 12, color: '#333' },
    showlegend: true
};

function wrapToPi(angle) {
    return ((angle + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
}

function forwardKinematics(q, lengths = state.lengths) {
    const [q1, q2, q3] = q;
    const [l1, l2, l3] = lengths;
    const t2 = q1 + q2;
    const t3 = t2 + q3;
    return [
        l1 * Math.cos(q1) + l2 * Math.cos(t2) + l3 * Math.cos(t3),
        l1 * Math.sin(q1) + l2 * Math.sin(t2) + l3 * Math.sin(t3)
    ];
}

function clipTarget(target) {
    const [l1, l2, l3] = state.lengths;
    const radius = Math.hypot(target[0], target[1]);
    const minimum = Math.max(0, Math.max(l1, l2, l3) - (l1 + l2 + l3 - Math.max(l1, l2, l3)));
    const maximum = l1 + l2 + l3;
    const clippedRadius = Math.min(maximum, Math.max(minimum, radius));
    const angle = radius < 1e-9 ? 0 : Math.atan2(target[1], target[0]);
    return [clippedRadius * Math.cos(angle), clippedRadius * Math.sin(angle)];
}

function solveManifold() {
    const [l1, l2, l3] = state.lengths;
    const values = { 1: [], '-1': [] };
    const target = state.target;
    for (let i = 0; i < 900; i += 1) {
        const q1 = -Math.PI + (2 * Math.PI * i) / 899;
        const px = l1 * Math.cos(q1);
        const py = l1 * Math.sin(q1);
        const dx = target[0] - px;
        const dy = target[1] - py;
        const d2 = dx * dx + dy * dy;
        const cosine = (d2 - l2 * l2 - l3 * l3) / (2 * l2 * l3);
        if (cosine < -1 - 1e-9 || cosine > 1 + 1e-9) continue;
        const c3 = Math.max(-1, Math.min(1, cosine));
        const s3abs = Math.sqrt(Math.max(0, 1 - c3 * c3));
        [1, -1].forEach(branch => {
            const q3 = Math.atan2(branch * s3abs, c3);
            const q2Absolute = Math.atan2(dy, dx) - Math.atan2(l3 * Math.sin(q3), l2 + l3 * Math.cos(q3));
            const q = [q1, wrapToPi(q2Absolute - q1), q3];
            const error = Math.hypot(...forwardKinematics(q).map((value, index) => value - target[index]));
            if (error < 1e-7) values[branch].push(q);
        });
    }
    return values;
}

function configurationPoints() {
    const [p1x, p1y] = [state.lengths[0] * Math.cos(state.q[0]), state.lengths[0] * Math.sin(state.q[0])];
    const [p2x, p2y] = [p1x + state.lengths[1] * Math.cos(state.q[0] + state.q[1]), p1y + state.lengths[1] * Math.sin(state.q[0] + state.q[1])];
    const [p3x, p3y] = [p2x + state.lengths[2] * Math.cos(state.q[0] + state.q[1] + state.q[2]), p2y + state.lengths[2] * Math.sin(state.q[0] + state.q[1] + state.q[2])];
    return [[0, p1x, p2x, p3x], [0, p1y, p2y, p3y]];
}

function plotManifoldBranch(values) {
    const q1Step = (2 * Math.PI) / 899;
    const x = [];
    const y = [];
    const z = [];
    for (let index = 0; index < values.length; index += 1) {
        if (index > 0) {
            const previous = values[index - 1];
            const current = values[index];
            const q1Gap = Math.abs(current[0] - previous[0]);
            const jointJump = Math.hypot(...current.map((value, joint) => value - previous[joint]));
            if (q1Gap > q1Step * 1.5 || jointJump > 0.5) {
                x.push(null);
                y.push(null);
                z.push(null);
            }
        }
        x.push(values[index][0]);
        y.push(values[index][1]);
        z.push(values[index][2]);
    }
    return { x, y, z };
}

function updateStatus(message, error = false) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${error ? 'error' : 'ready'}`;
}

function drawWorkspace() {
    const [l1, l2, l3] = state.lengths;
    const maximum = l1 + l2 + l3;
    const minimum = Math.max(0, Math.max(l1, l2, l3) - (maximum - Math.max(l1, l2, l3)));
    const theta = Array.from({ length: 181 }, (_, i) => (2 * Math.PI * i) / 180);
    const outerX = theta.map(value => maximum * Math.cos(value));
    const outerY = theta.map(value => maximum * Math.sin(value));
    const innerX = theta.map(value => minimum * Math.cos(value));
    const innerY = theta.map(value => minimum * Math.sin(value));
    const [robotX, robotY] = configurationPoints();
    const traces = [
        { x: outerX.concat(innerX.slice().reverse()), y: outerY.concat(innerY.slice().reverse()), fill: 'toself', fillcolor: 'rgba(33, 150, 243, 0.12)', line: { color: '#2196F3', width: 1 }, name: 'Reachable workspace', mode: 'lines' },
        { x: robotX, y: robotY, mode: 'lines+markers', line: { color: '#4CAF50', width: 4 }, marker: { size: 9 }, name: 'Robot' },
        { x: [robotX[3]], y: [robotY[3]], mode: 'markers', marker: { color: '#111', size: 7 }, name: 'End effector' }
    ];
    const layout = { ...plotLayout, xaxis: { title: 'x', range: [-maximum - 0.25, maximum + 0.25], zeroline: true }, yaxis: { title: 'y', range: [-maximum - 0.25, maximum + 0.25], scaleanchor: 'x', scaleratio: 1, zeroline: true }, legend: { orientation: 'h', y: -0.18 } };
    const plot = document.getElementById('workspacePlot');
    Plotly.react(plot, traces, layout, { responsive: true, displaylogo: false, modeBarButtonsToRemove: ['lasso2d', 'select2d'] });
}

function drawCspace() {
    const manifold = solveManifold();
    const traces = [1, -1].map(branch => {
        const values = manifold[branch];
        const plotValues = plotManifoldBranch(values);
        return { ...plotValues, type: 'scatter3d', mode: 'lines', connectgaps: false, name: `Elbow branch ${branch > 0 ? '+' : '-'}1`, line: { width: 4, color: branch > 0 ? '#2196F3' : '#FF9800' } };
    });
    traces.push(
        { x: [-Math.PI, Math.PI], y: [0, 0], z: [0, 0], type: 'scatter3d', mode: 'lines', name: 'q1 axis', showlegend: false, line: { width: 3, color: '#D32F2F' } },
        { x: [0, 0], y: [-Math.PI, Math.PI], z: [0, 0], type: 'scatter3d', mode: 'lines', name: 'q2 axis', showlegend: false, line: { width: 3, color: '#388E3C' } },
        { x: [0, 0], y: [0, 0], z: [-Math.PI, Math.PI], type: 'scatter3d', mode: 'lines', name: 'q3 axis', showlegend: false, line: { width: 3, color: '#1976D2' } },
        { x: [0], y: [0], z: [0], type: 'scatter3d', mode: 'markers', name: 'Origin', showlegend: false, marker: { size: 5, color: '#111' } }
    );
    traces.push({ x: [state.q[0]], y: [state.q[1]], z: [state.q[2]], type: 'scatter3d', mode: 'markers', name: 'Configuration', marker: { size: 6, color: '#F44336' } });
    const scene = { aspectmode: 'cube', aspectratio: { x: 1, y: 1, z: 1 }, ...(cspaceCamera ? { camera: cspaceCamera } : {}), uirevision: 'cspace', xaxis: { title: 'q1 [rad]', range: [-Math.PI, Math.PI], zeroline: true, zerolinecolor: '#777' }, yaxis: { title: 'q2 [rad]', range: [-Math.PI, Math.PI], zeroline: true, zerolinecolor: '#777' }, zaxis: { title: 'q3 [rad]', range: [-Math.PI, Math.PI], zeroline: true, zerolinecolor: '#777' } };
    const plot = document.getElementById('cspacePlot');
    Plotly.react(plot, traces, { ...plotLayout, scene, legend: { orientation: 'h', y: -0.08 } }, { responsive: true, displaylogo: false }).then(() => {
        if (!cspaceRelayoutBound) {
            plot.on('plotly_relayout', eventData => {
                if (eventData['scene.camera']) {
                    cspaceCamera = eventData['scene.camera'];
                }
            });
            cspaceRelayoutBound = true;
        }
    });
}

function updateSliders() {
    state.q.forEach((value, index) => {
        document.getElementById(`q${index + 1}`).value = value;
        document.getElementById(`q${index + 1}Value`).textContent = value.toFixed(2);
    });
    state.lengths.forEach((value, index) => {
        document.getElementById(`l${index + 1}Value`).textContent = value.toFixed(2);
    });
    document.getElementById('branchSelect').value = state.branch;
    document.getElementById('nullspace').value = Math.round(state.nullspacePosition * 100);
    document.getElementById('nullspaceValue').textContent = state.nullspacePosition.toFixed(2);
}

function redraw(message) {
    updateSliders();
    drawWorkspace();
    drawCspace();
    if (message) updateStatus(message);
}

function applyNullspaceConfiguration(message) {
    const manifold = solveManifold();
    const solutions = manifold[state.branch];
    if (!solutions.length) {
        updateStatus(`No solutions are available on IK branch ${state.branch > 0 ? '+1' : '-1'}.`, true);
        return;
    }
    const solutionIndex = Math.round(state.nullspacePosition * (solutions.length - 1));
    state.q = solutions[solutionIndex];
    redraw(message);
}

document.addEventListener('DOMContentLoaded', () => {
    ['q1', 'q2', 'q3'].forEach((id, index) => document.getElementById(id).addEventListener('input', event => {
        state.q[index] = Number(event.target.value);
        state.target = forwardKinematics(state.q);
        redraw('Configuration updated from the joint sliders.');
    }));
    document.getElementById('branchSelect').addEventListener('change', event => {
        state.branch = Number(event.target.value);
        applyNullspaceConfiguration(`Selected IK branch ${state.branch > 0 ? '+1' : '-1'}.`);
    });
    document.getElementById('nullspace').addEventListener('input', event => {
        state.nullspacePosition = Number(event.target.value) / 100;
        applyNullspaceConfiguration('Moved along the selected IK nullspace branch.');
    });
    ['l1', 'l2', 'l3'].forEach((id, index) => document.getElementById(id).addEventListener('input', event => {
        state.lengths[index] = Number(event.target.value);
        state.target = clipTarget(state.target);
        applyNullspaceConfiguration('Link length changed; selected nullspace configuration updated.');
    }));
    const initialSolutions = solveManifold()[1];
    if (initialSolutions.length) {
        state.nullspacePosition = 0.5;
        state.q = initialSolutions[Math.floor(state.nullspacePosition * (initialSolutions.length - 1))];
    }
    redraw();
});
