import { GameObject } from './GameObject';

export class AudioManager extends GameObject {
    constructor(game) {
        super();
        this.game = game;
        this.bgm = null;
        this.context = null;
        this.bgmSource = null;
        this.gainNode = null;
        this.isLoaded = false;
        this.isInitialized = false;
        this.isPlaying = false;
        this.loadingPromise = null;
        this.audioData = null;

        // Bind methods to use in event listeners
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handlePageHide = this.handlePageHide.bind(this);
        this.cleanup = this.cleanup.bind(this);
        
        // Add all event listeners
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('focus', this.handleFocus);
        // window.addEventListener('blur', this.handleBlur);
        window.addEventListener('pagehide', this.handlePageHide);
        window.addEventListener('beforeunload', this.cleanup);
        
        // Start preloading immediately and store the promise
        this.loadingPromise = this.preloadAudio();
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseAudio();
        } else {
            this.resumeAudio();
        }
    }

    handleFocus() {
        this.resumeAudio();
    }

    handleBlur() {
        this.pauseAudio();
    }

    handlePageHide() {
        // Force immediate pause on page hide (especially important for iOS)
        this.pauseAudio(true);
    }

    pauseAudio(immediate = false) {
        if (!this.context || !this.isPlaying) return;

        try {
            if (immediate) {
                // Immediate pause for page hide
                if (this.gainNode) {
                    this.gainNode.gain.value = 0;
                }
                this.context.suspend();
            } else {
                // Fade out over 0.5 seconds
                const now = this.context.currentTime;
                this.gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
                setTimeout(() => {
                    if (this.context && this.context.state !== 'closed') {
                        this.context.suspend();
                    }
                }, 500);
            }
            this.isPlaying = false;
        } catch (error) {
            console.error('Error pausing audio:', error);
        }
    }

    resumeAudio() {
        if (!this.context || this.isPlaying || this.context.state === 'closed') return;

        try {
            this.context.resume().then(() => {
                // Only fade in if we still have an active context and gain node
                if (this.context && this.context.state === 'running' && this.gainNode) {
                    const now = this.context.currentTime;
                    this.gainNode.gain.linearRampToValueAtTime(0.4, now + 2.0);
                    this.isPlaying = true;
                }
            });
        } catch (error) {
            console.error('Error resuming audio:', error);
        }
    }

    cleanup() {
        this.pauseAudio(true);
        
        if (this.bgmSource) {
            try {
                this.bgmSource.stop();
                this.bgmSource.disconnect();
            } catch (error) {
                console.error('Error cleaning up bgmSource:', error);
            }
        }
        
        if (this.gainNode) {
            try {
                this.gainNode.disconnect();
            } catch (error) {
                console.error('Error cleaning up gainNode:', error);
            }
        }

        if (this.context && this.context.state !== 'closed') {
            try {
                this.context.close();
            } catch (error) {
                console.error('Error closing audio context:', error);
            }
        }

        // Remove all event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('focus', this.handleFocus);
        window.removeEventListener('blur', this.handleBlur);
        window.removeEventListener('pagehide', this.handlePageHide);
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
            this.bgm = await this.context.decodeAudioData(this.audioData.slice(0));
            
            console.log('Starting playback...');
            this.playBackgroundMusic();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize audio:', error);
            throw error; // Re-throw so the game can handle initialization failure
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
            
            this.isPlaying = true;
            console.log('Background music started successfully');
        } catch (error) {
            console.error('Error starting background music:', error);
            this.isPlaying = false;
            throw error;
        }
    }
}