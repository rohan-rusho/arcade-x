import { Game } from '../../game-interface.js';

export default class PatternRecallGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.gridSize = 3; // 3x3 to start
        this.pattern = [];
        this.playerPattern = [];
        this.level = 1;
        this.isShowing = false;
    }

    init() {
        this.container.innerHTML = `
            <div class="pr-container">
                <div class="pr-stats">
                    <div>Level: <span id="pr-level">1</span></div>
                    <div>Score: <span id="pr-score">0</span></div>
                </div>
                <div id="pr-message" class="pr-message">Watch the pattern...</div>
                <div id="pr-grid" class="pr-grid"></div>
            </div>
            <style>
                .pr-container { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; width: 100%; max-width: 400px; margin: 0 auto; }
                .pr-stats { display: flex; justify-content: space-between; width: 100%; font-size: 1.2rem; color: var(--accent); }
                .pr-message { font-size: 1.1rem; color: var(--text-muted); min-height: 24px; }
                .pr-grid { 
                    display: grid; gap: 10px; 
                    background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px;
                }
                .pr-cell { 
                    width: 70px; height: 70px; 
                    background: rgba(255,255,255,0.1); border-radius: 8px; 
                    cursor: pointer; transition: all 0.2s;
                }
                .pr-cell:hover { background: rgba(255,255,255,0.15); }
                .pr-cell.active { background: var(--primary); box-shadow: 0 0 15px var(--primary-glow); transform: scale(0.95); }
                .pr-cell.correct { background: var(--success); }
                .pr-cell.wrong { background: var(--danger); animation: shake 0.4s; }
            </style>
        `;

        this.ui = {
            grid: this.container.querySelector('#pr-grid'),
            level: this.container.querySelector('#pr-level'),
            score: this.container.querySelector('#pr-score'),
            message: this.container.querySelector('#pr-message')
        };
    }

    start() {
        super.start();
        this.level = 1;
        this.score = 0;
        this.updateScore(0);
        this.nextLevel();
    }

    nextLevel() {
        this.playerPattern = [];
        this.ui.level.textContent = this.level;
        this.ui.message.textContent = 'Watch the pattern...';

        // Config based on difficulty
        const diff = this.config.difficulty;
        let size = 3;
        let count = 3;

        if (diff === 'easy') { size = 3; count = 2 + this.level; }
        else if (diff === 'medium') { size = 4; count = 3 + this.level; }
        else { size = 5; count = 4 + this.level; }

        // Cap count
        count = Math.min(count, size * size);
        this.gridSize = size;

        this.renderGrid(size);
        this.generatePattern(size, count);

        // Delay before showing
        setTimeout(() => this.showPattern(), 1000);
    }

    renderGrid(size) {
        this.ui.grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        this.ui.grid.innerHTML = '';
        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement('div');
            cell.className = 'pr-cell';
            cell.dataset.index = i;
            cell.onclick = () => this.handleInput(i, cell);
            this.ui.grid.appendChild(cell);
        }
    }

    generatePattern(size, count) {
        const total = size * size;
        const indices = Array.from({ length: total }, (_, i) => i);
        this.pattern = indices.sort(() => 0.5 - Math.random()).slice(0, count);
    }

    showPattern() {
        this.isShowing = true;
        this.ui.grid.style.pointerEvents = 'none';

        this.pattern.forEach((index, i) => {
            setTimeout(() => {
                const cell = this.ui.grid.children[index];
                cell.classList.add('active');
            }, 500); // Show all simultaneously? Or sequential? 
            // Required "Pattern Recall" usually means simultaneous static pattern.
            // "Simon" is sequential. 
            // Let's do Simultaneous for "Recall".
        });

        // Hide after delay
        setTimeout(() => {
            this.pattern.forEach(index => {
                this.ui.grid.children[index].classList.remove('active');
            });
            this.isShowing = false;
            this.ui.grid.style.pointerEvents = 'auto';
            this.ui.message.textContent = 'Repeat the pattern!';
        }, 500 + 1500); // Show for 1.5s
    }

    handleInput(index, cell) {
        if (this.isShowing) return;
        if (this.playerPattern.includes(index)) return;

        this.playerPattern.push(index);

        if (this.pattern.includes(index)) {
            cell.classList.add('active'); // Keep it lit

            if (this.playerPattern.length === this.pattern.length) {
                // Determine if correct set (order doesn't matter for set recall)
                this.levelComplete();
            }
        } else {
            cell.classList.add('wrong');
            this.gameOver({ score: this.score, won: false });
        }
    }

    levelComplete() {
        this.ui.grid.style.pointerEvents = 'none';
        this.ui.message.textContent = 'Correct!';
        this.updateScore(this.score + (this.level * 100));

        setTimeout(() => {
            this.level++;
            this.nextLevel();
        }, 1000);
    }
}
