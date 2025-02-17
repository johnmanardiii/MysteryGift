import { GameObject } from './GameObject';

export class AudioManager extends GameObject {
    constructor(game) {
        super();
        this.game = game;
        this.bgm = null;
        this.context = null;
        this.bgmSource = null;
        this.isLoaded = false;

        // Bind methods to use in event listeners
        this.init = this.init.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.cleanup = this.cleanup.bind(this);
        
        // Add visibility change listener
        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        // Add cleanup listeners
        window.addEventListener('pagehide', this.cleanup);
        window.addEventListener('beforeunload', this.cleanup);

        // Add click listener to initialize audio
        window.addEventListener('pointerdown', this.init, { once: true });
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.context?.suspend();
        } else {
            this.context?.resume();
        }
    }

    cleanup() {
        // Stop and disconnect all audio nodes
        if (this.bgmSource) {
            this.bgmSource.stop();
            this.bgmSource.disconnect();
        }
        
        if (this.gainNode) {
            this.gainNode.disconnect();
        }

        // Close the audio context
        if (this.context) {
            this.context.close();
        }

        // Remove event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('pagehide', this.cleanup);
        window.removeEventListener('beforeunload', this.cleanup);
    }

    async init() {
        // Return if already initialized
        if (this.isLoaded) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            await this.loadBackgroundMusic();
            this.playBackgroundMusic();
            this.isLoaded = true;
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

        // Add volume control with fade-in
        this.gainNode = this.context.createGain();
        this.gainNode.gain.value = 0; // Start silent

        // Connect nodes
        this.bgmSource.connect(this.gainNode);
        this.gainNode.connect(this.context.destination);

        // Start playing
        this.bgmSource.start(0);
        
        // Fade in over 2 seconds
        const now = this.context.currentTime;
        this.gainNode.gain.setValueAtTime(0, now);
        this.gainNode.gain.linearRampToValueAtTime(0.4, now + 2.0);
    }
}