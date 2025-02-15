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
            useBasicMaterial: true,  // Add this option
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

            // Setup materials
            fbx.traverse((child) => {
                if (child.isMesh) {
                    if (this.options.useBasicMaterial) {
                        // Create a basic material that just shows the texture
                        const basicMaterial = new THREE.MeshBasicMaterial({
                            map: child.material.map,
                            transparent: true,
                            side: THREE.DoubleSide
                        });
                        child.material = basicMaterial;
                    }
                    console.log('Mesh name:', child.name); // Debug mesh names
                }
            });

            scene.add(this.mesh);
            this.isLoaded = true;
            
            if (this.onLoadCallback) {
                this.onLoadCallback(this);
            }
        });
    }
}