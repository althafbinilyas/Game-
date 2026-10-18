/**
 * Player Character Entity ("Pip the Golden Furry")
 * Features cute cartoon drawing, directional eyes, ear bounce, squash & stretch, and smooth movement physics.
 */

class Player {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.radius = 22; // collision radius
        this.width = 44;
        this.height = 44;

        this.vx = 0;
        this.vy = 0;
        this.speed = 5.2;
        this.friction = 0.82;
        this.facing = 1; // 1 = right, -1 = left

        // Animation states
        this.walkCycle = 0;
        this.isMoving = false;
        this.squashX = 1;
        this.squashY = 1;

        // Damage & invulnerability
        this.invulnerableTimer = 0;
        this.flashVisible = true;
    }

    reset(x = this.startX, y = this.startY) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.invulnerableTimer = 0;
        this.squashX = 1;
        this.squashY = 1;
    }

    takeDamage() {
        if (this.invulnerableTimer > 0) return false;
        this.invulnerableTimer = 90; // ~1.5s at 60 FPS
        this.squashX = 1.4;
        this.squashY = 0.6;
        return true;
    }

    update(keys, canvasWidth, canvasHeight, obstacles) {
        let dx = 0;
        let dy = 0;

        if (keys['ArrowUp'] || keys['KeyW']) dy -= 1;
        if (keys['ArrowDown'] || keys['KeyS']) dy += 1;
        if (keys['ArrowLeft'] || keys['KeyA']) dx -= 1;
        if (keys['ArrowRight'] || keys['KeyD']) dx += 1;

        // Normalize diagonal speed
        if (dx !== 0 && dy !== 0) {
            const factor = 1 / Math.SQRT2;
            dx *= factor;
            dy *= factor;
        }

        // Apply acceleration
        if (dx !== 0 || dy !== 0) {
            this.vx += dx * this.speed * 0.28;
            this.vy += dy * this.speed * 0.28;
            this.isMoving = true;
            this.walkCycle += 0.25;

            if (dx > 0) this.facing = 1;
            if (dx < 0) this.facing = -1;

            // Emit dust puffs
            if (Math.random() < 0.2) {
                window.particleSystem.createDust(this.x, this.y + this.radius);
            }
        } else {
            this.isMoving = false;
            this.walkCycle = 0;
        }

        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Cap max speed
        const currentSpeed = Math.hypot(this.vx, this.vy);
        if (currentSpeed > this.speed) {
            this.vx = (this.vx / currentSpeed) * this.speed;
            this.vy = (this.vy / currentSpeed) * this.speed;
        }

        // Target squash based on movement
        const targetSquashX = 1 + Math.abs(this.vx) * 0.04 - Math.abs(this.vy) * 0.03;
        const targetSquashY = 1 + Math.abs(this.vy) * 0.04 - Math.abs(this.vx) * 0.03;
        this.squashX += (targetSquashX - this.squashX) * 0.2;
        this.squashY += (targetSquashY - this.squashY) * 0.2;

        // Move with obstacle collisions (X-axis first)
        const nextX = this.x + this.vx;
        if (!this.checkWallCollision(nextX, this.y, obstacles, canvasWidth, canvasHeight)) {
            this.x = nextX;
        } else {
            this.vx = 0;
        }

        // Y-axis next
        const nextY = this.y + this.vy;
        if (!this.checkWallCollision(this.x, nextY, obstacles, canvasWidth, canvasHeight)) {
            this.y = nextY;
        } else {
            this.vy = 0;
        }

        // Bounds check
        this.x = Math.max(this.radius + 6, Math.min(canvasWidth - this.radius - 6, this.x));
        this.y = Math.max(this.radius + 6, Math.min(canvasHeight - this.radius - 6, this.y));

        // Invulnerability countdown
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer--;
            this.flashVisible = Math.floor(this.invulnerableTimer / 5) % 2 === 0;
        } else {
            this.flashVisible = true;
        }
    }

    checkWallCollision(x, y, obstacles, w, h) {
        // Arena boundary collision
        if (x - this.radius < 4 || x + this.radius > w - 4 ||
            y - this.radius < 4 || y + this.radius > h - 4) {
            return true;
        }

        if (!obstacles) return false;
        for (const obs of obstacles) {
            if (obs.type === 'wall' || obs.type === 'rock') {
                // Check circle to box collision
                const nearestX = Math.max(obs.x, Math.min(x, obs.x + obs.w));
                const nearestY = Math.max(obs.y, Math.min(y, obs.y + obs.h));
                const distSq = (x - nearestX) ** 2 + (y - nearestY) ** 2;
                if (distSq < (this.radius - 2) ** 2) {
                    return true;
                }
            }
        }
        return false;
    }

    draw(ctx) {
        if (!this.flashVisible) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Direction & Squash
        ctx.scale(this.facing * this.squashX, this.squashY);

        const bob = Math.sin(this.walkCycle) * 3;

        // Shadow under player
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.beginPath();
        ctx.ellipse(0, this.radius + 2, this.radius * 0.9, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears with bounce
        const earBob = Math.sin(this.walkCycle * 1.5) * 4;
        
        // Left Ear (back)
        ctx.fillStyle = '#E67E22';
        ctx.beginPath();
        ctx.ellipse(-12, -22 + earBob, 6, 12, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(-12, -22 + earBob, 3, 7, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Right Ear (front)
        ctx.fillStyle = '#F39C12';
        ctx.beginPath();
        ctx.ellipse(6, -24 - earBob, 6, 12, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(6, -24 - earBob, 3, 7, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Body (cute fluffy ball)
        const bodyGrad = ctx.createRadialGradient(-4, -6 + bob, 4, 0, 0 + bob, this.radius + 2);
        bodyGrad.addColorStop(0, '#FFD166');
        bodyGrad.addColorStop(0.7, '#F39C12');
        bodyGrad.addColorStop(1, '#D35400');

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, bob, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#9C3D00';
        ctx.stroke();

        // Cream belly
        ctx.fillStyle = '#FFF8E7';
        ctx.beginPath();
        ctx.ellipse(2, 6 + bob, 11, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rosy Pink Cheeks
        ctx.fillStyle = 'rgba(255, 105, 180, 0.6)';
        ctx.beginPath();
        ctx.ellipse(14, 3 + bob, 4.5, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(-3, 3 + bob, 3.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cute Big Anime Eyes looking forward
        const eyeLookX = this.vx * 0.4;
        const eyeLookY = this.vy * 0.3;

        // Front Eye
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.ellipse(8 + eyeLookX, -3 + bob + eyeLookY, 4.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eye Sparkle Highlight
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(6.5 + eyeLookX, -5 + bob + eyeLookY, 2, 0, Math.PI * 2);
        ctx.arc(9.5 + eyeLookX, -1 + bob + eyeLookY, 1, 0, Math.PI * 2);
        ctx.fill();

        // Back Eye
        ctx.fillStyle = '#2C3E50';
        ctx.beginPath();
        ctx.ellipse(-4 + eyeLookX, -3 + bob + eyeLookY, 3.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-5 + eyeLookX, -4.5 + bob + eyeLookY, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Cute Little Nose
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(14, 0 + bob, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Tiny Smile Mouth
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(12, 4 + bob, 3, 0.1 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();

        // Cute Feet
        const footOffset1 = Math.sin(this.walkCycle) * 4;
        const footOffset2 = -Math.sin(this.walkCycle) * 4;
        ctx.fillStyle = '#D35400';
        ctx.beginPath();
        ctx.ellipse(-6 + footOffset1, this.radius - 2, 5, 3.5, 0, 0, Math.PI * 2);
        ctx.ellipse(8 + footOffset2, this.radius - 2, 5.5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

window.Player = Player;
