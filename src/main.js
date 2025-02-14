import * as THREE from 'three';

// Base class for game objects
class GameObject {
    constructor() {
        this.mesh = null;
    }

    update(deltaTime) {
        // Override this in child classes
    }
}

// Our rotating cube game object
class RotatingCube extends GameObject {
    constructor() {
        super();
        // Create the cube (this is like adding components in Unity)
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshPhongMaterial({ color: 0xffff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Set initial properties
        this.rotationSpeed = 1.0; // Rotations per second
    }

    update(deltaTime) {
        // Update rotation based on delta time (just like Unity)
        this.mesh.rotation.x += this.rotationSpeed * deltaTime;
        this.mesh.rotation.y += this.rotationSpeed * deltaTime;
    }
}

// Main game class (like a GameManager)
class Game {
    constructor() {
        this.lastTime = 0;
        this.gameObjects = [];
        this.setupScene();
    }

    setupScene() {
        // Scene setup (like a scene in Unity)
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Camera setup (like adding a camera in Unity)
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Add renderer to DOM
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        document.body.appendChild(this.renderer.domElement);

        // Add lights (like adding lights in Unity)
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        mainLight.position.set(10, 10, 10);
        this.scene.add(mainLight);
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

        // Handle window resizing
        window.addEventListener('resize', () => this.onWindowResize());

        // Create initial game objects
        this.createInitialObjects();
    }

    createInitialObjects() {
        // Create a cube (like instantiating a prefab)
        const cube = new RotatingCube();
        this.addGameObject(cube);
    }

    addGameObject(gameObject) {
        this.gameObjects.push(gameObject);
        if (gameObject.mesh) {
            this.scene.add(gameObject.mesh);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Game loop (like Unity's Update)
    update(currentTime) {
        // Calculate delta time in seconds
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

    // Start the game
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