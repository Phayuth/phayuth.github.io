// --- Three.js Visualization Module ---
let scene, camera, renderer;
let coordinateFrames = {}; // Store coordinate frames by link name

function initVisualization() {
    console.log('Initializing Three.js visualization...');

    // Check if THREE is available
    if (typeof THREE === 'undefined') {
        console.error('THREE.js is not loaded!');
        return;
    }

    // Get the container
    const container = document.getElementById('framePlot');
    if (!container) {
        console.error('framePlot container not found!');
        return;
    }

    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Rotate the entire scene so that Z is up (robotics convention)
    scene.rotation.x = -Math.PI / 2; // Rotate -90 degrees around X-axis

    // Get container dimensions
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;
    console.log('Container dimensions:', width, 'x', height);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(4, -4, 4); // Adjusted for Z-up coordinate system
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Add grid (horizontal plane in Z-up coordinate system)
    const gridHelper = new THREE.GridHelper(6, 12, 0x888888, 0xcccccc);
    gridHelper.rotation.x = Math.PI / 2; // Rotate grid to be horizontal in XY plane
    scene.add(gridHelper);

    // Add mouse controls
    addMouseControls();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Initial render
    render();
    console.log('Three.js visualization initialized successfully');
}

function createCoordinateFrame(size = 0.3) {
    const group = new THREE.Group();

    const axisRadius = size * 0.02;
    const arrowLength = size * 0.15;
    const arrowRadius = size * 0.05;

    // X-axis (Red)
    const xGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, size);
    const xMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const xAxis = new THREE.Mesh(xGeometry, xMaterial);
    xAxis.rotation.z = -Math.PI / 2;
    xAxis.position.x = size / 2;
    xAxis.castShadow = true;
    group.add(xAxis);

    // X-axis arrow
    const xArrowGeometry = new THREE.ConeGeometry(arrowRadius, arrowLength);
    const xArrow = new THREE.Mesh(xArrowGeometry, xMaterial);
    xArrow.rotation.z = -Math.PI / 2;
    xArrow.position.x = size + arrowLength / 2;
    xArrow.castShadow = true;
    group.add(xArrow);

    // Y-axis (Green)
    const yGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, size);
    const yMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const yAxis = new THREE.Mesh(yGeometry, yMaterial);
    yAxis.position.y = size / 2;
    yAxis.castShadow = true;
    group.add(yAxis);

    // Y-axis arrow
    const yArrowGeometry = new THREE.ConeGeometry(arrowRadius, arrowLength);
    const yArrow = new THREE.Mesh(yArrowGeometry, yMaterial);
    yArrow.position.y = size + arrowLength / 2;
    yArrow.castShadow = true;
    group.add(yArrow);

    // Z-axis (Blue)
    const zGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, size);
    const zMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });
    const zAxis = new THREE.Mesh(zGeometry, zMaterial);
    zAxis.rotation.x = Math.PI / 2;
    zAxis.position.z = size / 2;
    zAxis.castShadow = true;
    group.add(zAxis);

    // Z-axis arrow
    const zArrowGeometry = new THREE.ConeGeometry(arrowRadius, arrowLength);
    const zArrow = new THREE.Mesh(zArrowGeometry, zMaterial);
    zArrow.rotation.x = Math.PI / 2;
    zArrow.position.z = size + arrowLength / 2;
    zArrow.castShadow = true;
    group.add(zArrow);

    return group;
}

function addMouseControls() {
    let isMouseDown = false;
    let mouseX = 0, mouseY = 0;
    let cameraRadius = Math.sqrt(
        camera.position.x ** 2 +
        camera.position.y ** 2 +
        camera.position.z ** 2
    );

    renderer.domElement.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    document.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;

        const deltaX = e.clientX - mouseX;
        const deltaY = e.clientY - mouseY;

        // Convert camera position to spherical coordinates
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position);

        // Update angles
        spherical.theta -= deltaX * 0.01;
        spherical.phi -= deltaY * 0.01;  // Fixed: changed += to -= for natural drag direction
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

        // Update camera position
        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);

        mouseX = e.clientX;
        mouseY = e.clientY;

        render();
    });

    // Mouse wheel zoom
    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();

        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position);

        spherical.radius += e.deltaY * 0.01;
        spherical.radius = Math.max(1, Math.min(20, spherical.radius));

        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);

        render();
    });
}

function onWindowResize() {
    const container = document.getElementById('framePlot');
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    render();
}

function render() {
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Function called from URDF system to update visualization
function updateVisualization(forwardKinematics, linkData, visibility = {}, scale = 0.2) {
    if (!scene) {
        console.warn('Scene not initialized yet');
        return;
    }

    // Remove existing frames
    Object.values(coordinateFrames).forEach(frame => {
        scene.remove(frame);
    });
    coordinateFrames = {};

    // Create coordinate frames for each link
    linkData.forEach((linkInfo, index) => {
        const linkName = linkInfo.name;
        const transformMatrix = forwardKinematics[linkName];

        // Create coordinate frame with specified scale
        const frame = createCoordinateFrame(scale);

        // Apply transformation matrix
        applyTransformationMatrix(frame, transformMatrix);

        // Add label for the link
        addLinkLabel(frame, linkName, index);

        // Set visibility based on checkbox state
        const isVisible = visibility[linkName] !== false; // Default to visible
        frame.visible = isVisible;

        // Store and add to scene
        coordinateFrames[linkName] = frame;
        scene.add(frame);
    });

    render();
}

function applyTransformationMatrix(object, matrix) {
    // Create Three.js Matrix4 from our 4x4 array
    const threeMatrix = new THREE.Matrix4();
    threeMatrix.set(
        matrix[0][0], matrix[0][1], matrix[0][2], matrix[0][3],
        matrix[1][0], matrix[1][1], matrix[1][2], matrix[1][3],
        matrix[2][0], matrix[2][1], matrix[2][2], matrix[2][3],
        matrix[3][0], matrix[3][1], matrix[3][2], matrix[3][3]
    );

    // Apply the transformation
    object.applyMatrix4(threeMatrix);
}

function addLinkLabel(frame, linkName, index) {
    // Create smaller text label using canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 96;  // Reduced from 128
    canvas.height = 20; // Reduced from 32

    // Semi-transparent background for less obstruction
    context.fillStyle = 'rgba(255, 255, 255, 0.8)'; // Semi-transparent white
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = 'rgba(0, 0, 0, 0.6)'; // Semi-transparent border
    context.lineWidth = 1;
    context.strokeRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#000000';
    context.font = '10px Arial'; // Smaller font
    context.textAlign = 'center';
    context.fillText(linkName, canvas.width / 2, 13); // Adjusted vertical position

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true, // Enable transparency
        alphaTest: 0.1     // Improves rendering quality
    });
    const sprite = new THREE.Sprite(spriteMaterial);

    // Smaller scale and positioned closer to frame
    sprite.scale.set(0.3, 0.075, 1); // Reduced from (0.5, 0.125, 1)
    sprite.position.set(0, 0.2, 0);  // Closer to frame, reduced from 0.4

    frame.add(sprite);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure layout is complete
    setTimeout(initVisualization, 100);
});