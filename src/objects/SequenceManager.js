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
        this.currentStep = 0;
    }

    // Play the next step in the sequence
    playNextStep() {
        if (!this.isPlaying || !this.currentSequence) return;

        if (this.currentStep >= this.currentSequence.length) {
            this.stopCurrentSequence();
            return;
        }

        const beat = this.currentSequence[this.currentStep];
        this.executeBeat(beat);
        this.currentStep++;
    }

    // Execute all components of a beat simultaneously
    executeBeat(beat) {
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
            // TODO: Implement sound system
            console.log(`Playing sound: ${beat.sound}`);
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

const exampleSequence = [
    {
        text: "Hi there!",
        expression: {
            eyes: "happy",
            mouth: "smile1"
        },
        animation: {
            type: "wave",
            speed: 0.2
        },
        sound: "greeting"
    },
    {
        text: "Watch this!",
        expression: {
            eyes: "very_happy",
            mouth: "smile3"
        },
        animation: {
            type: "dance",
            speed: 1.0
        },
        sound: "music"
    },
    {
        text: "That was fun!",
        expression: {
            eyes: "regular",
            mouth: "smile1"
        },
        animation: {
            type: "idle"
        }
    }
];