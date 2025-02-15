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
                })
        // on load, grab references to things that need to change like animations
        // and face stuff
        this.eyes = null
        this.mouth = null
        // start default idle animation
    }

    load(scene, loadingManager)
    {
        // load additional bob textures
        const base = window.location.hostname === 'localhost'
        ? '/models/fbx/'             // Local development
        : '/MysteryGift/models/fbx/';
        const texture_loader = new THREE.TextureLoader();
        this.sad_eye = texture_loader.load(base + "e.4.png");
        this.happy_eye = texture_loader.load(base + "e.5.png");
        this.regular_eye = texture_loader.load(base + "e.0.png");
        this.squint_eye = texture_loader.load(base + "e.1.png");
        this.closed_eye = texture_loader.load(base + "e.2.png");
        this.frustrated_eye = texture_loader.load(base + "e.7.png");

        this.onLoad((model) => {
            this.mesh.traverse((child) => {
                if(child.isMesh) {
                    if(child.name === "_001_cat00_mdl") {
                        this.eyes = child;
                        this.eyes.material.map = this.happy_eye;
                        this.eyes.material.needsUpdate = true;
                    }
                    if(child.name === "_002_cat00_mdl") {
                        this.mouth = child;
                    }
                }
            });
        });
        super.load(scene, loadingManager);
    }

    // texture swapping methods (head)

    // texture swapping methods (mouth)

    // anim methods
    idle()
    {
        super.playAnimation(0);
    }

    waveOnce()
    {
        // set to wave, then when over, go back to idle
        super.playAnimationSequence(1, 0);
    }

    dance()
    {
        // start looping dance
        super.playAnimation(2);
    }
}