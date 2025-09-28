// --- Sample URDF (minimal robot with 2 revolute joints) ---
const sampleUrdfText = `
<robot name="simple_bot">
  <link name="base_link"/>
  <link name="link1"/>
  <link name="link2"/>
  <link name="end_effector"/>
  <joint name="joint1" type="revolute">
    <parent link="base_link"/>
    <child link="link1"/>
    <origin xyz="0 0 0" rpy="0 0 0"/>
    <axis xyz="0 0 1"/>
    <limit lower="-1.57" upper="1.57"/>
  </joint>
  <joint name="joint2" type="revolute">
    <parent link="link1"/>
    <child link="link2"/>
    <origin xyz="1 0 0" rpy="0 0 0"/>
    <axis xyz="0 0 1"/>
    <limit lower="-3.14" upper="3.14"/>
  </joint>
  <joint name="joint3" type="fixed">
    <parent link="link2"/>
    <child link="end_effector"/>
    <origin xyz="1 0 0" rpy="0 0 0"/>
  </joint>
</robot>
`;

// Global variables for current URDF data
let currentUrdfText = sampleUrdfText;
let parser, urdf, links, joints, parentMap;
let frameVisibility = {}; // Track visibility state of each frame
let frameScale = 0.2; // Scale factor for coordinate frames

// --- URDF Loading Functions ---
function loadUrdfFromText(urdfText) {
    try {
        parser = new DOMParser();
        urdf = parser.parseFromString(urdfText, "application/xml");

        // Check for parsing errors
        const parseError = urdf.getElementsByTagName('parsererror');
        if (parseError.length > 0) {
            throw new Error('XML parsing error: ' + parseError[0].textContent);
        }

        // Parse links and joints
        links = [...urdf.getElementsByTagName("link")].map(l => l.getAttribute("name"));
        joints = [...urdf.getElementsByTagName("joint")].map(j => {
            const parentEl = j.getElementsByTagName("parent")[0];
            const childEl = j.getElementsByTagName("child")[0];
            const originEl = j.getElementsByTagName("origin")[0];
            const axisEl = j.getElementsByTagName("axis")[0];
            const limitEl = j.getElementsByTagName("limit")[0];

            return {
                name: j.getAttribute("name"),
                type: j.getAttribute("type"),
                parent: parentEl ? parentEl.getAttribute("link") : null,
                child: childEl ? childEl.getAttribute("link") : null,
                origin: parseOrigin(originEl),
                axis: parseAxis(axisEl),
                limits: parseLimits(limitEl),
                value: 0
            };
        }).filter(j => j.parent && j.child); // Only keep joints with valid parent and child links

        console.log('URDF loaded successfully:', links.length, 'links,', joints.length, 'joints');

        // Initialize frame visibility (all visible by default)
        frameVisibility = {};
        links.forEach(link => {
            frameVisibility[link] = true;
        });

        // Update "Show All Frames" checkbox state
        const showAllCheckbox = document.getElementById('showAllFramesCheckbox');
        if (showAllCheckbox) {
            showAllCheckbox.checked = true;
        }

        // Rebuild UI and update visualization
        buildSliderUI();
        buildParentMap();
        updateOutput();

    } catch (error) {
        console.error('Error loading URDF:', error);
        alert('Error loading URDF file: ' + error.message);
    }
}

function loadSampleURDF() {
    currentUrdfText = sampleUrdfText;
    loadUrdfFromText(currentUrdfText);
}

// File input handler
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('urdfFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    currentUrdfText = e.target.result;
                    loadUrdfFromText(currentUrdfText);
                };
                reader.onerror = () => {
                    alert('Error reading file');
                };
                reader.readAsText(file);
            }
        });
    }

    // Load sample URDF initially
    loadSampleURDF();

    // Add frame scale slider event listener
    const frameScaleSlider = document.getElementById('frameScaleSlider');
    const frameScaleValue = document.getElementById('frameScaleValue');
    if (frameScaleSlider && frameScaleValue) {
        frameScaleSlider.addEventListener('input', (e) => {
            frameScale = parseFloat(e.target.value);
            frameScaleValue.textContent = frameScale.toFixed(2);

            // Update visualization with new scale
            if (typeof updateVisualization === 'function') {
                const fk = computeFK();
                updateVisualization(fk, links, frameVisibility, frameScale);
            }
        });
    }

    // Add STL file input event listener
    const stlFileInput = document.getElementById('stlFileInput');
    if (stlFileInput) {
        stlFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file && typeof loadSTLFile === 'function') {
                loadSTLFile(file);
            }
        });
    }
});

function parseOrigin(el) {
    if (!el) return { xyz: [0, 0, 0], rpy: [0, 0, 0] };
    const xyz = el.getAttribute("xyz")?.split(" ").map(Number) || [0, 0, 0];
    const rpy = el.getAttribute("rpy")?.split(" ").map(Number) || [0, 0, 0];
    return { xyz, rpy };
}

function parseAxis(el) {
    if (!el) return [0, 0, 1]; // Default Z-axis for revolute joints
    const axis = el.getAttribute("xyz");
    if (!axis) return [0, 0, 1];
    return axis.split(" ").map(Number);
}

function parseLimits(el) {
    if (!el) return { lower: -3.14, upper: 3.14 }; // Default limits
    const lower = el.getAttribute("lower");
    const upper = el.getAttribute("upper");
    return {
        lower: lower ? parseFloat(lower) : -3.14,
        upper: upper ? parseFloat(upper) : 3.14
    };
}

// --- Math helpers ---
function rotFromRPY([r, p, y]) {
    const sr = Math.sin(r), cr = Math.cos(r);
    const sp = Math.sin(p), cp = Math.cos(p);
    const sy = Math.sin(y), cy = Math.cos(y);
    return [
        [cy * cp, cy * sp * sr - sy * cr, cy * sp * cr + sy * sr],
        [sy * cp, sy * sp * sr + cy * cr, sy * sp * cr - cy * sr],
        [-sp, cp * sr, cp * cr]
    ];
}

function matMul(A, B) {
    let C = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 1]];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            C[i][j] = A[i][0] * B[0][j] + A[i][1] * B[1][j] + A[i][2] * B[2][j] + A[i][3] * B[3][j];
        }
    }
    return C;
}

function transMat(xyz, rpy) {
    const R = rotFromRPY(rpy);
    return [
        [R[0][0], R[0][1], R[0][2], xyz[0]],
        [R[1][0], R[1][1], R[1][2], xyz[1]],
        [R[2][0], R[2][1], R[2][2], xyz[2]],
        [0, 0, 0, 1]
    ];
}

function jointTransform(j) {
    if (j.type === "revolute") {
        const angle = j.value;
        const [ax, ay, az] = j.axis;
        const norm = Math.sqrt(ax * ax + ay * ay + az * az);
        const x = ax / norm, y = ay / norm, z = az / norm;
        const c = Math.cos(angle), s = Math.sin(angle);
        const R = [
            [c + (1 - c) * x * x, (1 - c) * x * y - s * z, (1 - c) * x * z + s * y],
            [(1 - c) * y * x + s * z, c + (1 - c) * y * y, (1 - c) * y * z - s * x],
            [(1 - c) * z * x - s * y, (1 - c) * z * y + s * x, c + (1 - c) * z * z]
        ];
        const T = transMat(j.origin.xyz, j.origin.rpy);
        return matMul(T, [
            [R[0][0], R[0][1], R[0][2], 0],
            [R[1][0], R[1][1], R[1][2], 0],
            [R[2][0], R[2][1], R[2][2], 0],
            [0, 0, 0, 1]
        ]);
    } else if (j.type === "prismatic") {
        const d = j.value;
        const [ax, ay, az] = j.axis;
        const T = transMat(j.origin.xyz, j.origin.rpy);
        return matMul(T, [
            [1, 0, 0, ax * d],
            [0, 1, 0, ay * d],
            [0, 0, 1, az * d],
            [0, 0, 0, 1]
        ]);
    } else {
        return transMat(j.origin.xyz, j.origin.rpy);
    }
}

// --- Build tree for FK ---
function buildParentMap() {
    parentMap = {};
    joints.forEach(j => { parentMap[j.child] = j; });
}

function computeFK() {
    let transforms = {};
    function recurse(link) {
        if (!parentMap[link]) {
            transforms[link] = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
            return transforms[link];
        }
        const joint = parentMap[link];
        const parentT = recurse(joint.parent);
        const thisT = jointTransform(joint);
        transforms[link] = matMul(parentT, thisT);
        return transforms[link];
    }
    links.forEach(l => recurse(l));
    return transforms;
}

// --- UI Sliders ---
function buildSliderUI() {
    const slidersDiv = document.getElementById("sliders");

    // Clear existing sliders
    slidersDiv.innerHTML = "";

    // Add reset button
    const resetDiv = document.createElement("div");
    resetDiv.innerHTML = `<button type="button" class="btn-generate" onclick="resetAllJoints()">Reset All to Zero</button>`;
    slidersDiv.appendChild(resetDiv);

    joints.forEach((j, idx) => {
        if (j.type === "revolute" || j.type === "prismatic") {
            const div = document.createElement("div");
            div.className = "slider-container";
            div.innerHTML = `<label class="slider-label">${j.name} (${j.type}) [${j.limits.lower.toFixed(2)} to ${j.limits.upper.toFixed(2)}]</label><input class="slider-input" type="range" min="${j.limits.lower}" max="${j.limits.upper}" step="0.01" value="0" id="slider${idx}"><span id="jointValue${idx}">0.00</span>`;
            slidersDiv.appendChild(div);
            document.getElementById(`slider${idx}`).addEventListener("input", e => {
                j.value = parseFloat(e.target.value);
                // Update the value display
                document.getElementById(`jointValue${idx}`).textContent = j.value.toFixed(2);
                updateOutput();
            });
        }
    });
}

// Reset function
function resetAllJoints() {
    joints.forEach((j, idx) => {
        if (j.type === "revolute" || j.type === "prismatic") {
            j.value = 0;
            document.getElementById(`slider${idx}`).value = 0;
            // Reset the value display
            const valueDisplay = document.getElementById(`jointValue${idx}`);
            if (valueDisplay) {
                valueDisplay.textContent = "0.00";
            }
        }
    });
    updateOutput();
}

// Toggle frame visibility function
function toggleFrameVisibility(linkName, isVisible) {
    frameVisibility[linkName] = isVisible;

    // Update the "Show All Frames" checkbox state
    const showAllCheckbox = document.getElementById('showAllFramesCheckbox');
    if (showAllCheckbox) {
        const allVisible = links.every(link => frameVisibility[link]);
        showAllCheckbox.checked = allVisible;
    }

    // Update 3D visualization
    if (typeof updateVisualization === 'function') {
        const fk = computeFK();
        updateVisualization(fk, links, frameVisibility, frameScale);
    }
}

// Toggle all frames visibility function
function toggleAllFrames(showAll) {
    // Update all frame visibility states
    links.forEach(link => {
        frameVisibility[link] = showAll;
    });

    // Update all individual checkboxes
    links.forEach(link => {
        const checkbox = document.getElementById(`frame-${link}`);
        if (checkbox) {
            checkbox.checked = showAll;
        }
    });

    // Update 3D visualization
    if (typeof updateVisualization === 'function') {
        const fk = computeFK();
        updateVisualization(fk, links, frameVisibility, frameScale);
    }
}

// --- Update Output ---
function updateOutput() {
    const fk = computeFK();
    let html = '<h3>Forward Kinematics (per link):</h3>';

    for (const l of links) {
        html += `<div class="matrix">`;
        html += `<div class="matrix-title">`;
        html += `<input type="checkbox" id="frame-${l}" ${frameVisibility[l] ? 'checked' : ''} onchange="toggleFrameVisibility('${l}', this.checked)"> `;
        html += `${l} Transform Matrix:</div>`;
        const T = fk[l];

        // Format as proper 4x4 matrix with brackets
        html += `<div class="matrix-row">⎡ ${T[0].map(v => v.toFixed(3).padStart(8)).join('  ')} ⎤</div>`;
        html += `<div class="matrix-row">⎢ ${T[1].map(v => v.toFixed(3).padStart(8)).join('  ')} ⎥</div>`;
        html += `<div class="matrix-row">⎢ ${T[2].map(v => v.toFixed(3).padStart(8)).join('  ')} ⎦</div>`;
        html += `<div class="matrix-row">⎣ ${T[3].map(v => v.toFixed(3).padStart(8)).join('  ')} ⎦</div>`;
        html += `</div>`;
    }

    document.getElementById("output").innerHTML = html;

    // Update 3D visualization if available
    if (typeof updateVisualization === 'function') {
        updateVisualization(fk, links, frameVisibility, frameScale);
    }
}