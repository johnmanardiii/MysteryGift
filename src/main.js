import * as THREE from 'three';
import { Bob } from './objects/Bob';
import { GameObject } from './objects/GameObject';

// Enhanced Game class
class Game {
    constructor() {
        this.lastTime = 0;
        this.gameObjects = [];
        this.loadingManager = new THREE.LoadingManager();
        this.basePath = location.hostname === 'localhost' ? '' : '/MysteryGift';
        this.setupLoadingManager();
        this.setupScene();

        this.tapPosition = { x: 0, y: 0 };
        this.isTapped = false;
        this.tappedLastFrame = false;
        
        document.addEventListener('touchstart', (event) => {
            this.isTapped = true;
            // Get the first touch position
            const touch = event.touches[0];
            this.tapPosition.x = (touch.clientX / window.innerWidth) * 2 - 1;
            this.tapPosition.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        });
        
        document.addEventListener('touchend', () => {
            this.isTapped = false;
        });
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

        // Handle window resizing
        window.addEventListener('resize', () => this.onWindowResize());

        // Create initial objects
        this.createInitialObjects();
    }

    createInitialObjects() {
        // Example of loading an FBX model
        const modelPath = window.location.hostname === 'localhost'
        ? '/models/fbx/bobdance.fbx'             // Local development
        : '/MysteryGift/models/fbx/bobdance.fbx'; // Production/GitHub Pages
        this.bob = new Bob(modelPath);
        this.addGameObject(this.bob);
        this.bob.load(this.scene, this.loadingManager);
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

        if (this.isTapped) {
            console.log('Tapped at:', this.tapPosition);
        }

        // todo: do if tapped -> show bob face and spawn a bob for this.bob
        //      if untapped -> show other bob face to test tapping / facial swap.
        if(this.isTapped && !this.tappedLastFrame)
        {
            this.bob.waveOnce();
        }

        // Update all game objects
        for (const obj of this.gameObjects) {
            obj.update(deltaTime);
        }

        // Render the scene
        this.renderer.render(this.scene, this.camera);

        this.tappedLastFrame = this.isTapped;

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