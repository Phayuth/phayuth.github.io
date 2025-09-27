const T_parent = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
let T_child = [[1, 0, 0, 2], [0, 1, 0, 1], [0, 0, 1, 1], [0, 0, 0, 1]];

function degToRad(deg) { return deg * Math.PI / 180; }

function makeFrameTraces(T, namePrefix) {
    const o = [T[0][3], T[1][3], T[2][3]];
    const x = [o[0] + T[0][0], o[1] + T[1][0], o[2] + T[2][0]];
    const y = [o[0] + T[0][1], o[1] + T[1][1], o[2] + T[2][1]];
    const z = [o[0] + T[0][2], o[1] + T[1][2], o[2] + T[2][2]];
    return [
        { type: 'scatter3d', mode: 'lines+markers', name: namePrefix + ' X', x: [o[0], x[0]], y: [o[1], x[1]], z: [o[2], x[2]], line: { color: 'red', width: 6 }, marker: { size: 3 } },
        { type: 'scatter3d', mode: 'lines+markers', name: namePrefix + ' Y', x: [o[0], y[0]], y: [o[1], y[1]], z: [o[2], y[2]], line: { color: 'green', width: 6 }, marker: { size: 3 } },
        { type: 'scatter3d', mode: 'lines+markers', name: namePrefix + ' Z', x: [o[0], z[0]], y: [o[1], z[1]], z: [o[2], z[2]], line: { color: 'blue', width: 6 }, marker: { size: 3 } }
    ];
}

const layout = { margin: { l: 0, r: 0, t: 0, b: 0 }, showlegend: false, scene: { aspectmode: 'cube', xaxis: { range: [-5, 5] }, yaxis: { range: [-5, 5] }, zaxis: { range: [0, 10] }, camera: null } };

function updatePlot() {
    const gd = document.getElementById('framePlot');
    if (gd.data && gd.layout && gd.layout.scene && gd.layout.scene.camera) {
        layout.scene.camera = gd.layout.scene.camera;
    }

    T_child[0][3] = parseFloat(document.getElementById("xInput").value);
    T_child[1][3] = parseFloat(document.getElementById("yInput").value);
    T_child[2][3] = parseFloat(document.getElementById("zInput").value);

    const traces = [...makeFrameTraces(T_parent, "Parent"), ...makeFrameTraces(T_child, "Child")];
    Plotly.react('framePlot', traces, layout);
}

function rotateChild(axis) {
    let deg = 0;
    if (axis === 'x') deg = parseFloat(document.getElementById("rotXInput").value);
    if (axis === 'y') deg = parseFloat(document.getElementById("rotYInput").value);
    if (axis === 'z') deg = parseFloat(document.getElementById("rotZInput").value);

    const theta = degToRad(deg);
    let R = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    if (axis === 'x') R = [[1, 0, 0], [0, Math.cos(theta), -Math.sin(theta)], [0, Math.sin(theta), Math.cos(theta)]];
    if (axis === 'y') R = [[Math.cos(theta), 0, Math.sin(theta)], [0, 1, 0], [-Math.sin(theta), 0, Math.cos(theta)]];
    if (axis === 'z') R = [[Math.cos(theta), -Math.sin(theta), 0], [Math.sin(theta), Math.cos(theta), 0], [0, 0, 1]];

    const C = T_child;
    const newR = [
        [C[0][0] * R[0][0] + C[0][1] * R[1][0] + C[0][2] * R[2][0], C[0][0] * R[0][1] + C[0][1] * R[1][1] + C[0][2] * R[2][1], C[0][0] * R[0][2] + C[0][1] * R[1][2] + C[0][2] * R[2][2]],
        [C[1][0] * R[0][0] + C[1][1] * R[1][0] + C[1][2] * R[2][0], C[1][0] * R[0][1] + C[1][1] * R[1][1] + C[1][2] * R[2][1], C[1][0] * R[0][2] + C[1][1] * R[1][2] + C[1][2] * R[2][2]],
        [C[2][0] * R[0][0] + C[2][1] * R[1][0] + C[2][2] * R[2][0], C[2][0] * R[0][1] + C[2][1] * R[1][1] + C[2][2] * R[2][1], C[2][0] * R[0][2] + C[2][1] * R[1][2] + C[2][2] * R[2][2]]
    ];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) T_child[i][j] = newR[i][j];
    updatePlot();
}

function resetRotation() {
    const x = T_child[0][3], y = T_child[1][3], z = T_child[2][3];
    T_child = [[1, 0, 0, x], [0, 1, 0, y], [0, 0, 1, z], [0, 0, 0, 1]];
    updatePlot();
}

function rotMatrixToQuat(R) {
    const m00 = R[0][0], m01 = R[0][1], m02 = R[0][2];
    const m10 = R[1][0], m11 = R[1][1], m12 = R[1][2];
    const m20 = R[2][0], m21 = R[2][1], m22 = R[2][2];
    let qw, qx, qy, qz;
    const trace = m00 + m11 + m22;
    if (trace > 0) {
        const s = 0.5 / Math.sqrt(trace + 1.0);
        qw = 0.25 / s; qx = (m21 - m12) * s; qy = (m02 - m20) * s; qz = (m10 - m01) * s;
    } else if (m00 > m11 && m00 > m22) {
        const s = 2.0 * Math.sqrt(1.0 + m00 - m11 - m22);
        qw = (m21 - m12) / s; qx = 0.25 * s; qy = (m01 + m10) / s; qz = (m02 + m20) / s;
    } else if (m11 > m22) {
        const s = 2.0 * Math.sqrt(1.0 + m11 - m00 - m22);
        qw = (m02 - m20) / s; qx = (m01 + m10) / s; qy = 0.25 * s; qz = (m12 + m21) / s;
    } else {
        const s = 2.0 * Math.sqrt(1.0 + m22 - m00 - m11);
        qw = (m10 - m01) / s; qx = (m02 + m20) / s; qy = (m12 + m21) / s; qz = 0.25 * s;
    }
    return [qx, qy, qz, qw];
}

function showMatrix() {
    const matStr = T_child.map(r => r.map(v => v.toFixed(4)).join(", ")).join(", ");
    document.getElementById("matrixOutput").value = matStr;
    const pos = [T_child[0][3], T_child[1][3], T_child[2][3]];
    const quat = rotMatrixToQuat(T_child);
    const poseStr = [...pos, ...quat].map(v => v.toFixed(4)).join(", ");
    document.getElementById("poseOutput").value = poseStr;
}

// Initialize the plot when the page loads
updatePlot();
window.onresize = () => Plotly.Plots.resize('framePlot');