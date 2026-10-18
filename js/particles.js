/**
 * Particle & Visual Effects Engine for Coin Collector
 * Handles sparkles, dust trails, floating score popups, and confetti celebrations.
 */

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
        this.shakeTime = 0;
        this.shakeIntensity = 0;
    }

    // Trigger screen shake
    shake(intensity = 6, duration = 12) {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }

    getShakeOffset() {
        if (this.shakeTime > 0) {
            this.shakeTime--;
            const progress = this.shakeTime / 12;
            const currentIntensity = this.shakeIntensity * progress;
            return {
                x: (Math.random() - 0.5) * currentIntensity * 2,
                y: (Math.random() - 0.5) * currentIntensity * 2
            };
        }
        return { x: 0, y: 0 };
    }

    // Sparkle burst when collecting coins
    createCoinSparkles(x, y, color = '#FFD700', count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5,
                size: 3 + Math.random() * 4,
                color: Math.random() > 0.3 ? color : '#FFFFFF',
                alpha: 1,
                decay: 0.025 + Math.random() * 0.02,
                shape: Math.random() > 0.5 ? 'star' : 'circle',
                gravity: 0.12,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }

    // Dust puffs at player feet when running
    createDust(x, y) {
        for (let i = 0; i < 2; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 14,
                y: y + (Math.random() - 0.5) * 4,
                vx: (Math.random() - 0.5) * 1.2,
                vy: -Math.random() * 0.8,
                size: 3 + Math.random() * 3,
                color: 'rgba(235, 230, 215, 0.7)',
                alpha: 0.7,
                decay: 0.04,
                shape: 'circle',
                gravity: -0.01,
                rotation: 0,
                rotSpeed: 0
            });
        }
    }

    // Impact burst when hit by enemy
    createImpact(x, y) {
        this.shake(8, 14);
        for (let i = 0; i < 16; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 4,
                color: Math.random() > 0.5 ? '#FF4444' : '#FFAA00',
                alpha: 1,
                decay: 0.035,
                shape: 'star',
                gravity: 0.15,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: 0.2
            });
        }
    }

    // Confetti shower for victory & level complete
    createConfetti(width, count = 75) {
        const colors = ['#FF4081', '#7C4DFF', '#00E676', '#FFEA00', '#00B0FF', '#FF6D00'];
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * width,
                y: -10 - Math.random() * 50,
                vx: (Math.random() - 0.5) * 3,
                vy: 2 + Math.random() * 4,
                size: 6 + Math.random() * 6,
                aspect: 0.4 + Math.random() * 0.6,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                decay: 0.005 + Math.random() * 0.005,
                shape: 'confetti',
                gravity: 0.04,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.15,
                wobble: Math.random() * Math.PI * 2
            });
        }
    }

    // Floating text popups like "+10", "+50"
    addFloatingText(text, x, y, color = '#FFD700', fontSize = 20) {
        this.floatingTexts.push({
            text,
            x,
            y,
            vy: -2,
            alpha: 1,
            color,
            fontSize,
            decay: 0.02
        });
    }

    update() {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.alpha -= p.decay;
            p.rotation += p.rotSpeed;

            if (p.shape === 'confetti') {
                p.wobble += 0.1;
                p.x += Math.sin(p.wobble) * 1.5;
            }

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update floating text
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.vy *= 0.95;
            ft.alpha -= ft.decay;

            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        // Draw particles
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;

            if (p.shape === 'circle') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.shape === 'star') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.beginPath();
                const spikes = 4;
                const outer = p.size;
                const inner = p.size * 0.4;
                for (let s = 0; s < spikes * 2; s++) {
                    const r = (s % 2 === 0) ? outer : inner;
                    const a = (s * Math.PI) / spikes;
                    if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            } else if (p.shape === 'confetti') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillRect(-p.size / 2, -p.size * p.aspect / 2, p.size, p.size * p.aspect);
                ctx.restore();
            }
        }

        // Draw floating texts
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, ft.alpha);
            ctx.font = `900 ${ft.fontSize}px 'Fredoka', 'Outfit', sans-serif`;

            // Dark outline
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 4;
            ctx.strokeText(ft.text, ft.x, ft.y);

            // Colored fill
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }

        ctx.restore();
    }

    clear() {
        this.particles = [];
        this.floatingTexts = [];
        this.shakeTime = 0;
    }
}

window.particleSystem = new ParticleSystem();
