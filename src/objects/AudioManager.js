import { GameObject } from './GameObject';
import * as THREE from 'three';

export class AudioManager extends GameObject {
    constructor(game) {
        super();
        this.game = game;
        
        // Create listener but don't initialize context yet
        this.listener = null;
        this.sounds = new Map(); // Store all sounds
        this.currentBGM = null;
        
        // Bind methods
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handlePageHide = this.handlePageHide.bind(this);
        this.cleanup = this.cleanup.bind(this);
        
        // Add event listeners
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('pagehide', this.handlePageHide);
        window.addEventListener('beforeunload', this.cleanup);
        
        // Initialize audio system
        this.init();
    }

    init() {
        // Create and resume the audio context during initialization
        this.listener = new THREE.AudioListener();
        this.game.camera.add(this.listener);
        
        // Ensure the context is resumed
        const context = this.listener.context;
        if (context.state === 'suspended') {
            context.resume();
        }
        
        // Configure loading manager and start loading sounds
        this.audioLoader = new THREE.AudioLoader(this.game.loadingManager);
        
        // Load all sounds
        this.loadAllSounds();
    }

    loadAllSounds() {
        // Load background music
        this.loadBackgroundMusic();
        
        // Load all other sounds
        const sounds = {
        };

        // Load each sound
        Object.entries(sounds).forEach(([name, path]) => {
            this.loadSound(name, path);
        });
    }

    loadBackgroundMusic() {
        const bgmPath = this.game.basePath + '/sounds/acmusic.mp3';
        const sound = new THREE.Audio(this.listener);
        
        this.audioLoader.load(bgmPath, 
            (buffer) => {
                sound.setBuffer(buffer);
                sound.setLoop(true);
                sound.setVolume(0.4);
                
                this.sounds.set('bgm', [sound]); // Store as array for consistency
                this.currentBGM = sound;
                
                console.log('Background music loaded successfully');
                this.playSound("bgm", { volume: 0.5, loop: true });
            },
            undefined,
            (error) => {
                console.error('Error loading background music:', error);
            }
        );
    }

    loadSound(name, path, poolSize = 3) {
        const fullPath = this.game.basePath + path;
        const soundPool = [];
        
        // Create pool of sounds
        for (let i = 0; i < poolSize; i++) {
            const sound = new THREE.Audio(this.listener);
            soundPool.push(sound);
        }
        
        // Store the pool immediately
        this.sounds.set(name, soundPool);
        
        // Load the buffer once and apply to all sounds in pool
        this.audioLoader.load(fullPath,
            (buffer) => {
                soundPool.forEach(sound => sound.setBuffer(buffer));
                console.log(`Sound ${name} loaded successfully`);
            },
            undefined,
            (error) => {
                console.error(`Error loading sound ${name}:`, error);
            }
        );
    }

    playSound(name, options = {}) {
        const soundPool = this.sounds.get(name);
        if (!soundPool) {
            console.warn(`Sound "${name}" not found`);
            return;
        }

        const { loop = false, volume = 1.0 } = options;
        
        // Find available sound in pool (or use first one if all are playing)
        const sound = soundPool.find(s => !s.isPlaying) || soundPool[0];
        
        sound.setLoop(loop);
        sound.setVolume(volume);
        
        if (sound.isPlaying) {
            sound.stop();
        }
        
        sound.play();
    }

    stopSound(name) {
        const soundPool = this.sounds.get(name);
        if (!soundPool) return;
        
        soundPool.forEach(sound => {
            if (sound.isPlaying) {
                sound.stop();
            }
        });
    }

    pauseAllSounds() {
        this.sounds.forEach(soundPool => {
            soundPool.forEach(sound => {
                if (sound.isPlaying) {
                    sound.pause();
                }
            });
        });
    }

    resumeAllSounds() {
        this.sounds.forEach(soundPool => {
            soundPool.forEach(sound => {
                if (sound.buffer && !sound.isPlaying && sound.loop) {
                    // Only auto-resume looping sounds
                    sound.play();
                }
            });
        });
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseAllSounds();
        } else {
            this.resumeAllSounds();
        }
    }

    handlePageHide() {
        this.pauseAllSounds();
    }

    cleanup() {
        // Stop and disconnect all sounds
        this.sounds.forEach(soundPool => {
            soundPool.forEach(sound => {
                if (sound.isPlaying) {
                    sound.stop();
                }
                sound.disconnect();
            });
        });

        // Clear the sounds map
        this.sounds.clear();

        // Remove the listener from the camera
        if (this.game.camera) {
            this.game.camera.remove(this.listener);
        }

        // Remove event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('pagehide', this.handlePageHide);
        window.removeEventListener('beforeunload', this.cleanup);
    }

    fadeIn(name, duration = 2.0) {
        const soundPool = this.sounds.get(name);
        if (!soundPool || !soundPool[0]) return;

        const sound = soundPool[0];
        sound.setVolume(0);
        sound.play();
        
        const startTime = Date.now();
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            sound.setVolume(progress * 0.4); // Max volume 0.4
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    fadeOut(name, duration = 0.5) {
        const soundPool = this.sounds.get(name);
        if (!soundPool || !soundPool[0]) return;

        const sound = soundPool[0];
        const startVolume = sound.getVolume();
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            
            sound.setVolume(startVolume * (1 - progress));
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                sound.stop();
            }
        };
        
        animate();
    }
}