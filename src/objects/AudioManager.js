import { GameObject } from './GameObject';
import * as THREE from 'three';

export class AudioManager extends GameObject {
    constructor(game) {
        super();
        this.game = game;
        this.listener = new THREE.AudioListener();
        this.sounds = new Map(); // Store all loaded sounds
        this.currentBGM = null;
        this.isInitialized = false;
        
        // Add listener to camera
        this.game.camera.add(this.listener);
        
        // Bind methods
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handlePageHide = this.handlePageHide.bind(this);
        this.cleanup = this.cleanup.bind(this);
        
        // Add event listeners
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('pagehide', this.handlePageHide);
        window.addEventListener('beforeunload', this.cleanup);
        
        // Configure loading manager and start loading BGM
        this.audioLoader = new THREE.AudioLoader(this.game.loadingManager);
        this.loadBackgroundMusic();
    }

    loadBackgroundMusic() {
        const bgmPath = this.game.basePath + '/sounds/acmusic.mp3';
        const sound = new THREE.Audio(this.listener);
        
        this.audioLoader.load(bgmPath, 
            (buffer) => {
                sound.setBuffer(buffer);
                sound.setLoop(true);
                sound.setVolume(0.4);
                
                this.sounds.set('bgm', sound);
                this.currentBGM = sound;
                this.isInitialized = true;
                
                console.log('Background music loaded successfully');

                // start playing first bgm:
                this.playSound("bgm", {volume:.5, loop:true})
            },
            undefined,
            (error) => {
                console.error('Error loading background music:', error);
            }
        );
    }

    loadSound(name, path) {
        const fullPath = this.game.basePath + path;
        const sound = new THREE.Audio(this.listener);
        
        this.audioLoader.load(fullPath,
            (buffer) => {
                sound.setBuffer(buffer);
                this.sounds.set(name, sound);
                console.log(`Sound ${name} loaded successfully`);
            },
            undefined,
            (error) => {
                console.error(`Error loading sound ${name}:`, error);
            }
        );
        
        return sound;
    }

    playSound(name, options = {}) {
        const sound = this.sounds.get(name);
        if (!sound) {
            console.warn(`Sound "${name}" not found`);
            return;
        }

        const { loop = false, volume = 1.0 } = options;
        
        sound.setLoop(loop);
        sound.setVolume(volume);
        
        if (sound.isPlaying) {
            sound.stop();
        }
        
        sound.play();
    }

    playBackgroundMusic() {
        if (!this.currentBGM) {
            console.warn('No background music loaded');
            return;
        }

        if (!this.currentBGM.isPlaying) {
            this.currentBGM.play();
        }
    }

    stopBackgroundMusic() {
        if (this.currentBGM && this.currentBGM.isPlaying) {
            this.currentBGM.stop();
        }
    }

    pauseAllSounds() {
        this.sounds.forEach(sound => {
            if (sound.isPlaying) {
                sound.pause();
            }
        });
    }

    resumeAllSounds() {
        this.sounds.forEach(sound => {
            if (sound.buffer && !sound.isPlaying) {
                sound.play();
            }
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
        this.sounds.forEach(sound => {
            if (sound.isPlaying) {
                sound.stop();
            }
            sound.disconnect();
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
        const sound = this.sounds.get(name);
        if (!sound) return;

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
        const sound = this.sounds.get(name);
        if (!sound) return;

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