import { GameObject } from './GameObject';

export class AudioManager extends GameObject {
    constructor(game) {
        super();
        this.game = game;
        this.bgm = null;
        this.context = null;
        this.bgmSource = null;
    }

    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            await this.loadBackgroundMusic();
            this.playBackgroundMusic();
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    async loadBackgroundMusic() {
        const bgmPath = window.location.hostname === 'localhost'
            ? '/sounds/acmusic.mp3'
            : '/MysteryGift/sounds/acmusic.mp3';

        try {
            const response = await fetch(bgmPath);
            const arrayBuffer = await response.arrayBuffer();
            this.bgm = await this.context.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error('Failed to load background music:', error);
        }
    }

    playBackgroundMusic() {
        if (!this.bgm) return;

        // Create and configure source
        this.bgmSource = this.context.createBufferSource();
        this.bgmSource.buffer = this.bgm;
        this.bgmSource.loop = true;

        // Add volume control
        const gainNode = this.context.createGain();
        gainNode.gain.value = 0.4; // Set volume to 40%

        // Connect nodes
        this.bgmSource.connect(gainNode);
        gainNode.connect(this.context.destination);

        // Start playing
        this.bgmSource.start(0);
    }
}