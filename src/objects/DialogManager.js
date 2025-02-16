import * as THREE from 'three';
import { GameObject } from './GameObject';

export class DialogManager extends GameObject {
    constructor(game) {
        super();
        this.game = game;
        this.visible = true;
        this.currentText = '';
        this.textureLoader = new THREE.TextureLoader(game.loadingManager);
        
        // Configure dialog dimensions - adjusted for new image ratio (2184:1500)
        this.dialogWidth = 2.8;  // Adjusted width for new proportions
        this.dialogHeight = 1.9;  // Height scaled based on new aspect ratio
        this.textPadding = 0.2;  // Adjusted padding for new dimensions
        
        // Set up the dialog sprite
        const spritePath = game.basePath + '/images/mobile_box.png';
        this.textureLoader.load(spritePath, (texture) => {
            const material = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true,
                depthTest: false,
                depthWrite: false
            });
            
            this.sprite = new THREE.Sprite(material);
            this.sprite.scale.set(this.dialogWidth, this.dialogHeight, 1);
            this.updatePosition();
            game.scene.add(this.sprite);
            
            // Set up text canvas and sprite after dialog sprite is loaded
            this.setupTextSystem();
        });
    }
    
    setupTextSystem() {
        // Create canvas for text rendering
        this.textCanvas = document.createElement('canvas');
        this.textCanvas.width = 1024;
        this.textCanvas.height = 256;
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
        this.textSprite.scale.set(
            this.dialogWidth - this.textPadding * 2,
            this.dialogHeight - this.textPadding * 2,
            1
        );
        
        // Position text slightly in front of dialog box
        this.updatePosition();
        this.game.scene.add(this.textSprite);
    }
    
    updatePosition() {
        if (!this.sprite) return;
        
        // Get camera aspect and position
        const camera = this.game.camera;
        const distance = Math.abs(camera.position.z) * 0.9; // Position at 80% of camera distance
        
        // Calculate top center position
        const vFov = camera.fov * Math.PI / 180;
        const height = 2.7 * Math.tan(vFov / 2) * distance;
        const width = height * camera.aspect;
        
        // Position dialog at top center with adjusted spacing for new dimensions
        const yOffset = height / 2 - this.dialogHeight * 1.2; // Adjusted for new height
        this.sprite.position.set(0, yOffset, camera.position.z - distance);
        
        // Update text position if it exists
        if (this.textSprite) {
            this.textSprite.position.copy(this.sprite.position);
            this.textSprite.position.z += 0.01; // Slightly in front
        }
    }
    
    setText(text) {
        this.currentText = text;
        if (!this.textContext) return;
        
        // Clear canvas
        this.textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        
        // Configure text style
        this.textContext.font = '28px "Arial Rounded MT"';
        this.textContext.fillStyle = 'black';
        this.textContext.textAlign = 'center';
        this.textContext.textBaseline = 'middle';
        
        // Word wrap text
        const maxWidth = this.textCanvas.width - 40;
        const words = text.split(' ');
        let line = '';
        let y = this.textCanvas.height / 2;
        
        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = this.textContext.measureText(testLine);
            
            if (metrics.width > maxWidth && line !== '') {
                this.textContext.fillText(line, this.textCanvas.width / 2, y);
                line = word + ' ';
                y += 40;
            } else {
                line = testLine;
            }
        }
        this.textContext.fillText(line, this.textCanvas.width / 2, y);
        
        // Update texture
        this.textTexture.needsUpdate = true;
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
    
    update(deltaTime) {
        // Handle any animations or updates here
        this.updatePosition(); // Keep dialog positioned correctly
    }
    
    handleClick(event) {
        // Convert mouse position to normalized device coordinates
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        
        // Raycasting for sprite intersection
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.game.camera);
        
        if (this.sprite) {
            const intersects = raycaster.intersectObject(this.sprite);
            if (intersects.length > 0) {
                this.toggle();
                return true; // Click was handled
            }
        }
        
        return false; // Click was not handled
    }
}