import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

// Base class for game objects
class GameObject {
    constructor() {
        this.mesh = null;
        this.mixer = null; // For FBX animations
    }

    update(deltaTime) {
        // Update animations if they exist
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
}

// FBX Model game object
class FBXModel extends GameObject {
    constructor(path, options = {}) {
        super();
        this.path = path;
        this.options = {
            scale: 1,
            position: new THREE.Vector3(0, 0, 0),
            rotation: new THREE.Euler(0, 0, 0),
            ...options
        };
        this.isLoaded = false;
        this.onLoadCallback = null;
    }

    load(scene, loadingManager) {
        const loader = new FBXLoader(loadingManager);
        
        loader.load(this.path, (fbx) => {
            this.mesh = fbx;
            
            // Apply transforms
            this.mesh.scale.multiplyScalar(this.options.scale);
            this.mesh.position.copy(this.options.position);
            this.mesh.rotation.copy(this.options.rotation);

            // Setup animations if they exist
            if (fbx.animations && fbx.animations.length) {
                this.mixer = new THREE.AnimationMixer(fbx);
                const action = this.mixer.clipAction(fbx.animations[0]);
                action.play();
            }

            // Setup shadows
            fbx.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            scene.add(this.mesh);
            this.isLoaded = true;
            
            if (this.onLoadCallback) {
                this.onLoadCallback(this);
            }
        });
    }

    onLoad(callback) {
        this.onLoadCallback = callback;
        if (this.isLoaded && callback) {
            callback(this);
        }
    }
}

// Your existing RotatingCube class remains the same
class RotatingCube extends GameObject {
    constructor() {
        super();
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshPhongMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.rotationSpeed = 1.0;
    }

    update(deltaTime) {
        this.mesh.rotation.x += this.rotationSpeed * deltaTime;
        this.mesh.rotation.y += this.rotationSpeed * deltaTime;
    }
}

// Enhanced Game class
class Game {
    constructor() {
        this.lastTime = 0;
        this.gameObjects = [];
        this.loadingManager = new THREE.LoadingManager();
        this.basePath = location.hostname === 'localhost' ? '' : '/MysteryGift';
        this.setupLoadingManager();
        this.setupScene();
    }

    setupLoadingManager() {
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            console.log(`Loading: ${itemsLoaded}/${itemsTotal}`);
        };
        
        this.loadingManager.onError = (url) => {
            console.error('Error loading:', url);
        };
    }

    setupScene() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

        // Enhanced camera setup
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        // Enhanced renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        
        // Add renderer to DOM
        document.body.appendChild(this.renderer.domElement);

        // Enhanced lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
        hemiLight.position.set(0, 200, 0);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 5);
        dirLight.position.set(0, 200, 100);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 180;
        dirLight.shadow.camera.bottom = -100;
        dirLight.shadow.camera.left = -120;
        dirLight.shadow.camera.right = 120;
        this.scene.add(dirLight);

        // Grid helper
        const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        this.scene.add(grid);

        // Handle window resizing
        window.addEventListener('resize', () => this.onWindowResize());

        // Create initial objects
        this.createInitialObjects();
    }

    createInitialObjects() {
        // Example of loading an FBX model
        const modelPath = window.location.hostname === 'localhost'
        ? 'public/models/fbx/bobdance.fbx'             // Local development
        : '/MysteryGift/models/fbx/bobdance.fbx'; // Production/GitHub Pages
        const characterModel = new FBXModel(modelPath, {
            scale: .15,
            position: new THREE.Vector3(0, -1, 0)
        });
        this.addGameObject(characterModel);
        characterModel.load(this.scene, this.loadingManager);
    }

    addGameObject(gameObject) {
        this.gameObjects.push(gameObject);
        if (gameObject.mesh && !gameObject.path) { // Only add mesh directly if it's not an FBX (those add themselves when loaded)
            this.scene.add(gameObject.mesh);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update all game objects
        for (const obj of this.gameObjects) {
            obj.update(deltaTime);
        }

        // Render the scene
        this.renderer.render(this.scene, this.camera);

        // Queue next frame
        requestAnimationFrame((time) => this.update(time));
    }

    start() {
        // Prevent scrolling/bouncing on mobile
        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.documentElement.style.position = 'fixed';
        document.documentElement.style.overflow = 'hidden';

        // Start the game loop
        requestAnimationFrame((time) => this.update(time));
    }
}

// Initialize and start the game
const game = new Game();
game.start();