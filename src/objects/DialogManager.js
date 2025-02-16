import * as THREE from 'three';
import { GameObject } from './GameObject';

export class DialogManager extends GameObject {
    constructor(game) {
        super();
        this.game = game;
        this.visible = true;
        this.currentText = 'Hello! This is a test message...';
        this.displayedText = '';
        this.textureLoader = new THREE.TextureLoader(game.loadingManager);
        
        // Configure dialog dimensions
        this.dialogWidth = 2.8;
        this.dialogHeight = 1.9;
        this.textPadding = 0.2;
        
        // Animation properties
        this.isAnimating = false;
        this.charIndex = 0;
        this.charDelay = 0.05; // Seconds per character
        this.timeAccumulator = 0;
        
        // Create canvas for text
        this.setupTextSystem();
        this.loadDialogBackground();
    }
    
    setupTextSystem() {
        // Create canvas for text rendering
        this.textCanvas = document.createElement('canvas');
        // Adjusted canvas dimensions to match dialog box ratio better
        this.textCanvas.width = 1024;
        this.textCanvas.height = 512;
        this.textContext = this.textCanvas.getContext('2d');
        
        // Create texture from canvas
        this.textTexture = new THREE.CanvasTexture(this.textCanvas);
        this.textTexture.needsUpdate = true;
        
        // Create sprite for text
        const textMaterial = new THREE.SpriteMaterial({
            map: this.textTexture,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });
        
        this.textSprite = new THREE.Sprite(textMaterial);
        // Adjust text sprite scale to match dialog box better
        const aspectRatio = this.textCanvas.width / this.textCanvas.height;
        this.textSprite.scale.set(
            (this.dialogWidth - this.textPadding * 2),
            (this.dialogWidth - this.textPadding * 2) / aspectRatio,
            1
        );
        
        this.game.scene.add(this.textSprite);
    }
    
    loadDialogBackground() {
        const spritePath = this.game.basePath + '/images/mobile_box.png';
        this.textureLoader.load(spritePath, (texture) => {
            texture.encoding = THREE.sRGBEncoding;
            texture.colorSpace = THREE.SRGBColorSpace;
            const material = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true,
                depthTest: false,
                depthWrite: false
            });
            
            this.sprite = new THREE.Sprite(material);
            this.sprite.scale.set(this.dialogWidth, this.dialogHeight, 1);
            this.updatePosition();
            this.game.scene.add(this.sprite);
        });
    }
    
    updateText() {
        if (!this.textContext) return;
        
        // Clear canvas
        this.textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        
        // Configure text style
        this.textContext.font = 'bold 80px Arial';
        this.textContext.textAlign = 'left';
        this.textContext.textBaseline = 'middle';
        
        // Calculate starting position
        const startX = 40;
        const startY = this.textCanvas.height / 2;
        
        // Draw each character (allows for individual character coloring)
        let currentX = startX;
        for (let i = 0; i < this.displayedText.length; i++) {
            const char = this.displayedText[i];
            
            // Example of coloring specific characters
            // You can modify this logic to color characters however you want
            if (char === '!') {
                this.textContext.fillStyle = '#FF0000'; // Red exclamation marks
            } else {
                this.textContext.fillStyle = '#000000'; // Default black text
            }
            
            this.textContext.fillText(char, currentX, startY);
            currentX += this.textContext.measureText(char).width;
        }
        
        // Update texture
        this.textTexture.needsUpdate = true;
    }
    
    updateTextAnimation(deltaTime) {
        if (!this.isAnimating) return;
        
        this.timeAccumulator += deltaTime;
        
        while (this.timeAccumulator >= this.charDelay && this.charIndex < this.currentText.length) {
            this.timeAccumulator -= this.charDelay;
            this.displayedText += this.currentText[this.charIndex];
            this.charIndex++;
            this.updateText();
            
            // Play sound effect (if available)
            if (this.game.audio && this.game.audio.playTextSound) {
                this.game.audio.playTextSound();
            }
        }
        
        this.isAnimating = this.charIndex < this.currentText.length;
    }
    
    setText(text) {
        this.currentText = text;
        this.displayedText = '';
        this.charIndex = 0;
        this.isAnimating = true;
        this.timeAccumulator = 0;
        this.updateText();
    }
    
    updatePosition() {
        if (!this.sprite) return;
        
        const camera = this.game.camera;
        const distance = Math.abs(camera.position.z) * 0.9;
        
        const vFov = camera.fov * Math.PI / 180;
        const height = 2.7 * Math.tan(vFov / 2) * distance;
        const width = height * camera.aspect;
        
        const yOffset = height / 2 - this.dialogHeight * 1.2;
        const zPos = camera.position.z - distance;
        
        this.sprite.position.set(0, yOffset, zPos);
        
        if (this.textSprite) {
            this.textSprite.position.copy(this.sprite.position);
            this.textSprite.position.z += 0.01; // Slightly in front
        }
    }
    
    update(deltaTime) {
        this.updatePosition();
        this.updateTextAnimation(deltaTime);
    }
    
    toggle() {
        this.visible = !this.visible;
        if (this.sprite) this.sprite.visible = this.visible;
        if (this.textSprite) this.textSprite.visible = this.visible;
    }
    
    show() {
        this.visible = true;
        if (this.sprite) this.sprite.visible = true;
        if (this.textSprite) this.textSprite.visible = true;
    }
    
    hide() {
        this.visible = false;
        if (this.sprite) this.sprite.visible = false;
        if (this.textSprite) this.textSprite.visible = false;
    }
    
    handleClick(event) {
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.game.camera);
        
        if (this.sprite) {
            const intersects = raycaster.intersectObject(this.sprite);
            if (intersects.length > 0) {
                if (this.isAnimating) {
                    // Skip animation and show full text
                    this.displayedText = this.currentText;
                    this.charIndex = this.currentText.length;
                    this.isAnimating = false;
                    this.updateText();
                } else {
                    this.toggle();
                }
                return true;
            }
        }
        
        return false;
    }
}