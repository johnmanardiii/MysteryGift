import { GameObject } from './GameObject';

export class AudioManager extends GameObject {
    constructor(game) {
        super();
        this.game = game;
        this.bgm = null;
        this.context = null;
        this.bgmSource = null;
        this.isLoaded = false;
        this.isInitialized = false;
        this.loadingPromise = null;

        // Bind methods to use in event listeners
        this.init = this.init.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.cleanup = this.cleanup.bind(this);
        
        // Add visibility change listener
        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        // Add cleanup listeners
        window.addEventListener('pagehide', this.cleanup);
        window.addEventListener('beforeunload', this.cleanup);
        
        // Start preloading immediately and store the promise
        this.loadingPromise = this.preloadAudio();
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.context?.suspend();
        } else {
            this.context?.resume();
        }
    }

    cleanup() {
        if (this.bgmSource) {
            this.bgmSource.stop();
            this.bgmSource.disconnect();
        }
        
        if (this.gainNode) {
            this.gainNode.disconnect();
        }

        if (this.context) {
            this.context.close();
        }

        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('pagehide', this.cleanup);
        window.removeEventListener('beforeunload', this.cleanup);
    }

    async preloadAudio() {
        const bgmPath = window.location.hostname === 'localhost'
            ? '/sounds/acmusic.mp3'
            : '/MysteryGift/sounds/acmusic.mp3';

        try {
            console.log('Starting audio preload...');
            const response = await fetch(bgmPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            this.audioData = arrayBuffer;
            this.isLoaded = true;
            console.log('Audio preload complete');
        } catch (error) {
            console.error('Failed to preload audio data:', error);
            throw error; // Re-throw to handle in init()
        }
    }

    async init() {
        // Return if already fully initialized
        if (this.isInitialized) return;

        try {
            // Wait for preload to complete if it hasn't already
            if (!this.isLoaded) {
                console.log('Waiting for audio preload to complete...');
                await this.loadingPromise;
            }

            console.log('Creating audio context...');
            // Create context only after user interaction
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            console.log('Decoding audio data...');
            // Decode the preloaded audio data
            this.bgm = await this.context.decodeAudioData(this.audioData);
            
            console.log('Starting playback...');
            this.playBackgroundMusic();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
        }
    }

    playBackgroundMusic() {
        if (!this.bgm || !this.context) {
            console.error('Cannot play: missing bgm or context');
            return;
        }

        try {
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
            
            console.log('Background music started successfully');
        } catch (error) {
            console.error('Error starting background music:', error);
        }
    }
}