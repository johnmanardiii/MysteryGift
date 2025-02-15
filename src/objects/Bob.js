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
        super.load(scene, loadingManager);
        // load additional bob textures
    }

    onLoad(callback)
    {
        super.onLoad((model) => {

        })
    }

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