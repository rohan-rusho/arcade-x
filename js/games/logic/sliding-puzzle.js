import { Game } from '../../game-interface.js';

export default class SlidingPuzzleGame extends Game {
    constructor(id, container, config) {
        super(id, container, config);
        this.size = 3;
        this.tiles = []; // Array of { val, correctIndex, currentIndex }
        this.moves = 0;
    }

    init() {
        this.container.innerHTML = `
            <div class="sp-container">
                <div class="sp-info">Moves: <span id="sp-moves">0</span></div>
                <div class="game-area">
                    <div id="sp-grid-container" class="sp-grid-container"></div>
                </div>
            </div>
            <style>
                .sp-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
                .sp-info { font-size: 1.2rem; color: var(--accent); }
                .game-area {
                    background: rgba(255,255,255,0.05);
                    padding: 5px; border-radius: 8px;
                    display: inline-block;
                }
                .sp-grid-container { 
                    position: relative;
                    /* Width/Height set dynamically in JS */
                }
                .sp-tile {
                    position: absolute;
                    background: rgba(255,255,255,0.15); border-radius: 6px;
                    display: flex; justify-content: center; align-items: center;
                    font-size: 1.5rem; font-weight: bold; cursor: pointer;
                    width: 70px; height: 70px;
                    transition: transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
                    user-select: none;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                }
                .sp-tile:hover { background: rgba(255,255,255,0.25); z-index: 10; transform: scale(1.05); } 
                /* Note: hover scale might conflict with translate. Better NOT to scale on hover for absolute pos. */
                .sp-tile:hover { background: rgba(255,255,255,0.25); z-index: 10; } 
                
                .sp-tile.correct { color: var(--success); border: 2px solid var(--success); }
                .sp-tile.empty { display: none; }
            </style>
        `;

        this.ui = {
            grid: this.container.querySelector('#sp-grid-container'),
            moves: this.container.querySelector('#sp-moves')
        };
    }

    start() {
        super.start();
        this.moves = 0;
        this.ui.moves.textContent = '0';

        if (this.config.difficulty === 'easy') this.size = 3;
        else if (this.config.difficulty === 'medium') this.size = 4;
        else this.size = 5;

        // Set container size
        const tileSize = 75; // 70 + 5 gap
        const totalSize = this.size * tileSize;
        this.ui.grid.style.width = `${totalSize}px`;
        this.ui.grid.style.height = `${totalSize}px`;

        this.generateBoard();
        this.render();
    }

    generateBoard() {
        // Create tiles
        this.tiles = Array.from({ length: this.size * this.size }, (_, i) => ({
            val: i + 1,
            correctIndex: i, // 0-based
            currentIndex: i
        }));

        // Last one is empty
        this.tiles[this.tiles.length - 1].val = 0; // 0 represents empty

        // Shuffle
        let shuffles = this.size === 3 ? 100 : 300;
        let emptyIdx = this.size * this.size - 1;
        let lastMove = -1;

        for (let i = 0; i < shuffles; i++) {
            const neighbors = this.getNeighbors(emptyIdx);
            const valid = neighbors.filter(n => n !== lastMove);
            const move = valid[Math.floor(Math.random() * valid.length)];

            // Swap in data
            this.swapData(emptyIdx, move);
            emptyIdx = move;
            lastMove = emptyIdx;
        }
    }

    swapData(idx1, idx2) {
        // idx1/idx2 are POSITIONS in the grid (0..15)
        // We need to find which TILE is at that position
        const tile1 = this.tiles.find(t => t.currentIndex === idx1);
        const tile2 = this.tiles.find(t => t.currentIndex === idx2);

        tile1.currentIndex = idx2;
        tile2.currentIndex = idx1;
    }

    getNeighbors(idx) {
        const neighbors = [];
        const row = Math.floor(idx / this.size);
        const col = idx % this.size;

        if (row > 0) neighbors.push(idx - this.size);
        if (row < this.size - 1) neighbors.push(idx + this.size);
        if (col > 0) neighbors.push(idx - 1);
        if (col < this.size - 1) neighbors.push(idx + 1);

        return neighbors;
    }

    render() {
        this.ui.grid.innerHTML = '';

        this.tiles.forEach(tile => {
            if (tile.val === 0) return; // Don't render empty

            const el = document.createElement('div');
            el.className = `sp-tile ${tile.currentIndex === tile.correctIndex ? 'correct' : ''}`;
            el.textContent = tile.val;

            // Calc position
            this.updateElementPosition(el, tile.currentIndex);

            el.onclick = () => this.handleInput(tile);
            this.ui.grid.appendChild(el);

            // Store ref for easy update
            tile.element = el;
        });
    }

    updateElementPosition(el, index) {
        const row = Math.floor(index / this.size);
        const col = index % this.size;
        const size = 75; // 70px + 5px gap

        el.style.transform = `translate(${col * size}px, ${row * size}px)`;

        // Update class if correct
        // Find the tile object associated... passed in?
    }

    handleInput(clickedTile) {
        if (!this.isPlaying) return;

        const emptyTile = this.tiles.find(t => t.val === 0);
        const neighbors = this.getNeighbors(emptyTile.currentIndex);

        if (neighbors.includes(clickedTile.currentIndex)) {
            // Valid move
            const oldIndex = clickedTile.currentIndex;
            const newIndex = emptyTile.currentIndex;

            // Swap Logic
            clickedTile.currentIndex = newIndex;
            emptyTile.currentIndex = oldIndex;

            // Animate
            this.updateElementPosition(clickedTile.element, clickedTile.currentIndex);

            // Update correctness
            if (clickedTile.currentIndex === clickedTile.correctIndex) {
                clickedTile.element.classList.add('correct');
            } else {
                clickedTile.element.classList.remove('correct');
            }

            this.moves++;
            this.ui.moves.textContent = this.moves;

            if (this.checkWin()) {
                const score = Math.max(0, 1000 - this.moves * 2);
                setTimeout(() => this.gameOver({ score: score, won: true }), 500);
            }
        }
    }

    checkWin() {
        return this.tiles.every(t => t.currentIndex === t.correctIndex);
    }
}
