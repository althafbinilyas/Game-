/**
 * Audio Manager for Coin Collector Game
 * Uses Web Audio API for 100% offline, zero-dependency procedural sound effects and music.
 */

class SoundController {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.bgmOscillators = [];
        this.bgmInterval = null;
        this.bgmStep = 0;
        this.masterVolume = 0.3;
        this.isInitialized = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.isInitialized = true;
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, startVol = 0.3, endVol = 0.001, pitchSlide = null) {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            const now = this.ctx.currentTime;
            osc.frequency.setValueAtTime(freq, now);
            if (pitchSlide) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(20, pitchSlide), now + duration);
            }

            gain.gain.setValueAtTime(startVol * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(endVol, now + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {
            console.warn("Audio playback error:", e);
        }
    }

    // Play sweet cartoon coin pickup
    playCoin() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [988, 1319]; // B5 -> E6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);

            gain.gain.setValueAtTime(0, now + idx * 0.07);
            gain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, now + idx * 0.07 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 0.23);
        });
    }

    // Bonus Star / Gem pickup
    playGem() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523, 659, 784, 1046, 1318]; // C5, E5, G5, C6, E6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);

            gain.gain.setValueAtTime(0.3 * this.masterVolume, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.26);
        });
    }

    // Player hurt / collision with enemy
    playHurt() {
        if (!this.soundEnabled) return;
        this.playTone(180, 'sawtooth', 0.25, 0.4, 0.01, 50);
    }

    // Player jump or speed bounce
    playJump() {
        if (!this.soundEnabled) return;
        this.playTone(220, 'sine', 0.15, 0.25, 0.01, 550);
    }

    // Level Completed fanfare
    playLevelClear() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const melody = [
            { f: 523.25, d: 0.12, t: 0 },
            { f: 659.25, d: 0.12, t: 0.12 },
            { f: 783.99, d: 0.14, t: 0.24 },
            { f: 1046.50, d: 0.45, t: 0.40 }
        ];

        melody.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, now + note.t);

            gain.gain.setValueAtTime(0.35 * this.masterVolume, now + note.t);
            gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + note.t);
            osc.stop(now + note.t + note.d);
        });
    }

    // Victory song when beating all 3 levels
    playVictory() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const song = [
            { f: 523.25, t: 0, d: 0.12 },
            { f: 523.25, t: 0.14, d: 0.12 },
            { f: 523.25, t: 0.28, d: 0.12 },
            { f: 659.25, t: 0.42, d: 0.22 },
            { f: 783.99, t: 0.66, d: 0.2 },
            { f: 1046.50, t: 0.88, d: 0.55 }
        ];

        song.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.f, now + note.t);
            gain.gain.setValueAtTime(0.4 * this.masterVolume, now + note.t);
            gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + note.t);
            osc.stop(now + note.t + note.d);
        });
    }

    // Game Over sound
    playGameOver() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [
            { f: 392.00, t: 0, d: 0.25 },     // G4
            { f: 369.99, t: 0.26, d: 0.25 },  // F#4
            { f: 349.23, t: 0.52, d: 0.25 },  // F4
            { f: 311.13, t: 0.78, d: 0.6 }    // Eb4
        ];

        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(note.f, now + note.t);
            gain.gain.setValueAtTime(0.3 * this.masterVolume, now + note.t);
            gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + note.t);
            osc.stop(now + note.t + note.d);
        });
    }

    // UI button click
    playClick() {
        this.playTone(800, 'sine', 0.05, 0.2, 0.01, 1200);
    }

    // Timer low tick
    playTick() {
        this.playTone(1000, 'triangle', 0.04, 0.15, 0.01);
    }

    // Light background music synthesizer (cheerful 8-bar loop)
    startBGM() {
        if (!this.musicEnabled || this.bgmInterval) return;
        this.init();
        if (!this.ctx) return;

        const bassNotes = [261.63, 261.63, 329.63, 392.00, 349.23, 349.23, 392.00, 440.00];
        const leadNotes = [523.25, 659.25, 783.99, 659.25, 698.46, 783.99, 880.00, 1046.50];

        this.bgmStep = 0;
        this.bgmInterval = setInterval(() => {
            if (!this.musicEnabled || !this.ctx || this.ctx.state === 'suspended') return;
            const now = this.ctx.currentTime;
            const bass = bassNotes[this.bgmStep % bassNotes.length];
            const lead = leadNotes[(this.bgmStep + 2) % leadNotes.length];

            // Bass note
            const bOsc = this.ctx.createOscillator();
            const bGain = this.ctx.createGain();
            bOsc.type = 'triangle';
            bOsc.frequency.setValueAtTime(bass / 2, now);
            bGain.gain.setValueAtTime(0.12 * this.masterVolume, now);
            bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            bOsc.connect(bGain);
            bGain.connect(this.ctx.destination);
            bOsc.start(now);
            bOsc.stop(now + 0.23);

            // Lead note
            if (this.bgmStep % 2 === 0) {
                const lOsc = this.ctx.createOscillator();
                const lGain = this.ctx.createGain();
                lOsc.type = 'sine';
                lOsc.frequency.setValueAtTime(lead, now);
                lGain.gain.setValueAtTime(0.08 * this.masterVolume, now);
                lGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                lOsc.connect(lGain);
                lGain.connect(this.ctx.destination);
                lOsc.start(now);
                lOsc.stop(now + 0.19);
            }

            this.bgmStep++;
        }, 250); // 120 BPM 8th notes
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.startBGM();
        } else {
            this.stopBGM();
        }
        return this.musicEnabled;
    }
}

// Global sound manager instance
window.sounds = new SoundController();
