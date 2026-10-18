/**
 * Main Game Controller for Coin Collector
 * Handles Game Loop, Physics, Collisions, Levels, Scoring, Timer, Audio, and Mobile Touch Controls.
 */

class CoinCollectorGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Virtual game resolution
        this.width = 960;
        this.height = 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Game state: 'START', 'PLAYING', 'PAUSED', 'LEVEL_CLEAR', 'GAME_OVER', 'WIN'
        this.state = 'START';

        // Level & Progress
        this.currentLevelIndex = 0;
        this.level = null;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('coin_collector_highscore') || '0', 10);
        this.lives = 3;
        this.maxLives = 3;
        this.timeLeft = 60;
        this.timerInterval = null;

        // Entities
        this.player = new Player(this.width / 2, this.height / 2);
        this.coins = [];
        this.gems = [];
        this.enemies = [];
        this.obstacles = [];

        // Clouds for parallax background
        this.clouds = [
            { x: 50, y: 70, speed: 0.35, size: 45 },
            { x: 300, y: 40, speed: 0.25, size: 60 },
            { x: 620, y: 90, speed: 0.40, size: 50 },
            { x: 820, y: 55, speed: 0.30, size: 55 }
        ];

        // Input tracking
        this.keys = {};
        this.touchMovement = { x: 0, y: 0 };

        // DOM elements
        this.ui = {
            hud: document.getElementById('hud'),
            scoreValue: document.getElementById('scoreValue'),
            highScoreValue: document.getElementById('highScoreValue'),
            timerValue: document.getElementById('timerValue'),
            timerProgress: document.getElementById('timerProgress'),
            coinsValue: document.getElementById('coinsValue'),
            coinsTotal: document.getElementById('coinsTotal'),
            levelBadge: document.getElementById('levelBadge'),
            livesContainer: document.getElementById('livesContainer'),

            // Screens
            startScreen: document.getElementById('startScreen'),
            pauseScreen: document.getElementById('pauseScreen'),
            levelClearScreen: document.getElementById('levelClearScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            winScreen: document.getElementById('winScreen'),

            // Modals text
            finalScoreOver: document.getElementById('finalScoreOver'),
            finalScoreWin: document.getElementById('finalScoreWin'),
            winTimeLeft: document.getElementById('winTimeLeft'),
            levelClearNextName: document.getElementById('levelClearNextName'),
            starsRating: document.getElementById('starsRating')
        };

        this.initInput();
        this.initUI();
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Update high score display on startup
        if (this.ui.highScoreValue) {
            this.ui.highScoreValue.textContent = this.highScore;
        }

        // Start render loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    resize() {
        const container = document.getElementById('gameContainer');
        if (!container) return;

        const windowW = window.innerWidth;
        const windowH = window.innerHeight;
        const targetRatio = this.width / this.height; // 1.6

        // Available space considering HUD and padding
        const maxW = Math.min(windowW * 0.96, 1020);
        const maxH = Math.min(windowH * 0.88, 650);

        let w = maxW;
        let h = w / targetRatio;

        if (h > maxH) {
            h = maxH;
            w = h * targetRatio;
        }

        container.style.width = `${Math.floor(w)}px`;
        container.style.height = `${Math.floor(h)}px`;
    }

    initInput() {
        // Keyboard listeners
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            // Pause toggle with Escape or P key
            if (e.code === 'KeyP' || e.code === 'Escape') {
                if (this.state === 'PLAYING') {
                    this.pauseGame();
                } else if (this.state === 'PAUSED') {
                    this.resumeGame();
                }
            }

            // Prevent window scrolling on arrow keys or space
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Touch Virtual D-Pad
        const dpadButtons = document.querySelectorAll('.dpad-btn');
        dpadButtons.forEach(btn => {
            const key = btn.getAttribute('data-key');

            const handlePress = (e) => {
                e.preventDefault();
                this.keys[key] = true;
                btn.classList.add('active');
            };

            const handleRelease = (e) => {
                e.preventDefault();
                this.keys[key] = false;
                btn.classList.remove('active');
            };

            btn.addEventListener('touchstart', handlePress, { passive: false });
            btn.addEventListener('touchend', handleRelease, { passive: false });
            btn.addEventListener('touchcancel', handleRelease, { passive: false });
            btn.addEventListener('mousedown', handlePress);
            btn.addEventListener('mouseup', handleRelease);
            btn.addEventListener('mouseleave', handleRelease);
        });
    }

    initUI() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            window.sounds.playClick();
            this.startGame();
        });

        // Pause HUD button
        document.getElementById('pauseBtn').addEventListener('click', () => {
            window.sounds.playClick();
            if (this.state === 'PLAYING') this.pauseGame();
        });

        // Resume button in pause modal
        document.getElementById('resumeBtn').addEventListener('click', () => {
            window.sounds.playClick();
            this.resumeGame();
        });

        // Restart buttons
        const restartBtns = [
            document.getElementById('restartBtnHUD'),
            document.getElementById('restartBtnPause'),
            document.getElementById('restartBtnOver'),
            document.getElementById('restartBtnWin')
        ];
        restartBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    window.sounds.playClick();
                    this.restartGame();
                });
            }
        });

        // Next Level button
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', () => {
                window.sounds.playClick();
                this.nextLevel();
            });
        }

        // Audio controls
        const sfxToggle = document.getElementById('sfxToggle');
        if (sfxToggle) {
            sfxToggle.addEventListener('click', () => {
                const on = window.sounds.toggleSound();
                sfxToggle.classList.toggle('muted', !on);
                sfxToggle.textContent = on ? '🔊 SFX: ON' : '🔈 SFX: OFF';
            });
        }

        const musicToggle = document.getElementById('musicToggle');
        if (musicToggle) {
            musicToggle.addEventListener('click', () => {
                const on = window.sounds.toggleMusic();
                musicToggle.classList.toggle('muted', !on);
                musicToggle.textContent = on ? '🎵 Music: ON' : '🔇 Music: OFF';
            });
        }
    }

    showScreen(screenElement) {
        const screens = [
            this.ui.startScreen,
            this.ui.pauseScreen,
            this.ui.levelClearScreen,
            this.ui.gameOverScreen,
            this.ui.winScreen
        ];
        screens.forEach(s => {
            if (s) s.classList.add('hidden');
        });
        if (screenElement) {
            screenElement.classList.remove('hidden');
        }
    }

    startGame() {
        this.score = 0;
        this.lives = this.maxLives;
        this.currentLevelIndex = 0;
        this.showScreen(null);
        this.loadLevel(this.currentLevelIndex);
        this.state = 'PLAYING';
        this.startTimer();
        window.sounds.startBGM();
    }

    restartGame() {
        this.stopTimer();
        window.particleSystem.clear();
        this.score = 0;
        this.lives = this.maxLives;
        this.currentLevelIndex = 0;
        this.showScreen(null);
        this.loadLevel(this.currentLevelIndex);
        this.state = 'PLAYING';
        this.startTimer();
        window.sounds.startBGM();
    }

    loadLevel(index) {
        this.currentLevelIndex = index;
        const data = window.LEVEL_DATA[index];
        this.level = data;

        // Reset timer
        this.timeLeft = data.timeLimit;
        this.updateTimerUI();

        // Position player
        this.player.reset(data.playerStart.x, data.playerStart.y);

        // Spawn Coins
        this.coins = data.coins.map(c => new Collectible(c.x, c.y, 'coin'));

        // Spawn Gems
        this.gems = data.gems.map(g => new Collectible(g.x, g.y, 'gem'));

        // Spawn Enemies
        this.enemies = data.enemies.map(e => new Enemy(e));

        // Spawn Obstacles
        this.obstacles = data.obstacles.map(o => new Obstacle(o));

        // Update HUD
        if (this.ui.levelBadge) this.ui.levelBadge.textContent = data.title;
        this.updateHUD();
    }

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            if (this.state === 'PLAYING') {
                this.timeLeft--;
                this.updateTimerUI();

                if (this.timeLeft <= 10 && this.timeLeft > 0) {
                    window.sounds.playTick();
                    this.ui.timerValue.classList.add('pulse-danger');
                } else {
                    this.ui.timerValue.classList.remove('pulse-danger');
                }

                if (this.timeLeft <= 0) {
                    this.handleTimeOut();
                }
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerUI() {
        if (!this.ui.timerValue) return;
        this.ui.timerValue.textContent = `${this.timeLeft}s`;

        // Progress bar percentage
        if (this.ui.timerProgress && this.level) {
            const pct = Math.max(0, (this.timeLeft / this.level.timeLimit) * 100);
            this.ui.timerProgress.style.width = `${pct}%`;

            if (pct <= 20) {
                this.ui.timerProgress.style.backgroundColor = '#FF3B30';
            } else if (pct <= 45) {
                this.ui.timerProgress.style.backgroundColor = '#FF9500';
            } else {
                this.ui.timerProgress.style.backgroundColor = '#34C759';
            }
        }
    }

    updateHUD() {
        if (this.ui.scoreValue) this.ui.scoreValue.textContent = this.score;

        const collectedCount = this.coins.filter(c => c.collected).length;
        if (this.ui.coinsValue) this.ui.coinsValue.textContent = collectedCount;
        if (this.ui.coinsTotal) this.ui.coinsTotal.textContent = this.coins.length;

        // Render Hearts
        if (this.ui.livesContainer) {
            this.ui.livesContainer.innerHTML = '';
            for (let i = 0; i < this.maxLives; i++) {
                const heart = document.createElement('span');
                heart.className = `heart ${i < this.lives ? 'filled' : 'empty'}`;
                heart.textContent = '❤️';
                this.ui.livesContainer.appendChild(heart);
            }
        }

        // Update High Score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('coin_collector_highscore', this.highScore);
            if (this.ui.highScoreValue) this.ui.highScoreValue.textContent = this.highScore;
        }
    }

    pauseGame() {
        if (this.state !== 'PLAYING') return;
        this.state = 'PAUSED';
        this.showScreen(this.ui.pauseScreen);
    }

    resumeGame() {
        if (this.state !== 'PAUSED') return;
        this.state = 'PLAYING';
        this.showScreen(null);
    }

    handlePlayerHit() {
        if (this.player.takeDamage()) {
            this.lives--;
            this.updateHUD();
            window.sounds.playHurt();
            window.particleSystem.createImpact(this.player.x, this.player.y);

            if (this.lives <= 0) {
                this.gameOver("Out of Lives!");
            }
        }
    }

    handleTimeOut() {
        this.stopTimer();
        this.gameOver("Time's Up!");
    }

    gameOver(reason = "Game Over!") {
        this.state = 'GAME_OVER';
        this.stopTimer();
        window.sounds.stopBGM();
        window.sounds.playGameOver();

        if (this.ui.finalScoreOver) {
            this.ui.finalScoreOver.textContent = `${this.score} pts (${reason})`;
        }
        this.showScreen(this.ui.gameOverScreen);
    }

    checkLevelCompletion() {
        const allCoinsCollected = this.coins.every(c => c.collected);
        if (allCoinsCollected && this.state === 'PLAYING') {
            // Level is cleared!
            this.stopTimer();

            // Bonus points for time remaining
            const timeBonus = this.timeLeft * 5;
            this.score += timeBonus;
            window.particleSystem.addFloatingText(`+${timeBonus} TIME BONUS!`, this.width / 2, this.height / 2, '#00E676', 26);
            this.updateHUD();

            if (this.currentLevelIndex < window.LEVEL_DATA.length - 1) {
                // Next level available
                this.state = 'LEVEL_CLEAR';
                window.sounds.playLevelClear();
                window.particleSystem.createConfetti(this.width, 60);

                const nextData = window.LEVEL_DATA[this.currentLevelIndex + 1];
                if (this.ui.levelClearNextName) {
                    this.ui.levelClearNextName.textContent = `Next: ${nextData.title}`;
                }
                this.showScreen(this.ui.levelClearScreen);
            } else {
                // Beat the entire game!
                this.gameWin();
            }
        }
    }

    nextLevel() {
        this.showScreen(null);
        this.currentLevelIndex++;
        this.loadLevel(this.currentLevelIndex);
        this.state = 'PLAYING';
        this.startTimer();
    }

    gameWin() {
        this.state = 'WIN';
        this.stopTimer();
        window.sounds.stopBGM();
        window.sounds.playVictory();
        window.particleSystem.createConfetti(this.width, 140);

        if (this.ui.finalScoreWin) {
            this.ui.finalScoreWin.textContent = `${this.score} Points!`;
        }
        if (this.ui.winTimeLeft) {
            this.ui.winTimeLeft.textContent = `${this.timeLeft}s left on final stage`;
        }

        // Stars award based on score
        if (this.ui.starsRating) {
            let stars = '⭐⭐⭐';
            if (this.score < 400) stars = '⭐';
            else if (this.score < 600) stars = '⭐⭐';
            this.ui.starsRating.textContent = stars;
        }

        this.showScreen(this.ui.winScreen);
    }

    update() {
        if (this.state !== 'PLAYING') {
            window.particleSystem.update();
            return;
        }

        // Update player
        this.player.update(this.keys, this.width, this.height, this.obstacles);

        // Update obstacles
        for (const obs of this.obstacles) {
            obs.update();

            // Collision with lethal obstacles (spikes, moving hazard bars)
            if (obs.type === 'spike' || obs.type === 'hazardBar') {
                const nearestX = Math.max(obs.x, Math.min(this.player.x, obs.x + obs.w));
                const nearestY = Math.max(obs.y, Math.min(this.player.y, obs.y + obs.h));
                const distSq = (this.player.x - nearestX) ** 2 + (this.player.y - nearestY) ** 2;
                if (distSq < (this.player.radius * 0.8) ** 2) {
                    this.handlePlayerHit();
                }
            }
        }

        // Update collectibles (Coins)
        for (const coin of this.coins) {
            if (!coin.collected) {
                coin.update();
                const dist = Math.hypot(this.player.x - coin.x, this.player.y - coin.y);
                if (dist < this.player.radius + coin.radius) {
                    coin.collected = true;
                    this.score += coin.points;
                    this.updateHUD();
                    window.sounds.playCoin();
                    window.particleSystem.createCoinSparkles(coin.x, coin.y, '#FFD700', 10);
                    window.particleSystem.addFloatingText(`+${coin.points}`, coin.x, coin.y - 10, '#FFD700', 18);
                    this.checkLevelCompletion();
                }
            }
        }

        // Update bonus Gems
        for (const gem of this.gems) {
            if (!gem.collected) {
                gem.update();
                const dist = Math.hypot(this.player.x - gem.x, this.player.y - gem.y);
                if (dist < this.player.radius + gem.radius) {
                    gem.collected = true;
                    this.score += gem.points;
                    this.updateHUD();
                    window.sounds.playGem();
                    window.particleSystem.createCoinSparkles(gem.x, gem.y, '#FF4081', 18);
                    window.particleSystem.addFloatingText(`+${gem.points} GEM!`, gem.x, gem.y - 12, '#FF4081', 22);
                    window.particleSystem.shake(5, 8);
                }
            }
        }

        // Update enemies
        for (const enemy of this.enemies) {
            enemy.update(this.player, this.obstacles, this.width, this.height);

            // Collision with enemy
            const dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
            if (dist < this.player.radius + enemy.radius - 4) {
                this.handlePlayerHit();
            }
        }

        // Update clouds parallax
        for (const cloud of this.clouds) {
            cloud.x += cloud.speed;
            if (cloud.x - cloud.size * 2 > this.width) {
                cloud.x = -cloud.size * 2;
            }
        }

        // Update visual particles
        window.particleSystem.update();
    }

    draw() {
        const shake = window.particleSystem.getShakeOffset();
        this.ctx.save();
        this.ctx.translate(shake.x, shake.y);

        // Draw dynamic background for current level
        this.drawBackground();

        // Draw obstacles (walls, spikes, hazard bars)
        for (const obs of this.obstacles) {
            obs.draw(this.ctx);
        }

        // Draw Collectibles
        for (const coin of this.coins) {
            coin.draw(this.ctx);
        }
        for (const gem of this.gems) {
            gem.draw(this.ctx);
        }

        // Draw Enemies
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        // Draw Player
        this.player.draw(this.ctx);

        // Draw Particles & Floating Scores
        window.particleSystem.draw(this.ctx);

        // Arena border with cartoon outline
        this.drawArenaBorder();

        this.ctx.restore();
    }

    drawBackground() {
        const theme = this.level ? this.level.theme : {
            bgGradient: ['#E0F7FA', '#80DEEA', '#A5D6A7'],
            groundColor: '#81C784',
            hillColor: '#66BB6A',
            cloudColor: 'rgba(255, 255, 255, 0.85)'
        };

        // Sky gradient
        const sky = this.ctx.createLinearGradient(0, 0, 0, this.height);
        sky.addColorStop(0, theme.bgGradient[0]);
        sky.addColorStop(0.5, theme.bgGradient[1]);
        sky.addColorStop(1, theme.bgGradient[2] || theme.bgGradient[1]);
        this.ctx.fillStyle = sky;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Fluffy cartoon clouds
        this.ctx.fillStyle = theme.cloudColor;
        for (const cloud of this.clouds) {
            this.drawCartoonCloud(cloud.x, cloud.y, cloud.size);
        }

        // Soft rolling hills in background
        this.ctx.fillStyle = theme.hillColor;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);
        this.ctx.quadraticCurveTo(this.width * 0.25, this.height - 90, this.width * 0.5, this.height - 40);
        this.ctx.quadraticCurveTo(this.width * 0.75, this.height + 10, this.width, this.height - 60);
        this.ctx.lineTo(this.width, this.height);
        this.ctx.closePath();
        this.ctx.fill();

        // Ground pattern grid/tiles (subtle cartoon tiles)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        this.ctx.lineWidth = 1;
        const tileSize = 48;
        for (let x = 0; x < this.width; x += tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += tileSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    drawCartoonCloud(x, y, s) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, s * 0.5, 0, Math.PI * 2);
        this.ctx.arc(x + s * 0.35, y - s * 0.2, s * 0.45, 0, Math.PI * 2);
        this.ctx.arc(x + s * 0.7, y, s * 0.4, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawArenaBorder() {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        this.ctx.lineWidth = 6;
        this.ctx.strokeRect(3, 3, this.width - 6, this.height - 6);

        // Highlight inner border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(6, 6, this.width - 12, this.height - 12);
    }

    gameLoop(timestamp) {
        this.update();
        this.draw();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Bootstrap when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.game = new CoinCollectorGame();
});
