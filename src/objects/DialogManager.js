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
        this.textPadding = 0.3;
        
        // Animation properties
        this.isAnimating = false;
        this.charIndex = 0;
        this.charDelay = 0.05; // Seconds per character
        this.timeAccumulator = 0;
        
        // Fade animation properties
        this.isFading = false;
        this.fadeProgress = 0;
        this.fadeDuration = 1.0;
        this.fadeStartDelay = 0;
        this.textStartDelay = 0.5; // Delay after fade before text starts
        this.initialDelay = 0;
        this.delayProgress = 0;
        
        // Text layout properties
        this.textLayout = [];

        this.forceStopAnimating = false;
        
        // Create canvas for text
        this.setupTextSystem();
        this.loadDialogBackground();

        this.arrow = new TextArrow(game, this);
    }
    
    setupTextSystem() {
        // Create canvas for text rendering
        this.textCanvas = document.createElement('canvas');
        // Adjusted canvas dimensions to match dialog box ratio better
        this.textCanvas.width = 900;
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
            depthWrite: false,
            opacity: 0 // Start invisible
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
                depthWrite: false,
                opacity: 0 // Start invisible
            });
            
            this.sprite = new THREE.Sprite(material);
            this.sprite.scale.set(this.dialogWidth, this.dialogHeight, 1);
            this.updatePosition();
            this.game.scene.add(this.sprite);
        });
    }

    calculateTextLayout(text) {
        const padding = 50;
        const lineHeight = 120;
        const maxWidth = this.textCanvas.width - (padding);
        
        this.textContext.font = 'bold 80px Arial';
        
        let layout = [];
        let currentLine = [];
        let currentLineWidth = 0;
        let x = padding;
        let y = padding;
        
        // Pre-calculate positions for each character
        let inColorTag = false;
        let colorBuffer = '';
        let currentColor = '#1a1712';
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            // Handle color tags
            if (char === '[') {
                inColorTag = true;
                colorBuffer = '';
                continue;
            }
            
            if (inColorTag) {
                if (char === ']') {
                    inColorTag = false;
                    if (colorBuffer.startsWith('/')) {
                        currentColor = '#1a1712';
                    } else {
                        currentColor = colorBuffer;
                    }
                } else {
                    colorBuffer += char;
                }
                continue;
            }
            
            // Handle actual text characters
            const metrics = this.textContext.measureText(char);
            const charWidth = metrics.width;
            
            // Check if we need to wrap to next line
            if (char === ' ' || currentLineWidth + charWidth > maxWidth) {
                if (char !== ' ') {
                    // Look back to find last space for word wrapping
                    let lastSpaceIndex = currentLine.length - 1;
                    while (lastSpaceIndex >= 0 && currentLine[lastSpaceIndex].char !== ' ') {
                        lastSpaceIndex--;
                    }
                    
                    if (lastSpaceIndex >= 0) {
                        // Move word to next line
                        const wordChars = currentLine.splice(lastSpaceIndex + 1);
                        layout.push({
                            chars: currentLine,
                            y: y
                        });
                        
                        // Reset for next line
                        y += lineHeight;
                        currentLine = wordChars;
                        
                        // Recalculate x positions for wrapped word
                        let newX = padding;
                        for (let charInfo of currentLine) {
                            charInfo.x = newX;
                            newX += this.textContext.measureText(charInfo.char).width;
                        }
                        currentLineWidth = newX - padding;
                    }
                }
            }
            
            if (char !== ' ' || currentLine.length > 0) {
                currentLine.push({
                    char,
                    x: x + currentLineWidth,
                    color: currentColor
                });
                currentLineWidth += charWidth;
            }
            
            if (char === ' ') {
                currentLineWidth += this.textContext.measureText(' ').width;
            }
        }
        
        // Add the last line
        if (currentLine.length > 0) {
            layout.push({
                chars: currentLine,
                y: y
            });
        }
        
        return layout;
    }
    
    updateText() {
        if (!this.textContext) return;
        
        // Clear canvas
        this.textContext.clearRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        
        // Configure text style
        this.textContext.font = 'bold 80px Arial';
        this.textContext.textAlign = 'left';
        this.textContext.textBaseline = 'top';
        
        // Draw text based on layout and current display length
        let charCount = 0;
        for (const line of this.textLayout) {
            for (const charInfo of line.chars) {
                if (charCount >= this.displayedText.length) break;
                
                this.textContext.fillStyle = charInfo.color;
                this.textContext.fillText(charInfo.char, charInfo.x, line.y);
                charCount++;
            }
            if (charCount >= this.displayedText.length) break;
        }
        
        // Update texture
        this.textTexture.needsUpdate = true;
    }
    
    getDisplayTextFromLayout(length) {
        let text = '';
        let count = 0;
        
        for (const line of this.textLayout) {
            for (const charInfo of line.chars) {
                if (count >= length) break;
                text += charInfo.char;
                count++;
            }
            if (count >= length) break;
        }
        
        return text;
    }
    
    updateTextAnimation(deltaTime) {
        if (!this.isAnimating || this.forceStopAnimating) return;
        
        this.timeAccumulator += deltaTime;
        
        let totalChars = 0;
        for (const line of this.textLayout) {
            totalChars += line.chars.length;
        }
        
        while (this.timeAccumulator >= this.charDelay && this.charIndex < totalChars) {
            this.timeAccumulator -= this.charDelay;
            this.displayedText = this.getDisplayTextFromLayout(this.charIndex + 1);
            this.charIndex++;
            this.updateText();
            
            // Play sound effect (if available)
            if (this.game.audio && this.game.audio.playTextSound) {
                this.game.audio.playTextSound();
            }
        }
        
        this.isAnimating = this.charIndex < totalChars;
    }
    
    setText(text) {
        this.currentText = text;
        this.displayedText = '';
        this.charIndex = 0;
        this.isAnimating = true;
        this.timeAccumulator = 0;
        
        // Pre-calculate the text layout
        this.textLayout = this.calculateTextLayout(text);
        
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

    fadeIn(initialMessage = 'Hello! This is a test message...', fadeDelay = 0, textDelay = 0.5) {
        // Store animation timing parameters
        this.fadeStartDelay = fadeDelay;
        this.textStartDelay = textDelay;
        this.initialDelay = fadeDelay;
        this.delayProgress = 0;
        
        // Reset states
        this.show();
        this.isFading = true;
        this.fadeProgress = 0;
        
        // Initialize the text but don't start animating yet
        
        this.setText(initialMessage);
        this.displayedText = '';
        this.charIndex = 0;
        this.isAnimating = false;
        this.forceStopAnimating = true;
        
        // Make sure opacity starts at 0
        if (this.sprite) {
            this.sprite.material.opacity = 0;
        }
        if (this.textSprite) {
            this.textSprite.material.opacity = 0;
        }
    }

    updateFadeAnimation(deltaTime) {
        if (!this.isFading) return;

        // Handle initial delay
        if (this.delayProgress < this.initialDelay) {
            this.delayProgress += deltaTime;
            return;
        }

        this.fadeProgress += deltaTime;
        const alpha = Math.min((this.fadeProgress) / this.fadeDuration, 1.0);
        
        // Fade in the sprites
        if (this.sprite) {
            this.sprite.material.opacity = alpha;
        }
        if (this.textSprite) {
            this.textSprite.material.opacity = alpha;
        }
        
        // Check if fade is complete
        if (this.fadeProgress >= this.fadeDuration) {
            this.isFading = false;
            
            // Schedule text animation to start after textStartDelay
            setTimeout(() => {
                this.forceStopAnimating = false;
                this.timeAccumulator = 0;
                this.game.sequenceManager.playSequence('intro');
            }, this.textStartDelay * 1000);
        }
    }
    
    update(deltaTime) {
        this.updatePosition();
        this.updateFadeAnimation(deltaTime);
        this.updateTextAnimation(deltaTime);
        this.arrow.update(deltaTime);
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
                    this.displayedText = this.getDisplayTextFromLayout(this.textLayout.reduce((sum, line) => sum + line.chars.length, 0));
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

export class TextArrow extends GameObject {
    constructor(game, dialogManager) {
        super();
        this.game = game;
        this.dialogManager = dialogManager;
        this.sprite = null;
        this.visible = true;
        this.forceHidden = false;
        
        // Animation properties
        this.offset = 0;
        this.speed = 3;
        this.amplitude = 0.05;
        
        // Transition properties - much more damped now
        this.currentScale = 0.5;
        this.targetScale = 0.5;
        this.scaleVelocity = 0;
        this.scaleDamping = 0.4;  // Increased from 0.2
        this.scaleSpringStrength = 0.15; // Reduced from 0.3
        
        this.loadArrow();
    }
    
    loadArrow() {
        const textureLoader = new THREE.TextureLoader(this.game.loadingManager);
        const arrowPath = this.game.basePath + '/images/text_arrow.png';
        
        textureLoader.load(arrowPath, (texture) => {
            texture.encoding = THREE.sRGBEncoding;
            texture.colorSpace = THREE.SRGBColorSpace;
            const material = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true,
                depthTest: false,
                depthWrite: false
            });
            
            this.sprite = new THREE.Sprite(material);
            this.sprite.scale.set(this.currentScale, this.currentScale, 1);
            this.game.scene.add(this.sprite);
            this.updatePosition(0);
        });
    }

    getBounceEase(t) {
        return Math.pow(Math.sin(t * Math.PI), 2);
    }

    updateScale(deltaTime) {
        const scaleDiff = this.targetScale - this.currentScale;
        
        // Apply extra damping when appearing to reduce bouncing
        const isAppearing = scaleDiff > 0;
        const effectiveDamping = isAppearing ? this.scaleDamping * 1.5 : this.scaleDamping;
        
        const spring = scaleDiff * this.scaleSpringStrength;
        this.scaleVelocity += spring;
        this.scaleVelocity *= (1 - effectiveDamping);
        this.currentScale += this.scaleVelocity;

        if (this.sprite) {
            const normalizedScale = this.currentScale / 0.5;
            this.sprite.scale.set(this.currentScale, this.currentScale, 1);
            this.sprite.material.opacity = normalizedScale;
            this.sprite.visible = normalizedScale > 0.01;
        }
    }

    updatePosition(floatOffset = 0) {
        if (!this.sprite) return;
        
        const camera = this.game.camera;
        const distance = Math.abs(camera.position.z) * 0.9;
        
        const vFov = camera.fov * Math.PI / 180;
        const height = 2.7 * Math.tan(vFov / 2) * distance;
        const width = height * camera.aspect;
        
        const yOffset = height / 2 - 2.5;
        const zPos = camera.position.z - distance;
        
        this.sprite.position.set(
            0,
            yOffset + floatOffset,
            zPos + 0.01
        );
    }

    update(deltaTime) {
        if (!this.sprite || !this.dialogManager) return;

        const shouldShow = this.dialogManager.visible && 
                         !this.dialogManager.isAnimating && 
                         !this.dialogManager.forceStopAnimating &&
                         !this.forceHidden;

        this.targetScale = shouldShow ? 0.5 : 0;
        this.updateScale(deltaTime);

        if (this.currentScale > 0.01) {
            this.offset += deltaTime * this.speed;
            const normalizedBounce = this.getBounceEase(Math.sin(this.offset) * 0.5 + 0.5);
            const floatY = normalizedBounce * this.amplitude;
            this.updatePosition(floatY);
        }
    }

    forceHide() {
        this.forceHidden = true;
        this.targetScale = 0;
    }

    allowShow() {
        this.forceHidden = false;
    }
}