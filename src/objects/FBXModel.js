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

    playOneShot(animIndex, nextAnimIndex, fadeInDuration = 0.3, fadeOutDuration = 0.3, onComplete = null) {
        if (!this.animations || this.animations.length <= animIndex) return false;
    
        // Stop current animation if it exists
        if (this.currentAction) {
            this.currentAction.fadeOut(fadeInDuration);
            this.mixer.removeEventListener('finished');
        }
    
        // Start new animation
        const newAction = this.mixer.clipAction(this.animations[animIndex]);
        newAction.reset();
        newAction.fadeIn(fadeInDuration);
        newAction.setLoop(THREE.LoopOnce);
        newAction.clampWhenFinished = true;
    
        // Add new finished listener with state update
        const onFinished = () => {
            this.crossFadeToAnimation(nextAnimIndex, fadeOutDuration);
            if (onComplete) onComplete(); // Call the completion callback
            this.mixer.removeEventListener('finished', onFinished);
        };
        
        this.mixer.addEventListener('finished', onFinished);
    
        newAction.play();
        this.currentAction = newAction;
        return true;
    }

    crossFadeToAnimation(newIndex, duration = 0.3) {
        if (!this.animations || this.animations.length <= newIndex) return false;

        const newAction = this.mixer.clipAction(this.animations[newIndex]);
        
        if (this.currentAction) {
            // Fade out current animation
            this.currentAction.fadeOut(duration);
        }
        
        // Reset and fade in new animation
        newAction.reset();
        newAction.fadeIn(duration);
        newAction.setLoop(THREE.LoopRepeat);
        newAction.play();
        
        this.currentAction = newAction;
        return true;
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