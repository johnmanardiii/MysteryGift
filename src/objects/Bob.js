// this file will handle bob animation logic, facial animation texture swapping,

// and queuing wave, idle, and dance animations
import * as THREE from 'three';
import { FBXModel } from "./FBXModel";

// _001_cat00_mdl is eyes
// _002_cat00_mdl is mouth

export class Bob extends FBXModel {
    constructor(path)
    {
        super(path, {
            scale: .15,
            position: new THREE.Vector3(0, -1, 0),
            usesBasicMaterial: true
        });
        
        // Animation states
        this.AnimationStates = {
            IDLE: 0,
            WAVE: 1,
            DANCE: 2
        };
        
        // Animation configuration
        this.animConfig = {
            transitionSpeed: 0.3,  // Default transition time in seconds
            waveToIdleDelay: 0.2   // Delay before transitioning back to idle
        };
        
        this.currentState = this.AnimationStates.IDLE;
        this.eyes = null
        this.mouth = null
        // start default idle animation
    }

    setTransitionSpeed(speed) {
        this.animConfig.transitionSpeed = speed;
    }

    load(scene, loadingManager)
    {
        // load additional bob textures
        const texture_loader = new THREE.TextureLoader();

        const createTextureManager = (basePath) => {
            return (filename, mesh) => {
                const texture = texture_loader.load(basePath + filename);
                texture.encoding = THREE.sRGBEncoding;
                texture.colorSpace = THREE.SRGBColorSpace;
                
                if (mesh) {
                    mesh.material.map = texture;
                    mesh.material.colorSpace = THREE.SRGBColorSpace;
                    mesh.material.encoding = THREE.sRGBEncoding;
                    mesh.material.needsUpdate = true;
                }
                
                return texture;
            };
        };
        
        const base = window.location.hostname === 'localhost'
        ? '/models/fbx/'             // Local development
        : '/MysteryGift/models/fbx/';
        const lt = createTextureManager(base);
        this.sad_eye = lt("e.4.png");
        this.happy_eye = lt("e.5.png");
        this.regular_eye = lt("e.0.png");
        this.squint_eye = lt("e.1.png");
        this.closed_eye = lt("e.2.png");
        this.hell_yea_eye = lt("e.7.png");

        this.smile_mouth = lt("m.0.png");
        this.open_med_mouth = lt("m.1.png");
        this.way_open_mouth = lt("m.2.png");
        this.frown_mouth = lt("m.3.png");
        this.med_frown = lt("m.4.png");
        this.big_frown = lt("m.5.png");

        this.eyeTexs = {
            "sad":this.sad_eye,
            "happy":this.happy_eye,
            "regular":this.regular_eye,
            "squint":this.squint_eye,
            "closed":this.closed_eye,
            "very_happy":this.hell_yea_eye
        };

        this.mouthTexs = {
            "smile1":this.smile_mouth,
            "smile2":this.open_med_mouth,
            "smile3":this.way_open_mouth,
            "frown1":this.frown_mouth,
            "frown2":this.med_frown,
            "frown3":this.big_frown
        }

        this.onLoad((model) => {
            this.mesh.traverse((child) => {
                if(child.isMesh) {
                    if(child.name === "_001_cat00_mdl") {
                        this.eyes = child;
                    }
                    if(child.name === "_002_cat00_mdl") {
                        this.mouth = child;
                    }
                }
            });

            this.idle();
        });
        super.load(scene, loadingManager);
    }

    // texture swapping methods (head)
    setEyes(name) {
        this.eyes.material.map = this.eyeTexs[name];
        this.eyes.material.needsUpdate = true;
    }

    setMouth(name) {
        this.mouth.material.map = this.mouthTexs[name];
        this.mouth.material.needsUpdate = true;
    }

    // texture swapping methods (mouth)

    // anim methods
    idle(transitionSpeed = this.animConfig.transitionSpeed)
    {
        if (this.currentState !== this.AnimationStates.IDLE) {
            super.crossFadeToAnimation(this.AnimationStates.IDLE, transitionSpeed);
            this.currentState = this.AnimationStates.IDLE;
        }
    }

    waveOnce(transitionSpeed = this.animConfig.transitionSpeed) {
        if(this.currentState !== this.AnimationStates.WAVE)
        {
            super.playOneShot(
                this.AnimationStates.WAVE,      // Wave animation
                this.AnimationStates.IDLE,      // Return to idle
                transitionSpeed,                // Transition in
                this.animConfig.waveToIdleDelay, // Transition out
                () => {
                    this.currentState = this.AnimationStates.IDLE; // Update state when animation completes
                }
            );
            this.currentState = this.AnimationStates.WAVE;
        }
    }

    dance(transitionSpeed = this.animConfig.transitionSpeed)
    {
        if (this.currentState !== this.AnimationStates.DANCE) {
            super.crossFadeToAnimation(this.AnimationStates.DANCE, transitionSpeed);
            this.currentState = this.AnimationStates.DANCE;
        }
    }
}