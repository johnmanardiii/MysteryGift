import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GameObject } from './GameObject.js'; 

export class FBXModel extends GameObject {
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
            
            // Apply transforms~
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