import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

// Create scene
const scene = new THREE.Scene();

// Create camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1, 
    1000);
camera.position.z = 3.5;
camera.position.y = 2;

// Get canvas and create renderer
const canvas = document.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Load HDRI environment map
new RGBELoader()
    .load('https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/billiard_hall_1k.hdr', function(texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
        // scene.background = texture;
    });

scene.background = new THREE.Color(0x808080); // Medium grey
// Enable shadow rendering
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Create ground plane to receive shadows
const planeGeometry = new THREE.PlaneGeometry(50, 50);
const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;

        // Function to create soft circle
        float circle(vec2 uv, vec2 pos, float size) {
            float d = length(uv - pos);
            return smoothstep(size, size - 0.01, d);
        }

        void main() {
            vec2 uv = vUv;

            float bg = 0.25; // base grey
            float movingCircles = 0.01;

            // 3 circles moving in different directions
            movingCircles += circle(uv, vec2(0.5 + 0.2 * sin(uTime), 0.5 + 0.2 * cos(uTime)), 0.2);
            movingCircles += circle(uv, vec2(0.3 + 0.3 * cos(uTime * 0.7), 0.6 + 0.2 * sin(uTime * 0.7)), 0.15);
            movingCircles += circle(uv, vec2(0.3 + 0.3 * cos(uTime * 0.7), 0.6 + 0.2 * sin(uTime * 8. * 0.7)), 0.15);
            movingCircles += circle(uv, vec2(0.74 + 0.1 * cos(uTime * 5. * 0.7), 0.6 + 0.2 * sin(uTime * 0.7)), 0.15);
            movingCircles += circle(uv, vec2(0.54 + 0.5 * cos(uTime * 0.7), 0.6 + 0.2 * sin(uTime * 0.7)), 0.15);
            movingCircles += circle(uv, vec2(0.1 + 0.4 * cos(uTime * 4. * 0.7), 0.6 + 0.2 * sin(uTime * 0.7)), 0.15);
            movingCircles += circle(uv, vec2(0.7 + 0.2 * sin(uTime * 2.6 * 1.9), 0.4 + 0.3 * cos(uTime * 0.9)), 0.12);

            float finalGray = bg + movingCircles * 0.09; // blend with background
            gl_FragColor = vec4(vec3(finalGray), 1.0);
        }
    `
});



const plane = new THREE.Mesh(planeGeometry, shaderMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -5;
plane.receiveShadow = true;
scene.add(plane);


// Add directional light with shadow casting
const shadowLight = new THREE.DirectionalLight(0xffffff, 1);
shadowLight.position.set(5, 20, 5);
shadowLight.castShadow = true;
shadowLight.shadow.mapSize.width = 1024;
shadowLight.shadow.mapSize.height = 1024;
shadowLight.shadow.camera.near = 1;
shadowLight.shadow.camera.far = 50;
shadowLight.shadow.camera.left = 20;
shadowLight.shadow.camera.right = 20;
shadowLight.shadow.camera.top = 40;
shadowLight.shadow.camera.bottom = -20;
scene.add(shadowLight);



// Load 3D model
const loader = new GLTFLoader();
let model; // Store model reference globally
loader.load('./assets/model/sneakermodel1.glb', function(gltf) {
    const model = gltf.scene;
    model.scale.set(10, 10, 10); // Scale up the model by 2x
    model.position.set(0.5, -0.5, 0);
    model.rotation.y = 0.5;
    
    // Add some lights to see the model better
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(ambientLight);
    scene.add(directionalLight);
    scene.add(model);
    
    // Log any errors
    console.log('Model loaded successfully');
}, undefined, function(error) {
    console.error('Error loading model:', error);
});

// Handle window resize
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    shaderMaterial.uniforms.uTime.value += 0.01
}

animate();

