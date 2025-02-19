import { GameObject } from './GameObject';

export class SequenceManager extends GameObject {
    constructor(game) {
        super();
        this.game = game;
        this.currentSequence = null;
        this.currentStep = 0;
        this.isPlaying = false;
        this.sequences = new Map();
    }

    // Register a new sequence
    registerSequence(name, steps) {
        this.sequences.set(name, steps);
    }

    // Play a registered sequence
    playSequence(name) {
        if (!this.sequences.has(name)) {
            console.error(`Sequence "${name}" not found`);
            return;
        }

        if (this.isPlaying) {
            this.stopCurrentSequence();
        }

        this.currentSequence = this.sequences.get(name);
        this.currentStep = 0;
        this.isPlaying = true;
        this.playNextStep();
    }

    // Stop the current sequence
    stopCurrentSequence() {
        this.isPlaying = false;
        this.currentSequence = null;
        // this.currentStep = 0;
    }

    // Play the next step in the sequence
    playNextStep() {
        if (!this.isPlaying || !this.currentSequence) return;

        if (this.currentStep >= this.currentSequence.length) {
            this.game.dialogManager.arrow.forceHide();
            this.game.dialogManager.fadeOut(0.0);
            this.stopCurrentSequence();
            return;
        }

        const beat = this.currentSequence[this.currentStep];
        this.executeBeat(beat);
        this.currentStep++;
    }

    // Execute all components of a beat simultaneously
    executeBeat(beat) {
        // play a lil sound 
        if(this.currentStep != 0)
        {
            this.game.audioManager.playSound('advance', {volume:.7})
        }
        
        // Execute expression changes if specified
        if (beat.expression) {
            if (beat.expression.eyes) {
                this.game.bob.setEyes(beat.expression.eyes);
            }
            if (beat.expression.mouth) {
                this.game.bob.setMouth(beat.expression.mouth);
            }
        }

        // Execute animation if specified
        if (beat.animation) {
            switch (beat.animation.type) {
                case 'wave':
                    this.game.bob.waveOnce(beat.animation.speed || 0.2);
                    break;
                case 'dance':
                    this.game.bob.dance(beat.animation.speed || 1.0);
                    break;
                case 'idle':
                    this.game.bob.idle(beat.animation.speed || 0.5);
                    break;
            }
        }

        // Play sound if specified
        if (beat.sound) {
            if(beat.sound.stopBgm)
            {
                this.game.audioManager.stopSound('bgm');
            }
            if (beat.sound.delay) {
                setTimeout(() => {
                    this.game.audioManager.playSound(beat.sound.id, {
                        loop: beat.sound.loop,
                        volume: beat.sound.volume
                    });
                }, beat.sound.delay * 1000); // Convert delay from seconds to milliseconds
            } else {
                this.game.audioManager.playSound(beat.sound.id, {
                    loop: beat.sound.loop,
                    volume: beat.sound.volume
                });
            }
        }
    
        // Set dialogue
        if (beat.text) {
            this.game.dialogManager.setText(beat.text);
        } else {
            this.playNextStep();
        }

        // Set dialogue - this will trigger the next beat when complete
        if (beat.text) {
            this.game.dialogManager.setText(beat.text);
        } else {
            // If no dialogue, immediately move to next beat
            this.playNextStep();
        }
    }
}