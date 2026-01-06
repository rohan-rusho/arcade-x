import { Game } from '../../game-interface.js';

export default class WhackATileGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.score = 0;
        this.timeLeft = 60;
        this.timer = null;
        this.spawnTimer = null;
        this.activeTile = null;
        this.speed = 1000;
    }

    init() {
        this.container.innerHTML = `
            <div class="wt-container">
                <div class="wt-stats">
                    <div>Time: <span id="wt-time">60</span>s</div>
                    <div>Score: <span id="wt-score">0</span></div>
                </div>
                <div id="wt-grid" class="wt-grid"></div>
            </div>
            <style>
                .wt-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                .wt-stats { display: flex; justify-content: space-between; width: 100%; font-size: 1.5rem; color: var(--accent); }
                .wt-grid { 
                    display: grid; grid-template-columns: repeat(3, 100px); grid-template-rows: repeat(3, 100px); gap: 10px;
                    background: var(--glass-border); padding: 10px; border-radius: 12px;
                }
                .wt-tile {
                    width: 100px; height: 100px; background: rgba(255,255,255,0.1);
                    border-radius: 8px; cursor: pointer; transition: all 0.1s;
                    position: relative; overflow: hidden;
                }
                .wt-tile:active { transform: scale(0.95); }
                .wt-tile.active { background: var(--secondary); box-shadow: 0 0 20px var(--secondary); }
                .wt-tile.active::after {
                    content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(255,255,255,0.5); opacity: 0;
                    animation: flash 0.2s;
                }
                @keyframes flash { 50% { opacity: 1; } }
            </style>
        `;

        this.ui = {
            grid: this.container.querySelector('#wt-grid'),
            time: this.container.querySelector('#wt-time'),
            score: this.container.querySelector('#wt-score')
        };

        this.renderGrid();
    }

    renderGrid() {
        this.ui.grid.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const el = document.createElement('div');
            el.className = 'wt-tile';
            el.dataset.index = i;
            el.onmousedown = () => this.handleHit(i, el);
            // Touch support
            el.ontouchstart = (e) => { e.preventDefault(); this.handleHit(i, el); };
            this.ui.grid.appendChild(el);
        }
    }

    start() {
        super.start();
        this.score = 0;
        this.timeLeft = 30; // 30s for quick fun
        this.updateScore(0);
        this.ui.time.textContent = this.timeLeft;

        // Difficulty speed
        if (this.config.difficulty === 'easy') this.speed = 1000;
        else if (this.config.difficulty === 'medium') this.speed = 700;
        else this.speed = 500;

        this.startTimer();
        this.spawnNext();
    }

    stop() {
        super.stop();
        clearInterval(this.timer);
        clearTimeout(this.spawnTimer);
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.ui.time.textContent = this.timeLeft;
            if (this.timeLeft <= 0) {
                this.finish();
            }
        }, 1000);
    }

    spawnNext() {
        if (!this.isPlaying) return;

        // Clear prev
        if (this.activeTile !== null) {
            const prev = this.ui.grid.children[this.activeTile];
            if (prev) prev.classList.remove('active');
        }

        // Pick new
        let next;
        do {
            next = Math.floor(Math.random() * 9);
        } while (next === this.activeTile);

        this.activeTile = next;
        const el = this.ui.grid.children[next];
        el.classList.add('active');

        // Schedule next spawn (auto miss logic if desired? or just fixed intervals?)
        // Fixed intervals for simplicity, but harder if it moves faster?
        // Let's speed up slightly every 5 hits?

        this.spawnTimer = setTimeout(() => {
            if (this.isPlaying) this.spawnNext();
        }, this.speed);
    }

    handleHit(index, el) {
        if (!this.isPlaying || index !== this.activeTile) return;

        // Hit!
        this.score += 10;
        this.updateScore(this.score);
        this.ui.score.textContent = this.score;

        el.classList.remove('active');
        this.activeTile = null;

        // Reset timer to spawn immediately
        clearTimeout(this.spawnTimer);

        // Speed up?
        if (this.score % 50 === 0 && this.speed > 300) {
            this.speed -= 50;
        }

        // Small delay before next to allow visual feedback of hit? 
        // Or instant? Instant is more arcade-y.
        setTimeout(() => this.spawnNext(), 100);
    }

    finish() {
        clearInterval(this.timer);
        clearTimeout(this.spawnTimer);
        this.gameOver({ score: this.score, won: true });
    }
}
