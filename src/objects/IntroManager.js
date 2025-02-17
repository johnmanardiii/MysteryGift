import * as THREE from 'three';
import { GameObject } from './GameObject';

export class IntroManager extends GameObject {
    constructor(game) {
        super();
        this.game = game;
        this.visible = true;
        this.textureLoader = new THREE.TextureLoader(game.loadingManager);
        
        // Text canvas for "Tap to Start"
        this.textCanvas = document.createElement('canvas');
        this.textCanvas.width = 1024;
        this.textCanvas.height = 512;
        this.textContext = this.textCanvas.getContext('2d');
        this.textTexture = new THREE.CanvasTexture(this.textCanvas);
        
        // Create background plane that covers the whole view
        const bgGeometry = new THREE.PlaneGeometry(20, 10);
        const bgMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,  // Black background
            transparent: true,
            depthTest: false,
            depthWrite: false
        });
        this.bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
        this.bgMesh.position.z = 2;
        this.bgMesh.renderOrder = 999;
        
        // Create text sprite
        const textMaterial = new THREE.SpriteMaterial({
            map: this.textTexture,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });
        this.textSprite = new THREE.Sprite(textMaterial);
        this.textSprite.renderOrder = 1000;
        this.textSprite.scale.set(5, 2.5, 1);
        
        // Add click detection plane
        this.clickPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshBasicMaterial({ 
                transparent: true, 
                opacity: 0,
                depthTest: false,
                depthWrite: false
            })
        );
        this.clickPlane.position.z = 3;
        this.clickPlane.renderOrder = 998;
        
        // Setup text animation
        this.bounceOffset = 0;
        this.bounceSpeed = 1;
        this.bounceAmount = 0.05;
        
        // Bind methods
        this.handleClick = this.handleClick.bind(this);
        
        // Add to scene
        game.scene.add(this.bgMesh);
        game.scene.add(this.textSprite);
        game.scene.add(this.clickPlane);
        
        // Add click listener
        window.addEventListener('pointerdown', this.handleClick);

        this.clicked = false;
        
        // Draw initial text
        this.updateText();
    }
    
    updateText() {
        const ctx = this.textContext;
        ctx.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        
        // Draw text with Animal Crossing style
        ctx.fillStyle = 'white';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add thick white outline for Animal Crossing look
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 0;
        ctx.strokeText('Tap to Start!', 
            this.textCanvas.width/2, 
            this.textCanvas.height/2);
            
        // Add black outline
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 8;
        ctx.strokeText('Tap to Start!', 
            this.textCanvas.width/2, 
            this.textCanvas.height/2);
            
        // Fill text
        ctx.fillText('Tap to Start!', 
            this.textCanvas.width/2, 
            this.textCanvas.height/2);
            
        this.textTexture.needsUpdate = true;
    }
    
    update(deltaTime) {
        if (!this.visible) return;
        
        // Bounce animation
        this.bounceOffset += deltaTime * this.bounceSpeed;
        const bounce = Math.sin(this.bounceOffset) * this.bounceAmount;
        this.textSprite.position.y = bounce;
    }
    
    handleClick(event) {
        if (!this.visible) return;
        if(this.clicked) return;
        this.clicked = true;
        
        // Start the transition
        this.startTransition();
    }
    
    startTransition() {
        const textDuration = 2.0;  // 1 second for text
        const bgDuration = 5.0;    // 2 seconds for background
        const startTime = performance.now();
        this.transitioning = true;
        
        // Starting scale
        const startScale = this.textSprite.scale.x;
        const targetScale = startScale * 2; // Double the size
        this.game.dialogManager.fadeIn(2, 1);
        
        const animate = (currentTime) => {
            const elapsed = (currentTime - startTime) / 1000; // Convert to seconds
            
            // Text progress (faster)
            const textProgress = Math.min(elapsed / textDuration, 1);
            const textEased = 1 - Math.pow(1 - textProgress, 1); // Cubic ease-out
            
            // Background progress (slower)
            const bgProgress = Math.min(elapsed / bgDuration, 1);
            const bgEased = 1 - Math.pow(1 - bgProgress, 1); // Cubic ease-out
            
            // Update text opacity and scale
            this.textSprite.material.opacity = 1 - textEased;
            const currentScale = startScale + (targetScale - startScale) * textEased;
            this.textSprite.scale.set(currentScale, currentScale / 2, 1);
            
            // Update background opacity
            this.bgMesh.material.opacity = 1 - bgEased;
            
            if (bgProgress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.cleanup();
                // Start audio and hide intro
                this.game.audioManager.init();
                this.visible = false;
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    cleanup() {
        window.removeEventListener('pointerdown', this.handleClick);
        this.game.scene.remove(this.bgMesh);
        this.game.scene.remove(this.textSprite);
        this.game.scene.remove(this.clickPlane);
    }
}