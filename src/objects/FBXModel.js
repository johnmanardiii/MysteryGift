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

    playAnimation(index = 0, loop = true) {
        if (this.animations && this.animations.length > index) {
            if (this.currentAction) {
                this.currentAction.stop();
            }
            this.currentAction = this.mixer.clipAction(this.animations[index]);
            
            // Set loop mode
            if (loop) {
                this.currentAction.setLoop(THREE.LoopRepeat);
            } else {
                this.currentAction.setLoop(THREE.LoopOnce);
                this.currentAction.clampWhenFinished = true; // Freezes on last frame
            }

            this.currentAction.play();
            return true;
        }
        return false;
    }

    playAnimationSequence(index = 0, nextIndex = 1) {
        if (this.animations && this.animations.length > index) {
            if (this.currentAction) {
                print(this.currentAction);
                this.currentAction.stop();
            }
            this.currentAction = this.mixer.clipAction(this.animations[index]);
            this.currentAction.setLoop(THREE.LoopOnce);
            this.currentAction.clampWhenFinished = true;

            // Add a finished callback, this could be bugged if cancelled too early...
                // might require extra logic to handle animation transitions smoothly
            this.mixer.addEventListener('finished', () => {
                this.crossFadeToAnimation(nextIndex, .2);
            });

            this.currentAction.play();
            return true;
        }
        return false;
    }

    crossFadeToAnimation(newIndex, duration = 0.5) {
        if (this.animations && this.animations.length > newIndex) {
            const newAction = this.mixer.clipAction(this.animations[newIndex]);
            
            if (this.currentAction) {
                // Fade out current animation
                this.currentAction.fadeOut(duration);
            }
            
            // Fade in new animation
            newAction.reset().fadeIn(duration).play();
            newAction.loop = THREE.LoopRepeat;
            this.currentAction = newAction;
            return true;
        }
        return false;
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
                this.animations = fbx.animations;  // Store the animations
                this.mixer = new THREE.AnimationMixer(fbx);
                this.currentAction = this.mixer.clipAction(this.animations[2]);
                this.currentAction.play();
            }
    
            // Setup materials
            fbx.traverse((child) => {
                if (child.isMesh) {
                    if (this.options.useBasicMaterial) {
                        const basicMaterial = new THREE.MeshBasicMaterial({
                            map: child.material.map,
                            transparent: true,
                            side: THREE.DoubleSide
                        });
                        child.material = basicMaterial;
                    }
                    console.log('Mesh name:', child.name);
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