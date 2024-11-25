// Import FBXLoader and OrbitControls
import { FBXLoader } from 'https://cdn.skypack.dev/three@0.128/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128/examples/jsm/controls/OrbitControls.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvasContainer = document.getElementById('canvasContainer');

    // Set up the scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);

    // Set up the camera
    const camera = new THREE.PerspectiveCamera(75, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
    const initialCameraPosition = { x: 0, y: 0, z: 7.5 };
    camera.position.set(initialCameraPosition.x, initialCameraPosition.y, initialCameraPosition.z);

    // Set up the renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    renderer.shadowMap.enabled = true;
    canvasContainer.appendChild(renderer.domElement);

    let rainParticles;

    // Add ambient and directional lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true; // Enable shadow casting on the light
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    directionalLight.shadow.bias = -0.0005;
    scene.add(directionalLight);

    // Initialize OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    let model;

    // Load the 3D model
    const loader = new FBXLoader();
    loader.load('musc_man/Muscular_Man_Lores.fbx', function(fbx) {
        model = fbx;
        model.scale.set(0.05, 0.05, 0.05);
        model.castShadow = true;  // Allow model to cast shadows
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true; // Ensure all parts of model cast shadows
                child.receiveShadow = false;
            }
        });
        scene.add(model);

        // Center the model initially at y = 0
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const heightOffset = center.y;
        model.position.set(-center.x, -heightOffset, -center.z);

        // Position the ground plane at the model's lowest point
        const lowestPoint = box.min.y;
        groundPlane.position.y = -1 * (0.5 * box.max.y + lowestPoint);
    }, undefined, function(error) {
        console.error('Error loading FBX model:', error);
    });

    // Rain particle system
    function createRainParticles() {
        // Remove existing rain particles if they already exist
        if (rainParticles) {
            scene.remove(rainParticles);
        }

        const rainGeometry = new THREE.BufferGeometry();
        const rainCount = parseInt(rainDensitySlider.value);
        const positions = new Float32Array(rainCount * 3);

        for (let i = 0; i < rainCount; i++) {
            positions[i * 3] = Math.random() * 200 - 100;
            positions[i * 3 + 1] = Math.random() * 200;
            positions[i * 3 + 2] = Math.random() * 200 - 100;
        }

        rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const rainMaterial = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.1, transparent: true });
        rainParticles = new THREE.Points(rainGeometry, rainMaterial);
        scene.add(rainParticles);
    }

    function animateRain() {
        if (rainParticles) {
            const positions = rainParticles.geometry.attributes.position.array;
            const rainCount = positions.length / 3;
            for (let i = 0; i < rainCount; i++) {
                positions[i * 3 + 1] -= 0.2;
                if (positions[i * 3 + 1] < 0) {
                    positions[i * 3 + 1] = Math.random() * 200;
                }
            }
            rainParticles.geometry.attributes.position.needsUpdate = true;
        }
    }



    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();

    // Function to update model height without changing the y-position
    function updateModelHeight(newHeight) {
        if (model) {
            const scaleY = newHeight / 170;
            model.scale.y = scaleY;

            // Update ground plane position based on new model scale
            const box = new THREE.Box3().setFromObject(model);
            groundPlane.position.y = box.min.y; // Ensure ground aligns with model's lowest point
        }
    }

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000); // Large plane to simulate infinity
    // const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide });
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, opacity: 0.3, transparent: true }); // Visible material with transparency
    const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    groundPlane.rotation.x = -Math.PI / 2; // Set to xz plane
    groundPlane.receiveShadow = true;
    groundPlane.visible = false;
    scene.add(groundPlane);

    // UI Controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.style.padding = '8px';
    controlsContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    controlsContainer.style.borderRadius = '4px';
    controlsContainer.style.display = 'flex';
    controlsContainer.style.flexDirection = 'column';
    controlsContainer.style.alignItems = 'center';

    const modelViewContainer = document.getElementById('modelView');
    modelViewContainer.parentNode.insertBefore(controlsContainer, modelViewContainer);

    // Height slider for dynamic model scaling
    const heightSliderLabel = document.createElement('label');
    heightSliderLabel.textContent = 'Height (cm):';
    controlsContainer.appendChild(heightSliderLabel);

    const heightSlider = document.createElement('input');
    heightSlider.type = 'range';
    heightSlider.min = 5;  // Minimum height in cm
    heightSlider.max = 10;  // Maximum height in cm
    heightSlider.value = 7.5;  // Default height in cm
    heightSlider.step = 0.25;
    heightSlider.style.width = '150px';
    controlsContainer.appendChild(heightSlider);

    heightSlider.addEventListener('input', () => {
        updateModelHeight(parseFloat(heightSlider.value));
    });

    // Add grid helper
    let gridHelper = new THREE.GridHelper(1000, 20);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.visible = false;
    scene.add(gridHelper);

    // Checkbox and button for grid control
    const gridCheckbox = document.createElement('input');
    gridCheckbox.type = 'checkbox';
    const gridLabel = document.createElement('label');
    gridLabel.textContent = 'Enable Gridlines';
    controlsContainer.appendChild(gridCheckbox);
    controlsContainer.appendChild(gridLabel);
    gridCheckbox.addEventListener('change', () => {
        gridHelper.visible = gridCheckbox.checked;
    });

    const rotateGridButton = document.createElement('button');
    rotateGridButton.textContent = 'Rotate Grid';
    controlsContainer.appendChild(rotateGridButton);

    let gridPlane = 'xy';
    rotateGridButton.addEventListener('click', () => {
        if (gridPlane === 'xy') {
            gridHelper.rotation.set(0, Math.PI / 2, 0); // yz plane
            gridPlane = 'yz';
        } else if (gridPlane === 'yz') {
            gridHelper.rotation.set(0, 0, Math.PI / 2); // xz plane
            gridPlane = 'xz';
        } else {
            gridHelper.rotation.set(Math.PI / 2, 0, 0); // xy plane
            gridPlane = 'xy';
        }
        console.log("Grid rotated to plane:", gridPlane);
    });

    // Grid size slider
    const gridSizeSliderLabel = document.createElement('label');
    gridSizeSliderLabel.textContent = 'Grid Size:';
    controlsContainer.appendChild(gridSizeSliderLabel);

    const gridSizeSlider = document.createElement('input');
    gridSizeSlider.type = 'range';
    gridSizeSlider.min = 0.1;
    gridSizeSlider.max = 3;
    gridSizeSlider.step = 0.05;
    gridSizeSlider.value = 1;
    gridSizeSlider.style.width = '150px';
    controlsContainer.appendChild(gridSizeSlider);

    gridSizeSlider.addEventListener('input', () => {
        const squareSize = parseFloat(gridSizeSlider.value);
        scene.remove(gridHelper);
        gridHelper = new THREE.GridHelper(1000, Math.floor(1000 / squareSize));

        // Set the rotation based on the current plane
        if (gridPlane === 'xy') {
            gridHelper.rotation.set(Math.PI / 2, 0, 0);
        } else if (gridPlane === 'yz') {
            gridHelper.rotation.set(0, Math.PI / 2, 0);
        } else if (gridPlane === 'xz') {
            gridHelper.rotation.set(0, 0, Math.PI / 2);
        }

        gridHelper.visible = gridCheckbox.checked;
        scene.add(gridHelper);
        console.log("Grid size adjusted in plane:", gridPlane);
    });

    // Light position sliders
    const lightPositionLabel = document.createElement('label');
    lightPositionLabel.textContent = 'Adjust Light Position';
    controlsContainer.appendChild(lightPositionLabel);

    function createLightSlider(labelText, min, max, initialValue, callback) {
        const label = document.createElement('label');
        label.textContent = labelText;
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.step = 0.5
        slider.value = 0;
        slider.style.width = '150px';
        slider.addEventListener('input', () => callback(parseFloat(slider.value)));
        controlsContainer.appendChild(label);
        controlsContainer.appendChild(slider);
    }

    createLightSlider('Light X:', -20, 20, directionalLight.position.x, (val) => directionalLight.position.x = val);
    createLightSlider('Light Y:', -20, 20, directionalLight.position.y, (val) => directionalLight.position.y = val);
    createLightSlider('Light Z:', -20, 20, directionalLight.position.z, (val) => directionalLight.position.z = val);

    // Light brightness slider
    const brightnessLabel = document.createElement('label');
    brightnessLabel.textContent = 'Light Brightness:';
    controlsContainer.appendChild(brightnessLabel);

    const brightnessSlider = document.createElement('input');
    brightnessSlider.type = 'range';
    brightnessSlider.min = 0;    // Minimum brightness
    brightnessSlider.max = 2;    // Maximum brightness (feel free to adjust this range)
    brightnessSlider.step = 0.1; // Step for smoother control
    brightnessSlider.value = directionalLight.intensity; // Set default to current intensity
    brightnessSlider.style.width = '150px';
    controlsContainer.appendChild(brightnessSlider);

    brightnessSlider.addEventListener('input', () => {
        directionalLight.intensity = parseFloat(brightnessSlider.value);
    });


    // Ground plane checkbox
    const groundCheckbox = document.createElement('input');
    groundCheckbox.type = 'checkbox';
    const groundLabel = document.createElement('label');
    groundLabel.textContent = 'Enable Ground Plane';
    controlsContainer.appendChild(groundCheckbox);
    controlsContainer.appendChild(groundLabel);
    groundCheckbox.addEventListener('change', () => {
        groundPlane.visible = groundCheckbox.checked;
    });



    const wireframeCheckbox = document.createElement('input');
    wireframeCheckbox.type = 'checkbox';
    const wireframeLabel = document.createElement('label');
    wireframeLabel.textContent = 'Wireframe Mode';
    controlsContainer.appendChild(wireframeCheckbox);
    controlsContainer.appendChild(wireframeLabel);
    wireframeCheckbox.addEventListener('change', () => {
        model.traverse((child) => {
            if (child.isMesh) {
                child.material.wireframe = wireframeCheckbox.checked;
            }
        });
    });

    const rainDensityLabel = document.createElement('label');
    rainDensityLabel.textContent = 'Rain Density:';
    controlsContainer.appendChild(rainDensityLabel);

    const rainDensitySlider = document.createElement('input');
    rainDensitySlider.type = 'range';
    rainDensitySlider.min = 0;   // Set to a minimum density of 0 (no rain)
    rainDensitySlider.max = 2000000; // Maximum density (adjust as desired)
    rainDensitySlider.value = 1000; // Default density
    rainDensitySlider.step = 50;   // Step for control precision
    rainDensitySlider.style.width = '150px';
    controlsContainer.appendChild(rainDensitySlider);

    // Add event listener to recreate rain particles based on density
    rainDensitySlider.addEventListener('input', () => {
        createRainParticles();
    });

    createRainParticles(); // Initialize rain particles after setting up UI controls

    // scene.fog = new THREE.Fog(0xeeeeee, 10, 100);  // Adjust colors and distances

    // Model color picker
    const colorPickerLabel = document.createElement('label');
    colorPickerLabel.textContent = 'Model Color:';
    controlsContainer.appendChild(colorPickerLabel);

    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = '#888888'; // Default color, you can change it
    controlsContainer.appendChild(colorPicker);

    colorPicker.addEventListener('input', () => {
        const selectedColor = colorPicker.value;
        if (model) {
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material.color.set(selectedColor);
                }
            });
        }
    });


    // Home button
    const homeButton = document.createElement('button');
    homeButton.textContent = 'Home';
    homeButton.style.position = 'absolute';
    homeButton.style.top = '10px';
    homeButton.style.right = '10px';
    homeButton.style.padding = '8px 12px';
    homeButton.style.backgroundColor = '#4CAF50';
    canvasContainer.appendChild(homeButton);
    homeButton.addEventListener('click', () => {
        gsap.to(camera.position, {
            x: initialCameraPosition.x,
            y: initialCameraPosition.y,
            z: initialCameraPosition.z,
            duration: 1.5, // Duration of the animation in seconds
            onUpdate: () => controls.update() // Update controls as camera moves
        });

        gsap.to(controls.target, {
            x: 0,
            y: 0,
            z: 0,
            duration: 1.5,
            onUpdate: () => controls.update() // Keep controls target updated
        });
    });
});