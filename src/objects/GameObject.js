

export class GameObject {
    constructor() {
        this.mesh = null;
        this.mixer = null;
    }

    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
}