import * as THREE from 'three';

// Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Use actual viewport dimensions
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance

// Lock the renderer to viewport
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
document.body.appendChild(renderer.domElement);

// Create cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Add lights
const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
mainLight.position.set(10, 10, 10);
scene.add(mainLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// Position camera
camera.position.z = 5;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Prevent scrolling/bouncing on mobile
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.position = 'fixed';
document.documentElement.style.position = 'fixed';
document.documentElement.style.overflow = 'hidden';