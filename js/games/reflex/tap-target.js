import { Game } from '../../game-interface.js';

export default class TapTargetGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.score = 0;
        this.lives = 3;
        this.activeTarget = null;
        this.spawnTimer = null;
        this.gameArea = { width: 0, height: 0 };
    }

    init() {
        this.container.innerHTML = `
            <div class="tt-container">
                <div class="tt-stats">
                    <div>Score: <span id="tt-score">0</span></div>
                    <div>Lives: <span id="tt-lives">3</span></div>
                </div>
                <div id="tt-area" class="tt-area">
                    <div id="tt-msg">Click Start</div>
                </div>
            </div>
            <style>
                .tt-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; width: 100%; height: 100%; }
                .tt-stats { display: flex; justify-content: space-between; width: 100%; max-width: 500px; font-size: 1.5rem; color: var(--accent); }
                .tt-area {
                    width: 100%; height: 400px; background: rgba(255,255,255,0.05);
                    border: 2px solid var(--glass-border); border-radius: 12px;
                    position: relative; overflow: hidden; cursor: crosshair;
                    display: flex; justify-content: center; align-items: center;
                }
                .tt-target {
                    position: absolute; border-radius: 50%;
                    background: radial-gradient(circle at 30% 30%, var(--primary), var(--secondary));
                    box-shadow: 0 0 15px var(--primary);
                    cursor: pointer; transition: transform 0.1s;
                    animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .tt-target:active { transform: scale(0.9); }
                @keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }
                @keyframes shrink { from { transform: scale(1); } to { transform: scale(0); } }
                
                #tt-msg { font-size: 2rem; color: var(--text-muted); pointer-events: none; }
            </style>
        `;

        this.ui = {
            area: this.container.querySelector('#tt-area'),
            score: this.container.querySelector('#tt-score'),
            lives: this.container.querySelector('#tt-lives'),
            msg: this.container.querySelector('#tt-msg')
        };

        // Handle misses (clicking background)
        this.ui.area.addEventListener('mousedown', (e) => {
            if (e.target === this.ui.area && this.isPlaying) {
                this.loseLife();
            }
        });
    }

    start() {
        super.start();
        this.score = 0;
        this.lives = 3;
        this.updateScore(0);
        this.ui.lives.textContent = 3;
        this.ui.msg.style.display = 'none';

        // Cache dimensions
        const rect = this.ui.area.getBoundingClientRect();
        this.gameArea = { width: rect.width, height: rect.height };

        this.spawnTarget();
    }

    stop() {
        super.stop();
        clearTimeout(this.spawnTimer);
        this.clearTarget();
    }

    spawnTarget() {
        if (!this.isPlaying) return;

        this.clearTarget();

        const size = this.config.difficulty === 'easy' ? 60 : this.config.difficulty === 'medium' ? 45 : 30;
        const duration = this.config.difficulty === 'easy' ? 2000 : this.config.difficulty === 'medium' ? 1500 : 1000;

        const maxX = this.gameArea.width - size;
        const maxY = this.gameArea.height - size;

        const x = Math.floor(Math.random() * maxX);
        const y = Math.floor(Math.random() * maxY);

        const target = document.createElement('div');
        target.className = 'tt-target';
        target.style.width = `${size}px`;
        target.style.height = `${size}px`;
        target.style.left = `${x}px`;
        target.style.top = `${y}px`;

        // Shrink animation for timer visualization? Or just disappear.
        // Let's do simple disappear timeout.

        target.onmousedown = (e) => {
            e.stopPropagation(); // Prevent background click
            this.hitTarget(target);
        };
        // Touch support
        target.ontouchstart = (e) => {
            e.stopPropagation(); e.preventDefault();
            this.hitTarget(target);
        };

        this.ui.area.appendChild(target);
        this.activeTarget = target;

        this.spawnTimer = setTimeout(() => {
            if (this.gameArea && this.activeTarget === target) {
                this.loseLife();
                this.spawnTarget();
            }
        }, duration);
    }

    clearTarget() {
        if (this.activeTarget) {
            this.activeTarget.remove();
            this.activeTarget = null;
        }
    }

    hitTarget(target) {
        if (!this.isPlaying) return;
        clearTimeout(this.spawnTimer);

        this.score += 100;
        this.updateScore(this.score);
        this.ui.score.textContent = this.score;

        target.style.transform = 'scale(1.5)';
        target.style.opacity = '0';
        setTimeout(() => target.remove(), 100);

        this.activeTarget = null;

        // Instant respawn or slight delay?
        setTimeout(() => this.spawnTarget(), 200);
    }

    loseLife() {
        this.lives--;
        this.ui.lives.textContent = this.lives;

        // Visual feedback
        this.ui.area.style.background = 'rgba(239, 68, 68, 0.2)';
        setTimeout(() => this.ui.area.style.background = 'rgba(255,255,255,0.05)', 200);

        if (this.lives <= 0) {
            this.gameOver({ score: this.score, won: true }); // Game over naturally
        }
    }
}
