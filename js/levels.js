/**
 * Level Configurations and Enemy / Obstacle / Collectible entities for Coin Collector.
 * Levels 1, 2, and 3 with progressive mechanics and visual themes.
 */

// Enemy types and behaviors
class Enemy {
    constructor(config) {
        this.type = config.type || 'slime'; // 'slime', 'bat', 'chaser'
        this.x = config.x;
        this.y = config.y;
        this.radius = config.radius || 18;
        this.speed = config.speed || 2;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.patrolAxis = config.patrolAxis || 'x'; // 'x', 'y', 'diagonal'
        this.minBound = config.minBound || 50;
        this.maxBound = config.maxBound || 700;
        this.color = config.color || '#2ECC71';
        this.name = config.name || 'Grumpy';
        this.cycle = Math.random() * Math.PI * 2;
        this.facing = 1;
    }

    update(player, obstacles, width, height) {
        this.cycle += 0.08;

        if (this.type === 'slime') {
            // Patrol back and forth along an axis
            if (this.patrolAxis === 'x') {
                this.x += this.vx;
                if (this.x < this.minBound) {
                    this.x = this.minBound;
                    this.vx = Math.abs(this.vx);
                    this.facing = 1;
                } else if (this.x > this.maxBound) {
                    this.x = this.maxBound;
                    this.vx = -Math.abs(this.vx);
                    this.facing = -1;
                }
            } else {
                this.y += this.vy;
                if (this.y < this.minBound) {
                    this.y = this.minBound;
                    this.vy = Math.abs(this.vy);
                } else if (this.y > this.maxBound) {
                    this.y = this.maxBound;
                    this.vy = -Math.abs(this.vy);
                }
            }
        } else if (this.type === 'bat') {
            // Bouncing diagonally off arena bounds and obstacles
            this.x += this.vx;
            this.y += this.vy;

            if (this.x - this.radius < 10) {
                this.x = this.radius + 10;
                this.vx = Math.abs(this.vx);
                this.facing = 1;
            } else if (this.x + this.radius > width - 10) {
                this.x = width - 10 - this.radius;
                this.vx = -Math.abs(this.vx);
                this.facing = -1;
            }

            if (this.y - this.radius < 10) {
                this.y = this.radius + 10;
                this.vy = Math.abs(this.vy);
            } else if (this.y + this.radius > height - 10) {
                this.y = height - 10 - this.radius;
                this.vy = -Math.abs(this.vy);
            }
        } else if (this.type === 'chaser') {
            // Intelligent stalking enemy: pursues player if in detection range
            const dist = Math.hypot(player.x - this.x, player.y - this.y);
            if (dist < 280) {
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                this.vx = Math.cos(angle) * this.speed;
                this.vy = Math.sin(angle) * this.speed;
            } else {
                // Idle wander/patrol
                this.vx = Math.sin(this.cycle * 0.5) * (this.speed * 0.6);
                this.vy = Math.cos(this.cycle * 0.5) * (this.speed * 0.6);
            }
            this.x += this.vx;
            this.y += this.vy;
            if (this.vx > 0.1) this.facing = 1;
            if (this.vx < -0.1) this.facing = -1;
        }

        // Clamp inside arena
        this.x = Math.max(this.radius + 5, Math.min(width - this.radius - 5, this.x));
        this.y = Math.max(this.radius + 5, Math.min(height - this.radius - 5, this.y));
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, this.radius + 2, this.radius * 0.8, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.type === 'slime') {
            // Cute squishy slime with angry eyebrows
            const squish = 1 + Math.sin(this.cycle * 2) * 0.15;
            ctx.scale(this.facing * (1 / squish), squish);

            // Slime Body
            const grad = ctx.createRadialGradient(-3, -5, 3, 0, 0, this.radius);
            grad.addColorStop(0, '#A8E6CF');
            grad.addColorStop(0.6, this.color);
            grad.addColorStop(1, '#1B5E20');
            ctx.fillStyle = grad;

            ctx.beginPath();
            ctx.arc(0, 0, this.radius, Math.PI, 0, false);
            ctx.quadraticCurveTo(this.radius, this.radius, 0, this.radius);
            ctx.quadraticCurveTo(-this.radius, this.radius, -this.radius, 0);
            ctx.closePath();
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#0F3812';
            ctx.stroke();

            // Grumpy Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.ellipse(-6, -2, 4.5, 5, 0, 0, Math.PI * 2);
            ctx.ellipse(6, -2, 4.5, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pupils
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(-5 + this.facing * 1.5, -2, 2.5, 0, Math.PI * 2);
            ctx.arc(7 + this.facing * 1.5, -2, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Angry Eyebrows
            ctx.strokeStyle = '#0F3812';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, -8);
            ctx.lineTo(-2, -5);
            ctx.moveTo(10, -8);
            ctx.lineTo(2, -5);
            ctx.stroke();

        } else if (this.type === 'bat') {
            // Flying spiky bat with flapping wings
            const wingFlap = Math.sin(this.cycle * 4) * 0.5;
            ctx.scale(this.facing, 1);

            // Wing left
            ctx.fillStyle = '#4A148C';
            ctx.beginPath();
            ctx.moveTo(-6, -4);
            ctx.lineTo(-24, -14 + wingFlap * 12);
            ctx.lineTo(-18, 8);
            ctx.closePath();
            ctx.fill();

            // Wing right
            ctx.beginPath();
            ctx.moveTo(6, -4);
            ctx.lineTo(24, -14 + wingFlap * 12);
            ctx.lineTo(18, 8);
            ctx.closePath();
            ctx.fill();

            // Body
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#1A0033';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Spooky Glowing Eyes
            ctx.fillStyle = '#FFEB3B';
            ctx.beginPath();
            ctx.arc(-5, -2, 4, 0, Math.PI * 2);
            ctx.arc(5, -2, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#D50000';
            ctx.beginPath();
            ctx.arc(-5, -2, 2, 0, Math.PI * 2);
            ctx.arc(5, -2, 2, 0, Math.PI * 2);
            ctx.fill();

            // Little Fangs
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.moveTo(-4, 6);
            ctx.lineTo(-2, 10);
            ctx.lineTo(0, 6);
            ctx.moveTo(1, 6);
            ctx.lineTo(3, 10);
            ctx.lineTo(5, 6);
            ctx.fill();

        } else if (this.type === 'chaser') {
            // Fiery Lava Hound / Golem
            const pulse = 1 + Math.sin(this.cycle * 3) * 0.1;
            ctx.scale(this.facing * pulse, pulse);

            // Spikes on head
            ctx.fillStyle = '#FF5722';
            for (let a = -0.8; a <= 0.8; a += 0.4) {
                const sx = Math.sin(a) * (this.radius + 6);
                const sy = -Math.cos(a) * (this.radius + 6);
                ctx.beginPath();
                ctx.moveTo(sx - 4, sy + 6);
                ctx.lineTo(sx, sy);
                ctx.lineTo(sx + 4, sy + 6);
                ctx.fill();
            }

            // Fiery Core Body
            const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius);
            grad.addColorStop(0, '#FFE082');
            grad.addColorStop(0.5, '#FF3D00');
            grad.addColorStop(1, '#BF360C');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#3E2723';
            ctx.stroke();

            // Glowing angry visor/eyes
            ctx.fillStyle = '#FFD600';
            ctx.beginPath();
            ctx.ellipse(4, -2, 7, 3.5, 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#D50000';
            ctx.beginPath();
            ctx.ellipse(5, -2, 3, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// Collectible items: Gold Coins and Special Star Gems
class Collectible {
    constructor(x, y, type = 'coin') {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.type = type; // 'coin' or 'gem'
        this.radius = type === 'coin' ? 14 : 17;
        this.points = type === 'coin' ? 10 : 50;
        this.spin = Math.random() * Math.PI * 2;
        this.hoverTime = Math.random() * Math.PI * 2;
        this.collected = false;
    }

    update() {
        this.spin += 0.06;
        this.hoverTime += 0.05;
        this.y = this.baseY + Math.sin(this.hoverTime) * 4;
    }

    draw(ctx) {
        if (this.collected) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.beginPath();
        ctx.ellipse(0, this.radius + 6, this.radius * 0.75, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.type === 'coin') {
            // 3D perspective spinning gold coin
            const scaleX = Math.cos(this.spin);
            ctx.scale(scaleX, 1);

            // Outer golden ring
            const grad = ctx.createLinearGradient(-this.radius, -this.radius, this.radius, this.radius);
            grad.addColorStop(0, '#FFF59D');
            grad.addColorStop(0.3, '#FBC02D');
            grad.addColorStop(0.7, '#F57F17');
            grad.addColorStop(1, '#FFD54F');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#E65100';
            ctx.stroke();

            // Inner coin rim & star engraving
            if (Math.abs(scaleX) > 0.3) {
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = '#FFE082';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.65, 0, Math.PI * 2);
                ctx.stroke();

                // Star or Dollar symbol
                ctx.fillStyle = '#BF360C';
                ctx.font = `bold ${Math.floor(this.radius * 0.9)}px 'Fredoka', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('★', 0, 1);
            }

            // Shiny glint highlight
            if (Math.sin(this.spin * 2) > 0.7) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(-this.radius * 0.35, -this.radius * 0.35, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }

        } else if (this.type === 'gem') {
            // Prismatic glowing Star Gem
            const scale = 1 + Math.sin(this.hoverTime * 2) * 0.1;
            ctx.scale(scale, scale);

            // Pulsing aura
            ctx.fillStyle = 'rgba(255, 0, 128, 0.25)';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
            ctx.fill();

            // 5-pointed diamond star
            ctx.beginPath();
            const spikes = 5;
            const outer = this.radius;
            const inner = this.radius * 0.5;
            for (let i = 0; i < spikes * 2; i++) {
                const r = (i % 2 === 0) ? outer : inner;
                const a = (i * Math.PI) / spikes - Math.PI / 2;
                if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();

            const gemGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, this.radius);
            gemGrad.addColorStop(0, '#FFFFFF');
            gemGrad.addColorStop(0.3, '#FF4081');
            gemGrad.addColorStop(0.8, '#D81B60');
            gemGrad.addColorStop(1, '#880E4F');
            ctx.fillStyle = gemGrad;
            ctx.fill();

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();
        }

        ctx.restore();
    }
}

// Obstacles: Walls, Spikes, Moving Hazard Bars
class Obstacle {
    constructor(config) {
        this.type = config.type; // 'wall', 'spike', 'hazardBar'
        this.x = config.x;
        this.y = config.y;
        this.w = config.w || 60;
        this.h = config.h || 60;
        this.color = config.color || '#795548';
        this.subColor = config.subColor || '#5D4037';
        this.time = Math.random() * Math.PI * 2;

        // For moving hazard bars
        this.moving = config.moving || false;
        this.axis = config.axis || 'x';
        this.speed = config.speed || 2;
        this.minPos = config.minPos || 100;
        this.maxPos = config.maxPos || 500;
    }

    update() {
        this.time += 0.05;
        if (this.moving) {
            if (this.axis === 'x') {
                this.x += this.speed;
                if (this.x < this.minPos || this.x + this.w > this.maxPos) {
                    this.speed = -this.speed;
                }
            } else {
                this.y += this.speed;
                if (this.y < this.minPos || this.y + this.h > this.maxPos) {
                    this.speed = -this.speed;
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        if (this.type === 'wall' || this.type === 'rock') {
            // Cartoon stone/hedge wall with rounded edges
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(this.x + 4, this.y + 6, this.w, this.h);

            // Wall block
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.w, this.h, 10);
            ctx.fill();

            ctx.lineWidth = 3;
            ctx.strokeStyle = this.subColor;
            ctx.stroke();

            // Brick texture / decorative pattern
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x + 4, this.y + 4, this.w - 8, this.h / 2 - 4);
        } else if (this.type === 'spike') {
            // Hazard spikes
            const spikeCount = Math.floor(this.w / 18);
            const sw = this.w / spikeCount;

            ctx.fillStyle = '#E53935';
            for (let i = 0; i < spikeCount; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x + i * sw, this.y + this.h);
                ctx.lineTo(this.x + (i + 0.5) * sw, this.y + Math.sin(this.time * 2 + i) * 3);
                ctx.lineTo(this.x + (i + 1) * sw, this.y + this.h);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#B71C1C';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        } else if (this.type === 'hazardBar') {
            // Glowing energy hazard bar
            const glow = ctx.createLinearGradient(this.x, this.y, this.x + this.w, this.y + this.h);
            glow.addColorStop(0, '#FF1744');
            glow.addColorStop(0.5, '#FF9100');
            glow.addColorStop(1, '#FF1744');

            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.w, this.h, 8);
            ctx.fill();
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Hazard warning stripes
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 4;
            for (let ox = 0; ox < this.w; ox += 18) {
                ctx.beginPath();
                ctx.moveTo(this.x + ox, this.y);
                ctx.lineTo(this.x + ox + 10, this.y + this.h);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
}

// LEVEL DEFINITIONS
const LEVEL_DATA = [
    // LEVEL 1: Sunny Meadow (Introductory, friendly)
    {
        id: 1,
        title: "Level 1: Sunny Meadow",
        subtitle: "Collect all golden coins and watch out for sleepy slimes!",
        theme: {
            bgGradient: ['#E0F7FA', '#80DEEA', '#A5D6A7'],
            groundColor: '#81C784',
            hillColor: '#66BB6A',
            cloudColor: 'rgba(255, 255, 255, 0.85)',
            accent: '#4CAF50'
        },
        timeLimit: 60,
        playerStart: { x: 80, y: 300 },
        coins: [
            { x: 180, y: 120 }, { x: 260, y: 120 }, { x: 340, y: 120 },
            { x: 540, y: 120 }, { x: 620, y: 120 }, { x: 700, y: 120 },
            { x: 180, y: 480 }, { x: 260, y: 480 }, { x: 340, y: 480 },
            { x: 540, y: 480 }, { x: 620, y: 480 }, { x: 700, y: 480 },
            { x: 440, y: 180 }, { x: 440, y: 420 }, { x: 440, y: 300 }
        ],
        gems: [
            { x: 800, y: 300 }
        ],
        enemies: [
            { type: 'slime', x: 280, y: 220, vx: 2.2, vy: 0, minBound: 180, maxBound: 380, patrolAxis: 'x', color: '#4CAF50', name: 'Bob' },
            { type: 'slime', x: 600, y: 380, vx: -2.2, vy: 0, minBound: 500, maxBound: 700, patrolAxis: 'x', color: '#66BB6A', name: 'Pip' }
        ],
        obstacles: [
            { type: 'wall', x: 220, y: 280, w: 100, h: 40, color: '#8D6E63', subColor: '#5D4037' },
            { type: 'wall', x: 560, y: 280, w: 100, h: 40, color: '#8D6E63', subColor: '#5D4037' }
        ]
    },

    // LEVEL 2: Twilight Grove (Sunset, bats, spikes & moving hazard)
    {
        id: 2,
        title: "Level 2: Twilight Grove",
        subtitle: "Beware of bouncing dusk bats and hidden spike traps!",
        theme: {
            bgGradient: ['#311B92', '#673AB7', '#FF7043'],
            groundColor: '#5E35B1',
            hillColor: '#4527A0',
            cloudColor: 'rgba(255, 204, 188, 0.5)',
            accent: '#AB47BC'
        },
        timeLimit: 60,
        playerStart: { x: 80, y: 80 },
        coins: [
            { x: 160, y: 80 }, { x: 240, y: 80 }, { x: 320, y: 80 },
            { x: 560, y: 80 }, { x: 640, y: 80 }, { x: 720, y: 80 },
            { x: 160, y: 520 }, { x: 240, y: 520 }, { x: 320, y: 520 },
            { x: 560, y: 520 }, { x: 640, y: 520 }, { x: 720, y: 520 },
            { x: 140, y: 300 }, { x: 200, y: 300 }, { x: 680, y: 300 }, { x: 740, y: 300 },
            { x: 380, y: 200 }, { x: 500, y: 200 }, { x: 380, y: 400 }, { x: 500, y: 400 }
        ],
        gems: [
            { x: 440, y: 120 },
            { x: 440, y: 480 }
        ],
        enemies: [
            { type: 'slime', x: 200, y: 160, vx: 3, vy: 0, minBound: 120, maxBound: 360, patrolAxis: 'x', color: '#9C27B0' },
            { type: 'slime', x: 680, y: 440, vx: -3, vy: 0, minBound: 520, maxBound: 760, patrolAxis: 'x', color: '#9C27B0' },
            { type: 'bat', x: 440, y: 260, vx: 2.8, vy: 2.4, color: '#BA68C8' },
            { type: 'bat', x: 300, y: 400, vx: -2.6, vy: 2.8, color: '#7E57C2' }
        ],
        obstacles: [
            { type: 'rock', x: 260, y: 220, w: 60, h: 60, color: '#4A148C', subColor: '#311B92' },
            { type: 'rock', x: 560, y: 220, w: 60, h: 60, color: '#4A148C', subColor: '#311B92' },
            { type: 'rock', x: 260, y: 320, w: 60, h: 60, color: '#4A148C', subColor: '#311B92' },
            { type: 'rock', x: 560, y: 320, w: 60, h: 60, color: '#4A148C', subColor: '#311B92' },
            { type: 'spike', x: 380, y: 290, w: 120, h: 20 },
            { type: 'hazardBar', x: 410, y: 160, w: 60, h: 18, moving: true, axis: 'y', speed: 2.2, minPos: 140, maxPos: 440 }
        ]
    },

    // LEVEL 3: Magma Vault (Intense volcanic fortress, chasing golem, fire hazards)
    {
        id: 3,
        title: "Level 3: Magma Vault",
        subtitle: "The ultimate challenge! Dodge the fiery golem and collect the vault's treasure!",
        theme: {
            bgGradient: ['#210505', '#4E0D0D', '#BF360C'],
            groundColor: '#3E2723',
            hillColor: '#271206',
            cloudColor: 'rgba(255, 87, 34, 0.25)',
            accent: '#FF3D00'
        },
        timeLimit: 60,
        playerStart: { x: 80, y: 300 },
        coins: [
            { x: 120, y: 100 }, { x: 200, y: 100 }, { x: 280, y: 100 }, { x: 360, y: 100 },
            { x: 520, y: 100 }, { x: 600, y: 100 }, { x: 680, y: 100 }, { x: 760, y: 100 },
            { x: 120, y: 500 }, { x: 200, y: 500 }, { x: 280, y: 500 }, { x: 360, y: 500 },
            { x: 520, y: 500 }, { x: 600, y: 500 }, { x: 680, y: 500 }, { x: 760, y: 500 },
            { x: 140, y: 220 }, { x: 140, y: 380 }, { x: 740, y: 220 }, { x: 740, y: 380 },
            { x: 300, y: 240 }, { x: 300, y: 360 }, { x: 580, y: 240 }, { x: 580, y: 360 },
            { x: 440, y: 300 }
        ],
        gems: [
            { x: 440, y: 140 },
            { x: 440, y: 460 },
            { x: 800, y: 300 }
        ],
        enemies: [
            { type: 'slime', x: 200, y: 180, vx: 3.5, vy: 0, minBound: 100, maxBound: 340, patrolAxis: 'x', color: '#FF5722' },
            { type: 'slime', x: 680, y: 420, vx: -3.5, vy: 0, minBound: 540, maxBound: 780, patrolAxis: 'x', color: '#FF5722' },
            { type: 'bat', x: 440, y: 220, vx: 3.2, vy: -3.2, color: '#FF7043' },
            { type: 'bat', x: 440, y: 380, vx: -3.2, vy: 3.2, color: '#FF7043' },
            { type: 'chaser', x: 780, y: 300, speed: 2.4, color: '#D50000', name: 'Magma Hound' }
        ],
        obstacles: [
            // Center fortress layout
            { type: 'wall', x: 380, y: 200, w: 120, h: 30, color: '#260906', subColor: '#BF360C' },
            { type: 'wall', x: 380, y: 370, w: 120, h: 30, color: '#260906', subColor: '#BF360C' },
            { type: 'spike', x: 220, y: 285, w: 80, h: 24 },
            { type: 'spike', x: 580, y: 285, w: 80, h: 24 },
            { type: 'hazardBar', x: 410, y: 280, w: 60, h: 24, moving: true, axis: 'x', speed: 2.8, minPos: 320, maxPos: 560 }
        ]
    }
];

window.LEVEL_DATA = LEVEL_DATA;
window.Enemy = Enemy;
window.Collectible = Collectible;
window.Obstacle = Obstacle;
